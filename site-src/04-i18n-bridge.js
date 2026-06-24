  if (!window.__GMXI18nBridgeFactory) throw new Error("GMX i18nbridge factory missing");
  const {
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
    renderReferralRightCopy,
    syncModePanelCopy,
    patchDynamicCopy,
    fillSelect,
  } = window.__GMXI18nBridgeFactory({
    siteI18nUi: __gmxSiteI18nUi,
    siteI18nDynamic: __gmxSiteI18nDynamic,
    siteLangMenu: __gmxSiteLangMenu,
  });

  function applyRefCountEligible(eligible, opts){
    const r = __gmxChromeWire.applyRefCountEligible(eligible, opts);
    try {
      syncRefProgressMeter(__gmxSt.lsGet(K.SITE_LANG, "en"), Math.max(0, Number(eligible || 0) || 0));
    } catch (_e) {}
    return r;
  }

  try {
    const bootCached = Number(__gmxSt.lsGet(LS_REF_ELIGIBLE_CACHE, "0") || 0) || 0;
    applyRefCountEligible(bootCached);
  } catch (_e) {}

function syncReferralCardCopy() {
  try {
    renderReferralRightCopy(__gmxSt.lsGet(K.SITE_LANG, "en"));
  } catch {}
}
function initReferralPromoDetailsState() {}
function initProTabs() {}
