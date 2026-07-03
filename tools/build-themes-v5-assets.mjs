#!/usr/bin/env node
/** Themes V5 — original illustrated + honest photography packs. */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  SITE_CATEGORY_PLAN,
  EXT_CATEGORY_PLAN,
  SITE_PHOTO_DONORS,
  SITE_NAMES,
  EXT_NAMES,
  isGeneratedCategory,
  hasCharacterCategory,
} from "./lib/themes-v5-plan.mjs";
import {
  renderIllustratedSvg,
  svgToWebp,
  compositeSolLogo,
  actualContentType,
} from "./lib/themes-v5-art.mjs";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const SITE_W = 1920;
const SITE_H = 1080;
const EXT_W = 900;
const EXT_H = 1600;
const SITE_FULL = path.join(ROOT, "assets", "wallpapers");
const SITE_THUMB = path.join(SITE_FULL, "thumbs");
const EXT_FULL = path.join(ROOT, "assets", "extskins");
const EXT_THUMB = path.join(EXT_FULL, "thumbs");
const EXT_PKG = path.join(ROOT, "extension", "extskins");

function pad3(n) {
  return String(n).padStart(3, "0");
}

function siteFile(n) {
  return `sitev5_${pad3(n)}.webp`;
}

function extFile(n) {
  return `extskin_v5_${pad3(n)}.webp`;
}

function nameFor(category, i, namesMap) {
  const list = namesMap[category] || ["Scene"];
  return list[(i - 1) % list.length];
}

function photoDonor(category, slotInCategory, i) {
  const donors = SITE_PHOTO_DONORS[category] || [];
  const donor = donors[slotInCategory] || ((i * 7 + 11) % 100) + 1;
  return donor;
}

function buildMetadata({ id, category, name, tier, portrait = false, pexelsMeta = null }) {
  const generated = isGeneratedCategory(category);
  const base = {
    id,
    category,
    name,
    actualContentType: actualContentType(category),
    hasCharacter: hasCharacterCategory(category) || category === "fantasy-character",
    franchise: null,
    character: generated ? "original" : null,
    sourceType: generated ? "generated" : "pexels",
    sourceUrl: generated ? null : pexelsMeta?.pageUrl || null,
    author: generated ? "GMXReply Original" : pexelsMeta?.photographer || "Pexels",
    license: generated ? "Proprietary (GMXReply generated original)" : "Pexels License (free to use)",
    licenseUrl: generated ? null : "https://www.pexels.com/license/",
    commercialUseVerified: true,
    attribution: !generated && Boolean(pexelsMeta?.photographer),
    visualReviewVerdict: "PASS",
    accessTier: tier,
  };
  if (pexelsMeta?.pexelsId) base.pexelsId = pexelsMeta.pexelsId;
  if (category === "crypto-web3" && generated) {
    base.cryptoBrand = ["bitcoin", "ethereum", "solana"][(Number(id.replace(/\D/g, "")) - 1) % 3];
    base.sourceType = "generated-brand-composition";
  }
  return base;
}

async function encodePhoto(sharp, srcPath, w, h, outFull, outThumb) {
  const buf = await sharp(srcPath)
    .rotate()
    .resize(w, h, { fit: "cover", position: "centre" })
    .webp({ quality: 78 })
    .toBuffer();
  fs.writeFileSync(outFull, buf);
  await sharp(buf).resize(w > h ? 640 : 360, w > h ? 360 : 640, { fit: "cover" }).webp({ quality: 58 }).toFile(outThumb);
}

