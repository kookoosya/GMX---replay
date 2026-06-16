(async () => {
  const API = location.origin;

  if (!window.__GMXStorageFactory) throw new Error("GMX storage factory missing");
  const __gmxSt = window.__GMXStorageFactory();
  const K = __gmxSt.keys;

  if (!window.__GMXFormatFactory) throw new Error("GMX format factory missing");
  const __gmxFmt = window.__GMXFormatFactory();

  const ADMIN_HANDLE = "@Kristofer_Sol_";
  let SAVE_CAP_FREE = 50;
  const EMPTY = "__EMPTY__";
  const INFLIGHT = { gm: false, gn: false };
  const ABORT = { gm: null, gn: null };

  if (!window.__GMXChromeFactory) throw new Error("GMX chrome factory missing");
  const __gmxChrome = window.__GMXChromeFactory({
    inflight: INFLIGHT,
    escapeHtml: (s) => __gmxFmt.escapeHtml(s),
  });

  let SUB = null;
  let REF_COUNT = 0;
  const LS_REF_ELIGIBLE_CACHE = K.REF_ELIGIBLE_CACHE;
  try{
    const bootEligible = Number(__gmxSt.lsGet(LS_REF_ELIGIBLE_CACHE, "0") || 0) || 0;
    if (bootEligible > 0) REF_COUNT = bootEligible;
  }catch(_e){}
  let AUTH_OK = false;
  let LAST_USAGE_COSMETIC_SIG = "";
  let LAST_USAGE = { gm:{ used:0, limit:0 }, gn:{ used:0, limit:0 }, resetAt:null };
  let LAST_SAVED = { gm:0, gn:0 };
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
const ASSET_REV = "20260616w";

if (!window.__GMXUnlockFactory) throw new Error("GMX unlock factory missing");
const __gmxUnlock = window.__GMXUnlockFactory({ isPro, getRefCount: () => REF_COUNT });

if (!window.__GMXWallpapersFactory) throw new Error("GMX wallpapers factory missing");
const __gmxWp = window.__GMXWallpapersFactory({
  getAssetRev: () => ASSET_REV,
  getSiteCustomUpload: () => __gmxSt.lsGet(K.CUSTOM_BG_GLOBAL),
  getExtCustomUpload: () => __gmxSt.lsGet(K.EXT_CUSTOM_BG_GLOBAL),
});

if (!window.__GMXThemesFactory) throw new Error("GMX themes factory missing");
const __gmxThemes = window.__GMXThemesFactory();

if (!window.__GMXGenerateFactory) throw new Error("GMX generate factory missing");
const __gmxGen = window.__GMXGenerateFactory();

if (!window.__GMXBanksFactory) throw new Error("GMX banks factory missing");
const __gmxBanks = window.__GMXBanksFactory({ storage: __gmxSt, dedupeLines: __gmxGen.dedupeLines, EMPTY });

if (!window.__GMXAntiRepeatFactory) throw new Error("GMX anti-repeat factory missing");
const __gmxAnti = window.__GMXAntiRepeatFactory({
  storage: __gmxSt,
  repeatKey: __gmxGen.repeatKey,
  readKey: __gmxBanks.readKey,
  filterLinesByBan: __gmxGen.filterLinesByBan,
});

if (!window.__GMXUiFactory) throw new Error("GMX ui factory missing");
const __gmxUi = window.__GMXUiFactory({
  api: API,
  getToken: () => {
    try {
      return String(__gmxSt.lsGet(K.TOKEN, "") || "").trim();
    } catch {
      return "";
    }
  },
});

if (!window.__GMXWallpaperStoreFactory) throw new Error("GMX wallpaperstore factory missing");
const __gmxWpStore = window.__GMXWallpaperStoreFactory({
  keys: {
    wpGlobal: K.WP_GLOBAL,
    wpTabPrefix: K.WP_TAB_PREFIX,
    wallpaperRefreshMigration: K.WALLPAPER_REFRESH_MIGRATION,
  },
  lsGet: (key, def) => __gmxSt.lsGet(key, def),
  lsSet: (key, val) => __gmxSt.lsSet(key, val),
  lsRemove: (key) => { try { localStorage.removeItem(key); } catch {} },
  normalizeWallpaperId: (id) => normalizeWallpaperId(id),
  getWallpaperTabs: () => WALLPAPER_TABS,
});

if (!window.__GMXExtWallpaperStoreFactory) throw new Error("GMX extwallpaperstore factory missing");
const __gmxExtWpStore = window.__GMXExtWallpaperStoreFactory({
  keys: {
    extWp: K.EXT_WP,
    extWpTarget: K.EXT_WP_TARGET,
    extWpViewPrefix: K.EXT_WP_VIEW_PREFIX,
  },
  extLsSet: (key, value) => __gmxSt.extLsSet(key, value),
  lsGet: (key, def) => __gmxSt.lsGet(key, def),
  lsSet: (key, val) => __gmxSt.lsSet(key, val),
  lsRemove: (key) => { try { localStorage.removeItem(key); } catch {} },
  normalizeExtWallpaperId: (id) => normalizeExtWallpaperIdLocal(id),
});

const FREE_VISIBLE_THEMES = __gmxUnlock.FREE_VISIBLE_THEMES;
const FREE_VISIBLE_STYLES = __gmxUnlock.FREE_VISIBLE_STYLES;
const FREE_VISIBLE_PACKS = __gmxUnlock.FREE_VISIBLE_PACKS;
const FREE_VISIBLE_WALLPAPERS = __gmxUnlock.FREE_VISIBLE_WALLPAPERS;
const FREE_VISIBLE_EXT_THEMES = __gmxUnlock.FREE_VISIBLE_EXT_THEMES;
const FREE_VISIBLE_EXT_WALLPAPERS = __gmxUnlock.FREE_VISIBLE_EXT_WALLPAPERS;

function reqRefsForUnlockIndex(idx, freeCount=FREE_VISIBLE_THEMES){
  return __gmxUnlock.reqRefsForUnlockIndex(idx, freeCount);
}

function formatUnlockMeter(cur, total){
  return __gmxUnlock.formatUnlockMeter(cur, total);
}

function unlockedCountByRefs(total, freeCount=FREE_VISIBLE_THEMES){
  return __gmxUnlock.unlockedCountByRefs(total, freeCount);
}

if (!window.__GMXGenParamsFactory) throw new Error("GMX genparams factory missing");
const __gmxGp = window.__GMXGenParamsFactory({
  $: __gmxChrome.$,
  storage: __gmxSt,
  packsForKind: (kind) => __gmxThemes.packsForKind(kind),
  antiWindow: (s) => __gmxAnti.antiWindow(s),
  getCurrentLang: (kind) => currentLang(kind),
  isPro,
  reqRefsForUnlockIndex,
  unlockedCountByRefs,
  freeVisiblePacks: FREE_VISIBLE_PACKS,
  t: (key) => t(key),
  syncModePanelCopy: () => { try { syncModePanelCopy(); } catch {} },
});

if (!window.__GMXCleanFillFactory) throw new Error("GMX cleanfill factory missing");
const __gmxCf = window.__GMXCleanFillFactory({
  storage: __gmxSt,
  $: __gmxChrome.$,
  siteLang: () => siteLang(),
});
__gmxCf.bootstrap();

if (!window.__GMXStylesFactory) throw new Error("GMX styles factory missing");
const __gmxStyles = window.__GMXStylesFactory({
  $: __gmxChrome.$,
  getStyles: () => __gmxThemes.STYLES,
  isPro,
  reqRefsForUnlockIndex,
  unlockedCountByRefs,
  freeVisibleStyles: FREE_VISIBLE_STYLES,
  t: (key) => t(key),
});

if (!window.__GMXTogglesFactory) throw new Error("GMX toggles factory missing");
const __gmxToggles = window.__GMXTogglesFactory({
  storage: __gmxSt,
  $: __gmxChrome.$,
  onAfterBestChange: () => { try { syncCleanFillUi(); } catch {} },
});

if (!window.__GMXCustomBgFactory) throw new Error("GMX custombg factory missing");
const __gmxCbg = window.__GMXCustomBgFactory({
  storage: __gmxSt,
  isPro,
  unlockedCountByRefs,
  reqRefsForUnlockIndex,
  getCurrentTab: () => { try { return currentTabName(); } catch { return "home"; } },
  hasWallBg: () => document.body.classList.contains("hasWallBg"),
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
__gmxCbg.migrateLegacy();
__gmxToggles.bootstrap();

if (!window.__GMXTabThemeFactory) throw new Error("GMX tabtheme factory missing");
const __gmxTabTheme = window.__GMXTabThemeFactory();

if (!window.__GMXLogsFactory) throw new Error("GMX logs factory missing");
const __gmxLogs = window.__GMXLogsFactory();

if (!window.__GMXPaywallFactory) throw new Error("GMX paywall factory missing");
const __gmxPaywall = window.__GMXPaywallFactory({
  $: __gmxChrome.$,
  storage: __gmxSt,
  getHandle: () => getHandle(),
  trackEvent: (type, meta) => trackEvent(type, meta),
  onNavigateWallet: () => { try { tab("wallet"); } catch {} },
});

let __gmxHelp;
if (!window.__GMXUsageFactory) throw new Error("GMX usage factory missing");
const __gmxUsage = window.__GMXUsageFactory({
  $: __gmxChrome.$,
  getToken: () => getToken(),
  getHandle: () => getHandle(),
  api: (path, method, body) => api(path, method, body),
  isPro,
  getSaveCapFree: () => SAVE_CAP_FREE,
  setSaveCapFree: (v) => { SAVE_CAP_FREE = v; },
  setAuthOk: (v) => { AUTH_OK = v; },
  applyAdminVisibility: () => { try { applyAdminVisibility(); } catch {} },
  setLastUsage: (u) => { LAST_USAGE = u; },
  getLastUsage: () => LAST_USAGE,
  setSub: (s) => { SUB = s; },
  renderWalletStatus: (sub) => { try { renderWalletStatus(sub); } catch {} },
  applyRefCountEligible: (n, opts) => applyRefCountEligible(n, opts),
  getLastUsageCosmeticSig: () => LAST_USAGE_COSMETIC_SIG,
  setLastUsageCosmeticSig: (s) => { LAST_USAGE_COSMETIC_SIG = s; },
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
  renderHelpIfOpen: () => { try { __gmxHelp.renderHelpIfOpen(); } catch {} },
});

if (!window.__GMXHelpFactory) throw new Error("GMX help factory missing");
__gmxHelp = window.__GMXHelpFactory({
  $: __gmxChrome.$,
  isPro,
  getSaveCapFree: () => SAVE_CAP_FREE,
  getLastUsage: () => LAST_USAGE,
  getLastSaved: () => LAST_SAVED,
  normLimitForUI: (n) => __gmxUsage.normLimitForUI(n),
  onNavigateWallet: () => { try { tab("wallet"); } catch {} },
});

if (!window.__GMXWallpaperApplyFactory) throw new Error("GMX wallpaperapply factory missing");
const __gmxWpApply = window.__GMXWallpaperApplyFactory({
  getCurrentTab: () => { try { return currentTabName(); } catch { return "home"; } },
  getWallpaperForTab: (tab) => __gmxWpStore.getWallpaperForTab(tab),
  getEffectiveCustomWallpapers: () => effectiveCustomWallpapersSite(),
  getWallpapers: () => WALLPAPERS,
  wallpaperUnlocked: (wp, idx, len) => wallpaperUnlocked(wp, idx, len),
  wallpaperFullUrl: (id) => wallpaperFullUrl(id),
  ensureWallpaperLayer: () => __gmxWp.ensureWallpaperLayer(),
  setWallpaperLayerImage: (layer, url) => __gmxWp.setWallpaperLayerImage(layer, url),
});

if (!window.__GMXHealthFactory) throw new Error("GMX health factory missing");
const __gmxHealth = window.__GMXHealthFactory({
  $: __gmxChrome.$,
  api: (path, method, body) => api(path, method, body),
  getHandle: () => getHandle(),
  getToken: () => getToken(),
  getAuthOk: () => AUTH_OK,
  setAuthOk: (v) => { AUTH_OK = v; },
  applyAdminVisibility: () => { try { applyAdminVisibility(); } catch {} },
  toast: (type, html, ms) => __gmxChrome.toast(type, html, ms),
  setDegraded: (on, msg) => __gmxChrome.setDegraded(on, msg),
  onRetrySession: async () => { try { if (getHandle()) await initSession(true); } catch {} },
  onRetryWallet: async () => {
    try {
      if (CURRENT_TAB === "wallet") {
        await loadPlans();
        await loadBillingProof();
      }
    } catch {}
  },
  onRetryReferrals: () => { try { if (CURRENT_TAB === "referrals") scheduleRefStatsRefresh(120); } catch {} },
  onRetryUsage: async () => { try { if (getHandle()) await refreshUsage(); } catch {} },
});
__gmxHealth.wireRetryNow();
__gmxHealth.wireOnlineRetry();

if (!window.__GMXSetBgFactory) throw new Error("GMX setbg factory missing");
const __gmxSetBg = window.__GMXSetBgFactory({
  getTabBg: (tab) => __gmxTabTheme.getTabBg(tab),
  applyWallpaper: (tab) => __gmxWpApply.applyWallpaper(tab),
  applyUserBg: (tab) => __gmxCbg.applyUserBg(tab),
});

if (!window.__GMXThemeApplyFactory) throw new Error("GMX themeapply factory missing");
const __gmxThemeApply = window.__GMXThemeApplyFactory({
  pickAccentOn: (a, b) => __gmxThemes.pickAccentOn(a, b),
  getThemes: () => THEMES,
  getCurrentTab: () => { try { return currentTabName(); } catch { return "home"; } },
  setBg: (tab) => { try { __gmxSetBg.setBg(tab); } catch {} },
  themeStorageKey: "gmx_theme",
});

if (!window.__GMXAccountUiFactory) throw new Error("GMX accountui factory missing");
const __gmxAccount = window.__GMXAccountUiFactory({
  $: __gmxChrome.$,
  storage: __gmxSt,
  refEligibleCacheKey: K.REF_ELIGIBLE_CACHE,
  getRefCount: () => REF_COUNT,
  setRefCount: (n) => { REF_COUNT = n; },
  getAuthOk: () => AUTH_OK,
  getIsAdminFlag: () => __gmxSt.lsGet(K.IS_ADMIN, "") === "1",
  onUnlockUiRefresh: () => {
    try { renderThemes(); } catch {}
    try { renderExtThemes(); } catch {}
    try { fillStyles(); } catch {}
    try { fillPacks(); } catch {}
  },
});

if (!window.__GMXWallpaperUiFactory) throw new Error("GMX wallpaperui factory missing");
const __gmxWpUi = window.__GMXWallpaperUiFactory({
  $: __gmxChrome.$,
  t: (key) => t(key),
  trWp: (key) => trWp(key),
  toast: (type, html, ms) => __gmxChrome.toast(type, html, ms),
  storage: __gmxSt,
  keys: { wpGlobal: K.WP_GLOBAL, themewallView: K.THEMEWALL_VIEW },
  getWallpaperTabs: () => WALLPAPER_TABS,
  wallpaperKeyForTab: (tab) => __gmxWpStore.wallpaperKeyForTab(tab),
  setWallpaperForTab: (tab, id) => __gmxWpStore.setWallpaperForTab(tab, id),
  getEffectiveCustomWallpapers: () => effectiveCustomWallpapersSite(),
  getWallpapers: () => WALLPAPERS,
  unlockedCountByRefs,
  freeVisibleWallpapers: FREE_VISIBLE_WALLPAPERS,
  customWpFreeCount: __gmxWp.CUSTOM_WP_FREE_COUNT,
  isPro,
  reqRefsForUnlockIndex,
  wallpaperUnlocked: (wp, idx, len) => wallpaperUnlocked(wp, idx, len),
  wallpaperThumbUrl: (id) => wallpaperThumbUrl(id),
  wallpaperFullUrl: (id) => wallpaperFullUrl(id),
  loadCustomWallpapers: () => loadCustomWallpapers(),
  chunkedRender: (grid, items, fn, opts) => __gmxUi.chunkedRender(grid, items, fn, opts),
  observeLazyBg: (el) => __gmxUi.observeLazyBg(el),
  prefetchImage: (url) => __gmxUi.prefetchImage(url),
  getCurrentTab: () => { try { return currentTabName(); } catch { return "home"; } },
  applyUserBg: (tab) => __gmxCbg.applyUserBg(tab),
  applyWallpaper: (tab) => __gmxWpApply.applyWallpaper(tab),
});

if (!window.__GMXThemesUiFactory) throw new Error("GMX themesui factory missing");
const __gmxThemesUi = window.__GMXThemesUiFactory({
  $: __gmxChrome.$,
  t: (key) => t(key),
  toast: (type, html, ms) => __gmxChrome.toast(type, html, ms),
  getThemes: () => THEMES,
  getWallpapers: () => WALLPAPERS,
  getChosenTheme: () => {
    try {
      return localStorage.getItem("gmx_theme") || "classic";
    } catch {
      return "classic";
    }
  },
  unlockedThemesCount: () => unlockedThemesCount(),
  unlockedCountByRefs,
  freeVisibleThemes: FREE_VISIBLE_THEMES,
  freeVisibleWallpapers: FREE_VISIBLE_WALLPAPERS,
  isPro,
  reqRefsForUnlockIndex,
  formatUnlockMeter: (cur, total) => formatUnlockMeter(cur, total),
  setMeter: (valId, fillId, used, limit) => { try { setMeter(valId, fillId, used, limit); } catch {} },
  chunkedRender: (grid, items, fn, opts) => __gmxUi.chunkedRender(grid, items, fn, opts),
  requireConnected: (label) => requireConnected(label),
  applyTheme: (id) => __gmxThemeApply.applyTheme(id),
});

if (!window.__GMXExtViewFactory) throw new Error("GMX extview factory missing");
const __gmxExtView = window.__GMXExtViewFactory({
  $: __gmxChrome.$,
  getStoredExtView: () => __gmxSt.lsGet(K.EXT_VIEW, "theme"),
  setStoredExtView: (v) => __gmxSt.extLsSet(K.EXT_VIEW, v),
  renderExtThemes: () => { try { renderExtThemes(); } catch {} },
  renderExtWallpapers: () => { try { renderExtWallpapers(); } catch {} },
});

if (!window.__GMXExtApplyFactory) throw new Error("GMX extapply factory missing");
const __gmxExtApply = window.__GMXExtApplyFactory({
  $: __gmxChrome.$,
  extLsSet: (key, value) => __gmxSt.extLsSet(key, value),
  extThemeStorageKey: "gmx_ext_theme",
  isPro,
  getExtThemes: () => EXT_THEMES,
  unlockedExtThemesCount: () => unlockedCountByRefs(EXT_THEMES.length, FREE_VISIBLE_EXT_THEMES),
  getStoredExtView: () => __gmxSt.lsGet(K.EXT_VIEW, "theme"),
  normalizeExtViewValue: (v) => __gmxExtView.normalizeExtViewValue(v),
  setExtView: (v, o) => __gmxExtView.setExtView(v, o),
  extSyncNow: (r) => __gmxExtView.extSyncNow(r),
  normalizeExtWallpaperId: (id) => normalizeExtWallpaperIdLocal(id),
  normalizeExtWallpaperView: (v) => __gmxExtWpStore.normalizeExtWallpaperView(v),
  currentExtWallpaperTarget: () => __gmxExtWpStore.currentExtWallpaperTarget(),
  setExtWallpaperForView: (v, id) => __gmxExtWpStore.setExtWallpaperForView(v, id),
  removeExtCustomBgLegacy: () => { try { localStorage.removeItem(K.EXT_CUSTOM_BG_LEGACY); } catch {} },
  renderExtWallpapers: () => { try { renderExtWallpapers(); } catch {} },
});

if (!window.__GMXExtCustomBgUiFactory) throw new Error("GMX extcustombgui factory missing");
const __gmxExtCbgUi = window.__GMXExtCustomBgUiFactory({
  $: __gmxChrome.$,
  t: (key) => t(key),
  toast: (type, html, ms) => __gmxChrome.toast(type, html, ms),
  escapeHtml: (s) => __gmxFmt.escapeHtml(s),
  bindExtTabs: () => __gmxExtView.bindExtTabs(),
  extSyncNow: (r) => __gmxExtView.extSyncNow(r),
  requireConnected: (label) => requireConnected(label),
  compressImageToJpegDataURL: (file, opts) => compressImageToJpegDataURL(file, opts),
  unlockedCountByRefs,
  reqRefsForUnlockIndex,
  isPro,
  lsGet: (key, def) => __gmxSt.lsGet(key, def),
  lsSet: (key, val) => __gmxSt.lsSet(key, val),
  lsRemove: (key) => { try { localStorage.removeItem(key); } catch {} },
  keys: {
    extCustomBgGlobal: K.EXT_CUSTOM_BG_GLOBAL,
    extCustomBgTabPrefix: K.EXT_CUSTOM_BG_TAB_PREFIX,
    extCustomBgTarget: K.EXT_CUSTOM_BG_TARGET,
    extCustomBgLegacy: K.EXT_CUSTOM_BG_LEGACY,
  },
});

if (!window.__GMXExtThemesUiFactory) throw new Error("GMX extthemesui factory missing");
const __gmxExtThemesUi = window.__GMXExtThemesUiFactory({
  $: __gmxChrome.$,
  t: (key) => t(key),
  escapeHtml: (s) => __gmxFmt.escapeHtml(s),
  toast: (type, html, ms) => __gmxChrome.toast(type, html, ms),
  getExtThemes: () => EXT_THEMES,
  getExtWallpapers: () => EXT_WALLPAPERS,
  getChosenExtTheme: () => {
    try {
      return localStorage.getItem("gmx_ext_theme") || "classic";
    } catch {
      return "classic";
    }
  },
  unlockedCountByRefs,
  freeVisibleExtThemes: FREE_VISIBLE_EXT_THEMES,
  freeVisibleExtWallpapers: FREE_VISIBLE_EXT_WALLPAPERS,
  isPro,
  reqRefsForUnlockIndex,
  unlockTagText: (idx, unlocked, free) => __gmxThemesUi.unlockTagText(idx, unlocked, free),
  formatUnlockMeter: (cur, total) => formatUnlockMeter(cur, total),
  chunkedRender: (grid, items, fn, opts) => __gmxUi.chunkedRender(grid, items, fn, opts),
  requireConnected: (label) => requireConnected(label),
  applyExtTheme: (id) => __gmxExtApply.applyExtTheme(id),
});

if (!window.__GMXNavFactory) throw new Error("GMX nav factory missing");
const __gmxNav = window.__GMXNavFactory({
  normalizeTopLevelTab: (n) => normalizeTopLevelTab(n),
  setCurrentTab: (n) => { CURRENT_TAB = n; },
  getTopLevelTabs: () => TOP_LEVEL_TABS,
  setBg: (n) => __gmxSetBg.setBg(n),
  persistLastTab: (n) => { try { __gmxSt.lsSet(K.LAST_TAB, n); } catch {} },
  onTabActivated: (name) => {
    try { applyLang(); } catch {}
    try { updateLangFlags(); } catch {}
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

if (!window.__GMXExtWallpaperUiFactory) throw new Error("GMX extwallpaperui factory missing");
const __gmxExtWpUi = window.__GMXExtWallpaperUiFactory({
  $: __gmxChrome.$,
  t: (key) => t(key),
  toast: (type, html, ms) => __gmxChrome.toast(type, html, ms),
  escapeHtml: (s) => __gmxFmt.escapeHtml(s),
  extSyncNow: (reason) => __gmxExtView.extSyncNow(reason),
  extLsSet: (key, value) => __gmxSt.extLsSet(key, value),
  keys: { extCustomBgGlobal: K.EXT_CUSTOM_BG_GLOBAL, extWpTarget: K.EXT_WP_TARGET },
  customUploadId: __gmxWp.CUSTOM_UPLOAD_ID,
  compressImageToJpegDataURL: (file, opts) => compressImageToJpegDataURL(file, opts),
  setExtWallpaperForView: (view, id) => __gmxExtWpStore.setExtWallpaperForView(view, id),
  normalizeExtWallpaperView: (view) => __gmxExtWpStore.normalizeExtWallpaperView(view),
  loadCustomWallpapers: () => loadCustomWallpapers(),
  getEffectiveExtCustomWallpapers: () => {
    const out = [...CUSTOM_WALLPAPERS_EXT];
    try {
      if (__gmxSt.lsGet(K.EXT_CUSTOM_BG_GLOBAL, "")) {
        out.push({ id: __gmxWp.CUSTOM_UPLOAD_ID, name: "My upload", tier: "custom" });
      }
    } catch {}
    return out;
  },
  getExtWallpapers: () => EXT_WALLPAPERS,
  syncExtWallpaperTargetUI: (sel, pref) => __gmxExtWpStore.syncExtWallpaperTargetUI(sel, pref),
  getExtWallpaperForView: (view) => __gmxExtWpStore.getExtWallpaperForView(view),
  currentExtWallpaperTarget: () => __gmxExtWpStore.currentExtWallpaperTarget(),
  extWallpaperLabel: (view) => __gmxExtWpStore.extWallpaperLabel(view),
  unlockedCountByRefs,
  freeVisibleExtWallpapers: FREE_VISIBLE_EXT_WALLPAPERS,
  customWpFreeCount: __gmxWp.CUSTOM_WP_FREE_COUNT,
  isPro,
  reqRefsForUnlockIndex,
  extWallpaperThumbUrl: (id) => extWallpaperThumbUrl(id),
  extWallpaperFullUrl: (id) => extWallpaperFullUrl(id),
  chunkedRender: (grid, items, fn, opts) => __gmxUi.chunkedRender(grid, items, fn, opts),
  observeLazyBg: (el) => __gmxUi.observeLazyBg(el),
  prefetchImage: (url) => __gmxUi.prefetchImage(url),
  requireConnected: (label) => requireConnected(label),
  applyExtWallpaper: (id, target) => __gmxExtApply.applyExtWallpaper(id, target),
  unlockTagText: (idx, unlocked, free) => __gmxThemesUi.unlockTagText(idx, unlocked, free),
  formatUnlockMeter: (cur, total) => formatUnlockMeter(cur, total),
});



