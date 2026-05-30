#!/usr/bin/env node
/**
 * Keep legacy static copies in sync: public/ is canonical for production /arcade.html and /app.
 * frontend/public/ mirrors for Vite dev.
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const root = process.cwd();
const canonicalDir = path.join(root, "public");
const mirrorDir = path.join(root, "frontend", "public");

const FILES = [
  "app.js",
  "app.html",
  "app.css",
  "arcade.js",
  "arcade.html",
  "mode.js",
  "entitlements.js",
  "extension-config.json",
  "themes.json",
];

function sha1(file) {
  return crypto.createHash("sha1").update(fs.readFileSync(file)).digest("hex");
}

let copied = 0;
for (const rel of FILES) {
  const src = path.join(canonicalDir, rel);
  const dest = path.join(mirrorDir, rel);
  if (!fs.existsSync(src)) continue;
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  const same = fs.existsSync(dest) && sha1(src) === sha1(dest);
  if (!same) {
    fs.copyFileSync(src, dest);
    copied += 1;
    console.log(`[sync-legacy-public] ${rel}`);
  }
}
console.log(`[sync-legacy-public] done copied=${copied}`);
