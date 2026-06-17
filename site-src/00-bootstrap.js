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
const ASSET_REV = "20260618r";

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
    try { applyLang(); } catch {}
    try { __gmxLangUi.updateLangFlags(); } catch {}
    try { renderWallpaperUI(); } catch {}
    if (name === "referrals") { try { if (getHandle()) $("refLoad")?.click(); } catch {} }
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
      try { setSfUi(); } catch {}
    }
  },
});


