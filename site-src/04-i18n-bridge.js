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
    syncRefBadgeUi,
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
    const e = Math.max(0, Number(eligible || 0) || 0);
    const lang = __gmxSt.lsGet(K.SITE_LANG, "en");
    try {
      syncRefProgressMeter(lang, e);
    } catch (_e) {}
    try {
      syncRefBadgeUi(lang, e, {
        isPro: isPro(),
        toast,
        announce: !!r && opts?.announceBadge !== false,
      });
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
