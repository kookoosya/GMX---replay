// ----- Referrals -----
  if (!window.__GMXReferralsWireFactory) throw new Error("GMX referralswire factory missing");
  const { loadRefInvited, loadRefLeaderboard } = window.__GMXReferralsWireFactory({
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
