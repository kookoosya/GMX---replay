/**
 * Wallpaper catalog contract — Themes V4 licensed backgrounds.
 */
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  WALLPAPER_PACK_COUNT,
  PACK_CATEGORIES,
  WALLPAPER_CATEGORIES,
} from "../tools/lib/wallpaper-curated-catalog.mjs";
import { EXT_SKIN_PACK_COUNT } from "../tools/lib/extension-skin-catalog.mjs";
import { pairedExtId, SITE_EXT_SYNC_MAP, siteLandscapeFilename, siteThumbPathFromIndex, extSkinPathFromIndex } from "../tools/lib/wallpaper-core.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("wallpaper catalog count matches curated entries", () => {
  assert.equal(WALLPAPER_PACK_COUNT, PACK_CATEGORIES.length);
  assert.equal(WALLPAPER_PACK_COUNT, 100);
});

test("wallpaper catalog uses licensed metadata not gradients", () => {
  const catalog = fs.readFileSync(path.join(root, "tools", "lib", "wallpaper-curated-catalog.mjs"), "utf8");
  assert.doesNotMatch(catalog, /palette:/);
  assert.match(catalog, /pexelsId|unsplashId/);
});

test("wallpaper sync map pairs explicit site to ext skin ids only", () => {
  assert.equal(pairedExtId("v2_001"), SITE_EXT_SYNC_MAP.v2_001);
  assert.equal(pairedExtId("v2_002"), "");
});

test("site sitev4 and extension extskin assets exist independently", () => {
  assert.ok(fs.existsSync(path.join(root, "assets", "wallpapers", siteLandscapeFilename(1))));
  assert.ok(fs.existsSync(path.join(root, extSkinPathFromIndex(1))));
});

test("site-wallpaper-sources.json matches active pack count", () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(root, "site-wallpaper-sources.json"), "utf8"));
  assert.equal(manifest.count, WALLPAPER_PACK_COUNT);
  assert.equal(manifest.items.length, WALLPAPER_PACK_COUNT);
  const raw = fs.readFileSync(path.join(root, "site-wallpaper-sources.json"), "utf8");
  assert.doesNotMatch(raw, /PEXELS_API_KEY/);
  for (const item of manifest.items) {
    assert.ok(item.landscapePath);
    assert.match(item.landscapePath, /sitev4_\d{3}\.webp$/);
    assert.match(item.thumbnailPath, /sitev4_\d{3}\.webp$/);
    assert.equal(item.thumbnailPath, siteThumbPathFromIndex(Number(String(item.id).replace(/^v2_/, ""))));
  }
});

test("extension-skin-sources.json has 60 independent skins", () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(root, "extension-skin-sources.json"), "utf8"));
  assert.equal(manifest.count, EXT_SKIN_PACK_COUNT);
  assert.equal(manifest.items.length, 60);
  for (const item of manifest.items) {
    assert.match(item.id, /^extskin_/);
    assert.match(item.portraitPath, /extskin_v4_\d{3}\.webp$/);
  }
});

test("wallpaper ui uses thumbnails not bulk full preload", () => {
  const src = fs.readFileSync(path.join(root, "public", "app.wallpaperui.js"), "utf8");
  assert.match(src, /wallpaperThumbUrl/);
  assert.match(src, /observeLazyBg/);
});

test("wallpaper public modules reference active pack counts", () => {
  const wp = fs.readFileSync(path.join(root, "public", "app.wallpapers.js"), "utf8");
  assert.match(wp, /SITE_PACK_COUNT = 100/);
  assert.match(wp, /EXT_PACK_COUNT = 60/);
});

test("100-pack category distribution contract", () => {
  assert.ok(WALLPAPER_CATEGORIES.length >= 12);
  const counts = {};
  for (const c of PACK_CATEGORIES) counts[c] = (counts[c] || 0) + 1;
  assert.ok(Object.keys(counts).length >= 12);
  for (const n of Object.values(counts)) assert.ok(n <= 15);
  const city =
    (counts["neon-city"] || 0) +
    (counts["futuristic-architecture"] || 0) +
    (counts["night-skyline"] || 0);
  assert.ok(city <= 20);
});
