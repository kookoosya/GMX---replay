/** Breadcrumb tab label mapping (Sprint 26.1). */

export const BREADCRUMB_TAB_LABEL_KEYS = Object.freeze({
  gm: "t_gm",
  gn: "t_gn",
  prediction: "t_prediction",
  wallet: "t_wallet",
  referrals: "t_ref",
  leaderboard: "t_lb",
  themes: "t_themes",
  extthemes: "t_extthemes",
  admin: "t_admin",
});

export function breadcrumbSectionKey(tab) {
  const key = String(tab || "").trim().toLowerCase();
  return BREADCRUMB_TAB_LABEL_KEYS[key] || null;
}

export function shouldShowBreadcrumb(tab) {
  return !!breadcrumbSectionKey(tab);
}
