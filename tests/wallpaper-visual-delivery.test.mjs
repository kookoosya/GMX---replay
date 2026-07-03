/**
 * Wallpaper visual delivery — versioned paths, hash parity, no legacy gradient URLs.
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
  WALLPAPER_ASSET_PACK,
  LEGACY_GRADIENT_SITE_FILENAMES,
  LEGACY_GRADIENT_EXT_FILENAMES,
  siteLandscapeFilename,
  siteThumbFilename,
  siteThumbPathFromIndex,
  pairedExtId,
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

test("active catalog URLs use pexels100 versioned filenames not legacy v2_/extv3_ paths", () => {
  const wp = loadWallpaperFactory();
  const catalog = wp.buildSiteWallpapers();
  const extCatalog = wp.buildExtWallpapers();
  for (const entry of catalog) {
    const thumb = wp.wallpaperThumbUrl(entry.id, catalog);
    const full = wp.wallpaperFullUrl(entry.id, catalog);
    const extId = pairedExtId(entry.id);
    const extThumb = wp.extWallpaperThumbUrl(extId, extCatalog);
    const extFull = wp.extWallpaperFullUrl(extId, extCatalog);
    assert.match(thumb, /\/assets\/wallpapers\/thumbs\/pexels100_\d{3}\.webp\?v=/);
    assert.match(full, /\/assets\/wallpapers\/pexels100_\d{3}\.webp\?v=/);
    assert.match(extThumb, /\/assets\/extbg\/thumbs\/pexels100_portrait_\d{3}\.webp\?v=/);
    assert.match(extFull, /\/assets\/extbg\/pexels100_portrait_\d{3}\.webp\?v=/);
    for (const legacy of LEGACY_GRADIENT_SITE_FILENAMES) {
      assert.doesNotMatch(thumb, new RegExp(legacy.replace(".", "\\.")));
      assert.doesNotMatch(full, new RegExp(legacy.replace(".", "\\.")));
    }
    for (const legacy of LEGACY_GRADIENT_EXT_FILENAMES) {
      assert.doesNotMatch(extThumb, new RegExp(legacy.replace(".", "\\.")));
      assert.doesNotMatch(extFull, new RegExp(legacy.replace(".", "\\.")));
    }
  }
});

test("committed thumbnails differ from baseline gradient bytes", () => {
  for (let i = 1; i <= SAMPLE; i++) {
    const n = String(i).padStart(3, "0");
    const thumbRel = siteThumbPathFromIndex(i);
    const gitThumb = fs.readFileSync(path.join(root, thumbRel));
    let oldThumb;
    try {
      oldThumb = gitBlobAt("c6c9fa6", `assets/wallpapers/thumbs/v2_${n}.webp`);
    } catch {
      continue;
    }
    assert.notEqual(sha256(gitThumb), sha256(oldThumb), `v2_${n} thumb still matches gradient baseline`);
  }
});

test("manifest derivative paths match on-disk pexels100 assets", () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(root, "wallpaper-sources.json"), "utf8"));
  assert.equal(manifest.assetPack, WALLPAPER_ASSET_PACK);
  for (const item of manifest.items) {
    const land = path.join(root, item.landscapePath);
    const thumb = path.join(root, item.thumbnailPath);
    const port = path.join(root, item.portraitPath);
    assert.ok(fs.existsSync(land), item.landscapePath);
    assert.ok(fs.existsSync(thumb), item.thumbnailPath);
    assert.ok(fs.existsSync(port), item.portraitPath);
    assert.notEqual(sha256(fs.readFileSync(land)), sha256(fs.readFileSync(thumb)), `${item.id} thumb must differ from landscape`);
    assert.notEqual(sha256(fs.readFileSync(land)), sha256(fs.readFileSync(port)), `${item.id} landscape/portrait parity`);
  }
});

test("service worker cache version bumped for wallpaper rollout", () => {
  const sw = fs.readFileSync(path.join(root, "public", "sw.js"), "utf8");
  assert.equal(PWA_CACHE_NAME, "gmx-shell-v3");
  assert.match(sw, /const CACHE = "gmx-shell-v3"/);
});

test("production thumbnail bytes match git when served (no-store)", { skip: process.env.GMX_PROD_WALLPAPER_VERIFY !== "1" }, async () => {
  const wp = loadWallpaperFactory();
  const catalog = wp.buildSiteWallpapers();
  const rev = fs.readFileSync(path.join(root, "public", "app.js"), "utf8").match(/ASSET_REV = "([^"]+)"/)?.[1];
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
    const oldGrad = gitBlobAt("c6c9fa6", `assets/wallpapers/thumbs/v2_${String(i).padStart(3, "0")}.webp`);
    assert.notEqual(prodHash, sha256(oldGrad), `${id} production still serves gradient bytes`);
    if (prodHash !== gitHash) mismatches++;
  }
  if (mismatches > 0) {
    assert.fail(`production not yet on pexels100 pack (${mismatches}/${SAMPLE} thumb hashes differ from git; deploy pending)`);
  }
});

test("legacy v2 thumbnail URLs must not remain on production after deploy", { skip: process.env.GMX_PROD_WALLPAPER_VERIFY !== "1" }, async () => {
  const res = await fetch(`${PROD}/assets/wallpapers/thumbs/v2_001.webp`, { cache: "no-store" });
  if (res.status === 404) return;
  const body = Buffer.from(await res.arrayBuffer());
  const grad = gitBlobAt("c6c9fa6", "assets/wallpapers/thumbs/v2_001.webp");
  if (sha256(body) === sha256(grad)) {
    assert.fail("production still serves legacy gradient at /thumbs/v2_001.webp");
  }
});
