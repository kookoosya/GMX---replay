(function (window) {
  if (window.__GMXBootstrapGenWireFactory) return;

  window.__GMXBootstrapGenWireFactory = function createGMXBootstrapGenWire(ctx) {
    ctx = ctx || {};
    const st = ctx.storage || {};
    const K = ctx.keys || {};
    const chrome = ctx.chrome || {};
    const themes = ctx.themes || {};
    const anti = ctx.anti || {};

    if (!window.__GMXGenParamsFactory) throw new Error("GMX genparams factory missing");
    const __gmxGp = window.__GMXGenParamsFactory({
      $: chrome.$,
      storage: st,
      packsForKind: (kind) => themes.packsForKind?.(kind),
      antiWindow: (s) => anti.antiWindow?.(s),
      getCurrentLang: (kind) => ctx.getCurrentLang?.(kind),
      isPro: ctx.isPro,
      reqRefsForUnlockIndex: ctx.reqRefsForUnlockIndex,
      unlockedCountByRefs: ctx.unlockedCountByRefs,
      freeVisiblePacks: ctx.freeVisiblePacks,
      t: (key) => ctx.t?.(key),
      syncModePanelCopy: () => {
        try {
          ctx.syncModePanelCopy?.();
        } catch {}
      },
    });

    if (!window.__GMXCleanFillFactory) throw new Error("GMX cleanfill factory missing");
    const __gmxCf = window.__GMXCleanFillFactory({
      storage: st,
      $: chrome.$,
      siteLang: () => ctx.siteLang?.(),
    });
    __gmxCf.bootstrap();

    if (!window.__GMXStylesFactory) throw new Error("GMX styles factory missing");
    const __gmxStyles = window.__GMXStylesFactory({
      $: chrome.$,
      storage: st,
      getStyles: () => themes.STYLES,
      normalizeStyle: (s) => __gmxGp.normalizeStyle(s),
      isPro: ctx.isPro,
      reqRefsForUnlockIndex: ctx.reqRefsForUnlockIndex,
      unlockedCountByRefs: ctx.unlockedCountByRefs,
      freeVisibleStyles: ctx.freeVisibleStyles,
      t: (key) => ctx.t?.(key),
      syncModePanelCopy: () => {
        try {
          ctx.syncModePanelCopy?.();
        } catch {}
      },
    });

    if (!window.__GMXTogglesFactory) throw new Error("GMX toggles factory missing");
    const __gmxToggles = window.__GMXTogglesFactory({
      storage: st,
      $: chrome.$,
      onAfterBestChange: () => {
        try {
          ctx.syncCleanFillUi?.();
        } catch {}
      },
    });

    if (!window.__GMXCustomBgFactory) throw new Error("GMX custombg factory missing");
    const __gmxCbg = window.__GMXCustomBgFactory({
      storage: st,
      isPro: ctx.isPro,
      unlockedCountByRefs: ctx.unlockedCountByRefs,
      reqRefsForUnlockIndex: ctx.reqRefsForUnlockIndex,
      getCurrentTab: () => {
        try {
          return ctx.getCurrentTab?.();
        } catch {
          return "home";
        }
      },
      hasWallBg: () => document.body.classList.contains("hasWallBg"),
      hasActiveUnlockedWallpaper: (tab) => {
        try {
          return !!ctx.hasActiveUnlockedWallpaper?.(tab);
        } catch {
          return false;
        }
      },
    });
    __gmxCbg.migrateLegacy();
    __gmxToggles.bootstrap();

    if (!window.__GMXTabThemeFactory) throw new Error("GMX tabtheme factory missing");
    const __gmxTabTheme = window.__GMXTabThemeFactory();

    if (!window.__GMXLogsFactory) throw new Error("GMX logs factory missing");
    const __gmxLogs = window.__GMXLogsFactory();

    return {
      __gmxGp,
      __gmxCf,
      __gmxStyles,
      __gmxToggles,
      __gmxCbg,
      __gmxTabTheme,
      __gmxLogs,
    };
  };
})(window);
