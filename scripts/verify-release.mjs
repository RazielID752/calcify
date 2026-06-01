#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

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

const isValidSemver = (value) => /^\d+\.\d+\.\d+$/.test(value);
const today = new Date().toISOString().slice(0, 10);
const isProductionBuild = process.env.VERCEL_ENV === "production";

const packageJson = await readJson(packagePath);
const releaseJson = await readJson(releasePath);

if (!isValidSemver(packageJson.version)) {
  console.error(`Versao invalida no package.json: ${packageJson.version}`);
  process.exit(1);
}

if (!releaseJson.publishedAt) {
  console.error("Release sem data em app/config/release.json.");
  process.exit(1);
}

if (isProductionBuild && releaseJson.publishedAt !== today) {
  console.error(
    [
      "Release de producao nao foi gerada para hoje.",
      `Data atual da release: ${releaseJson.publishedAt}`,
      `Data esperada: ${today}`,
      "Rode pnpm release:patch, pnpm release:minor ou pnpm release:major antes de subir para producao.",
    ].join("\n"),
  );
  process.exit(1);
}

console.log(
  `Release verificada: v${packageJson.version} (${releaseJson.channel}, ${releaseJson.publishedAt})`,
);
