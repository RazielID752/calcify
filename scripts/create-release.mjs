#!/usr/bin/env node

import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const releaseTypes = new Set(["patch", "minor", "major"]);
const args = process.argv.slice(2);
const releaseType = args.find((arg) => releaseTypes.has(arg)) ?? "patch";
const isDryRun = args.includes("--dry-run");
const channelArg = args.find((arg) => arg.startsWith("--channel="));
const notesArg = args.find((arg) => arg.startsWith("--notes-url="));
const channel = channelArg?.split("=")[1]?.trim() || "stable";
const notesUrl = notesArg?.split("=").slice(1).join("=").trim() || null;

const rootDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const packagePath = path.join(rootDir, "package.json");
const releasePath = path.join(rootDir, "app", "config", "release.json");

const readJson = async (filePath) => {
  const content = await readFile(filePath, "utf8");
  return JSON.parse(content);
};

const bumpVersion = (version, type) => {
  const [major = 0, minor = 0, patch = 0] = version
    .split(".")
    .map((part) => Number.parseInt(part, 10) || 0);

  if (type === "major") {
    return `${major + 1}.0.0`;
  }

  if (type === "minor") {
    return `${major}.${minor + 1}.0`;
  }

  return `${major}.${minor}.${patch + 1}`;
};

const today = new Date().toISOString().slice(0, 10);
const packageJson = await readJson(packagePath);
const releaseJson = await readJson(releasePath);
const previousVersion = packageJson.version;
const nextVersion = bumpVersion(previousVersion, releaseType);

const nextPackageJson = {
  ...packageJson,
  version: nextVersion,
};

const nextReleaseJson = {
  ...releaseJson,
  channel,
  publishedAt: today,
  notesUrl,
};

if (!isDryRun) {
  await writeFile(packagePath, `${JSON.stringify(nextPackageJson, null, 2)}\n`);
  await writeFile(releasePath, `${JSON.stringify(nextReleaseJson, null, 2)}\n`);
}

console.log(
  `Calcify ${previousVersion} -> ${nextVersion} (${releaseType}, ${channel}, ${today})`,
);

if (isDryRun) {
  console.log("Dry run: nenhum arquivo foi alterado.");
}
