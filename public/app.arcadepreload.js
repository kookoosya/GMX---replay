(function (window) {
  if (window.__GMXArcadePreloadFactory) return;

  const LINK_IDS = ["t_arcade", "btnArcade", "mmore_arcade"];
  const PATHS = { page: "/arcade.html", script: "/arcade.js?v=SAFE17" };

  window.__GMXArcadePreloadFactory = function createGMXArcadePreload(ctx) {
    ctx = ctx || {};
    const $ = typeof ctx.$ === "function" ? ctx.$ : (id) => document.getElementById(id);
    const prefetched = new Set();
    let armed = false;

    function shouldSkip() {
      try {
        if (navigator.connection?.saveData) return true;
      } catch {}
      try {
        const path = String(window.location?.pathname || "");
        if (path.endsWith("/arcade.html") || path.includes("/arcade/")) return true;
      } catch {}
      return false;
    }

    function injectPrefetch(href, as) {
      const url = String(href || "").trim();
      if (!url || prefetched.has(url)) return;
      prefetched.add(url);
      try {
        const link = document.createElement("link");
        link.rel = "prefetch";
        if (as) link.as = as;
        link.href = url;
        document.head.appendChild(link);
      } catch {}
    }

    function preloadArcade() {
      if (shouldSkip()) return;
      injectPrefetch(PATHS.page, "document");
      injectPrefetch(PATHS.script, "script");
    }

    function bindTrigger(el) {
      if (!el || el.dataset.arcadePreloadBound === "1") return;
      el.dataset.arcadePreloadBound = "1";
      el.addEventListener("pointerenter", preloadArcade, { passive: true });
      el.addEventListener("focusin", preloadArcade);
    }

    function bindArcadePreload() {
      if (armed || shouldSkip()) return;
      armed = true;
      for (const id of LINK_IDS) bindTrigger($(id));
    }

    return { bindArcadePreload, preloadArcade };
  };
})(window);
