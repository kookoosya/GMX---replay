  // ---- UI Translation (site language) ----
  // Source of truth: shared/i18n/locales/*.json → /public/i18n/siteI18n.js
  const I18N = (globalThis.GMX_SITE_I18N && typeof globalThis.GMX_SITE_I18N.createSiteI18nCatalog === "function")
    ? globalThis.GMX_SITE_I18N.createSiteI18nCatalog()
    : { en: {} };

  function siteTr(key, fallback = ""){ return __gmxSiteI18nUi.siteTr(key, fallback); }
  function applyLang(){ return __gmxSiteI18nUi.applyLang(); }

  function getReferralUiCopy(lang){ return __gmxSiteI18nDynamic.getReferralUiCopy(lang); }
  function getGuideUiCopy(lang){ return __gmxSiteI18nDynamic.getGuideUiCopy(lang); }
  function renderGuideRightCopy(lang){ return __gmxSiteI18nDynamic.renderGuideRightCopy(lang); }
  function deriveReferralUnlocks(eligible, rawUnlocks){
    return __gmxSiteI18nDynamic.deriveReferralUnlocks(eligible, rawUnlocks);
  }
  function nextReferralUnlockAt(eligible){ return __gmxSiteI18nDynamic.nextReferralUnlockAt(eligible); }
  function nextReferralUnlockLabel(lang, step){
    return __gmxSiteI18nDynamic.nextReferralUnlockLabel(lang, step);
  }
  function renderReferralRightCopy(lang){ return __gmxSiteI18nDynamic.renderReferralRightCopy(lang); }
  function syncModePanelCopy(){ return __gmxSiteI18nDynamic.syncModePanelCopy(); }
  function patchDynamicCopy(lang, merged){ return __gmxSiteI18nDynamic.patchDynamicCopy(lang, merged); }

  function fillSelect(sel, arr){ return __gmxSiteLangMenu.fillSelect(sel, arr); }
