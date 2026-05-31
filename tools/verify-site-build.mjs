#!/usr/bin/env node
/**
 * Ensure public/app.js matches site-src build (prevents chart-wallpaper drift).
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const outPath = path.join(root, "public", "app.js");
const manifestPath = path.join(root, "site-src", "manifest.json");

if (!fs.existsSync(manifestPath)) {
  console.error("verify-site-build: site-src/manifest.json missing");
  process.exit(1);
}

const { parts } = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
const chunks = parts.map((name) => {
  const file = path.join(root, "site-src", name);
  if (!fs.existsSync(file)) throw new Error(`missing part: ${name}`);
  return fs.readFileSync(file, "utf8");
});
const built = chunks.join("\n");
const onDisk = fs.existsSync(outPath) ? fs.readFileSync(outPath, "utf8") : "";

const builtHash = crypto.createHash("sha1").update(built).digest("hex").slice(0, 8);
const diskHash = crypto.createHash("sha1").update(onDisk).digest("hex").slice(0, 8);

if (built !== onDisk) {
  console.error(`verify-site-build FAIL: public/app.js drift (disk=${diskHash} expected=${builtHash})`);
  console.error("Run: npm run build:site");
  process.exit(1);
}

const forbidden = [
  /sitePackWallpaperDataUri/,
  /SITE_WALLPAPER_LUX\s*=/,
  /GM Candle/,
  /function supportBundle\(/,
  /const antiN = 0;/,
];
for (const rx of forbidden) {
  if (rx.test(onDisk)) {
    console.error(`verify-site-build FAIL: forbidden pattern ${rx} in public/app.js`);
    process.exit(1);
  }
}

if (!/const ASSET_REV = "20260531a"/.test(onDisk)) {
  console.warn("verify-site-build WARN: expected ASSET_REV 20260531a");
}

const check = spawnSync(process.execPath, ["--check", outPath], { encoding: "utf8" });
if (check.status !== 0) {
  console.error(check.stderr || check.stdout);
  process.exit(1);
}

console.log(`verify-site-build OK (sha1=${diskHash})`);
