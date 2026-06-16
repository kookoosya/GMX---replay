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
const ASSET_REV = "20260617r";

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




  // ----- UI performance helpers -----
  function chunkedRender(grid, items, renderItem, opts){
    return __gmxUi.chunkedRender(grid, items, renderItem, opts);
  }

  async function yieldToUiFrame(){
    return await __gmxUi.yieldToUiFrame();
  }

  function prefetchImage(url){
    return __gmxUi.prefetchImage(url);
  }

  function observeLazyBg(el){ return __gmxUi.observeLazyBg(el); }

async function postEvent(type, meta){
  return __gmxUi.postEvent(type, meta);
}

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
  function unlockedStylesCount(){ return __gmxStyles.unlockedStylesCount(); }

  function rgbaToRgbTuple(s){ return __gmxThemes.rgbaToRgbTuple(s); }
  function relLum(rgb){ return __gmxThemes.relLum(rgb); }
  function pickAccentOn(a,b){ return __gmxThemes.pickAccentOn(a,b); }

const LS_EXT_VIEW = K.EXT_VIEW;

function applyTheme(id){ return __gmxThemeApply.applyTheme(id); }

function normalizeExtWallpaperView(view){ return __gmxExtWpStore.normalizeExtWallpaperView(view); }
function extWallpaperKeyForView(view){ return __gmxExtWpStore.extWallpaperKeyForView(view); }
function getExtWallpaperForView(view){ return __gmxExtWpStore.getExtWallpaperForView(view); }
function setExtWallpaperForView(view, id){ return __gmxExtWpStore.setExtWallpaperForView(view, id); }
function syncExtWallpaperTargetUI(sel, preferred){ return __gmxExtWpStore.syncExtWallpaperTargetUI(sel, preferred); }
function currentExtWallpaperTarget(){ return __gmxExtWpStore.currentExtWallpaperTarget(); }
function extWallpaperLabel(view){ return __gmxExtWpStore.extWallpaperLabel(view); }
function normalizeStoredExtWallpaperSelections(){ return __gmxExtWpStore.normalizeStoredExtWallpaperSelections(); }

function normalizeExtViewValue(view){ return __gmxExtView.normalizeExtViewValue(view); }
function setExtView(view, opts){ return __gmxExtView.setExtView(view, opts); }
function extSyncNow(reason){ return __gmxExtView.extSyncNow(reason); }

function markWallpaperSelection(activeId){ return __gmxWpUi.markWallpaperSelection(activeId); }

function unlockedExtThemesCount(){ return unlockedCountByRefs(EXT_THEMES.length, FREE_VISIBLE_EXT_THEMES); }

function unlockTagText(idx, unlocked, freeCount){ return __gmxThemesUi.unlockTagText(idx, unlocked, freeCount); }

function applyExtTheme(id){ return __gmxExtApply.applyExtTheme(id); }
function applyExtWallpaper(id, targetView){ return __gmxExtApply.applyExtWallpaper(id, targetView); }

function renderThemes(){ return __gmxThemesUi.renderThemes(); }
function renderExtCustomBgUI(){ return __gmxExtCbgUi.renderExtCustomBgUI(); }
function renderExtThemes(){ return __gmxExtThemesUi.renderExtThemes(); }
function renderExtWallpapers(){ return __gmxExtWpUi.renderExtWallpapers(); }
function bindExtTabs(){ return __gmxExtView.bindExtTabs(); }
function initExtWallpaperControls(){ return __gmxExtWpUi.initExtWallpaperControls(); }

function fillStyles(){ return __gmxStyles.fillStyles(); }

