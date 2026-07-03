#!/usr/bin/env node
/** RCA regressions: safe wallpaper loading + deploy budget + SW cache policy. */
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import {
  isSwCacheableAssetPath,
  isWallpaperFullAssetPath,
} from "../tools/lib/pwa-shell-core.mjs";
import {
  wallpaperDeployFootprint,
  WALLPAPER_DEPLOY_BUDGET_BYTES,
  WALLPAPER_PACK_DEPLOY_BUDGET_BYTES,
} from "../tools/lib/wallpaper-deploy-budget.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("fail-before: wallpaper rollout sw policy cached full-size assets", () => {
  const oldCore = execSync("git show 7bf13a6:tools/lib/pwa-shell-core.mjs", { encoding: "utf8" });
  assert.doesNotMatch(oldCore, /isWallpaperFullAssetPath/);
  assert.match(oldCore, /path\.startsWith\("\/assets\/"\)/);
});

test("service worker excludes full wallpaper assets from runtime cache", () => {
  const sw = fs.readFileSync(path.join(root, "public", "sw.js"), "utf8");
  assert.match(sw, /isWallpaperFullAsset/);
  assert.match(sw, /thumbs/);
  assert.doesNotMatch(sw, /cache\.addAll\(\[.*wallpapers/s);
});

test("pwa cache policy keeps thumbnails cacheable but not full wallpapers", () => {
  assert.equal(isWallpaperFullAssetPath("/assets/wallpapers/v2_001.webp"), true);
  assert.equal(isWallpaperFullAssetPath("/assets/wallpapers/thumbs/v2_001.webp"), false);
  assert.equal(isWallpaperFullAssetPath("/assets/extbg/extv3_001.webp"), true);
  assert.equal(isWallpaperFullAssetPath("/assets/extbg/thumbs/extv3_001.webp"), false);
  assert.equal(isSwCacheableAssetPath("/assets/wallpapers/v2_001.webp"), false);
  assert.equal(isSwCacheableAssetPath("/assets/wallpapers/thumbs/v2_001.webp"), true);
});

test("production catalog count matches wallpaper-core pack", () => {
  const core = fs.readFileSync(path.join(root, "tools", "lib", "wallpaper-core.mjs"), "utf8");
  const m = core.match(/WALLPAPER_PACK_COUNT = (\d+)/);
  assert.ok(m, "WALLPAPER_PACK_COUNT missing");
  const count = Number(m[1]);
  const wp = fs.readFileSync(path.join(root, "public", "app.wallpapers.js"), "utf8");
  assert.match(wp, new RegExp(`SITE_PACK_COUNT = ${count}`));
  assert.match(wp, new RegExp(`EXT_PACK_COUNT = ${count}`));
});

test("fail-before: 100-wallpaper deploy footprint exceeded safe budget", () => {
  const rolled = wallpaperDeployFootprint("b94da52");
  const rollout = wallpaperDeployFootprint("7bf13a6");
  assert.ok(rolled.totalBytes < WALLPAPER_DEPLOY_BUDGET_BYTES);
  assert.ok(rollout.totalBytes > WALLPAPER_DEPLOY_BUDGET_BYTES);
  assert.ok(rollout.wallpapers.bytes > WALLPAPER_PACK_DEPLOY_BUDGET_BYTES);
  assert.ok(rollout.totalBytes - rolled.totalBytes > 15 * 1024 * 1024);
});

test("app bootstrap builds wallpaper catalog without source manifest import", () => {
  const app = fs.readFileSync(path.join(root, "public", "app.js"), "utf8");
  assert.doesNotMatch(app, /wallpaper-sources\.json/);
  const wpWire = fs.readFileSync(path.join(root, "public", "app.wallpaperswire.js"), "utf8");
  assert.match(wpWire, /buildSiteWallpapers/);
});

test("selector uses lazy thumbnail backgrounds not immediate full URLs", () => {
  const ui = fs.readFileSync(path.join(root, "public", "app.wallpaperui.js"), "utf8");
  assert.match(ui, /data-bg/);
  assert.match(ui, /observeLazyBg/);
  assert.match(ui, /wallpaperThumbUrl/);
  assert.doesNotMatch(ui, /thumb\.style\.backgroundImage\s*=\s*`url\('\$\{fullUrl\}'\)`/);
});
