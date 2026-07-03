(function (global) {
  if (global.GMXWallpaperCore) return;

  const WALLPAPER_PACK_COUNT = 25;

  const WALLPAPER_CURATED_INDICES = [
    1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25,
  ];

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
    "id": "neon-city",
    "labelKey": "wp_cat_neon_city"
  },
  {
    "id": "space",
    "labelKey": "wp_cat_space"
  },
  {
    "id": "nature",
    "labelKey": "wp_cat_nature"
  },
  {
    "id": "abstract",
    "labelKey": "wp_cat_abstract"
  },
  {
    "id": "minimal",
    "labelKey": "wp_cat_minimal"
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

  const PACK_CATEGORIES = [
  "neon-city",
  "neon-city",
  "neon-city",
  "neon-city",
  "neon-city",
  "space",
  "space",
  "space",
  "space",
  "space",
  "nature",
  "nature",
  "nature",
  "nature",
  "nature",
  "abstract",
  "abstract",
  "abstract",
  "abstract",
  "abstract",
  "minimal",
  "minimal",
  "minimal",
  "minimal",
  "minimal"
];

  function formatExtPackId(n) {
    const num = Math.max(1, Math.min(WALLPAPER_PACK_COUNT, Number(n) || 1));
    return "extv3_" + String(num).padStart(3, "0");
  }

  function packIndexFromSiteId(id) {
    const m = String(id || "").match(/^v2_(\d+)$/i);
    return m ? Number(m[1]) || 0 : 0;
  }

  function packIndexFromExtId(id) {
    const m = String(id || "").match(/^extv3_(\d+)$/i);
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
