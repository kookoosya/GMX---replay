  // ----- Lightweight client logs (for support) -----
  function logEvent(type, data){ return __gmxLogs.logEvent(type, data); }

  const LS_HANDLE = K.HANDLE;
  const LS_TOKEN  = K.TOKEN;

  function getAdminToken(){ return __gmxSt.getAdminToken(); }
  function setAdminToken(t){ __gmxSt.setAdminToken(t); }
  function isAdminSignedIn(){ return __gmxSt.isAdminSignedIn(); }

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
  const GM_LANGS  = K.GM_LANGS;
  const GN_LANGS  = K.GN_LANGS;

  const LS_CUSTOM_BG = K.CUSTOM_BG;
  const LS_CUSTOM_BG_GLOBAL = K.CUSTOM_BG_GLOBAL;

  const LS_GM_PACK = K.GM_PACK;
  const LS_GN_PACK = K.GN_PACK;
  const LS_GM_ANTI = K.GM_ANTI;
  const LS_GN_ANTI = K.GN_ANTI;
  const LS_GM_CLEAN_FILL = K.GM_CLEAN_FILL;
  const LS_GN_CLEAN_FILL = K.GN_CLEAN_FILL;
  const CLEAN_FILL_STRENGTH = __gmxCf.CLEAN_FILL_STRENGTH;
  const LS_GM_RECENT = K.GM_RECENT;
  const LS_GN_RECENT = K.GN_RECENT;


  function antiWindow(strength){ return __gmxAnti.antiWindow(strength); }

  function lsKeyCleanFill(kind){ return __gmxSt.lsKeyCleanFill(kind); }
  const LS_CLEAN_FILL_BOOTSTRAP = K.CLEAN_FILL_BOOTSTRAP;

  function getCleanFillEnabled(kind){ return __gmxCf.getEnabled(kind); }
  function setCleanFillEnabled(kind, next, silent){ return __gmxCf.setEnabled(kind, next, silent); }
  function cleanFillCopy(kind){ return __gmxCf.copyForKind(kind); }
  function syncCleanFillUi(kind){ return __gmxCf.syncUi(kind); }

  // Helpers for LS key selection (used by Pro controls).
  function lsKeyPack(kind){ return __gmxSt.lsKeyPack(kind); }
  function lsKeyAnti(kind){ return __gmxSt.lsKeyAnti(kind); }

  function lsKeyRecent(kind){ return __gmxSt.lsKeyRecent(kind); }
  function getRecent(kind){ return __gmxAnti.getRecent(kind); }


  
  const TABS = __gmxCbg.TABS;
  const TABS_PUBLIC = __gmxCbg.TABS_PUBLIC;
  function customBgKeyForTab(tab){ return __gmxCbg.customBgKeyForTab(tab); }
  function getCustomBgForTab(tab){ return __gmxCbg.getCustomBgForTab(tab); }
  function clearCustomBgForTab(tab){ return __gmxCbg.clearCustomBgForTab(tab); }
  function setCustomBgForTab(tab, dataUrl){ return __gmxCbg.setCustomBgForTab(tab, dataUrl); }
  function listCustomBgUsedTabs(){ return __gmxCbg.listCustomBgUsedTabs(); }
  function customBgUnlockedTabCount(){ return __gmxCbg.customBgUnlockedTabCount(); }
  function canSetCustomBgOnTab(tab){ return __gmxCbg.canSetCustomBgOnTab(tab); }
  function requiredRefsForCustomBgTab(tab){ return __gmxCbg.requiredRefsForCustomBgTab(tab); }
  function readFileAsDataURL(file){ return __gmxCbg.readFileAsDataURL(file); }
  function loadImage(src){ return __gmxCbg.loadImage(src); }
  async function compressImageToJpegDataURL(file, options){ return __gmxCbg.compressImageToJpegDataURL(file, options); }
  async function fitImageToCoverDataUrl(file, maxW, maxH, quality){ return __gmxCbg.fitImageToCoverDataUrl(file, maxW, maxH, quality); }

  function applyUserBg(tab){ return __gmxCbg.applyUserBg(tab); }

  function renderCustomBgUI(){ /* merged into wallpapers tab */ }
  function syncCustomBgUI(){ /* merged into wallpapers tab */ }

  const TAB_THEME = __gmxTabTheme.TAB_THEME;

