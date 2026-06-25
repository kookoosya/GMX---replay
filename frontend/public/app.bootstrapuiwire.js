(function (window) {
  if (window.__GMXBootstrapUiWireFactory) return;

  window.__GMXBootstrapUiWireFactory = function createGMXBootstrapUiWire(ctx) {
    ctx = ctx || {};
    const st = ctx.storage || {};
    const K = ctx.keys || {};
    const chrome = ctx.chrome || {};
    const fmt = ctx.fmt || {};
    const tabState = ctx.tabState || {};
    const langUi = ctx.langUi || {};
    const themes = ctx.themes || {};
    const wp = ctx.wp || {};
    const wpStore = ctx.wpStore || {};
    const customWp = ctx.customWp || {};
    const extWpStore = ctx.extWpStore || {};
    const ui = ctx.ui || {};
    const tabTheme = ctx.tabTheme || {};
    const cbg = ctx.cbg || {};
    const wpApply = ctx.wpApply || {};

    if (!window.__GMXSetBgFactory) throw new Error("GMX setbg factory missing");
    const __gmxSetBg = window.__GMXSetBgFactory({
      getTabBg: (tab) => tabTheme.getTabBg?.(tab),
      applyWallpaper: (tab) => wpApply.applyWallpaper?.(tab),
      applyUserBg: (tab) => cbg.applyUserBg?.(tab),
    });

    if (!window.__GMXThemeApplyFactory) throw new Error("GMX themeapply factory missing");
    const __gmxThemeApply = window.__GMXThemeApplyFactory({
      pickAccentOn: (a, b) => themes.pickAccentOn?.(a, b),
      getThemes: () => ctx.getThemes?.(),
      getCurrentTab: () => {
        try {
          return ctx.getCurrentTab?.();
        } catch {
          return "home";
        }
      },
      setBg: (tab) => {
        try {
          __gmxSetBg.setBg(tab);
        } catch {}
      },
      themeStorageKey: "gmx_theme",
    });

    if (!window.__GMXAccountUiFactory) throw new Error("GMX accountui factory missing");
    const __gmxAccount = window.__GMXAccountUiFactory({
      $: chrome.$,
      storage: st,
      refEligibleCacheKey: K.REF_ELIGIBLE_CACHE,
      getRefCount: () => ctx.getRefCount?.(),
      setRefCount: (n) => {
        ctx.setRefCount?.(n);
      },
      getAuthOk: () => ctx.getAuthOk?.(),
      getIsAdminFlag: () => st.lsGet?.(K.IS_ADMIN, "") === "1",
      onUnlockUiRefresh: () => {
        try {
          ctx.onUnlockUiRefresh?.();
        } catch {}
      },
    });

    if (!window.__GMXWallpaperUiFactory) throw new Error("GMX wallpaperui factory missing");
    const __gmxWpUi = window.__GMXWallpaperUiFactory({
      $: chrome.$,
      t: (key) => ctx.t?.(key),
      trWp: (key) => ctx.trWp?.(key),
      toast: (type, html, ms) => chrome.toast?.(type, html, ms),
      storage: st,
      keys: { wpGlobal: K.WP_GLOBAL, themewallView: K.THEMEWALL_VIEW, wpFilter: "gmx_wp_filter", wpSyncExt: "gmx_wp_sync_ext" },
      getWallpaperTabs: () => ctx.getWallpaperTabs?.(),
      wallpaperKeyForTab: (tab) => wpStore.wallpaperKeyForTab?.(tab),
      setWallpaperForTab: (tab, id) => wpStore.setWallpaperForTab?.(tab, id),
      getEffectiveCustomWallpapers: () => customWp.getEffectiveCustomWallpapersSite?.(),
      getWallpapers: () => ctx.getWallpapers?.(),
      unlockedCountByRefs: ctx.unlockedCountByRefs,
      freeVisibleWallpapers: ctx.freeVisibleWallpapers,
      customWpFreeCount: wp.CUSTOM_WP_FREE_COUNT,
      isPro: ctx.isPro,
      reqRefsForUnlockIndex: ctx.reqRefsForUnlockIndex,
      wallpaperUnlocked: (wpItem, idx, len) => ctx.wallpaperUnlocked?.(wpItem, idx, len),
      wallpaperThumbUrl: (id) => ctx.wallpaperThumbUrl?.(id),
      wallpaperFullUrl: (id) => ctx.wallpaperFullUrl?.(id),
      loadCustomWallpapers: () => customWp.loadCustomWallpapers?.(),
      chunkedRender: (grid, items, fn, opts) => ui.chunkedRender?.(grid, items, fn, opts),
      observeLazyBg: (el) => ui.observeLazyBg?.(el),
      prefetchImage: (url) => ui.prefetchImage?.(url),
      getCurrentTab: () => {
        try {
          return ctx.getCurrentTab?.();
        } catch {
          return "home";
        }
      },
      applyUserBg: (tab) => cbg.applyUserBg?.(tab),
      applyWallpaper: (tab) => wpApply.applyWallpaper?.(tab),
    });

    if (!window.__GMXThemesUiFactory) throw new Error("GMX themesui factory missing");
    const __gmxThemesUi = window.__GMXThemesUiFactory({
      $: chrome.$,
      t: (key) => ctx.t?.(key),
      toast: (type, html, ms) => chrome.toast?.(type, html, ms),
      getThemes: () => ctx.getThemes?.(),
      getWallpapers: () => ctx.getWallpapers?.(),
      getChosenTheme: () => {
        try {
          return localStorage.getItem("gmx_theme") || "classic";
        } catch {
          return "classic";
        }
      },
      unlockedThemesCount: () => ctx.unlockedThemesCount?.(),
      unlockedCountByRefs: ctx.unlockedCountByRefs,
      freeVisibleThemes: ctx.freeVisibleThemes,
      freeVisibleWallpapers: ctx.freeVisibleWallpapers,
      isPro: ctx.isPro,
      reqRefsForUnlockIndex: ctx.reqRefsForUnlockIndex,
      formatUnlockMeter: (cur, total) => ctx.formatUnlockMeter?.(cur, total),
      setMeter: (valId, fillId, used, limit) => {
        try {
          ctx.setMeter?.(valId, fillId, used, limit);
        } catch {}
      },
      chunkedRender: (grid, items, fn, opts) => ui.chunkedRender?.(grid, items, fn, opts),
      requireConnected: (label) => ctx.requireConnected?.(label),
      applyTheme: (id) => __gmxThemeApply.applyTheme(id),
    });

    if (!window.__GMXExtViewFactory) throw new Error("GMX extview factory missing");
    const __gmxExtView = window.__GMXExtViewFactory({
      $: chrome.$,
      getStoredExtView: () => st.lsGet?.(K.EXT_VIEW, "theme"),
      setStoredExtView: (v) => st.extLsSet?.(K.EXT_VIEW, v),
      renderExtThemes: () => {
        try {
          ctx.renderExtThemes?.();
        } catch {}
      },
      renderExtWallpapers: () => {
        try {
          ctx.renderExtWallpapers?.();
        } catch {}
      },
    });

    if (!window.__GMXExtApplyFactory) throw new Error("GMX extapply factory missing");
    const __gmxExtApply = window.__GMXExtApplyFactory({
      $: chrome.$,
      extLsSet: (key, value) => st.extLsSet?.(key, value),
      extThemeStorageKey: "gmx_ext_theme",
      isPro: ctx.isPro,
      getExtThemes: () => ctx.getExtThemes?.(),
      unlockedExtThemesCount: () =>
        ctx.unlockedCountByRefs?.(ctx.getExtThemes?.()?.length || 0, ctx.freeVisibleExtThemes),
      getStoredExtView: () => st.lsGet?.(K.EXT_VIEW, "theme"),
      normalizeExtViewValue: (v) => __gmxExtView.normalizeExtViewValue(v),
      setExtView: (v, o) => __gmxExtView.setExtView(v, o),
      extSyncNow: (r) => __gmxExtView.extSyncNow(r),
      normalizeExtWallpaperId: (id) => ctx.normalizeExtWallpaperId?.(id),
      normalizeExtWallpaperView: (v) => extWpStore.normalizeExtWallpaperView?.(v),
      currentExtWallpaperTarget: () => extWpStore.currentExtWallpaperTarget?.(),
      setExtWallpaperForView: (v, id) => extWpStore.setExtWallpaperForView?.(v, id),
      removeExtCustomBgLegacy: () => {
        try {
          localStorage.removeItem(K.EXT_CUSTOM_BG_LEGACY);
        } catch {}
      },
      renderExtWallpapers: () => {
        try {
          ctx.renderExtWallpapers?.();
        } catch {}
      },
    });

    if (!window.__GMXExtCustomBgUiFactory) throw new Error("GMX extcustombgui factory missing");
    const __gmxExtCbgUi = window.__GMXExtCustomBgUiFactory({
      $: chrome.$,
      t: (key) => ctx.t?.(key),
      toast: (type, html, ms) => chrome.toast?.(type, html, ms),
      escapeHtml: (s) => fmt.escapeHtml?.(s),
      bindExtTabs: () => __gmxExtView.bindExtTabs(),
      extSyncNow: (r) => __gmxExtView.extSyncNow(r),
      requireConnected: (label) => ctx.requireConnected?.(label),
      compressImageToJpegDataURL: (file, opts) => ctx.compressImageToJpegDataURL?.(file, opts),
      unlockedCountByRefs: ctx.unlockedCountByRefs,
      reqRefsForUnlockIndex: ctx.reqRefsForUnlockIndex,
      isPro: ctx.isPro,
      lsGet: (key, def) => st.lsGet?.(key, def),
      lsSet: (key, val) => st.lsSet?.(key, val),
      lsRemove: (key) => {
        try {
          localStorage.removeItem(key);
        } catch {}
      },
      keys: {
        extCustomBgGlobal: K.EXT_CUSTOM_BG_GLOBAL,
        extCustomBgTabPrefix: K.EXT_CUSTOM_BG_TAB_PREFIX,
        extCustomBgTarget: K.EXT_CUSTOM_BG_TARGET,
        extCustomBgLegacy: K.EXT_CUSTOM_BG_LEGACY,
      },
    });

    if (!window.__GMXExtThemesUiFactory) throw new Error("GMX extthemesui factory missing");
    const __gmxExtThemesUi = window.__GMXExtThemesUiFactory({
      $: chrome.$,
      t: (key) => ctx.t?.(key),
      escapeHtml: (s) => fmt.escapeHtml?.(s),
      toast: (type, html, ms) => chrome.toast?.(type, html, ms),
      getExtThemes: () => ctx.getExtThemes?.(),
      getExtWallpapers: () => ctx.getExtWallpapers?.(),
      getChosenExtTheme: () => {
        try {
          return localStorage.getItem("gmx_ext_theme") || "classic";
        } catch {
          return "classic";
        }
      },
      unlockedCountByRefs: ctx.unlockedCountByRefs,
      freeVisibleExtThemes: ctx.freeVisibleExtThemes,
      freeVisibleExtWallpapers: ctx.freeVisibleExtWallpapers,
      isPro: ctx.isPro,
      reqRefsForUnlockIndex: ctx.reqRefsForUnlockIndex,
      unlockTagText: (idx, unlocked, free) => __gmxThemesUi.unlockTagText(idx, unlocked, free),
      formatUnlockMeter: (cur, total) => ctx.formatUnlockMeter?.(cur, total),
      chunkedRender: (grid, items, fn, opts) => ui.chunkedRender?.(grid, items, fn, opts),
      requireConnected: (label) => ctx.requireConnected?.(label),
      applyExtTheme: (id) => __gmxExtApply.applyExtTheme(id),
    });

    if (!window.__GMXNavFactory) throw new Error("GMX nav factory missing");
    const __gmxNav = window.__GMXNavFactory({
      normalizeTopLevelTab: (n) => tabState.normalizeTopLevelTab?.(n),
      setCurrentTab: (n) => tabState.setCurrentTab?.(n),
      getTopLevelTabs: () => tabState.TOP_LEVEL_TABS,
      setBg: (n) => __gmxSetBg.setBg(n),
      persistLastTab: (n) => {
        try {
          st.lsSet?.(K.LAST_TAB, n);
        } catch {}
      },
      onTabActivated: (name) => {
        try {
          ctx.onTabActivated?.(name);
        } catch {}
      },
      onTabShown: (name) => {
        try {
          globalThis.__gmxMobileNavSync?.(name);
        } catch {}
        try {
          if (window.__GMXSeoMetaFactory) {
            const tab =
              typeof tabState.getCurrentTab === "function" ? tabState.getCurrentTab() : name;
            window.__GMXSeoMetaFactory({
              tr: (k, fb) => ctx.siteTr?.(k, fb) || ctx.t?.(k) || fb,
            }).applySeoMeta(tab || name);
          }
        } catch {}
        try {
          if (window.__GMXBreadcrumbsFactory) {
            const tab =
              typeof tabState.getCurrentTab === "function" ? tabState.getCurrentTab() : name;
            const crumbs = window.__GMXBreadcrumbsFactory({
              tr: (k, fb) => ctx.siteTr?.(k, fb) || ctx.t?.(k) || fb,
              switchTab: (n) => {
                try {
                  globalThis.__gmxShowTab?.(n);
                } catch {}
              },
            });
            crumbs.applyBreadcrumbs(tab || name);
          }
        } catch {}
      },
    });

    if (!window.__GMXExtWallpaperUiFactory) throw new Error("GMX extwallpaperui factory missing");
    const __gmxExtWpUi = window.__GMXExtWallpaperUiFactory({
      $: chrome.$,
      t: (key) => ctx.t?.(key),
      toast: (type, html, ms) => chrome.toast?.(type, html, ms),
      escapeHtml: (s) => fmt.escapeHtml?.(s),
      extSyncNow: (reason) => __gmxExtView.extSyncNow(reason),
      extLsSet: (key, value) => st.extLsSet?.(key, value),
      storage: st,
      keys: { extCustomBgGlobal: K.EXT_CUSTOM_BG_GLOBAL, extWpTarget: K.EXT_WP_TARGET, wpFilter: "gmx_wp_filter" },
      customUploadId: wp.CUSTOM_UPLOAD_ID,
      compressImageToJpegDataURL: (file, opts) => ctx.compressImageToJpegDataURL?.(file, opts),
      setExtWallpaperForView: (view, id) => extWpStore.setExtWallpaperForView?.(view, id),
      normalizeExtWallpaperView: (view) => extWpStore.normalizeExtWallpaperView?.(view),
      loadCustomWallpapers: () => customWp.loadCustomWallpapers?.(),
      getEffectiveExtCustomWallpapers: () => customWp.getEffectiveExtCustomWallpapers?.(),
      getExtWallpapers: () => ctx.getExtWallpapers?.(),
      syncExtWallpaperTargetUI: (sel, pref) => extWpStore.syncExtWallpaperTargetUI?.(sel, pref),
      getExtWallpaperForView: (view) => extWpStore.getExtWallpaperForView?.(view),
      currentExtWallpaperTarget: () => extWpStore.currentExtWallpaperTarget?.(),
      extWallpaperLabel: (view) => extWpStore.extWallpaperLabel?.(view),
      unlockedCountByRefs: ctx.unlockedCountByRefs,
      freeVisibleExtWallpapers: ctx.freeVisibleExtWallpapers,
      customWpFreeCount: wp.CUSTOM_WP_FREE_COUNT,
      isPro: ctx.isPro,
      reqRefsForUnlockIndex: ctx.reqRefsForUnlockIndex,
      extWallpaperThumbUrl: (id) => ctx.extWallpaperThumbUrl?.(id),
      extWallpaperFullUrl: (id) => ctx.extWallpaperFullUrl?.(id),
      chunkedRender: (grid, items, fn, opts) => ui.chunkedRender?.(grid, items, fn, opts),
      observeLazyBg: (el) => ui.observeLazyBg?.(el),
      prefetchImage: (url) => ui.prefetchImage?.(url),
      requireConnected: (label) => ctx.requireConnected?.(label),
      applyExtWallpaper: (id, target) => __gmxExtApply.applyExtWallpaper(id, target),
      unlockTagText: (idx, unlocked, free) => __gmxThemesUi.unlockTagText(idx, unlocked, free),
      formatUnlockMeter: (cur, total) => ctx.formatUnlockMeter?.(cur, total),
    });

    window.__gmxApplyPairedExtWallpaper = (siteId) => {
      try {
        const core = globalThis.GMXWallpaperCore;
        if (!core || typeof core.pairedExtId !== "function") return;
        const extId = core.pairedExtId(siteId);
        if (!extId) return;
        __gmxExtApply.applyExtWallpaper(extId, "all");
      } catch {}
    };

    return {
      __gmxSetBg,
      __gmxThemeApply,
      __gmxAccount,
      __gmxWpUi,
      __gmxThemesUi,
      __gmxExtView,
      __gmxExtApply,
      __gmxExtCbgUi,
      __gmxExtThemesUi,
      __gmxNav,
      __gmxExtWpUi,
    };
  };
})(window);
