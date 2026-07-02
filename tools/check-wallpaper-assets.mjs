#!/usr/bin/env node
/** Verify 100 wallpaper assets, manifest, budgets, and landscape/portrait parity. */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { WALLPAPER_PACK_COUNT, PACK_CATEGORIES } from "./lib/wallpaper-curated-catalog.mjs";

const root = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(root, "..");
const COUNT = WALLPAPER_PACK_COUNT;
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
const portHashes = new Set();

for (let i = 1; i <= COUNT; i++) {
  const n = String(i).padStart(3, "0");
  const siteId = `v2_${n}`;
  const extId = `extv3_${n}`;
  const land = path.join(ROOT, "assets", "wallpapers", `${siteId}.webp`);
  const port = path.join(ROOT, "assets", "extbg", `${extId}.webp`);
  const thumb = path.join(ROOT, "assets", "wallpapers", "thumbs", `${siteId}.webp`);
  const extThumb = path.join(ROOT, "assets", "extbg", "thumbs", `${extId}.webp`);

  checkFile("landscape", land, MIN_LAND, MAX_LAND);
  checkFile("portrait", port, MIN_PORT, MAX_PORT);
  checkFile("thumb", thumb, MIN_THUMB, MAX_THUMB);
  checkFile("ext-thumb", extThumb, MIN_THUMB, MAX_THUMB);

  if (fs.existsSync(land) && fs.existsSync(port)) {
    const lh = crypto.createHash("sha256").update(fs.readFileSync(land)).digest("hex");
    const ph = crypto.createHash("sha256").update(fs.readFileSync(port)).digest("hex");
    if (lh === ph) fail(`landscape equals portrait: ${siteId}`);
    if (landHashes.has(lh)) fail(`duplicate landscape hash: ${siteId}`);
    if (portHashes.has(ph)) fail(`duplicate portrait hash: ${siteId}`);
    landHashes.add(lh);
    portHashes.add(ph);
  }
}

if (COUNT !== 100) fail(`catalog count ${COUNT} !== 100`);

const cats = new Set(PACK_CATEGORIES);
if (cats.size < 12) fail(`category count ${cats.size} < 12`);
const catCounts = {};
for (const c of PACK_CATEGORIES) catCounts[c] = (catCounts[c] || 0) + 1;
for (const [c, n] of Object.entries(catCounts)) {
  if (n > 15) fail(`category ${c} has ${n} (>15%)`);
}

const manifestPath = path.join(ROOT, "wallpaper-sources.json");
if (!fs.existsSync(manifestPath)) fail("missing wallpaper-sources.json");
else {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  if (manifest.count !== 100 || manifest.items?.length !== 100) fail("manifest count !== 100");
  const raw = fs.readFileSync(manifestPath, "utf8");
  if (/PEXELS_API_KEY|api\.pexels\.com\/v1\/search\?.*key/i.test(raw)) fail("manifest contains API key");
  for (const item of manifest.items || []) {
    if (!item.pexelsId || !item.photographer || !item.pageUrl) fail(`incomplete source: ${item.id}`);
  }
}

if (issues) {
  console.error(`check-wallpaper-assets: ${issues} issue(s)`);
  process.exit(1);
}
console.log(`check-wallpaper-assets OK (${COUNT} site + ${COUNT} ext, manifest OK)`);
