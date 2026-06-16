#!/usr/bin/env node
/**
 * Build public/app.js from site-src/*.js (see manifest.json).
 * Run: node tools/build-site-app.mjs
 */
import fs from "fs";
import path from "path";
import crypto from "crypto";

const root = process.cwd();
const srcDir = path.join(root, "site-src");
const manifestPath = path.join(srcDir, "manifest.json");
const outPath = path.join(root, "public/app.js");

if (!fs.existsSync(manifestPath)) {
  console.error("site-src/manifest.json missing — run: node tools/split-site-app.mjs");
  process.exit(1);
}

const { parts } = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
const chunks = parts.map((name) => {
  const file = path.join(srcDir, name);
  if (!fs.existsSync(file)) throw new Error(`missing part: ${name}`);
  return fs.readFileSync(file, "utf8");
});

let out = chunks.join("\n");
if (!out.trimEnd().endsWith("})();")) {
  throw new Error("built output must end with })();");
}
if (!out.startsWith("(async () =>")) {
  throw new Error("built output must start with (async () => {");
}

const prev = fs.existsSync(outPath) ? fs.readFileSync(outPath, "utf8") : "";
if (prev !== out) {
  fs.writeFileSync(outPath, out);
  console.log(`built ${outPath} (${parts.length} parts, sha1=${crypto.createHash("sha1").update(out).digest("hex").slice(0, 8)})`);
} else {
  console.log(`unchanged ${outPath}`);
}
