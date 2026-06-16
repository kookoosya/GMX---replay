#!/usr/bin/env node
/**
 * Audit wallpapers in oboi folder: check resolution, file size, select best 60.
 *
 * Usage: node tools/audit-wallpapers.mjs [source-dir]
 *
 * Outputs: tools/wallpaper-selection.json (sorted list of best 160 filenames)
 * Then run: node tools/import-preset-wallpapers.mjs --from-selection
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { imageSizeFromFile } from "image-size/fromFile";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const IMAGE_EXT = /\.(png|jpg|jpeg|webp)$/i;
const DEFAULT_SOURCE = path.join(ROOT, "обои");
const MIN_WIDTH = 1280;
const MIN_HEIGHT = 720;
const MIN_PIXELS = 1280 * 720;
const MAX_FILE_KB = 4000;
const MIN_FILE_KB = 20;

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

function scoreImage(info) {
  const { width, height, sizeKb } = info;
  const pixels = width * height;
  const aspectRatio = width / height;
  const isLandscape = aspectRatio >= 1;

  let score = 0;

  // Resolution: prefer 1920x1080 or higher
  if (width >= 2560 && height >= 1440) score += 40;
  else if (width >= 1920 && height >= 1080) score += 35;
  else if (width >= 1680 && height >= 1050) score += 25;
  else if (width >= 1600 && height >= 900) score += 20;
  else if (width >= 1280 && height >= 720) score += 10;
  else if (width >= 1024 && height >= 768) score += 5;
  else return -1;

  // Landscape preferred for wallpapers
  if (isLandscape) score += 10;
  else if (width >= 1080 && height >= 1920) score += 5;

  // Aspect ratio: 16:9 ideal
  const ratio16_9 = Math.abs(aspectRatio - 16 / 9);
  if (ratio16_9 < 0.1) score += 15;
  else if (ratio16_9 < 0.2) score += 10;
  else if (ratio16_9 < 0.4) score += 5;

  // File size: reasonable = not over-compressed, not huge
  if (sizeKb >= 100 && sizeKb <= 1500) score += 15;
  else if (sizeKb >= 50 && sizeKb <= 2500) score += 10;
  else if (sizeKb >= 20 && sizeKb <= 4000) score += 5;
  else if (sizeKb < 20) score -= 10;

  return score;
}

function inferName(filename) {
  const base = path.basename(filename, path.extname(filename));
  if (/^\d+$/.test(base)) return `Wall ${base}`;
  const clean = base
    .replace(/^\d+[-_]/g, "")
    .replace(/-?\d+x\d+$/i, "")
    .replace(/[-_]+/g, " ")
    .trim();
  const words = clean.split(/\s+/).slice(0, 2);
  return words.map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ") || base;
}

async function main() {
  const sourceDir = process.argv[2] ? path.resolve(process.argv[2]) : DEFAULT_SOURCE;

  if (!fs.existsSync(sourceDir) || !fs.statSync(sourceDir).isDirectory()) {
    console.error("Folder not found:", sourceDir);
    process.exit(1);
  }

  const images = findImages(sourceDir);
  console.log("Found", images.length, "images in", sourceDir);

  const results = [];
  for (const img of images) {
    const srcPath = path.join(sourceDir, img);
    try {
      const dims = await imageSizeFromFile(srcPath);
      const stats = fs.statSync(srcPath);
      const width = dims.width || 0;
      const height = dims.height || 0;
      const sizeKb = Math.round(stats.size / 1024);

      const info = { filename: img, width, height, sizeKb };
      info.score = scoreImage(info);

      if (info.score >= 0) {
        results.push(info);
      } else {
        console.warn("  Skip (low res):", img, `${width}x${height}`);
      }
    } catch (err) {
      console.warn("  Skip (error):", img, err.message);
    }
  }

  results.sort((a, b) => b.score - a.score);

  const selected = results.slice(0, 160).map((r) => r.filename);

  const selectionPath = path.join(__dirname, "wallpaper-selection.json");
  fs.writeFileSync(selectionPath, JSON.stringify(selected, null, 2), "utf8");
  console.log("\nSelected best", selected.length, "->", selectionPath);

  const reportPath = path.join(__dirname, "wallpaper-audit-report.txt");
  const lines = [
    "=== Wallpaper Audit ===",
    `Source: ${sourceDir}`,
    `Total: ${images.length}, Valid: ${results.length}, Selected: ${selected.length}`,
    "",
    "Selected:",
    ...selected.map((f, i) => {
      const r = results[i];
      return `  ${i + 1}. ${f} (${r.width}x${r.height}, ${r.sizeKb}kb, score ${r.score})`;
    }),
  ];
  fs.writeFileSync(reportPath, lines.join("\n"), "utf8");
  console.log("Report ->", reportPath);

  return selected;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
