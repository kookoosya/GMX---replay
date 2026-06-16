#!/usr/bin/env node
/**
 * Remove stale wallpaper mirrors under public/ and frontend/public/.
 * Canonical assets live only in /assets (served at /assets).
 */
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const targets = [
  "public/assets/wallpapers",
  "public/assets/extbg",
  "public/bridge/assets/wallpapers",
  "public/bridge/assets/extbg",
  "frontend/public/assets/wallpapers",
  "frontend/public/assets/extbg",
  "assets/wallpapers/v3",
  "assets/wallpapers-import",
];

let removed = 0;
for (const rel of targets) {
  const abs = path.join(root, rel);
  if (!fs.existsSync(abs)) continue;
  fs.rmSync(abs, { recursive: true, force: true });
  removed++;
  console.log(`removed ${rel}`);
}
console.log(`[prune-asset-mirrors] done removed=${removed}`);
