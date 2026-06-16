(function (window) {
  if (window.__GMXTabStateFactory) return;

  const TOP_LEVEL_TABS = [
    "home",
    "gm",
    "gn",
    "prediction",
    "referrals",
    "leaderboard",
    "themes",
    "extthemes",
    "wallet",
    "admin",
  ];

  window.__GMXTabStateFactory = function createGMXTabState() {
    let currentTab = "home";

    function normalizeTopLevelTab(raw) {
      const name = String(raw || "").trim().toLowerCase();
      if (name === "upgrade") return "wallet";
      if (name === "extension-themes" || name === "extthemes") return "extthemes";
      return TOP_LEVEL_TABS.includes(name) ? name : "home";
    }

    function getCurrentTab() {
      return currentTab;
    }

    function setCurrentTab(name) {
      currentTab = normalizeTopLevelTab(name);
    }

    return { TOP_LEVEL_TABS, normalizeTopLevelTab, getCurrentTab, setCurrentTab };
  };
})(window);
