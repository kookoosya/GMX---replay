import fs from "node:fs";
import path from "node:path";
import { ROOT } from "./lib/load-env.mjs";
import { altRejected } from "./lib/wallpaper-image-utils.mjs";

const WALLPAPER_CATEGORIES = [
  { id: "neon-city", labelKey: "wp_cat_neon_city" },
  { id: "futuristic-architecture", labelKey: "wp_cat_futuristic_architecture" },
  { id: "night-skyline", labelKey: "wp_cat_night_skyline" },
  { id: "space", labelKey: "wp_cat_space" },
  { id: "moon-planets", labelKey: "wp_cat_moon_planets" },
  { id: "mountains", labelKey: "wp_cat_mountains" },
  { id: "forest", labelKey: "wp_cat_forest" },
  { id: "ocean-underwater", labelKey: "wp_cat_ocean_underwater" },
  { id: "desert", labelKey: "wp_cat_desert" },
  { id: "northern-lights", labelKey: "wp_cat_northern_lights" },
  { id: "abstract-glass", labelKey: "wp_cat_abstract_glass" },
  { id: "geometric-dark", labelKey: "wp_cat_geometric_dark" },
  { id: "minimal-texture", labelKey: "wp_cat_minimal_texture" },
];

function titleCase(s) {
  return String(s || "")
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

function nameFromPhoto(photo, category) {
  const alt = String(photo.alt || "").trim();
  if (alt && alt.length > 4 && alt.length < 48 && !altRejected(alt)) {
    return alt.split(/[.,|]/)[0].slice(0, 42).trim();
  }
  return `${titleCase(category.split("-")[0])} Scene`;
}

export function writeCatalog(final100) {
  const entries = final100.map((c, i) => ({
    name: nameFromPhoto(c, c.category),
    category: c.category,
    pexelsId: c.pexelsId,
    photographer: c.photographer,
    tier: i < 10 ? "free" : "premium",
    overlay: 0.28,
    score: Math.round(c.score.total),
  }));

  const seen = new Map();
  for (const e of entries) {
    const n = (seen.get(e.name) || 0) + 1;
    seen.set(e.name, n);
    if (n > 1) e.name = `${e.name} ${n}`;
  }

  const catalogSrc = `/** 100 licensed Pexels wallpapers — curated for GMXReply. */
export const WALLPAPER_PACK_COUNT = 100;

export const WALLPAPER_CATEGORIES = Object.freeze(${JSON.stringify(WALLPAPER_CATEGORIES, null, 2)});

/** @type {{ name: string, category: string, pexelsId: number, photographer: string, tier: string, overlay: number, score: number }[]} */
export const CURATED_WALLPAPERS = ${JSON.stringify(entries, null, 2)};

export const PACK_NAMES = CURATED_WALLPAPERS.map((w) => w.name);
export const PACK_CATEGORIES = CURATED_WALLPAPERS.map((w) => w.category);

if (CURATED_WALLPAPERS.length !== WALLPAPER_PACK_COUNT) {
  throw new Error("wallpaper catalog must have 100 entries");
}
`;
  fs.writeFileSync(path.join(ROOT, "tools", "lib", "wallpaper-curated-catalog.mjs"), catalogSrc, "utf8");

  const corePath = path.join(ROOT, "tools", "lib", "wallpaper-core.mjs");
  const coreSrc = fs.readFileSync(corePath, "utf8");
  fs.writeFileSync(corePath, coreSrc.replace(/export const WALLPAPER_PACK_COUNT = \d+;/, "export const WALLPAPER_PACK_COUNT = 100;"), "utf8");
}

export function writeSourcesManifest(final100) {
  const today = new Date().toISOString().slice(0, 10);
  const items = final100.map((c, i) => ({
    id: c.siteId,
    extId: c.extId,
    category: c.category,
    name: nameFromPhoto(c, c.category),
    provider: "Pexels",
    pexelsId: c.pexelsId,
    photographer: c.photographer,
    photographerUrl: c.photographerUrl,
    pageUrl: c.pageUrl,
    originalDimensions: { width: c.width, height: c.height },
    downloadDate: today,
    license: "Pexels License (free to use)",
    licenseUrl: "https://www.pexels.com/license/",
    landscapePath: c.landscapePath,
    portraitPath: c.portraitPath,
    thumbnailPath: c.thumbnailPath,
    visualScore: c.score.total,
    accessTier: i < 10 ? "free" : "premium",
    attributionRequired: false,
  }));
  fs.writeFileSync(path.join(ROOT, "wallpaper-sources.json"), `${JSON.stringify({ version: 1, count: 100, items }, null, 2)}\n`, "utf8");
}

export function bumpAssetRev() {
  const rev = new Date().toISOString().slice(0, 10).replace(/-/g, "") + "w";
  for (const rel of ["public/app.js", "site-src/00-bootstrap.js", "extension/lib/ext-config.js", "public/app.html"]) {
    const file = path.join(ROOT, rel);
    if (!fs.existsSync(file)) continue;
    let src = fs.readFileSync(file, "utf8");
    if (rel.endsWith("app.html")) {
      src = src.replace(/<meta name="gmx-asset-rev" content="[^"]*"\/>/g, `<meta name="gmx-asset-rev" content="${rev}"/>`);
    } else if (rel.includes("ext-config")) {
      src = src.replace(/ASSET_REV: "[^"]+"/, `ASSET_REV: "${rev}"`);
    } else {
      src = src.replace(/const ASSET_REV = "[^"]+";/, `const ASSET_REV = "${rev}";`);
    }
    fs.writeFileSync(file, src, "utf8");
  }
}
