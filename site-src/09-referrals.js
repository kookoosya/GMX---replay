// ----- Referrals -----
  if (!window.__GMXReferralsRunWireFactory) throw new Error("GMX referralsrunwire factory missing");
  const { loadRefInvited, loadRefLeaderboard } = window.__GMXReferralsRunWireFactory({
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
  }).run();
