// ----- Referrals -----
  if (!window.__GMXReferralsWireFactory) throw new Error("GMX referralsrunwire factory missing");
  const { loadRefInvited, loadRefLeaderboard } = window.__GMXReferralsWireFactory({
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
