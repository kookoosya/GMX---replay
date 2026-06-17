(function (window) {
  if (window.__GMXBootstrapCoreWireFactory) return;

  window.__GMXBootstrapCoreWireFactory = function createGMXBootstrapCoreWire(ctx) {
    ctx = ctx || {};

    if (!window.__GMXStorageFactory) throw new Error("GMX storage factory missing");
    const __gmxSt = window.__GMXStorageFactory();
    const K = __gmxSt.keys;

    if (!window.__GMXFormatFactory) throw new Error("GMX format factory missing");
    const __gmxFmt = window.__GMXFormatFactory();

    const ADMIN_HANDLE = "@Kristofer_Sol_";
    const EMPTY = "__EMPTY__";
    const INFLIGHT = { gm: false, gn: false };
    const ABORT = { gm: null, gn: null };

    if (!window.__GMXChromeFactory) throw new Error("GMX chrome factory missing");
    const __gmxChrome = window.__GMXChromeFactory({
      inflight: INFLIGHT,
      escapeHtml: (s) => __gmxFmt.escapeHtml(s),
    });

    if (!window.__GMXModalsFactory) throw new Error("GMX modals factory missing");
    const __gmxModalsHooks = { closeLangMenu: () => {} };
    const __gmxModals = window.__GMXModalsFactory({
      $: __gmxChrome.$,
      escapeHtml: (s) => __gmxFmt.escapeHtml(s),
      onBeforeOpen: () => {
        try {
          __gmxModalsHooks.closeLangMenu();
        } catch {}
      },
    });
    __gmxModals.initModalsShell();

    function getI18nCatalog() {
      try {
        if (
          globalThis.GMX_SITE_I18N &&
          typeof globalThis.GMX_SITE_I18N.createSiteI18nCatalog === "function"
        ) {
          return globalThis.GMX_SITE_I18N.createSiteI18nCatalog();
        }
      } catch (_e) {}
      return { en: {} };
    }

    if (!window.__GMXI18nUiFactory) throw new Error("GMX i18nui factory missing");
    const __gmxI18nUi = window.__GMXI18nUiFactory({
      getSiteLang: () => __gmxSt.lsGet(K.SITE_LANG, "en"),
      getI18n: () => getI18nCatalog(),
    });

    if (!window.__GMXTabStateFactory) throw new Error("GMX tabstate factory missing");
    const __gmxTabState = window.__GMXTabStateFactory();

    let __gmxSiteI18nDynamic;
    if (!window.__GMXSiteI18nUiFactory) throw new Error("GMX sitei18nui factory missing");
    const __gmxSiteI18nUi = window.__GMXSiteI18nUiFactory({
      getSiteLang: () => __gmxSt.lsGet(K.SITE_LANG, "en"),
      getI18n: () => getI18nCatalog(),
      sanitizeI18nValue: (lang, value, fallback) =>
        __gmxI18nUi.sanitizeI18nValue(lang, value, fallback),
      onPatchDynamicCopy: (lang, merged) => {
        try {
          __gmxSiteI18nDynamic.patchDynamicCopy(lang, merged);
        } catch (_e) {}
      },
    });

    if (!window.__GMXSiteI18nDynamicFactory) throw new Error("GMX sitei18ndynamic factory missing");
    __gmxSiteI18nDynamic = window.__GMXSiteI18nDynamicFactory({
      t: (key) => __gmxI18nUi.t(key),
      siteTr: (key, fb) => __gmxSiteI18nUi.siteTr(key, fb),
      $: __gmxChrome.$,
      escapeHtml: (s) => __gmxFmt.escapeHtml(s),
      syncPredictionFilterCopy: () => {
        try {
          ctx.syncPredictionFilterCopy?.();
        } catch {}
      },
      syncCleanFillUi: () => {
        try {
          ctx.syncCleanFillUi?.();
        } catch {}
      },
      syncReferralCardCopy: () => {
        try {
          ctx.syncReferralCardCopy?.();
        } catch {}
      },
      initReferralPromoDetailsState: () => {
        try {
          ctx.initReferralPromoDetailsState?.();
        } catch {}
      },
      getCurrentTab: () => __gmxTabState.getCurrentTab(),
      getHandle: () => {
        try {
          return ctx.getHandle?.();
        } catch {
          return "";
        }
      },
      scheduleRefStatsRefresh: (ms) => {
        try {
          ctx.scheduleRefStatsRefresh?.(ms);
        } catch {}
      },
    });

    if (!window.__GMXSiteLangMenuFactory) throw new Error("GMX sitelangmenu factory missing");
    const __gmxSiteLangMenu = window.__GMXSiteLangMenuFactory({
      $: __gmxChrome.$,
      escapeHtml: (s) => __gmxFmt.escapeHtml(s),
      getSiteLang: () => __gmxSt.lsGet(K.SITE_LANG, "en"),
      setSiteLang: (v) => {
        try {
          __gmxSt.lsSet(K.SITE_LANG, v);
        } catch {}
      },
      getSiteLangs: () => ctx.getSiteLangs?.(),
      setSiteLangs: (arr) => {
        ctx.setSiteLangs?.(arr);
      },
      getReplyLangs: () => ctx.getReplyLangs?.(),
      setReplyLangs: (arr) => {
        ctx.setReplyLangs?.(arr);
      },
      applyLang: () => {
        try {
          ctx.applyLang?.();
        } catch {}
      },
      onSiteLangChanged: () => {
        try {
          ctx.syncBestModeUi?.();
        } catch {}
        try {
          ctx.syncCleanFillUi?.();
        } catch {}
        try {
          window.postMessage({ type: "GMX_SYNC_NOW", reason: "site_lang_change" }, "*");
        } catch {}
        try {
          ctx.updateLangFlags?.();
        } catch {}
        try {
          ctx.renderWallpaperUI?.();
        } catch {}
      },
      onI18nKick: () => {
        try {
          ctx.applyLang?.();
        } catch {}
        try {
          ctx.syncBestModeUi?.();
        } catch {}
        try {
          ctx.syncCleanFillUi?.();
        } catch {}
      },
    });
    __gmxModalsHooks.closeLangMenu = () => __gmxSiteLangMenu.closeLangMenu();

    if (!window.__GMXLangUiFactory) throw new Error("GMX langui factory missing");
    const __gmxLangUi = window.__GMXLangUiFactory({
      $: __gmxChrome.$,
    });

    return {
      __gmxSt,
      K,
      __gmxFmt,
      __gmxChrome,
      __gmxModals,
      __gmxI18nUi,
      __gmxTabState,
      __gmxSiteI18nUi,
      __gmxSiteI18nDynamic,
      __gmxSiteLangMenu,
      __gmxLangUi,
      ADMIN_HANDLE,
      EMPTY,
      INFLIGHT,
      ABORT,
    };
  };
})(window);
