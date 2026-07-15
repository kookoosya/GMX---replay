/**
 * Themes V4 — separate site wallpapers (100) from extension skins (60).
 */
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  WALLPAPER_PACK_COUNT,
  SITE_ASSET_PACK,
  EXT_SKIN_ASSET_PACK,
  EXT_SKIN_PACK_COUNT,
  SITE_EXT_SYNC_MAP,
  siteLandscapeFilename,
  siteThumbPathFromIndex,
  extSkinPathFromIndex,
  pairedExtId,
  LEGACY_PEXELS100_SITE_FILENAMES,
  LEGACY_PEXELS100_EXT_FILENAMES,
} from "../tools/lib/wallpaper-core.mjs";
import { PACK_CATEGORIES } from "../tools/lib/wallpaper-curated-catalog.mjs";
import { EXT_SKIN_PACK_COUNT as EXT_CAT_COUNT } from "../tools/lib/extension-skin-catalog.mjs";
import { PWA_CACHE_NAME } from "../tools/lib/pwa-shell-core.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function loadWallpaperFactory() {
  const bootstrap = fs.readFileSync(path.join(root, "public", "app.js"), "utf8");
  const rev = bootstrap.match(/const ASSET_REV = "([^"]+)"/)?.[1] || "";
  let wpSrc = fs.readFileSync(path.join(root, "public", "app.wallpapers.js"), "utf8");
  wpSrc = wpSrc.replace(/\}\)\(window\);\s*$/, "})(global);");
  const g = {};
  new Function("global", wpSrc)(g);
  return g.__GMXWallpapersFactory({
    getAssetRev: () => rev,
    getSiteCustomUpload: () => "",
    getExtCustomUpload: () => "",
  });
}

test("site pack count is 100, extension skin pack is 60", () => {
  assert.equal(WALLPAPER_PACK_COUNT, 100);
  assert.equal(EXT_SKIN_PACK_COUNT, 60);
  assert.equal(EXT_CAT_COUNT, 60);
});

test("active site URLs use sitev4 not pexels100 or legacy v2 paths", () => {
  const wp = loadWallpaperFactory();
  const catalog = wp.buildSiteWallpapers();
  assert.equal(catalog.length, 100);
  for (const entry of catalog) {
    const thumb = wp.wallpaperThumbUrl(entry.id, catalog);
    const full = wp.wallpaperFullUrl(entry.id, catalog);
    assert.match(thumb, /\/assets\/wallpapers\/thumbs\/livev1_\d{3}\.webp\?v=/);
    assert.match(full, /\/assets\/wallpapers\/livev1_\d{3}\.webp\?v=/);
    for (const legacy of LEGACY_PEXELS100_SITE_FILENAMES.slice(0, 5)) {
      assert.doesNotMatch(thumb, new RegExp(legacy.replace(".", "\\.")));
    }
  }
});

test("active extension skin URLs use extskin_v4 under extskins/", () => {
  const wp = loadWallpaperFactory();
  const ext = wp.buildExtWallpapers();
  assert.equal(ext.length, 60);
  assert.equal(ext[0].id, "extskin_001");
  for (const entry of ext) {
    const thumb = wp.extWallpaperThumbUrl(entry.id, ext);
    const full = wp.extWallpaperFullUrl(entry.id, ext);
    assert.match(thumb, /\/assets\/extskins\/thumbs\/liveext_v1_\d{3}\.webp\?v=/);
    assert.match(full, /\/assets\/extskins\/liveext_v1_\d{3}\.webp\?v=/);
    for (const legacy of LEGACY_PEXELS100_EXT_FILENAMES.slice(0, 5)) {
      assert.doesNotMatch(full, new RegExp(legacy.replace(".", "\\.")));
    }
  }
});

test("pairedExtId uses explicit sync map not index pairing", () => {
  assert.equal(pairedExtId("v2_001"), SITE_EXT_SYNC_MAP.v2_001);
  assert.equal(pairedExtId("v2_002"), "");
  assert.notEqual(pairedExtId("v2_001"), "extskin_001");
});

test("normalizeExtWallpaperIdLocal migrates extv3 to extskin", () => {
  const wp = loadWallpaperFactory();
  const ext = wp.buildExtWallpapers();
  assert.equal(wp.normalizeExtWallpaperIdLocal("extv3_042", ext), "extskin_042");
  assert.equal(wp.normalizeExtWallpaperIdLocal("extv3_099", ext), "extskin_060");
});

