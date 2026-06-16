#!/usr/bin/env node
/**
 * Generates w59–w158 (100 files) as 1920×1080 JPG — procedural gradients (no scraped IP imagery).
 * Themes rotate: crypto/neon, anime pastel, space, warm/coffee tones, bold contrast (action-palette).
 * Skips IDs that already have a file on disk.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const WP = path.join(ROOT, "assets", "wallpapers");

const W = 1920;
const H = 1080;

const PALETTES = [
  { label: "Crypto", c: ["#030712", "#0c4a6e", "#06b6d4", "#f59e0b", "#a855f7"] },
  { label: "Anime", c: ["#1e1b4b", "#fbcfe8", "#93c5fd", "#fef3c7", "#fda4af"] },
  { label: "Space", c: ["#020617", "#1e293b", "#4c1d95", "#0ea5e9", "#e2e8f0"] },
  { label: "Warm", c: ["#1c1917", "#78350f", "#d97706", "#fcd34d", "#fef3c7"] },
  { label: "Action", c: ["#0f172a", "#7f1d1d", "#dc2626", "#f97316", "#fbbf24"] },
];

function svgForIndex(i) {
  const t = i - 59;
  const pal = PALETTES[t % PALETTES.length];
  const rot = ((i * 47) % 360) + (t % 17) * 3;
  const [a, b, c, d, e] = pal.c;
  const id = `gmx-${i}`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="${id}-l" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${a}"/>
      <stop offset="35%" stop-color="${b}"/>
      <stop offset="65%" stop-color="${c}"/>
      <stop offset="100%" stop-color="${d}"/>
    </linearGradient>
    <radialGradient id="${id}-r" cx="25%" cy="20%" r="75%">
      <stop offset="0%" stop-color="${e}" stop-opacity="0.45"/>
      <stop offset="55%" stop-color="${c}" stop-opacity="0.12"/>
      <stop offset="100%" stop-color="${a}" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="${id}-r2" cx="80%" cy="85%" r="60%">
      <stop offset="0%" stop-color="${d}" stop-opacity="0.35"/>
      <stop offset="100%" stop-color="${a}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <g transform="rotate(${rot} ${W / 2} ${H / 2})">
    <rect x="${-W}" y="${-H}" width="${W * 3}" height="${H * 3}" fill="url(#${id}-l)"/>
  </g>
  <rect width="${W}" height="${H}" fill="url(#${id}-r)"/>
  <rect width="${W}" height="${H}" fill="url(#${id}-r2)"/>
</svg>`;
}

async function main() {
  fs.mkdirSync(WP, { recursive: true });
  let n = 0;
  for (let i = 59; i <= 158; i++) {
    const id = `w${String(i).padStart(2, "0")}`;
    const dest = path.join(WP, `${id}.jpg`);
    if (fs.existsSync(dest)) {
      console.log("skip (exists):", id);
      continue;
    }
    const buf = Buffer.from(svgForIndex(i), "utf8");
    await sharp(buf).jpeg({ quality: 88, mozjpeg: true }).toFile(dest);
    n++;
    console.log(n, "wrote", id + ".jpg");
  }
  console.log("Done. New files:", n, "— run: node tools/rebuild-preset-manifest-from-disk.mjs && node tools/generate-wallpaper-thumbs.mjs");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
