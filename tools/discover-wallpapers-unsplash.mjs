#!/usr/bin/env node
/**
 * Discover premium wallpapers from Unsplash search (free license).
 * Scrapes search pages, validates resolution, writes wallpaper-pexels-catalog.mjs
 *
 * Run: node tools/discover-wallpapers-unsplash.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "tools", "lib", "wallpaper-pexels-catalog.mjs");
const PACK_COUNT = 100;

const THEMES = [
  {
    tag: "crypto",
    count: 25,
    queries: [
      "bitcoin neon",
      "cryptocurrency trading",
      "blockchain technology",
      "ethereum coin",
      "crypto wallet",
      "bitcoin chart",
      "digital currency",
    ],
    namePrefix: ["Bitcoin", "Crypto", "Blockchain", "Ethereum", "DeFi", "Web3", "Token", "Satoshi", "Altcoin", "Fintech"],
  },
  {
    tag: "anime",
    count: 25,
    queries: [
      "cyberpunk tokyo neon",
      "tokyo night street",
      "akihabara neon",
      "japan neon alley",
      "vaporwave city",
      "neon shibuya",
      "cyberpunk japan",
    ],
    namePrefix: ["Neo Tokyo", "Cyber", "Shinjuku", "Akihabara", "Neon Alley", "Vaporwave", "Otaku", "Sakura Night", "Blade Runner", "Synth City"],
  },
  {
    tag: "hero",
    count: 20,
    queries: [
      "superhero comic",
      "spiderman marvel",
      "comic book hero",
      "action figure superhero",
      "comic gradient",
      "superhero costume",
    ],
    namePrefix: ["Hero", "Marvel", "Comic", "Avenger", "Super", "Shield", "Cape", "Origin", "Power", "Action"],
  },
  {
    tag: "neon",
    count: 15,
    queries: [
      "neon city skyline night",
      "cyberpunk city lights",
      "neon urban night",
      "night drive city",
      "neon bridge",
    ],
    namePrefix: ["Neon", "City Pulse", "Skyline", "Urban", "Night Drive", "Metro", "Harbor", "Chrome"],
  },
  {
    tag: "cinematic",
    count: 15,
    queries: [
      "aurora borealis mountain",
      "cinematic landscape sunset",
      "northern lights fjord",
      "ocean cliff golden hour",
      "misty forest mountain",
    ],
    namePrefix: ["Aurora", "Alpine", "Ocean", "Golden", "Nordic", "Glacier", "Misty", "Coastal", "Desert", "Silk Clouds"],
  },
];

const FIXED_HAND = [
  { photoId: "1706086699531-c0591a87c73a", name: "Bitcoin Neon Glow", tag: "crypto" },
  { photoId: "1672911640671-65d5dfa97d26", name: "Lit Bitcoin Coin", tag: "crypto" },
  { photoId: "1516245834210-c4c142787335", name: "BTC Trading Desk", tag: "crypto" },
  { photoId: "1634386708556-f1a553527aa0", name: "Bitcoin on Phone", tag: "crypto" },
  { photoId: "1639133893916-a711d8af8c0a", name: "BTC Stock Chart", tag: "crypto" },
  { photoId: "1639754391037-98dd3cb74e09", name: "Bitcoin Chart Screen", tag: "crypto" },
  { photoId: "1518546305927-5a555bb7020d", name: "Gold Bitcoin", tag: "crypto" },
  { photoId: "1621761191319-c6fb62004040", name: "Ethereum Glow", tag: "crypto" },
  { photoId: "1752070533454-44795dbdb5a3", name: "Shibuya Cyber Street", tag: "anime" },
  { photoId: "1752070522773-dbf492cc52c6", name: "Neon Japan Alley", tag: "anime" },
  { photoId: "1759863726410-ce278dded3a0", name: "Comic Hero Pages", tag: "hero" },
];

async function fetchText(url, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, {
        headers: {
          "User-Agent": "GMXReply-Wallpaper-Discover/1.0 (+https://www.gmxreply.com)",
          Accept: "text/html,application/json",
        },
        redirect: "follow",
        signal: AbortSignal.timeout(45000),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.text();
    } catch (e) {
      if (i === retries - 1) throw e;
      await new Promise((r) => setTimeout(r, 1200 * (i + 1)));
    }
  }
}

function extractPhotoIds(html) {
  const ids = new Set();
  const re = /images\.unsplash\.com\/photo-(\d+-[a-f0-9]+)/gi;
  let m;
  while ((m = re.exec(html))) ids.add(m[1]);
  return [...ids];
}

function unsplashUrl(photoId, w, h) {
  const q = new URLSearchParams({ auto: "format", fit: "crop", w: String(w), q: "90" });
  if (h) q.set("h", String(h));
  return `https://images.unsplash.com/photo-${photoId}?${q}`;
}

async function validatePhoto(photoId, sharp) {
  try {
    const res = await fetch(unsplashUrl(photoId, 2400), {
      headers: { "User-Agent": "GMXReply-Wallpaper-Discover/1.0" },
      signal: AbortSignal.timeout(60000),
    });
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 80_000) return null;
    const meta = await sharp(buf).metadata();
    if (!meta.width || !meta.height) return null;
    if (meta.width < 1600 || meta.height < 900) return null;
    const ratio = meta.width / meta.height;
    if (ratio < 1.2) return null; // prefer landscape for site
    return { width: meta.width, height: meta.height, bytes: buf.length };
  } catch {
    return null;
  }
}

function makeName(prefixes, tag, idx) {
  const p = prefixes[idx % prefixes.length];
  const suffix = ["Pulse", "Glow", "Night", "Prime", "Ultra", "Vibe", "Wave", "Storm", "Rise", "Edge"][
    Math.floor(idx / prefixes.length) % 10
  ];
  return `${p} ${suffix}`.replace(/\s+/g, " ").trim();
}

async function discoverForTheme(theme, sharp, used) {
  const found = [];
  for (const query of theme.queries) {
    if (found.length >= theme.count * 3) break;
    const url = `https://unsplash.com/s/photos/${encodeURIComponent(query)}?orientation=landscape`;
    process.stdout.write(`search "${query}"… `);
    try {
      const html = await fetchText(url);
      const ids = extractPhotoIds(html);
      console.log(`${ids.length} ids`);
      for (const id of ids) {
        if (used.has(id)) continue;
        const meta = await validatePhoto(id, sharp);
        if (!meta) continue;
        used.add(id);
        found.push({ photoId: id, tag: theme.tag, meta });
        if (found.length >= theme.count * 2) break;
      }
    } catch (e) {
      console.log(`FAIL (${e.message})`);
    }
    await new Promise((r) => setTimeout(r, 400));
  }
  return found.slice(0, theme.count);
}

function emitCatalog(entries) {
  const lines = [
    "/** 100 premium wallpapers — curated from Unsplash (free license). */",
    "",
    "export const WALLPAPER_PACK_COUNT = 100;",
    "",
    "/** @type {{ source: 'unsplash'; photoId: string; name: string; tag: string }[]} */",
    "export const WALLPAPER_CATALOG = [",
  ];
  let lastTag = "";
  for (const e of entries) {
    if (e.tag !== lastTag) {
      const labels = { crypto: "Crypto & fintech", anime: "Anime & cyber", hero: "Comic & hero", neon: "Neon urban", cinematic: "Cinematic" };
      lines.push(`  // ${labels[e.tag] || e.tag}`);
      lastTag = e.tag;
    }
    lines.push(`  { source: "unsplash", photoId: "${e.photoId}", name: "${e.name}", tag: "${e.tag}" },`);
  }
  lines.push("];", "", "/** @deprecated use WALLPAPER_CATALOG */", "export const PEXELS_IDS = WALLPAPER_CATALOG.map((e) => e.photoId);");
  lines.push("export const PACK_NAMES = WALLPAPER_CATALOG.map((e) => e.name);", "");
  lines.push("if (WALLPAPER_CATALOG.length !== WALLPAPER_PACK_COUNT) {");
  lines.push('  throw new Error(`wallpaper catalog must have ${WALLPAPER_PACK_COUNT} entries`);');
  lines.push("}", "");
  fs.writeFileSync(OUT, `${lines.join("\n")}\n`, "utf8");
}

