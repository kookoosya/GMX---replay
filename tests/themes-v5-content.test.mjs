/**
 * Themes V5 content gates — real illustrated catalogs, no fake inspired labels.
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
  siteLandscapeFilename,
  extSkinFilename,
} from "../tools/lib/wallpaper-core.mjs";
import { PACK_CATEGORIES } from "../tools/lib/wallpaper-curated-catalog.mjs";
import { EXT_SKIN_CATEGORIES_LIST } from "../tools/lib/extension-skin-catalog.mjs";
import { PWA_CACHE_NAME } from "../tools/lib/pwa-shell-core.mjs";
import { isGeneratedCategory, hasCharacterCategory } from "../tools/lib/themes-v5-plan.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function countCat(list, id) {
  return list.filter((c) => c === id).length;
}

function loadManifest(name) {
  return JSON.parse(fs.readFileSync(path.join(root, name), "utf8"));
}

function dirSizeBytes(dir, prefix) {
  if (!fs.existsSync(dir)) return 0;
  let total = 0;
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    const st = fs.statSync(p);
    if (st.isDirectory()) total += dirSizeBytes(p, prefix);
    else if (name.endsWith(".webp") && (!prefix || name.startsWith(prefix))) total += st.size;
  }
  return total;
}

test("active asset packs are sitev5 and extskin_v5 only", () => {
  assert.equal(SITE_ASSET_PACK, "sitev5");
  assert.equal(EXT_SKIN_ASSET_PACK, "extskin_v5");
  const siteDir = path.join(root, "assets", "wallpapers");
  const extDir = path.join(root, "assets", "extskins");
  for (const name of fs.readdirSync(siteDir)) {
    if (name.endsWith(".webp") && !name.startsWith("sitev5_") && !name.startsWith("pexels100_")) {
      assert.fail(`unexpected site asset ${name}`);
    }
    assert.ok(!name.includes("sitev4_"), `active sitev4 file ${name}`);
  }
  for (const name of fs.readdirSync(extDir)) {
    if (name.endsWith(".webp")) assert.ok(!name.includes("extskin_v4_"), `active extskin_v4 ${name}`);
  }
});

test("manifest metadata fields present on every record", () => {
  for (const file of ["site-wallpaper-sources.json", "extension-skin-sources.json"]) {
    const m = loadManifest(file);
    assert.equal(m.version, 5);
    for (const item of m.items) {
      for (const key of [
        "actualContentType",
        "hasCharacter",
        "sourceType",
        "commercialUseVerified",
        "visualReviewVerdict",
        "license",
      ]) {
        assert.ok(key in item, `${file} ${item.id} missing ${key}`);
      }
      assert.equal(item.commercialUseVerified, true);
      assert.equal(item.visualReviewVerdict, "PASS");
    }
  }
});

test("site character/illustrated count >= 45", () => {
  const illustrated = PACK_CATEGORIES.filter((c) => isGeneratedCategory(c)).length;
  assert.ok(illustrated >= 45, `site illustrated ${illustrated}`);
});

test("site crypto count >= 12", () => {
  assert.ok(countCat(PACK_CATEGORIES, "crypto-web3") >= 12);
});

test("site cities <= 15", () => {
  assert.ok(countCat(PACK_CATEGORIES, "city-neon") <= 15);
});

test("extension character skins >= 40", () => {
  const ext = loadManifest("extension-skin-sources.json");
  const chars = ext.items.filter((i) => i.hasCharacter).length;
  assert.ok(chars >= 40, `ext characters ${chars}`);
});

test("extension anime >= 15", () => {
  assert.ok(countCat(EXT_SKIN_CATEGORIES_LIST, "anime-style") >= 15);
});

test("extension comic/superhero >= 15", () => {
  assert.ok(countCat(EXT_SKIN_CATEGORIES_LIST, "superhero-comic") >= 15);
});

test("extension crypto >= 12", () => {
  assert.ok(countCat(EXT_SKIN_CATEGORIES_LIST, "crypto-web3") >= 12);
});

test("anime/comic/superhero records require hasCharacter", () => {
  const site = loadManifest("site-wallpaper-sources.json");
  for (const item of site.items) {
    if (["superhero-comic", "anime-style", "mecha-cyber"].includes(item.category)) {
      assert.equal(item.hasCharacter, true, `${item.id} ${item.category}`);
    }
  }
  const ext = loadManifest("extension-skin-sources.json");
  for (const item of ext.items) {
    if (["superhero-comic", "anime-style", "mecha-cyber"].includes(item.category)) {
      assert.equal(item.hasCharacter, true, `${item.id}`);
    }
  }
});

test("crypto records have brand metadata", () => {
  const site = loadManifest("site-wallpaper-sources.json");
  for (const item of site.items.filter((i) => i.category === "crypto-web3")) {
    assert.ok(item.actualContentType.includes("crypto"), item.id);
    assert.ok(item.sourceType, item.id);
  }
});

test("no fake inspired category ids in catalogs", () => {
  const banned = ["anime-inspired", "comic-inspired", "superhero-inspired", "mecha", "sci-fi"];
  for (const c of PACK_CATEGORIES) assert.ok(!banned.includes(c), `site banned cat ${c}`);
  for (const c of EXT_SKIN_CATEGORIES_LIST) assert.ok(!banned.includes(c), `ext banned cat ${c}`);
});

test("named franchises require license or are null", () => {
  for (const file of ["site-wallpaper-sources.json", "extension-skin-sources.json"]) {
    for (const item of loadManifest(file).items) {
      if (item.franchise) {
        assert.ok(item.license, `${item.id} franchise without license`);
        assert.equal(item.commercialUseVerified, true);
      }
    }
  }
});

test("no duplicate source pexels IDs in site manifest", () => {
  const site = loadManifest("site-wallpaper-sources.json");
  const ids = site.items.filter((i) => i.pexelsId).map((i) => i.pexelsId);
  assert.equal(new Set(ids).size, ids.length);
});

test("site and extension catalogs independent — no shared pexelsId", () => {
  const site = loadManifest("site-wallpaper-sources.json");
  const ext = loadManifest("extension-skin-sources.json");
  const siteIds = new Set(site.items.filter((i) => i.pexelsId).map((i) => i.pexelsId));
  for (const item of ext.items) {
    if (item.pexelsId) assert.ok(!siteIds.has(item.pexelsId));
  }
});

test("100 site + 60 extension cards", () => {
  assert.equal(WALLPAPER_PACK_COUNT, 100);
  assert.equal(EXT_SKIN_PACK_COUNT, 60);
  assert.equal(loadManifest("site-wallpaper-sources.json").items.length, 100);
  assert.equal(loadManifest("extension-skin-sources.json").items.length, 60);
});

test("active URLs in runtime use sitev5 / extskin_v5", () => {
  const wp = fs.readFileSync(path.join(root, "public", "app.wallpapers.js"), "utf8");
  assert.match(wp, /sitev5_/);
  assert.match(wp, /extskin_v5_/);
  assert.doesNotMatch(wp, /sitev4_\d{3}/);
  assert.doesNotMatch(wp, /extskin_v4_\d{3}/);
});

test("ASSET_REV and SW cache bumped for V5", () => {
  const appJs = fs.readFileSync(path.join(root, "public", "app.js"), "utf8");
  assert.match(appJs, /ASSET_REV = "20260705a"/);
  assert.equal(PWA_CACHE_NAME, "gmx-shell-v5");
  const sw = fs.readFileSync(path.join(root, "public", "sw.js"), "utf8");
  assert.match(sw, /gmx-shell-v5/);
});

test("size budgets — site <= 30MB, ext <= 16MB", () => {
  const siteBytes =
    dirSizeBytes(path.join(root, "assets", "wallpapers"), "sitev5_") +
    dirSizeBytes(path.join(root, "assets", "wallpapers", "thumbs"), "sitev5_");
  const extBytes =
    dirSizeBytes(path.join(root, "assets", "extskins"), "extskin_v5_") +
    dirSizeBytes(path.join(root, "assets", "extskins", "thumbs"), "extskin_v5_");
  assert.ok(siteBytes <= 30 * 1024 * 1024, `site ${siteBytes}`);
  assert.ok(extBytes <= 16 * 1024 * 1024, `ext ${extBytes}`);
  assert.ok(siteBytes + extBytes <= 46 * 1024 * 1024);
});

test("on-disk filenames match manifest paths", () => {
  for (let i = 1; i <= 100; i++) {
    assert.ok(fs.existsSync(path.join(root, "assets", "wallpapers", siteLandscapeFilename(i))));
  }
  for (let i = 1; i <= 60; i++) {
    assert.ok(fs.existsSync(path.join(root, "assets", "extskins", extSkinFilename(i))));
  }
});

test("EXT_THEMES gradient count unchanged at 60", () => {
  const themes = fs.readFileSync(path.join(root, "public", "app.themes.js"), "utf8");
  assert.match(themes, /EXT_THEMES = THEMES\.map/);
});

test("photo categories are not labeled as character art in actualContentType", () => {
  const site = loadManifest("site-wallpaper-sources.json");
  for (const item of site.items) {
    if (["city-neon", "nature", "space", "abstract-minimal"].includes(item.category)) {
      assert.ok(item.actualContentType.includes("photography") || item.actualContentType.includes("abstract"), item.id);
      assert.equal(item.hasCharacter, false, item.id);
    }
  }
});

test("generated categories use original character flag", () => {
  const site = loadManifest("site-wallpaper-sources.json");
  for (const item of site.items) {
    if (hasCharacterCategory(item.category)) {
      assert.equal(item.character, "original", item.id);
      assert.ok(
        item.sourceType === "generated" || item.sourceType === "generated-brand-composition",
        item.id
      );
    }
  }
});