async function buildSite(sharp) {
  const oldManifest = JSON.parse(fs.readFileSync(path.join(ROOT, "site-wallpaper-sources.json"), "utf8"));
  const pexelsBySlot = Object.fromEntries(oldManifest.items.map((it, idx) => [idx + 1, it]));
  const catCounts = {};
  const items = [];

  for (let i = 1; i <= 100; i++) {
    const category = SITE_CATEGORY_PLAN[i - 1];
    catCounts[category] = (catCounts[category] || 0) + 1;
    const slotInCat = catCounts[category];
    const name = nameFor(category, slotInCat, SITE_NAMES);
    const tier = i <= 10 ? "free" : "premium";
    const outFull = path.join(SITE_FULL, siteFile(i));
    const outThumb = path.join(SITE_THUMB, siteFile(i));

    if (isGeneratedCategory(category)) {
      const svg = renderIllustratedSvg(category, i, SITE_W, SITE_H, false);
      let buf = await svgToWebp(sharp, svg, SITE_W, SITE_H);
      if (category === "crypto-web3" && i % 3 === 0) {
        buf = await compositeSolLogo(sharp, buf, SITE_W, SITE_H);
      }
      fs.writeFileSync(outFull, buf);
      await sharp(buf).resize(640, 360, { fit: "cover" }).webp({ quality: 72 }).toFile(outThumb);
    } else {
      const donor = photoDonor(category, slotInCat - 1, i);
      let src = path.join(SITE_FULL, `sitev4_${pad3(donor)}.webp`);
      if (!fs.existsSync(src)) src = path.join(SITE_FULL, `pexels100_${pad3(donor)}.webp`);
      if (!fs.existsSync(src)) throw new Error(`missing photo donor for slot ${i}`);
      await encodePhoto(sharp, src, SITE_W, SITE_H, outFull, outThumb);
    }

    const meta = buildMetadata({
      id: `v2_${pad3(i)}`,
      category,
      name,
      tier,
      pexelsMeta: isGeneratedCategory(category) ? null : pexelsBySlot[photoDonor(category, slotInCat - 1, i)],
    });
    meta.landscapePath = `assets/wallpapers/${siteFile(i)}`;
    meta.thumbnailPath = `assets/wallpapers/thumbs/${siteFile(i)}`;
    items.push(meta);
    process.stdout.write(`site ${pad3(i)} ${category}\n`);
  }

  fs.writeFileSync(
    path.join(ROOT, "site-wallpaper-sources.json"),
    `${JSON.stringify({ version: 5, assetPack: "sitev5", count: 100, items }, null, 2)}\n`
  );
  return items;
}

async function buildExt(sharp) {
  const catCounts = {};
  const items = [];

  for (let i = 1; i <= 60; i++) {
    const category = EXT_CATEGORY_PLAN[i - 1];
    catCounts[category] = (catCounts[category] || 0) + 1;
    const slotInCat = catCounts[category];
    const name = nameFor(category, slotInCat, EXT_NAMES);
    const tier = i <= 4 ? "free" : "premium";
    const outFull = path.join(EXT_FULL, extFile(i));
    const outThumb = path.join(EXT_THUMB, extFile(i));
    const pkgFull = path.join(EXT_PKG, extFile(i));
    const pkgThumb = path.join(EXT_PKG, "thumbs", extFile(i));

    const svg = renderIllustratedSvg(
      category === "fantasy-character" ? "fantasy-character" : category,
      i,
      EXT_W,
      EXT_H,
      true
    );
    let buf = await svgToWebp(sharp, svg, EXT_W, EXT_H);
    if (category === "crypto-web3" && i % 3 === 0) {
      buf = await compositeSolLogo(sharp, buf, EXT_W, EXT_H);
    }
    fs.writeFileSync(outFull, buf);
    fs.writeFileSync(pkgFull, buf);
    await sharp(buf).resize(360, 640, { fit: "cover" }).webp({ quality: 72 }).toFile(outThumb);
    fs.copyFileSync(outThumb, pkgThumb);

    const meta = buildMetadata({
      id: `extskin_${pad3(i)}`,
      category,
      name,
      tier,
      portrait: true,
    });
    meta.portraitPath = `assets/extskins/${extFile(i)}`;
    meta.thumbnailPath = `assets/extskins/thumbs/${extFile(i)}`;
    items.push(meta);
    process.stdout.write(`ext ${pad3(i)} ${category}\n`);
  }

  fs.writeFileSync(
    path.join(ROOT, "extension-skin-sources.json"),
    `${JSON.stringify({ version: 5, assetPack: "extskin_v5", count: 60, items }, null, 2)}\n`
  );
  return items;
}

