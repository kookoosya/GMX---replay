(function (window) {
  if (window.__GMXReferralsWireFactory) return;

  window.__GMXReferralsWireFactory = function createGMXReferralsWire(ctx) {
    ctx = ctx || {};
    if (ctx.core) {
      const core = ctx.core || {};
    const auth = ctx.auth || {};
    const keys = ctx.keys || {};
    const ui = ctx.ui || {};
    const refs = ctx.refs || {};

    ctx = {
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

    if (!window.__GMXReferralsFactory) throw new Error("GMX referrals factory missing");
    const __gmxReferrals = window.__GMXReferralsFactory({
      $: ctx.$,
      escapeHtml: ctx.escapeHtml,
      api: ctx.api,
      t: ctx.t,
      requireConnected: ctx.requireConnected,
      getReferralUiCopy: ctx.getReferralUiCopy,
      siteLangKey: ctx.siteLangKey,
      refreshRefStats: ctx.refreshRefStats,
      revealReferralLinkUi: ctx.revealReferralLinkUi,
      applyRefCountEligible: ctx.applyRefCountEligible,
      renderThemes: ctx.renderThemes,
      renderExtThemes: ctx.renderExtThemes,
      initWallpapers: ctx.initWallpapers,
      renderExtWallpapers: ctx.renderExtWallpapers,
      fillStyles: ctx.fillStyles,
      fillPacks: ctx.fillPacks,
      refreshUsage: ctx.refreshUsage,
      initReferralPromoDetailsState: ctx.initReferralPromoDetailsState,
    });

    const loadRefInvited = (days) => __gmxReferrals.loadRefInvited(days);
    const loadRefLeaderboard = (days) => __gmxReferrals.loadRefLeaderboard(days);
    __gmxReferrals.bindReferrals();

    return { loadRefInvited, loadRefLeaderboard };
  };
})(window);
