(function (window) {
  if (window.__GMXExtApplyFactory) return;

  window.__GMXExtApplyFactory = function createGMXExtApply(ctx) {
    const $ = typeof ctx.$ === "function" ? ctx.$ : () => null;
    const extLsSet = typeof ctx.extLsSet === "function" ? ctx.extLsSet : () => {};
    const extThemeStorageKey = String(ctx.extThemeStorageKey || "gmx_ext_theme");
    const isPro = typeof ctx.isPro === "function" ? ctx.isPro : () => false;
    const getExtThemes = typeof ctx.getExtThemes === "function" ? ctx.getExtThemes : () => [];
    const unlockedExtThemesCount =
      typeof ctx.unlockedExtThemesCount === "function" ? ctx.unlockedExtThemesCount : () => 0;
    const getStoredExtView =
      typeof ctx.getStoredExtView === "function" ? ctx.getStoredExtView : () => "theme";
    const normalizeExtViewValue =
      typeof ctx.normalizeExtViewValue === "function" ? ctx.normalizeExtViewValue : (v) => v;
    const setExtView = typeof ctx.setExtView === "function" ? ctx.setExtView : () => {};
    const extSyncNow = typeof ctx.extSyncNow === "function" ? ctx.extSyncNow : () => {};
    const normalizeExtWallpaperId =
      typeof ctx.normalizeExtWallpaperId === "function" ? ctx.normalizeExtWallpaperId : (id) => id;
    const normalizeExtWallpaperView =
      typeof ctx.normalizeExtWallpaperView === "function" ? ctx.normalizeExtWallpaperView : (v) => v;
    const currentExtWallpaperTarget =
      typeof ctx.currentExtWallpaperTarget === "function" ? ctx.currentExtWallpaperTarget : () => "all";
    const setExtWallpaperForView =
      typeof ctx.setExtWallpaperForView === "function" ? ctx.setExtWallpaperForView : () => {};
    const removeExtCustomBgLegacy =
      typeof ctx.removeExtCustomBgLegacy === "function" ? ctx.removeExtCustomBgLegacy : () => {};
    const renderExtWallpapers =
      typeof ctx.renderExtWallpapers === "function" ? ctx.renderExtWallpapers : () => {};

    function markExtThemeSelection(id) {
      try {
        const grid = $("extThemeGrid");
        if (!grid) return;
        const cards = grid.querySelectorAll(".themeCard[data-theme-id]");
        cards.forEach((card) => {
          card.classList.toggle("active", card.getAttribute("data-theme-id") === String(id || "").trim());
        });
      } catch (_e) {}
    }

    function applyExtTheme(id) {
      const extThemes = getExtThemes();
      const unlocked = unlockedExtThemesCount();
      const idx = extThemes.findIndex((x) => x.id === id);
      if (!isPro() && (idx < 0 || idx >= unlocked)) return;
      extLsSet(extThemeStorageKey, id);
      markExtThemeSelection(id);
      if (normalizeExtViewValue(getStoredExtView()) !== "theme") setExtView("theme");
      extSyncNow("ext_theme");
      const st = $("extThemeStatus");
      if (st) st.innerHTML = '<span class="ok">Selected.</span>';
    }

    function applyExtWallpaper(id, targetView) {
      const safeId = normalizeExtWallpaperId(id);
      if (!safeId) return;
      const safeTarget = normalizeExtWallpaperView(targetView || currentExtWallpaperTarget());
      setExtWallpaperForView(safeTarget, safeId);
      removeExtCustomBgLegacy();
      if (normalizeExtViewValue(getStoredExtView()) !== "wall") setExtView("wall");
      extSyncNow("ext_wallpaper");
      renderExtWallpapers();
    }

    return { applyExtTheme, applyExtWallpaper, markExtThemeSelection };
  };
})(window);