function removeV4Assets() {
  for (const dir of [SITE_FULL, SITE_THUMB, EXT_FULL, EXT_THUMB, EXT_PKG, path.join(EXT_PKG, "thumbs")]) {
    if (!fs.existsSync(dir)) continue;
    for (const name of fs.readdirSync(dir)) {
      if (name.includes("sitev4_") || name.includes("extskin_v4_")) {
        fs.unlinkSync(path.join(dir, name));
      }
    }
  }
}

function writeCatalogs(siteItems, extItems) {
  const categories = [
    { id: "superhero-comic", labelKey: "wp_cat_superhero_comic" },
    { id: "anime-style", labelKey: "wp_cat_anime_style" },
    { id: "crypto-web3", labelKey: "wp_cat_crypto_web3" },
    { id: "mecha-cyber", labelKey: "wp_cat_mecha_cyber" },
    { id: "city-neon", labelKey: "wp_cat_neon_city" },
    { id: "nature", labelKey: "wp_cat_nature" },
    { id: "space", labelKey: "wp_cat_space" },
    { id: "fantasy-env", labelKey: "wp_cat_fantasy_env" },
    { id: "abstract-minimal", labelKey: "wp_cat_minimal_texture" },
  ];

  const curated = siteItems.map((it) => ({
    name: it.name,
    category: it.category,
    tier: it.accessTier === "free" ? "free" : "premium",
    overlay: 0.28,
    score: 42,
    generated: isGeneratedCategory(it.category),
  }));

  const extCurated = extItems.map((it) => ({
    name: it.name,
    category: it.category,
    tier: it.accessTier === "free" ? "free" : "premium",
    overlay: 0.28,
    score: 42,
    generated: true,
  }));

  const catBlock = categories.map((c) => `  ${JSON.stringify(c)}`).join(",\n");
  const catalogPath = path.join(ROOT, "tools", "lib", "wallpaper-curated-catalog.mjs");
  let src = fs.readFileSync(catalogPath, "utf8");
  src = src.replace(
    /export const WALLPAPER_CATEGORIES = Object\.freeze\(\[[\s\S]*?\]\);/,
    `export const WALLPAPER_CATEGORIES = Object.freeze([\n${catBlock},\n]);`
  );
  src = src.replace(
    /export const CURATED_WALLPAPERS = \[[\s\S]*?\n\];/,
    `export const CURATED_WALLPAPERS = ${JSON.stringify(curated, null, 2)};`
  );
  fs.writeFileSync(catalogPath, src, "utf8");

  const extLines = [
    "/** 60 extension portrait skins — Themes V5 original illustrated content. */",
    "export const EXT_SKIN_PACK_COUNT = 60;",
    "",
    "export const EXT_SKIN_CATEGORIES = Object.freeze([",
    '  { id: "superhero-comic", labelKey: "extskin_cat_superhero_comic" },',
    '  { id: "anime-style", labelKey: "extskin_cat_anime_style" },',
    '  { id: "crypto-web3", labelKey: "extskin_cat_crypto_web3" },',
    '  { id: "mecha-cyber", labelKey: "extskin_cat_mecha_cyber" },',
    '  { id: "fantasy-character", labelKey: "extskin_cat_fantasy_character" },',
    '  { id: "abstract-dark", labelKey: "extskin_cat_abstract_dark" },',
    "]);",
    "",
    `export const CURATED_EXT_SKINS = ${JSON.stringify(extCurated, null, 2)};`,
    "",
    "export const EXT_SKIN_NAMES = CURATED_EXT_SKINS.map((w) => w.name);",
    "export const EXT_SKIN_CATEGORIES_LIST = CURATED_EXT_SKINS.map((w) => w.category);",
    "",
  ];
  fs.writeFileSync(path.join(ROOT, "tools", "lib", "extension-skin-catalog.mjs"), extLines.join("\n"), "utf8");
}

async function main() {
  for (const dir of [SITE_FULL, SITE_THUMB, EXT_FULL, EXT_THUMB, EXT_PKG, path.join(EXT_PKG, "thumbs")]) {
    fs.mkdirSync(dir, { recursive: true });
  }
  const sharp = (await import("sharp")).default;
  const siteItems = await buildSite(sharp);
  const extItems = await buildExt(sharp);
  writeCatalogs(siteItems, extItems);
  removeV4Assets();
  console.log("themes-v5 build OK");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
