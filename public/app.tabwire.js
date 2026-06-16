(function (window) {
  if (window.__GMXTabWireFactory) return;

  window.__GMXTabWireFactory = function createGMXTabWire(ctx) {
    const normalizeTopLevelTab =
      typeof ctx.normalizeTopLevelTab === "function" ? ctx.normalizeTopLevelTab : (n) => n;
    const showTab = typeof ctx.showTab === "function" ? ctx.showTab : () => {};
    const trackEvent = typeof ctx.trackEvent === "function" ? ctx.trackEvent : () => {};
    const ensurePredictionTabVisible =
      typeof ctx.ensurePredictionTabVisible === "function"
        ? ctx.ensurePredictionTabVisible
        : () => {};

    function tab(name) {
      const nextTab = name === "_force_home" ? "home" : normalizeTopLevelTab(name);
      showTab(nextTab);
      try {
        trackEvent("tab_open", { tab: String(nextTab || "") });
      } catch (_e) {}
    }

    function wireTabButtons() {
      ensurePredictionTabVisible();
      document.querySelectorAll(".tab").forEach((b) => {
        b.addEventListener("click", () => tab(b.dataset.tab));
      });
      try {
        globalThis.__gmxShowTab = tab;
      } catch (_e) {}
      try {
        globalThis.switchTab = tab;
      } catch (_e) {}
    }

    return { tab, wireTabButtons };
  };
})(window);
