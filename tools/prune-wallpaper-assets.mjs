#!/usr/bin/env node
/**
 * Remove stale wallpaper files and keep only active preset assets.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const WP = path.join(ROOT, "assets", "wallpapers");

function rm(filePath) {
  try { fs.unlinkSync(filePath); return true; } catch { return false; }
}

function main() {
  const manifestPath = path.join(WP, "preset-manifest.json");
  if (!fs.existsSync(manifestPath)) {
    console.log("No preset-manifest.json, skip prune.");
    return;
  }
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  const keepRoot = new Set(["preset-manifest.json", "preset-names.json", "custom", "thumbs"]);
  for (const file of Object.values(manifest)) keepRoot.add(file);

  let removed = 0;
  for (const name of fs.readdirSync(WP)) {
    const full = path.join(WP, name);
    const st = fs.statSync(full);
    if (st.isDirectory()) {
      if (!keepRoot.has(name)) {
        fs.rmSync(full, { recursive: true, force: true });
        removed++;
      }
      continue;
    }
    if (!keepRoot.has(name)) {
      if (rm(full)) removed++;
    }
  }

  const thumbsDir = path.join(WP, "thumbs");
  if (fs.existsSync(thumbsDir)) {
    const keepThumbs = new Set(Object.keys(manifest).map((id) => `${id}.jpg`));
    for (const name of fs.readdirSync(thumbsDir)) {
      if (!keepThumbs.has(name)) {
        if (rm(path.join(thumbsDir, name))) removed++;
      }
    }
  }
  console.log("Pruned wallpaper assets. Removed:", removed);
}

main();
