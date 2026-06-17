(function (window) {
  if (window.__GMXBootstrapUnlockWireFactory) return;

  window.__GMXBootstrapUnlockWireFactory = function createGMXBootstrapUnlockWire(ctx) {
    ctx = ctx || {};
    const st = ctx.storage || {};
    const K = ctx.keys || {};
    const chrome = ctx.chrome || {};

    if (!window.__GMXUnlockFactory) throw new Error("GMX unlock factory missing");
    const __gmxUnlock = window.__GMXUnlockFactory({
      isPro: ctx.isPro,
      getRefCount: ctx.getRefCount,
    });

    if (!window.__GMXWallpapersFactory) throw new Error("GMX wallpapers factory missing");
    const __gmxWp = window.__GMXWallpapersFactory({
      getAssetRev: ctx.getAssetRev,
      getSiteCustomUpload: () => st.lsGet?.(K.CUSTOM_BG_GLOBAL),
      getExtCustomUpload: () => st.lsGet?.(K.EXT_CUSTOM_BG_GLOBAL),
    });

    if (!window.__GMXCustomWallpapersFactory) throw new Error("GMX customwallpapers factory missing");
    const __gmxCustomWp = window.__GMXCustomWallpapersFactory({
      apiPath: "/api/wallpapers/custom",
      customUploadId: __gmxWp.CUSTOM_UPLOAD_ID,
      getSiteCustomUpload: () => st.lsGet?.(K.CUSTOM_BG_GLOBAL, ""),
      getExtCustomUpload: () => st.lsGet?.(K.EXT_CUSTOM_BG_GLOBAL, ""),
    });

    if (!window.__GMXThemesFactory) throw new Error("GMX themes factory missing");
    const __gmxThemes = window.__GMXThemesFactory();

    if (!window.__GMXGenerateFactory) throw new Error("GMX generate factory missing");
    const __gmxGen = window.__GMXGenerateFactory();

    if (!window.__GMXBanksFactory) throw new Error("GMX banks factory missing");
    const __gmxBanks = window.__GMXBanksFactory({
      storage: st,
      dedupeLines: __gmxGen.dedupeLines,
      EMPTY: ctx.empty,
    });

    if (!window.__GMXAntiRepeatFactory) throw new Error("GMX anti-repeat factory missing");
    const __gmxAnti = window.__GMXAntiRepeatFactory({
      storage: st,
      repeatKey: __gmxGen.repeatKey,
      readKey: __gmxBanks.readKey,
      filterLinesByBan: __gmxGen.filterLinesByBan,
    });

    if (!window.__GMXUiFactory) throw new Error("GMX ui factory missing");
    const __gmxUi = window.__GMXUiFactory({
      api: ctx.api,
      getToken: ctx.getToken,
    });

    if (!window.__GMXWallpaperStoreFactory) throw new Error("GMX wallpaperstore factory missing");
    const __gmxWpStore = window.__GMXWallpaperStoreFactory({
      keys: {
        wpGlobal: K.WP_GLOBAL,
        wpTabPrefix: K.WP_TAB_PREFIX,
        wallpaperRefreshMigration: K.WALLPAPER_REFRESH_MIGRATION,
      },
      lsGet: (key, def) => st.lsGet?.(key, def),
      lsSet: (key, val) => st.lsSet?.(key, val),
      lsRemove: (key) => {
        try {
          localStorage.removeItem(key);
        } catch {}
      },
      normalizeWallpaperId: (id) => ctx.normalizeWallpaperId?.(id),
      getWallpaperTabs: () => ctx.getWallpaperTabs?.(),
    });

    if (!window.__GMXExtWallpaperStoreFactory) throw new Error("GMX extwallpaperstore factory missing");
    const __gmxExtWpStore = window.__GMXExtWallpaperStoreFactory({
      keys: {
        extWp: K.EXT_WP,
        extWpTarget: K.EXT_WP_TARGET,
        extWpViewPrefix: K.EXT_WP_VIEW_PREFIX,
      },
      extLsSet: (key, value) => st.extLsSet?.(key, value),
      lsGet: (key, def) => st.lsGet?.(key, def),
      lsSet: (key, val) => st.lsSet?.(key, val),
      lsRemove: (key) => {
        try {
          localStorage.removeItem(key);
        } catch {}
      },
      normalizeExtWallpaperId: (id) => ctx.normalizeExtWallpaperIdLocal?.(id),
    });

    const FREE_VISIBLE_THEMES = __gmxUnlock.FREE_VISIBLE_THEMES;
    const FREE_VISIBLE_STYLES = __gmxUnlock.FREE_VISIBLE_STYLES;
    const FREE_VISIBLE_PACKS = __gmxUnlock.FREE_VISIBLE_PACKS;
    const FREE_VISIBLE_WALLPAPERS = __gmxUnlock.FREE_VISIBLE_WALLPAPERS;

    if (!window.__GMXWallpaperHelpersFactory) throw new Error("GMX wallpaperhelpers factory missing");
    const __gmxWpHelpers = window.__GMXWallpaperHelpersFactory({
      wp: __gmxWp,
      getWallpapers: () => ctx.getWallpapers?.(),
      getExtWallpapers: () => ctx.getExtWallpapers?.(),
      isPro: ctx.isPro,
      unlockedCountByRefs: (total, freeCount) => __gmxUnlock.unlockedCountByRefs(total, freeCount),
      freeVisibleWallpapers: FREE_VISIBLE_WALLPAPERS,
      customWpFreeCount: __gmxWp.CUSTOM_WP_FREE_COUNT,
    });

    const FREE_VISIBLE_EXT_THEMES = __gmxUnlock.FREE_VISIBLE_EXT_THEMES;
    const FREE_VISIBLE_EXT_WALLPAPERS = __gmxUnlock.FREE_VISIBLE_EXT_WALLPAPERS;

    function reqRefsForUnlockIndex(idx, freeCount = FREE_VISIBLE_THEMES) {
      return __gmxUnlock.reqRefsForUnlockIndex(idx, freeCount);
    }

    function formatUnlockMeter(cur, total) {
      return __gmxUnlock.formatUnlockMeter(cur, total);
    }

    function unlockedCountByRefs(total, freeCount = FREE_VISIBLE_THEMES) {
      return __gmxUnlock.unlockedCountByRefs(total, freeCount);
    }

    return {
      __gmxUnlock,
      __gmxWp,
      __gmxCustomWp,
      __gmxThemes,
      __gmxGen,
      __gmxBanks,
      __gmxAnti,
      __gmxUi,
      __gmxWpStore,
      __gmxExtWpStore,
      __gmxWpHelpers,
      FREE_VISIBLE_THEMES,
      FREE_VISIBLE_STYLES,
      FREE_VISIBLE_PACKS,
      FREE_VISIBLE_WALLPAPERS,
      FREE_VISIBLE_EXT_THEMES,
      FREE_VISIBLE_EXT_WALLPAPERS,
      reqRefsForUnlockIndex,
      formatUnlockMeter,
      unlockedCountByRefs,
    };
  };
})(window);