const $ = __gmxChrome.$;

  function toast(type, html, ms=4500){ return __gmxChrome.toast(type, html, ms); }
  function setDegraded(on, msg){ return __gmxChrome.setDegraded(on, msg); }
  function showFatal(msg){ return __gmxChrome.showFatal(msg); }
  function hideFatal(){ return __gmxChrome.hideFatal(); }
  function setBusy(kind, on, label){ return __gmxChrome.setBusy(kind, on, label); }

  let INIT_DONE = false;
  const esc = (s)=>__gmxFmt.escapeHtml(s);

  if (!window.__GMXShellWireFactory) throw new Error("GMX shellwire factory missing");
  const __gmxShellWire = window.__GMXShellWireFactory({
    chrome: __gmxChrome,
    $,
    toast,
    setDegraded,
    showFatal,
    hideFatal,
    escapeHtml: esc,
    isInitDone: () => INIT_DONE,
    normalizeTopLevelTab: (n) => normalizeTopLevelTab(n),
    showTab: (n) => __gmxNav.showTab(n),
    ensurePredictionTabVisible: () => __gmxNav.ensurePredictionTabVisible(),
    buildAuthConfig: () => ({
      API,
      LS_HANDLE,
      LS_TOKEN,
      LS_IS_ADMIN,
      LS_ADMIN_CLAIMABLE,
      isLocalDevHost,
      getAdminToken,
      setAuthOk: (v) => { AUTH_OK = !!v; },
      $,
      t,
      toast,
      escapeHtml: esc,
      applyAdminVisibility,
      ping,
      setDegraded,
    }),
  });

  function setBg(tab){ return __gmxSetBg.setBg(tab); }

  function ensurePredictionTabVisible(){ return __gmxNav.ensurePredictionTabVisible(); }

  function showTab(name){ return __gmxNav.showTab(name); }

// Simple info modal (shared shell layer)
  function showInfoModal(title, html){
    return __gmxModals.showInfoModal(title, html);
  }

  function tab(name){ return __gmxShellWire.tab(name); }
  function __getGMXAuth(){ return __gmxShellWire.getAuth(); }
  function normalizeHandle(input){ return __gmxShellWire.normalizeHandle(input); }
  function getHandle(){ return __gmxShellWire.getHandle(); }

  function siteLang(){
    try{ return String(localStorage.getItem(LS_SITE_LANG) || "en").toLowerCase(); }catch(_e){ return "en"; }
  }
  function getBestMode(){ return __gmxToggles.getBestMode(); }
  function setBestMode(next, silent){ return __gmxToggles.setBestMode(next, silent); }
  function syncBestModeUi(){ return __gmxToggles.syncBestModeUi(); }

  function abVariant(){ return __gmxPaywall.abVariant(); }
  async function trackEvent(type, meta){ return __gmxShellWire.trackEvent(type, meta); }
  function openLimitModal(payload){ return __gmxPaywall.openLimitModal(payload); }
  function closeLimitModal(){ return __gmxPaywall.closeLimitModal(); }
  function bindLimitModal(){ return __gmxPaywall.bindLimitModal(); }
  function setPayState(state, hint){ return __gmxPaywall.setPayState(state, hint); }
  function openPaySuccess(){ return __gmxPaywall.openPaySuccess(); }
  function closePaySuccess(){ return __gmxPaywall.closePaySuccess(); }
  function bindPaySuccess(){ return __gmxPaywall.bindPaySuccess(); }

  function getToken(){ return __gmxShellWire.getToken(); }
  function isConnected(){ return __gmxShellWire.isConnected(); }
  function requireConnected(target){ return __gmxShellWire.requireConnected(target); }
  function isPublicApi(path){ return __gmxShellWire.isPublicApi(path); }
  async function initSession(force=false){ return await __gmxShellWire.initSession(force); }
  async function api(path, method="GET", body, opts={}){ return await __gmxShellWire.api(path, method, body, opts); }

  function setApiPillState(state){ return __gmxHealth.setApiPillState(state); }

  async function ping(){ return __gmxHealth.ping(); }

  async function loadBuild(){ return __gmxHealth.loadBuild(); }

  function watchBuildUpdates(){ return __gmxHealth.watchBuildUpdates(); }

  function normLimitForUI(limit){ return __gmxUsage.normLimitForUI(limit); }
  function setMeter(valId, fillId, used, limit){ return __gmxUsage.setMeter(valId, fillId, used, limit); }

  function renderHelpModal(){ return __gmxHelp.renderHelpModal(); }
  function openHelpModal(){ return __gmxHelp.openHelpModal(); }
  function closeHelpModal(){ return __gmxHelp.closeHelpModal(); }
  function bindHelpModal(){ return __gmxHelp.bindHelpModal(); }

  function applyRefCountEligible(eligible, opts){ return __gmxAccount.applyRefCountEligible(eligible, opts); }

  function usageCosmeticSignature(j){ return __gmxUsage.usageCosmeticSignature(j); }

  async function refreshUsage(){ return __gmxUsage.refreshUsage(); }

  function applyAdminVisibility(){ return __gmxAccount.applyAdminVisibility(); }


  // ---- UI Translation (site language) ----
  // Source of truth: shared/i18n/locales/*.json → /public/i18n/siteI18n.js
  const I18N = (globalThis.GMX_SITE_I18N && typeof globalThis.GMX_SITE_I18N.createSiteI18nCatalog === "function")
    ? globalThis.GMX_SITE_I18N.createSiteI18nCatalog()
    : { en: {} };

  function siteTr(key, fallback = ""){ return __gmxSiteI18nUi.siteTr(key, fallback); }
  function applyLang(){ return __gmxSiteI18nUi.applyLang(); }

  function getReferralUiCopy(lang){ return __gmxSiteI18nDynamic.getReferralUiCopy(lang); }
  function getGuideUiCopy(lang){ return __gmxSiteI18nDynamic.getGuideUiCopy(lang); }
  function renderGuideRightCopy(lang){ return __gmxSiteI18nDynamic.renderGuideRightCopy(lang); }
  function deriveReferralUnlocks(eligible, rawUnlocks){
    return __gmxSiteI18nDynamic.deriveReferralUnlocks(eligible, rawUnlocks);
  }
  function nextReferralUnlockAt(eligible){ return __gmxSiteI18nDynamic.nextReferralUnlockAt(eligible); }
  function nextReferralUnlockLabel(lang, step){
    return __gmxSiteI18nDynamic.nextReferralUnlockLabel(lang, step);
  }
  function renderReferralRightCopy(lang){ return __gmxSiteI18nDynamic.renderReferralRightCopy(lang); }
  function syncModePanelCopy(){ return __gmxSiteI18nDynamic.syncModePanelCopy(); }
  function patchDynamicCopy(lang, merged){ return __gmxSiteI18nDynamic.patchDynamicCopy(lang, merged); }

  function fillSelect(sel, arr){ return __gmxSiteLangMenu.fillSelect(sel, arr); }

  // ----- Lists (single saved bank per kind; legacy global/lang banks migrate once) -----
  function linesFromText(t){ return __gmxBanks.linesFromText(t); }
  function getLangIndexKey(kind){ return __gmxBanks.getLangIndexKey(kind); }
  function getGlobalKey(kind){ return __gmxBanks.getGlobalKey(kind); }
  function getLangKey(kind, lang){ return __gmxBanks.getLangKey(kind, lang); }
  function getBankKey(kind){ return __gmxBanks.getBankKey(kind); }
  function getBankMigrationKey(kind){ return __gmxBanks.getBankMigrationKey(kind); }
  function getLangIndex(kind){ return __gmxBanks.getLangIndex(kind); }
  function setLangIndex(kind, arr){ return __gmxBanks.setLangIndex(kind, arr); }
  function readKey(key){ return __gmxBanks.readKey(key); }
  function writeKey(key, lines){ return __gmxBanks.writeKey(key, lines); }
  function allLegacyKeysForKind(kind){ return __gmxBanks.allLegacyKeysForKind(kind); }
  function migrateLegacyBank(kind){ return __gmxBanks.migrateLegacyBank(kind); }

