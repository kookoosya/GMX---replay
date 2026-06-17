(function (window) {
  if (window.__GMXReferralsRunWireFactory) return;

  window.__GMXReferralsRunWireFactory = function createGMXReferralsRunWire(ctx) {
    ctx = ctx || {};
    const core = ctx.core || {};
    const auth = ctx.auth || {};
    const keys = ctx.keys || {};
    const ui = ctx.ui || {};
    const refs = ctx.refs || {};

    function buildWireCtx() {
      return {
        $: core.$,
        escapeHtml: core.escapeHtml,
        api: core.api,
        t: core.t,
        requireConnected: auth.requireConnected,
        getReferralUiCopy: ui.getReferralUiCopy,
        siteLangKey: keys.siteLangKey,
        refreshRefStats: refs.refreshRefStats,
        revealReferralLinkUi: refs.revealReferralLinkUi,
        applyRefCountEligible: refs.applyRefCountEligible,
        renderThemes: ui.renderThemes,
        renderExtThemes: ui.renderExtThemes,
        initWallpapers: ui.initWallpapers,
        renderExtWallpapers: ui.renderExtWallpapers,
        fillStyles: ui.fillStyles,
        fillPacks: ui.fillPacks,
        refreshUsage: ui.refreshUsage,
        initReferralPromoDetailsState: ui.initReferralPromoDetailsState,
      };
    }

    function run() {
      if (!window.__GMXReferralsWireFactory) throw new Error("GMX referralswire factory missing");
      return window.__GMXReferralsWireFactory(buildWireCtx());
    }

    return { run, buildWireCtx };
  };
})(window);
