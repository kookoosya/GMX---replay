import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const extDir = path.join(root, "extension");

function loadUnlockCore() {
  const code = fs.readFileSync(path.join(extDir, "lib", "unlock-core.js"), "utf8");
  const fn = new Function("globalThis", `${code}; return globalThis.GMXUnlockCore;`);
  return fn({});
}

function loadCosmeticsGate() {
  const unlockCode = fs.readFileSync(path.join(extDir, "lib", "unlock-core.js"), "utf8");
  const gateCode = fs.readFileSync(path.join(extDir, "lib", "ext-cosmetics-gate.js"), "utf8");
  const fn = new Function(
    "globalThis",
    `${unlockCode}\n${gateCode}\nreturn globalThis.GMXExtCosmeticsGate;`
  );
  return fn({});
}

test("unlock-core: ext free counts match site app.unlock.js", () => {
  const core = loadUnlockCore();
  const siteUnlock = fs.readFileSync(path.join(root, "public", "app.unlock.js"), "utf8");
  assert.equal(core.FREE_VISIBLE_EXT_THEMES, 4);
  assert.equal(core.FREE_VISIBLE_EXT_WALLPAPERS, 6);
  assert.match(siteUnlock, /FREE_VISIBLE_EXT_THEMES\s*=\s*4/);
  assert.match(siteUnlock, /FREE_VISIBLE_EXT_WALLPAPERS\s*=\s*6/);
});

test("unlock-core: referral ladder matches site formula", () => {
  const core = loadUnlockCore();
  assert.equal(core.unlockedCountByRefs(40, 4, 0, false), 4);
  assert.equal(core.unlockedCountByRefs(40, 4, 3, false), 5);
  assert.equal(core.unlockedCountByRefs(40, 4, 24, false), 12);
  assert.equal(core.unlockedCountByRefs(40, 4, 28, false), 13);
  assert.equal(core.unlockedCountByRefs(40, 4, 99, false), 30);
});

test("cosmetics gate: blocks locked ext theme for free user", () => {
  const gate = loadCosmeticsGate();
  const themes = [{ id: "a" }, { id: "b" }, { id: "c" }, { id: "d" }, { id: "e" }];
  assert.equal(gate.isExtThemeUnlocked("a", themes, { isPro: false, refCount: 0 }), true);
  assert.equal(gate.isExtThemeUnlocked("e", themes, { isPro: false, refCount: 0 }), false);
  assert.equal(gate.isExtThemeUnlocked("e", themes, { isPro: true, refCount: 0 }), true);
});

test("cosmetics gate: blocks locked wallpaper for free user", () => {
  const gate = loadCosmeticsGate();
  const options = Array.from({ length: 10 }, (_, i) => ({ id: `w${i}` }));
  assert.equal(gate.isExtWallpaperUnlocked("w0", options, { isPro: false, refCount: 0 }), true);
  assert.equal(gate.isExtWallpaperUnlocked("w9", options, { isPro: false, refCount: 0 }), false);
});

test("cosmetics gate: clamp falls back to first unlocked theme", () => {
  const gate = loadCosmeticsGate();
  const themes = [{ id: "classic" }, { id: "midnight" }, { id: "sunrise" }, { id: "emerald" }, { id: "gold" }];
  const out = gate.clampExtCosmetics(
    { extTheme: "gold", extView: "theme", extWallpaper: "", extCustomBg: "" },
    { themes, wallpaperOptions: [], isPro: false, refCount: 0 }
  );
  assert.equal(out.changed, true);
  assert.equal(out.extTheme, "classic");
});

test("cosmetics gate: clamp clears locked wallpaper view", () => {
  const gate = loadCosmeticsGate();
  const options = Array.from({ length: 10 }, (_, i) => ({ id: `w${i}` }));
  const out = gate.clampExtCosmetics(
    { extTheme: "classic", extView: "wall", extWallpaper: "w9", extCustomBg: "" },
    { themes: [{ id: "classic" }], wallpaperOptions: options, isPro: false, refCount: 0 }
  );
  assert.equal(out.changed, true);
  assert.equal(out.extView, "theme");
  assert.equal(out.extWallpaper, "");
});

test("extension popup loads unlock gate before applyThemeUi", () => {
  const popup = fs.readFileSync(path.join(extDir, "popup.js"), "utf8");
  assert.match(popup, /GMXExtCosmeticsGate/);
  assert.match(popup, /clampExtCosmetics/);
  for (const html of ["popup.html", "quick.html"]) {
    const text = fs.readFileSync(path.join(extDir, html), "utf8");
    assert.match(text, /lib\/unlock-core\.js/);
    assert.match(text, /lib\/ext-cosmetics-gate\.js/);
  }
});
