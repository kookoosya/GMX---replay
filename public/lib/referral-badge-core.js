(function (global) {
  if (global.GMXReferralBadgeCore) return;

  const REF_BADGE_TIERS = Object.freeze([
    { id: "bronze", minEligible: 3, icon: "🥉", cls: "refBadgeBronze" },
    { id: "silver", minEligible: 10, icon: "🥈", cls: "refBadgeSilver" },
    { id: "gold", minEligible: 30, icon: "🥇", cls: "refBadgeGold" },
    { id: "diamond", minEligible: 50, icon: "💎", cls: "refBadgeDiamond" },
  ]);

  const PRO_BADGE_FLOOR_ID = "gold";

  function tierById(id) {
    return REF_BADGE_TIERS.find((t) => t.id === id) || null;
  }

  function badgeTierRank(tierOrId) {
    const id = typeof tierOrId === "string" ? tierOrId : tierOrId?.id;
    const idx = REF_BADGE_TIERS.findIndex((t) => t.id === id);
    return idx >= 0 ? idx : -1;
  }

  function earnedReferralBadgeTier(eligible) {
    const e = Math.max(0, Number(eligible || 0) || 0);
    let earned = null;
    for (const tier of REF_BADGE_TIERS) {
      if (e >= tier.minEligible) earned = tier;
    }
    return earned;
  }

  function effectiveReferralBadgeTier(eligible, { isPro = false } = {}) {
    const earned = earnedReferralBadgeTier(eligible);
    if (!isPro) return earned;
    const floor = tierById(PRO_BADGE_FLOOR_ID);
    if (!earned) return floor;
    if (!floor) return earned;
    return badgeTierRank(earned) >= badgeTierRank(floor) ? earned : floor;
  }

  function nextReferralBadgeTier(eligible) {
    const e = Math.max(0, Number(eligible || 0) || 0);
    for (const tier of REF_BADGE_TIERS) {
      if (e < tier.minEligible) return tier;
    }
    return null;
  }

  function referralBadgeState(eligible, opts = {}) {
    const e = Math.max(0, Number(eligible || 0) || 0);
    const current = effectiveReferralBadgeTier(e, opts);
    const next = nextReferralBadgeTier(e);
    return {
      eligible: e,
      current,
      next,
      needed: next ? Math.max(0, next.minEligible - e) : 0,
      complete: !next,
    };
  }

  function referralBadgePillHtml(tier, { label = "", compact = false } = {}) {
    if (!tier) return "";
    const name = label
      ? `<span class="refBadgeName${compact ? " srOnly" : ""}">${label}</span>`
      : "";
    return `<span class="refBadgePill ${tier.cls}" title="${label}"><span class="refBadgeIcon" aria-hidden="true">${tier.icon}</span>${name}</span>`;
  }

  global.GMXReferralBadgeCore = {
    REF_BADGE_TIERS,
    PRO_BADGE_FLOOR_ID,
    tierById,
    badgeTierRank,
    earnedReferralBadgeTier,
    effectiveReferralBadgeTier,
    nextReferralBadgeTier,
    referralBadgeState,
    referralBadgePillHtml,
  };
})(typeof globalThis !== "undefined" ? globalThis : window);
