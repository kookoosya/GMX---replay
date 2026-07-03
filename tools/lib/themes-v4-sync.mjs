/** Explicit site → extension skin pairs for #wpSyncExt only (not index 1:1). */
export const SITE_EXT_SYNC_MAP = Object.freeze({
  v2_001: "extskin_003",
  v2_003: "extskin_001",
  v2_008: "extskin_006",
  v2_012: "extskin_010",
  v2_015: "extskin_012",
  v2_020: "extskin_018",
  v2_025: "extskin_022",
  v2_033: "extskin_028",
  v2_040: "extskin_035",
  v2_045: "extskin_040",
  v2_050: "extskin_045",
  v2_055: "extskin_050",
  v2_060: "extskin_055",
  v2_070: "extskin_048",
  v2_080: "extskin_058",
  v2_090: "extskin_042",
  v2_100: "extskin_060",
});

export function syncedExtSkinId(siteId) {
  return SITE_EXT_SYNC_MAP[String(siteId || "")] || "";
}

export function syncedSiteId(extSkinId) {
  const id = String(extSkinId || "");
  for (const [site, ext] of Object.entries(SITE_EXT_SYNC_MAP)) {
    if (ext === id) return site;
  }
  return "";
}
