#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { chmod, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const hooksDir = path.join(rootDir, ".githooks");
const preCommitPath = path.join(hooksDir, "pre-commit");

try {
  await stat(path.join(rootDir, ".git"));
} catch {
  process.exit(0);
}

await chmod(preCommitPath, 0o755);

const result = spawnSync("git", ["config", "core.hooksPath", ".githooks"], {
  cwd: rootDir,
  stdio: "inherit",
});

process.exit(result.status ?? 1);
