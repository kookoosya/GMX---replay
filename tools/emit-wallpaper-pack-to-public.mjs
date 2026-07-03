#!/usr/bin/env node
/** Sync wallpaper pack count + names from catalog into public JS modules. */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PACK_NAMES, WALLPAPER_PACK_COUNT, PACK_CATEGORIES } from "./lib/wallpaper-pexels-catalog.mjs";
import {
  WALLPAPER_CURATED_INDICES,
  WALLPAPER_PACK_COUNT as CORE_COUNT,
  WALLPAPER_FILTER_OPTIONS,
  formatExtPackId,
} from "./lib/wallpaper-core.mjs";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

if (CORE_COUNT !== WALLPAPER_PACK_COUNT) {
  throw new Error("pack count mismatch between catalog and wallpaper-core");
}

function patchAppWallpapers(file) {
  let src = fs.readFileSync(file, "utf8");
  src = src.replace(/const SITE_PACK_COUNT = \d+;/, `const SITE_PACK_COUNT = ${WALLPAPER_PACK_COUNT};`);
  src = src.replace(/const EXT_PACK_COUNT = \d+;/, `const EXT_PACK_COUNT = ${WALLPAPER_PACK_COUNT};`);
  const namesBlock = `const EXT_PACK_NAMES = ${JSON.stringify(PACK_NAMES, null, 2)};`;
  src = src.replace(/const EXT_PACK_NAMES = \[[\s\S]*?\];/, namesBlock);
  src = src.replace(
    /id: `extv3_\$\{String\(i\)\.padStart\(2, "0"\)\}`/,
    'id: `extv3_${String(i).padStart(3, "0")}`'
  );
  src = src.replace(
    /let m = v\.match\(\/\^extv3_\(\\d\{1,2\}\)\$\/i\);\s*if \(m\) \{\s*const n = String\(Math\.max\(1, Math\.min\(58, Number\(m\[1\]\) \|\| 1\)\)\)\.padStart\(2, "0"\);\s*return `extv3_\$\{n\}`;\s*\}/,
    `let m = v.match(/^extv3_(\\d{1,3})$/i);
      if (m) {
        return formatExtPackIdLocal(Number(m[1]) || 1);
      }`
  );
  if (!src.includes("function formatExtPackIdLocal")) {
    src = src.replace(
      /function normalizeExtWallpaperIdLocal/,
      `function formatExtPackIdLocal(n) {
      const num = Math.max(1, Math.min(${WALLPAPER_PACK_COUNT}, Number(n) || 1));
      return \`extv3_\${String(num).padStart(3, "0")}\`;
    }

    function normalizeExtWallpaperIdLocal`
    );
  }
  src = src.replace(
    /const num = Math\.max\(1, Math\.min\(58, Number\(m\[1\]\) \|\| 1\)\);\s*return `extv3_\$\{String\(num\)\.padStart\(2, "0"\)\}`;/,
    "return formatExtPackIdLocal(Number(m[1]) || 1);"
  );
  src = src.replace(/return "extv3_01";/g, 'return "extv3_001";');
  src = src.replace(
    /return `\/assets\/extbg\/thumbs\/extv3_01\.webp/,
    "return `/assets/extbg/thumbs/extv3_001.webp"
  );
  fs.writeFileSync(file, src, "utf8");
  console.log("patched", path.relative(ROOT, file));
}

