/** Wallpaper + extension skin pairing, paths, and UI grouping — Themes V5. */
import { PACK_CATEGORIES, WALLPAPER_CATEGORIES, WALLPAPER_PACK_COUNT } from "./wallpaper-curated-catalog.mjs";
import { EXT_SKIN_PACK_COUNT, EXT_SKIN_CATEGORIES_LIST } from "./extension-skin-catalog.mjs";
import { SITE_EXT_SYNC_MAP, syncedExtSkinId, syncedSiteId } from "./themes-v4-sync.mjs";

export { WALLPAPER_CATEGORIES, EXT_SKIN_PACK_COUNT };

export { WALLPAPER_PACK_COUNT };

/** Versioned on-disk filenames — never reuse legacy pexels100 / extv3 paths. */
export const SITE_ASSET_PACK = "sitev5";
export const EXT_SKIN_ASSET_PACK = "extskin_v5";

/** @deprecated use SITE_ASSET_PACK */
export const WALLPAPER_ASSET_PACK = SITE_ASSET_PACK;

export function siteLandscapeFilename(n) {
  const num = Math.max(1, Math.min(WALLPAPER_PACK_COUNT, Number(n) || 1));
  return `${SITE_ASSET_PACK}_${String(num).padStart(3, "0")}.webp`;
}

export function siteThumbFilename(n) {
  return siteLandscapeFilename(n);
}

export function extSkinFilename(n) {
  const num = Math.max(1, Math.min(EXT_SKIN_PACK_COUNT, Number(n) || 1));
  return `${EXT_SKIN_ASSET_PACK}_${String(num).padStart(3, "0")}.webp`;
}

export function extSkinThumbFilename(n) {
  return extSkinFilename(n);
}

/** @deprecated extension backgrounds moved to extskins/ */
export function extPortraitFilename(n) {
  return extSkinFilename(n);
}

/** @deprecated */
export function extThumbFilename(n) {
  return extSkinThumbFilename(n);
}

export function siteLandscapePathFromIndex(n) {
  return `assets/wallpapers/${siteLandscapeFilename(n)}`;
}

export function siteThumbPathFromIndex(n) {
  return `assets/wallpapers/thumbs/${siteThumbFilename(n)}`;
}

export function extSkinPathFromIndex(n) {
  return `assets/extskins/${extSkinFilename(n)}`;
}

export function extSkinThumbPathFromIndex(n) {
  return `assets/extskins/thumbs/${extSkinThumbFilename(n)}`;
}

/** @deprecated */
export function extPortraitPathFromIndex(n) {
  return extSkinPathFromIndex(n);
}

/** @deprecated */
export function extThumbPathFromIndex(n) {
  return extSkinThumbPathFromIndex(n);
}

export const LEGACY_GRADIENT_SITE_FILENAMES = Object.freeze(
  Array.from({ length: WALLPAPER_PACK_COUNT }, (_, i) => `v2_${String(i + 1).padStart(3, "0")}.webp`)
);

export const LEGACY_PEXELS100_SITE_FILENAMES = Object.freeze(
  Array.from({ length: WALLPAPER_PACK_COUNT }, (_, i) => `pexels100_${String(i + 1).padStart(3, "0")}.webp`)
);

export const LEGACY_GRADIENT_EXT_FILENAMES = Object.freeze(
  Array.from({ length: 100 }, (_, i) => `extv3_${String(i + 1).padStart(3, "0")}.webp`)
);

export const LEGACY_PEXELS100_EXT_FILENAMES = Object.freeze(
  Array.from({ length: 100 }, (_, i) => `pexels100_portrait_${String(i + 1).padStart(3, "0")}.webp`)
);

export const WALLPAPER_CURATED_INDICES = Object.freeze(
  Array.from({ length: WALLPAPER_PACK_COUNT }, (_, i) => i + 1)
);

export const WALLPAPER_GROUP_ORDER = Object.freeze(["custom", "free", "unlocked", "locked"]);

export const WALLPAPER_FILTER_OPTIONS = Object.freeze([
  { id: "featured", labelKey: "wp_filter_featured" },
  { id: "all", labelKey: "wp_filter_all" },
  ...WALLPAPER_CATEGORIES.map((c) => ({ id: c.id, labelKey: c.labelKey })),
  { id: "free", labelKey: "wp_filter_free" },
  { id: "mine", labelKey: "wp_filter_mine" },
]);

