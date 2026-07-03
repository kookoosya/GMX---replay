#!/usr/bin/env node
/** Emit Themes V5 paths, counts, and wallpaper-core.js to public bundles. */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PACK_NAMES, WALLPAPER_PACK_COUNT, PACK_CATEGORIES } from "./lib/wallpaper-curated-catalog.mjs";
import { EXT_SKIN_NAMES, EXT_SKIN_PACK_COUNT } from "./lib/extension-skin-catalog.mjs";
import {
  WALLPAPER_CURATED_INDICES,
  WALLPAPER_FILTER_OPTIONS,
  SITE_EXT_SYNC_MAP,
} from "./lib/wallpaper-core.mjs";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const ASSET_REV = "20260705a";

function patchAppWallpapers(file) {
  let src = fs.readFileSync(file, "utf8");
  src = src.replace(/const SITE_PACK_COUNT = \d+;/, `const SITE_PACK_COUNT = ${WALLPAPER_PACK_COUNT};`);
  src = src.replace(/const EXT_PACK_COUNT = \d+;/, `const EXT_PACK_COUNT = ${EXT_SKIN_PACK_COUNT};`);
  src = src.replace(/const EXT_PACK_NAMES = \[[\s\S]*?\];/, `const EXT_PACK_NAMES = ${JSON.stringify(EXT_SKIN_NAMES, null, 2)};`);
  src = src.replace(/const SITE_PACK_NAMES = [\s\S]*?;/, `const SITE_PACK_NAMES = ${JSON.stringify(PACK_NAMES, null, 2)};`);

  src = src.replace(
    /function sitePackAssetFile\(id\) \{[\s\S]*?\n    \}/,
    `function sitePackAssetFile(id) {
      const m = String(id || "").match(/^v2_(\\d+)$/i);
      if (!m) return "";
      return \`sitev5_\${String(Number(m[1])).padStart(3, "0")}.webp\`;
    }`
  );

  src = src.replace(
    /function extPackAssetFile\(id\) \{[\s\S]*?\n    \}/,
    `function extPackAssetFile(id) {
      let m = String(id || "").match(/^extskin_(\\d+)$/i);
      if (!m) m = String(id || "").match(/^extv3_(\\d+)$/i);
      if (!m) return "";
      const n = Math.max(1, Math.min(EXT_PACK_COUNT, Number(m[1]) || 1));
      return \`extskin_v5_\${String(n).padStart(3, "0")}.webp\`;
    }`
  );

  src = src.replace(/sitev4_/g, "sitev5_");
  src = src.replace(/extskin_v4_/g, "extskin_v5_");

  fs.writeFileSync(file, src, "utf8");
  console.log("patched", path.relative(ROOT, file));
}

