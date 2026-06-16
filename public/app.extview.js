(function (window) {
  if (window.__GMXExtViewFactory) return;

  window.__GMXExtViewFactory = function createGMXExtView(ctx) {
    const $ = typeof ctx.$ === "function" ? ctx.$ : () => null;
    const getStoredExtView =
      typeof ctx.getStoredExtView === "function" ? ctx.getStoredExtView : () => "theme";
    const setStoredExtView =
      typeof ctx.setStoredExtView === "function" ? ctx.setStoredExtView : () => {};
    const renderExtThemes =
      typeof ctx.renderExtThemes === "function" ? ctx.renderExtThemes : () => {};
    const renderExtWallpapers =
      typeof ctx.renderExtWallpapers === "function" ? ctx.renderExtWallpapers : () => {};

    let __extSyncDebounce = 0;

    function extSyncNow(reason) {
      try {
        clearTimeout(__extSyncDebounce);
      } catch (_e) {}
      __extSyncDebounce = setTimeout(() => {
        try {
          window.postMessage({ type: "GMX_SYNC_NOW", reason: reason || "ext_ui_change" }, "*");
        } catch (_e) {}
      }, 90);
    }

    function normalizeExtViewValue(view) {
      const v = String(view || "").trim().toLowerCase();
      if (v === "wall" || v === "custom") return v;
      return "theme";
    }

    function setExtView(view, opts) {
      const safeView = normalizeExtViewValue(view);
      const prev = normalizeExtViewValue(getStoredExtView());
      setStoredExtView(safeView);
      const options = opts || {};
      if (!options.silent && prev !== safeView) extSyncNow("ext_view");
      const btnTheme = $("extTabTheme");
      const btnWall = $("extTabWall");
      const paneTheme = $("extThemePane");
      const paneWall = $("extWallPane");
      if (!btnTheme || !btnWall || !paneTheme || !paneWall) return;

      btnTheme.classList.toggle("active", safeView === "theme");
      btnWall.classList.toggle("active", safeView === "wall");

      btnTheme.setAttribute("aria-selected", safeView === "theme" ? "true" : "false");
      btnWall.setAttribute("aria-selected", safeView === "wall" ? "true" : "false");

      paneTheme.classList.toggle("hidden", safeView !== "theme");
      paneWall.classList.toggle("hidden", safeView !== "wall");

      const hasRenderedContent =
        safeView === "theme"
          ? !!paneTheme.querySelector(".themeCard")
          : !!paneWall.querySelector(".wpCard");
      const shouldRender = options.force === true || prev !== safeView || !hasRenderedContent;
      if (safeView === "theme" && shouldRender) renderExtThemes();
      if (safeView === "wall" && shouldRender) renderExtWallpapers();
    }

    function bindExtTabs() {
      if (bindExtTabs._done) return;
      bindExtTabs._done = true;

      const themeBtn = $("extTabTheme");
      const wallBtn = $("extTabWall");

      if (themeBtn) themeBtn.addEventListener("click", () => setExtView("theme"));
      if (wallBtn) wallBtn.addEventListener("click", () => setExtView("wall"));
    }

    return { normalizeExtViewValue, setExtView, bindExtTabs, extSyncNow };
  };
})(window);
