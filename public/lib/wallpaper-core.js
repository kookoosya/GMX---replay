(function (global) {
  if (global.GMXWallpaperCore) return;

  const WALLPAPER_PACK_COUNT = 100;
  const EXT_SKIN_PACK_COUNT = 60;
  const SITE_EXT_SYNC_MAP = {
  "v2_001": "extskin_003",
  "v2_003": "extskin_001",
  "v2_008": "extskin_006",
  "v2_012": "extskin_010",
  "v2_015": "extskin_012",
  "v2_020": "extskin_018",
  "v2_025": "extskin_022",
  "v2_033": "extskin_028",
  "v2_040": "extskin_035",
  "v2_045": "extskin_040",
  "v2_050": "extskin_045",
  "v2_055": "extskin_050",
  "v2_060": "extskin_055",
  "v2_070": "extskin_048",
  "v2_080": "extskin_058",
  "v2_090": "extskin_042",
  "v2_100": "extskin_060"
};
  const PACK_CATEGORIES = ["superhero-comic","superhero-comic","superhero-comic","superhero-comic","superhero-comic","superhero-comic","superhero-comic","superhero-comic","superhero-comic","superhero-comic","superhero-comic","superhero-comic","anime-style","anime-style","anime-style","anime-style","anime-style","anime-style","anime-style","anime-style","anime-style","anime-style","anime-style","anime-style","crypto-web3","crypto-web3","crypto-web3","crypto-web3","crypto-web3","crypto-web3","crypto-web3","crypto-web3","crypto-web3","crypto-web3","crypto-web3","crypto-web3","mecha-cyber","mecha-cyber","mecha-cyber","mecha-cyber","mecha-cyber","mecha-cyber","mecha-cyber","mecha-cyber","mecha-cyber","city-neon","city-neon","city-neon","city-neon","city-neon","city-neon","city-neon","city-neon","city-neon","city-neon","city-neon","city-neon","city-neon","city-neon","city-neon","nature","nature","nature","nature","nature","nature","nature","nature","nature","nature","nature","nature","nature","nature","nature","space","space","space","space","space","space","space","space","space","space","fantasy-env","fantasy-env","fantasy-env","fantasy-env","fantasy-env","fantasy-env","fantasy-env","fantasy-env","abstract-minimal","abstract-minimal","abstract-minimal","abstract-minimal","abstract-minimal","abstract-minimal","abstract-minimal"];
  const WALLPAPER_CURATED_INDICES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99, 100];
  const WALLPAPER_GROUP_ORDER = ["custom", "free", "unlocked", "locked"];
  const WALLPAPER_FILTER_OPTIONS = [
  {
    "id": "featured",
    "labelKey": "wp_filter_featured"
  },
  {
    "id": "all",
    "labelKey": "wp_filter_all"
  },
  {
    "id": "superhero-comic",
    "labelKey": "wp_cat_superhero_comic"
  },
  {
    "id": "anime-style",
    "labelKey": "wp_cat_anime_style"
  },
  {
    "id": "crypto-web3",
    "labelKey": "wp_cat_crypto_web3"
  },
  {
    "id": "mecha-cyber",
    "labelKey": "wp_cat_mecha_cyber"
  },
  {
    "id": "city-neon",
    "labelKey": "wp_cat_neon_city"
  },
  {
    "id": "nature",
    "labelKey": "wp_cat_nature"
  },
  {
    "id": "space",
    "labelKey": "wp_cat_space"
  },
  {
    "id": "fantasy-env",
    "labelKey": "wp_cat_fantasy_env"
  },
  {
    "id": "abstract-minimal",
    "labelKey": "wp_cat_minimal_texture"
  },
  {
    "id": "free",
    "labelKey": "wp_filter_free"
  },
  {
    "id": "mine",
    "labelKey": "wp_filter_mine"
  }
];

  function formatExtSkinId(n) {
    const num = Math.max(1, Math.min(EXT_SKIN_PACK_COUNT, Number(n) || 1));
    return "extskin_" + String(num).padStart(3, "0");
  }
  function packIndexFromSiteId(id) {
    const m = String(id || "").match(/^v2_(\d+)$/i);
    return m ? Number(m[1]) || 0 : 0;
  }
  function packIndexFromExtSkinId(id) {
    let m = String(id || "").match(/^extskin_(\d+)$/i);
    if (m) return Number(m[1]) || 0;
    m = String(id || "").match(/^extv3_(\d+)$/i);
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
