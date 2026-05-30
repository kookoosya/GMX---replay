#!/usr/bin/env node
/**
 * Regenerate site + extension crypto/NFT wallpapers (webp + thumbs).
 * Requires: npm install sharp (devDependency)
 * Run: node tools/generate-crypto-wallpapers.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const SITE_FULL = path.join(ROOT, 'assets', 'wallpapers');
const SITE_THUMB = path.join(ROOT, 'assets', 'wallpapers', 'thumbs');
const EXT_FULL = path.join(ROOT, 'assets', 'extbg');
const EXT_THUMB = path.join(ROOT, 'assets', 'extbg', 'thumbs');

const SITE_COUNT = 58;
const EXT_COUNT = 58;

const PALETTES = [
  { coin: 'BTC', c1: '#f7931a', c2: '#ffb347', accent: '#fff7ed' },
  { coin: 'ETH', c1: '#627eea', c2: '#b8c9ff', accent: '#eef2ff' },
  { coin: 'SOL', c1: '#9945ff', c2: '#14f195', accent: '#ecfeff' },
  { coin: 'NFT', c1: '#ec4899', c2: '#8b5cf6', accent: '#fdf4ff' },
  { coin: 'DEX', c1: '#06b6d4', c2: '#3b82f6', accent: '#e0f2fe' },
  { coin: 'HODL', c1: '#22c55e', c2: '#84cc16', accent: '#ecfccb' },
  { coin: 'MOON', c1: '#a855f7', c2: '#6366f1', accent: '#ede9fe' },
  { coin: 'DEGEN', c1: '#f97316', c2: '#ef4444', accent: '#fff7ed' },
];

function mulberry32(seed) {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function hexGrid(w, h, rnd, stroke) {
  const size = 44 + Math.floor(rnd() * 18);
  const rows = Math.ceil(h / size) + 2;
  const cols = Math.ceil(w / size) + 2;
  let out = '';
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const x = col * size * 1.5 + (row % 2 ? size * 0.75 : 0);
      const y = row * size * 0.86;
      const op = 0.04 + rnd() * 0.12;
      out += `<polygon points="${x},${y} ${x + size},${y} ${x + size * 1.5},${y + size * 0.55} ${x + size},${y + size} ${x},${y + size} ${x - size * 0.5},${y + size * 0.55}" fill="none" stroke="${stroke}" stroke-opacity="${op.toFixed(3)}" stroke-width="1"/>`;
    }
  }
  return out;
}

function candlesticks(w, h, rnd, c1, c2) {
  let out = '';
  const n = 18 + Math.floor(rnd() * 10);
  const baseY = h * 0.62;
  for (let i = 0; i < n; i++) {
    const x = w * (0.08 + (i / n) * 0.84);
    const tall = 40 + rnd() * 120;
    const body = 12 + rnd() * 36;
    const up = rnd() > 0.45;
    const col = up ? c2 : c1;
    const y = baseY - tall * (0.4 + rnd() * 0.6);
    out += `<line x1="${x}" y1="${y}" x2="${x}" y2="${baseY + 30}" stroke="${col}" stroke-opacity="0.35" stroke-width="2"/>`;
    out += `<rect x="${x - body / 2}" y="${y + 20}" width="${body}" height="${tall * 0.45}" rx="3" fill="${col}" fill-opacity="0.55"/>`;
  }
  return out;
}

function nftFrame(w, h, rnd, c1, c2) {
  const pad = Math.min(w, h) * 0.08;
  const fw = w - pad * 2;
  const fh = h - pad * 2;
  const rx = 28 + rnd() * 20;
  return `
    <rect x="${pad}" y="${pad}" width="${fw}" height="${fh}" rx="${rx}" fill="none" stroke="url(#frameGrad)" stroke-width="3" opacity="0.55"/>
    <rect x="${pad + 18}" y="${pad + 18}" width="${fw - 36}" height="${fh - 36}" rx="${rx - 8}" fill="url(#innerGlow)" opacity="0.35"/>
    <defs>
      <linearGradient id="frameGrad" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="${c1}"/><stop offset="100%" stop-color="${c2}"/></linearGradient>
      <radialGradient id="innerGlow" cx="0.3" cy="0.2" r="0.9"><stop offset="0%" stop-color="${c2}" stop-opacity="0.35"/><stop offset="100%" stop-color="transparent"/></radialGradient>
    </defs>`;
}

function buildSvg(w, h, index, vertical) {
  const rnd = mulberry32(10000 + index * 97);
  const p = PALETTES[index % PALETTES.length];
  const orbs = [];
  for (let i = 0; i < 6; i++) {
    const cx = rnd() * w;
    const cy = rnd() * h;
    const r = (0.15 + rnd() * 0.35) * Math.min(w, h);
    const col = i % 2 ? p.c1 : p.c2;
    orbs.push(`<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${r.toFixed(1)}" fill="${col}" opacity="${(0.08 + rnd() * 0.14).toFixed(3)}" filter="url(#blur)"/>`);
  }
  const label = vertical ? p.coin : `${p.coin} · ONCHAIN`;
  const fontSize = vertical ? 72 : 56;
  const labelY = vertical ? h * 0.88 : h * 0.14;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}">
<defs>
  <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0%" stop-color="#04060d"/>
    <stop offset="45%" stop-color="#0a1020"/>
    <stop offset="100%" stop-color="#050810"/>
  </linearGradient>
  <linearGradient id="beam" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="${p.c1}" stop-opacity="0.22"/>
    <stop offset="100%" stop-color="transparent"/>
  </linearGradient>
  <filter id="blur"><feGaussianBlur stdDeviation="48"/></filter>
</defs>
<rect width="${w}" height="${h}" fill="url(#bg)"/>
<rect width="${w}" height="${h}" fill="url(#beam)"/>
${hexGrid(w, h, rnd, p.c2)}
${candlesticks(w, h, rnd, p.c1, p.c2)}
${orbs.join('\n')}
${nftFrame(w, h, rnd, p.c1, p.c2)}
<text x="${(w * 0.06).toFixed(1)}" y="${labelY.toFixed(1)}" font-family="ui-sans-serif,system-ui" font-size="${fontSize}" font-weight="800" fill="${p.accent}" fill-opacity="0.92">${label}</text>
</svg>`;
}

async function main() {
  let sharp;
  try {
    sharp = (await import('sharp')).default;
  } catch {
    console.error('Install sharp first: npm install --save-dev sharp');
    process.exit(1);
  }

  for (const dir of [SITE_FULL, SITE_THUMB, EXT_FULL, EXT_THUMB]) {
    fs.mkdirSync(dir, { recursive: true });
  }

  async function writePair(outBase, svgFull, svgThumb, fullW, fullH, thumbW, thumbH) {
    const fullBuf = Buffer.from(svgFull);
    const thumbBuf = Buffer.from(svgThumb);
    await sharp(fullBuf).webp({ quality: 82 }).toFile(`${outBase}.webp`);
    await sharp(thumbBuf).webp({ quality: 78 }).toFile(path.join(path.dirname(outBase).includes('thumbs') ? path.dirname(outBase) : path.join(path.dirname(outBase), 'thumbs'), path.basename(outBase) + '.webp'));
  }

  for (let i = 1; i <= SITE_COUNT; i++) {
    const id = `v2_${String(i).padStart(3, '0')}`;
    const svg1920 = buildSvg(1920, 1080, i, false);
    const svg480 = buildSvg(480, 270, i, false);
    const fullPath = path.join(SITE_FULL, id);
    await sharp(Buffer.from(svg1920)).webp({ quality: 82 }).toFile(`${fullPath}.webp`);
    await sharp(Buffer.from(svg480)).webp({ quality: 78 }).toFile(path.join(SITE_THUMB, `${id}.webp`));
    if (i % 10 === 0) console.log('site', id);
  }

  for (let i = 1; i <= EXT_COUNT; i++) {
    const id = `extv3_${String(i).padStart(2, '0')}`;
    const svg1080 = buildSvg(1080, 1920, i + 40, true);
    const svg360 = buildSvg(360, 640, i + 40, true);
    const fullPath = path.join(EXT_FULL, id);
    await sharp(Buffer.from(svg1080)).webp({ quality: 82 }).toFile(`${fullPath}.webp`);
    await sharp(Buffer.from(svg360)).webp({ quality: 78 }).toFile(path.join(EXT_THUMB, `${id}.webp`));
    if (i % 10 === 0) console.log('ext', id);
  }

  console.log('Done:', SITE_COUNT, 'site +', EXT_COUNT, 'extension wallpapers');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
