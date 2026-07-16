/**
 * Wallpaper catalog contract — active livev1 site and extension assets.
 */
import test from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
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

test("wallpaper catalog uses tracked source metadata not gradients", () => {
  const catalog = fs.readFileSync(path.join(root, "tools", "lib", "wallpaper-curated-catalog.mjs"), "utf8");
  assert.doesNotMatch(catalog, /palette:/);
  assert.match(catalog, /pexelsId|unsplashId/);
});

test("wallpaper sync map pairs explicit site to ext skin ids only", () => {
  assert.equal(pairedExtId("v2_001"), SITE_EXT_SYNC_MAP.v2_001);
  assert.equal(pairedExtId("v2_002"), "");
});

test("site and extension assets exist independently", () => {
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
    assert.match(item.landscapePath, /livev1_\d{3}\.webp$/);
    assert.match(item.thumbnailPath, /livev1_\d{3}\.webp$/);
    assert.equal(item.thumbnailPath, siteThumbPathFromIndex(Number(String(item.id).replace(/^v2_/, ""))));
  }
});

test("extension-skin-sources.json has 60 independent skins", () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(root, "extension-skin-sources.json"), "utf8"));
  assert.equal(manifest.count, EXT_SKIN_PACK_COUNT);
  assert.equal(manifest.items.length, 60);
  for (const item of manifest.items) {
    assert.match(item.id, /^extskin_/);
    assert.match(item.portraitPath, /liveext_v1_\d{3}\.webp$/);
  }
});

test("premium original mini-pack is provenance-tracked and mirrored", () => {
  const premium = JSON.parse(fs.readFileSync(path.join(root, "assets", "premium-art-manifest.json"), "utf8"));
  assert.equal(premium.pack, "premium-originals-v1");
  assert.equal(premium.review.acceptedStatus, "lockedAccept");
  assert.equal(premium.site.length, 5);
  assert.equal(premium.extension.length, 5);

  for (const item of [...premium.site, ...premium.extension]) {
    assert.equal(item.generator, "cursor-generate-image");
    assert.equal(item.reviewStatus, "lockedAccept");
    assert.match(item.sha256, /^[a-f0-9]{64}$/);
    const full = path.join(root, item.asset);
    assert.ok(fs.existsSync(full), `missing ${item.asset}`);
    const hash = crypto.createHash("sha256").update(fs.readFileSync(full)).digest("hex");
    assert.equal(hash, item.sha256, `hash mismatch ${item.asset}`);
  }

  const site = JSON.parse(fs.readFileSync(path.join(root, "site-wallpaper-sources.json"), "utf8"));
  const ext = JSON.parse(fs.readFileSync(path.join(root, "extension-skin-sources.json"), "utf8"));
  assert.equal(site.items[0].origin, "generated-original");
  assert.equal(ext.items[0].origin, "generated-original");
  assert.equal(site.items[0].premiumOriginal, true);
  assert.equal(ext.items[0].premiumOriginal, true);
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
  assert.match(wp, /\/assets\/extbg\/custom\//);
});

test("livev1 emitter preserves the extension custom asset route", () => {
  const emitter = fs.readFileSync(path.join(root, "tools", "emit-livev1-to-public.mjs"), "utf8");
  assert.ok(emitter.includes('src.replace(/\\/assets\\/extskins\\/custom\\//g, "/assets/extbg/custom/");'));
  assert.ok(emitter.includes('src.replace(/\\/assets\\/extbg\\/(?!custom\\/)/g, "/assets/extskins/");'));
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
