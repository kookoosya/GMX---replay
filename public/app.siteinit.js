(function (window) {
  if (window.__GMXSiteInitFactory) return;

  window.__GMXSiteInitFactory = function createGMXSiteInit(ctx) {
    ctx = ctx || {};

    async function run() {
      if (!window.__GMXSiteSyncFactory) throw new Error("GMX sitesync factory missing");
      const storage = ctx.storage;
      const referralPendingKey = ctx.referralPendingKey || "gmx_ref_pending_v1";
      let referralPending = null;
      if (storage && window.__GMXReferralPendingFactory) {
        referralPending = window.__GMXReferralPendingFactory({
          lsGet: (k, fb) => storage.lsGet(k, fb),
          lsSet: (k, v) => storage.lsSet(k, v),
          lsRemove: (k) => storage.lsRemove(k),
          storageKey: referralPendingKey,
        });
      }
      window.__GMXSiteSyncFactory({
        setBestMode: ctx.setBestMode,
        setCleanFillEnabled: ctx.setCleanFillEnabled,
        referralPending,
      }).wire();

      const bootstrapSiteLangUi =
        typeof ctx.bootstrapSiteLangUi === "function" ? ctx.bootstrapSiteLangUi : async () => ({ siteLangSel: null });
      const applyLang = typeof ctx.applyLang === "function" ? ctx.applyLang : () => {};
      const syncBestModeUi = typeof ctx.syncBestModeUi === "function" ? ctx.syncBestModeUi : () => {};
      const syncCleanFillUi = typeof ctx.syncCleanFillUi === "function" ? ctx.syncCleanFillUi : () => {};
      const pruneLegacyAdminPanels =
        typeof ctx.pruneLegacyAdminPanels === "function" ? ctx.pruneLegacyAdminPanels : () => {};
      const wireI18nObserver =
        typeof ctx.wireI18nObserver === "function" ? ctx.wireI18nObserver : () => {};
      const updateLangFlags = typeof ctx.updateLangFlags === "function" ? ctx.updateLangFlags : () => {};
      const wireSiteLangSelectChange =
        typeof ctx.wireSiteLangSelectChange === "function" ? ctx.wireSiteLangSelectChange : () => {};
      const fillReplyLangSelects =
        typeof ctx.fillReplyLangSelects === "function" ? ctx.fillReplyLangSelects : () => ({});
      const fillStyles = typeof ctx.fillStyles === "function" ? ctx.fillStyles : () => {};
      const wireStyleSelectors = typeof ctx.wireStyleSelectors === "function" ? ctx.wireStyleSelectors : () => {};
      const fillPacks = typeof ctx.fillPacks === "function" ? ctx.fillPacks : () => {};
      const applyTheme = typeof ctx.applyTheme === "function" ? ctx.applyTheme : () => {};
      const renderThemes = typeof ctx.renderThemes === "function" ? ctx.renderThemes : () => {};
      const applyUserBg = typeof ctx.applyUserBg === "function" ? ctx.applyUserBg : () => {};
      const initWallpapers = typeof ctx.initWallpapers === "function" ? ctx.initWallpapers : () => {};
      const renderLangChips = typeof ctx.renderLangChips === "function" ? ctx.renderLangChips : () => {};
      const getProToolsNote =
        typeof ctx.getProToolsNote === "function" ? ctx.getProToolsNote : () => "Pro-only tools.";

      const { siteLangSel } = await bootstrapSiteLangUi();

      applyLang();
      try {
        syncBestModeUi();
      } catch (_e) {}
      try {
        syncCleanFillUi();
      } catch (_e) {}
      pruneLegacyAdminPanels();

      wireI18nObserver();
      updateLangFlags();
      wireSiteLangSelectChange(siteLangSel);

      const { gmLangSel, gnLangSel } = fillReplyLangSelects();

      fillStyles();
      try {
        wireStyleSelectors();
      } catch (_e) {}
      fillPacks();
      applyTheme(ctx.getThemeKey ? ctx.getThemeKey() : "classic");
      renderThemes();
      applyUserBg();
      initWallpapers();

      renderLangChips("gm");
      renderLangChips("gn");

      if (!window.__GMXGmGnWireFactory) throw new Error("GMX gmgnwire factory missing");
      const gmGnWire = window.__GMXGmGnWireFactory(ctx.gmGnWireCtx || {});
      gmGnWire.wireReplyLangSelects({ gmLangSel, gnLangSel });
      gmGnWire.wireGmGnPanels();

      if (!window.__GMXWallpaperUploadFactory) throw new Error("GMX wallpaperupload factory missing");
      window.__GMXWallpaperUploadFactory(ctx.wallpaperUploadCtx || {}).wire();

      if (!window.__GMXProControlsFactory) throw new Error("GMX procontrols factory missing");
      const proControls = window.__GMXProControlsFactory(
        Object.assign({}, ctx.proControlsCtx || {}, { getProToolsNote })
      );

      if (!window.__GMXSiteModeFactory) throw new Error("GMX sitemode factory missing");
      const siteMode = window.__GMXSiteModeFactory(ctx.siteModeCtx || {});

      proControls.wire();

      if (typeof window !== "undefined" && /^(127\.0\.0\.1|localhost)$/.test(location.hostname)) {
        const testApi = ctx.testHarness || {};
        window.__GMX_TEST__ = Object.assign(window.__GMX_TEST__ || {}, testApi);
      }

      if (!window.__GMXSiteBootFactory) throw new Error("GMX siteboot factory missing");
      window.__GMXSiteBootFactory(
        Object.assign({}, ctx.siteBootCtx || {}, {
          initModeToggle: () => siteMode.initModeToggle(),
        })
      ).run();

      if (!window.__GMXRecoverFactory) throw new Error("GMX recover factory missing");
      window.__GMXRecoverFactory(ctx.recoverCtx || {}).wire();
    }

    return { run };
  };
})(window);
