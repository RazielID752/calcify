#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const releasePath = path.join(rootDir, "app", "config", "release.json");
const releaseBranches = new Set(["main", "master"]);

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

const releaseJson = JSON.parse(await readFile(releasePath, "utf8"));
const today = new Date().toISOString().slice(0, 10);

if (releaseJson.publishedAt === today) {
  process.exit(0);
}

const releaseResult = spawnSync(
  process.execPath,
  ["scripts/create-release.mjs", "patch"],
  {
    cwd: rootDir,
    stdio: "inherit",
  },
);

if (releaseResult.status !== 0) {
  process.exit(releaseResult.status ?? 1);
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
