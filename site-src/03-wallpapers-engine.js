  // Wallpapers — per-tab. Photo pack (webp under /assets/wallpapers/v2_*.webp).
  const LS_WP_GLOBAL = K.WP_GLOBAL;
  const LS_WP_TAB_PREFIX = K.WP_TAB_PREFIX;
  const SITE_WALLPAPER_PACK_COUNT = __gmxWp.SITE_PACK_COUNT;
  const SITE_WALLPAPER_FREE_PACK_COUNT = __gmxWp.SITE_FREE_PACK_COUNT;
  const CUSTOM_WP_FREE_COUNT = __gmxWp.CUSTOM_WP_FREE_COUNT;
  const CUSTOM_UPLOAD_ID = __gmxWp.CUSTOM_UPLOAD_ID;
  const CUSTOM_WP_RE = __gmxWp.CUSTOM_WP_RE;
  const WALLPAPERS = __gmxWp.buildSiteWallpapers();
  const WALLPAPER_TABS = __gmxWpStore.SITE_WALLPAPER_TABS;

  async function loadCustomWallpapers(){ return __gmxCustomWp.loadCustomWallpapers(); }

  function normalizeWallpaperId(id){
    return __gmxWp.normalizeWallpaperId(id, WALLPAPERS);
  }

  __gmxWpStore.normalizeAllWallpapers();

  function normalizeExtWallpaperIdLocal(id){
    return __gmxWp.normalizeExtWallpaperIdLocal(id, EXT_WALLPAPERS);
  }

  function extWallpaperAssetPath(id){
    return __gmxWp.extWallpaperAssetPath(id, EXT_WALLPAPERS);
  }

  function extWallpaperFullUrl(id){
    return __gmxWp.extWallpaperFullUrl(id, EXT_WALLPAPERS);
  }

  function extWallpaperThumbUrl(id){
    return __gmxWp.extWallpaperThumbUrl(id, EXT_WALLPAPERS);
  }
  try{ __gmxExtWpStore.normalizeStoredExtWallpaperSelections(); }catch{}

  const TOP_LEVEL_TABS = ["home","gm","gn","prediction","referrals","leaderboard","themes","extthemes","wallet","admin"];
  function normalizeTopLevelTab(raw){
    const name = String(raw || "").trim().toLowerCase();
    if (name === "upgrade") return "wallet";
    if (name === "extension-themes" || name === "extthemes") return "extthemes";
    return TOP_LEVEL_TABS.includes(name) ? name : "home";
  }

  let CURRENT_TAB = "home";
  function currentTabName(){ return CURRENT_TAB; }

  function wallpaperKeyForTab(tab){ return __gmxWpStore.wallpaperKeyForTab(tab); }
  function getWallpaperForTab(tab){ return __gmxWpStore.getWallpaperForTab(tab); }
  function setWallpaperForTab(tab, id){ return __gmxWpStore.setWallpaperForTab(tab, id); }
  function migrateLegacyWallpaperSelectionOnce(){ return __gmxWpStore.migrateLegacyWallpaperSelectionOnce(); }

  function wallpaperAssetPath(id){
    return __gmxWp.wallpaperAssetPath(id);
  }

  function wallpaperFullUrl(id){
    return __gmxWp.wallpaperFullUrl(id, WALLPAPERS);
  }

  function wallpaperThumbUrl(id){
    return __gmxWp.wallpaperThumbUrl(id, WALLPAPERS);
  }

  function wallpaperUrl(id){
    return __gmxWp.wallpaperUrl(id, WALLPAPERS);
  }

  function wallpaperUnlocked(wp, idx, effectiveCustomLen){
    if (!wp) return false;
    if (wp.tier === "custom"){
      const customIdx = idx;
      return isPro() || customIdx < CUSTOM_WP_FREE_COUNT;
    }
    const mainIdx = idx - (effectiveCustomLen || 0);
    return isPro() || (mainIdx < unlockedCountByRefs(WALLPAPERS.length, FREE_VISIBLE_WALLPAPERS));
  }

  function effectiveCustomWallpapersSite(){ return __gmxCustomWp.getEffectiveCustomWallpapersSite(); }

  function ensureWallpaperLayer(){ return __gmxWp.ensureWallpaperLayer(); }
  function setWallpaperLayerImage(layer, url){ return __gmxWp.setWallpaperLayerImage(layer, url); }

  function applyWallpaper(tab){ return __gmxWpApply.applyWallpaper(tab); }

  function sanitizeI18nValue(lang, value, fallback){ return __gmxI18nUi.sanitizeI18nValue(lang, value, fallback); }
  function trWp(k){ return __gmxI18nUi.tr(k); }
  function t(k){ return __gmxI18nUi.t(k); }
  function prettyError(code){ return __gmxI18nUi.prettyError(code); }

  function renderWallpaperUI(){ return __gmxWpUi.renderWallpaperUI(); }
  function setThemeWallView(view){ return __gmxWpUi.setThemeWallView(view); }
  function initThemeWallTabs(){ return __gmxWpUi.initThemeWallTabs(); }
  function initWallpapers(){ return __gmxWpUi.initWallpapers(); }

  let SITE_LANGS = [["en","English"]];
  let REPLY_LANGS = [["en","English"]];

  function flagEmoji(code){ return __gmxLangUi.flagEmoji(code); }
  function updateLangFlags(){ return __gmxLangUi.updateLangFlags(); }
  function renderLangChips(kind){ return __gmxLangUi.renderLangChips(kind); }
