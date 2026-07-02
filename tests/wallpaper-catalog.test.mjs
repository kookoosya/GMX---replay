/**
 * Wallpaper catalog contract — 100 licensed Pexels backgrounds.
 */
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import {
  WALLPAPER_PACK_COUNT,
  PACK_CATEGORIES,
  WALLPAPER_CATEGORIES,
} from "../tools/lib/wallpaper-curated-catalog.mjs";
import { pairedExtId, pairedSiteId } from "../tools/lib/wallpaper-core.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("wallpaper catalog has exactly 100 entries", () => {
  assert.equal(WALLPAPER_PACK_COUNT, 100);
  assert.equal(PACK_CATEGORIES.length, 100);
});

test("wallpaper catalog has at least 12 categories with max 15% share", () => {
  assert.ok(WALLPAPER_CATEGORIES.length >= 12);
  const counts = {};
  for (const c of PACK_CATEGORIES) counts[c] = (counts[c] || 0) + 1;
  assert.ok(Object.keys(counts).length >= 12);
  for (const n of Object.values(counts)) assert.ok(n <= 15);
});

test("wallpaper site and extension ids pair 1:1", () => {
  assert.equal(pairedExtId("v2_001"), "extv3_001");
  assert.equal(pairedSiteId("extv3_100"), "v2_100");
});

test("wallpaper landscape and portrait assets differ and exist", () => {
  for (let i = 1; i <= 100; i++) {
    const n = String(i).padStart(3, "0");
    const land = path.join(root, "assets", "wallpapers", `v2_${n}.webp`);
    const port = path.join(root, "assets", "extbg", `extv3_${n}.webp`);
    const thumb = path.join(root, "assets", "wallpapers", "thumbs", `v2_${n}.webp`);
    assert.ok(fs.existsSync(land), land);
    assert.ok(fs.existsSync(port), port);
    assert.ok(fs.existsSync(thumb), thumb);
    const lh = crypto.createHash("sha256").update(fs.readFileSync(land)).digest("hex");
    const ph = crypto.createHash("sha256").update(fs.readFileSync(port)).digest("hex");
    assert.notEqual(lh, ph);
  }
});

test("wallpaper-sources.json has 100 complete Pexels records", () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(root, "wallpaper-sources.json"), "utf8"));
  assert.equal(manifest.count, 100);
  assert.equal(manifest.items.length, 100);
  const raw = fs.readFileSync(path.join(root, "wallpaper-sources.json"), "utf8");
  assert.doesNotMatch(raw, /PEXELS_API_KEY/);
  for (const item of manifest.items) {
    assert.equal(item.provider, "Pexels");
    assert.ok(item.pexelsId);
    assert.ok(item.photographer);
    assert.ok(item.pageUrl);
    assert.ok(item.landscapePath);
    assert.ok(item.portraitPath);
    assert.notEqual(item.landscapePath, item.portraitPath);
  }
});

test("wallpaper ui uses thumbnails not bulk full preload", () => {
  const src = fs.readFileSync(path.join(root, "public", "app.wallpaperui.js"), "utf8");
  assert.match(src, /wallpaperThumbUrl/);
  assert.match(src, /observeLazyBg/);
  assert.doesNotMatch(src, /generate-curated-wallpapers/);
});

test("fail-before: old 25-gradient catalog contract is gone", () => {
  const catalog = fs.readFileSync(path.join(root, "tools", "lib", "wallpaper-curated-catalog.mjs"), "utf8");
  assert.doesNotMatch(catalog, /palette:/);
  assert.match(catalog, /pexelsId/);
  assert.doesNotMatch(catalog, /WALLPAPER_PACK_COUNT = 25/);
});

test("wallpaper public modules reference 100 pack count", () => {
  const wp = fs.readFileSync(path.join(root, "public", "app.wallpapers.js"), "utf8");
  assert.match(wp, /SITE_PACK_COUNT = 100/);
  assert.match(wp, /EXT_PACK_COUNT = 100/);
});

test("wallpaper selector i18n mentions 100 curated", () => {
  const en = JSON.parse(fs.readFileSync(path.join(root, "shared", "i18n", "locales", "en.json"), "utf8"));
  assert.match(en.themes_desc, /100/);
});
