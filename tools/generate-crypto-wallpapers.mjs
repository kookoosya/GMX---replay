#!/usr/bin/env node
/**
 * Generate crypto / GM / GN themed wallpapers (site 1920×1080, ext 1080×1920 + thumbs).
 * Canonical output: assets/wallpapers/, assets/extbg/ (+ thumbs/).
 */
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const root = process.cwd();
const PACK = 58;

const SITE_NAMES = [
  "Solana GM Sunrise", "Bitcoin Terminal Glow", "Ethereum Midnight Stack", "GM Candle Grid",
  "GN Moon Validator", "Degen Order Book", "WAGMI Neon Horizon", "Alpha Chart Mist",
  "Solflare Pulse", "Memecoin Aurora", "Onchain Relay", "Block Explorer Dawn",
  "Validator Halo", "Liquidity Pool Blue", "Airdrop Signal", "NFT Gallery Night",
  "CT War Room", "Ledger Noir", "Mint Horizon", "Chainlight GM",
  "Hyperlane Frost", "Token Drift", "Price Tape", "Wallet Glow",
  "GM Coffee & Charts", "GN Soft Landing", "Sol Purple Dawn", "Green Candle Rise",
  "Red Wick Sunset", "Blue Volume Sea", "Orange Degen Sun", "Violet Alpha Lane",
  "Teal Builder Flow", "Pink Meme Storm", "Gold Market Open", "Silver Close",
  "GM Squad Energy", "GN Rest Mode", "Pump.fun Haze", "Raydium Glass",
  "Jupiter Route", "Phantom Wallet Light", "Ledger Shield", "Bridge Tunnel",
  "L2 Rollup Sky", "MEV Searchlight", "Staking Yield", "Governance Vote",
  "DAO Assembly", "Hackathon Night", "Conference Hall", "Meetup Rooftop",
  "GM Global Clock", "GN Timezone Fade", "Bull Run Horizon", "Bear Cave Calm",
  "Sideways Tape", "Breakout Flash", "Rekt Recovery", "Moon Mission",
];

const EXT_NAMES = [
  "GM Laser Grid", "GN Night Drive", "Order Book Neon", "Signal Bloom",
  "Validator Sky", "Candle Mist", "Relay Tunnel", "Mint Horizon",
  "Blockwave Rain", "Node Rain GM", "Airdrop Haze", "Hyperlane",
  "Glass Router", "Vault Glow", "Neon Tape", "Cold Ledger",
  "Warp Stack", "Luma Chain", "Dawn Engine", "Token Drift",
  "Blue Volume", "Mirror Pool", "Circuit Cloud", "Mint Static",
  "Heatmap GM", "Price Halo", "Turbo Dusk", "Late Block GN",
  "Shard Dream", "Chainlight", "Mercury Lane", "Peak Flow",
  "Silent Mint", "Fast Route", "Prime Tape", "Node Bloom",
  "Ghost Volume", "Crystal Wire", "Lunar DEX", "Crossfade",
  "Vector Frost", "Frame Shift", "Plasma Window", "Afterhours GN",
  "Spectra Gate", "Glass Depth", "Hash Garden", "Night Relay",
  "Pulse Harbor", "Ocean Node", "Sky Cache", "Gamma Field",
  "Quiet Tape", "Zero Slip", "Soft Orbit", "Flash Market",
  "Aurora Book", "GM Vertical Rise", "GN Vertical Calm",
];

const PALETTES = [
  { a: "#9945FF", b: "#14F195", tag: "SOL", glyph: "GM" },
  { a: "#F7931A", b: "#FFB347", tag: "BTC", glyph: "₿" },
  { a: "#627EEA", b: "#8C9EFF", tag: "ETH", glyph: "Ξ" },
  { a: "#00D4FF", b: "#7C3AED", tag: "ALPHA", glyph: "GM" },
  { a: "#6366F1", b: "#A855F7", tag: "GN", glyph: "GN" },
  { a: "#FF6B35", b: "#FBBF24", tag: "DEGEN", glyph: "LFG" },
  { a: "#22C55E", b: "#10B981", tag: "WAGMI", glyph: "GM" },
  { a: "#EF4444", b: "#F97316", tag: "NGMI", glyph: "GN" },
  { a: "#06B6D4", b: "#3B82F6", tag: "CT", glyph: "CT" },
  { a: "#EC4899", b: "#8B5CF6", tag: "MEME", glyph: "🐸" },
  { a: "#14B8A6", b: "#0D9488", tag: "BUILD", glyph: "GM" },
  { a: "#F43F5E", b: "#FB7185", tag: "MOON", glyph: "GN" },
];

