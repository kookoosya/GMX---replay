import { readFileSync } from "fs";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";
import test from "node:test";
import assert from "node:assert/strict";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

function loadFactory(file, exportName) {
  const code = readFileSync(path.join(root, "public", file), "utf8");
  const fn = new Function("window", `${code}; return window.${exportName};`);
  const win = {};
  return fn(win);
}

function loadUnlock(ctx) {
  const factory = loadFactory("app.unlock.js", "__GMXUnlockFactory");
  return factory(ctx);
}

test("unlock: free tier refs unlock progression", () => {
  const unlock = loadUnlock({ isPro: () => false, getRefCount: () => 9 });
  assert.equal(unlock.reqRefsForUnlockIndex(7, 8), 0);
  assert.equal(unlock.reqRefsForUnlockIndex(8, 8), 3);
  assert.equal(unlock.unlockedCountByRefs(20, 8), 11);
  assert.equal(unlock.formatUnlockMeter(11, 20), "11/20");
});

test("unlock: pro bypasses referral gates", () => {
  const unlock = loadUnlock({ isPro: () => true, getRefCount: () => 0 });
  assert.equal(unlock.unlockedCountByRefs(60, 8), 60);
  assert.equal(unlock.formatUnlockMeter(3, 60), "All");
});

test("wallpapers: catalog and url helpers", () => {
  const factory = loadFactory("app.wallpapers.js", "__GMXWallpapersFactory");
  const wp = factory({
    getAssetRev: () => "rev1",
    getSiteCustomUpload: () => "",
    getExtCustomUpload: () => "",
  });
  const site = wp.buildSiteWallpapers();
  assert.equal(site.length, 58);
  assert.equal(site[0].id, "v2_001");
  assert.equal(wp.normalizeWallpaperId("w12", site), "v2_001");
  assert.match(wp.wallpaperFullUrl("v2_001", site), /\/assets\/wallpapers\/v2_001\.webp\?v=rev1$/);
  const ext = wp.buildExtWallpapers();
  assert.equal(ext[0].id, "extv3_01");
  assert.equal(wp.normalizeExtWallpaperIdLocal("ext_3", ext), "extv3_03");
});
