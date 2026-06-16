#!/usr/bin/env node
/**
 * Fetch photo wallpapers from Pexels (via curated photo IDs) and overlay crypto/Solana/X motifs.
 *
 * This replaces the previous "SVG-only" look with real images.
 *
 * Usage:
 *   node tools/fetch-crypto-wallpapers-pexels-overlay.mjs --site
 *   node tools/fetch-crypto-wallpapers-pexels-overlay.mjs --ext
 *   node tools/fetch-crypto-wallpapers-pexels-overlay.mjs --all   (default)
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const SITE_FULL = path.join(ROOT, "assets", "wallpapers");
const SITE_THUMB = path.join(ROOT, "assets", "wallpapers", "thumbs");
const EXT_FULL = path.join(ROOT, "assets", "extbg");
const EXT_THUMB = path.join(ROOT, "assets", "extbg", "thumbs");

const SITE_COUNT = 58;
const EXT_COUNT = 58;

// Curated photo IDs (already present in tools/fetch-wallpapers-pexels.mjs).
// We overlay crypto motifs, so style matters more than exact subject.
const PEXELS_IDS = [
  1103970, 1257860, 1323712, 1435752, 1612282, 3044476, 3618548, 3861969, 4056723,
  4153800, 4218885, 4368386, 4526396, 4662438, 4792285, 5063436, 5207781, 5327585,
  5473956, 5474292, 5490715, 5669602, 5740737, 5740777, 6985061, 1181210, 1181263,
  1320684, 1435077, 1563356, 17483868, 207891, 963486, 1152708, 1784575, 1939485,
  2387793, 247933, 2561622, 2685339, 2832382, 2911521, 3037640, 3222041, 1252890,
  1617976, 207219, 247599, 325044, 1933902, 1766604, 1181345, 1438761, 1552617,
  1762851, 209207, 2101820, 2343464, 2564552, 2774557, 3165335, 3847188, 3957971,
  4116201, 4482900, 461077, 462030, 5194269, 577585,
];

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
  if (m === 0) return { label: "SOLANA", sub: "X" };
  if (m === 1) return { label: "DEGEN", sub: "SOL" };
  if (m === 2) return { label: "CT", sub: "X" };
  if (m === 3) return { label: "WAGMI", sub: "SOL" };
  if (m === 4) return { label: "DEGEN", sub: "X" };
  return { label: "SOL/X", sub: "CT" };
}

function paletteFor(n) {
  const m = ((n | 0) % 4 + 4) % 4;
  if (m === 0) return { x: "#14f195", a: "#7c3aed", b: "#070a12", glow: "#14f195" };
  if (m === 1) return { x: "#06b6d4", a: "#9945ff", b: "#0a0d15", glow: "#06b6d4" };
  if (m === 2) return { x: "#22c55e", a: "#7c3aed", b: "#050810", glow: "#22c55e" };
  return { x: "#f7931a", a: "#f97316", b: "#070a12", glow: "#f7931a" };
}

function xIconSvg(color) {
  // Simple "X" with glow: avoids external logos.
  return `
    <g opacity="0.95">
      <path d="M -1 0 L 1 -1 L 2 -1 L 0 1 L 2 3 L 1 3 L -1 1 L -2 1 L 0 -1 L -2 -1 L -1 0 Z" fill="${color}" opacity="0.0"/>
      <path d="M 18 6 L 26 14 L 22 18 L 14 10 L 6 18 L 2 14 L 10 6 L 2 -2 L 6 -6 L 14 2 L 22 -6 L 26 -2 Z"
            fill="${color}" opacity="0.92"/>
    </g>`;
}

function makeOverlaySvg({ width, height, n, kind }) {
  const p = paletteFor(n);
  const motif = motifFor(n);

  // Placement: top-left card.
  const pad = Math.round(width * 0.035);
  const cardW = Math.round(width * 0.42);
  const cardH = Math.round(height * (kind === "ext" ? 0.16 : 0.18));
  const r = Math.round(Math.min(cardW, cardH) * 0.22);

  const solTriW = Math.round(cardH * 0.62);
  const solTriH = Math.round(cardH * 0.62);

  const triX = pad + Math.round(solTriW * 0.08);
  const triY = pad + Math.round(solTriH * 0.25);

  const textX = triX + solTriW + Math.round(pad * 0.35);
  const labelY = triY + Math.round(solTriH * 0.32);
  const subY = triY + Math.round(solTriH * 0.72);

  const fontLabel = Math.max(18, Math.round(width * (kind === "ext" ? 0.03 : 0.026)));
  const fontSub = Math.max(14, Math.round(width * (kind === "ext" ? 0.023 : 0.020)));

  return `
  <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <defs>
      <linearGradient id="cardBg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${svgEscape(p.a)}" stop-opacity="0.40"/>
        <stop offset="55%" stop-color="${svgEscape(p.x)}" stop-opacity="0.18"/>
        <stop offset="100%" stop-color="${svgEscape(p.b)}" stop-opacity="0.26"/>
      </linearGradient>
      <filter id="glow">
        <feGaussianBlur stdDeviation="${kind === "ext" ? 14 : 10}" result="blur"/>
        <feMerge>
          <feMergeNode in="blur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    </defs>

    <rect x="${pad}" y="${pad}" width="${cardW}" height="${cardH}" rx="${r}"
          fill="url(#cardBg)" stroke="${svgEscape(p.glow)}" stroke-opacity="0.25"/>

    <!-- Solana-ish triangle -->
    <g filter="url(#glow)">
      <polygon points="${triX},${triY + solTriH} ${triX + solTriW / 2},${triY} ${triX + solTriW},${triY + solTriH}"
               fill="${svgEscape(p.glow)}" opacity="0.9"/>
    </g>

    <!-- Tiny X mark -->
    <g transform="translate(${pad + Math.round(cardW * 0.06)}, ${pad + Math.round(cardH * 0.48)}) scale(${kind === "ext" ? 1.15 : 1.0})">
      ${xIconSvg(p.glow)}
    </g>

    <text x="${textX}" y="${labelY}" font-family="ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial"
          font-size="${fontLabel}" font-weight="900" fill="rgba(255,255,255,0.92)" letter-spacing="0.6">
      ${svgEscape(motif.label)}
    </text>
    <text x="${textX}" y="${subY}" font-family="ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial"
          font-size="${fontSub}" font-weight="800" fill="rgba(255,255,255,0.74)" letter-spacing="0.8">
      ${svgEscape(motif.sub)}
    </text>
  </svg>
  `;
}

function pexelsUrl(id, w, h) {
  const base = `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg`;
  const q = new URLSearchParams({
    auto: "compress",
    cs: "tinysrgb",
    w: String(w),
    h: String(h),
    fit: "crop",
    dpr: "1",
  });
  return `${base}?${q}`;
}

async function downloadBuffer(url, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": "GMXReply-Wallpaper-Fetch/1.0 (+https://www.gmxreply.com)" },
        redirect: "follow",
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return Buffer.from(await res.arrayBuffer());
    } catch (e) {
      if (i === retries - 1) throw e;
      await new Promise((r) => setTimeout(r, 800 * (i + 1)));
    }
  }
}

async function renderCompositeWebp({ sharp, photoBuf, overlaySvg, outPath, w, h, quality }) {
  const overlayBuf = Buffer.from(overlaySvg, "utf8");
  await sharp(photoBuf)
    .resize(w, h, { fit: "cover" })
    .composite([{ input: overlayBuf, top: 0, left: 0 }])
    .webp({ quality, lossless: false })
    .toFile(outPath);
}

async function main() {
  const args = new Set(process.argv.slice(2));
  const wantAll = !args.has("--site") && !args.has("--ext");
  const wantSite = wantAll || args.has("--site") || args.has("--all");
  const wantExt = wantAll || args.has("--ext") || args.has("--all");

  const sharpMod = await import("sharp");
  const sharp = sharpMod.default;

  for (const dir of [SITE_FULL, SITE_THUMB, EXT_FULL, EXT_THUMB]) ensureDir(dir);

  let credits = ["# Wallpaper credits", "", "Source: [Pexels](https://www.pexels.com/license/) — free to use.", ""];

  let total = 0;

  if (wantSite) {
    for (let i = 0; i < SITE_COUNT; i++) {
      const photoId = PEXELS_IDS[i % PEXELS_IDS.length];
      const id = `v2_${String(i + 1).padStart(3, "0")}`;
      const outFull = path.join(SITE_FULL, `${id}.webp`);
      const outThumb = path.join(SITE_THUMB, `${id}.webp`);

      process.stdout.write(`site ${id} (pexels ${photoId})… `);
      const photoBuf = await downloadBuffer(pexelsUrl(photoId, 1920, 1080));

      const overlayFull = makeOverlaySvg({ width: 1920, height: 1080, n: i + 1, kind: "site" });
      await renderCompositeWebp({
        sharp,
        photoBuf,
        overlaySvg: overlayFull,
        outPath: outFull,
        w: 1920,
        h: 1080,
        quality: 84,
      });

      process.stdout.write("thumb… ");
      const photoBufThumb = await downloadBuffer(pexelsUrl(photoId, 480, 270));
      const overlayThumb = makeOverlaySvg({ width: 480, height: 270, n: i + 1, kind: "site" });
      await renderCompositeWebp({
        sharp,
        photoBuf: photoBufThumb,
        overlaySvg: overlayThumb,
        outPath: outThumb,
        w: 480,
        h: 270,
        quality: 78,
      });
      process.stdout.write("ok\n");

      credits.push(`- ${id}: https://www.pexels.com/photo/${photoId}/`);
      total++;
      await new Promise((r) => setTimeout(r, 120));
    }
  }

  if (wantExt) {
    for (let i = 0; i < EXT_COUNT; i++) {
      const photoId = PEXELS_IDS[i % PEXELS_IDS.length];
      const id = `extv3_${String(i + 1).padStart(2, "0")}`;
      const outFull = path.join(EXT_FULL, `${id}.webp`);
      const outThumb = path.join(EXT_THUMB, `${id}.webp`);

      process.stdout.write(`ext ${id} (pexels ${photoId})… `);
      const photoBuf = await downloadBuffer(pexelsUrl(photoId, 1080, 1920));

      const overlayFull = makeOverlaySvg({ width: 1080, height: 1920, n: i + 1, kind: "ext" });
      await renderCompositeWebp({
        sharp,
        photoBuf,
        overlaySvg: overlayFull,
        outPath: outFull,
        w: 1080,
        h: 1920,
        quality: 84,
      });

      process.stdout.write("thumb… ");
      const photoBufThumb = await downloadBuffer(pexelsUrl(photoId, 360, 640));
      const overlayThumb = makeOverlaySvg({ width: 360, height: 640, n: i + 1, kind: "ext" });
      await renderCompositeWebp({
        sharp,
        photoBuf: photoBufThumb,
        overlaySvg: overlayThumb,
        outPath: outThumb,
        w: 360,
        h: 640,
        quality: 78,
      });
      process.stdout.write("ok\n");

      credits.push(`- ${id}: https://www.pexels.com/photo/${photoId}/`);
      total++;
      await new Promise((r) => setTimeout(r, 120));
    }
  }

  const CREDITS_PATH = path.join(ROOT, "docs", "WALLPAPER_CREDITS.md");
  fs.writeFileSync(CREDITS_PATH, credits.join("\n") + "\n", "utf8");
  console.log(`\nDone. Generated and overlaid ${total} wallpaper packs.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