function esc(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
}

function buildSvg(w, h, idx, portrait) {
  const p = PALETTES[(idx - 1) % PALETTES.length];
  const title = portrait ? EXT_NAMES[idx - 1] || `Backdrop ${idx}` : SITE_NAMES[idx - 1] || `Aurora ${idx}`;
  const tag = p.tag;
  const glyph = p.glyph;
  const seed = idx * 17 + (portrait ? 91 : 3);
  const gridOp = 0.06 + (idx % 5) * 0.012;
  const lines = [];
  for (let y = 0; y < h; y += 48) {
    lines.push(`<line x1="0" y1="${y}" x2="${w}" y2="${y}" stroke="rgba(255,255,255,${gridOp})" stroke-width="1"/>`);
  }
  for (let x = 0; x < w; x += 48) {
    lines.push(`<line x1="${x}" y1="0" x2="${x}" y2="${h}" stroke="rgba(255,255,255,${gridOp * 0.7})" stroke-width="1"/>`);
  }
  const orbs = [
    { cx: 0.12 + (seed % 7) * 0.04, cy: 0.18, r: 0.42, c: p.a, o: 0.35 },
    { cx: 0.88 - (seed % 5) * 0.05, cy: 0.72, r: 0.38, c: p.b, o: 0.28 },
    { cx: 0.5 + (seed % 3) * 0.08, cy: 0.45, r: 0.28, c: p.a, o: 0.12 },
    { cx: 0.25, cy: 0.85, r: 0.22, c: p.b, o: 0.18 },
  ];
  const orbEls = orbs
    .map(
      (o) =>
        `<ellipse cx="${w * o.cx}" cy="${h * o.cy}" rx="${w * o.r}" ry="${h * o.r * (portrait ? 0.85 : 0.55)}" fill="${o.c}" opacity="${o.o}" filter="url(#glow)"/>`
    )
    .join("");
  const hexCells = [];
  const hexR = portrait ? 28 : 36;
  for (let row = 0; row < (portrait ? 14 : 8); row++) {
    for (let col = 0; col < (portrait ? 6 : 12); col++) {
      const cx = col * hexR * 1.8 + ((row % 2) * hexR * 0.9);
      const cy = row * hexR * 1.55 + h * 0.08;
      if (cx > w * 0.95 || cy > h * 0.92) continue;
      const op = 0.03 + ((seed + row + col) % 7) * 0.008;
      hexCells.push(`<polygon points="${cx},${cy - hexR * 0.55} ${cx + hexR * 0.5},${cy - hexR * 0.25} ${cx + hexR * 0.5},${cy + hexR * 0.35} ${cx},${cy + hexR * 0.65} ${cx - hexR * 0.5},${cy + hexR * 0.35} ${cx - hexR * 0.5},${cy - hexR * 0.25}" fill="${p.b}" opacity="${op.toFixed(3)}"/>`);
    }
  }
  const candles = [];
  const baseX = portrait ? w * 0.15 : w * 0.55;
  const baseY = portrait ? h * 0.62 : h * 0.55;
  for (let i = 0; i < 14; i++) {
    const cx = baseX + i * (portrait ? 52 : 38);
    const ch = 40 + ((seed + i * 13) % 120);
    const up = (seed + i) % 2 === 0;
    const col = up ? p.b : "#ef4444";
    candles.push(
      `<rect x="${cx}" y="${baseY - ch}" width="${portrait ? 18 : 14}" height="${ch}" rx="3" fill="${col}" opacity="0.55"/>`,
      `<line x1="${cx + (portrait ? 9 : 7)}" y1="${baseY - ch - 18}" x2="${cx + (portrait ? 9 : 7)}" y2="${baseY + 8}" stroke="${col}" stroke-width="2" opacity="0.45"/>`
    );
  }
  const bigGlyph = portrait ? 220 : 280;
  const gx = portrait ? w * 0.08 : w * 0.06;
  const gy = portrait ? h * 0.12 : h * 0.14;
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#050810"/>
      <stop offset="45%" stop-color="#0a1020"/>
      <stop offset="100%" stop-color="#070a12"/>
    </linearGradient>
    <radialGradient id="topGlow" cx="0.5" cy="0" r="1">
      <stop offset="0%" stop-color="${p.a}" stop-opacity="0.22"/>
      <stop offset="100%" stop-color="transparent"/>
    </radialGradient>
    <filter id="glow"><feGaussianBlur stdDeviation="${portrait ? 90 : 120}" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  </defs>
  <rect width="${w}" height="${h}" fill="url(#bg)"/>
  ${hexCells.join("")}${lines.join("")}
  ${orbEls}
  <rect width="${w}" height="${h}" fill="url(#topGlow)" opacity="0.85"/>
  ${candles.join("")}
  <text x="${gx}" y="${gy + bigGlyph * 0.75}" font-family="system-ui,Segoe UI,sans-serif" font-size="${bigGlyph}" font-weight="800" fill="${p.a}" opacity="0.14">${esc(glyph)}</text>
  <text x="${w - (portrait ? 48 : 64)}" y="${portrait ? h - 120 : h - 80}" text-anchor="end" font-family="system-ui,Segoe UI,sans-serif" font-size="${portrait ? 42 : 52}" font-weight="700" fill="white" opacity="0.88">${esc(tag)}</text>
  <text x="${w - (portrait ? 48 : 64)}" y="${portrait ? h - 64 : h - 24}" text-anchor="end" font-family="system-ui,Segoe UI,sans-serif" font-size="${portrait ? 22 : 26}" font-weight="500" fill="${p.b}" opacity="0.75">${esc(title)}</text>
</svg>`;
}

async function writeWebp(svg, outPath, w, h) {
  await sharp(Buffer.from(svg)).resize(w, h, { fit: "cover" }).webp({ quality: 82, effort: 4 }).toFile(outPath);
}

async function generateOne(idx, portrait) {
  const n = String(idx).padStart(portrait ? 2 : 3, "0");
  const id = portrait ? `extv3_${n}` : `v2_${n}`;
  const fullW = portrait ? 1080 : 1920;
  const fullH = portrait ? 1920 : 1080;
  const thumbW = portrait ? 360 : 480;
  const thumbH = portrait ? 640 : 270;
  const baseDir = portrait ? "assets/extbg" : "assets/wallpapers";
  const svg = buildSvg(fullW, fullH, idx, portrait);
  const fullPath = path.join(root, baseDir, `${id}.webp`);
  const thumbPath = path.join(root, baseDir, "thumbs", `${id}.webp`);
  await writeWebp(svg, fullPath, fullW, fullH);
  await writeWebp(svg, thumbPath, thumbW, thumbH);
  return id;
}

async function main() {
  const only = process.argv.find((a) => a.startsWith("--only="));
  const range = only ? [Number(only.split("=")[1])] : Array.from({ length: PACK }, (_, i) => i + 1);
  console.log(`[generate-crypto-wallpapers] generating ${range.length} packs (site + ext)...`);
  for (const i of range) {
    const site = await generateOne(i, false);
    const ext = await generateOne(i, true);
    console.log(`  ${site} + ${ext}`);
  }
  const namesPath = path.join(root, "docs/generated/wallpaper_names.json");
  fs.mkdirSync(path.dirname(namesPath), { recursive: true });
  fs.writeFileSync(
    namesPath,
    JSON.stringify({ site: SITE_NAMES.slice(0, PACK), ext: EXT_NAMES.slice(0, PACK), rev: Date.now() }, null, 2) + "\n"
  );
  console.log("[generate-crypto-wallpapers] done");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