async function main() {
  const sharp = (await import("sharp")).default;
  const used = new Set();
  const catalog = [];

  for (const hp of FIXED_HAND) {
    const meta = await validatePhoto(hp.photoId, sharp);
    if (meta) {
      used.add(hp.photoId);
      catalog.push({ ...hp, source: "unsplash" });
      process.stdout.write(`hand-pick ${hp.name} ok ${meta.width}x${meta.height}\n`);
    }
  }

  for (const theme of THEMES) {
    const have = catalog.filter((e) => e.tag === theme.tag).length;
    const need = theme.count - have;
    if (need <= 0) continue;
    console.log(`\n=== ${theme.tag}: need ${need} more ===`);
    const discovered = await discoverForTheme({ ...theme, count: need }, sharp, used);
    discovered.forEach((d, i) => {
      catalog.push({
        source: "unsplash",
        photoId: d.photoId,
        name: makeName(theme.namePrefix, theme.tag, have + i),
        tag: theme.tag,
      });
    });
    console.log(`  got ${discovered.length} for ${theme.tag}`);
  }

  // Pad if short — reuse validated pool from any theme
  if (catalog.length < PACK_COUNT) {
    console.warn(`\nOnly ${catalog.length}/${PACK_COUNT} — running extra searches`);
    const extra = await discoverForTheme(
      { tag: "neon", count: PACK_COUNT - catalog.length, queries: ["wallpaper aesthetic 4k", "abstract gradient neon"], namePrefix: ["Premium"] },
      sharp,
      used
    );
    extra.forEach((d, i) => {
      catalog.push({
        source: "unsplash",
        photoId: d.photoId,
        name: `Premium ${catalog.length + 1}`,
        tag: "neon",
      });
    });
  }

  if (catalog.length < PACK_COUNT) {
    console.error(`Could only discover ${catalog.length} wallpapers`);
    process.exit(1);
  }

  const final = catalog.slice(0, PACK_COUNT);
  emitCatalog(final);
  console.log(`\nWrote ${final.length} entries → ${path.relative(ROOT, OUT)}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
