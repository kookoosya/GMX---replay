// ----- Referrals -----
let __gmxReferralsWire = null;

function initReferralsTab() {
  if (__gmxReferralsWire) return __gmxReferralsWire;
  if (!window.__GMXReferralsWireFactory) throw new Error("GMX referralsrunwire factory missing");
  __gmxReferralsWire = window.__GMXReferralsWireFactory({
    core: { $, escapeHtml, api, t },
    auth: { requireConnected },
    keys: { siteLangKey: LS_SITE_LANG },
    ui: {
      getReferralUiCopy,
      renderThemes,
      renderExtThemes,
      initWallpapers,
      renderExtWallpapers,
      fillStyles,
      fillPacks,
      refreshUsage,
      initReferralPromoDetailsState,
    },
    refs: {
      refreshRefStats,
      revealReferralLinkUi,
      applyRefCountEligible,
    },
  });
  return __gmxReferralsWire;
}

window.__gmxLazyTabHooks = window.__gmxLazyTabHooks || {};
window.__gmxLazyTabHooks.referrals = () => { initReferralsTab(); };
