(function (window) {
  if (window.__GMXBootstrapUsageWireFactory) return;

  window.__GMXBootstrapUsageWireFactory = function createGMXBootstrapUsageWire(ctx) {
    ctx = ctx || {};
    const st = ctx.storage || {};
    const K = ctx.keys || {};
    const chrome = ctx.chrome || {};
    const modals = ctx.modals || {};
    const tabState = ctx.tabState || {};
    const wp = ctx.wp || {};
    const wpStore = ctx.wpStore || {};
    const customWp = ctx.customWp || {};
    const extWpStore = ctx.extWpStore || {};

    if (!window.__GMXPaywallFactory) throw new Error("GMX paywall factory missing");
    const __gmxPaywall = window.__GMXPaywallFactory({
      $: chrome.$,
      modals,
      storage: st,
      getHandle: () => ctx.getHandle?.(),
      trackEvent: (type, meta) => ctx.trackEvent?.(type, meta),
      onNavigateWallet: () => {
        try {
          ctx.onNavigateWallet?.();
        } catch {}
      },
    });

    let __gmxHelp;
    if (!window.__GMXUsageFactory) throw new Error("GMX usage factory missing");
    const __gmxUsage = window.__GMXUsageFactory({
      $: chrome.$,
      getToken: () => ctx.getToken?.(),
      getHandle: () => ctx.getHandle?.(),
      api: (path, method, body) => ctx.api?.(path, method, body),
      isPro: ctx.isPro,
      getSaveCapFree: () => ctx.getSaveCapFree?.(),
      setSaveCapFree: (v) => {
        ctx.setSaveCapFree?.(v);
      },
      setAuthOk: (v) => {
        ctx.setAuthOk?.(v);
      },
      applyAdminVisibility: () => {
        try {
          ctx.applyAdminVisibility?.();
        } catch {}
      },
      setLastUsage: (u) => {
        ctx.setLastUsage?.(u);
      },
      getLastUsage: () => ctx.getLastUsage?.(),
      setSub: (s) => {
        ctx.setSub?.(s);
      },
      renderWalletStatus: (sub) => {
        try {
          ctx.renderWalletStatus?.(sub);
        } catch {}
      },
      applyRefCountEligible: (n, opts) => ctx.applyRefCountEligible?.(n, opts),
      getLastUsageCosmeticSig: () => ctx.getLastUsageCosmeticSig?.(),
      setLastUsageCosmeticSig: (s) => {
        ctx.setLastUsageCosmeticSig?.(s);
      },
      onCosmeticRefresh: () => {
        try {
          ctx.onCosmeticRefresh?.();
        } catch {}
      },
      scheduleRefStatsRefresh: (ms) => {
        try {
          ctx.scheduleRefStatsRefresh?.(ms);
        } catch {}
      },
      renderHelpIfOpen: () => {
        try {
          __gmxHelp.renderHelpIfOpen();
        } catch {}
      },
    });

    if (!window.__GMXHelpFactory) throw new Error("GMX help factory missing");
    __gmxHelp = window.__GMXHelpFactory({
      $: chrome.$,
      modals,
      isPro: ctx.isPro,
      getSaveCapFree: () => ctx.getSaveCapFree?.(),
      getLastUsage: () => ctx.getLastUsage?.(),
      getLastSaved: () => ctx.getLastSaved?.(),
      normLimitForUI: (n) => __gmxUsage.normLimitForUI(n),
      onNavigateWallet: () => {
        try {
          ctx.onNavigateWallet?.();
        } catch {}
      },
    });

    if (!window.__GMXWallpaperApplyFactory) throw new Error("GMX wallpaperapply factory missing");
    const __gmxWpApply = window.__GMXWallpaperApplyFactory({
      getCurrentTab: () => {
        try {
          return ctx.getCurrentTab?.();
        } catch {
          return "home";
        }
      },
      getWallpaperForTab: (tab) => wpStore.getWallpaperForTab?.(tab),
      getEffectiveCustomWallpapers: () => customWp.getEffectiveCustomWallpapersSite?.(),
      getWallpapers: () => ctx.getWallpapers?.(),
      wallpaperUnlocked: (wp, idx, len) => ctx.wallpaperUnlocked?.(wp, idx, len),
      wallpaperFullUrl: (id) => ctx.wallpaperFullUrl?.(id),
      ensureWallpaperLayer: () => wp.ensureWallpaperLayer?.(),
      setWallpaperLayerImage: (layer, url) => wp.setWallpaperLayerImage?.(layer, url),
    });

    if (!window.__GMXHealthFactory) throw new Error("GMX health factory missing");
    const __gmxHealth = window.__GMXHealthFactory({
      $: chrome.$,
      api: (path, method, body) => ctx.api?.(path, method, body),
      getHandle: () => ctx.getHandle?.(),
      getToken: () => ctx.getToken?.(),
      getAuthOk: () => ctx.getAuthOk?.(),
      setAuthOk: (v) => {
        ctx.setAuthOk?.(v);
      },
      applyAdminVisibility: () => {
        try {
          ctx.applyAdminVisibility?.();
        } catch {}
      },
      toast: (type, html, ms) => chrome.toast?.(type, html, ms),
      setDegraded: (on, msg) => chrome.setDegraded?.(on, msg),
      onRetrySession: async () => {
        try {
          await ctx.onRetrySession?.();
        } catch {}
      },
      onRetryWallet: async () => {
        try {
          if (tabState.getCurrentTab?.() === "wallet") {
            await ctx.onRetryWallet?.();
          }
        } catch {}
      },
      onRetryReferrals: () => {
        try {
          if (tabState.getCurrentTab?.() === "referrals") {
            ctx.onRetryReferrals?.();
          }
        } catch {}
      },
      onRetryUsage: async () => {
        try {
          await ctx.onRetryUsage?.();
        } catch {}
      },
    });
    __gmxHealth.wireRetryNow();
    __gmxHealth.wireOnlineRetry();

    return {
      __gmxPaywall,
      __gmxUsage,
      __gmxHelp,
      __gmxWpApply,
      __gmxHealth,
    };
  };
})(window);
