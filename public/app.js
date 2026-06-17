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

if (!window.__GMXModalsFactory) throw new Error("GMX modals factory missing");
const __gmxModalsHooks = { closeLangMenu: () => {} };
const __gmxModals = window.__GMXModalsFactory({
  $: __gmxChrome.$,
  escapeHtml: (s) => __gmxFmt.escapeHtml(s),
  onBeforeOpen: () => {
    try { __gmxModalsHooks.closeLangMenu(); } catch {}
  },
});
__gmxModals.initModalsShell();

if (!window.__GMXI18nUiFactory) throw new Error("GMX i18nui factory missing");
const __gmxI18nUi = window.__GMXI18nUiFactory({
  getSiteLang: () => __gmxSt.lsGet(K.SITE_LANG, "en"),
  getI18n: () => {
    try {
      if (
        globalThis.GMX_SITE_I18N &&
        typeof globalThis.GMX_SITE_I18N.createSiteI18nCatalog === "function"
      ) {
        return globalThis.GMX_SITE_I18N.createSiteI18nCatalog();
      }
    } catch (_e) {}
    return { en: {} };
  },
});

if (!window.__GMXTabStateFactory) throw new Error("GMX tabstate factory missing");
const __gmxTabState = window.__GMXTabStateFactory();

if (!window.__GMXSiteI18nUiFactory) throw new Error("GMX sitei18nui factory missing");
const __gmxSiteI18nUi = window.__GMXSiteI18nUiFactory({
  getSiteLang: () => __gmxSt.lsGet(K.SITE_LANG, "en"),
  getI18n: () => {
    try {
      if (
        globalThis.GMX_SITE_I18N &&
        typeof globalThis.GMX_SITE_I18N.createSiteI18nCatalog === "function"
      ) {
        return globalThis.GMX_SITE_I18N.createSiteI18nCatalog();
      }
    } catch (_e) {}
    return { en: {} };
  },
  sanitizeI18nValue: (lang, value, fallback) =>
    __gmxI18nUi.sanitizeI18nValue(lang, value, fallback),
  onPatchDynamicCopy: (lang, merged) => {
    try {
      __gmxSiteI18nDynamic.patchDynamicCopy(lang, merged);
    } catch (_e) {}
  },
});

if (!window.__GMXSiteI18nDynamicFactory) throw new Error("GMX sitei18ndynamic factory missing");
const __gmxSiteI18nDynamic = window.__GMXSiteI18nDynamicFactory({
  t: (key) => __gmxI18nUi.t(key),
  siteTr: (key, fb) => __gmxSiteI18nUi.siteTr(key, fb),
  $: __gmxChrome.$,
  escapeHtml: (s) => __gmxFmt.escapeHtml(s),
  syncPredictionFilterCopy: () => { try { syncPredictionFilterCopy(); } catch {} },
  syncCleanFillUi: () => { try { syncCleanFillUi(); } catch {} },
  syncReferralCardCopy: () => { try { syncReferralCardCopy(); } catch {} },
  initReferralPromoDetailsState: () => { try { initReferralPromoDetailsState(); } catch {} },
  getCurrentTab: () => __gmxTabState.getCurrentTab(),
  getHandle: () => { try { return getHandle(); } catch { return ""; } },
  scheduleRefStatsRefresh: (ms) => { try { scheduleRefStatsRefresh(ms); } catch {} },
});

