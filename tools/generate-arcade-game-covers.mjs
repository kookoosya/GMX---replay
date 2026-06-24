#!/usr/bin/env node
/**
 * Rasterize local Arcade game SVG covers to cacheable .webp files.
 * Run: node tools/generate-arcade-game-covers.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const specPath = path.join(root, "tools", "arcade-game-covers.json");
const svgDir = path.join(root, "assets", "arcade", "covers", "games");
const outDir = svgDir;

const { size, games } = JSON.parse(fs.readFileSync(specPath, "utf8"));
const { width, height } = size;

if (!Array.isArray(games) || !games.length) {
  console.error("arcade-game-covers.json: games[] is empty");
  process.exit(1);
}

fs.mkdirSync(outDir, { recursive: true });

let wrote = 0;
for (const id of games) {
  const svgPath = path.join(svgDir, `${id}.svg`);
  if (!fs.existsSync(svgPath)) {
    console.error(`missing SVG: ${path.relative(root, svgPath)}`);
    process.exit(1);
  }
  const svg = fs.readFileSync(svgPath);
  const outPath = path.join(outDir, `${id}.webp`);
  await sharp(svg).resize(width, height, { fit: "cover" }).webp({ quality: 82 }).toFile(outPath);
  wrote++;
  console.log(`  ${id}.webp`);
}

console.log(`generate-arcade-game-covers OK (${wrote} files → assets/arcade/covers/games/)`);
