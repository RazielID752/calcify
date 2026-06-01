#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const releaseBranches = new Set(["main", "master"]);
const releaseFiles = new Set(["package.json", "app/config/release.json"]);
const isDryRun = process.argv.includes("--dry-run");

const run = (command, args) =>
  spawnSync(command, args, {
    cwd: rootDir,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });

const getCurrentBranch = () => {
  const result = run("git", ["rev-parse", "--abbrev-ref", "HEAD"]);

  if (result.status !== 0) {
    return null;
  }

  return result.stdout.trim();
};

const branch = getCurrentBranch();

if (!branch || !releaseBranches.has(branch)) {
  process.exit(0);
}

const stagedFilesResult = run("git", ["diff", "--cached", "--name-only"]);

if (stagedFilesResult.status !== 0) {
  process.exit(stagedFilesResult.status ?? 1);
}

const stagedFiles = stagedFilesResult.stdout
  .split("\n")
  .map((filePath) => filePath.trim())
  .filter(Boolean);

const hasManualRelease = stagedFiles.some((filePath) =>
  releaseFiles.has(filePath),
);

if (hasManualRelease) {
  process.exit(0);
}

const releaseResult = spawnSync(
  process.execPath,
  ["scripts/create-release.mjs", "patch", ...(isDryRun ? ["--dry-run"] : [])],
  {
    cwd: rootDir,
    stdio: "inherit",
  },
);

if (releaseResult.status !== 0) {
  process.exit(releaseResult.status ?? 1);
}

if (isDryRun) {
  process.exit(0);
}

const addResult = spawnSync(
  "git",
  ["add", "package.json", "app/config/release.json"],
  {
    cwd: rootDir,
    stdio: "inherit",
  },
);

process.exit(addResult.status ?? 1);