if (!window.__GMXSiteLangMenuFactory) throw new Error("GMX sitelangmenu factory missing");
const __gmxSiteLangMenu = window.__GMXSiteLangMenuFactory({
  $: __gmxChrome.$,
  escapeHtml: (s) => __gmxFmt.escapeHtml(s),
  getSiteLang: () => __gmxSt.lsGet(K.SITE_LANG, "en"),
  setSiteLang: (v) => { try { __gmxSt.lsSet(K.SITE_LANG, v); } catch {} },
  getSiteLangs: () => SITE_LANGS,
  setSiteLangs: (arr) => { SITE_LANGS = arr; },
  getReplyLangs: () => REPLY_LANGS,
  setReplyLangs: (arr) => { REPLY_LANGS = arr; },
  applyLang: () => { try { applyLang(); } catch {} },
  onSiteLangChanged: () => {
    try { syncBestModeUi(); } catch {}
    try { syncCleanFillUi(); } catch {}
    try { window.postMessage({ type: "GMX_SYNC_NOW", reason: "site_lang_change" }, "*"); } catch {}
    try { updateLangFlags(); } catch {}
    try { renderWallpaperUI(); } catch {}
  },
  onI18nKick: () => {
    try { applyLang(); } catch {}
    try { syncBestModeUi(); } catch {}
    try { syncCleanFillUi(); } catch {}
  },
});
__gmxModalsHooks.closeLangMenu = () => __gmxSiteLangMenu.closeLangMenu();

