import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  WALLPAPER_CURATED_INDICES,
  pairedExtId,
  pairedSiteId,
  filterWallpaperEntries,
  groupWallpaperEntries,
  bucketWallpaperEntry,
} from "../tools/lib/wallpaper-core.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("wallpaper core pairs site and extension pack ids", () => {
  assert.equal(pairedExtId("v2_012"), "extv3_012");
  assert.equal(pairedSiteId("extv3_005"), "v2_005");
  assert.equal(WALLPAPER_CURATED_INDICES.length, 34);
});

test("wallpaper core filters featured picks and groups buckets", () => {
  const entries = [
    { wp: { id: "custom_a.png", tier: "custom" }, idx: 0, bucket: "custom" },
    { wp: { id: "v2_001", tier: "free" }, idx: 1, bucket: "free" },
    { wp: { id: "v2_099", tier: "premium" }, idx: 2, bucket: "locked" },
  ];
  const featured = filterWallpaperEntries(entries, "featured", (wp) =>
    Number(String(wp.id).replace(/^v2_/, "")) || 0
  );
  assert.equal(featured.length, 2);
  assert.ok(bucketWallpaperEntry({ tier: "custom" }, 0, 1, { freeVisible: 10, isUnlocked: () => true }) === "custom");
  const groups = groupWallpaperEntries(entries);
  assert.deepEqual(
    groups.map((g) => g.id),
    ["custom", "free", "locked"]
  );
});

test("site wallpaper ui uses grouped grid and extension sync", () => {
  const html = fs.readFileSync(path.join(root, "public", "app.html"), "utf8");
  const src = fs.readFileSync(path.join(root, "public", "app.wallpaperui.js"), "utf8");
  assert.match(html, /id="wpFilter"/);
  assert.match(html, /id="wpSyncExt"/);
  assert.match(src, /GMXWallpaperCore/);
  assert.match(src, /renderGroupedWallpapers/);
  assert.match(src, /__gmxApplyPairedExtWallpaper/);
});

test("extension wallpaper ui uses grouped grid and shared filter", () => {
  const html = fs.readFileSync(path.join(root, "public", "app.html"), "utf8");
  const src = fs.readFileSync(path.join(root, "public", "app.extwallpaperui.js"), "utf8");
  assert.match(html, /id="extWpFilter"/);
  assert.match(src, /GMXWallpaperCore/);
  assert.match(src, /wpGroupSection/);
});

test("site wallpaper ui passes unlock state from entry to card builder", () => {
  const src = fs.readFileSync(path.join(root, "public", "app.wallpaperui.js"), "utf8");
  assert.match(src, /function buildWpCard\(\{ wp, idx, mainIdx, isUnlocked \}/);
});

test("wallpaper core lib is served for prod shell", () => {
  const lib = fs.readFileSync(path.join(root, "public", "lib", "wallpaper-core.js"), "utf8");
  assert.match(lib, /GMXWallpaperCore/);
  assert.match(lib, /pairedExtId/);
});
