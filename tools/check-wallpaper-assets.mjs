#!/usr/bin/env node
/** Verify Themes V4 site wallpapers + extension skins, manifests, and category caps. */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { WALLPAPER_PACK_COUNT, PACK_CATEGORIES } from "./lib/wallpaper-curated-catalog.mjs";
import { EXT_SKIN_PACK_COUNT } from "./lib/extension-skin-catalog.mjs";
import {
  siteLandscapeFilename,
  siteThumbFilename,
  extSkinFilename,
  extSkinThumbFilename,
  SITE_ASSET_PACK,
  EXT_SKIN_ASSET_PACK,
} from "./lib/wallpaper-core.mjs";

const root = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(root, "..");
const SITE_COUNT = WALLPAPER_PACK_COUNT;
const EXT_COUNT = EXT_SKIN_PACK_COUNT;

const MIN_LAND = 8000;
const MIN_PORT = 8000;
const MIN_THUMB = 400;
const MAX_LAND = 700_000;
const MAX_PORT = 430_000;
const MAX_THUMB = 45_000;

let issues = 0;

function fail(msg) {
  console.error(msg);
  issues++;
}

function checkFile(label, file, min, max) {
  if (!fs.existsSync(file)) {
    fail(`missing ${label}: ${file}`);
    return null;
  }
  const n = fs.statSync(file).size;
  if (n < min) fail(`small ${label}: ${file} (${n} < ${min})`);
  if (max && n > max) fail(`large ${label}: ${file} (${n} > ${max})`);
  return n;
}

const landHashes = new Set();

for (let i = 1; i <= SITE_COUNT; i++) {
  const land = path.join(ROOT, "assets", "wallpapers", siteLandscapeFilename(i));
  const thumb = path.join(ROOT, "assets", "wallpapers", "thumbs", siteThumbFilename(i));
  checkFile("landscape", land, MIN_LAND, MAX_LAND);
  checkFile("thumb", thumb, MIN_THUMB, MAX_THUMB);
  if (fs.existsSync(land)) {
    const lh = crypto.createHash("sha256").update(fs.readFileSync(land)).digest("hex");
    if (landHashes.has(lh)) fail(`duplicate landscape hash: ${siteLandscapeFilename(i)}`);
    landHashes.add(lh);
  }
}

const portHashes = new Set();
for (let i = 1; i <= EXT_COUNT; i++) {
  const port = path.join(ROOT, "assets", "extskins", extSkinFilename(i));
  const extThumb = path.join(ROOT, "assets", "extskins", "thumbs", extSkinThumbFilename(i));
  checkFile("extskin", port, MIN_PORT, MAX_PORT);
  checkFile("ext-thumb", extThumb, MIN_THUMB, MAX_THUMB);
  if (fs.existsSync(port)) {
    const ph = crypto.createHash("sha256").update(fs.readFileSync(port)).digest("hex");
    if (portHashes.has(ph)) fail(`duplicate extskin hash: ${extSkinFilename(i)}`);
    portHashes.add(ph);
  }
}

const siteManifestPath = path.join(ROOT, "site-wallpaper-sources.json");
const extManifestPath = path.join(ROOT, "extension-skin-sources.json");
if (!fs.existsSync(siteManifestPath)) fail("missing site-wallpaper-sources.json");
if (!fs.existsSync(extManifestPath)) fail("missing extension-skin-sources.json");

if (fs.existsSync(siteManifestPath) && fs.existsSync(extManifestPath)) {
  const siteManifest = JSON.parse(fs.readFileSync(siteManifestPath, "utf8"));
  const extManifest = JSON.parse(fs.readFileSync(extManifestPath, "utf8"));
  if (siteManifest.count !== SITE_COUNT || siteManifest.items?.length !== SITE_COUNT) {
    fail(`site manifest count ${siteManifest.count} !== ${SITE_COUNT}`);
  }
  if (extManifest.count !== EXT_COUNT || extManifest.items?.length !== EXT_COUNT) {
    fail(`ext manifest count ${extManifest.count} !== ${EXT_COUNT}`);
  }
  if (siteManifest.assetPack !== SITE_ASSET_PACK) fail("site manifest assetPack mismatch");
  if (extManifest.assetPack !== EXT_SKIN_ASSET_PACK) fail("ext manifest assetPack mismatch");

  const sitePexels = new Set();
  for (const item of siteManifest.items || []) {
    if (!item.id?.startsWith("v2_")) fail(`bad site id ${item.id}`);
    if (item.pexelsId) sitePexels.add(Number(item.pexelsId));
    const land = path.join(ROOT, item.landscapePath);
    const thumb = path.join(ROOT, item.thumbnailPath);
    if (!fs.existsSync(land)) fail(`missing ${item.landscapePath}`);
    if (!fs.existsSync(thumb)) fail(`missing ${item.thumbnailPath}`);
    if (!item.landscapePath.includes("sitev4_")) fail(`legacy site path ${item.landscapePath}`);
  }
  for (const item of extManifest.items || []) {
    if (!item.id?.startsWith("extskin_")) fail(`bad ext id ${item.id}`);
    if (item.pexelsId && sitePexels.has(Number(item.pexelsId))) {
      fail(`pexels overlap site/ext: ${item.pexelsId}`);
    }
    const port = path.join(ROOT, item.portraitPath);
    if (!fs.existsSync(port)) fail(`missing ${item.portraitPath}`);
    if (!item.portraitPath.includes("extskin_v4_")) fail(`legacy ext path ${item.portraitPath}`);
  }

  const catCounts = {};
  for (const c of PACK_CATEGORIES) catCounts[c] = (catCounts[c] || 0) + 1;
  const city =
    (catCounts["neon-city"] || 0) +
    (catCounts["futuristic-architecture"] || 0) +
    (catCounts["night-skyline"] || 0);
  if (city > 20) fail(`city categories ${city} > 20`);
  for (const [c, n] of Object.entries(catCounts)) {
    if (n > 15) fail(`category ${c} has ${n} (>15)`);
  }
  if (new Set(PACK_CATEGORIES).size < 12) fail(`category count ${new Set(PACK_CATEGORIES).size} < 12`);
}

if (issues) {
  console.error(`check-wallpaper-assets: ${issues} issue(s)`);
  process.exit(1);
}
console.log(`check-wallpaper-assets OK (${SITE_COUNT} site + ${EXT_COUNT} ext skins, Themes V4)`);
