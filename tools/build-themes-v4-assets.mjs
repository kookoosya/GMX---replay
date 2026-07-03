#!/usr/bin/env node
/** Themes V4 — build sitev4 wallpapers + extskin_v4 extension skins, manifests, catalog. */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  CURATED_WALLPAPERS,
  WALLPAPER_CATEGORIES,
  WALLPAPER_PACK_COUNT,
  PACK_CATEGORIES,
} from "./lib/wallpaper-curated-catalog.mjs";
import {
  SITE_SLOT_REPLACEMENTS,
  EXT_SKIN_UNSPLASH_POOL,
  extSkinCategoryForIndex,
} from "./lib/themes-v4-pool.mjs";
const SITE_ASSET_PACK = "sitev4";
const EXT_SKIN_ASSET_PACK = "extskin_v4";
const EXT_SKIN_PACK_COUNT = 60;

function siteLandscapeFilename(n) {
  return `${SITE_ASSET_PACK}_${pad3(n)}.webp`;
}
function siteThumbFilename(n) {
  return siteLandscapeFilename(n);
}
function extSkinFilename(n) {
  return `${EXT_SKIN_ASSET_PACK}_${pad3(n)}.webp`;
}
function extSkinThumbFilename(n) {
  return extSkinFilename(n);
}

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const SITE_FULL = path.join(ROOT, "assets", "wallpapers");
const SITE_THUMB = path.join(ROOT, "assets", "wallpapers", "thumbs");
const EXT_FULL = path.join(ROOT, "assets", "extskins");
const EXT_THUMB = path.join(ROOT, "assets", "extskins", "thumbs");
const EXT_PKG = path.join(ROOT, "extension", "extskins");

const SITE_W = 1920;
const SITE_H = 1080;
const EXT_W = 900;
const EXT_H = 1600;
const FULL_Q = 82;
const THUMB_Q = 78;
const MAX_FULL = 900_000;

const replacementSlots = new Set(SITE_SLOT_REPLACEMENTS.map((r) => r.slot));

function pad3(n) {
  return String(n).padStart(3, "0");
}

function siteId(n) {
  return `v2_${pad3(n)}`;
}

function extSkinId(n) {
  return `extskin_${pad3(n)}`;
}

function unsplashUrl(id, w, h) {
  const q = new URLSearchParams({ auto: "format", fit: "crop", w: String(w), q: "85" });
  if (h) q.set("h", String(h));
  return `https://images.unsplash.com/photo-${id}?${q}`;
}

function pexelsUrl(id, w, h) {
  const q = new URLSearchParams({ auto: "compress", cs: "tinysrgb", w: String(w), dpr: "1" });
  if (h) q.set("h", String(h));
  return `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?${q}`;
}

async function download(url, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": "GMXReply-ThemesV4/1.0 (+https://www.gmxreply.com)" },
        redirect: "follow",
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return Buffer.from(await res.arrayBuffer());
    } catch (e) {
      if (i === retries - 1) throw e;
      await new Promise((r) => setTimeout(r, 600 * (i + 1)));
    }
  }
}

async function encodeWebp(sharp, input, w, h, q, fit = "cover", position = "centre") {
  let quality = q;
  for (let pass = 0; pass < 4; pass++) {
    const buf = await sharp(input)
      .rotate()
      .resize(w, h, { fit, position, withoutEnlargement: true })
      .webp({ quality })
      .toBuffer();
    if (buf.length <= MAX_FULL || quality <= 68) return buf;
    quality -= 6;
  }
  return sharp(input).rotate().resize(w, h, { fit, position }).webp({ quality: 68 }).toBuffer();
}

