#!/usr/bin/env node
/** Generate curated v2/extv3 webp wallpapers + thumbs from catalog palettes. */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { CURATED_WALLPAPERS, WALLPAPER_PACK_COUNT } from "./lib/wallpaper-curated-catalog.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const SITE = path.join(ROOT, "assets", "wallpapers");
const SITE_TH = path.join(SITE, "thumbs");
const EXT = path.join(ROOT, "assets", "extbg");
const EXT_TH = path.join(EXT, "thumbs");
const W = 1920;
const H = 1080;
const TW = 400;
const TH = 225;

function svgForEntry(i, entry) {
  const [a, b, c, d, e] = entry.palette;
  const rot = (i * 37) % 360;
  const gid = `wp-${i}`;
  const category = entry.category;
  const accent =
    category === "neon-city"
      ? `<line x1="0" y1="${H * 0.72}" x2="${W}" y2="${H * 0.68}" stroke="${d}" stroke-opacity="0.35" stroke-width="2"/>`
      : category === "space"
        ? `<circle cx="${W * 0.78}" cy="${H * 0.22}" r="120" fill="${e}" fill-opacity="0.08"/>`
        : category === "nature"
          ? `<ellipse cx="${W * 0.5}" cy="${H * 0.85}" rx="${W * 0.55}" ry="${H * 0.25}" fill="${c}" fill-opacity="0.25"/>`
          : category === "abstract"
            ? `<path d="M0 ${H * 0.55} Q ${W * 0.35} ${H * 0.35} ${W} ${H * 0.62} L ${W} ${H} L 0 ${H} Z" fill="${d}" fill-opacity="0.18"/>`
            : `<rect x="0" y="0" width="${W}" height="${H}" fill="url(#${gid}-n)" opacity="0.35"/>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="${gid}-l" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${a}"/>
      <stop offset="40%" stop-color="${b}"/>
      <stop offset="72%" stop-color="${c}"/>
      <stop offset="100%" stop-color="${d}"/>
    </linearGradient>
    <radialGradient id="${gid}-r" cx="22%" cy="18%" r="70%">
      <stop offset="0%" stop-color="${e}" stop-opacity="0.22"/>
      <stop offset="55%" stop-color="${c}" stop-opacity="0.08"/>
      <stop offset="100%" stop-color="${a}" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="${gid}-r2" cx="82%" cy="88%" r="55%">
      <stop offset="0%" stop-color="${d}" stop-opacity="0.2"/>
      <stop offset="100%" stop-color="${a}" stop-opacity="0"/>
    </radialGradient>
    <pattern id="${gid}-n" width="48" height="48" patternUnits="userSpaceOnUse">
      <path d="M48 0 V48 M0 48 H48" stroke="${e}" stroke-opacity="0.06" stroke-width="1"/>
    </pattern>
  </defs>
  <g transform="rotate(${rot} ${W / 2} ${H / 2})">
    <rect x="${-W}" y="${-H}" width="${W * 3}" height="${H * 3}" fill="url(#${gid}-l)"/>
  </g>
  <rect width="${W}" height="${H}" fill="url(#${gid}-r)"/>
  <rect width="${W}" height="${H}" fill="url(#${gid}-r2)"/>
  ${accent}
  <rect width="${W}" height="${H}" fill="#000000" fill-opacity="0.28"/>
</svg>`;
}

async function writePair(i, entry) {
  const id = String(i).padStart(3, "0");
  const svg = Buffer.from(svgForEntry(i, entry), "utf8");
  const full = await sharp(svg).webp({ quality: 82, effort: 4 }).toBuffer();
  const thumb = await sharp(svg).resize(TW, TH, { fit: "cover" }).webp({ quality: 78 }).toBuffer();
  fs.writeFileSync(path.join(SITE, `v2_${id}.webp`), full);
  fs.writeFileSync(path.join(SITE_TH, `v2_${id}.webp`), thumb);
  fs.writeFileSync(path.join(EXT, `extv3_${id}.webp`), full);
  fs.writeFileSync(path.join(EXT_TH, `extv3_${id}.webp`), thumb);
}

async function main() {
  for (const dir of [SITE, SITE_TH, EXT, EXT_TH]) fs.mkdirSync(dir, { recursive: true });
  for (let i = 1; i <= WALLPAPER_PACK_COUNT; i++) {
    await writePair(i, CURATED_WALLPAPERS[i - 1]);
    console.log(`wrote v2_${String(i).padStart(3, "0")} (${CURATED_WALLPAPERS[i - 1].name})`);
  }
  console.log(`Done: ${WALLPAPER_PACK_COUNT} curated wallpapers`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
