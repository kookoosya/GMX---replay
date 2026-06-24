(async () => {
  const API = location.origin;

  let SUB = null;
  let REF_COUNT = 0;
  let AUTH_OK = false;
  let LAST_USAGE_COSMETIC_SIG = "";
  let LAST_USAGE = { gm:{ used:0, limit:0 }, gn:{ used:0, limit:0 }, resetAt:null };
  let LAST_SAVED = { gm:0, gn:0 };
  let SAVE_CAP_FREE = 50;

  if (!window.__GMXBootstrapCoreWireFactory) throw new Error("GMX bootstrapcorewire factory missing");
  const {
    __gmxSt,
    K,
    __gmxFmt,
    __gmxChrome,
    __gmxModals,
    __gmxI18nUi,
    __gmxTabState,
    __gmxSiteI18nUi,
    __gmxSiteI18nDynamic,
    __gmxSiteLangMenu,
    __gmxLangUi,
    ADMIN_HANDLE,
    EMPTY,
    INFLIGHT,
    ABORT,
  } = window.__GMXBootstrapCoreWireFactory({
    getSiteLangs: () => SITE_LANGS,
    setSiteLangs: (arr) => { SITE_LANGS = arr; },
    getReplyLangs: () => REPLY_LANGS,
    setReplyLangs: (arr) => { REPLY_LANGS = arr; },
    applyLang: () => { try { applyLang(); } catch {} },
    syncBestModeUi: () => { try { syncBestModeUi(); } catch {} },
    syncCleanFillUi: () => { try { syncCleanFillUi(); } catch {} },
    updateLangFlags: () => { try { updateLangFlags(); } catch {} },
    renderWallpaperUI: () => { try { renderWallpaperUI(); } catch {} },
    syncPredictionFilterCopy: () => { try { syncPredictionFilterCopy(); } catch {} },
    syncReferralCardCopy: () => { try { syncReferralCardCopy(); } catch {} },
    initReferralPromoDetailsState: () => { try { initReferralPromoDetailsState(); } catch {} },
    getHandle: () => { try { return getHandle(); } catch { return ""; } },
    scheduleRefStatsRefresh: (ms) => { try { scheduleRefStatsRefresh(ms); } catch {} },
  });

  const LS_REF_ELIGIBLE_CACHE = K.REF_ELIGIBLE_CACHE;
  try{
    const bootEligible = Number(__gmxSt.lsGet(LS_REF_ELIGIBLE_CACHE, "0") || 0) || 0;
    if (bootEligible > 0) REF_COUNT = bootEligible;
  }catch(_e){}
  function isPro(){ return !!(SUB && SUB.active); }
  function saveCap(){ return isPro() ? Infinity : SAVE_CAP_FREE; }
  function isLocalDevHost(){
    try{
      const localHosts = new Set(["127.0.0.1","localhost"]);
      const here = String(location.hostname || "").toLowerCase();
      if (localHosts.has(here)) return true;
      const raw = String((globalThis.__GMX_API_ORIGIN || API || "")).trim();
      if (!raw) return false;
      const u = new URL(raw, location.origin);
      const host = String(u.hostname || "").toLowerCase();
      return localHosts.has(host);
    }catch(_e){
      return false;
    }
  }
// --- Unlock logic (Variant A)
const ASSET_REV = "20260617a";

if (!window.__GMXBootstrapUnlockWireFactory) throw new Error("GMX bootstrapunlockwire factory missing");
const {
  __gmxUnlock,
  __gmxWp,
  __gmxCustomWp,
  __gmxThemes,
  __gmxGen,
  __gmxBanks,
  __gmxAnti,
  __gmxUi,
  __gmxWpStore,
  __gmxExtWpStore,
  __gmxWpHelpers,
  FREE_VISIBLE_THEMES,
  FREE_VISIBLE_STYLES,
  FREE_VISIBLE_PACKS,
  FREE_VISIBLE_WALLPAPERS,
  FREE_VISIBLE_EXT_THEMES,
  FREE_VISIBLE_EXT_WALLPAPERS,
  reqRefsForUnlockIndex,
  formatUnlockMeter,
  unlockedCountByRefs,
} = window.__GMXBootstrapUnlockWireFactory({
  getAssetRev: () => ASSET_REV,
  storage: __gmxSt,
  keys: K,
  chrome: __gmxChrome,
  api: API,
  empty: EMPTY,
  isPro,
  getRefCount: () => REF_COUNT,
  getToken: () => {
    try {
      return String(__gmxSt.lsGet(K.TOKEN, "") || "").trim();
    } catch {
      return "";
    }
  },
  normalizeWallpaperId: (id) => normalizeWallpaperId(id),
  getWallpaperTabs: () => WALLPAPER_TABS,
  normalizeExtWallpaperIdLocal: (id) => normalizeExtWallpaperIdLocal(id),
  getWallpapers: () => WALLPAPERS,
  getExtWallpapers: () => EXT_WALLPAPERS,
});

if (!window.__GMXBootstrapGenWireFactory) throw new Error("GMX bootstrapgenwire factory missing");
const {
  __gmxGp,
  __gmxCf,
  __gmxStyles,
  __gmxToggles,
  __gmxCbg,
  __gmxTabTheme,
  __gmxLogs,
} = window.__GMXBootstrapGenWireFactory({
  storage: __gmxSt,
  keys: K,
  chrome: __gmxChrome,
  themes: __gmxThemes,
  anti: __gmxAnti,
  isPro,
  reqRefsForUnlockIndex,
  unlockedCountByRefs,
  freeVisiblePacks: FREE_VISIBLE_PACKS,
  freeVisibleStyles: FREE_VISIBLE_STYLES,
  t: (key) => __gmxI18nUi.t(key),
  syncModePanelCopy: () => { try { __gmxSiteI18nDynamic.syncModePanelCopy(); } catch {} },
  siteLang: () => siteLang(),
  syncCleanFillUi: () => { try { syncCleanFillUi(); } catch {} },
  getCurrentLang: (kind) => currentLang(kind),
  getCurrentTab: () => { try { return currentTabName(); } catch { return "home"; } },
  hasActiveUnlockedWallpaper: (tab) => {
    try {
      const wid = getWallpaperForTab(tab);
      if (!wid) return false;
      const wp = WALLPAPERS.find((x) => x.id === wid) || null;
      const idx = wp ? WALLPAPERS.findIndex((x) => x.id === wid) : -1;
      return !!(wp && wallpaperUnlocked(wp, idx));
    } catch {
      return false;
    }
  },
});

if (!window.__GMXBootstrapUsageWireFactory) throw new Error("GMX bootstrapusagewire factory missing");
const {
  __gmxPaywall,
  __gmxUsage,
  __gmxHelp,
  __gmxWpApply,
  __gmxHealth,
} = window.__GMXBootstrapUsageWireFactory({
  storage: __gmxSt,
  keys: K,
  chrome: __gmxChrome,
  modals: __gmxModals,
  tabState: __gmxTabState,
  wp: __gmxWp,
  wpStore: __gmxWpStore,
  customWp: __gmxCustomWp,
  extWpStore: __gmxExtWpStore,
  isPro,
  getSaveCapFree: () => SAVE_CAP_FREE,
  setSaveCapFree: (v) => { SAVE_CAP_FREE = v; },
  getLastUsage: () => LAST_USAGE,
  setLastUsage: (u) => { LAST_USAGE = u; },
  getLastSaved: () => LAST_SAVED,
  getLastUsageCosmeticSig: () => LAST_USAGE_COSMETIC_SIG,
  setLastUsageCosmeticSig: (s) => { LAST_USAGE_COSMETIC_SIG = s; },
  setSub: (s) => { SUB = s; },
  getAuthOk: () => AUTH_OK,
  setAuthOk: (v) => { AUTH_OK = v; },
  getToken: () => getToken(),
  getHandle: () => getHandle(),
  api: (path, method, body) => api(path, method, body),
  trackEvent: (type, meta) => trackEvent(type, meta),
  onNavigateWallet: () => { try { tab("wallet"); } catch {} },
  applyAdminVisibility: () => { try { applyAdminVisibility(); } catch {} },
  renderWalletStatus: (sub) => { try { renderWalletStatus(sub); } catch {} },
  applyRefCountEligible: (n, opts) => applyRefCountEligible(n, opts),
  onCosmeticRefresh: () => {
    fillStyles();
    fillPacks();
    try { window.__syncProControls && window.__syncProControls(); } catch {}
    applyUserBg();
    initWallpapers();
    renderThemes();
    initExtWallpaperControls();
    try { __gmxExtWpStore.normalizeStoredExtWallpaperSelections(); } catch {}
    renderExtThemes();
    renderExtWallpapers();
    renderExtCustomBgUI();
    try {
      setExtView(normalizeExtViewValue(__gmxSt.lsGet(K.EXT_VIEW, "theme")), { force: true, silent: true });
    } catch {}
  },
  scheduleRefStatsRefresh: (ms) => { try { scheduleRefStatsRefresh(ms); } catch {} },
  getCurrentTab: () => { try { return currentTabName(); } catch { return "home"; } },
  getWallpapers: () => WALLPAPERS,
  wallpaperUnlocked: (wp, idx, len) => wallpaperUnlocked(wp, idx, len),
  wallpaperFullUrl: (id) => wallpaperFullUrl(id),
  onRetrySession: async () => { try { if (getHandle()) await initSession(true); } catch {} },
  onRetryWallet: async () => {
    try {
      await loadPlans();
      await loadBillingProof();
    } catch {}
  },
  onRetryReferrals: () => { try { scheduleRefStatsRefresh(120); } catch {} },
  onRetryUsage: async () => { try { if (getHandle()) await refreshUsage(); } catch {} },
});

if (!window.__GMXBootstrapUiWireFactory) throw new Error("GMX bootstrapuiwire factory missing");
const {
  __gmxSetBg,
  __gmxThemeApply,
  __gmxAccount,
  __gmxWpUi,
  __gmxThemesUi,
  __gmxExtView,
  __gmxExtApply,
  __gmxExtCbgUi,
  __gmxExtThemesUi,
  __gmxNav,
  __gmxExtWpUi,
} = window.__GMXBootstrapUiWireFactory({
  storage: __gmxSt,
  keys: K,
  chrome: __gmxChrome,
  fmt: __gmxFmt,
  tabState: __gmxTabState,
  langUi: __gmxLangUi,
  themes: __gmxThemes,
  wp: __gmxWp,
  wpStore: __gmxWpStore,
  customWp: __gmxCustomWp,
  extWpStore: __gmxExtWpStore,
  ui: __gmxUi,
  tabTheme: __gmxTabTheme,
  cbg: __gmxCbg,
  wpApply: __gmxWpApply,
  isPro,
  unlockedCountByRefs,
  reqRefsForUnlockIndex,
  formatUnlockMeter,
  freeVisibleThemes: FREE_VISIBLE_THEMES,
  freeVisibleWallpapers: FREE_VISIBLE_WALLPAPERS,
  freeVisibleExtThemes: FREE_VISIBLE_EXT_THEMES,
  freeVisibleExtWallpapers: FREE_VISIBLE_EXT_WALLPAPERS,
  t: (key) => __gmxI18nUi.t(key),
  trWp: (key) => __gmxI18nUi.tr(key),
  getRefCount: () => REF_COUNT,
  setRefCount: (n) => { REF_COUNT = n; },
  getAuthOk: () => AUTH_OK,
  getThemes: () => THEMES,
  getWallpapers: () => WALLPAPERS,
  getExtThemes: () => EXT_THEMES,
  getExtWallpapers: () => EXT_WALLPAPERS,
  getWallpaperTabs: () => WALLPAPER_TABS,
  getCurrentTab: () => { try { return currentTabName(); } catch { return "home"; } },
  wallpaperUnlocked: (wp, idx, len) => wallpaperUnlocked(wp, idx, len),
  wallpaperThumbUrl: (id) => wallpaperThumbUrl(id),
  wallpaperFullUrl: (id) => wallpaperFullUrl(id),
  extWallpaperThumbUrl: (id) => extWallpaperThumbUrl(id),
  extWallpaperFullUrl: (id) => extWallpaperFullUrl(id),
  normalizeExtWallpaperId: (id) => normalizeExtWallpaperIdLocal(id),
  unlockedThemesCount: () => unlockedThemesCount(),
  setMeter: (valId, fillId, used, limit) => { try { setMeter(valId, fillId, used, limit); } catch {} },
  requireConnected: (label) => requireConnected(label),
  compressImageToJpegDataURL: (file, opts) => compressImageToJpegDataURL(file, opts),
  renderExtThemes: () => { try { renderExtThemes(); } catch {} },
  renderExtWallpapers: () => { try { renderExtWallpapers(); } catch {} },
  onUnlockUiRefresh: () => {
    try { renderThemes(); } catch {}
    try { renderExtThemes(); } catch {}
    try { fillStyles(); } catch {}
    try { fillPacks(); } catch {}
  },
  onTabActivated: (name) => {
    try { __gmxLangUi.updateLangFlags(); } catch {}
    if (name === "themes" || name === "extthemes") {
      try { renderWallpaperUI(); } catch {}
    }
    if (name === "home") {
      try { window.__gmxEnsureTabPack("redeem").catch(() => {}); } catch {}
    }
    if (name === "referrals") {
      try {
        window.__gmxEnsureTabPack("referrals").then(() => {
          try { if (getHandle()) $("refLoad")?.click(); } catch {}
        }).catch(() => {});
      } catch {}
    }
    if (name === "leaderboard") {
      try { bindLeaderboardUI(); } catch {}
      try { loadLeaderboard(LB_DAYS || 7); } catch {}
    }
    if (name === "prediction") { try { loadPredictionSignals({ force: true }); } catch {} }
    if (name === "extthemes") {
      try { renderExtThemes(); } catch {}
      try { renderExtWallpapers(); } catch {}
      try { renderExtCustomBgUI(); } catch {}
      try {
        setExtView(normalizeExtViewValue(__gmxSt.lsGet(K.EXT_VIEW, "theme")), { force: true, silent: true });
      } catch {}
    }
    if (name === "admin") { try { syncAdminUi(); } catch {} }
    if (name === "wallet") {
      try { loadPlans(); } catch {}
      try { loadBillingProof(); } catch {}
      try { setWalletUi(); } catch {}
    }
  },
});



  if (!window.__GMXUiWireFactory) throw new Error("GMX uiwire factory missing");
  const __gmxUiWire = window.__GMXUiWireFactory({ ui: __gmxUi });
  function chunkedRender(grid, items, renderItem, opts){
    return __gmxUiWire.chunkedRender(grid, items, renderItem, opts);
  }
  function mountLineListSkeleton(container, count){
    return __gmxUiWire.mountLineListSkeleton(container, count);
  }
  async function yieldToUiFrame(){
    return await __gmxUiWire.yieldToUiFrame();
  }
  function prefetchImage(url){
    return __gmxUiWire.prefetchImage(url);
  }
  function observeLazyBg(el){ return __gmxUiWire.observeLazyBg(el); }
  async function postEvent(type, meta){
    return __gmxUiWire.postEvent(type, meta);
  }

  if (!window.__GMXShellDepsWireFactory) throw new Error("GMX shelldepsrunwire factory missing");
  const {
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
  } = window.__GMXShellDepsWireFactory({
    keys: { K },
    mod: {
      storage: __gmxSt,
      logs: __gmxLogs,
      cleanfill: __gmxCf,
      antirepeat: __gmxAnti,
      custombg: __gmxCbg,
      tabtheme: __gmxTabTheme,
    },
  });

  if (!window.__GMXWallpapersWireFactory) throw new Error("GMX wallpapersrunwire factory missing");
  const SITE_WALLPAPER_PACK_COUNT = __gmxWp.SITE_PACK_COUNT;
  const __gmxWallpapersWire = window.__GMXWallpapersWireFactory({
    keys: { K },
    mod: {
      wp: __gmxWp,
      wpStore: __gmxWpStore,
      customWp: __gmxCustomWp,
      wpHelpers: __gmxWpHelpers,
      extWpStore: __gmxExtWpStore,
      tabState: __gmxTabState,
      wpApply: __gmxWpApply,
      i18nUi: __gmxI18nUi,
      wpUi: __gmxWpUi,
      langUi: __gmxLangUi,
    },
  });
  const {
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
  } = __gmxWallpapersWire;
  function setWallpaperLayerImage(layer, url){ return __gmxWallpapersWire.setWallpaperLayerImage(layer, url); }

  let SITE_LANGS = [["en","English"]];
  let REPLY_LANGS = [["en","English"]];

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

if (!window.__GMXThemesWireFactory) throw new Error("GMX themesrunwire factory missing");
const {
  LS_EXT_VIEW,
  applyTheme,
  normalizeExtWallpaperView,
  extWallpaperKeyForView,
  getExtWallpaperForView,
  setExtWallpaperForView,
  syncExtWallpaperTargetUI,
  currentExtWallpaperTarget,
  extWallpaperLabel,
  normalizeStoredExtWallpaperSelections,
  normalizeExtViewValue,
  setExtView,
  extSyncNow,
  markWallpaperSelection,
  unlockedExtThemesCount,
  unlockTagText,
  applyExtTheme,
  applyExtWallpaper,
  renderThemes,
  renderExtCustomBgUI,
  renderExtThemes,
  renderExtWallpapers,
  bindExtTabs,
  initExtWallpaperControls,
} = window.__GMXThemesWireFactory({
  keys: { extViewKey: K.EXT_VIEW },
  mod: {
    themeApply: __gmxThemeApply,
    extWpStore: __gmxExtWpStore,
    extView: __gmxExtView,
    wpUi: __gmxWpUi,
    themesUi: __gmxThemesUi,
    extApply: __gmxExtApply,
    extCbgUi: __gmxExtCbgUi,
    extThemesUi: __gmxExtThemesUi,
    extWpUi: __gmxExtWpUi,
  },
  catalog: {
    unlockedCountByRefs,
    extThemesLength: EXT_THEMES.length,
    freeVisibleExtThemes: FREE_VISIBLE_EXT_THEMES,
  },
});

  let INIT_DONE = false;
  if (!window.__GMXChromeWireFactory) throw new Error("GMX chromerunwire factory missing");
  const __gmxChromeWire = window.__GMXChromeWireFactory({
    mod: {
      chrome: __gmxChrome,
      fmt: __gmxFmt,
      styles: __gmxStyles,
      nav: __gmxNav,
      setBg: __gmxSetBg,
      modals: __gmxModals,
      toggles: __gmxToggles,
      paywall: __gmxPaywall,
      health: __gmxHealth,
      usage: __gmxUsage,
      help: __gmxHelp,
      account: __gmxAccount,
    },
    keys: {
      LS_SITE_LANG,
      API,
      LS_HANDLE,
      LS_TOKEN,
      LS_IS_ADMIN,
      LS_ADMIN_CLAIMABLE,
    },
    hooks: {
      normalizeTopLevelTab: (n) => normalizeTopLevelTab(n),
      isLocalDevHost,
      getAdminToken,
      t,
    },
    session: {
      getInitDone: () => INIT_DONE,
      setAuthOk: (v) => { AUTH_OK = !!v; },
    },
  });
  const {
    $,
    toast,
    setDegraded,
    showFatal,
    hideFatal,
    setBusy,
    esc,
    setBg,
    ensurePredictionTabVisible,
    showTab,
    showInfoModal,
    tab,
    __getGMXAuth,
    normalizeHandle,
    getHandle,
    siteLang,
    getBestMode,
    setBestMode,
    syncBestModeUi,
    abVariant,
    trackEvent,
    openLimitModal,
    closeLimitModal,
    bindLimitModal,
    setPayState,
    openPaySuccess,
    closePaySuccess,
    bindPaySuccess,
    getToken,
    isConnected,
    requireConnected,
    isPublicApi,
    initSession,
    api,
    setApiPillState,
    ping,
    loadBuild,
    watchBuildUpdates,
    normLimitForUI,
    setMeter,
    renderHelpModal,
    openHelpModal,
    closeHelpModal,
    bindHelpModal,
    usageCosmeticSignature,
    refreshUsage,
    applyAdminVisibility,
  } = __gmxChromeWire;
  function fillStyles(){ return __gmxChromeWire.fillStyles(); }

  if (!window.__GMXI18nBridgeFactory) throw new Error("GMX i18nbridge factory missing");
  const {
    I18N,
    siteTr,
    applyLang,
    getReferralUiCopy,
    getGuideUiCopy,
    renderGuideRightCopy,
    deriveReferralUnlocks,
    nextReferralUnlockAt,
    nextReferralUnlockLabel,
    syncRefProgressMeter,
    renderReferralRightCopy,
    syncModePanelCopy,
    patchDynamicCopy,
    fillSelect,
  } = window.__GMXI18nBridgeFactory({
    siteI18nUi: __gmxSiteI18nUi,
    siteI18nDynamic: __gmxSiteI18nDynamic,
    siteLangMenu: __gmxSiteLangMenu,
  });

  function applyRefCountEligible(eligible, opts){
    const r = __gmxChromeWire.applyRefCountEligible(eligible, opts);
    try {
      syncRefProgressMeter(__gmxSt.lsGet(K.SITE_LANG, "en"), Math.max(0, Number(eligible || 0) || 0));
    } catch (_e) {}
    return r;
  }

  try {
    const bootCached = Number(__gmxSt.lsGet(LS_REF_ELIGIBLE_CACHE, "0") || 0) || 0;
    applyRefCountEligible(bootCached);
  } catch (_e) {}

function syncReferralCardCopy() {
  try {
    renderReferralRightCopy(__gmxSt.lsGet(K.SITE_LANG, "en"));
  } catch {}
}
function initReferralPromoDetailsState() {}
function initProTabs() {}

  if (!window.__GMXBanksWireFactory) throw new Error("GMX bankswire factory missing");
  const {
    linesFromText,
    getLangIndexKey,
    getGlobalKey,
    getLangKey,
    getBankKey,
    getBankMigrationKey,
    getLangIndex,
    setLangIndex,
    readKey,
    writeKey,
    allLegacyKeysForKind,
    migrateLegacyBank,
  } = window.__GMXBanksWireFactory({ banks: __gmxBanks });

function allKeysForKind(kind) {
  return [getBankKey(kind)];
}

// ----- Best (pick a strong line and copy it) -----
let __gmxBestPick;
function pickBestLine(kind, lines){ return __gmxBestPick.pickBestLine(kind, lines); }
async function doBest(kind){ return __gmxBestPick.doBest(kind); }
async function doBestServer(kind){ return __gmxBestPick.doBestServer(kind); }

  if (!window.__GMXBankUiWireFactory) throw new Error("GMX bankuiwire factory missing");
  const __gmxBankUiWireCtx = {
    $,
    fmt: __gmxFmt,
    gen: __gmxGen,
    keys: K,
    requireConnected,
    getHandle,
    isPro,
    saveCap,
    saveCapFree: SAVE_CAP_FREE,
    lastSaved: LAST_SAVED,
    getBankKey,
    allLegacyKeysForKind,
    setLangIndex,
    getBankMigrationKey,
    readKey,
    writeKey,
    dedupeLines: __gmxGen.dedupeLines,
    linesFromText,
    chunkedRender,
    mountLineListSkeleton,
    renderHelpModal,
    openLimitModal,
    trackEvent,
    toast,
    t,
    updateLangFlags,
    renderLangChips,
    abort: ABORT,
    api,
    readGenParams,
    getAntiStrength,
    refreshUsage,
    setBusy,
  };
  const __gmxBankUiWire = window.__GMXBankUiWireFactory(__gmxBankUiWireCtx);
  __gmxBestPick = __gmxBankUiWire.bestPick;
  const __gmxBankUi = __gmxBankUiWire.bankUi;
  const {
    totalSaved,
    remainingSlots,
    trimKindToCap,
    renderList,
    updateSavedUI,
    setView,
    addLine,
    clearView,
    clearAll,
    copyAll,
    exportAll,
    saveDraft,
    restoreDrafts,
    commitNewLine,
    addPasted,
    isNetworkishErrorMessage,
    friendlyUiErrorMessage,
  } = __gmxBankUiWire;
  function escapeHtml(s){ return __gmxBankUiWire.escapeHtml(s); }

  function ensureIndexed(kind, lang){
    return;
  }
  function activeKey(kind){
    return getBankKey(kind);
  }

  if (!window.__GMXCleanFillRunFactory) throw new Error("GMX cleanfillrunwire factory missing");
  const {
    oneClickCleanup,
    refillCleanFill,
    cleanupKeyLines,
    pushRecent,
    repeatKey,
    filterAntiRepeat,
    normalizeLine,
    dedupeLines,
  } = window.__GMXCleanFillRunFactory({
    $,
    api,
    format: __gmxFmt,
    cleanfill: __gmxCf,
    gen: __gmxGen,
    antirepeat: __gmxAnti,
    ui: __gmxUi,
    readGenParams,
    getAntiStrength,
    activeKey,
    readKey,
    writeKey,
    remainingSlots,
    renderList,
    getHandle,
    tab,
  });
  __gmxBankUiWireCtx.pushRecent = pushRecent;
  __gmxBankUiWireCtx.repeatKey = repeatKey;

  if (!window.__GMXGenerateWireFactory) throw new Error("GMX generaterunwire factory missing");
  const __gmxGenerateWire = window.__GMXGenerateWireFactory({
    core: {
      $,
      api,
      gen: __gmxGen,
      bankUi: __gmxBankUi,
    },
    auth: {
      getHandle,
      requireConnected,
      getToken,
      initSession,
    },
    ui: {
      renderReferralRightCopy,
      renderGuideRightCopy,
      applyRefCountEligible,
      nextReferralUnlockAt,
      renderThemes,
      renderExtThemes,
      fillStyles,
      fillPacks,
      renderList,
      postEvent,
      setBusy,
      refreshUsage,
      toast,
    },
    params: {
      readGenParams,
      getAntiStrength,
      getCleanFillEnabled,
      getBestMode,
      filterAntiRepeat,
      repeatKey,
      cleanFillStrength: CLEAN_FILL_STRENGTH,
    },
    data: {
      siteLangKey: LS_SITE_LANG,
      refPromoOpenKey: LS_REF_PROMO_OPEN,
      ensureIndexed,
      activeKey,
      getGlobalKey,
      readKey,
      writeKey,
      remainingSlots,
      saveCap,
      pushRecent,
      oneClickCleanup,
    },
    text: {
      escapeHtml,
      siteTr,
      t,
      friendlyUiErrorMessage,
    },
    perf: {
      logEvent,
      yieldToUiFrame,
    },
    state: {
      inflight: INFLIGHT,
      abort: ABORT,
    },
  });
  const {
    mergeAppendUnique,
    revealReferralLinkUi,
    scheduleRefStatsRefresh,
    refreshRefStats,
  } = __gmxGenerateWire;
  async function generate(kind, count){ return __gmxGenerateWire.generate(kind, count); }

// ----- Leaderboard -----
let LB_DAYS = 7;
let __gmxLeaderboardWire = null;

function initLeaderboardTab() {
  if (__gmxLeaderboardWire) return __gmxLeaderboardWire;
  if (!window.__GMXLeaderboardWireFactory) throw new Error("GMX leaderboardrunwire factory missing");
  __gmxLeaderboardWire = window.__GMXLeaderboardWireFactory({
    core: { $, escapeHtml, t },
    auth: { getToken, getHandle },
    lb: { setLbDays: (v) => { LB_DAYS = v; } },
  });
  return __gmxLeaderboardWire;
}

window.__gmxLazyTabHooks = window.__gmxLazyTabHooks || {};
window.__gmxLazyTabHooks.leaderboard = () => { initLeaderboardTab(); };

async function loadLeaderboard(days) {
  await window.__gmxEnsureTabPack("leaderboard");
  return initLeaderboardTab().loadLeaderboard(days);
}

function bindLeaderboardUI() {
  window.__gmxEnsureTabPack("leaderboard")
    .then(() => { try { initLeaderboardTab().bindLeaderboardUI(); } catch {} })
    .catch(() => {});
}

// ----- Prediction market -----
let __gmxPredictionWire = null;

function initPredictionTab() {
  if (__gmxPredictionWire) return __gmxPredictionWire;
  if (!window.__GMXPredictionWireFactory) throw new Error("GMX predictionrunwire factory missing");
  __gmxPredictionWire = window.__GMXPredictionWireFactory({
    core: { $, escapeHtml, t, api, friendlyUiErrorMessage },
    auth: { getHandle, getToken },
    tab: { tabState: __gmxTabState },
  });
  return __gmxPredictionWire;
}

window.__gmxLazyTabHooks = window.__gmxLazyTabHooks || {};
window.__gmxLazyTabHooks.prediction = () => { initPredictionTab(); };

function syncPredictionFilterCopy() {
  if (!__gmxPredictionWire) return;
  try { __gmxPredictionWire.syncPredictionFilterCopy(); } catch {}
}

async function loadPredictionSignals(opts) {
  await window.__gmxEnsureTabPack("prediction");
  return initPredictionTab().loadPredictionSignals(opts);
}

// ----- Referrals -----
let __gmxReferralsWire = null;

function initReferralsTab() {
  if (__gmxReferralsWire) return __gmxReferralsWire;
  if (!window.__GMXReferralsWireFactory) throw new Error("GMX referralsrunwire factory missing");
  __gmxReferralsWire = window.__GMXReferralsWireFactory({
    core: { $, escapeHtml, api, t },
    auth: { requireConnected },
    keys: { siteLangKey: LS_SITE_LANG },
    ui: {
      getReferralUiCopy,
      renderThemes,
      renderExtThemes,
      initWallpapers,
      renderExtWallpapers,
      fillStyles,
      fillPacks,
      refreshUsage,
      initReferralPromoDetailsState,
    },
    refs: {
      refreshRefStats,
      revealReferralLinkUi,
      applyRefCountEligible,
    },
  });
  return __gmxReferralsWire;
}

window.__gmxLazyTabHooks = window.__gmxLazyTabHooks || {};
window.__gmxLazyTabHooks.referrals = () => { initReferralsTab(); };

// ----- Wallet / Billing -----
let __gmxWalletWire = null;

function initWalletTab() {
  if (__gmxWalletWire) return __gmxWalletWire;
  if (!window.__GMXWalletWireFactory) throw new Error("GMX walletrunwire factory missing");
  __gmxWalletWire = window.__GMXWalletWireFactory({
    core: { $, api, K },
    mod: { modals: __gmxModals },
    text: { escapeHtml, friendlyUiErrorMessage },
    ui: { toast },
    perf: { trackEvent, abVariant },
    pay: { setPayState, openPaySuccess },
    session: { getHandle, refreshUsage },
  });
  return __gmxWalletWire;
}

window.__gmxLazyTabHooks = window.__gmxLazyTabHooks || {};
window.__gmxLazyTabHooks.wallet = () => { initWalletTab(); };

async function setWalletUi() {
  await window.__gmxEnsureTabPack("wallet");
  return initWalletTab().setWalletUi();
}

async function loadPlans() {
  await window.__gmxEnsureTabPack("wallet");
  return initWalletTab().loadPlans();
}

async function loadBillingProof() {
  await window.__gmxEnsureTabPack("wallet");
  return initWalletTab().loadBillingProof();
}

async function loadActivity() {
  await window.__gmxEnsureTabPack("wallet");
  return initWalletTab().loadActivity();
}

async function renderWalletStatus(sub) {
  await window.__gmxEnsureTabPack("wallet");
  return initWalletTab().renderWalletStatus(sub);
}

function bindWalletTab() {
  window.__gmxEnsureTabPack("wallet")
    .then(() => { try { initWalletTab().bindWalletTab(); } catch {} })
    .catch(() => {});
}

// ----- Admin -----
let __gmxAdminWire = null;

function pruneLegacyAdminPanelsBoot() {
  try {
    const retiredAnchors = ["adminSelBox", "adminSelHistory", "adminFaqBox", "adminHealthOut"];
    retiredAnchors.forEach((id) => {
      const el = $(id);
      if (!el) return;
      const card = el.closest(".card");
      if (card) card.style.display = "none";
    });

    const adminRoot = $("tab-admin");
    if (!adminRoot) return;

    const firstNote = adminRoot.querySelector(".card .note");
    if (firstNote) {
      firstNote.textContent =
        "Sign in once, then use access, code, and leaderboard tools only. Retired admin experiments are removed from this admin workspace.";
    }

    adminRoot.querySelectorAll(".card .title").forEach((node) => {
      const text = String(node.textContent || "").trim();
      if (text === "Admin stats") node.textContent = "Admin access";
      if (text === "Admin: promo codes") node.textContent = "Create access codes";
      if (text === "Admin: leaderboard rewards") node.textContent = "Leaderboard rewards";
      if (
        text === "Admin: conversion metrics" ||
        text === "Admin: extension health" ||
        text === "Admin: FAQ base" ||
        text === "Selectors history" ||
        text === "Selectors JSON" ||
        text.startsWith("Selectors")
      ) {
        const card = node.closest(".card");
        if (card) card.style.display = "none";
      }
    });
  } catch (_e) {}
}

function initAdminTab() {
  if (__gmxAdminWire) return __gmxAdminWire;
  if (!window.__GMXAdminWireFactory) throw new Error("GMX adminrunwire factory missing");
  __gmxAdminWire = window.__GMXAdminWireFactory({
    core: { $, escapeHtml, api },
    auth: { getHandle, requireConnected },
    admin: { setAdminToken, isAdminSignedIn, adminHandle: ADMIN_HANDLE },
  });
  return __gmxAdminWire;
}

window.__gmxLazyTabHooks = window.__gmxLazyTabHooks || {};
window.__gmxLazyTabHooks.admin = () => { initAdminTab(); };

function syncAdminUi() {
  window.__gmxEnsureTabPack("admin")
    .then(() => { try { initAdminTab().syncAdminUi(); } catch {} })
    .catch(() => {});
}

function requireAdminSignedIn() {
  if (!__gmxAdminWire) return false;
  return __gmxAdminWire.requireAdminSignedIn();
}

function pruneLegacyAdminPanels() {
  if (__gmxAdminWire) return __gmxAdminWire.pruneLegacyAdminPanels();
  return pruneLegacyAdminPanelsBoot();
}

  // ----- Redeem code -----
  function initRedeemTab() {
    if (window.__gmxRedeemTabInited) return;
    if (!window.__GMXRedeemWireFactory) throw new Error("GMX redeemrunwire factory missing");
    window.__GMXRedeemWireFactory({
      core: { $, api },
      auth: { requireConnected, getHandle },
      ui: { tab, renderWalletStatus, refreshUsage },
    });
    window.__gmxRedeemTabInited = true;
  }

  window.__gmxLazyTabHooks = window.__gmxLazyTabHooks || {};
  window.__gmxLazyTabHooks.redeem = () => { initRedeemTab(); };

  if (!window.__GMXSiteInitWireFactory) throw new Error("GMX siteinitwire factory missing");
  await window.__GMXSiteInitWireFactory({
    mod: {
      siteLangMenu: __gmxSiteLangMenu,
      styles: __gmxStyles,
      storage: __gmxSt,
      gp: __gmxGp,
      bankUi: __gmxBankUi,
      tabState: __gmxTabState,
    },
    keys: {
      K,
      I18N,
      LS_SITE_LANG,
      LS_GM_REPLY_LANG,
      LS_GN_REPLY_LANG,
      LS_CUSTOM_BG_GLOBAL,
      LS_WP_GLOBAL,
      LS_LAST_TAB,
      LS_EXT_VIEW,
      REPLY_LANGS,
    },
    toggles: {
      setBestMode,
      setCleanFillEnabled,
      syncBestModeUi,
      syncCleanFillUi,
      getBestMode,
      getCleanFillEnabled,
    },
    lang: {
      applyLang,
      pruneLegacyAdminPanels,
      updateLangFlags,
      renderLangChips,
    },
    chrome: {
      fillStyles,
      fillPacks,
      applyTheme,
      renderThemes,
      applyUserBg,
      initWallpapers,
    },
    gmGn: {
      $,
      requireConnected,
      setView,
      generate,
      trackEvent,
      doBestServer,
      doBest,
      commitNewLine,
      oneClickCleanup,
      clearView,
      clearAll,
      addPasted,
      copyAll,
      exportAll,
      renderList,
      saveDraft,
      getHandle,
      ensureIndexed,
    },
    wp: {
      compressImageToJpegDataURL,
      CUSTOM_UPLOAD_ID,
      setWallpaperForTab,
      renderWallpaperUI,
      currentTabName,
      applyWallpaper,
      toast,
      t,
    },
    pro: {
      isPro,
      escapeHtml,
      packsForKind,
      unlockedPacksCountFor,
      applyPackDefaultsToUi,
      logEvent,
      readKey,
      writeKey,
      getBankKey,
      allKeysForKind,
      allLegacyKeysForKind,
      dedupeLines,
      normalizeLine,
      cleanupKeyLines,
      setLangIndex,
      getBankMigrationKey,
      trimKindToCap,
      activeKey,
      refillCleanFill,
      getToken,
      migrateLegacyBank,
    },
    boot: {
      applyAdminVisibility,
      initThemeWallTabs,
      bindExtTabs,
      initExtWallpaperControls,
      normalizeStoredExtWallpaperSelections,
      migrateLegacyWallpaperSelectionOnce,
      migrateLegacyExtWallpaperSelectionOnce,
      renderExtThemes,
      renderExtWallpapers,
      renderExtCustomBgUI,
      setExtView,
      normalizeExtViewValue,
      restoreDrafts,
      normalizeTopLevelTab,
      tab,
      setBg,
      ping,
      loadBuild,
      bindWalletTab,
      bindLimitModal,
      bindPaySuccess,
      loadPlans,
      loadBillingProof,
      bindHelpModal,
      watchBuildUpdates,
      initSession,
      refreshUsage,
      initProTabs,
      setDegraded,
    },
    session: {
      setAuthOk: (v) => { AUTH_OK = !!v; },
      setInitDone: (v) => { INIT_DONE = !!v; },
    },
  }).run();

  // ----- Connect -----
  if (!window.__GMXConnectWireFactory) throw new Error("GMX connectrunwire factory missing");
  window.__GMXConnectWireFactory({
    core: { $, api, escapeHtml, friendlyUiErrorMessage, normalizeHandle },
    auth: { setAuthOk: (v) => { AUTH_OK = !!v; }, applyAdminVisibility },
    session: { refreshUsage, loadPlans, ping },
    keys: {
      handle: LS_HANDLE,
      token: LS_TOKEN,
      isAdmin: LS_IS_ADMIN,
      adminClaimable: LS_ADMIN_CLAIMABLE,
      forceLogout: LS_FORCE_LOGOUT,
      forceLogoutV2: LS_FORCE_LOGOUT_V2,
    },
  });

})();
