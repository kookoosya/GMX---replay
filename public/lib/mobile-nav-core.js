(function (global) {
  if (global.GMXMobileNavCore) return;

  const MOBILE_NAV_BREAKPOINT_PX = 720;

  const MOBILE_NAV_PRIMARY = Object.freeze([
    { tab: "home", labelKey: "t_home", icon: "⌂" },
    { tab: "gm", labelKey: "t_gm", icon: "☀" },
    { tab: "gn", labelKey: "t_gn", icon: "☾" },
    { tab: "wallet", labelKey: "t_wallet", icon: "★" },
    { tab: "more", labelKey: "mobile_nav_more", icon: "⋯" },
  ]);

  const MOBILE_NAV_MORE = Object.freeze([
    { tab: "referrals", labelKey: "t_ref" },
    { tab: "leaderboard", labelKey: "t_lb" },
    { tab: "themes", labelKey: "t_themes" },
    { tab: "extthemes", labelKey: "t_extthemes" },
    { tab: "prediction", labelKey: "t_prediction" },
    { tab: "arcade", labelKey: "mobile_nav_arcade", href: "/arcade.html" },
  ]);

  const GMGN_SWIPE_TABS = Object.freeze(["gm", "gn"]);
  const SWIPE_MIN_PX = 56;
  const SWIPE_MAX_VERTICAL_RATIO = 1.35;

  function isGmGnTab(tab) {
    return tab === "gm" || tab === "gn";
  }

  function resolveGmGnSwipeTarget(currentTab, dx) {
    if (!isGmGnTab(currentTab)) return null;
    if (Math.abs(dx) < SWIPE_MIN_PX) return null;
    if (currentTab === "gm" && dx < 0) return "gn";
    if (currentTab === "gn" && dx > 0) return "gm";
    return null;
  }

  function primaryNavActiveTab(currentTab) {
    const tab = String(currentTab || "").trim().toLowerCase();
    if (MOBILE_NAV_PRIMARY.some((item) => item.tab === tab)) return tab;
    if (tab === "wallet" || tab === "upgrade") return "wallet";
    return "more";
  }

  global.GMXMobileNavCore = {
    MOBILE_NAV_BREAKPOINT_PX,
    MOBILE_NAV_PRIMARY,
    MOBILE_NAV_MORE,
    GMGN_SWIPE_TABS,
    SWIPE_MIN_PX,
    SWIPE_MAX_VERTICAL_RATIO,
    isGmGnTab,
    resolveGmGnSwipeTarget,
    primaryNavActiveTab,
  };
})(typeof globalThis !== "undefined" ? globalThis : window);
