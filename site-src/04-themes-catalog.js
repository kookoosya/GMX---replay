  if (!window.__GMXThemesCatalogWireFactory) throw new Error("GMX themescatalogwire factory missing");
  const __gmxThemesCatalogWire = window.__GMXThemesCatalogWireFactory({
    themes: __gmxThemes,
    wp: __gmxWp,
    gp: __gmxGp,
    styles: __gmxStyles,
    unlockedCountByRefs,
    freeVisibleThemes: FREE_VISIBLE_THEMES,
  });
  const {
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
    applyPackDefaultsToUi,
    fillPacks,
    unlockedThemesCount,
    unlockedStylesCount,
    rgbaToRgbTuple,
    relLum,
    pickAccentOn,
  } = __gmxThemesCatalogWire;
  function packsForKind(kind){ return __gmxThemesCatalogWire.packsForKind(kind); }
  function getAntiStrength(kind){ return __gmxThemesCatalogWire.getAntiStrength(kind); }
  function readGenParams(kind){ return __gmxThemesCatalogWire.readGenParams(kind); }
  function unlockedPacksCountFor(kind){ return __gmxThemesCatalogWire.unlockedPacksCountFor(kind); }
