/** Wallpaper pairing, curated picks, and UI grouping — shared by site UI and tests. */

export const WALLPAPER_CURATED_INDICES = Object.freeze([
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 15, 18, 22, 25, 28, 32, 35, 38, 42, 45, 50, 55, 58,
]);

export const WALLPAPER_GROUP_ORDER = Object.freeze(["custom", "free", "unlocked", "locked"]);

export const WALLPAPER_FILTER_OPTIONS = Object.freeze([
  { id: "featured", labelKey: "wp_filter_featured" },
  { id: "all", labelKey: "wp_filter_all" },
  { id: "free", labelKey: "wp_filter_free" },
  { id: "mine", labelKey: "wp_filter_mine" },
]);

export function packIndexFromSiteId(id) {
  const m = String(id || "").match(/^v2_(\d+)$/i);
  return m ? Number(m[1]) || 0 : 0;
}

export function packIndexFromExtId(id) {
  const m = String(id || "").match(/^extv3_(\d+)$/i);
  return m ? Number(m[1]) || 0 : 0;
}

export function pairedExtId(siteId) {
  const n = packIndexFromSiteId(siteId);
  if (!n) return "";
  return `extv3_${String(n).padStart(2, "0")}`;
}

export function pairedSiteId(extId) {
  const n = packIndexFromExtId(extId);
  if (!n) return "";
  return `v2_${String(n).padStart(3, "0")}`;
}

export function isCuratedPackIndex(n) {
  return WALLPAPER_CURATED_INDICES.includes(Number(n) || 0);
}

export function bucketWallpaperEntry(wp, idx, effectiveCustomLen, opts) {
  const freeVisible = Number(opts?.freeVisible) || 8;
  const isUnlocked = typeof opts?.isUnlocked === "function" ? opts.isUnlocked(wp, idx) : false;
  if (wp?.tier === "custom") return "custom";
  const mainIdx = idx - effectiveCustomLen;
  if (mainIdx >= 0 && mainIdx < freeVisible) return "free";
  if (isUnlocked) return "unlocked";
  return "locked";
}

export function filterWallpaperEntries(entries, filterId, packIndexOf) {
  const filter = String(filterId || "featured").toLowerCase();
  const idxOf =
    typeof packIndexOf === "function"
      ? packIndexOf
      : (wp) => packIndexFromSiteId(wp?.id);

  if (filter === "all") return entries;
  if (filter === "featured") {
    return entries.filter(({ wp, bucket }) => {
      if (bucket === "custom") return true;
      const n = idxOf(wp);
      return n > 0 && isCuratedPackIndex(n);
    });
  }
  if (filter === "free") {
    return entries.filter(({ bucket }) => bucket === "free" || bucket === "custom");
  }
  if (filter === "mine") {
    return entries.filter(({ bucket }) => bucket === "custom" || bucket === "free" || bucket === "unlocked");
  }
  return entries;
}

export function groupWallpaperEntries(entries) {
  const groups = WALLPAPER_GROUP_ORDER.map((id) => ({
    id,
    labelKey: `wp_group_${id}`,
    items: [],
  }));
  for (const entry of entries) {
    const group = groups.find((g) => g.id === entry.bucket);
    if (group) group.items.push(entry);
  }
  return groups.filter((g) => g.items.length > 0);
}