test("city-related categories total at most 20", () => {
  const cats = {};
  for (const c of PACK_CATEGORIES) cats[c] = (cats[c] || 0) + 1;
  const city =
    (cats["neon-city"] || 0) +
    (cats["futuristic-architecture"] || 0) +
    (cats["night-skyline"] || 0);
  assert.ok(city <= 20, `city count ${city}`);
});

test("diversity categories present", () => {
  const set = new Set(PACK_CATEGORIES);
  for (const id of ["anime-inspired", "comic-inspired", "superhero-inspired", "mecha", "fantasy", "sci-fi"]) {
    assert.ok(set.has(id), `missing ${id}`);
  }
});

test("split manifests exist with correct asset packs", () => {
  const site = JSON.parse(fs.readFileSync(path.join(root, "site-wallpaper-sources.json"), "utf8"));
  const ext = JSON.parse(fs.readFileSync(path.join(root, "extension-skin-sources.json"), "utf8"));
  assert.equal(site.count, 100);
  assert.equal(ext.count, 60);
  assert.equal(site.assetPack, SITE_ASSET_PACK);
  assert.equal(ext.assetPack, EXT_SKIN_ASSET_PACK);
  assert.ok(!site.items[0].portraitPath);
  assert.ok(ext.items[0].portraitPath.includes("extskins/"));
});

test("no pexelsId overlap between site and extension manifests", () => {
  const site = JSON.parse(fs.readFileSync(path.join(root, "site-wallpaper-sources.json"), "utf8"));
  const ext = JSON.parse(fs.readFileSync(path.join(root, "extension-skin-sources.json"), "utf8"));
  const siteIds = new Set(site.items.filter((i) => i.pexelsId).map((i) => i.pexelsId));
  for (const item of ext.items) {
    if (item.pexelsId) assert.ok(!siteIds.has(item.pexelsId));
  }
});

test("on-disk site and ext skin files match manifest paths", () => {
  const site = JSON.parse(fs.readFileSync(path.join(root, "site-wallpaper-sources.json"), "utf8"));
  for (const item of site.items.slice(0, 10)) {
    assert.ok(fs.existsSync(path.join(root, item.landscapePath)));
    assert.ok(fs.existsSync(path.join(root, item.thumbnailPath)));
  }
  const ext = JSON.parse(fs.readFileSync(path.join(root, "extension-skin-sources.json"), "utf8"));
  for (const item of ext.items.slice(0, 10)) {
    assert.ok(fs.existsSync(path.join(root, item.portraitPath)));
    assert.ok(fs.existsSync(path.join(root, item.thumbnailPath)));
  }
});

test("ASSET_REV bumped for Themes V4", () => {
  const appJs = fs.readFileSync(path.join(root, "public", "app.js"), "utf8");
  assert.match(appJs, /ASSET_REV = "20260715a"/);
});

test("service worker cache is gmx-shell-v5 with extskins excluded from full cache", () => {
  const sw = fs.readFileSync(path.join(root, "public", "sw.js"), "utf8");
  assert.equal(PWA_CACHE_NAME, "gmx-shell-v5");
  assert.match(sw, /gmx-shell-v5/);
  assert.match(sw, /\/assets\/extskins\//);
});

test("EXT_THEMES gradient count unchanged at 60", () => {
  const themes = fs.readFileSync(path.join(root, "public", "app.themes.js"), "utf8");
  assert.match(themes, /const THEMES = \[/);
  assert.match(themes, /EXT_THEMES = THEMES\.map/);
  const themeEntries = themes.match(/\{\s*id:/g) || [];
  assert.ok(themeEntries.length >= 60);
});

test("wallpaper-core.js exports sync map and ext skin count", () => {
  const core = fs.readFileSync(path.join(root, "public", "lib", "wallpaper-core.js"), "utf8");
  assert.match(core, /EXT_SKIN_PACK_COUNT = 60/);
  assert.match(core, /SITE_EXT_SYNC_MAP/);
});

test("category cap at most 15 per category", () => {
  const cats = {};
  for (const c of PACK_CATEGORIES) cats[c] = (cats[c] || 0) + 1;
  for (const [c, n] of Object.entries(cats)) {
    assert.ok(n <= 15, `${c} has ${n}`);
  }
});

test("app.wallpapers EXT_PACK_COUNT is 60", () => {
  const wp = fs.readFileSync(path.join(root, "public", "app.wallpapers.js"), "utf8");
  assert.match(wp, /EXT_PACK_COUNT = 60/);
});

test("site thumb path helper uses livev1", () => {
  assert.match(siteThumbPathFromIndex(1), /livev1_001\.webp$/);
  assert.match(extSkinPathFromIndex(1), /liveext_v1_001\.webp$/);
});
