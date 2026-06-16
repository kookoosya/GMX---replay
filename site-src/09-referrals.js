// ----- Referrals -----
  if (!window.__GMXReferralsFactory) throw new Error("GMX referrals factory missing");
  const __gmxReferrals = window.__GMXReferralsFactory({
    $,
    escapeHtml,
    api,
    t,
    requireConnected,
    getReferralUiCopy,
    siteLangKey: LS_SITE_LANG,
    refreshRefStats,
    revealReferralLinkUi,
    applyRefCountEligible,
    renderThemes,
    renderExtThemes,
    initWallpapers,
    renderExtWallpapers,
    fillStyles,
    fillPacks,
    refreshUsage,
    initReferralPromoDetailsState,
  });
  const loadRefInvited = (days) => __gmxReferrals.loadRefInvited(days);
  const loadRefLeaderboard = (days) => __gmxReferrals.loadRefLeaderboard(days);
  __gmxReferrals.bindReferrals();
