(function (window) {
  if (window.__GMXWallpapersWireFactory) return;

  window.__GMXWallpapersWireFactory = function createGMXWallpapersWire(ctx) {
    ctx = ctx || {};
    if (ctx.mod && ctx.keys?.K) {
      const keys = ctx.keys || {};
    const mod = ctx.mod || {};

    ctx = {
        keys: keys.K,
        wp: mod.wp,
        wpStore: mod.wpStore,
        customWp: mod.customWp,
        wpHelpers: mod.wpHelpers,
        extWpStore: mod.extWpStore,
        tabState: mod.tabState,
        wpApply: mod.wpApply,
        i18nUi: mod.i18nUi,
        wpUi: mod.wpUi,
        langUi: mod.langUi,
      };
    }
    const keys = ctx.keys || {};
    const wp = ctx.wp || {};
    const wpStore = ctx.wpStore || {};
    const customWp = ctx.customWp || {};
    const wpHelpers = ctx.wpHelpers || {};
    const extWpStore = ctx.extWpStore || {};
    const tabState = ctx.tabState || {};
    const wpApply = ctx.wpApply || {};
    const i18nUi = ctx.i18nUi || {};
    const wpUi = ctx.wpUi || {};
    const langUi = ctx.langUi || {};

    const LS_WP_GLOBAL = keys.WP_GLOBAL;
    const LS_WP_TAB_PREFIX = keys.WP_TAB_PREFIX;
    const SITE_WALLPAPER_FREE_PACK_COUNT = wp.SITE_FREE_PACK_COUNT;
    const CUSTOM_WP_FREE_COUNT = wp.CUSTOM_WP_FREE_COUNT;
    const CUSTOM_UPLOAD_ID = wp.CUSTOM_UPLOAD_ID;
    const CUSTOM_WP_RE = wp.CUSTOM_WP_RE;
    const WALLPAPERS = typeof wp.buildSiteWallpapers === "function" ? wp.buildSiteWallpapers() : [];
    const WALLPAPER_TABS = wpStore.SITE_WALLPAPER_TABS;

    async function loadCustomWallpapers() {
      return customWp.loadCustomWallpapers?.();
    }
    function normalizeWallpaperId(id) {
      return wpHelpers.normalizeWallpaperId?.(id);
    }

    wpStore.normalizeAllWallpapers?.();

    function normalizeExtWallpaperIdLocal(id) {
      return wpHelpers.normalizeExtWallpaperIdLocal?.(id);
    }
    function extWallpaperAssetPath(id) {
      return wpHelpers.extWallpaperAssetPath?.(id);
    }
    function extWallpaperFullUrl(id) {
      return wpHelpers.extWallpaperFullUrl?.(id);
    }
    function extWallpaperThumbUrl(id) {
      return wpHelpers.extWallpaperThumbUrl?.(id);
    }
    try {
      extWpStore.normalizeStoredExtWallpaperSelections?.();
    } catch (_e) {}

    function normalizeTopLevelTab(raw) {
      return tabState.normalizeTopLevelTab?.(raw);
    }
    function currentTabName() {
      return tabState.getCurrentTab?.();
    }
    function wallpaperKeyForTab(tab) {
      return wpStore.wallpaperKeyForTab?.(tab);
    }
    function getWallpaperForTab(tab) {
      return wpStore.getWallpaperForTab?.(tab);
    }
    function setWallpaperForTab(tab, id) {
      return wpStore.setWallpaperForTab?.(tab, id);
    }
    function migrateLegacyWallpaperSelectionOnce() {
      return wpStore.migrateLegacyWallpaperSelectionOnce?.();
    }
    function wallpaperAssetPath(id) {
      return wpHelpers.wallpaperAssetPath?.(id);
    }
    function wallpaperFullUrl(id) {
      return wpHelpers.wallpaperFullUrl?.(id);
    }
    function wallpaperThumbUrl(id) {
      return wpHelpers.wallpaperThumbUrl?.(id);
    }
    function wallpaperUrl(id) {
      return wpHelpers.wallpaperUrl?.(id);
    }
    function wallpaperUnlocked(wpItem, idx, effectiveCustomLen) {
      return wpHelpers.wallpaperUnlocked?.(wpItem, idx, effectiveCustomLen);
    }
    function effectiveCustomWallpapersSite() {
      return customWp.getEffectiveCustomWallpapersSite?.();
    }
    function ensureWallpaperLayer() {
      return wp.ensureWallpaperLayer?.();
    }
    function setWallpaperLayerImage(layer, url) {
      return wp.setWallpaperLayerImage?.(layer, url);
    }
    function applyWallpaper(tab) {
      return wpApply.applyWallpaper?.(tab);
    }
    function sanitizeI18nValue(lang, value, fallback) {
      return i18nUi.sanitizeI18nValue?.(lang, value, fallback);
    }
    function trWp(k) {
      return i18nUi.tr?.(k);
    }
    function t(k) {
      return i18nUi.t?.(k);
    }
    function prettyError(code) {
      return i18nUi.prettyError?.(code);
    }
    function renderWallpaperUI() {
      return wpUi.renderWallpaperUI?.();
    }
    function setThemeWallView(view) {
      return wpUi.setThemeWallView?.(view);
    }
    function initThemeWallTabs() {
      return wpUi.initThemeWallTabs?.();
    }
    function initWallpapers() {
      return wpUi.initWallpapers?.();
    }
    function flagEmoji(code) {
      return langUi.flagEmoji?.(code);
    }
    function updateLangFlags() {
      return langUi.updateLangFlags?.();
    }
    function renderLangChips(kind) {
      return langUi.renderLangChips?.(kind);
    }

    return {
      LS_WP_GLOBAL,
      LS_WP_TAB_PREFIX,
      SITE_WALLPAPER_FREE_PACK_COUNT,
      CUSTOM_WP_FREE_COUNT,
      CUSTOM_UPLOAD_ID,
      CUSTOM_WP_RE,
      WALLPAPERS,
      WALLPAPER_TABS,
      loadCustomWallpapers,
      normalizeWallpaperId,
      normalizeExtWallpaperIdLocal,
      extWallpaperAssetPath,
      extWallpaperFullUrl,
      extWallpaperThumbUrl,
      normalizeTopLevelTab,
      currentTabName,
      wallpaperKeyForTab,
      getWallpaperForTab,
      setWallpaperForTab,
      migrateLegacyWallpaperSelectionOnce,
      wallpaperAssetPath,
      wallpaperFullUrl,
      wallpaperThumbUrl,
      wallpaperUrl,
      wallpaperUnlocked,
      effectiveCustomWallpapersSite,
      ensureWallpaperLayer,
      setWallpaperLayerImage,
      applyWallpaper,
      sanitizeI18nValue,
      trWp,
      t,
      prettyError,
      renderWallpaperUI,
      setThemeWallView,
      initThemeWallTabs,
      initWallpapers,
      flagEmoji,
      updateLangFlags,
      renderLangChips,
    };
  };
})(window);
