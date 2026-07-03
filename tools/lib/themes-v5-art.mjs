/** Original GMXReply illustrated wallpapers — license-safe vector art. */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "../..");

function hue(i, base = 0) {
  return (base + i * 37) % 360;
}

function hsl(h, s, l) {
  return `hsl(${h} ${s}% ${l}%)`;
}

function esc(s) {
  return String(s).replace(/"/g, "&quot;");
}

/** Comic halftone dots overlay */
function halftone(id, opacity = 0.12) {
  return `<pattern id="${id}-dots" width="8" height="8" patternUnits="userSpaceOnUse">
    <circle cx="2" cy="2" r="1.2" fill="#fff" fill-opacity="${opacity}"/>
  </pattern>`;
}

/** Original masked superhero silhouette — not Marvel/DC */
function superheroFigure(w, h, i, portrait = false) {
  const cx = portrait ? w * 0.52 : w * (0.62 + (i % 3) * 0.06);
  const baseY = portrait ? h * 0.78 : h * 0.88;
  const scale = portrait ? 1.35 : 1;
  const cape = `<path d="M${cx - 90 * scale} ${baseY - 420 * scale}
    Q${cx - 180 * scale} ${baseY - 200 * scale} ${cx - 140 * scale} ${baseY - 40 * scale}
    L${cx + 140 * scale} ${baseY - 40 * scale}
    Q${cx + 180 * scale} ${baseY - 200 * scale} ${cx + 90 * scale} ${baseY - 420 * scale} Z"
    fill="rgba(180,20,40,0.85)"/>`;
  const body = `<path d="M${cx - 55 * scale} ${baseY - 40 * scale}
    L${cx - 45 * scale} ${baseY - 280 * scale}
    Q${cx} ${baseY - 320 * scale} ${cx + 45 * scale} ${baseY - 280 * scale}
    L${cx + 55 * scale} ${baseY - 40 * scale} Z" fill="rgba(30,35,55,0.95)"/>`;
  const head = `<circle cx="${cx}" cy="${baseY - 310 * scale}" r="${42 * scale}" fill="rgba(30,35,55,0.98)"/>
    <path d="M${cx - 38 * scale} ${baseY - 318 * scale} Q${cx} ${baseY - 350 * scale} ${cx + 38 * scale} ${baseY - 318 * scale}
    L${cx + 32 * scale} ${baseY - 295 * scale} Q${cx} ${baseY - 285 * scale} ${cx - 32 * scale} ${baseY - 295 * scale} Z" fill="rgba(200,30,45,0.95)"/>`;
  const emblem = `<circle cx="${cx}" cy="${baseY - 210 * scale}" r="${22 * scale}" fill="none" stroke="rgba(255,210,60,0.9)" stroke-width="4"/>`;
  return cape + body + head + emblem;
}

/** Stylized anime figure — original, not franchise */
function animeFigure(w, h, i, portrait = false) {
  const cx = portrait ? w * 0.5 : w * (0.58 + (i % 4) * 0.05);
  const baseY = portrait ? h * 0.82 : h * 0.9;
  const scale = portrait ? 1.4 : 1;
  const hair = hsl(hue(i, 280), 85, 55);
  const hairSpikes = `<path d="M${cx - 50 * scale} ${baseY - 300 * scale}
    L${cx - 70 * scale} ${baseY - 380 * scale} L${cx - 20 * scale} ${baseY - 340 * scale}
    L${cx} ${baseY - 420 * scale} L${cx + 25 * scale} ${baseY - 345 * scale}
    L${cx + 75 * scale} ${baseY - 390 * scale} L${cx + 55 * scale} ${baseY - 300 * scale} Z" fill="${hair}"/>`;
  const face = `<ellipse cx="${cx}" cy="${baseY - 270 * scale}" rx="${38 * scale}" ry="${44 * scale}" fill="rgba(255,220,200,0.95)"/>
    <ellipse cx="${cx - 14 * scale}" cy="${baseY - 275 * scale}" rx="${10 * scale}" ry="${14 * scale}" fill="rgba(20,20,40,0.9)"/>
    <ellipse cx="${cx + 14 * scale}" cy="${baseY - 275 * scale}" rx="${10 * scale}" ry="${14 * scale}" fill="rgba(20,20,40,0.9)"/>
    <circle cx="${cx - 11 * scale}" cy="${baseY - 278 * scale}" r="${3 * scale}" fill="#fff"/>
    <circle cx="${cx + 17 * scale}" cy="${baseY - 278 * scale}" r="${3 * scale}" fill="#fff"/>`;
  const body = `<path d="M${cx - 40 * scale} ${baseY - 230 * scale}
    L${cx - 55 * scale} ${baseY - 40 * scale} L${cx + 55 * scale} ${baseY - 40 * scale}
    L${cx + 40 * scale} ${baseY - 230 * scale} Z" fill="rgba(25,30,50,0.92)"/>
    <path d="M${cx - 15 * scale} ${baseY - 200 * scale} L${cx + 15 * scale} ${baseY - 200 * scale}
    L${cx + 10 * scale} ${baseY - 120 * scale} L${cx - 10 * scale} ${baseY - 120 * scale} Z" fill="${hsl(hue(i, 190), 90, 55)}"/>`;
  const speed = `<line x1="0" y1="${baseY - 200 * scale}" x2="${w * 0.25}" y2="${baseY - 180 * scale}" stroke="rgba(255,255,255,0.15)" stroke-width="3"/>
    <line x1="0" y1="${baseY - 260 * scale}" x2="${w * 0.3}" y2="${baseY - 240 * scale}" stroke="rgba(255,255,255,0.1)" stroke-width="2"/>`;
  return speed + hairSpikes + body + face;
}

/** Mecha robot figure */
function mechaFigure(w, h, i, portrait = false) {
  const cx = portrait ? w * 0.5 : w * 0.65;
  const baseY = portrait ? h * 0.8 : h * 0.88;
  const scale = portrait ? 1.3 : 1;
  const accent = hsl(hue(i, 200), 80, 55);
  return `<rect x="${cx - 70 * scale}" y="${baseY - 360 * scale}" width="${140 * scale}" height="${320 * scale}" rx="12" fill="rgba(45,50,65,0.95)" stroke="${accent}" stroke-width="4"/>
    <rect x="${cx - 45 * scale}" y="${baseY - 340 * scale}" width="${90 * scale}" height="${60 * scale}" rx="6" fill="rgba(20,25,35,0.98)"/>
    <circle cx="${cx - 18 * scale}" cy="${baseY - 310 * scale}" r="${8 * scale}" fill="${accent}"/>
    <circle cx="${cx + 18 * scale}" cy="${baseY - 310 * scale}" r="${8 * scale}" fill="${accent}"/>
    <rect x="${cx - 95 * scale}" y="${baseY - 280 * scale}" width="${35 * scale}" height="${120 * scale}" rx="8" fill="rgba(55,60,75,0.95)"/>
    <rect x="${cx + 60 * scale}" y="${baseY - 280 * scale}" width="${35 * scale}" height="${120 * scale}" rx="8" fill="rgba(55,60,75,0.95)"/>
    <rect x="${cx - 50 * scale}" y="${baseY - 180 * scale}" width="${100 * scale}" height="${80 * scale}" rx="10" fill="rgba(35,40,55,0.95)" stroke="${accent}" stroke-width="2"/>`;
}

/** Fantasy environment — castles, dragons silhouette */
function fantasyEnv(w, h, i) {
  const moonX = w * 0.78;
  const moonY = h * 0.18;
  return `<circle cx="${moonX}" cy="${moonY}" r="80" fill="rgba(240,230,200,0.25)"/>
    <path d="M${w * 0.15} ${h * 0.72} L${w * 0.18} ${h * 0.45} L${w * 0.22} ${h * 0.55} L${w * 0.26} ${h * 0.38} L${w * 0.30} ${h * 0.52}
    L${w * 0.34} ${h * 0.35} L${w * 0.38} ${h * 0.48} L${w * 0.42} ${h * 0.72} Z" fill="rgba(30,25,45,0.85)"/>
    <path d="M${w * 0.55} ${h * 0.65} Q${w * 0.62} ${h * 0.45} ${w * 0.72} ${h * 0.55} Q${w * 0.78} ${h * 0.48} ${w * 0.85} ${h * 0.62} L${w * 0.85} ${h * 0.72} Z" fill="rgba(20,35,40,0.7)"/>
    <path d="M${w * 0.68} ${h * 0.52} L${w * 0.75} ${h * 0.44} L${w * 0.82} ${h * 0.5} L${w * 0.78} ${h * 0.56} Z" fill="rgba(180,60,80,0.55)"/>`;
}

/** Fantasy character portrait */
function fantasyCharacter(w, h, i) {
  const cx = w * 0.5;
  const baseY = h * 0.82;
  const robe = hsl(hue(i, 260), 60, 45);
  return `<path d="M${cx - 60} ${baseY} L${cx - 45} ${baseY - 280} Q${cx} ${baseY - 320} ${cx + 45} ${baseY - 280} L${cx + 60} ${baseY} Z" fill="${robe}"/>
    <circle cx="${cx}" cy="${baseY - 295}" r="40" fill="rgba(255,225,205,0.95)"/>
    <circle cx="${cx}" cy="${baseY - 310}" r="28" fill="none" stroke="rgba(255,210,100,0.8)" stroke-width="3"/>
    <path d="M${cx - 30} ${baseY - 250} L${cx} ${baseY - 220} L${cx + 30} ${baseY - 250} L${cx + 20} ${baseY - 180} L${cx - 20} ${baseY - 180} Z" fill="rgba(255,210,100,0.75)"/>`;
}

/** Abstract dark gradient for extension */
function abstractDark(w, h, i) {
  const a = hsl(hue(i, 220), 40, 12);
  const b = hsl(hue(i, 280), 50, 22);
  const c = hsl(hue(i, 190), 55, 35);
  return `<defs><linearGradient id="ab-${i}" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0%" stop-color="${a}"/><stop offset="50%" stop-color="${c}"/><stop offset="100%" stop-color="${b}"/>
  </linearGradient></defs><rect width="${w}" height="${h}" fill="url(#ab-${i})"/>
  <circle cx="${w * 0.3}" cy="${h * 0.35}" r="${Math.min(w, h) * 0.25}" fill="rgba(255,255,255,0.06)"/>
  <circle cx="${w * 0.72}" cy="${h * 0.62}" r="${Math.min(w, h) * 0.18}" fill="rgba(0,229,255,0.08)"/>
  <rect x="${w * 0.12}" y="${h * 0.55}" width="${w * 0.35}" height="${h * 0.02}" fill="rgba(255,255,255,0.12)" rx="4"/>
  <rect x="${w * 0.55}" y="${h * 0.22}" width="${w * 0.28}" height="${h * 0.015}" fill="rgba(255,255,255,0.08)" rx="3"/>`;
}

function cryptoSymbolPath(symbol, cx, cy, size) {
  const s = size;
  if (symbol === "btc") {
    return `<circle cx="${cx}" cy="${cy}" r="${s}" fill="rgba(247,147,26,0.15)" stroke="#F7931A" stroke-width="6"/>
      <text x="${cx}" y="${cy + s * 0.22}" text-anchor="middle" font-size="${s * 0.9}" font-family="Arial,sans-serif" font-weight="700" fill="#F7931A">&#8383;</text>`;
  }
  if (symbol === "eth") {
    return `<polygon points="${cx},${cy - s} ${cx + s * 0.65},${cy} ${cx},${cy + s} ${cx - s * 0.65},${cy}" fill="rgba(98,126,234,0.2)" stroke="#627EEA" stroke-width="5"/>
      <polygon points="${cx},${cy - s * 0.55} ${cx + s * 0.35},${cy - s * 0.05} ${cx},${cy + s * 0.15} ${cx - s * 0.35},${cy - s * 0.05}" fill="#627EEA" opacity="0.85"/>`;
  }
  return `<circle cx="${cx}" cy="${cy}" r="${s}" fill="rgba(124,92,255,0.15)" stroke="#7C5CFF" stroke-width="5"/>
    <text x="${cx}" y="${cy + s * 0.18}" text-anchor="middle" font-size="${s * 0.55}" font-family="Arial,sans-serif" font-weight="700" fill="#00E5FF">SOL</text>`;
}

function cryptoBg(w, h, i, portrait = false) {
  const symbols = ["btc", "eth", "sol"];
  const sym = symbols[i % 3];
  const cx = portrait ? w * 0.5 : w * 0.55;
  const cy = portrait ? h * 0.38 : h * 0.45;
  const size = portrait ? Math.min(w, h) * 0.18 : Math.min(w, h) * 0.14;
  const nodes = Array.from({ length: 8 }, (_, j) => {
    const nx = w * (0.15 + (j * 0.11) % 0.7);
    const ny = h * (0.15 + ((j * 17 + i * 3) % 60) / 100);
    return `<circle cx="${nx}" cy="${ny}" r="4" fill="rgba(0,229,255,0.5)"/>
      <line x1="${nx}" y1="${ny}" x2="${cx}" y2="${cy}" stroke="rgba(0,229,255,0.12)" stroke-width="1"/>`;
  }).join("");
  return nodes + cryptoSymbolPath(sym, cx, cy, size);
}

function baseGradient(w, h, i, type) {
  const palettes = {
    "superhero-comic": [hsl(hue(i, 240), 70, 8), hsl(hue(i, 0), 80, 18), hsl(hue(i, 220), 60, 12)],
    "anime-style": [hsl(hue(i, 300), 75, 12), hsl(hue(i, 190), 85, 45), hsl(hue(i, 260), 70, 18)],
    "crypto-web3": [hsl(hue(i, 230), 60, 6), hsl(hue(i, 200), 80, 14), hsl(hue(i, 170), 70, 10)],
    "mecha-cyber": [hsl(hue(i, 210), 50, 8), hsl(hue(i, 190), 70, 22), hsl(hue(i, 160), 60, 12)],
    "fantasy-env": [hsl(hue(i, 260), 45, 10), hsl(hue(i, 280), 55, 22), hsl(hue(i, 220), 40, 8)],
    "fantasy-character": [hsl(hue(i, 270), 50, 10), hsl(hue(i, 300), 45, 25), hsl(hue(i, 240), 40, 12)],
    "abstract-dark": [hsl(hue(i, 230), 30, 8), hsl(hue(i, 260), 35, 16)],
  };
  const p = palettes[type] || palettes["abstract-dark"];
  const id = `bg-${type}-${i}`;
  const stops = p.map((c, idx) => `<stop offset="${Math.round((idx / (p.length - 1)) * 100)}%" stop-color="${c}"/>`).join("");
  return `<defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1">${stops}</linearGradient>${halftone(id)}</defs>
    <rect width="${w}" height="${h}" fill="url(#${id})"/>
    <rect width="${w}" height="${h}" fill="url(#${id}-dots)"/>`;
}

function citySilhouette(w, h) {
  const rects = Array.from({ length: 14 }, (_, j) => {
    const x = w * (0.05 + j * 0.07);
    const bh = h * (0.15 + (j * 13) % 35) / 100;
    return `<rect x="${x}" y="${h - bh}" width="${w * 0.055}" height="${bh}" fill="rgba(0,0,0,0.55)"/>`;
  }).join("");
  return rects + `<rect width="${w}" height="${h}" fill="rgba(0,0,0,0.35)"/>`;
}

/**
 * @param {"superhero-comic"|"anime-style"|"crypto-web3"|"mecha-cyber"|"fantasy-env"|"fantasy-character"|"abstract-dark"} type
 */
export function renderIllustratedSvg(type, i, w, h, portrait = false) {
  if (type === "abstract-dark") {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${abstractDark(w, h, i)}</svg>`;
  }

  let fg = "";
  if (type === "superhero-comic") fg = superheroFigure(w, h, i, portrait);
  else if (type === "anime-style") fg = animeFigure(w, h, i, portrait);
  else if (type === "mecha-cyber") fg = mechaFigure(w, h, i, portrait);
  else if (type === "crypto-web3") fg = cryptoBg(w, h, i, portrait);
  else if (type === "fantasy-env") fg = fantasyEnv(w, h, i);
  else if (type === "fantasy-character") fg = fantasyCharacter(w, h, i);

  const city = ["superhero-comic", "anime-style", "mecha-cyber"].includes(type) ? citySilhouette(w, h) : "";
  const uiShade = `<rect x="0" y="${h * 0.55}" width="${w}" height="${h * 0.45}" fill="rgba(0,0,0,0.25)"/>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
    ${baseGradient(w, h, i, type)}
    ${city}
    ${fg}
    ${portrait ? "" : uiShade}
  </svg>`;
}

export async function svgToWebp(sharp, svg, w, h, quality = 82) {
  return sharp(Buffer.from(svg, "utf8"))
    .resize(w, h, { fit: "fill" })
    .webp({ quality })
    .toBuffer();
}

export async function compositeSolLogo(sharp, baseBuf, w, h) {
  const solPath = path.join(ROOT, "assets", "tokens", "sol.svg");
  if (!fs.existsSync(solPath)) return baseBuf;
  const logoSize = Math.round(Math.min(w, h) * 0.12);
  const logo = await sharp(solPath).resize(logoSize, logoSize).png().toBuffer();
  return sharp(baseBuf)
    .composite([{ input: logo, top: Math.round(h * 0.08), left: Math.round(w * 0.08) }])
    .webp({ quality: 82 })
    .toBuffer();
}

export function actualContentType(category) {
  const map = {
    "superhero-comic": "masked-superhero-original",
    "anime-style": "anime-character-original",
    "crypto-web3": "crypto-brand-composition",
    "mecha-cyber": "mecha-robot-original",
    "fantasy-env": "fantasy-environment-original",
    "fantasy-character": "fantasy-character-original",
    "abstract-dark": "abstract-gradient",
    "city-neon": "city-skyline-photography",
    nature: "nature-photography",
    space: "space-photography",
    "abstract-minimal": "abstract-photography",
  };
  return map[category] || category;
}
