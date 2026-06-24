#!/usr/bin/env node
/**
 * Generate category fallback covers for Arcade tiles.
 * Run: node tools/generate-arcade-category-covers.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const specPath = path.join(root, "tools", "arcade-category-covers.json");
const outDir = path.join(root, "assets", "arcade", "covers", "categories");

const { size, categories } = JSON.parse(fs.readFileSync(specPath, "utf8"));
const { width, height } = size;

function coverSvg(label, c1, c2) {
  const text = String(label || "GAME").slice(0, 12).toUpperCase();
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 540"><defs><linearGradient id="g" x1="0" x2="1" y1="0" y2="1"><stop offset="0%" stop-color="${c1}"/><stop offset="100%" stop-color="${c2}"/></linearGradient></defs><rect width="900" height="540" fill="url(#g)"/><circle cx="760" cy="90" r="120" fill="rgba(255,255,255,.12)"/><circle cx="120" cy="460" r="180" fill="rgba(255,255,255,.08)"/><text x="58" y="460" font-family="Inter,Segoe UI,Arial" font-size="96" font-weight="800" fill="rgba(255,255,255,.92)">${text}</text></svg>`;
}

fs.mkdirSync(outDir, { recursive: true });

let wrote = 0;
for (const [key, [c1, c2]] of Object.entries(categories)) {
  const svg = coverSvg(key, c1, c2);
  const outPath = path.join(outDir, `${key}.webp`);
  await sharp(Buffer.from(svg)).resize(width, height).webp({ quality: 82 }).toFile(outPath);
  wrote++;
  console.log(`  ${key}.webp`);
}

console.log(`generate-arcade-category-covers OK (${wrote} files → assets/arcade/covers/categories/)`);
