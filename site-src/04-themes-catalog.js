  // ----- Themes + Writing Styles (gating) -----
  const THEMES = __gmxThemes.THEMES;
  const EXT_THEMES = __gmxThemes.EXT_THEMES;
  const STYLES = __gmxThemes.STYLES;
  const GM_PACKS = __gmxThemes.GM_PACKS;
  const GN_PACKS = __gmxThemes.GN_PACKS;
  const PACKS = __gmxThemes.PACKS;

  const EXT_WALLPAPER_PACK_COUNT = __gmxWp.EXT_PACK_COUNT;
  const EXT_WALLPAPER_FREE_PACK_COUNT = __gmxWp.EXT_FREE_PACK_COUNT;
  const EXT_WALLPAPERS = __gmxWp.buildExtWallpapers();
  function migrateLegacyExtWallpaperSelectionOnce(){
    try{
      const done = "gmx_ext_wallpaper_pexels_v2";
      if (localStorage.getItem(done) === "1") return;
      localStorage.setItem(done, "1");
    }catch{}
  }

  function packsForKind(kind){
    return __gmxThemes.packsForKind(kind);
  }

  function getAntiStrength(kind){ return __gmxGp.getAntiStrength(kind); }
  function readGenParams(kind){ return __gmxGp.readGenParams(kind); }
  function applyPackDefaultsToUi(kind, pack){ return __gmxGp.applyPackDefaultsToUi(kind, pack); }
  function unlockedPacksCountFor(kind){ return __gmxGp.unlockedPacksCountFor(kind); }
  function fillPacks(){ return __gmxGp.fillPacks(); }

  function unlockedThemesCount(){ return unlockedCountByRefs(THEMES.length, FREE_VISIBLE_THEMES); }
  function unlockedStylesCount(){ return unlockedCountByRefs(STYLES.length, FREE_VISIBLE_STYLES); }

  function rgbaToRgbTuple(s){ return __gmxThemes.rgbaToRgbTuple(s); }
  function relLum(rgb){ return __gmxThemes.relLum(rgb); }
  function pickAccentOn(a,b){ return __gmxThemes.pickAccentOn(a,b); }