if (!window.__GMXLangUiFactory) throw new Error("GMX langui factory missing");
const __gmxLangUi = window.__GMXLangUiFactory({
  $: __gmxChrome.$,
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
const ASSET_REV = "20260618c";

if (!window.__GMXUnlockFactory) throw new Error("GMX unlock factory missing");
const __gmxUnlock = window.__GMXUnlockFactory({ isPro, getRefCount: () => REF_COUNT });

if (!window.__GMXWallpapersFactory) throw new Error("GMX wallpapers factory missing");
const __gmxWp = window.__GMXWallpapersFactory({
  getAssetRev: () => ASSET_REV,
  getSiteCustomUpload: () => __gmxSt.lsGet(K.CUSTOM_BG_GLOBAL),
  getExtCustomUpload: () => __gmxSt.lsGet(K.EXT_CUSTOM_BG_GLOBAL),
});

if (!window.__GMXCustomWallpapersFactory) throw new Error("GMX customwallpapers factory missing");
const __gmxCustomWp = window.__GMXCustomWallpapersFactory({
  apiPath: "/api/wallpapers/custom",
  customUploadId: __gmxWp.CUSTOM_UPLOAD_ID,
  getSiteCustomUpload: () => __gmxSt.lsGet(K.CUSTOM_BG_GLOBAL, ""),
  getExtCustomUpload: () => __gmxSt.lsGet(K.EXT_CUSTOM_BG_GLOBAL, ""),
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

if (!window.__GMXWallpaperHelpersFactory) throw new Error("GMX wallpaperhelpers factory missing");
const __gmxWpHelpers = window.__GMXWallpaperHelpersFactory({
  wp: __gmxWp,
  getWallpapers: () => WALLPAPERS,
  getExtWallpapers: () => EXT_WALLPAPERS,
  isPro,
  unlockedCountByRefs,
  freeVisibleWallpapers: FREE_VISIBLE_WALLPAPERS,
  customWpFreeCount: __gmxWp.CUSTOM_WP_FREE_COUNT,
});
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
  t: (key) => __gmxI18nUi.t(key),
  syncModePanelCopy: () => { try { __gmxSiteI18nDynamic.syncModePanelCopy(); } catch {} },
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
  storage: __gmxSt,
  getStyles: () => __gmxThemes.STYLES,
  normalizeStyle: (s) => __gmxGp.normalizeStyle(s),
  isPro,
  reqRefsForUnlockIndex,
  unlockedCountByRefs,
  freeVisibleStyles: FREE_VISIBLE_STYLES,
  t: (key) => __gmxI18nUi.t(key),
  syncModePanelCopy: () => { try { __gmxSiteI18nDynamic.syncModePanelCopy(); } catch {} },
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
  modals: __gmxModals,
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
  modals: __gmxModals,
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
  getEffectiveCustomWallpapers: () => __gmxCustomWp.getEffectiveCustomWallpapersSite(),
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
      if (__gmxTabState.getCurrentTab() === "wallet") {
        await loadPlans();
        await loadBillingProof();
      }
    } catch {}
  },
  onRetryReferrals: () => { try { if (__gmxTabState.getCurrentTab() === "referrals") scheduleRefStatsRefresh(120); } catch {} },
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
  t: (key) => __gmxI18nUi.t(key),
  trWp: (key) => __gmxI18nUi.tr(key),
  toast: (type, html, ms) => __gmxChrome.toast(type, html, ms),
  storage: __gmxSt,
  keys: { wpGlobal: K.WP_GLOBAL, themewallView: K.THEMEWALL_VIEW },
  getWallpaperTabs: () => WALLPAPER_TABS,
  wallpaperKeyForTab: (tab) => __gmxWpStore.wallpaperKeyForTab(tab),
  setWallpaperForTab: (tab, id) => __gmxWpStore.setWallpaperForTab(tab, id),
  getEffectiveCustomWallpapers: () => __gmxCustomWp.getEffectiveCustomWallpapersSite(),
  getWallpapers: () => WALLPAPERS,
  unlockedCountByRefs,
  freeVisibleWallpapers: FREE_VISIBLE_WALLPAPERS,
  customWpFreeCount: __gmxWp.CUSTOM_WP_FREE_COUNT,
  isPro,
  reqRefsForUnlockIndex,
  wallpaperUnlocked: (wp, idx, len) => wallpaperUnlocked(wp, idx, len),
  wallpaperThumbUrl: (id) => wallpaperThumbUrl(id),
  wallpaperFullUrl: (id) => wallpaperFullUrl(id),
  loadCustomWallpapers: () => __gmxCustomWp.loadCustomWallpapers(),
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
  t: (key) => __gmxI18nUi.t(key),
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
  t: (key) => __gmxI18nUi.t(key),
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
  t: (key) => __gmxI18nUi.t(key),
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
  normalizeTopLevelTab: (n) => __gmxTabState.normalizeTopLevelTab(n),
  setCurrentTab: (n) => __gmxTabState.setCurrentTab(n),
  getTopLevelTabs: () => __gmxTabState.TOP_LEVEL_TABS,
  setBg: (n) => __gmxSetBg.setBg(n),
  persistLastTab: (n) => { try { __gmxSt.lsSet(K.LAST_TAB, n); } catch {} },
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

if (!window.__GMXExtWallpaperUiFactory) throw new Error("GMX extwallpaperui factory missing");
const __gmxExtWpUi = window.__GMXExtWallpaperUiFactory({
  $: __gmxChrome.$,
  t: (key) => __gmxI18nUi.t(key),
  toast: (type, html, ms) => __gmxChrome.toast(type, html, ms),
  escapeHtml: (s) => __gmxFmt.escapeHtml(s),
  extSyncNow: (reason) => __gmxExtView.extSyncNow(reason),
  extLsSet: (key, value) => __gmxSt.extLsSet(key, value),
  keys: { extCustomBgGlobal: K.EXT_CUSTOM_BG_GLOBAL, extWpTarget: K.EXT_WP_TARGET },
  customUploadId: __gmxWp.CUSTOM_UPLOAD_ID,
  compressImageToJpegDataURL: (file, opts) => compressImageToJpegDataURL(file, opts),
  setExtWallpaperForView: (view, id) => __gmxExtWpStore.setExtWallpaperForView(view, id),
  normalizeExtWallpaperView: (view) => __gmxExtWpStore.normalizeExtWallpaperView(view),
  loadCustomWallpapers: () => __gmxCustomWp.loadCustomWallpapers(),
  getEffectiveExtCustomWallpapers: () => __gmxCustomWp.getEffectiveExtCustomWallpapers(),
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




  if (!window.__GMXUiWireFactory) throw new Error("GMX uiwire factory missing");
  const __gmxUiWire = window.__GMXUiWireFactory({ ui: __gmxUi });
  function chunkedRender(grid, items, renderItem, opts){
    return __gmxUiWire.chunkedRender(grid, items, renderItem, opts);
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

  if (!window.__GMXShellDepsFactory) throw new Error("GMX shelldeps factory missing");
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
  } = window.__GMXShellDepsFactory({
    K,
    storage: __gmxSt,
    logs: __gmxLogs,
    cleanfill: __gmxCf,
    antirepeat: __gmxAnti,
    custombg: __gmxCbg,
    tabtheme: __gmxTabTheme,
  });

  if (!window.__GMXWallpapersWireFactory) throw new Error("GMX wallpaperswire factory missing");
  const SITE_WALLPAPER_PACK_COUNT = __gmxWp.SITE_PACK_COUNT;
  const __gmxWallpapersWire = window.__GMXWallpapersWireFactory({
    keys: K,
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

if (!window.__GMXThemesWireFactory) throw new Error("GMX themeswire factory missing");
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
  extViewKey: K.EXT_VIEW,
  themeApply: __gmxThemeApply,
  extWpStore: __gmxExtWpStore,
  extView: __gmxExtView,
  wpUi: __gmxWpUi,
  themesUi: __gmxThemesUi,
  extApply: __gmxExtApply,
  extCbgUi: __gmxExtCbgUi,
  extThemesUi: __gmxExtThemesUi,
  extWpUi: __gmxExtWpUi,
  unlockedCountByRefs,
  extThemesLength: EXT_THEMES.length,
  freeVisibleExtThemes: FREE_VISIBLE_EXT_THEMES,
});

  let INIT_DONE = false;
  if (!window.__GMXChromeWireFactory) throw new Error("GMX chromewire factory missing");
  const __gmxChromeWire = window.__GMXChromeWireFactory({
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
    getInitDone: () => INIT_DONE,
    normalizeTopLevelTab: (n) => normalizeTopLevelTab(n),
    LS_SITE_LANG,
    API,
    LS_HANDLE,
    LS_TOKEN,
    LS_IS_ADMIN,
    LS_ADMIN_CLAIMABLE,
    isLocalDevHost,
    getAdminToken,
    setAuthOk: (v) => { AUTH_OK = !!v; },
    t,
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
  function applyRefCountEligible(eligible, opts){ return __gmxChromeWire.applyRefCountEligible(eligible, opts); }

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
    renderReferralRightCopy,
    syncModePanelCopy,
    patchDynamicCopy,
    fillSelect,
  } = window.__GMXI18nBridgeFactory({
    siteI18nUi: __gmxSiteI18nUi,
    siteI18nDynamic: __gmxSiteI18nDynamic,
    siteLangMenu: __gmxSiteLangMenu,
  });

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

// ----- Best (pick a strong line and copy it) -----
let __gmxBestPick;
function pickBestLine(kind, lines){ return __gmxBestPick.pickBestLine(kind, lines); }
async function doBest(kind){ return __gmxBestPick.doBest(kind); }
async function doBestServer(kind){ return __gmxBestPick.doBestServer(kind); }

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
  if (!window.__GMXBankUiWireFactory) throw new Error("GMX bankuiwire factory missing");
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

  if (!window.__GMXCleanFillRunWireFactory) throw new Error("GMX cleanfillrunwire factory missing");
  const {
    oneClickCleanup,
    refillCleanFill,
    cleanupKeyLines,
    pushRecent,
    repeatKey,
    filterAntiRepeat,
    normalizeLine,
    dedupeLines,
  } = window.__GMXCleanFillRunWireFactory({
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

  function mergeAppendUnique(existing, newLines){
    return __gmxGen.mergeAppendUnique(existing, newLines);
  }

  if (!window.__GMXRefStatsFactory) throw new Error("GMX refstats factory missing");
  const __gmxRefStats = window.__GMXRefStatsFactory({
    $,
    api,
    getHandle,
    siteLangKey: LS_SITE_LANG,
    refPromoOpenKey: LS_REF_PROMO_OPEN,
    renderReferralRightCopy,
    renderGuideRightCopy,
    applyRefCountEligible,
    nextReferralUnlockAt,
    renderThemes,
    renderExtThemes,
    fillStyles,
    fillPacks,
  });
  const revealReferralLinkUi = () => __gmxRefStats.revealReferralLinkUi();
  const scheduleRefStatsRefresh = (delay) => __gmxRefStats.scheduleRefStatsRefresh(delay);
  const refreshRefStats = (force) => __gmxRefStats.refreshRefStats(force);

  if (!window.__GMXGenerateFlowFactory) throw new Error("GMX generateflow factory missing");
  const __gmxGenFlow = window.__GMXGenerateFlowFactory({
    $,
    api,
    requireConnected,
    getToken,
    getHandle,
    initSession,
    readGenParams,
    getAntiStrength,
    getCleanFillEnabled,
    getBestMode,
    getGmView: () => __gmxBankUi.getGmView(),
    getGnView: () => __gmxBankUi.getGnView(),
    ensureIndexed,
    activeKey,
    getGlobalKey,
    readKey,
    writeKey,
    remainingSlots,
    saveCap,
    renderList,
    postEvent,
    setBusy,
    inflight: INFLIGHT,
    abort: ABORT,
    filterAntiRepeat,
    pushRecent,
    repeatKey,
    oneClickCleanup,
    refreshUsage,
    logEvent,
    escapeHtml,
    siteTr,
    t,
    friendlyUiErrorMessage,
    toast,
    yieldToUiFrame,
    cleanFillStrength: CLEAN_FILL_STRENGTH,
    gen: __gmxGen,
    mergeAppendUnique,
  });
  async function generate(kind, count){
    return __gmxGenFlow.generate(kind, count);
  }

// ----- Leaderboard -----
let LB_DAYS = 7;
if (!window.__GMXLeaderboardFactory) throw new Error("GMX leaderboard factory missing");
const __gmxLeaderboard = window.__GMXLeaderboardFactory({
  $,
  escapeHtml,
  t,
  getToken,
  getHandle,
});
async function loadLeaderboard(days){
  const j = await __gmxLeaderboard.loadLeaderboard(days);
  LB_DAYS = __gmxLeaderboard.getLbDays();
  return j;
}
const bindLeaderboardUI = () => __gmxLeaderboard.bindLeaderboardUI();

// ----- Prediction market -----
  if (!window.__GMXPredictionFactory) throw new Error("GMX prediction factory missing");
  const __gmxPrediction = window.__GMXPredictionFactory({
    $,
    escapeHtml,
    t,
    api,
    getHandle,
    getToken,
    friendlyUiErrorMessage,
    getCurrentTab: () => __gmxTabState.getCurrentTab(),
  });
  const syncPredictionFilterCopy = () => __gmxPrediction.syncPredictionFilterCopy();
  const loadPredictionSignals = (opts) => __gmxPrediction.loadPredictionSignals(opts);
  __gmxPrediction.bindPredictionMarketUI();

// ----- Referrals -----
  if (!window.__GMXReferralsFactory) throw new Error("GMX referrals factory missing");
  const __gmxReferrals = window.__GMXReferralsFactory({
    $,
    escapeHtml,
    api,
    t,
    requireConnected,
    getReferralUiCopy,
    siteLangKey: LS_SITE_LANG,
    refreshRefStats,
    revealReferralLinkUi,
    applyRefCountEligible,
    renderThemes,
    renderExtThemes,
    initWallpapers,
    renderExtWallpapers,
    fillStyles,
    fillPacks,
    refreshUsage,
    initReferralPromoDetailsState,
  });
  const loadRefInvited = (days) => __gmxReferrals.loadRefInvited(days);
  const loadRefLeaderboard = (days) => __gmxReferrals.loadRefLeaderboard(days);
  __gmxReferrals.bindReferrals();

// ----- Wallet / Billing -----
  let BILLING = { receiver:"", plans:[], solUsd:0, rpcPublic:"" };
  let selectedCurrency = "SOL"; // SOL | USDC | USDT
  let selectedPlanKey = "";
  let selectedPlan = null;

  if (!window.__GMXWalletHelpersFactory) throw new Error("GMX wallethelpers factory missing");
  const __gmxWh = window.__GMXWalletHelpersFactory();
  const WS_CHAIN = __gmxWh.WS_CHAIN;
  const LS_WALLET_CHOICE = K.WALLET_CHOICE;
  const b58encode = __gmxWh.b58encode;
  const shortPk = __gmxWh.shortPk;
  const walletNameKey = __gmxWh.walletNameKey;
  const safeIconSrc = __gmxWh.safeIconSrc;
  const defaultWalletIcon = __gmxWh.defaultWalletIcon;
  const listWalletChoices = () => __gmxWh.listWalletChoices();
  const getRpcUrl = () => __gmxWh.getRpcUrl(BILLING);
  const rpcCandidates = () => __gmxWh.rpcCandidates(BILLING);
  const shouldRetryRpc = (err) => __gmxWh.shouldRetryRpc(err);
  const planPricePrimary = __gmxWh.planPricePrimary;
  const planPriceSecondary = __gmxWh.planPriceSecondary;

  const WALLET = {
    connected: false,
    kind: null,            // "standard" | "legacy"
    name: "",
    icon: "",
    wallet: null,          // Wallet Standard wallet object
    account: null,         // Wallet Standard account
    provider: null,        // legacy injected provider
    publicKey: null        // solanaWeb3.PublicKey
  };

  async function walletSignMessageBytes(messageBytes){
    return __gmxWh.signMessageBytes(WALLET, messageBytes);
  }

  async function bindWalletToIntent(intent){
    const intentId = String(intent?.id || intent?.intentId || "").trim();
    const bindMessage = String(intent?.bindMessage || "").trim();
    const payer = String(WALLET.publicKey?.toString?.() || "").trim();
    if (!intentId || !bindMessage || !payer) throw new Error("wallet_bind_required");
    const nonceSig = await walletSignMessageBytes(new TextEncoder().encode(bindMessage));
    return api("/api/billing/bind", "POST", { intentId, wallet: payer, nonceSig });
  }

  function addIntentMemoInstruction(tx, intentId, web3){
    __gmxWh.addIntentMemoInstruction(tx, intentId, web3);
  }

  if (!window.__GMXWalletPayFactory) throw new Error("GMX walletpay factory missing");
  const __gmxWalletPay = window.__GMXWalletPayFactory({
    api,
    getBilling: () => BILLING,
    getSelectedCurrency: () => selectedCurrency,
    getWallet: () => WALLET,
    wsChain: WS_CHAIN,
    b58encode,
    addIntentMemoInstruction,
    getRpcUrl,
    rpcCandidates,
    shouldRetryRpc,
  });

  const buildPaymentTx = (intent) => __gmxWalletPay.buildPaymentTx(intent);
  const walletSendTransaction = (tx, connection) => __gmxWalletPay.walletSendTransaction(tx, connection);
  const verifyIntentWithRetry = (intentId, sig, payer) => __gmxWalletPay.verifyIntentWithRetry(intentId, sig, payer);

  if (!window.__GMXWalletUiFactory) throw new Error("GMX walletui factory missing");
  const __gmxWalletUi = window.__GMXWalletUiFactory({
    $,
    escapeHtml,
    api,
    modals: __gmxModals,
    toast,
    trackEvent,
    abVariant,
    friendlyUiErrorMessage,
    setPayState,
    openPaySuccess,
    getHandle,
    refreshUsage,
    walletChoiceKey: LS_WALLET_CHOICE,
    wsChain: WS_CHAIN,
    listWalletChoices,
    walletNameKey,
    safeIconSrc,
    defaultWalletIcon,
    shortPk,
    planPricePrimary,
    planPriceSecondary,
    getBilling: () => BILLING,
    setBilling: (v) => { BILLING = v; },
    getSelectedCurrency: () => selectedCurrency,
    setSelectedCurrency: (v) => { selectedCurrency = v; },
    getSelectedPlanKey: () => selectedPlanKey,
    setSelectedPlanKey: (v) => { selectedPlanKey = v; },
    getSelectedPlan: () => selectedPlan,
    setSelectedPlan: (v) => { selectedPlan = v; },
    getWallet: () => WALLET,
    bindWalletToIntent,
    buildPaymentTx,
    walletSendTransaction,
    verifyIntentWithRetry,
  });

  const setWalletUi = () => __gmxWalletUi.setWalletUi();
  const loadPlans = () => __gmxWalletUi.loadPlans();
  const loadBillingProof = () => __gmxWalletUi.loadBillingProof();
  const loadActivity = () => __gmxWalletUi.loadActivity();
  const renderWalletStatus = (sub) => __gmxWalletUi.renderWalletStatus(sub);
  const bindWalletTab = () => __gmxWalletUi.bindWalletTab();


// ----- Admin -----
  if (!window.__GMXAdminFactory) throw new Error("GMX admin factory missing");
  const __gmxAdmin = window.__GMXAdminFactory({
    $,
    escapeHtml,
    api,
    getHandle,
    requireConnected,
    setAdminToken,
    isAdminSignedIn,
    adminHandle: ADMIN_HANDLE,
  });
  const syncAdminUi = () => __gmxAdmin.syncAdminUi();
  const requireAdminSignedIn = () => __gmxAdmin.requireAdminSignedIn();
  const pruneLegacyAdminPanels = () => __gmxAdmin.pruneLegacyAdminPanels();
  __gmxAdmin.bindAdmin();

  // ----- Redeem code -----
  if (!window.__GMXRedeemFactory) throw new Error("GMX redeem factory missing");
  const __gmxRedeem = window.__GMXRedeemFactory({
    $,
    api,
    requireConnected,
    getHandle,
    tab,
    renderWalletStatus,
    refreshUsage,
  });
  __gmxRedeem.bindRedeem();

  if (!window.__GMXSiteInitWireFactory) throw new Error("GMX siteinitwire factory missing");
  await window.__GMXSiteInitWireFactory({
    setBestMode,
    setCleanFillEnabled,
    siteLangMenu: __gmxSiteLangMenu,
    styles: __gmxStyles,
    storage: __gmxSt,
    gp: __gmxGp,
    bankUi: __gmxBankUi,
    tabState: __gmxTabState,
    K,
    I18N,
    LS_SITE_LANG,
    LS_GM_REPLY_LANG,
    LS_GN_REPLY_LANG,
    LS_CUSTOM_BG_GLOBAL,
    LS_WP_GLOBAL,
    LS_LAST_TAB,
    LS_EXT_VIEW,
    applyLang,
    syncBestModeUi,
    syncCleanFillUi,
    pruneLegacyAdminPanels,
    updateLangFlags,
    fillStyles,
    fillPacks,
    applyTheme,
    renderThemes,
    applyUserBg,
    initWallpapers,
    renderLangChips,
    $,
    requireConnected,
    setView,
    generate,
    trackEvent,
    getBestMode,
    getCleanFillEnabled,
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
    REPLY_LANGS,
    ensureIndexed,
    compressImageToJpegDataURL,
    CUSTOM_UPLOAD_ID,
    setWallpaperForTab,
    renderWallpaperUI,
    currentTabName,
    applyWallpaper,
    toast,
    t,
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
    setAuthOk: (v) => { AUTH_OK = !!v; },
    setInitDone: (v) => { INIT_DONE = !!v; },
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
    migrateLegacyBank,
    initProTabs,
    setDegraded,
  }).run();

  // ----- Connect -----
  if (!window.__GMXConnectFactory) throw new Error("GMX connect factory missing");
  const __gmxConnect = window.__GMXConnectFactory({
    $,
    api,
    escapeHtml,
    friendlyUiErrorMessage,
    normalizeHandle,
    setAuthOk: (v) => { AUTH_OK = !!v; },
    applyAdminVisibility,
    refreshUsage,
    loadPlans,
    ping,
    keys: {
      handle: LS_HANDLE,
      token: LS_TOKEN,
      isAdmin: LS_IS_ADMIN,
      adminClaimable: LS_ADMIN_CLAIMABLE,
      forceLogout: LS_FORCE_LOGOUT,
      forceLogoutV2: LS_FORCE_LOGOUT_V2,
    },
  });
  __gmxConnect.bindConnect();

})();