function patchWallpaperCoreJs(file) {
  const curated = WALLPAPER_CURATED_INDICES.join(", ");
  const js = `(function (global) {
  if (global.GMXWallpaperCore) return;

  const WALLPAPER_PACK_COUNT = ${WALLPAPER_PACK_COUNT};

  const WALLPAPER_CURATED_INDICES = [
    ${curated},
  ];

  const WALLPAPER_GROUP_ORDER = ["custom", "free", "unlocked", "locked"];

  const WALLPAPER_FILTER_OPTIONS = ${JSON.stringify(WALLPAPER_FILTER_OPTIONS, null, 2)};

  const PACK_CATEGORIES = ${JSON.stringify(PACK_CATEGORIES, null, 2)};

  function formatExtPackId(n) {
    const num = Math.max(1, Math.min(WALLPAPER_PACK_COUNT, Number(n) || 1));
    return "extv3_" + String(num).padStart(3, "0");
  }

  function packIndexFromSiteId(id) {
    const m = String(id || "").match(/^v2_(\\d+)$/i);
    return m ? Number(m[1]) || 0 : 0;
  }

  function packIndexFromExtId(id) {
    const m = String(id || "").match(/^extv3_(\\d+)$/i);
    return m ? Number(m[1]) || 0 : 0;
  }

  function pairedExtId(siteId) {
    const n = packIndexFromSiteId(siteId);
    if (!n) return "";
    return formatExtPackId(n);
  }

  function pairedSiteId(extId) {
    const n = packIndexFromExtId(extId);
    if (!n) return "";
    return "v2_" + String(n).padStart(3, "0");
  }

  function isCuratedPackIndex(n) {
    return WALLPAPER_CURATED_INDICES.indexOf(Number(n) || 0) >= 0;
  }

  function bucketWallpaperEntry(wp, idx, effectiveCustomLen, opts) {
    const freeVisible = Number((opts && opts.freeVisible) || 0) || 8;
    const isUnlocked =
      opts && typeof opts.isUnlocked === "function" ? opts.isUnlocked(wp, idx) : false;
    if (wp && wp.tier === "custom") return "custom";
    const mainIdx = idx - effectiveCustomLen;
    if (mainIdx >= 0 && mainIdx < freeVisible) return "free";
    if (isUnlocked) return "unlocked";
    return "locked";
  }

  function packCategoryForIndex(n) {
    const idx = Number(n) - 1;
    if (idx < 0 || idx >= PACK_CATEGORIES.length) return "";
    return PACK_CATEGORIES[idx] || "";
  }

  function filterWallpaperEntries(entries, filterId, packIndexOf) {
    const filter = String(filterId || "featured").toLowerCase();
    const idxOf =
      typeof packIndexOf === "function" ? packIndexOf : function (wp) {
        return packIndexFromSiteId(wp && wp.id);
      };

    if (filter === "all") return entries;
    if (PACK_CATEGORIES.indexOf(filter) >= 0 || ["neon-city", "space", "nature", "abstract", "minimal"].indexOf(filter) >= 0) {
      return entries.filter(function (entry) {
        if (entry.bucket === "custom") return false;
        const n = idxOf(entry.wp);
        return n > 0 && packCategoryForIndex(n) === filter;
      });
    }
    if (filter === "featured") {
      return entries.filter(function (entry) {
        if (entry.bucket === "custom") return true;
        const n = idxOf(entry.wp);
        return n > 0 && isCuratedPackIndex(n);
      });
    }
    if (filter === "free") {
      return entries.filter(function (entry) {
        return entry.bucket === "free" || entry.bucket === "custom";
      });
    }
    if (filter === "mine") {
      return entries.filter(function (entry) {
        return entry.bucket === "custom" || entry.bucket === "free" || entry.bucket === "unlocked";
      });
    }
    return entries;
  }

  function groupWallpaperEntries(entries) {
    const groups = WALLPAPER_GROUP_ORDER.map(function (id) {
      return { id: id, labelKey: "wp_group_" + id, items: [] };
    });
    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      const group = groups.find(function (g) {
        return g.id === entry.bucket;
      });
      if (group) group.items.push(entry);
    }
    return groups.filter(function (g) {
      return g.items.length > 0;
    });
  }

  global.GMXWallpaperCore = {
    WALLPAPER_PACK_COUNT: WALLPAPER_PACK_COUNT,
    WALLPAPER_CURATED_INDICES: WALLPAPER_CURATED_INDICES,
    WALLPAPER_GROUP_ORDER: WALLPAPER_GROUP_ORDER,
    WALLPAPER_FILTER_OPTIONS: WALLPAPER_FILTER_OPTIONS,
    formatExtPackId: formatExtPackId,
    packIndexFromSiteId: packIndexFromSiteId,
    packIndexFromExtId: packIndexFromExtId,
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
  fs.writeFileSync(file, js, "utf8");
  console.log("patched", path.relative(ROOT, file));
}

for (const rel of ["public/app.wallpapers.js", "frontend/public/app.wallpapers.js"]) {
  patchAppWallpapers(path.join(ROOT, rel));
}
for (const rel of ["public/lib/wallpaper-core.js", "frontend/public/lib/wallpaper-core.js"]) {
  patchWallpaperCoreJs(path.join(ROOT, rel));
}

function patchExtConfig(file) {
  let src = fs.readFileSync(file, "utf8");
  const namesBlock = `const EXT_WP_NAMES = ${JSON.stringify(PACK_NAMES, null, 2)};`;
  src = src.replace(/const EXT_WP_NAMES = \[[\s\S]*?\];/, namesBlock);
  src = src.replace(/for \(let i = 1; i <= \d+; i\+\+\)/, `for (let i = 1; i <= ${WALLPAPER_PACK_COUNT}; i++)`);
  fs.writeFileSync(file, src, "utf8");
  console.log("patched", path.relative(ROOT, file));
}

patchExtConfig(path.join(ROOT, "extension", "lib", "ext-config.js"));

console.log(`emit-wallpaper-pack OK (${WALLPAPER_PACK_COUNT} packs, formatExtPackId sample: ${formatExtPackId(12)})`);