function applyCatalogReplacements() {
  const catalogPath = path.join(ROOT, "tools", "lib", "wallpaper-curated-catalog.mjs");
  let src = fs.readFileSync(catalogPath, "utf8");

  const extraCats = [
    { id: "anime-inspired", labelKey: "wp_cat_anime_inspired" },
    { id: "comic-inspired", labelKey: "wp_cat_comic_inspired" },
    { id: "superhero-inspired", labelKey: "wp_cat_superhero_inspired" },
    { id: "mecha", labelKey: "wp_cat_mecha" },
    { id: "fantasy", labelKey: "wp_cat_fantasy" },
    { id: "sci-fi", labelKey: "wp_cat_sci_fi" },
  ];
  if (!src.includes("anime-inspired")) {
    src = src.replace(
      /(\{\s*"id": "minimal-texture"[\s\S]*?\}\s*\]\);)/,
      `$1\n\n/** Themes V4 diversity categories */\nexport const THEMES_V4_EXTRA_CATEGORIES = Object.freeze(${JSON.stringify(extraCats, null, 2)});`
    );
    src = src.replace(
      /export const WALLPAPER_CATEGORIES = Object\.freeze\(\[/,
      `export const WALLPAPER_CATEGORIES = Object.freeze([\n${extraCats.map((c) => `  ${JSON.stringify(c)},`).join("\n")},`
    );
  }

  const items = JSON.parse(JSON.stringify(CURATED_WALLPAPERS));
  for (const rep of SITE_SLOT_REPLACEMENTS) {
    const idx = rep.slot - 1;
    items[idx].name = rep.name;
    items[idx].category = rep.category;
    items[idx].tier = items[idx].tier || "premium";
    if (rep.provider === "unsplash") {
      items[idx].unsplashId = rep.unsplashId;
      delete items[idx].pexelsId;
      items[idx].photographer = rep.photographer;
      items[idx].provider = "Unsplash";
    } else if (rep.pexelsId) {
      items[idx].pexelsId = rep.pexelsId;
      delete items[idx].unsplashId;
      items[idx].provider = "Pexels";
    }
  }

  src = src.replace(
    /export const CURATED_WALLPAPERS = \[[\s\S]*?\n\];/,
    `export const CURATED_WALLPAPERS = ${JSON.stringify(items, null, 2)};`
  );
  fs.writeFileSync(catalogPath, src, "utf8");
  console.log("catalog: applied", SITE_SLOT_REPLACEMENTS.length, "slot replacements");
}

async function buildSiteAssets(sharp) {
  fs.mkdirSync(SITE_FULL, { recursive: true });
  fs.mkdirSync(SITE_THUMB, { recursive: true });

  for (let i = 1; i <= WALLPAPER_PACK_COUNT; i++) {
    const outFull = path.join(SITE_FULL, siteLandscapeFilename(i));
    const outThumb = path.join(SITE_THUMB, siteThumbFilename(i));
    const legacyFull = path.join(SITE_FULL, `pexels100_${pad3(i)}.webp`);
    const legacyThumb = path.join(SITE_THUMB, `pexels100_${pad3(i)}.webp`);

    if (replacementSlots.has(i)) {
      const rep = SITE_SLOT_REPLACEMENTS.find((r) => r.slot === i);
      process.stdout.write(`site ${siteId(i)} download… `);
      let siteBuf = null;
      try {
        let buf;
        if (rep.unsplashId) buf = await download(unsplashUrl(rep.unsplashId, SITE_W, SITE_H));
        else buf = await download(pexelsUrl(rep.pexelsId, SITE_W, SITE_H));
        siteBuf = await encodeWebp(sharp, buf, SITE_W, SITE_H, FULL_Q, "cover");
        console.log("ok");
      } catch (e) {
        const donor = legacyFull;
        if (!fs.existsSync(donor)) throw e;
        siteBuf = await encodeWebp(sharp, donor, SITE_W, SITE_H, FULL_Q, "cover", "entropy");
        console.log(`fallback (${e.message || e})`);
      }
      fs.writeFileSync(outFull, siteBuf);
      await sharp(siteBuf).resize(640, 360, { fit: "cover" }).webp({ quality: THUMB_Q }).toFile(outThumb);
      continue;
    }

    if (fs.existsSync(legacyFull)) {
      fs.copyFileSync(legacyFull, outFull);
      if (fs.existsSync(legacyThumb)) fs.copyFileSync(legacyThumb, outThumb);
      else await sharp(legacyFull).resize(640, 360, { fit: "cover" }).webp({ quality: THUMB_Q }).toFile(outThumb);
    } else {
      throw new Error(`missing legacy site asset ${legacyFull}`);
    }
  }
}

