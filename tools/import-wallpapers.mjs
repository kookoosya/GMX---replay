#!/usr/bin/env node
/**
 * Import custom wallpapers into assets/wallpapers/custom and optionally assets/extbg/custom.
 *
 * Usage:
 *   node tools/import-wallpapers.mjs [source-dir]
 *
 * If source-dir is omitted, uses ./assets (if it contains images) or ./import-wallpapers (if exists).
 * Copies .png, .jpg, .jpeg, .webp files with names custom_001.png, custom_002.png, etc.
 *
 * To add your wallpapers:
 *   1. Place images in a folder (e.g. my-wallpapers/)
 *   2. Run: node tools/import-wallpapers.mjs my-wallpapers/
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");

const IMAGE_EXT = /\.(png|jpg|jpeg|webp)$/i;

const SITE_DIR = path.join(ROOT, "assets", "wallpapers", "custom");
const EXT_DIR = path.join(ROOT, "assets", "extbg", "custom");

function findImages(dir) {
  if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      files.push(...findImages(full).map((f) => path.join(e.name, f)));
    } else if (IMAGE_EXT.test(e.name)) {
      files.push(e.name);
    }
  }
  return files.sort();
}

function main() {
  const wallpapersImport = path.join(ROOT, "assets", "wallpapers-import");
  let sourceDir = process.argv[2];
  if (!sourceDir) {
    sourceDir = wallpapersImport;
  }
  sourceDir = path.isAbsolute(sourceDir) ? sourceDir : path.join(process.cwd(), sourceDir);

  if (!fs.existsSync(sourceDir) || !fs.statSync(sourceDir).isDirectory()) {
    fs.mkdirSync(sourceDir, { recursive: true });
    console.log("Created folder:", sourceDir);
    console.log("Put your wallpaper images (.png, .jpg, .webp) there and run again.");
    process.exit(0);
  }

  const images = findImages(sourceDir);
  if (!images.length) {
    console.log("No images found in", sourceDir);
    process.exit(0);
  }

  fs.mkdirSync(SITE_DIR, { recursive: true });
  fs.mkdirSync(EXT_DIR, { recursive: true });

  let n = 0;
  for (const img of images) {
    n++;
    const ext = path.extname(img).toLowerCase();
    const destName = `custom_${String(n).padStart(3, "0")}${ext}`;
    const srcPath = path.join(sourceDir, img);
    const siteDest = path.join(SITE_DIR, destName);
    const extDest = path.join(EXT_DIR, destName);
    try {
      fs.copyFileSync(srcPath, siteDest);
      fs.copyFileSync(srcPath, extDest);
      console.log(n, img, "->", destName);
    } catch (err) {
      console.error("Failed:", img, err.message);
    }
  }
  console.log("Done. Imported", n, "wallpapers into assets/wallpapers/custom and assets/extbg/custom.");
}

main();
