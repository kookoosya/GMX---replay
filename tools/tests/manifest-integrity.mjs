#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fail, ok } from "./_helpers.mjs";

const root = process.cwd();

function checkManifest(manifestRel, baseDir) {
  const manifestPath = path.join(root, manifestRel);
  if (!fs.existsSync(manifestPath)) fail(`missing ${manifestRel}`);
  const { parts } = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  if (!Array.isArray(parts) || !parts.length) fail(`${manifestRel}: empty parts`);
  for (const part of parts) {
    const file = path.join(root, baseDir, part);
    if (!fs.existsSync(file)) fail(`${manifestRel} references missing file: ${baseDir}/${part}`);
  }
  ok(`${manifestRel} (${parts.length} parts)`);
}

checkManifest("site-src/manifest.json", "site-src");
checkManifest("server-src/manifest.json", "server-src");

const routeDir = path.join(root, "server/routes");
for (const name of fs.readdirSync(routeDir)) {
  if (!name.endsWith(".mjs")) continue;
  const file = path.join(routeDir, name);
  const text = fs.readFileSync(file, "utf8");
  if (!/export function register/.test(text) && !/export async function register/.test(text)) {
    fail(`server/routes/${name}: missing register* export`);
  }
}
ok(`server/routes (${fs.readdirSync(routeDir).filter((f) => f.endsWith(".mjs")).length} modules)`);
