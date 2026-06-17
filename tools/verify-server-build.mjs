#!/usr/bin/env node
/**
 * Ensure index.js matches server-src build (prevents server drift).
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const outPath = path.join(root, "index.js");
const manifestPath = path.join(root, "server-src", "manifest.json");

if (!fs.existsSync(manifestPath)) {
  console.error("verify-server-build: server-src/manifest.json missing");
  process.exit(1);
}

const { parts } = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
const chunks = parts.map((name) => {
  const file = path.join(root, "server-src", name);
  if (!fs.existsSync(file)) throw new Error(`missing part: ${name}`);
  return fs.readFileSync(file, "utf8");
});
const built = chunks.join("\n");
const onDisk = fs.existsSync(outPath) ? fs.readFileSync(outPath, "utf8") : "";

const builtHash = crypto.createHash("sha1").update(built).digest("hex").slice(0, 8);
const diskHash = crypto.createHash("sha1").update(onDisk).digest("hex").slice(0, 8);

if (built !== onDisk) {
  console.error(`verify-server-build FAIL: index.js drift (disk=${diskHash} expected=${builtHash})`);
  console.error("Run: npm run build:server");
  process.exit(1);
}

if (!onDisk.startsWith("import ")) {
  console.error("verify-server-build FAIL: index.js must start with imports");
  process.exit(1);
}

const check = spawnSync(process.execPath, ["--check", outPath], { encoding: "utf8" });
if (check.status !== 0) {
  console.error(check.stderr || check.stdout);
  process.exit(1);
}

console.log(`verify-server-build OK (sha1=${diskHash}, ${parts.length} parts)`);