// ----- Best (pick a strong line and copy it) -----
let __gmxBestPick;
function pickBestLine(kind, lines){ return __gmxBestPick.pickBestLine(kind, lines); }
async function doBest(kind){ return __gmxBestPick.doBest(kind); }
async function doBestServer(kind){ return __gmxBestPick.doBestServer(kind); }

  function currentLang(kind){
    try{
      const el = kind==="gm" ? $("gmLang") : $("gnLang");
      if (el) el.value = "en";
    }catch{}
    return "en";
  }
  function activeKey(kind){
    return getBankKey(kind);
  }

  function ensureIndexed(kind, lang){
    return;
  }

  if (!window.__GMXBankUiFactory) throw new Error("GMX bankui factory missing");
  const __gmxBankUi = window.__GMXBankUiFactory({
    $,
    escapeHtml,
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
    dedupeLines,
    normalizeLine: (s) => __gmxGen.normalizeLine(s),
    linesFromText,
    activeKey,
    currentLang,
    ensureIndexed,
    chunkedRender,
    renderHelpModal,
    openLimitModal,
    trackEvent,
    toast,
    t,
    updateLangFlags,
    renderLangChips,
    abort: ABORT,
    draftKeys: {
      gmNew: K.DRAFT_GM_NEW,
      gnNew: K.DRAFT_GN_NEW,
      gmPaste: K.DRAFT_GM_PASTE,
      gnPaste: K.DRAFT_GN_PASTE,
    },
  });

  const totalSaved = (kind) => __gmxBankUi.totalSaved(kind);
  const remainingSlots = (kind) => __gmxBankUi.remainingSlots(kind);
  const trimKindToCap = (kind) => __gmxBankUi.trimKindToCap(kind);
  const renderList = (kind) => __gmxBankUi.renderList(kind);
  const updateSavedUI = (kind) => __gmxBankUi.updateSavedUI(kind);
  const setView = (kind, scope) => __gmxBankUi.setView(kind, scope);
  const addLine = (kind) => __gmxBankUi.addLine(kind);
  const clearView = (kind) => __gmxBankUi.clearView(kind);
  const clearAll = (kind) => __gmxBankUi.clearAll(kind);
  const copyAll = (kind) => __gmxBankUi.copyAll(kind);
  const exportAll = (kind) => __gmxBankUi.exportAll(kind);
  const saveDraft = (kind) => __gmxBankUi.saveDraft(kind);
  const restoreDrafts = () => __gmxBankUi.restoreDrafts();
  const commitNewLine = (kind) => __gmxBankUi.commitNewLine(kind);
  const addPasted = (kind) => __gmxBankUi.addPasted(kind);

  if (!window.__GMXBestPickFactory) throw new Error("GMX bestpick factory missing");
  __gmxBestPick = window.__GMXBestPickFactory({
    $,
    api,
    requireConnected,
    readGenParams,
    getAntiStrength,
    activeKey,
    readKey,
    writeKey,
    dedupeLines,
    remainingSlots,
    pushRecent,
    repeatKey,
    renderList,
    refreshUsage,
    setBusy,
    toast,
    t,
    escapeHtml,
    gen: __gmxGen,
  });

  function escapeHtml(s){ return __gmxFmt.escapeHtml(s); }

  function isNetworkishErrorMessage(msg){ return __gmxFmt.isNetworkishErrorMessage(msg); }

  function friendlyUiErrorMessage(msg, opts){ return __gmxFmt.friendlyUiErrorMessage(msg, opts); }

  if (!window.__GMXCleanFillRunFactory) throw new Error("GMX cleanfillrun factory missing");
  const __gmxCfr = window.__GMXCleanFillRunFactory({
    $,
    api,
    escapeHtml: (s) => __gmxFmt.escapeHtml(s),
    getCleanFillStrength: () => __gmxCf.CLEAN_FILL_STRENGTH,
    readGenParams,
    activeKey,
    readKey,
    writeKey,
    remainingSlots,
    normalizeLine: (s) => __gmxGen.normalizeLine(s),
    repeatKey: (s, strength) => __gmxGen.repeatKey(s, strength),
    dedupeLinesByShape: (lines, strength) => __gmxGen.dedupeLinesByShape(lines, strength),
    yieldToUiFrame: () => __gmxUi.yieldToUiFrame(),
    pushRecent: (kind, keys) => __gmxAnti.pushRecent(kind, keys),
    renderList,
    getHandle,
    tab,
  });

  function oneClickCleanup(kind, opts) {
    return __gmxCfr.oneClickCleanup(kind, opts);
  }
  function refillCleanFill(kind, targetCount, opts) {
    return __gmxCfr.refillCleanFill(kind, targetCount, opts);
  }
  function cleanupKeyLines(lines) {
    return __gmxCfr.cleanupKeyLines(lines);
  }

  function pushRecent(kind, keys) {
    return __gmxAnti.pushRecent(kind, keys);
  }
  function repeatKey(s, strength) {
    return __gmxGen.repeatKey(s, strength);
  }
  function filterAntiRepeat(kind, key, lines) {
    return __gmxAnti.filterLines(kind, key, lines, getAntiStrength(kind));
  }
  function normalizeLine(s) {
    return __gmxGen.normalizeLine(s);
  }
  function dedupeLines(lines) {
    return __gmxGen.dedupeLines(lines);
  }

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

  if (!window.__GMXSiteInitFactory) throw new Error("GMX siteinit factory missing");
  await window.__GMXSiteInitFactory({
    setBestMode,
    setCleanFillEnabled,
    bootstrapSiteLangUi: () => __gmxSiteLangMenu.bootstrapSiteLangUi(),
    applyLang,
    syncBestModeUi,
    syncCleanFillUi,
    pruneLegacyAdminPanels,
    wireI18nObserver: () => __gmxSiteLangMenu.wireI18nObserver(),
    updateLangFlags,
    wireSiteLangSelectChange: (sel) => __gmxSiteLangMenu.wireSiteLangSelectChange(sel),
    fillReplyLangSelects: () => __gmxSiteLangMenu.fillReplyLangSelects(),
    fillStyles,
    wireStyleSelectors: () => __gmxStyles.wireStyleSelectors(),
    fillPacks,
    applyTheme,
    renderThemes,
    applyUserBg,
    initWallpapers,
    renderLangChips,
    getThemeKey: () => localStorage.getItem("gmx_theme") || "classic",
    getProToolsNote: () =>
      (I18N[localStorage.getItem(LS_SITE_LANG) || "en"]?.pro_tools_note) ||
      (I18N.en?.pro_tools_note) ||
      "Pro-only tools.",
    gmGnWireCtx: {
      $,
      requireConnected,
      setView,
      generate,
      trackEvent,
      getBestMode,
      setBestMode,
      getCleanFillEnabled,
      setCleanFillEnabled,
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
      getReplyLangs: () => REPLY_LANGS,
      lsGet: (k, d) => __gmxSt.lsGet(k, d),
      lsSet: (k, v) => { try { __gmxSt.lsSet(k, v); } catch {} },
      lsGmReplyLang: LS_GM_REPLY_LANG,
      lsGnReplyLang: LS_GN_REPLY_LANG,
      persistStyle: (kind, style) => { try { __gmxGp.persistStyle(kind, style); } catch {} },
      lsKeyPack: (kind) => __gmxSt.lsKeyPack(kind),
      getGmView: () => __gmxBankUi.getGmView(),
      getGnView: () => __gmxBankUi.getGnView(),
      ensureIndexed,
      renderLangChips,
      updateLangFlags,
    },
    wallpaperUploadCtx: {
      $,
      requireConnected,
      compressImageToJpegDataURL,
      customUploadId: CUSTOM_UPLOAD_ID,
      lsSet: (k, v) => { try { __gmxSt.lsSet(k, v); } catch {} },
      customBgGlobalKey: LS_CUSTOM_BG_GLOBAL,
      wpGlobalKey: LS_WP_GLOBAL,
      setWallpaperForTab,
      renderWallpaperUI,
      currentTabName,
      applyWallpaper,
      applyUserBg,
      toast,
      t,
    },
    proControlsCtx: {
      $,
      isPro,
      escapeHtml,
      storage: __gmxSt,
      packsForKind,
      unlockedPacksCountFor,
      applyPackDefaultsToUi,
      logEvent,
      readKey,
      writeKey,
      getBankKey,
      allKeysForKind,
      allLegacyKeysForKind,
      getHandle,
      dedupeLines,
      normalizeLine,
      cleanupKeyLines,
      setLangIndex,
      getBankMigrationKey,
      trimKindToCap,
      themeKey: "gmx_theme",
      customBgKey: LS_CUSTOM_BG_GLOBAL,
      gmReplyLangKey: LS_GM_REPLY_LANG,
      gnReplyLangKey: LS_GN_REPLY_LANG,
      onAfterImport: () => {
        applyTheme(localStorage.getItem("gmx_theme") || "classic");
        applyUserBg();
        initWallpapers();
        renderThemes();
        fillStyles();
        try { __gmxStyles.wireStyleSelectors(); } catch {}
        fillPacks();
        renderLangChips("gm");
        renderLangChips("gn");
        renderList("gm");
        renderList("gn");
      },
    },
    siteModeCtx: {
      $,
      siteModeKey: K.SITE_MODE,
      lsGet: (k, d) => __gmxSt.lsGet(k, d),
      lsSet: (k, v) => { try { __gmxSt.lsSet(k, v); } catch {} },
    },
    testHarness: {
      activeKey,
      writeKey,
      readKey,
      renderList,
      oneClickCleanup,
      refillCleanFill,
      getHandle,
      setCleanFillEnabled,
      getCleanFillEnabled,
      normalizeLine,
      dedupeLines,
    },
    siteBootCtx: {
      $,
      getHandle,
      getToken,
      setAuthOk: (v) => { AUTH_OK = !!v; },
      setInitDone: (v) => { INIT_DONE = !!v; },
      applyAdminVisibility,
      applyLang,
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
      setCurrentTab: (n) => __gmxTabState.setCurrentTab(n),
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
      renderList,
      initProTabs,
      lsGet: (k, d) => __gmxSt.lsGet(k, d),
      lastTabKey: LS_LAST_TAB,
      extViewKey: LS_EXT_VIEW,
    },
    recoverCtx: {
      toast,
      setDegraded,
      lsGet: (k, d) => __gmxSt.lsGet(k, d),
      lsSet: (k, v) => { try { __gmxSt.lsSet(k, v); } catch {} },
    },
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
