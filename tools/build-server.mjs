#!/usr/bin/env node
/**
 * Build index.js from server-src/*.js
 * Run: node tools/build-server.mjs
 */
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { spawnSync } from "child_process";

const root = process.cwd();
const srcDir = path.join(root, "server-src");
const manifestPath = path.join(srcDir, "manifest.json");
const outPath = path.join(root, "index.js");

if (!fs.existsSync(manifestPath)) {
  console.error("server-src/manifest.json missing — run: node tools/split-server.mjs");
  process.exit(1);
}

const { parts } = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
const chunks = parts.map((name) => {
  const file = path.join(srcDir, name);
  if (!fs.existsSync(file)) throw new Error(`missing part: ${name}`);
  return fs.readFileSync(file, "utf8");
});

const out = chunks.join("\n");
if (!out.startsWith("import ")) throw new Error("built index must start with imports");

const prev = fs.existsSync(outPath) ? fs.readFileSync(outPath, "utf8") : "";
if (prev !== out) {
  fs.writeFileSync(outPath, out);
  console.log(`built ${outPath} (${parts.length} parts, sha1=${crypto.createHash("sha1").update(out).digest("hex").slice(0, 8)})`);
} else {
  console.log(`unchanged ${outPath}`);
}

const check = spawnSync(process.execPath, ["--check", outPath], { encoding: "utf8" });
if (check.status !== 0) {
  console.error(check.stderr || check.stdout);
  process.exit(1);
}
console.log("syntax ok");
