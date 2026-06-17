(function (window) {
  if (window.__GMXReferralsWireFactory) return;

  window.__GMXReferralsWireFactory = function createGMXReferralsWire(ctx) {
    ctx = ctx || {};

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
