/** Mobile bottom nav + GM/GN swipe helpers. */

export const MOBILE_NAV_BREAKPOINT_PX = 720;

export const MOBILE_NAV_PRIMARY = Object.freeze([
  { tab: "home", labelKey: "t_home", icon: "⌂" },
  { tab: "gm", labelKey: "t_gm", icon: "☀" },
  { tab: "gn", labelKey: "t_gn", icon: "☾" },
  { tab: "wallet", labelKey: "t_wallet", icon: "★" },
  { tab: "more", labelKey: "mobile_nav_more", icon: "⋯" },
]);

export const MOBILE_NAV_MORE = Object.freeze([
  { tab: "referrals", labelKey: "t_ref" },
  { tab: "leaderboard", labelKey: "t_lb" },
  { tab: "themes", labelKey: "t_themes" },
  { tab: "extthemes", labelKey: "t_extthemes" },
  { tab: "prediction", labelKey: "t_prediction" },
  { tab: "arcade", labelKey: "mobile_nav_arcade", href: "/arcade.html" },
]);

export const GMGN_SWIPE_TABS = Object.freeze(["gm", "gn"]);
export const SWIPE_MIN_PX = 56;
export const SWIPE_MAX_VERTICAL_RATIO = 1.35;

export function isGmGnTab(tab) {
  return tab === "gm" || tab === "gn";
}

export function resolveGmGnSwipeTarget(currentTab, dx) {
  if (!isGmGnTab(currentTab)) return null;
  if (Math.abs(dx) < SWIPE_MIN_PX) return null;
  if (currentTab === "gm" && dx < 0) return "gn";
  if (currentTab === "gn" && dx > 0) return "gm";
  return null;
}

export function primaryNavActiveTab(currentTab) {
  const tab = String(currentTab || "").trim().toLowerCase();
  if (MOBILE_NAV_PRIMARY.some((item) => item.tab === tab)) return tab;
  if (tab === "wallet" || tab === "upgrade") return "wallet";
  return "more";
}