export function formatExtSkinId(n) {
  const num = Math.max(1, Math.min(EXT_SKIN_PACK_COUNT, Number(n) || 1));
  return `extskin_${String(num).padStart(3, "0")}`;
}

/** @deprecated use formatExtSkinId */
export function formatExtPackId(n) {
  return formatExtSkinId(n);
}

export function packIndexFromSiteId(id) {
  const m = String(id || "").match(/^v2_(\d+)$/i);
  return m ? Number(m[1]) || 0 : 0;
}

export function packIndexFromExtSkinId(id) {
  const m = String(id || "").match(/^extskin_(\d+)$/i);
  if (m) return Number(m[1]) || 0;
  const legacy = String(id || "").match(/^extv3_(\d+)$/i);
  if (legacy) {
    const n = Number(legacy[1]) || 1;
    return Math.max(1, Math.min(EXT_SKIN_PACK_COUNT, n));
  }
  return 0;
}

/** @deprecated */
export function packIndexFromExtId(id) {
  return packIndexFromExtSkinId(id);
}

/** Explicit sync map only — no automatic index pairing. */
export function pairedExtId(siteId) {
  return syncedExtSkinId(siteId);
}

export function pairedSiteId(extId) {
  return syncedSiteId(extId);
}

export { SITE_EXT_SYNC_MAP };

export function isCuratedPackIndex(n) {
  return WALLPAPER_CURATED_INDICES.includes(Number(n) || 0);
}

export function bucketWallpaperEntry(wp, idx, effectiveCustomLen, opts) {
  const freeVisible = Number(opts?.freeVisible) || 8;
  const isUnlocked = opts && typeof opts.isUnlocked === "function" ? opts.isUnlocked(wp, idx) : false;
  if (wp && wp.tier === "custom") return "custom";
  const mainIdx = idx - effectiveCustomLen;
  if (mainIdx >= 0 && mainIdx < freeVisible) return "free";
  if (isUnlocked) return "unlocked";
  return "locked";
}

export function packCategoryForIndex(n) {
  const idx = Number(n) - 1;
  if (idx < 0 || idx >= PACK_CATEGORIES.length) return "";
  return PACK_CATEGORIES[idx] || "";
}

export function extSkinCategoryForIndex(n) {
  const idx = Number(n) - 1;
  if (idx < 0 || idx >= EXT_SKIN_CATEGORIES_LIST.length) return "";
  return EXT_SKIN_CATEGORIES_LIST[idx] || "";
}

export function filterWallpaperEntries(entries, filterId, packIndexOf) {
  const filter = String(filterId || "featured").toLowerCase();
  const idxOf =
    typeof packIndexOf === "function"
      ? packIndexOf
      : (wp) => packIndexFromSiteId(wp && wp.id);

  if (filter === "all") return entries;
  if (
    PACK_CATEGORIES.includes(filter) ||
    ["neon-city", "space", "nature", "abstract", "minimal", "anime-inspired", "sci-fi", "fantasy"].includes(filter)
  ) {
    return entries.filter((entry) => {
      if (entry.bucket === "custom") return false;
      const n = idxOf(entry.wp);
      return n > 0 && packCategoryForIndex(n) === filter;
    });
  }
  if (filter === "featured") {
    return entries.filter((entry) => {
      if (entry.bucket === "custom") return true;
      const n = idxOf(entry.wp);
      return n > 0 && isCuratedPackIndex(n);
    });
  }
  if (filter === "free") {
    return entries.filter((entry) => entry.bucket === "free" || entry.bucket === "custom");
  }
  if (filter === "mine") {
    return entries.filter((entry) => entry.bucket === "custom" || entry.bucket === "free" || entry.bucket === "unlocked");
  }
  return entries;
}

export function groupWallpaperEntries(entries) {
  const groups = WALLPAPER_GROUP_ORDER.map((id) => ({ id, labelKey: `wp_group_${id}`, items: [] }));
  for (const entry of entries) {
    const group = groups.find((g) => g.id === entry.bucket);
    if (group) group.items.push(entry);
  }
  return groups.filter((g) => g.items.length > 0);
}
