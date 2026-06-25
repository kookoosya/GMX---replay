/** Referral promoter badge tiers — shared between site UI and tests. */

export const REF_BADGE_TIERS = Object.freeze([
  { id: "bronze", minEligible: 3, icon: "🥉", cls: "refBadgeBronze" },
  { id: "silver", minEligible: 10, icon: "🥈", cls: "refBadgeSilver" },
  { id: "gold", minEligible: 30, icon: "🥇", cls: "refBadgeGold" },
  { id: "diamond", minEligible: 50, icon: "💎", cls: "refBadgeDiamond" },
]);

export const PRO_BADGE_FLOOR_ID = "gold";

export function tierById(id) {
  return REF_BADGE_TIERS.find((t) => t.id === id) || null;
}

export function badgeTierRank(tierOrId) {
  const id = typeof tierOrId === "string" ? tierOrId : tierOrId?.id;
  const idx = REF_BADGE_TIERS.findIndex((t) => t.id === id);
  return idx >= 0 ? idx : -1;
}

export function earnedReferralBadgeTier(eligible) {
  const e = Math.max(0, Number(eligible || 0) || 0);
  let earned = null;
  for (const tier of REF_BADGE_TIERS) {
    if (e >= tier.minEligible) earned = tier;
  }
  return earned;
}

export function effectiveReferralBadgeTier(eligible, { isPro = false } = {}) {
  const earned = earnedReferralBadgeTier(eligible);
  if (!isPro) return earned;
  const floor = tierById(PRO_BADGE_FLOOR_ID);
  if (!earned) return floor;
  if (!floor) return earned;
  return badgeTierRank(earned) >= badgeTierRank(floor) ? earned : floor;
}

export function nextReferralBadgeTier(eligible) {
  const e = Math.max(0, Number(eligible || 0) || 0);
  for (const tier of REF_BADGE_TIERS) {
    if (e < tier.minEligible) return tier;
  }
  return null;
}

export function referralBadgeState(eligible, opts = {}) {
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

export function referralBadgePillHtml(tier, { label = "", compact = false } = {}) {
  if (!tier) return "";
  const name = label
    ? `<span class="refBadgeName${compact ? " srOnly" : ""}">${label}</span>`
    : "";
  return `<span class="refBadgePill ${tier.cls}" title="${label}"><span class="refBadgeIcon" aria-hidden="true">${tier.icon}</span>${name}</span>`;
}
