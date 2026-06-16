#!/usr/bin/env node
/**
 * Generate crypto/Solana/X-style wallpapers (no external downloads).
 * Replaces:
 *  - assets/wallpapers/v2_###.webp (+ thumbs)
 *  - assets/extbg/extv3_##.webp (+ thumbs)
 *
 * Usage:
 *  node tools/generate-crypto-wallpapers.mjs --site   # only v2_*
 *  node tools/generate-crypto-wallpapers.mjs --ext    # only extv3_*
 *  node tools/generate-crypto-wallpapers.mjs --all    # default
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const SITE_FULL = path.join(ROOT, "assets", "wallpapers");
const SITE_THUMB = path.join(ROOT, "assets", "wallpapers", "thumbs");
const EXT_FULL = path.join(ROOT, "assets", "extbg");
const EXT_THUMB = path.join(ROOT, "assets", "extbg", "thumbs");

const SITE_COUNT = 58;
const EXT_COUNT = 58;

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function svgEscape(s) {
  return String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function motifFor(n) {
  const m = ((n | 0) % 6 + 6) % 6;
  if (m === 0) return { tag: "SOLANA", sub: "X" };
  if (m === 1) return { tag: "DEGEN", sub: "SOL" };
  if (m === 2) return { tag: "CT", sub: "X" };
  if (m === 3) return { tag: "WAGMI", sub: "SOL" };
  if (m === 4) return { tag: "DEGEN", sub: "X" };
  return { tag: "SOL/X", sub: "CT" };
}

function paletteFor(n) {
  const m = ((n | 0) % 4 + 4) % 4;
  if (m === 0) return { x: "#14f195", a: "#7c3aed", b: "#070a12", glow: "#14f195" };
  if (m === 1) return { x: "#06b6d4", a: "#9945ff", b: "#0a0d15", glow: "#06b6d4" };
  if (m === 2) return { x: "#22c55e", a: "#7c3aed", b: "#050810", glow: "#22c55e" };
  return { x: "#f7931a", a: "#f97316", b: "#070a12", glow: "#f7931a" };
}

function seeded(n) {
  // Deterministic PRNG from integer index.
  let x = (n | 0) * 1664525 + 1013904223;
  return () => {
    x = (x * 1664525 + 1013904223) % 4294967296;
    return x / 4294967296;
  };
}

function makeCryptoSvg({ width, height, n, kind }) {
  const p = paletteFor(n);
  const motif = motifFor(n);
  const rnd = seeded(n + (kind === "ext" ? 777 : 0));

  const solCx = width / 2;
  const solTop = height * 0.18;
  const solW = width * 0.42;
  const solH = height * 0.46;

  const xCx = width * 0.54;
  const xCy = height * (kind === "ext" ? 0.72 : 0.62);
  const xSize = width * 0.18;

  const gridCount = kind === "ext" ? 18 : 12;
  const grid = [];
  for (let i = 0; i < gridCount; i++) {
    const x = Math.round((width * (0.08 + rnd() * 0.84)) * 10) / 10;
    const y = Math.round((height * (0.08 + rnd() * 0.84)) * 10) / 10;
    const r = Math.round((width * (0.006 + rnd() * 0.012)) * 10) / 10;
    grid.push(`<circle cx="${x}" cy="${y}" r="${r}" fill="${p.glow}" opacity="0.16"/>`);
  }

  const lines = [];
  const lineCount = kind === "ext" ? 5 : 4;
  for (let i = 0; i < lineCount; i++) {
    const y = Math.round((height * (0.24 + rnd() * 0.62)) * 10) / 10;
    lines.push(
      `<path d="M ${Math.round(width * 0.08)} ${y} C ${Math.round(width * 0.35)} ${Math.round(
        y + height * 0.05
      )}, ${Math.round(width * 0.65)} ${Math.round(y - height * 0.05)}, ${Math.round(
        width * 0.92
      )} ${y}" fill="none" stroke="${p.glow}" stroke-width="${Math.max(2, width * 0.004)}" opacity="0.22"/>`
    );
  }

  const sol = `<polygon points="${solCx - solW / 2},${solTop} ${solCx + solW / 2},${solTop} ${solCx},${
    solTop + solH
  }" fill="url(#solGrad)" />`;

  const xIcon = `
    <g opacity="0.96">
      <path d="M ${xCx - xSize} ${xCy - xSize} L ${xCx + xSize} ${xCy + xSize}" stroke="${p.glow}" stroke-width="${Math.max(
        10,
        width * 0.016
      )}" stroke-linecap="round"/>
      <path d="M ${xCx + xSize} ${xCy - xSize} L ${xCx - xSize} ${xCy + xSize}" stroke="${p.glow}" stroke-width="${Math.max(
        10,
        width * 0.016
      )}" stroke-linecap="round"/>
    </g>`;

  // No text inside SVG: site/extension already show names/labels.
  // Here we only draw visuals (gradients/orbs/triangle/X).

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${p.b}" />
      <stop offset="35%" stop-color="${p.a}" />
      <stop offset="100%" stop-color="${p.x}" />
    </linearGradient>
    <linearGradient id="solGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${p.a}" />
      <stop offset="100%" stop-color="${p.glow}" />
    </linearGradient>
    <filter id="glow">
      <feGaussianBlur stdDeviation="${kind === "ext" ? 16 : 10}" result="blur"/>
      <feMerge>
        <feMergeNode in="blur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>

  <rect width="${width}" height="${height}" fill="url(#bg)"/>
  <g opacity="0.85">
    ${grid.join("\n")}
  </g>
  <g opacity="0.65">
    ${lines.join("\n")}
  </g>

  <g filter="url(#glow)">
    ${sol}
    ${xIcon}
  </g>
</svg>`;

  return svg;
}

async function renderWebp({ sharp, svg, width, height, outPath, quality }) {
  // Render SVG at explicit size (SVG already sets width/height).
  const buf = Buffer.from(svg, "utf8");
  await sharp(buf)
    .webp({ quality, lossless: false })
    .toFile(outPath);
}

async function main() {
  const args = new Set(process.argv.slice(2));
  const wantSite = args.has("--site") || args.has("--all") || (!args.has("--ext") && !args.has("--site"));
  const wantExt = args.has("--ext") || args.has("--all");

  const sharpMod = await import("sharp");
  const sharp = sharpMod.default;

  for (const dir of [SITE_FULL, SITE_THUMB, EXT_FULL, EXT_THUMB]) ensureDir(dir);

  let changed = 0;

  // SITE: v2_001..v2_058 (1920x1080 + thumbs 480x270)
  if (wantSite) {
    for (let i = 1; i <= SITE_COUNT; i++) {
      const id = `v2_${String(i).padStart(3, "0")}`;
      const outFull = path.join(SITE_FULL, `${id}.webp`);
      const outThumb = path.join(SITE_THUMB, `${id}.webp`);

      const svgFull = makeCryptoSvg({ width: 1920, height: 1080, n: i, kind: "site" });
      const svgThumb = makeCryptoSvg({ width: 480, height: 270, n: i, kind: "site" });

      await renderWebp({ sharp, svg: svgFull, width: 1920, height: 1080, outPath: outFull, quality: 92 });
      await renderWebp({ sharp, svg: svgThumb, width: 480, height: 270, outPath: outThumb, quality: 90 });
      changed++;
      if (changed % 8 === 0) process.stdout.write(".");
    }
    process.stdout.write("\n");
  }

  // EXT: extv3_01..extv3_58 (1080x1920 + thumbs 360x640)
  if (wantExt) {
    for (let i = 1; i <= EXT_COUNT; i++) {
      const id = `extv3_${String(i).padStart(2, "0")}`;
      const outFull = path.join(EXT_FULL, `${id}.webp`);
      const outThumb = path.join(EXT_THUMB, `${id}.webp`);

      const svgFull = makeCryptoSvg({ width: 1080, height: 1920, n: i, kind: "ext" });
      const svgThumb = makeCryptoSvg({ width: 360, height: 640, n: i, kind: "ext" });

      await renderWebp({ sharp, svg: svgFull, width: 1080, height: 1920, outPath: outFull, quality: 92 });
      await renderWebp({ sharp, svg: svgThumb, width: 360, height: 640, outPath: outThumb, quality: 90 });
      changed++;
      if (changed % 8 === 0) process.stdout.write(".");
    }
    process.stdout.write("\n");
  }

  console.log(`\ncrypto-wallpapers: regenerated (${changed} packs).`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

