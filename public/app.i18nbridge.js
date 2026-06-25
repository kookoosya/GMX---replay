(function (window) {
  if (window.__GMXI18nBridgeFactory) return;

  window.__GMXI18nBridgeFactory = function createGMXI18nBridge(ctx) {
    ctx = ctx || {};
    const siteI18nUi = ctx.siteI18nUi || {};
    const siteI18nDynamic = ctx.siteI18nDynamic || {};
    const siteLangMenu = ctx.siteLangMenu || {};

    const I18N =
      globalThis.GMX_SITE_I18N && typeof globalThis.GMX_SITE_I18N.createSiteI18nCatalog === "function"
        ? globalThis.GMX_SITE_I18N.createSiteI18nCatalog()
        : { en: {} };

    function siteTr(key, fallback = "") {
      return siteI18nUi.siteTr?.(key, fallback);
    }
    function applyLang() {
      return siteI18nUi.applyLang?.();
    }
    function getReferralUiCopy(lang) {
      return siteI18nDynamic.getReferralUiCopy?.(lang);
    }
    function getGuideUiCopy(lang) {
      return siteI18nDynamic.getGuideUiCopy?.(lang);
    }
    function renderGuideRightCopy(lang) {
      return siteI18nDynamic.renderGuideRightCopy?.(lang);
    }
    function deriveReferralUnlocks(eligible, rawUnlocks) {
      return siteI18nDynamic.deriveReferralUnlocks?.(eligible, rawUnlocks);
    }
    function nextReferralUnlockAt(eligible) {
      return siteI18nDynamic.nextReferralUnlockAt?.(eligible);
    }
    function nextReferralUnlockLabel(lang, step) {
      return siteI18nDynamic.nextReferralUnlockLabel?.(lang, step);
    }
    function syncRefProgressMeter(lang, eligible) {
      return siteI18nDynamic.syncRefProgressMeter?.(lang, eligible);
    }
    function syncRefBadgeUi(lang, eligible, opts) {
      return siteI18nDynamic.syncRefBadgeUi?.(lang, eligible, opts);
    }
    function renderReferralRightCopy(lang) {
      return siteI18nDynamic.renderReferralRightCopy?.(lang);
    }
    function syncModePanelCopy() {
      return siteI18nDynamic.syncModePanelCopy?.();
    }
    function patchDynamicCopy(lang, merged) {
      return siteI18nDynamic.patchDynamicCopy?.(lang, merged);
    }
    function fillSelect(sel, arr) {
      return siteLangMenu.fillSelect?.(sel, arr);
    }

    return {
      I18N,
      siteTr,
      applyLang,
      getReferralUiCopy,
      getGuideUiCopy,
      renderGuideRightCopy,
      deriveReferralUnlocks,
      nextReferralUnlockAt,
      nextReferralUnlockLabel,
      syncRefProgressMeter,
      syncRefBadgeUi,
      renderReferralRightCopy,
      syncModePanelCopy,
      patchDynamicCopy,
      fillSelect,
    };
  };
})(window);
