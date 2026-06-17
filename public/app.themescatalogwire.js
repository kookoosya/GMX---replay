(function (window) {
  if (window.__GMXThemesCatalogWireFactory) return;

  window.__GMXThemesCatalogWireFactory = function createGMXThemesCatalogWire(ctx) {
    ctx = ctx || {};
    const themes = ctx.themes || {};
    const wp = ctx.wp || {};
    const gp = ctx.gp || {};
    const styles = ctx.styles || {};
    const unlockedCountByRefs =
      typeof ctx.unlockedCountByRefs === "function" ? ctx.unlockedCountByRefs : () => 0;
    const freeVisibleThemes = Number(ctx.freeVisibleThemes) || 0;

    const THEMES = themes.THEMES;
    const EXT_THEMES = themes.EXT_THEMES;
    const STYLES = themes.STYLES;
    const GM_PACKS = themes.GM_PACKS;
    const GN_PACKS = themes.GN_PACKS;
    const PACKS = themes.PACKS;
    const EXT_WALLPAPER_PACK_COUNT = wp.EXT_PACK_COUNT;
    const EXT_WALLPAPER_FREE_PACK_COUNT = wp.EXT_FREE_PACK_COUNT;
    const EXT_WALLPAPERS = typeof wp.buildExtWallpapers === "function" ? wp.buildExtWallpapers() : [];

    function migrateLegacyExtWallpaperSelectionOnce() {
      try {
        const done = "gmx_ext_wallpaper_pexels_v2";
        if (localStorage.getItem(done) === "1") return;
        localStorage.setItem(done, "1");
      } catch (_e) {}
    }
    function packsForKind(kind) {
      return themes.packsForKind?.(kind);
    }
    function getAntiStrength(kind) {
      return gp.getAntiStrength?.(kind);
    }
    function readGenParams(kind) {
      return gp.readGenParams?.(kind);
    }
    function applyPackDefaultsToUi(kind, pack) {
      return gp.applyPackDefaultsToUi?.(kind, pack);
    }
    function unlockedPacksCountFor(kind) {
      return gp.unlockedPacksCountFor?.(kind);
    }
    function fillPacks() {
      return gp.fillPacks?.();
    }
    function unlockedThemesCount() {
      return unlockedCountByRefs(Array.isArray(THEMES) ? THEMES.length : 0, freeVisibleThemes);
    }
    function unlockedStylesCount() {
      return styles.unlockedStylesCount?.();
    }
    function rgbaToRgbTuple(s) {
      return themes.rgbaToRgbTuple?.(s);
    }
    function relLum(rgb) {
      return themes.relLum?.(rgb);
    }
    function pickAccentOn(a, b) {
      return themes.pickAccentOn?.(a, b);
    }

    return {
      THEMES,
      EXT_THEMES,
      STYLES,
      GM_PACKS,
      GN_PACKS,
      PACKS,
      EXT_WALLPAPER_PACK_COUNT,
      EXT_WALLPAPER_FREE_PACK_COUNT,
      EXT_WALLPAPERS,
      migrateLegacyExtWallpaperSelectionOnce,
      packsForKind,
      getAntiStrength,
      readGenParams,
      applyPackDefaultsToUi,
      unlockedPacksCountFor,
      fillPacks,
      unlockedThemesCount,
      unlockedStylesCount,
      rgbaToRgbTuple,
      relLum,
      pickAccentOn,
    };
  };
})(window);