async function buildExtSkins(sharp) {
  for (const dir of [EXT_FULL, EXT_THUMB, EXT_PKG, path.join(EXT_PKG, "thumbs")]) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const pool = EXT_SKIN_UNSPLASH_POOL.slice(0, EXT_SKIN_PACK_COUNT);
  if (pool.length < EXT_SKIN_PACK_COUNT) throw new Error("ext skin pool too small");

  const positions = ["centre", "top", "bottom", "left", "right", "entropy", "attention"];

  for (let i = 1; i <= EXT_SKIN_PACK_COUNT; i++) {
    const uid = pool[i - 1];
    const pos = positions[i % positions.length];
    const donorSlot = ((i * 7 + 11) % WALLPAPER_PACK_COUNT) + 1;
    const donorLand = path.join(SITE_FULL, `pexels100_${pad3(donorSlot)}.webp`);
    const donorPort = path.join(ROOT, "assets", "extbg", `pexels100_portrait_${pad3(donorSlot)}.webp`);
    const donor = fs.existsSync(donorPort) ? donorPort : donorLand;
    process.stdout.write(`ext ${extSkinId(i)}… `);
    let extBuf = null;
    try {
      const buf = await download(unsplashUrl(uid, EXT_W, EXT_H));
      extBuf = await encodeWebp(sharp, buf, EXT_W, EXT_H, FULL_Q, "cover", pos);
      console.log("ok");
    } catch {
      if (!fs.existsSync(donor)) throw new Error(`missing donor for ext skin ${i}: ${donor}`);
      extBuf = await encodeWebp(sharp, donor, EXT_W, EXT_H, FULL_Q, "cover", pos);
      console.log("local-crop");
    }
    const fullName = extSkinFilename(i);
    const thumbName = extSkinThumbFilename(i);
    fs.writeFileSync(path.join(EXT_FULL, fullName), extBuf);
    fs.writeFileSync(path.join(EXT_PKG, fullName), extBuf);
    const thumbPath = path.join(EXT_THUMB, thumbName);
    const pkgThumb = path.join(EXT_PKG, "thumbs", thumbName);
    await sharp(extBuf).resize(360, 640, { fit: "cover" }).webp({ quality: THUMB_Q }).toFile(thumbPath);
    fs.copyFileSync(thumbPath, pkgThumb);
  }
}

function sitePexelsIds(items) {
  const s = new Set();
  for (const w of items) if (w.pexelsId) s.add(Number(w.pexelsId));
  return s;
}