function writeWallpaperCoreJs(file) {
  const content = `(function (global) {
  if (global.GMXWallpaperCore) return;

  const WALLPAPER_PACK_COUNT = ${WALLPAPER_PACK_COUNT};
  const EXT_SKIN_PACK_COUNT = ${EXT_SKIN_PACK_COUNT};
  const SITE_EXT_SYNC_MAP = ${JSON.stringify(SITE_EXT_SYNC_MAP, null, 2)};
  const PACK_CATEGORIES = ${JSON.stringify(PACK_CATEGORIES)};
  const WALLPAPER_CURATED_INDICES = [${WALLPAPER_CURATED_INDICES.join(", ")}];
  const WALLPAPER_GROUP_ORDER = ["custom", "free", "unlocked", "locked"];
  const WALLPAPER_FILTER_OPTIONS = ${JSON.stringify(WALLPAPER_FILTER_OPTIONS, null, 2)};

  function formatExtSkinId(n) {
    const num = Math.max(1, Math.min(EXT_SKIN_PACK_COUNT, Number(n) || 1));
    return "extskin_" + String(num).padStart(3, "0");
  }
  function packIndexFromSiteId(id) {
    const m = String(id || "").match(/^v2_(\\d+)$/i);
    return m ? Number(m[1]) || 0 : 0;
  }
  function packIndexFromExtSkinId(id) {
    let m = String(id || "").match(/^extskin_(\\d+)$/i);
    if (m) return Number(m[1]) || 0;
    m = String(id || "").match(/^extv3_(\\d+)$/i);
    if (m) return Math.max(1, Math.min(EXT_SKIN_PACK_COUNT, Number(m[1]) || 1));
    return 0;
  }
  function pairedExtId(siteId) { return SITE_EXT_SYNC_MAP[String(siteId || "")] || ""; }
  function pairedSiteId(extId) {
    const id = String(extId || "");
    for (const key in SITE_EXT_SYNC_MAP) { if (SITE_EXT_SYNC_MAP[key] === id) return key; }
    return "";
  }
  function isCuratedPackIndex(n) { return WALLPAPER_CURATED_INDICES.indexOf(Number(n) || 0) >= 0; }
  function bucketWallpaperEntry(wp, idx, effectiveCustomLen, opts) {
    const freeVisible = Number((opts && opts.freeVisible) || 0) || 8;
    const isUnlocked = opts && typeof opts.isUnlocked === "function" ? opts.isUnlocked(wp, idx) : false;
    if (wp && wp.tier === "custom") return "custom";
    const mainIdx = idx - effectiveCustomLen;
    if (mainIdx >= 0 && mainIdx < freeVisible) return "free";
    if (isUnlocked) return "unlocked";
    return "locked";
  }
  function packCategoryForIndex(n) {
    const idx = Number(n) - 1;
    return idx >= 0 && idx < PACK_CATEGORIES.length ? PACK_CATEGORIES[idx] : "";
  }
  function filterWallpaperEntries(entries, filterId, packIndexOf) {
    const filter = String(filterId || "featured").toLowerCase();
    const idxOf = typeof packIndexOf === "function" ? packIndexOf : function (wp) { return packIndexFromSiteId(wp && wp.id); };
    if (filter === "all") return entries;
    if (filter === "featured") return entries.filter(function (e) {
      if (e.bucket === "custom") return true;
      const n = idxOf(e.wp); return n > 0 && isCuratedPackIndex(n);
    });
    if (filter === "free") return entries.filter(function (e) { return e.bucket === "free" || e.bucket === "custom"; });
    if (filter === "mine") return entries.filter(function (e) { return e.bucket === "custom" || e.bucket === "free" || e.bucket === "unlocked"; });
    return entries.filter(function (e) {
      if (e.bucket === "custom") return false;
      const n = idxOf(e.wp); return n > 0 && packCategoryForIndex(n) === filter;
    });
  }
  function groupWallpaperEntries(entries) {
    const groups = WALLPAPER_GROUP_ORDER.map(function (id) { return { id: id, labelKey: "wp_group_" + id, items: [] }; });
    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      const group = groups.find(function (g) { return g.id === entry.bucket; });
      if (group) group.items.push(entry);
    }
    return groups.filter(function (g) { return g.items.length > 0; });
  }

  global.GMXWallpaperCore = {
    WALLPAPER_PACK_COUNT: WALLPAPER_PACK_COUNT,
    EXT_SKIN_PACK_COUNT: EXT_SKIN_PACK_COUNT,
    SITE_EXT_SYNC_MAP: SITE_EXT_SYNC_MAP,
    WALLPAPER_CURATED_INDICES: WALLPAPER_CURATED_INDICES,
    WALLPAPER_GROUP_ORDER: WALLPAPER_GROUP_ORDER,
    WALLPAPER_FILTER_OPTIONS: WALLPAPER_FILTER_OPTIONS,
    formatExtSkinId: formatExtSkinId,
    formatExtPackId: formatExtSkinId,
    packIndexFromSiteId: packIndexFromSiteId,
    packIndexFromExtId: packIndexFromExtSkinId,
    packIndexFromExtSkinId: packIndexFromExtSkinId,
    pairedExtId: pairedExtId,
    pairedSiteId: pairedSiteId,
    isCuratedPackIndex: isCuratedPackIndex,
    bucketWallpaperEntry: bucketWallpaperEntry,
    packCategoryForIndex: packCategoryForIndex,
    filterWallpaperEntries: filterWallpaperEntries,
    groupWallpaperEntries: groupWallpaperEntries,
  };
})(window);
`;
  fs.writeFileSync(file, content, "utf8");
  console.log("patched", path.relative(ROOT, file));
}

function bumpRevAndSw() {
  for (const rel of ["site-src/00-bootstrap.js", "public/app.js", "frontend/public/app.js", "extension/lib/ext-config.js"]) {
    const file = path.join(ROOT, rel);
    if (!fs.existsSync(file)) continue;
    let src = fs.readFileSync(file, "utf8");
    if (rel.includes("ext-config")) src = src.replace(/ASSET_REV: "[^"]+"/, `ASSET_REV: "${ASSET_REV}"`);
    else src = src.replace(/const ASSET_REV = "[^"]+";/, `const ASSET_REV = "${ASSET_REV}";`);
    fs.writeFileSync(file, src, "utf8");
  }
  for (const rel of ["public/sw.js", "frontend/public/sw.js"]) {
    let src = fs.readFileSync(path.join(ROOT, rel), "utf8");
    src = src.replace(/const CACHE = "gmx-shell-v\d+"/, 'const CACHE = "gmx-shell-v5"');
    if (!src.includes("gmx-shell-v4")) {
      src = src.replace(/const LEGACY_CACHES = \[/, 'const LEGACY_CACHES = ["gmx-shell-v4", ');
    }
    fs.writeFileSync(path.join(ROOT, rel), src, "utf8");
  }
  const pwaCore = path.join(ROOT, "tools", "lib", "pwa-shell-core.mjs");
  fs.writeFileSync(
    pwaCore,
    fs.readFileSync(pwaCore, "utf8").replace(/gmx-shell-v4/g, "gmx-shell-v5"),
    "utf8"
  );
}

for (const rel of ["public/app.wallpapers.js", "frontend/public/app.wallpapers.js"]) {
  patchAppWallpapers(path.join(ROOT, rel));
}
for (const rel of ["public/lib/wallpaper-core.js", "frontend/public/lib/wallpaper-core.js"]) {
  writeWallpaperCoreJs(path.join(ROOT, rel));
}
bumpRevAndSw();
console.log(`emit-themes-v5 OK (site ${WALLPAPER_PACK_COUNT}, ext skins ${EXT_SKIN_PACK_COUNT}, rev ${ASSET_REV})`);
