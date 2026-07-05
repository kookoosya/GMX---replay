/**
 * Wallpaper visual delivery — Themes V4 sitev4 / extskin_v4 paths.
 */
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import {
  WALLPAPER_PACK_COUNT,
  SITE_ASSET_PACK,
  LEGACY_PEXELS100_SITE_FILENAMES,
  LEGACY_PEXELS100_EXT_FILENAMES,
  siteThumbPathFromIndex,
  pairedExtId,
  SITE_EXT_SYNC_MAP,
} from "../tools/lib/wallpaper-core.mjs";
import { PWA_CACHE_NAME } from "../tools/lib/pwa-shell-core.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PROD = "https://gmxreply.com";
const SAMPLE = 20;

function sha256(buf) {
  return crypto.createHash("sha256").update(buf).digest("hex");
}

function gitBlobAt(commit, rel) {
  return execSync(`git show ${commit}:${rel}`, { encoding: "buffer", maxBuffer: 20 * 1024 * 1024 });
}

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

test("active catalog URLs use sitev4 and extskin_v4 not legacy packs", () => {
  const wp = loadWallpaperFactory();
  const catalog = wp.buildSiteWallpapers();
  const extCatalog = wp.buildExtWallpapers();
  for (const entry of catalog.slice(0, 20)) {
    const thumb = wp.wallpaperThumbUrl(entry.id, catalog);
    const full = wp.wallpaperFullUrl(entry.id, catalog);
    assert.match(thumb, /\/assets\/wallpapers\/thumbs\/livev1_\d{3}\.webp\?v=/);
    assert.match(full, /\/assets\/wallpapers\/livev1_\d{3}\.webp\?v=/);
    for (const legacy of LEGACY_PEXELS100_SITE_FILENAMES) {
      assert.doesNotMatch(thumb, new RegExp(legacy.replace(".", "\\.")));
    }
  }
  for (const entry of extCatalog.slice(0, 10)) {
    const extThumb = wp.extWallpaperThumbUrl(entry.id, extCatalog);
    const extFull = wp.extWallpaperFullUrl(entry.id, extCatalog);
    assert.match(extThumb, /\/assets\/extskins\/thumbs\/liveext_v1_\d{3}\.webp\?v=/);
    assert.match(extFull, /\/assets\/extskins\/liveext_v1_\d{3}\.webp\?v=/);
    for (const legacy of LEGACY_PEXELS100_EXT_FILENAMES) {
      assert.doesNotMatch(extFull, new RegExp(legacy.replace(".", "\\.")));
    }
  }
});

test("sync map drives pairedExtId for mapped site ids only", () => {
  assert.equal(pairedExtId("v2_001"), SITE_EXT_SYNC_MAP.v2_001);
  assert.equal(pairedExtId("v2_050"), SITE_EXT_SYNC_MAP.v2_050);
});

test("site manifest paths match on-disk sitev4 assets", () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(root, "site-wallpaper-sources.json"), "utf8"));
  assert.equal(manifest.assetPack, SITE_ASSET_PACK);
  for (const item of manifest.items.slice(0, 30)) {
    assert.ok(fs.existsSync(path.join(root, item.landscapePath)), item.landscapePath);
    assert.ok(fs.existsSync(path.join(root, item.thumbnailPath)), item.thumbnailPath);
  }
});

test("service worker cache version bumped for Themes V4", () => {
  const sw = fs.readFileSync(path.join(root, "public", "sw.js"), "utf8");
  assert.equal(PWA_CACHE_NAME, "gmx-shell-v5");
  assert.match(sw, /const CACHE = "gmx-shell-v5"/);
});

test("production thumbnail bytes match git when served (no-store)", { skip: process.env.GMX_PROD_WALLPAPER_VERIFY !== "1" }, async () => {
  const wp = loadWallpaperFactory();
  const catalog = wp.buildSiteWallpapers();
  let mismatches = 0;
  for (let i = 1; i <= SAMPLE; i++) {
    const id = `v2_${String(i).padStart(3, "0")}`;
    const urlPath = wp.wallpaperThumbUrl(id, catalog);
    const rel = siteThumbPathFromIndex(i);
    const gitHash = sha256(fs.readFileSync(path.join(root, rel)));
    const res = await fetch(`${PROD}${urlPath}`, { cache: "no-store", redirect: "follow" });
    if (!res.ok) {
      mismatches++;
      continue;
    }
    const prodHash = sha256(Buffer.from(await res.arrayBuffer()));
    if (prodHash !== gitHash) mismatches++;
  }
  if (mismatches > 0) {
    assert.fail(`production not yet on sitev4 pack (${mismatches}/${SAMPLE} thumb hashes differ; deploy pending)`);
  }
});
