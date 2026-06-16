(function (window) {
  if (window.__GMXSiteModeFactory) return;

  window.__GMXSiteModeFactory = function createGMXSiteMode(ctx) {
    ctx = ctx || {};
    const $ = typeof ctx.$ === "function" ? ctx.$ : (id) => document.getElementById(id);
    const siteModeKey = ctx.siteModeKey || "gmx_site_mode";
    const lsGet =
      typeof ctx.lsGet === "function"
        ? ctx.lsGet
        : (k, fb = "") => {
            try {
              const v = localStorage.getItem(k);
              return v === null || v === undefined ? fb : v;
            } catch {
              return fb;
            }
          };
    const lsSet =
      typeof ctx.lsSet === "function"
        ? ctx.lsSet
        : (k, v) => {
            try {
              localStorage.setItem(k, String(v));
            } catch {}
          };
    const doc = ctx.document || document;

    function applySiteMode(mode, persist) {
      const m = mode === "light" ? "light" : "dark";
      doc.documentElement.classList.toggle("mode-light", m === "light");
      if (persist) lsSet(siteModeKey, m);
      const btn = $("btnMode");
      if (btn) btn.textContent = m === "light" ? "Dark" : "Light";
      return m;
    }

    function getMode() {
      let m = lsGet(siteModeKey, "");
      if (!m) m = doc.documentElement.classList.contains("mode-light") ? "light" : "dark";
      return m === "light" ? "light" : "dark";
    }

    function initModeToggle() {
      const btn = $("btnMode");
      if (!btn) return;
      applySiteMode(getMode(), false);
      btn.addEventListener("click", () => {
        const now = doc.documentElement.classList.contains("mode-light") ? "light" : "dark";
        applySiteMode(now === "light" ? "dark" : "light", true);
      });
    }

    return { applySiteMode, getMode, initModeToggle };
  };
})(window);