function writeManifests(items) {
  const siteItems = items.map((w, i) => {
    const n = i + 1;
    const entry = {
      id: siteId(n),
      category: w.category,
      name: w.name,
      provider: w.provider || (w.unsplashId ? "Unsplash" : "Pexels"),
      photographer: w.photographer,
      landscapePath: `assets/wallpapers/${siteLandscapeFilename(n)}`,
      thumbnailPath: `assets/wallpapers/thumbs/${siteThumbFilename(n)}`,
      accessTier: w.tier === "free" ? "free" : "premium",
      attributionRequired: false,
    };
    if (w.pexelsId) {
      entry.pexelsId = w.pexelsId;
      entry.pageUrl = `https://www.pexels.com/photo/${w.pexelsId}/`;
      entry.license = "Pexels License (free to use)";
      entry.licenseUrl = "https://www.pexels.com/license/";
    }
    if (w.unsplashId) {
      entry.unsplashId = w.unsplashId;
      entry.pageUrl = `https://unsplash.com/photos/${w.unsplashId.split("-")[0]}`;
      entry.license = "Unsplash License (free to use)";
      entry.licenseUrl = "https://unsplash.com/license";
    }
    return entry;
  });

  const siteManifest = {
    version: 4,
    assetPack: SITE_ASSET_PACK,
    count: WALLPAPER_PACK_COUNT,
    items: siteItems,
  };
  fs.writeFileSync(path.join(ROOT, "site-wallpaper-sources.json"), `${JSON.stringify(siteManifest, null, 2)}\n`, "utf8");

  const pool = EXT_SKIN_UNSPLASH_POOL.slice(0, EXT_SKIN_PACK_COUNT);
  const extItems = pool.map((uid, i) => {
    const n = i + 1;
    return {
      id: extSkinId(n),
      category: extSkinCategoryForIndex(n),
      name: `Extension Skin ${n}`,
      provider: "Unsplash",
      unsplashId: uid,
      photographer: "Unsplash",
      pageUrl: `https://unsplash.com/photos/${uid.split("-")[0]}`,
      license: "Unsplash License (free to use)",
      licenseUrl: "https://unsplash.com/license",
      portraitPath: `assets/extskins/${extSkinFilename(n)}`,
      thumbnailPath: `assets/extskins/thumbs/${extSkinThumbFilename(n)}`,
      accessTier: n <= 4 ? "free" : "premium",
      attributionRequired: false,
    };
  });

  const extManifest = {
    version: 4,
    assetPack: EXT_SKIN_ASSET_PACK,
    count: EXT_SKIN_PACK_COUNT,
    items: extItems,
  };
  fs.writeFileSync(path.join(ROOT, "extension-skin-sources.json"), `${JSON.stringify(extManifest, null, 2)}\n`, "utf8");

  const siteIds = sitePexelsIds(items);
  for (const e of extItems) {
    if (e.pexelsId && siteIds.has(e.pexelsId)) throw new Error(`pexels overlap ext ${e.id}`);
  }

  writeExtensionSkinCatalog(extItems);
  console.log("manifests: site-wallpaper-sources.json + extension-skin-sources.json");
}

function writeExtensionSkinCatalog(extItems) {
  const lines = [
    "/** 60 extension portrait skins — independent from site wallpapers (Themes V4). */",
    `export const EXT_SKIN_PACK_COUNT = ${EXT_SKIN_PACK_COUNT};`,
    "",
    "export const EXT_SKIN_CATEGORIES = Object.freeze([",
    '  { "id": "cyber-neon", "labelKey": "extskin_cat_cyber_neon" },',
    '  { "id": "abstract", "labelKey": "extskin_cat_abstract" },',
    '  { "id": "space", "labelKey": "extskin_cat_space" },',
    '  { "id": "nature", "labelKey": "extskin_cat_nature" },',
    '  { "id": "fantasy", "labelKey": "extskin_cat_fantasy" },',
    '  { "id": "minimal", "labelKey": "extskin_cat_minimal" },',
    "]);",
    "",
    "export const CURATED_EXT_SKINS = " + JSON.stringify(
      extItems.map((e, i) => ({
        name: e.name,
        category: e.category,
        unsplashId: e.unsplashId,
        photographer: e.photographer,
        tier: e.accessTier === "free" ? "free" : "premium",
        overlay: 0.28,
        score: 40 - (i % 10),
      })),
      null,
      2
    ) + ";",
    "",
    "export const EXT_SKIN_NAMES = CURATED_EXT_SKINS.map((w) => w.name);",
    "export const EXT_SKIN_CATEGORIES_LIST = CURATED_EXT_SKINS.map((w) => w.category);",
    "",
  ];
  fs.writeFileSync(path.join(ROOT, "tools", "lib", "extension-skin-catalog.mjs"), lines.join("\n"), "utf8");
}

async function main() {
  applyCatalogReplacements();
  const sharp = (await import("sharp")).default;
  const { CURATED_WALLPAPERS: updated } = await import(`./lib/wallpaper-curated-catalog.mjs?t=${Date.now()}`);
  await buildSiteAssets(sharp);
  await buildExtSkins(sharp);
  writeManifests(updated);

  const cats = {};
  for (const c of updated.map((w) => w.category)) cats[c] = (cats[c] || 0) + 1;
  const city = (cats["neon-city"] || 0) + (cats["futuristic-architecture"] || 0) + (cats["night-skyline"] || 0);
  console.log("city count:", city, cats);
  if (city > 20) console.warn("WARN: city categories still > 20");
  console.log("themes-v4 build OK");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
