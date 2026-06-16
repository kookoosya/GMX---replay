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

  function normalizeWallpaperId(id){ return __gmxWpHelpers.normalizeWallpaperId(id); }

  __gmxWpStore.normalizeAllWallpapers();

  function normalizeExtWallpaperIdLocal(id){ return __gmxWpHelpers.normalizeExtWallpaperIdLocal(id); }
  function extWallpaperAssetPath(id){ return __gmxWpHelpers.extWallpaperAssetPath(id); }
  function extWallpaperFullUrl(id){ return __gmxWpHelpers.extWallpaperFullUrl(id); }
  function extWallpaperThumbUrl(id){ return __gmxWpHelpers.extWallpaperThumbUrl(id); }
  try{ __gmxExtWpStore.normalizeStoredExtWallpaperSelections(); }catch{}

  function normalizeTopLevelTab(raw){ return __gmxTabState.normalizeTopLevelTab(raw); }
  function currentTabName(){ return __gmxTabState.getCurrentTab(); }

  function wallpaperKeyForTab(tab){ return __gmxWpStore.wallpaperKeyForTab(tab); }
  function getWallpaperForTab(tab){ return __gmxWpStore.getWallpaperForTab(tab); }
  function setWallpaperForTab(tab, id){ return __gmxWpStore.setWallpaperForTab(tab, id); }
  function migrateLegacyWallpaperSelectionOnce(){ return __gmxWpStore.migrateLegacyWallpaperSelectionOnce(); }

  function wallpaperAssetPath(id){ return __gmxWpHelpers.wallpaperAssetPath(id); }
  function wallpaperFullUrl(id){ return __gmxWpHelpers.wallpaperFullUrl(id); }
  function wallpaperThumbUrl(id){ return __gmxWpHelpers.wallpaperThumbUrl(id); }
  function wallpaperUrl(id){ return __gmxWpHelpers.wallpaperUrl(id); }
  function wallpaperUnlocked(wp, idx, effectiveCustomLen){
    return __gmxWpHelpers.wallpaperUnlocked(wp, idx, effectiveCustomLen);
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
