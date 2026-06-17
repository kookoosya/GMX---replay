(function (window) {
  if (window.__GMXShellDepsFactory) return;

  window.__GMXShellDepsFactory = function createGMXShellDeps(ctx) {
    ctx = ctx || {};
    const K = ctx.K || {};
    const storage = ctx.storage || {};
    const logs = ctx.logs || {};
    const cleanfill = ctx.cleanfill || {};
    const antirepeat = ctx.antirepeat || {};
    const custombg = ctx.custombg || {};
    const tabtheme = ctx.tabtheme || {};

    function logEvent(type, data) {
      return logs.logEvent?.(type, data);
    }

    const LS_HANDLE = K.HANDLE;
    const LS_TOKEN = K.TOKEN;
    const LS_IS_ADMIN = K.IS_ADMIN;
    const LS_ADMIN_CLAIMABLE = K.ADMIN_CLAIMABLE;
    const LS_SITE_LANG = K.SITE_LANG;
    const LS_LAST_TAB = K.LAST_TAB;
    const LS_REF_PROMO_OPEN = K.REF_PROMO_OPEN;
    const LS_GM_REPLY_LANG = K.GM_REPLY_LANG;
    const LS_GN_REPLY_LANG = K.GN_REPLY_LANG;
    const LS_BEST_ENABLED = K.BEST_ENABLED;
    const LS_FORCE_LOGOUT = K.FORCE_LOGOUT;
    const LS_FORCE_LOGOUT_V2 = K.FORCE_LOGOUT_V2;
    const LS_TOGGLES_BOOTSTRAP_V2 = K.TOGGLES_BOOTSTRAP_V2;
    const GM_GLOBAL = K.GM_GLOBAL;
    const GN_GLOBAL = K.GN_GLOBAL;
    const GM_LANGS = K.GM_LANGS;
    const GN_LANGS = K.GN_LANGS;
    const LS_CUSTOM_BG = K.CUSTOM_BG;
    const LS_CUSTOM_BG_GLOBAL = K.CUSTOM_BG_GLOBAL;
    const LS_GM_PACK = K.GM_PACK;
    const LS_GN_PACK = K.GN_PACK;
    const LS_GM_ANTI = K.GM_ANTI;
    const LS_GN_ANTI = K.GN_ANTI;
    const LS_GM_CLEAN_FILL = K.GM_CLEAN_FILL;
    const LS_GN_CLEAN_FILL = K.GN_CLEAN_FILL;
    const CLEAN_FILL_STRENGTH = cleanfill.CLEAN_FILL_STRENGTH;
    const LS_GM_RECENT = K.GM_RECENT;
    const LS_GN_RECENT = K.GN_RECENT;
    const LS_CLEAN_FILL_BOOTSTRAP = K.CLEAN_FILL_BOOTSTRAP;
    const TABS = custombg.TABS;
    const TABS_PUBLIC = custombg.TABS_PUBLIC;
    const TAB_THEME = tabtheme.TAB_THEME;

    function getAdminToken() {
      return storage.getAdminToken?.();
    }
    function setAdminToken(t) {
      storage.setAdminToken?.(t);
    }
    function isAdminSignedIn() {
      return storage.isAdminSignedIn?.();
    }
    function antiWindow(strength) {
      return antirepeat.antiWindow?.(strength);
    }
    function lsKeyCleanFill(kind) {
      return storage.lsKeyCleanFill?.(kind);
    }
    function getCleanFillEnabled(kind) {
      return cleanfill.getEnabled?.(kind);
    }
    function setCleanFillEnabled(kind, next, silent) {
      return cleanfill.setEnabled?.(kind, next, silent);
    }
    function cleanFillCopy(kind) {
      return cleanfill.copyForKind?.(kind);
    }
    function syncCleanFillUi(kind) {
      return cleanfill.syncUi?.(kind);
    }
    function lsKeyPack(kind) {
      return storage.lsKeyPack?.(kind);
    }
    function lsKeyAnti(kind) {
      return storage.lsKeyAnti?.(kind);
    }
    function lsKeyRecent(kind) {
      return storage.lsKeyRecent?.(kind);
    }
    function getRecent(kind) {
      return antirepeat.getRecent?.(kind);
    }
    function customBgKeyForTab(tab) {
      return custombg.customBgKeyForTab?.(tab);
    }
    function getCustomBgForTab(tab) {
      return custombg.getCustomBgForTab?.(tab);
    }
    function clearCustomBgForTab(tab) {
      return custombg.clearCustomBgForTab?.(tab);
    }
    function setCustomBgForTab(tab, dataUrl) {
      return custombg.setCustomBgForTab?.(tab, dataUrl);
    }
    function listCustomBgUsedTabs() {
      return custombg.listCustomBgUsedTabs?.();
    }
    function customBgUnlockedTabCount() {
      return custombg.customBgUnlockedTabCount?.();
    }
    function canSetCustomBgOnTab(tab) {
      return custombg.canSetCustomBgOnTab?.(tab);
    }
    function requiredRefsForCustomBgTab(tab) {
      return custombg.requiredRefsForCustomBgTab?.(tab);
    }
    function readFileAsDataURL(file) {
      return custombg.readFileAsDataURL?.(file);
    }
    function loadImage(src) {
      return custombg.loadImage?.(src);
    }
    async function compressImageToJpegDataURL(file, options) {
      return custombg.compressImageToJpegDataURL?.(file, options);
    }
    async function fitImageToCoverDataUrl(file, maxW, maxH, quality) {
      return custombg.fitImageToCoverDataUrl?.(file, maxW, maxH, quality);
    }
    function applyUserBg(tab) {
      return custombg.applyUserBg?.(tab);
    }
    function renderCustomBgUI() {
      /* merged into wallpapers tab */
    }
    function syncCustomBgUI() {
      /* merged into wallpapers tab */
    }

    return {
      logEvent,
      LS_HANDLE,
      LS_TOKEN,
      getAdminToken,
      setAdminToken,
      isAdminSignedIn,
      LS_IS_ADMIN,
      LS_ADMIN_CLAIMABLE,
      LS_SITE_LANG,
      LS_LAST_TAB,
      LS_REF_PROMO_OPEN,
      LS_GM_REPLY_LANG,
      LS_GN_REPLY_LANG,
      LS_BEST_ENABLED,
      LS_FORCE_LOGOUT,
      LS_FORCE_LOGOUT_V2,
      LS_TOGGLES_BOOTSTRAP_V2,
      GM_GLOBAL,
      GN_GLOBAL,
      GM_LANGS,
      GN_LANGS,
      LS_CUSTOM_BG,
      LS_CUSTOM_BG_GLOBAL,
      LS_GM_PACK,
      LS_GN_PACK,
      LS_GM_ANTI,
      LS_GN_ANTI,
      LS_GM_CLEAN_FILL,
      LS_GN_CLEAN_FILL,
      CLEAN_FILL_STRENGTH,
      LS_GM_RECENT,
      LS_GN_RECENT,
      antiWindow,
      lsKeyCleanFill,
      LS_CLEAN_FILL_BOOTSTRAP,
      getCleanFillEnabled,
      setCleanFillEnabled,
      cleanFillCopy,
      syncCleanFillUi,
      lsKeyPack,
      lsKeyAnti,
      lsKeyRecent,
      getRecent,
      TABS,
      TABS_PUBLIC,
      customBgKeyForTab,
      getCustomBgForTab,
      clearCustomBgForTab,
      setCustomBgForTab,
      listCustomBgUsedTabs,
      customBgUnlockedTabCount,
      canSetCustomBgOnTab,
      requiredRefsForCustomBgTab,
      readFileAsDataURL,
      loadImage,
      compressImageToJpegDataURL,
      fitImageToCoverDataUrl,
      applyUserBg,
      renderCustomBgUI,
      syncCustomBgUI,
      TAB_THEME,
    };
  };
})(window);
