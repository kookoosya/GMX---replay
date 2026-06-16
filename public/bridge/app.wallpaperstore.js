(function (window) {
  if (window.__GMXWallpaperStoreFactory) return;

  const SITE_WALLPAPER_TABS = [
    ["all", "wp_apply_all"],
    ["home", "wp_apply_home"],
    ["gm", "wp_apply_gm"],
    ["gn", "wp_apply_gn"],
    ["prediction", "wp_apply_prediction"],
    ["studio", "wp_apply_studio"],
    ["packs", "wp_apply_packs"],
    ["bulk", "wp_apply_bulk"],
    ["history", "wp_apply_history"],
    ["favorites", "wp_apply_favorites"],
    ["referrals", "wp_apply_referrals"],
    ["themes", "wp_apply_themes"],
    ["extthemes", "wp_apply_extthemes"],
    ["wallet", "wp_apply_wallet"],
  ];

  window.__GMXWallpaperStoreFactory = function createGMXWallpaperStore(ctx) {
    const keys = ctx.keys || {};
    const wpGlobalKey = keys.wpGlobal || "gmx_wp_global";
    const wpTabPrefix = keys.wpTabPrefix || "gmx_wp_tab_";
    const migrationKey = keys.wallpaperRefreshMigration || "gmx_wallpaper_refresh_v2";
    const lsGet = typeof ctx.lsGet === "function" ? ctx.lsGet : (k, d) => {
      try {
        const v = localStorage.getItem(k);
        return v == null ? d : v;
      } catch {
        return d;
      }
    };
    const lsSet = typeof ctx.lsSet === "function" ? ctx.lsSet : (k, v) => {
      try {
        localStorage.setItem(k, v);
      } catch {}
    };
    const lsRemove = typeof ctx.lsRemove === "function" ? ctx.lsRemove : (k) => {
      try {
        localStorage.removeItem(k);
      } catch {}
    };
    const normalizeWallpaperId =
      typeof ctx.normalizeWallpaperId === "function" ? ctx.normalizeWallpaperId : (id) => id;
    const getWallpaperTabs =
      typeof ctx.getWallpaperTabs === "function" ? ctx.getWallpaperTabs : () => SITE_WALLPAPER_TABS;

    function wallpaperKeyForTab(tab) {
      if (!tab || tab === "all") return wpGlobalKey;
      return wpTabPrefix + tab;
    }

    function getWallpaperForTab(tab) {
      const direct = lsGet(wallpaperKeyForTab(tab), "");
      if (direct) return direct;
      return lsGet(wpGlobalKey, "");
    }

    function setWallpaperForTab(tab, id) {
      const k = wallpaperKeyForTab(tab);
      if (!id) lsRemove(k);
      else lsSet(k, id);
    }

    function migrateLegacyWallpaperSelectionOnce() {
      try {
        if (lsGet(migrationKey, "") === "1") return;
        const mapLegacy = (id) => {
          const v = String(id || "").trim();
          if (!v) return "";
          if (/^free0[12]$/i.test(v) || /^w\d+$/i.test(v) || /^v3_\d+$/i.test(v) || /^lux_/i.test(v)) {
            return "v2_001";
          }
          if (v.startsWith("v2_")) return v;
          return "v2_001";
        };
        const g = mapLegacy(lsGet(wpGlobalKey, ""));
        if (g) lsSet(wpGlobalKey, g);
        else lsRemove(wpGlobalKey);
        for (const [tab] of getWallpaperTabs()) {
          const k = wallpaperKeyForTab(tab);
          const norm = mapLegacy(lsGet(k, ""));
          if (norm) lsSet(k, norm);
          else lsRemove(k);
        }
        lsSet(migrationKey, "1");
      } catch {}
    }

    function normalizeAllWallpapers() {
      try {
        const g = normalizeWallpaperId(lsGet(wpGlobalKey, ""));
        if (g) lsSet(wpGlobalKey, g);
        else lsRemove(wpGlobalKey);
      } catch {}
      try {
        for (const [tab] of getWallpaperTabs()) {
          const k = wallpaperKeyForTab(tab);
          const norm = normalizeWallpaperId(lsGet(k, ""));
          if (norm) lsSet(k, norm);
          else lsRemove(k);
        }
      } catch {}
    }

    return {
      wallpaperKeyForTab,
      getWallpaperForTab,
      setWallpaperForTab,
      migrateLegacyWallpaperSelectionOnce,
      normalizeAllWallpapers,
      SITE_WALLPAPER_TABS,
    };
  };
})(window);
