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
const ASSET_REV = "20260617j";

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

  __gmxChrome.wireDegradedBar();

  let INIT_DONE = false;
  const esc = (s)=>__gmxFmt.escapeHtml(s);

  if (!window.__GMXShellErrorsFactory) throw new Error("GMX shellerrors factory missing");
  const __gmxShellErrors = window.__GMXShellErrorsFactory({
    toast,
    setDegraded,
    showFatal,
    escapeHtml: esc,
    isInitDone: () => INIT_DONE,
  });
  __gmxShellErrors.wireGlobalErrors();

  function setBg(tab){ return __gmxSetBg.setBg(tab); }

  function ensurePredictionTabVisible(){ return __gmxNav.ensurePredictionTabVisible(); }

  function showTab(name){ return __gmxNav.showTab(name); }

// Simple info modal (shared shell layer)
  function showInfoModal(title, html){
    return __gmxModals.showInfoModal(title, html);
  }

  if (!window.__GMXTabWireFactory) throw new Error("GMX tabwire factory missing");
  const __gmxTabWire = window.__GMXTabWireFactory({
    normalizeTopLevelTab: (n) => normalizeTopLevelTab(n),
    showTab: (n) => showTab(n),
    trackEvent: (type, meta) => { try { trackEvent(type, meta); } catch {} },
    ensurePredictionTabVisible: () => ensurePredictionTabVisible(),
  });
  function tab(name){ return __gmxTabWire.tab(name); }
  __gmxTabWire.wireTabButtons();

  __gmxChrome.wireFatalBar({
    onGoHome: () => { try { hideFatal(); tab("home"); } catch { location.href = "/"; } },
  });

  if (!window.__GMXAuthWireFactory) throw new Error("GMX authwire factory missing");
  const __gmxAuthWire = window.__GMXAuthWireFactory({
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
  function __getGMXAuth(){ return __gmxAuthWire.getAuth(); }
  function normalizeHandle(input){ return __gmxAuthWire.normalizeHandle(input); }
  function getHandle(){ return __gmxAuthWire.getHandle(); }

  function siteLang(){
    try{ return String(localStorage.getItem(LS_SITE_LANG) || "en").toLowerCase(); }catch(_e){ return "en"; }
  }
  function getBestMode(){ return __gmxToggles.getBestMode(); }
  function setBestMode(next, silent){ return __gmxToggles.setBestMode(next, silent); }
  function syncBestModeUi(){ return __gmxToggles.syncBestModeUi(); }

  function abVariant(){ return __gmxPaywall.abVariant(); }
  async function trackEvent(type, meta){
    if (!getToken()){ return; }
    try{
      if (!getHandle()) return;
      await api("/api/event", "POST", { type, meta: meta || {} });
    }catch(_e){}
  }
  function openLimitModal(payload){ return __gmxPaywall.openLimitModal(payload); }
  function closeLimitModal(){ return __gmxPaywall.closeLimitModal(); }
  function bindLimitModal(){ return __gmxPaywall.bindLimitModal(); }
  function setPayState(state, hint){ return __gmxPaywall.setPayState(state, hint); }
  function openPaySuccess(){ return __gmxPaywall.openPaySuccess(); }
  function closePaySuccess(){ return __gmxPaywall.closePaySuccess(); }
  function bindPaySuccess(){ return __gmxPaywall.bindPaySuccess(); }

  function getToken(){ return __gmxAuthWire.getToken(); }
  function isConnected(){ return __gmxAuthWire.isConnected(); }
  function requireConnected(target){ return __gmxAuthWire.requireConnected(target); }
  function isPublicApi(path){ return __gmxAuthWire.isPublicApi(path); }
  async function initSession(force=false){ return await __gmxAuthWire.initSession(force); }
  async function api(path, method="GET", body, opts={}){ return await __gmxAuthWire.api(path, method, body, opts); }

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
function bestLineShape(kind, s){ return __gmxGen.bestLineShape(kind, s); }
function scoreLineForBest(kind, s){ return __gmxGen.scoreLineForBest(kind, s); }

function pickBestLine(kind, lines){
  const lastKey = (kind === "gm") ? "gmx_last_best_gm" : "gmx_last_best_gn";
  const histKey = (kind === "gm") ? "gmx_last_best_shapes_gm" : "gmx_last_best_shapes_gn";
  let recentShapes = [];
  try{ recentShapes = JSON.parse(localStorage.getItem(histKey) || "[]"); }catch{}
  recentShapes = Array.isArray(recentShapes) ? recentShapes.map(x=>String(x||"").trim()).filter(Boolean).slice(-3) : [];
  return __gmxGen.pickBestLine(kind, lines, {
    last: (localStorage.getItem(lastKey) || "").trim(),
    recentShapes,
    onPersist(pick, _nextShape, merged){
      try{
        localStorage.setItem(lastKey, pick);
        localStorage.setItem(histKey, JSON.stringify(merged));
      }catch{}
    }
  });
}

async function doBest(kind){
  const lines = dedupeLines(readKey(activeKey(kind)));
  if (!lines || !lines.length){
    toast("warn", t("toast_nothing_to_copy") || "Nothing to copy", 2500);
    return;
  }
  const best = pickBestLine(kind, lines);
  if (!best){
    toast("warn", t("toast_nothing_to_copy") || "Nothing to copy", 2500);
    return;
  }

  try{ await navigator.clipboard.writeText(best); }catch(_e){}
  toast("ok", `Best copied<br><span class="muted">${escapeHtml(best)}</span>`, 6000);

  try{
    const bestTrim = String(best).trim();
    await new Promise(r=>requestAnimationFrame(r));
    const container = kind==="gm" ? $("gmList") : $("gnList");
    if (container){
      container.querySelectorAll(".lineRow.selected").forEach(r=>r.classList.remove("selected"));
      const rows = Array.from(container.querySelectorAll(".lineRow"));
      const row = rows.find(r => {
        const inp = r.querySelector("input");
        const txt = r.querySelector(".lineText");
        const v = (inp?.value || txt?.textContent || "").trim();
        return v === bestTrim;
      });
      if (row){
        row.classList.add("selected");
        row.classList.add("bestFlash");
        try{ row.scrollIntoView({ behavior:"smooth", block:"center" }); }catch(_e){}
        try{
          const cell = row.querySelector(".lineCell");
          const inp = row.querySelector("input");
          if (cell && !row.classList.contains("editing")) cell.click();
          else if (inp){ inp.focus(); inp.select(); }
        }catch(_e){}
        setTimeout(()=>row.classList.remove("bestFlash"), 1600);
      }
    }
  }catch(_e){}
}
async function doBestServer(kind){
  if (!requireConnected(kind==="gm"?"GM":"GN")) return;

  const modeEl  = kind==="gm" ? $("gmMode") : $("gnMode");
  const styleEl = kind==="gm" ? $("gmStyle") : $("gnStyle");
  const packEl  = kind==="gm" ? $("gmPack") : $("gnPack");
  const msgEl = kind==="gm" ? $("gmMsg") : $("gnMsg");

  const { mode, lang, style, antiN } = readGenParams(kind);
  const keyActive = activeKey(kind);
  const strength = getAntiStrength(kind);

  setBusy(kind, true, "Picking the best reply...");
  try{
    const bulk = await api(`/api/generate-bulk?kind=${kind}&mode=${encodeURIComponent(mode)}&lang=${encodeURIComponent(lang)}&style=${encodeURIComponent(style)}&anti_last_n=${encodeURIComponent(antiN)}&count=5`, "GET", null, { timeoutMs: 30000 });
    const candidates = dedupeLines((bulk && bulk.list) ? bulk.list : []).map(x=>String(x||"").trim()).filter(Boolean);
    if (!candidates.length){
      if (msgEl) msgEl.innerHTML = `<span class="warn">${escapeHtml("No fresh candidates returned")}</span>`;
      return;
    }

    const best = String(pickBestLine(kind, candidates) || "").trim();
    if (!best){
      if (msgEl) msgEl.innerHTML = `<span class="warn">${escapeHtml("Could not choose the best reply")}</span>`;
      return;
    }

    const cur = readKey(keyActive);
    const already = __gmxGen.isLineAlreadySaved(cur, best, strength);
    let saved = false;

    if (!already){
  if (remainingSlots(kind) > 0){
    cur.push(best);
    writeKey(keyActive, cur);
    saved = true;
    pushRecent(kind, [repeatKey(best, Math.max(1, strength))]);
  }
}

    try{ navigator.clipboard.writeText(best); }catch(_e){}
    renderList(kind);
    if (msgEl){
      const head = already
        ? "Best already saved"
        : (saved ? "Best saved" : "Best copied");
      msgEl.innerHTML = `<span class="ok">${escapeHtml(head)}</span> <span class="muted small">${escapeHtml(best)}</span>`;
    }
    try{ await refreshUsage(); }catch(_e){}
  }catch(e){
    const m = (e && e.message) ? e.message : "failed";
    if (msgEl) msgEl.innerHTML = `<span class="bad">${escapeHtml(m)}</span>`;
  } finally {
    setBusy(kind, false);
  }
}


  function allKeysForKind(kind){
    return [getBankKey(kind)];
  }

  function totalSaved(kind){
    let total = 0;
    for (const k of allKeysForKind(kind)){
      total += readKey(k).length;
    }
    return total;
  }

  function totalSlots(kind){
    let total = 0;
    for (const k of allKeysForKind(kind)){
      total += readKey(k).length; // total saved lines
    }
    return total;
  }

  function remainingSlots(kind){
    const cap = saveCap();
    if (cap === Infinity) return Infinity;
    return Math.max(0, cap - totalSaved(kind));
  }

function replaceRandomSavedLine(kind, newLine){
  const key = activeKey(kind);
  const next = normalizeLine(newLine);
  const cur = dedupeLines(readKey(key));
  if (!next || !cur.length) return false;
  if (cur.some((x)=>String(x || "").trim().toLowerCase() === next.toLowerCase())) return false;
  const idx = Math.floor(Math.random() * cur.length);
  cur[idx] = next;
  writeKey(key, cur);
  return true;
}



  function countsByScope(kind){
    const total = readKey(getBankKey(kind)).length;
    return { global: 0, langs: 0, total };
  }

  function updateSavedUI(kind){
    const totalEl = kind==='gm' ? $('gmTotal') : $('gnTotal');
    const capEl = kind==='gm' ? $('gmCap') : $('gnCap');
    if (totalEl) totalEl.textContent = totalSaved(kind);
    if (capEl) capEl.textContent = isPro() ? 'unlimited' : String(SAVE_CAP_FREE);
    const brEl = kind==='gm' ? $('gmSavedBreakdown') : $('gnSavedBreakdown');
    if (brEl){
      brEl.textContent = 'Saved bank: ' + totalSaved(kind);
    }

    try{
      const used = totalSaved(kind);
      LAST_SAVED[kind] = used;
      const cap = SAVE_CAP_FREE;
      const valId = (kind==="gm") ? "gmSavedVal" : "gnSavedVal";
      const fillId = (kind==="gm") ? "gmSavedFill" : "gnSavedFill";
      const v = $(valId);
      const f = $(fillId);
      if (v) v.textContent = isPro() ? `${used}/unlimited` : `${used}/${cap}`;
      if (f) f.style.width = isPro() ? "100%" : (Math.min(100, Math.round((used/cap)*100)) + "%");

      if (!$("help_modal")?.classList.contains("hidden")) renderHelpModal();
    }catch(e){}
  }

  function pruneEmptyLang(kind, lang){
    return;
  }


  function trimKindToCap(kind){
    let removed = 0;
    const key = getBankKey(kind);
    const cur = readKey(key);
    while (cur.length > saveCap()){
      cur.pop();
      removed++;
    }
    writeKey(key, cur);
    return removed;
  }

  let gmView = "saved";
  let gnView = "saved";

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

  function escapeHtml(s){ return __gmxFmt.escapeHtml(s); }

  function isNetworkishErrorMessage(msg){ return __gmxFmt.isNetworkishErrorMessage(msg); }

  function friendlyUiErrorMessage(msg, opts){ return __gmxFmt.friendlyUiErrorMessage(msg, opts); }

  function renderList(kind){
    const container = kind==="gm" ? $("gmList") : $("gnList");
    const countEl = kind==="gm" ? $("gmCount") : $("gnCount");
    const msgEl = kind==="gm" ? $("gmMsg") : $("gnMsg");
    if (!container || !countEl) return;

    const key = activeKey(kind);
const rawLines = readKey(key);
const lines = dedupeLines((rawLines || []).map(normalizeLine).filter(Boolean));
if (lines.join("\n") !== rawLines.join("\n")) writeKey(key, lines);

countEl.textContent = lines.length;
    updateSavedUI(kind);

    container.innerHTML = "";

    if (!getHandle()){
      if (msgEl) msgEl.innerHTML = '<span class="warn">Connect first.</span>';
      return;
    }

    const filterEl = kind==="gm" ? $("gmFilter") : $("gnFilter");
    const q = (filterEl && filterEl.value) ? String(filterEl.value).trim().toLowerCase() : "";
    const items = q
      ? lines.map((val, idx)=>({ idx, val })).filter(x => String(x.val||"").toLowerCase().includes(q))
      : lines.map((val, idx)=>({ idx, val }));

    if (!lines.length){
      if (msgEl) msgEl.textContent = "Saved bank is empty.";
      return;
    }

    if (q && msgEl){
      msgEl.innerHTML = `<span class="muted">Filtered: showing <b>${items.length}</b> / ${lines.length}</span>`;
    }

    if (q && items.length === 0){
      const row = document.createElement("div");
      row.className = "muted";
      row.style.padding = "8px 2px";
      row.textContent = "No matches.";
      container.appendChild(row);
      return;
    }

    // Large saved banks: readable display, edit-on-click (no sea of inputs).
    chunkedRender(container, items, (item, pos)=>{
      const i = item.idx;
      const val = item.val;

      const row = document.createElement("div");
      row.className = "lineRow";
      row.innerHTML = `
        <span class="idx">${pos+1}</span>
        <div class="lineCell" role="button" tabindex="0">
          <span class="lineText">${escapeHtml(val)}</span>
          <input class="lineInput" name="line" aria-label="Saved reply ${pos+1}" value="${escapeHtml(val)}" style="display:none" />
        </div>
        <button class="delBtn" title="Remove" type="button" aria-label="Remove">&times;</button>
      `;
      const cell = row.querySelector(".lineCell");
      const textEl = row.querySelector(".lineText");
      const input = row.querySelector("input");
      const del = row.querySelector("button");

      function commitEdit(){
        const v = input.value.trim();
        if (!v){
          const cur = readKey(key);
          cur.splice(i, 1);
          writeKey(key, cur);
          renderList(kind);
          return;
        }
        const cur = readKey(key);
        cur[i] = v;
        writeKey(key, cur);
        countEl.textContent = cur.length;
        textEl.textContent = v;
        input.style.display = "none";
        textEl.style.display = "";
        row.classList.remove("editing");
      }

      function startEdit(){
        row.classList.add("editing");
        input.value = textEl.textContent;
        input.style.display = "";
        textEl.style.display = "none";
        input.focus();
        input.select();
      }

      cell.addEventListener("click", (e)=>{
        if (e.target === del) return;
        if (!row.classList.contains("editing")) startEdit();
      });
      input.addEventListener("blur", commitEdit);
      input.addEventListener("keydown", (e)=>{
        if (e.key === "Enter"){ e.preventDefault(); commitEdit(); }
        if (e.key === "Escape"){
          e.preventDefault();
          input.value = textEl.textContent;
          input.style.display = "none";
          textEl.style.display = "";
          row.classList.remove("editing");
        }
      });
      input.addEventListener("input", ()=>{
        const v = input.value.trim();
        if (!v) return;
        const cur = readKey(key);
        cur[i] = v;
        writeKey(key, cur);
      });

      del.addEventListener("click", (e)=>{
        e.stopPropagation();
        const cur = readKey(key);
        cur.splice(i, 1);
        writeKey(key, cur);
        renderList(kind);
      });
      return row;
    }, { key: `lineRows_${kind}`, chunk: 26 });
  }

  function setView(kind, scope){
    if (kind==="gm"){
      gmView = "saved";
      const a = $("gmViewGlobal"); if (a) a.classList.remove("active");
      const b = $("gmViewLang");   if (b) b.classList.add("active");
    } else {
      gnView = "saved";
      const a = $("gnViewGlobal"); if (a) a.classList.remove("active");
      const b = $("gnViewLang");   if (b) b.classList.add("active");
    }
    updateLangFlags();
    renderList(kind);
    renderLangChips(kind);
  }

  function addLine(kind){
    if (!requireConnected(kind==="gm"?"GM":"GN")) return;
    const msgEl = kind==="gm" ? $("gmMsg") : $("gnMsg");
    const rem = remainingSlots(kind);
    if (rem <= 0){
      msgEl.innerHTML = `<span class="warn">Free save limit reached (${saveCap()} lines). You can still edit existing lines. Upgrade for more.</span>`;
      try{ openLimitModal({ reason:"save_cap", kind }); }catch{}
      trackEvent("limit_hit", { kind, reason:"save_cap" });
      return;
    }
    const input = kind==="gm" ? $("gmNewLine") : $("gnNewLine");
    if (input){
      input.focus();
      try{ input.scrollIntoView({ block:"center", behavior:"smooth" }); }catch{}
    }
    msgEl.innerHTML = `<span class="muted">Type your line below and click Add.</span>`;
  }


  function clearView(kind){
    if (!requireConnected(kind==="gm"?"GM":"GN")) return;
    try{ if (ABORT[kind]) ABORT[kind].abort(); }catch{}
    const key = activeKey(kind);
    const cur = readKey(key);
    if (cur.length && !confirm("Clear this saved bank? This cannot be undone.")) return;
    writeKey(key, []);
    renderList(kind);
    const msgEl = kind==="gm" ? $("gmMsg") : $("gnMsg");
    if (msgEl) msgEl.innerHTML = `<span class="ok">Saved bank cleared.</span>`;
  }

  function clearAll(kind){
    if (!requireConnected(kind==="gm"?"GM":"GN")) return;
    try{ if (ABORT[kind]) ABORT[kind].abort(); }catch{}
    const total = totalSaved(kind);
    if (total && !confirm("Clear all saved lines in this bank? This cannot be undone.")) return;
    for (const k of Array.from(new Set([...allLegacyKeysForKind(kind), getBankKey(kind)]))) localStorage.removeItem(k);
    setLangIndex(kind, []);
    writeKey(getBankKey(kind), []);
    try{ localStorage.setItem(getBankMigrationKey(kind), "1"); }catch{}
    if (kind==="gm"){
      gmView = "saved";
      const a = $("gmViewGlobal"); if (a) a.classList.remove("active");
      const b = $("gmViewLang");   if (b) b.classList.add("active");
    } else {
      gnView = "saved";
      const a = $("gnViewGlobal"); if (a) a.classList.remove("active");
      const b = $("gnViewLang");   if (b) b.classList.add("active");
    }
    updateLangFlags();
    renderLangChips(kind);
    renderList(kind);
    toast("ok", (t("toast_cleared_all_saved_lines")||"Cleared all saved lines."));
  }

  function formatAllExport(kind){
    const lines = readKey(getBankKey(kind));
    if (!lines.length) return "";
    return lines.join("\n").trim() + "\n";
  }

  async function copyAll(kind){
    if (!requireConnected(kind==="gm"?"GM":"GN")) return;
    const txt = formatAllExport(kind);
    if (!txt){
      toast("warn", (t("toast_nothing_to_copy")||"Nothing to copy."));
      return;
    }
    try{
      await navigator.clipboard.writeText(txt);
      toast("ok", (t("toast_copied")||"Copied."));
    }catch{
      // fallback
      const ta = document.createElement("textarea");
      ta.value = txt;
      document.body.appendChild(ta);
      ta.select();
      try{ document.execCommand("copy"); toast("ok", (t("toast_copied")||"Copied.")); }catch{ toast("bad", (t("toast_copy_failed")||"Copy failed.")); }
      ta.remove();
    }
  }

  function exportAll(kind){
    if (!requireConnected(kind==="gm"?"GM":"GN")) return;
    const txt = formatAllExport(kind);
    if (!txt){
      toast("warn", (t("toast_nothing_to_export")||"Nothing to export."));
      return;
    }
    const blob = new Blob([txt], { type:"text/plain;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    const stamp = new Date().toISOString().slice(0,10);
    a.download = `gmxreply_${kind}_${stamp}.txt`;
    document.body.appendChild(a);
    a.click();
    setTimeout(()=>{ URL.revokeObjectURL(a.href); a.remove(); }, 50);
  }

  const LS_DRAFT_GM_NEW = K.DRAFT_GM_NEW;
  const LS_DRAFT_GN_NEW = K.DRAFT_GN_NEW;
  const LS_DRAFT_GM_PASTE = K.DRAFT_GM_PASTE;
  const LS_DRAFT_GN_PASTE = K.DRAFT_GN_PASTE;

  function saveDraft(kind){
    try{
      if (kind==="gm"){
        const a = $("gmNewLine"); if (a) localStorage.setItem(LS_DRAFT_GM_NEW, a.value || "");
        const p = $("gmPaste"); if (p) localStorage.setItem(LS_DRAFT_GM_PASTE, p.value || "");
      } else {
        const a = $("gnNewLine"); if (a) localStorage.setItem(LS_DRAFT_GN_NEW, a.value || "");
        const p = $("gnPaste"); if (p) localStorage.setItem(LS_DRAFT_GN_PASTE, p.value || "");
      }
    }catch{}
  }

  function restoreDrafts(){
    try{
      const gmNew = $("gmNewLine"); if (gmNew && !gmNew.value) gmNew.value = localStorage.getItem(LS_DRAFT_GM_NEW) || "";
      const gnNew = $("gnNewLine"); if (gnNew && !gnNew.value) gnNew.value = localStorage.getItem(LS_DRAFT_GN_NEW) || "";
      const gmP = $("gmPaste"); if (gmP && !gmP.value) gmP.value = localStorage.getItem(LS_DRAFT_GM_PASTE) || "";
      const gnP = $("gnPaste"); if (gnP && !gnP.value) gnP.value = localStorage.getItem(LS_DRAFT_GN_PASTE) || "";
    }catch{}
  }

  function clearDraft(kind){
    try{
      if (kind==="gm"){
        localStorage.removeItem(LS_DRAFT_GM_NEW);
        localStorage.removeItem(LS_DRAFT_GM_PASTE);
      } else {
        localStorage.removeItem(LS_DRAFT_GN_NEW);
        localStorage.removeItem(LS_DRAFT_GN_PASTE);
      }
    }catch{}
  }

  function commitNewLine(kind){
    if (!requireConnected(kind==="gm"?"GM":"GN")) return;
    const input = kind==="gm" ? $("gmNewLine") : $("gnNewLine");
    const msgEl = kind==="gm" ? $("gmMsg") : $("gnMsg");
    if (!input) return;

    const v = input.value.trim();
    if (!v){
      if (msgEl) msgEl.innerHTML = `<span class="muted">Type something first.</span>`;
      return;
    }

    if ((kind==="gm" ? gmView : gnView) === "lang"){
      ensureIndexed(kind, currentLang(kind));
    }

    const rem = remainingSlots(kind);
    if (rem <= 0){
      if (msgEl) msgEl.innerHTML = `<span class="warn">Free save limit reached (${saveCap()} lines). You can still edit existing lines. Upgrade for more.</span>`;
      return;
    }

    const key = activeKey(kind);
    const cur = readKey(key);
    const exists = cur.some(s => String(s||"").trim().toLowerCase() === v.toLowerCase());
    if (exists){
      if (msgEl) msgEl.innerHTML = `<span class="muted">Already saved (duplicate ignored).</span>`;
      return;
    }
    cur.push(v);
    writeKey(key, cur);

    input.value = "";
    clearDraft(kind);
    renderList(kind);

    if (msgEl) msgEl.innerHTML = `<span class="ok">Added 1</span>`;
  }



  function addPasted(kind){
    if (!requireConnected(kind==="gm"?"GM":"GN")) return;

    const box = kind==="gm" ? $("gmPaste") : $("gnPaste");
    const msgEl = kind==="gm" ? $("gmMsg") : $("gnMsg");
    if (!box) return;

    const pastedAll = linesFromText(box.value);
    if (!pastedAll.length) return;

    const rem = remainingSlots(kind);
    if (rem <= 0){
      if (msgEl) msgEl.innerHTML = `<span class="warn">Free save limit reached (${saveCap()}). You can still edit existing lines. Upgrade for more.</span>`;
      return;
    }

    const pasted = (rem === Infinity) ? pastedAll : pastedAll.slice(0, rem);

    const key = activeKey(kind);
    const before = readKey(key);
    const combined = before.concat(pasted);
    const after = dedupeLines(combined);

    writeKey(key, after);
    box.value = "";
    clearDraft(kind);
    renderList(kind);

    const added = Math.max(0, after.length - before.length);
    const skippedDup = pasted.length - added;

    if (msgEl){
      if (pasted.length < pastedAll.length){
        msgEl.innerHTML = `<span class="warn">Added ${added}/${pastedAll.length} (cap reached)</span>`;
      } else if (skippedDup > 0){
        msgEl.innerHTML = `<span class="ok">Added ${added}</span> <span class="muted small">(skipped ${skippedDup} duplicates)</span>`;
      } else {
        msgEl.innerHTML = `<span class="ok">Added ${added}</span>`;
      }
    }
  }
  // Keep existing order, append only truly-new unique lines.
  // Important: duplicates MUST NOT be moved to the top.

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
async function generate(kind, count){
    if (!requireConnected(kind==="gm"?"GM":"GN")) return;
    const msgElEarly = kind==="gm" ? $("gmMsg") : $("gnMsg");
    if (!getToken() && getHandle()){
      try{ await initSession(true); }catch(_e){}
    }
    if (!getToken()){
      if (msgElEarly) msgElEarly.innerHTML = `<span class="warn">${escapeHtml(siteTr("gen_session_expired", "Session expired — reconnect your @handle, then retry."))}</span>`;
      return;
    }
    const h = getHandle();

    const packEl  = kind==="gm" ? $("gmPack") : $("gnPack");
    const packId = packEl ? (packEl.value || "classic") : "classic";
    const { mode, lang, style, antiN } = readGenParams(kind);

    const msgEl = kind==="gm" ? $("gmMsg") : $("gnMsg");

    const strength = getAntiStrength(kind);
    const autoClean = (count <= 1) ? getCleanFillEnabled(kind) : false;

    if ((kind==="gm" ? gmView : gnView) === "lang") ensureIndexed(kind, lang);

    const keyActive = activeKey(kind);
    const keyGlobal = getGlobalKey(kind);
    const beforeCount = readKey(keyActive).length;

    // Respect save cap (70) for Free. Editing remains unlimited.
    const remSlots = remainingSlots(kind);
    const effCount = (remSlots === Infinity) ? count : Math.max(0, Math.min(count, remSlots));
    
if (effCount <= 0){
  if (msgEl) msgEl.innerHTML = `<span class="warn">Free save limit reached (${saveCap()}). You can still copy lines, but no saved line will be replaced automatically.</span>`;
  postEvent('limit_hit', { where:'save_cap', kind });
  renderList(kind);
  return;
}

      if (INFLIGHT[kind]){
      if (msgEl) msgEl.innerHTML = '<span class="muted">Working...</span>';
      return;
    }
    INFLIGHT[kind] = true;
    try{ window.__i18nPause = true; }catch{}
    setBusy(kind, true, count > 1 ? `Adding ${effCount}…` : "Working...");
    try{ if (ABORT[kind]) ABORT[kind].abort(); }catch{}
    const ctrl = new AbortController();
    ABORT[kind] = ctrl;

    let didRender = false;
    try{
      if (count === 1){
        const tries = Math.max(1, Math.min(4, 1 + Math.floor(strength/2)));
        let reply = null;

        for (let t=0; t<tries; t++){
          const j = await api(`/api/generate?kind=${kind}&mode=${encodeURIComponent(mode)}&lang=${encodeURIComponent(lang)}&style=${encodeURIComponent(style)}&anti_last_n=${encodeURIComponent(antiN)}`, "GET", null, { signal: ctrl.signal, timeoutMs: 20000 });
          const candidate = j.reply || "";
          const filtered = filterAntiRepeat(kind, keyActive, [candidate]);
          if (filtered.length){
            reply = filtered[0];
            break;
          }
        }

        if (!reply){
          // fallback: take one even if it repeats
          const j = await api(`/api/generate?kind=${kind}&mode=${encodeURIComponent(mode)}&lang=${encodeURIComponent(lang)}&style=${encodeURIComponent(style)}&anti_last_n=${encodeURIComponent(antiN)}`, "GET", null, { signal: ctrl.signal, timeoutMs: 20000 });
          reply = j.reply || "";
        }

        if (!String(reply || "").trim()){
          if (msgEl) msgEl.innerHTML = `<span class="warn">${escapeHtml(t("gen_empty_reply") || "Server returned an empty line. Try another tone or preset.")}</span>`;
          return;
        }

        const cur = readKey(keyActive);
        const r = String(reply||"").trim();
        if (__gmxGen.isLineAlreadySaved(cur, r, strength)){
          renderList(kind);
          didRender = true;
          if (msgEl) msgEl.innerHTML = `<span class="muted">Duplicate ignored.</span>`;
          return;
        }
        if (remainingSlots(kind) <= 0){
  if (msgEl) msgEl.innerHTML = `<span class="warn">Free save limit reached (${saveCap()} lines). You can still copy lines, but no saved line will be replaced automatically.</span>`;
  postEvent('limit_hit', { where:'save_cap', kind });
  renderList(kind);
  return;
}
        cur.push(r);
        writeKey(keyActive, cur);

        pushRecent(kind, [repeatKey(reply, Math.max(1, strength))]);
        if (!autoClean){
          renderList(kind);
          didRender = true;
        }
        msgEl.innerHTML = `<span class="ok">Added 1</span>`;
        logEvent("gen_one", { kind, lang, style, pack: packId, view: (kind==="gm"?gmView:gnView) });
        try{ await refreshUsage(); }catch{}
      } else {
        // Bulk generate as loose random fill first. Best pass is an optional second pass.
        const accepted = [];
        const takeLines = (arr)=>{
          const chunk = __gmxGen.collectBulkUniqueLines([...readKey(keyActive), ...accepted], arr, effCount - accepted.length);
          if (chunk.length) accepted.push(...chunk);
        };

        const buffer = 12;
        const genDeadline = Date.now() + 22000;
        let attempts = 0;
        while (accepted.length < effCount && attempts < 4){
          if (Date.now() > genDeadline) break;
          attempts++;
          const missing = effCount - accepted.length;
          const reqCount = Math.min(48, missing + buffer);
          const bulk = await api(`/api/generate-bulk?kind=${kind}&mode=${encodeURIComponent(mode)}&lang=${encodeURIComponent(lang)}&style=${encodeURIComponent(style)}&anti_last_n=${encodeURIComponent(antiN)}&count=${reqCount}`, "GET", null, { signal: ctrl.signal, timeoutMs: 15000 })
          await yieldToUiFrame();;
          takeLines(bulk.list || []);
          if (!Array.isArray(bulk.list) || bulk.list.length === 0) break;
        }

        const incoming = accepted.slice();
        const preferBest = autoClean || getBestMode();
        let selected = [];
        if (preferBest){
          selected = __gmxGen.selectBestByShape(kind, incoming, Math.max(1, strength)).slice(0, effCount);
        } else {
          selected = incoming.slice(0, effCount).sort(()=>Math.random()-0.5);
        }

        const applyToKey = (k, list)=>{
          if (!list || !list.length) return;
          const cur = readKey(k);
          const merged = mergeAppendUnique(cur, list);
          writeKey(k, merged);
        };
        applyToKey(keyActive, selected);
        pushRecent(kind, selected.map(x=>repeatKey(x, Math.max(1, CLEAN_FILL_STRENGTH))));
        renderList(kind);

        let added = Math.max(0, readKey(keyActive).length - beforeCount);
        let cleanRes = null;
        if (autoClean){
          const targetTotal = (remSlots === Infinity) ? (beforeCount + effCount) : Math.min(saveCap(), beforeCount + effCount);
          cleanRes = await oneClickCleanup(kind, { targetCount: targetTotal, silent: true, keepMessage: true, signal: ctrl.signal });
          renderList(kind);
          didRender = true;
          added = Math.max(0, (cleanRes?.finalCount ?? readKey(keyActive).length) - beforeCount);
        }

        if (autoClean && cleanRes){
          if (cleanRes.finalCount >= cleanRes.targetCount){
            msgEl.innerHTML = `<span class="ok">Added ${added}</span> <span class="muted small">(Best pass removed ${cleanRes.removed}, refilled ${cleanRes.refilled})</span>`;
          } else {
            msgEl.innerHTML = `<span class="warn">Added ${added}. Best pass removed ${cleanRes.removed}, refilled ${cleanRes.refilled}, final ${cleanRes.finalCount}/${cleanRes.targetCount}. Try another tone or preset for a wider pool.</span>`;
          }
        } else if (added < effCount){
          msgEl.innerHTML = `<span class="warn">Added ${added}/${effCount}. Random fill stopped early because the pool got too narrow. Change tone or preset for a wider pull.</span>`;
        } else {
          msgEl.innerHTML = `<span class="ok">Added ${added}</span> <span class="muted small">Run Best pass manually if you want cleanup/refill.</span>`;
        }
        logEvent("gen_bulk", { kind, lang, style, pack: packId, count: effCount, view: (kind==="gm"?gmView:gnView), cleanFill: autoClean });
        try{ await refreshUsage(); }catch{}
      }
    } catch(e){
      const m = (e && e.message) ? e.message : "failed";
      const friendly = friendlyUiErrorMessage(m, { scope:"generate" });
      if (msgEl) msgEl.innerHTML = `<span class="bad">${escapeHtml(friendly)}</span>`;
      try{ toast("bad", `<b>Generate failed:</b> ${escapeHtml(friendly)}`); }catch(_e){}
      logEvent("gen_error", { kind, err: m, friendly });
    } finally {
      INFLIGHT[kind] = false;
      try{ window.__i18nPause = false; }catch{}
      try{ ABORT[kind] = null; }catch{}
      setBusy(kind, false);
      if (!didRender){
        try{ renderList(kind); }catch{}
      }
    }
  }

  

let REF_STATS_CACHE = null;
let REF_STATS_LAST_AT = 0;
let REF_STATS_PROMISE = null;
let REF_STATS_TIMER = null;
let REF_STATS_SCHEDULED_AT = 0;

function revealReferralLinkUi(){
  try{ $("refTopRow")?.classList.remove("link-hidden"); }catch(e){}
  try{ $("refLinkCol")?.classList.remove("is-hidden"); }catch(e){}
}

function scheduleRefStatsRefresh(delay=180){
  const now = Date.now();
  if (REF_STATS_PROMISE) return;
  if (REF_STATS_CACHE && (now - REF_STATS_LAST_AT) < 8000) return;
  if (REF_STATS_TIMER && (now - REF_STATS_SCHEDULED_AT) < 900) return;
  try{ if (REF_STATS_TIMER) clearTimeout(REF_STATS_TIMER); }catch(e){}
  REF_STATS_SCHEDULED_AT = now;
  REF_STATS_TIMER = setTimeout(()=>{
    REF_STATS_TIMER = null;
    Promise.resolve().then(()=>refreshRefStats()).catch(()=>{});
  }, Math.max(160, Number(delay)||220));
}

async function refreshRefStats(force=false){
  if (!getHandle()) return null;
  const now = Date.now();
  if (!force){
    if (REF_STATS_PROMISE) return REF_STATS_PROMISE;
    if (REF_STATS_CACHE && (now - REF_STATS_LAST_AT) < 8000) return REF_STATS_CACHE;
  }
  REF_STATS_PROMISE = (async ()=>{
    try{
      const j = await api("/api/referral/stats");
    const confirmed = Number(j.confirmedRefs ?? 0) || 0;
    const active = Number(j.activeRefs ?? 0) || 0;
    const eligible = Number(j.eligibleRefs ?? j.referrals ?? j.count ?? 0) || 0;
    const legacy = Number(j.legacyReferrals ?? 0) || 0;
    const lang = localStorage.getItem(LS_SITE_LANG) || "en";
    try{ renderReferralRightCopy(lang); }catch{}
    try{ renderGuideRightCopy(lang); }catch{}

    applyRefCountEligible(eligible);

    if ($("refConfirmedInline")) $("refConfirmedInline").textContent = String(confirmed);
    if ($("refActiveInline")) $("refActiveInline").textContent = String(active);
    const link = $("refLink");
    if (link) link.value = j.refLink || "";
    revealReferralLinkUi();

    // promoter metrics
    const clicks = Number(j.clicks ?? 0) || 0;
    if ($("promoConfirmed")) $("promoConfirmed").textContent = String(confirmed);
    if ($("promoActive")) $("promoActive").textContent = String(active);
    if ($("promoEligible")) $("promoEligible").textContent = String(eligible);
    if ($("promoLegacy")) $("promoLegacy").textContent = String(legacy);
    if ($("promoClicks")) $("promoClicks").textContent = String(clicks);
    if ($("promoDailyLimit")) $("promoDailyLimit").textContent = String(Number(j.dailyLimit ?? (Number(j.freeDaily||0)+Number(j.dailyBonus||0))) || 0);
    if ($("promoBonusPer20")) $("promoBonusPer20").textContent = String(Number(j.bonusPer20||10)||10);
    if ($("promoNextAt")) $("promoNextAt").textContent = String(Number(j.nextBonusAt||20)||20);

    const promoNote = $("refPromoNote");
    if (promoNote){
      try{ renderReferralPromoNote(j, confirmed, active, eligible); }catch{}
    }
    const nextStep = nextReferralUnlockAt(eligible);
    const wrap = $("refProgressWrap");
    const nextEl = $("refProgressNext");
    const fillEl = $("refProgressFill");
    if (wrap && nextEl && fillEl){
      if (nextStep > 0){
        wrap.classList.remove("hidden");
        nextEl.textContent = String(nextStep);
        const pct = Math.min(100, Math.round((eligible / nextStep) * 100));
        fillEl.style.width = pct + "%";
      } else {
        wrap.classList.add("hidden");
      }
    }

    const promoDetails = $("promoDetails");
    if (promoDetails){
      // Do not auto-collapse this panel after stats refresh.
      // User controls the fold state manually and we restore the saved preference only.
      try{
        const saved = localStorage.getItem(LS_REF_PROMO_OPEN);
        if (saved === "1") promoDetails.open = true;
        else if (saved === "0") promoDetails.open = false;
      }catch{}
    }

    // re-render unlock-dependent UI
    try{ renderThemes(); }catch(e){}
    try{ renderExtThemes(); }catch(e){}
    try{ fillStyles(); }catch(e){}
    try{ fillPacks(); }catch(e){}
    REF_STATS_CACHE = j;
    REF_STATS_LAST_AT = Date.now();
    return j;
  }catch(e){
    return REF_STATS_CACHE || null;
  }finally{
    REF_STATS_PROMISE = null;
  }
  })();
  return REF_STATS_PROMISE;
}

// ----- Leaderboard -----
let LB_DAYS = 7;
async function loadLeaderboard(days){
  try{
    LB_DAYS = Number(days||7) || 7;
    const st = $("lb_status");

    st.textContent = "";
    const body = $("lb_body");
    if (body) body.innerHTML = `<tr><td colspan="4" class="muted">${escapeHtml(t('loading')||'Loading...')}</td></tr>`;

    // If user is connected, include token (shows "me" rank).
    const opts = {};
    const token = getToken();
    if (token) opts.headers = { Authorization: "Bearer " + token };
    const r = await fetch(`/api/leaderboard/referrals?days=${encodeURIComponent(LB_DAYS)}`, { cache:"no-store", ...opts });
    const j = await r.json().catch(()=>null);
    if (!r.ok || !j || !j.ok) throw new Error(j?.error || `http_${r.status}`);

    const top = Array.isArray(j.top) ? j.top : [];
    if (body){
      if (!top.length){
        body.innerHTML = `<tr><td colspan="4" class="muted">${escapeHtml(t('lb_empty')||'No data yet.')}</td></tr>`;
      } else {
        body.innerHTML = top.map((row, idx)=>{
          const h = escHtml(String(row.handle||""));
          const eligible = Number(row.eligible||0)||0;
          const active = Number(row.active||0)||0;
          return `<tr><td>${idx+1}</td><td>@${h}</td><td>${eligible}</td><td>${active}</td></tr>`;
        }).join("");
      }
    }

    const you = $("lb_you");
    if (you){
      const me = j.me;
      if (me && me.handle){
        const h = escHtml(String(me.handle||""));
        const eligible = Number(me.eligible||0)||0;
        // rank in top list, else show ">50"
        const idx = top.findIndex(r=>String(r.handle||"")===String(me.handle||""));
        const rank = idx >= 0 ? String(idx+1) : ">50";
        you.innerHTML = `${escapeHtml(t('lb_you')||'You')}: <b>#${rank}</b> @${h} В· ${escapeHtml(t('lb_eligible')||'Eligible')}: <b>${eligible}</b>`;
      } else {
        you.textContent = getHandle() ? "" : (t('connectFirst') || "Connect first.");
      }
    }

    if (st) st.textContent = `${LB_DAYS}d`;
    return j;
  }catch(e){
    const st = $("lb_status");
    if (st) st.textContent = (t('error')||'Error') + ": " + String(e?.message||e||'failed');
    const body = $("lb_body");
    if (body) body.innerHTML = `<tr><td colspan="4" class="muted">${escapeHtml(t('lb_failed')||'Could not load leaderboard.')}</td></tr>`;
    return null;
  }
}

function bindLeaderboardUI(){
  if (bindLeaderboardUI._done) return;
  bindLeaderboardUI._done = true;
  const b7 = $("lb_7d");
  const b30 = $("lb_30d");
  const set = (d)=>{
    if (b7) b7.classList.toggle("active", d===7);
    if (b30) b30.classList.toggle("active", d===30);
    loadLeaderboard(d);
  };
  if (b7) b7.addEventListener("click", ()=>set(7));
  if (b30) b30.addEventListener("click", ()=>set(30));
}

// ----- Prediction market -----
let PM_LAST_JSON = "";
const PM_FILTERS = { asset: "all", bias: "all", minConf: 0 };
let PM_LAST_SIGNALS = [];
let PM_LAST_HEADLINE = null;
function syncPredictionFilterCopy(){
  const bias = $("pm_bias");
  if (bias) {
    const cur = String(bias.value || "all");
    bias.innerHTML = [
      `<option value="all">${escapeHtml(t("all") || "All")}</option>`,
      `<option value="bullish">${escapeHtml(t("bullish") || "Bullish")}</option>`,
      `<option value="bearish">${escapeHtml(t("bearish") || "Bearish")}</option>`,
      `<option value="neutral">${escapeHtml(t("neutral") || "Neutral")}</option>`
    ].join("");
    bias.value = ["all","bullish","bearish","neutral"].includes(cur) ? cur : "all";
  }
  const conf = $("pm_conf");
  if (conf) {
    const cur = String(conf.value || "0");
    conf.innerHTML = [
      `<option value="0">${escapeHtml(t("any") || "Any")}</option>`,
      `<option value="60">60%+</option>`,
      `<option value="70">70%+</option>`,
      `<option value="80">80%+</option>`
    ].join("");
    conf.value = ["0","60","70","80"].includes(cur) ? cur : "0";
  }
}
function fillPredictionAssetFilter(list){
  const sel = $("pm_asset");
  if (!sel) return;
  const prev = String(sel.value || PM_FILTERS.asset || "all");
  const symbols = Array.from(new Set((Array.isArray(list) ? list : []).map((x)=>String(x?.symbol||"").trim()).filter(Boolean))).sort();
  sel.innerHTML = `<option value="all">${escapeHtml(t("all") || "All")}</option>` + symbols.map((s)=>`<option value="${escapeHtml(s)}">${escapeHtml(s)}</option>`).join("");
  sel.value = symbols.includes(prev) ? prev : "all";
  PM_FILTERS.asset = sel.value;
}
function filteredPredictionSignals(list){
  const rows = Array.isArray(list) ? list : [];
  return rows.filter((row)=>{
    const symbol = String(row?.symbol || "").trim();
    const bias = String(row?.bias || "neutral").toLowerCase();
    const conf = Number(row?.confidence || 0);
    if (PM_FILTERS.asset !== "all" && symbol !== PM_FILTERS.asset) return false;
    if (PM_FILTERS.bias !== "all" && bias !== PM_FILTERS.bias) return false;
    if (conf < Number(PM_FILTERS.minConf || 0)) return false;
    return true;
  });
}
function renderPredictionSignals(list){
  const host = $("pmList");
  if (!host) return;
  const rows = filteredPredictionSignals(list);
  if (!rows.length){
    const h = PM_LAST_HEADLINE && typeof PM_LAST_HEADLINE === "object" ? PM_LAST_HEADLINE : null;
    if (h){
      const title = escapeHtml(String(h.title || "Bot signal coming soon"));
      const source = escapeHtml(String(h.source || "Polymarket"));
      const confidence = Number(h.confidencePct || 90);
      const cadence = escapeHtml(String(h.cadence || "3-5 signals per day"));
      const thesis = escapeHtml(String(h.thesis || "Signals are generated by a bot and can be wrong."));
      host.classList.add("pmList");
      host.innerHTML = `
        <div class="lineRow pmSignalRow">
          <div class="split pmSignalHead">
            <div class="pmSymbolWrap"><b class="pmSymbol">${title}</b> <span class="badge pmBiasNeutral">${escapeHtml("coming soon")}</span></div>
            <div class="muted">${source} · ${escapeHtml(String(confidence))}% target</div>
          </div>
          <div class="pmConfTrack"><div class="pmConfFill" style="width:${Math.max(0, Math.min(100, confidence))}%"></div></div>
          <div class="small pmThesis">${cadence}</div>
          <div class="muted small pmRisk">${thesis}</div>
        </div>
      `;
      return;
    }
    host.innerHTML = `<div class="muted">${escapeHtml(t("pm_empty") || "Coming soon. First live bot signal drops soon.")}</div>`;
    return;
  }
  host.classList.add("pmList");
  host.innerHTML = rows.map((row)=>{
    const symbol = escapeHtml(String(row.symbol || "PAIR").toUpperCase());
    const bias = String(row.bias || "neutral").toLowerCase();
    const move = Number(row.changePct || 0);
    const moveLabel = `${move > 0 ? "+" : ""}${move.toFixed(2)}%`;
    const confidence = Number(row.confidence || 0);
    const thesis = escapeHtml(String(row.thesis || ""));
    const risk = escapeHtml(String(row.risk || ""));
    const biasClass = bias === "bullish" ? "pmBiasBull" : (bias === "bearish" ? "pmBiasBear" : "pmBiasNeutral");
    const confPct = Math.max(0, Math.min(100, confidence));
    const moveClass = move >= 0 ? "pmMoveUp" : "pmMoveDown";
    return `
      <div class="lineRow pmSignalRow">
        <div class="split pmSignalHead">
          <div class="pmSymbolWrap"><b class="pmSymbol">${symbol}</b> <span class="badge ${biasClass}">${escapeHtml(bias)}</span></div>
          <div class="muted"><span class="${moveClass}">${escapeHtml(moveLabel)}</span> · ${escapeHtml(String(confidence))}% conf</div>
        </div>
        <div class="pmConfTrack"><div class="pmConfFill" style="width:${confPct}%"></div></div>
        <div class="small pmThesis">${thesis}</div>
        <div class="muted small pmRisk">${risk}</div>
      </div>
    `;
  }).join("");
}
async function loadPredictionSignals(opts){
  const force = !!(opts && opts.force);
  const status = $("pm_status");
  const locked = $("pm_locked_note");
  const hasSession = !!(getHandle() && getToken());
  if (!hasSession){
    PM_LAST_SIGNALS = [];
    PM_LAST_HEADLINE = {
      id: "pm_public_soon",
      title: "Polymarket Direction Signal",
      source: "Polymarket",
      confidencePct: 90,
      cadence: "3-5 signals per day",
      thesis: "Coming soon for public feed. Signals are generated by a bot and can be wrong."
    };
    fillPredictionAssetFilter([]);
    renderPredictionSignals([]);
    if (status) status.textContent = "Coming soon for everyone. Live private API feed runs 3-5 bot cards/day.";
    if (locked) locked.textContent = t("pm_locked_note") || "Bot signals are informational only. They may be inaccurate and are not guaranteed outcomes.";
    return;
  }
  if (status) status.textContent = t("loading") || "Loading...";
  try{
    const j = await api("/api/market/signals", "GET");
    const payload = JSON.stringify(j || {});
    if (!force && payload === PM_LAST_JSON){
      if (status) status.textContent = t("pm_status") || "Signals are up to date.";
      return;
    }
    PM_LAST_JSON = payload;
    PM_LAST_SIGNALS = Array.isArray(j?.signals) ? j.signals : [];
    PM_LAST_HEADLINE = (j && typeof j.headlineSignal === "object") ? j.headlineSignal : null;
    fillPredictionAssetFilter(PM_LAST_SIGNALS);
    if (locked) {
      locked.textContent = t("pm_locked_note") || "Bot signals are informational only. They may be inaccurate and are not guaranteed outcomes.";
    }
    renderPredictionSignals(PM_LAST_SIGNALS);
    if (status){
      if (j?.comingSoon) {
        status.textContent = t("pm_status") || "Coming soon: 3-5 signals/day · 90% confidence target · Polymarket";
      } else {
        const at = j?.asOf ? new Date(j.asOf).toLocaleTimeString() : "";
        const cadence = String(j?.scheduleRangePerDay || "3-5");
        const base = `${cadence} signals/day`;
        status.textContent = at ? `${base} · updated: ${at}` : base;
      }
    }
  }catch(e){
    const msg = friendlyUiErrorMessage(e?.message || "failed");
    if (status) status.textContent = msg;
  }
}

// ----- Referrals -----

  function escHtml(s){
    return String(s||"").replace(/[&<>"']/g, (c)=>({ "&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;" }[c]));
  }
  function fmtShortDate(iso){
    if (!iso) return "";
    try{
      const d = new Date(iso);
      if (!isFinite(d.getTime())) return String(iso).slice(0,10);
      return d.toLocaleDateString();
    }catch(_e){
      return String(iso).slice(0,10);
    }
  }

  async function loadRefInvited(days=30){
    const body = $("refInvitedBody");
    if (!body) return;
    body.innerHTML = `<tr><td colspan="4" class="muted">${t("r_loading") || "Loading..."}<\/td><\/tr>`;
    const j = await api("/api/referral/list?days=" + encodeURIComponent(String(days)));
    if (!j || !j.ok) throw new Error("ref_list_failed");
    const list = Array.isArray(j.list) ? j.list : [];
    if (!list.length){
      body.innerHTML = `<tr><td colspan="4" class="muted">${t("r_no_invited") || "No invited users yet"}<\/td><\/tr>`;
      return;
    }
    body.innerHTML = list.map((r)=>{
      const status = r.fraud ? ((t("r_flagged") || "Flagged") + (r.fraudReason ? (": " + escHtml(r.fraudReason)) : "")) : (r.eligible ? (t("r_eligible") || "Eligible") : (t("r_not_yet") || "Not yet"));
      return `<tr>
        <td>${escHtml(r.handle||"")}</td>
        <td>${Number(r.inserts||0)}</td>
        <td>${Number(r.activeDays||0)}</td>
        <td>${status}</td>
      </tr>`;
    }).join("");
  }

async function loadRefLeaderboard(days=90){
  const body = $("refLeaderBody");
  const meEl = $("refLeaderMe");
  const lang = localStorage.getItem(LS_SITE_LANG) || "en";
  const ui = getReferralUiCopy(lang);
  if (body) body.innerHTML = `<tr><td colspan="3" class="muted">${escapeHtml(ui.leaderboardLoading || "Loading...")}</td></tr>`;
  const j = await api("/api/leaderboard/referrals?days=" + encodeURIComponent(String(days)));
  if (!j || !j.ok) throw new Error("leaderboard_failed");
  const top = Array.isArray(j.top) ? j.top : [];
  if (!top.length){
    if (body) body.innerHTML = `<tr><td colspan="3" class="muted">${escapeHtml(ui.leaderboardEmpty || "No data yet")}</td></tr>`;
  } else {
    if (body) body.innerHTML = top.map((r,i)=>`<tr><td>${i+1}</td><td>${escHtml(r.handle||"")}</td><td>${Number(r.eligible||0)}</td></tr>`).join("");
  }
  if (meEl){
    if (j.me && j.me.handle){
      meEl.textContent = `${ui.youLabel || "You"}: ${j.me.handle} — ${ui.eligible}: ${Number(j.me.eligible||0)} (${ui.rulesLabel || "rules"}: ≥${j.rules?.minInserts||5} inserts + ≥${j.rules?.minActiveDays||3} active days in ${days}d)`;
    } else {
      meEl.textContent = "";
    }
  }
}


  const refLoadBtn = $("refLoad");
  if (refLoadBtn) refLoadBtn.onclick = async ()=>{
    if (!requireConnected("Referrals")) return;
    try{
      const j = await refreshRefStats(true);
      if (!j) throw new Error("ref_stats_unavailable");
      const link = $("refLink");
      if (link) link.value = j.refLink || "";
      revealReferralLinkUi();
      const confirmed = Number(j.confirmedRefs ?? 0) || 0;
      const active = Number(j.activeRefs ?? 0) || 0;
      const eligible = Number(j.eligibleRefs ?? j.referrals ?? j.count ?? 0) || 0;
      applyRefCountEligible(eligible);
      if ($("refConfirmedInline")) $("refConfirmedInline").textContent = String(confirmed);
      if ($("refActiveInline")) $("refActiveInline").textContent = String(active);
      try{ renderThemes(); }catch(e){}
      try{ renderExtThemes(); }catch(e){}
      try{ initWallpapers(); }catch(e){}
      try{ renderExtWallpapers(); }catch(e){}
const msg = $("refMsg");
      try{ await loadRefInvited(30); }catch(e){}
      if (msg) msg.innerHTML = '<span class="ok">' + escapeHtml(t("ref_loaded")) + '</span>';
      try{ fillStyles(); fillPacks(); }catch{}
      try{ await refreshUsage(); }catch{}
    }catch(e){
      const msg = $("refMsg");
      if (msg) msg.innerHTML = '<span class="bad">' + escapeHtml(e?.message||"failed") + '</span>';
    }
  };

  try{ initReferralPromoDetailsState(); }catch{}

  const refCopyBtn = $("refCopy");
  if (refCopyBtn) refCopyBtn.onclick = async ()=>{
    if (!requireConnected("Referrals")) return;
    const link = $("refLink");
    const v = (link?.value || "").trim();
    if (!v) return;
    await navigator.clipboard.writeText(v);
    const msg = $("refMsg");
    const lang = localStorage.getItem(LS_SITE_LANG) || "en";
    const ui = getReferralUiCopy(lang);
    if (msg) msg.innerHTML = '<span class="ok">' + escapeHtml(ui.copied || "Copied.") + '</span>';
  };
  const pmRefreshBtn = $("pm_refresh");
  if (pmRefreshBtn) pmRefreshBtn.onclick = ()=>{ loadPredictionSignals({ force:true }); };
  syncPredictionFilterCopy();
  const pmAssetSel = $("pm_asset");
  if (pmAssetSel) pmAssetSel.addEventListener("change", ()=>{
    PM_FILTERS.asset = String(pmAssetSel.value || "all");
    renderPredictionSignals(PM_LAST_SIGNALS);
  });
  const pmBiasSel = $("pm_bias");
  if (pmBiasSel) pmBiasSel.addEventListener("change", ()=>{
    PM_FILTERS.bias = String(pmBiasSel.value || "all").toLowerCase();
    renderPredictionSignals(PM_LAST_SIGNALS);
  });
  const pmConfSel = $("pm_conf");
  if (pmConfSel) pmConfSel.addEventListener("change", ()=>{
    PM_FILTERS.minConf = Number(pmConfSel.value || 0) || 0;
    renderPredictionSignals(PM_LAST_SIGNALS);
  });
  setInterval(()=>{
    try{
      if (__gmxTabState.getCurrentTab() === "prediction") loadPredictionSignals({ force:false });
    }catch{}
  }, 60000);

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

  function getRpcUrl(){ return __gmxWh.getRpcUrl(BILLING); }
  function rpcCandidates(){ return __gmxWh.rpcCandidates(BILLING); }
  function shouldRetryRpc(err){ return __gmxWh.shouldRetryRpc(err); }

  async function getServerTxContext(){
    try{
      const j = await api("/api/billing/tx-context");
      if (j?.ok && j?.blockhash) return j;
      const alt = await api("/api/solana/latest-blockhash");
      if (alt?.ok && alt?.blockhash) return alt;
      const v = alt?.value;
      if (alt?.ok && v?.blockhash) {
        return {
          ok: true,
          blockhash: String(v.blockhash),
          lastValidBlockHeight: Number(v.lastValidBlockHeight || 0) || undefined,
        };
      }
    }catch(_e){}
    return null;
  }

  async function getConnectionWithBlockhash(web3){
    const preferred = rpcCandidates()[0] || getRpcUrl();
    const connection = new web3.Connection(preferred, "confirmed");
    const serverCtx = await getServerTxContext();
    if (serverCtx?.blockhash){
      return {
        connection,
        latest: {
          blockhash: String(serverCtx.blockhash || ""),
          lastValidBlockHeight: Number(serverCtx.lastValidBlockHeight || 0) || undefined,
        },
        rpcUrl: preferred,
        serverBacked: true,
      };
    }
    let lastErr = null;
    for (const url of rpcCandidates()){
      try{
        const liveConnection = new web3.Connection(url, "confirmed");
        const latest = await liveConnection.getLatestBlockhash("confirmed");
        return { connection: liveConnection, latest, rpcUrl: url };
      }catch(err){
        lastErr = err;
        if (!shouldRetryRpc(err)) break;
      }
    }
    throw lastErr || new Error("rpc_unavailable");
  }

  const fmtSol = __gmxWh.fmtSol;
  const planPricePrimary = __gmxWh.planPricePrimary;
  const planPriceSecondary = __gmxWh.planPriceSecondary;

  let BUFFER_READY = null;

  async function ensureBrowserBuffer(){
    const existing = (typeof globalThis !== "undefined" && globalThis.Buffer) ? globalThis.Buffer : null;
    if (existing && typeof existing.from === "function" && typeof existing.alloc === "function") return existing;
    const web3Buffer = window.solanaWeb3?.Buffer || window.solanaWeb3?.utils?.Buffer || null;
    if (web3Buffer && typeof web3Buffer.from === "function") {
      try { window.Buffer = web3Buffer; } catch (_e) {}
      try { globalThis.Buffer = web3Buffer; } catch (_e) {}
      return web3Buffer;
    }
    if (!BUFFER_READY) {
      class MiniBuffer extends Uint8Array {
        static from(input, encoding){
          if (typeof input === "string") {
            if (encoding === "hex") {
              const clean = input.replace(/[^0-9a-f]/gi, "");
              const out = new MiniBuffer(Math.ceil(clean.length / 2));
              for (let i = 0; i < out.length; i++) out[i] = parseInt(clean.slice(i * 2, i * 2 + 2) || "00", 16);
              return out;
            }
            if (encoding === "base64") {
              const raw = atob(input);
              const out = new MiniBuffer(raw.length);
              for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
              return out;
            }
            return new TextEncoder().encode(input);
          }
          if (typeof input === "number") return new MiniBuffer(input);
          if (input instanceof ArrayBuffer) return new MiniBuffer(input);
          if (ArrayBuffer.isView(input)) return new MiniBuffer(input.buffer.slice(input.byteOffset, input.byteOffset + input.byteLength));
          if (Array.isArray(input)) return new MiniBuffer(input);
          return new MiniBuffer(0);
        }
        static alloc(size){ return new MiniBuffer(Number(size) || 0); }
        static allocUnsafe(size){ return new MiniBuffer(Number(size) || 0); }
        static concat(list){
          const arr = Array.isArray(list) ? list : [];
          const total = arr.reduce((n, item) => n + (item?.length || 0), 0);
          const out = new MiniBuffer(total);
          let off = 0;
          for (const item of arr) { const chunk = MiniBuffer.from(item); out.set(chunk, off); off += chunk.length; }
          return out;
        }
        static isBuffer(value){ return value instanceof Uint8Array; }
        toString(encoding="utf8"){
          if (encoding === "hex") return Array.from(this).map((b)=>b.toString(16).padStart(2,"0")).join("");
          if (encoding === "base64") { let s = ""; for (const b of this) s += String.fromCharCode(b); return btoa(s); }
          return new TextDecoder().decode(this);
        }
      }
      BUFFER_READY = Promise.resolve(MiniBuffer).then((B)=>{
        try { window.Buffer = B; } catch (_e) {}
        try { globalThis.Buffer = B; } catch (_e) {}
        return B;
      });
    }
    return BUFFER_READY;
  }

  async function ensureSplToken(){
    if (window.__splTokenMod) return window.__splTokenMod;
    await ensureBrowserBuffer();
    const web3 = window.solanaWeb3;
    if (!web3?.PublicKey || !web3?.TransactionInstruction) throw new Error("web3_unavailable");
    const TOKEN_PROGRAM_ID = new web3.PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA");
    const ASSOCIATED_TOKEN_PROGRAM_ID = new web3.PublicKey("ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL");
    const toPkBytes = (pk) => {
      if (pk?.toBytes) return Uint8Array.from(pk.toBytes());
      if (pk?.toBuffer) return Uint8Array.from(pk.toBuffer());
      return Uint8Array.from([]);
    };
    const getAssociatedTokenAddress = async (mint, owner, _allowOwnerOffCurve=false, tokenProgramId=TOKEN_PROGRAM_ID, associatedTokenProgramId=ASSOCIATED_TOKEN_PROGRAM_ID) => {
      const out = web3.PublicKey.findProgramAddressSync([
        toPkBytes(owner),
        toPkBytes(tokenProgramId),
        toPkBytes(mint),
      ], associatedTokenProgramId);
      return out[0];
    };
    const createAssociatedTokenAccountInstruction = (payer, ata, owner, mint, tokenProgramId=TOKEN_PROGRAM_ID, associatedTokenProgramId=ASSOCIATED_TOKEN_PROGRAM_ID) => {
      return new web3.TransactionInstruction({
        programId: associatedTokenProgramId,
        keys: [
          { pubkey: payer, isSigner: true, isWritable: true },
          { pubkey: ata, isSigner: false, isWritable: true },
          { pubkey: owner, isSigner: false, isWritable: false },
          { pubkey: mint, isSigner: false, isWritable: false },
          { pubkey: web3.SystemProgram.programId, isSigner: false, isWritable: false },
          { pubkey: tokenProgramId, isSigner: false, isWritable: false },
          { pubkey: web3.SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false },
        ],
        data: new Uint8Array([]),
      });
    };
    const createTransferInstruction = (source, destination, owner, amountBase, _multiSigners=[], tokenProgramId=TOKEN_PROGRAM_ID) => {
      let n = BigInt(String(amountBase || "0"));
      if (n < 0n) throw new Error("invalid_amount");
      const data = new Uint8Array(9);
      data[0] = 3;
      for (let i = 0; i < 8; i++) {
        data[i + 1] = Number(n & 0xffn);
        n >>= 8n;
      }
      return new web3.TransactionInstruction({
        programId: tokenProgramId,
        keys: [
          { pubkey: source, isSigner: false, isWritable: true },
          { pubkey: destination, isSigner: false, isWritable: true },
          { pubkey: owner, isSigner: true, isWritable: false },
        ],
        data,
      });
    };
    const mod = {
      TOKEN_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID,
      getAssociatedTokenAddress,
      createAssociatedTokenAccountInstruction,
      createTransferInstruction,
    };
    window.__splTokenMod = mod;
    return mod;
  }

  async function buildPaymentTx(intent){
    await ensureBrowserBuffer();
    const web3 = window.solanaWeb3;
    if (!web3?.Transaction || !web3?.SystemProgram) throw new Error("web3_unavailable");
    if (!WALLET.publicKey) throw new Error("wallet_not_connected");

    const payer = WALLET.publicKey;
    const receiver = new web3.PublicKey(String(intent.receiver || BILLING.receiver || ""));
    if (!receiver) throw new Error("receiver_missing");

    const { connection, latest } = await getConnectionWithBlockhash(web3);
    const tx = new web3.Transaction();
    tx.feePayer = payer;
    tx.recentBlockhash = latest.blockhash;

    const amountBase = BigInt(String(intent.amountBase || intent.amount_base || "0"));
    if (amountBase <= 0n) throw new Error("invalid_amount");

    addIntentMemoInstruction(tx, intent?.id || intent?.intentId || "", web3);

    if (String(intent.currency || selectedCurrency) === "SOL"){
      const payerLamports = BigInt(String(await connection.getBalance(payer).catch(() => 0)));
      const feeSlack = 10000n;
      if (payerLamports < (amountBase + feeSlack)) throw new Error("insufficient_sol_funds");
      tx.add(web3.SystemProgram.transfer({
        fromPubkey: payer,
        toPubkey: receiver,
        lamports: Number(amountBase)
      }));
      return { tx, connection };
    }

    const spl = await ensureSplToken();
    const mint = new web3.PublicKey(String(intent.mint || ""));
    if (!mint) throw new Error("mint_missing");

    const payerAta = await spl.getAssociatedTokenAddress(mint, payer, false, spl.TOKEN_PROGRAM_ID, spl.ASSOCIATED_TOKEN_PROGRAM_ID);
    const receiverAta = await spl.getAssociatedTokenAddress(mint, receiver, false, spl.TOKEN_PROGRAM_ID, spl.ASSOCIATED_TOKEN_PROGRAM_ID);

    const payerInfo = await connection.getAccountInfo(payerAta);
    if (!payerInfo) throw new Error("payer_token_account_missing");
    const payerBal = await connection.getTokenAccountBalance(payerAta).catch(() => null);
    const payerAmount = BigInt(String(payerBal?.value?.amount || "0"));
    if (payerAmount < amountBase) throw new Error("insufficient_token_funds");

    const recvInfo = await connection.getAccountInfo(receiverAta);
    let neededLamports = 10000n;
    if (!recvInfo && typeof connection.getMinimumBalanceForRentExemption === "function") {
      try { neededLamports += BigInt(String(await connection.getMinimumBalanceForRentExemption(165))); } catch (_e) {}
    }
    const payerLamports = BigInt(String(await connection.getBalance(payer).catch(() => 0)));
    if (payerLamports < neededLamports) throw new Error("insufficient_sol_funds");

    if (!recvInfo){
      tx.add(spl.createAssociatedTokenAccountInstruction(
        payer, receiverAta, receiver, mint, spl.TOKEN_PROGRAM_ID, spl.ASSOCIATED_TOKEN_PROGRAM_ID
      ));
    }

    tx.add(spl.createTransferInstruction(
      payerAta, receiverAta, payer, amountBase, [], spl.TOKEN_PROGRAM_ID
    ));

    return { tx, connection };
  }

  async function walletSendTransaction(tx, connection){
    if (!tx) throw new Error("tx_missing");

    if (WALLET.kind === "standard"){
      const w = WALLET.wallet;
      const acc = WALLET.account;
      const featSend = w?.features?.["solana:signAndSendTransaction"]?.signAndSendTransaction;
      if (typeof featSend === "function"){
        const out = await featSend({ transaction: tx, account: acc, chain: WS_CHAIN });
        const sig = out?.signature;
        const s = (typeof sig === "string") ? sig : b58encode(sig);
        if (!s) throw new Error("send_failed");
        return s;
      }
      const featSign = w?.features?.["solana:signTransaction"]?.signTransaction;
      if (typeof featSign === "function"){
        const out = await featSign({ transaction: tx, account: acc, chain: WS_CHAIN });
        const signed = out?.transaction || out?.signedTransaction || out;
        const raw = signed?.serialize ? signed.serialize() : (signed instanceof Uint8Array ? signed : null);
        if (!raw) throw new Error("sign_failed");
        const sig = await connection.sendRawTransaction(raw, { skipPreflight:false, preflightCommitment:"confirmed" });
        return sig;
      }
      throw new Error("wallet_no_send_feature");
    }

    // legacy
    const p = WALLET.provider;
    if (p?.signAndSendTransaction){
      const out = await p.signAndSendTransaction(tx, { preflightCommitment:"confirmed" });
      const sig = out?.signature || out;
      return (typeof sig === "string") ? sig : b58encode(sig);
    }
    if (p?.signTransaction){
      const signed = await p.signTransaction(tx);
      const raw = signed?.serialize ? signed.serialize() : null;
      if (!raw) throw new Error("sign_failed");
      const sig = await connection.sendRawTransaction(raw, { skipPreflight:false, preflightCommitment:"confirmed" });
      return sig;
    }
    throw new Error("wallet_no_send_feature");
  }

  async function verifyIntentWithRetry(intentId, sig, payer){
    let last = null;
    for (let i=0; i<10; i++){
      try{
        return await api("/api/billing/verify", "POST", { intentId, sig, payer });
      }catch(e){
        last = e;
        const m = String(e?.message || "");
        if (m === "payment_not_verified" || m === "request_failed" || m === "timeout" || m === "server_error"){
          await new Promise(r=>setTimeout(r, 1500));
          continue;
        }
        throw e;
      }
    }
    throw last || new Error("verify_failed");
  }

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

function requireAdminSignedIn(){
  if (!isAdminSignedIn()){
    const m = $("adminMsg");
    if (m) m.innerHTML = '<span class="bad">Sign in first.</span>';
    return false;
  }
  return true;
}

// ----- Admin -----

  const adminHandleEl = $("adminHandle");
const adminPwEl = $("adminPassword");
const adminStateEl = $("adminAuthState");
function syncAdminUi(){
  try{
    if (adminHandleEl){
      // Prefill with connected handle if available, otherwise default admin handle.
      const h = getHandle() || ADMIN_HANDLE;
      if (!adminHandleEl.value) adminHandleEl.value = h;
    }
    if (adminStateEl){
      adminStateEl.textContent = isAdminSignedIn() ? "signed in" : "signed out";
    }
  }catch{}
}

const adminLoginBtn = $("adminLogin");
if (adminLoginBtn) adminLoginBtn.onclick = async ()=>{
  if (!requireConnected("Admin")) return;
  $("adminMsg").textContent = "";
  try{
    const h = (adminHandleEl?.value || "").trim() || "";
    const me = getHandle();
    if (h && me && h !== me){
      $("adminMsg").innerHTML = '<span class="bad">Admin handle must match connected handle.</span>';
      return;
    }
    const pw = (adminPwEl?.value || "").trim();
    if (!pw){
      $("adminMsg").innerHTML = '<span class="bad">Enter password.</span>';
      return;
    }
    const j = await api("/api/admin/login","POST",{ password: pw });
    if (j?.adminToken){
      setAdminToken(j.adminToken);
      if (adminPwEl) adminPwEl.value = "";
      $("adminMsg").innerHTML = '<span class="ok">Signed in.</span>';
      syncAdminUi();
    } else {
      $("adminMsg").innerHTML = '<span class="bad">Login failed.</span>';
    }
  }catch(e){
    $("adminMsg").innerHTML = '<span class="bad">' + escapeHtml(e?.message||"Login failed") + '</span>';
  }
};

const adminLogoutBtn = $("adminLogout");
if (adminLogoutBtn) adminLogoutBtn.onclick = async ()=>{
  if (!requireConnected("Admin")) return;
  try{
    await api("/api/admin/logout","POST",{});
  }catch{}
  setAdminToken("");
  syncAdminUi();
  const m = $("adminMsg");
  if (m) m.innerHTML = '<span class="ok">Signed out.</span>';
};
  const adminGenBtn = $("adminGen");
  if (adminGenBtn) adminGenBtn.onclick = async ()=>{
    if (!requireConnected("Admin")) return;
    $("adminOut").value = "";
    if (!requireAdminSignedIn()) return;
    const n = Number(($("adminN").value||"5").trim());
    const note = ($("adminNote").value||"promo").trim();
    const days = Number(($("adminDuration").value||"0").trim());

    try{
      const j = await api("/api/admin/codes", "POST", { n, note, days });
      $("adminOut").value = (j.codes || []).join("\n");
    }catch(e){
      $("adminOut").value = "Error: " + (e.message||"failed");
    }
  };

  const adminListBtn = $("adminList");
  if (adminListBtn) adminListBtn.onclick = async ()=>{
    if (!requireConnected("Admin")) return;
    $("adminOut").value = "";
    if (!requireAdminSignedIn()) return;
    try{
      const j =      await api("/api/admin/codes");
      $("adminOut").value = (j.rows || []).map(r => `${r.code} (${r.days || 0}d) ${(r.note||"").trim()} ${r.created_at||""}`.trim()).join("\\n");
    }catch(e){
      $("adminOut").value = "Error: " + (e.message||"failed");
    }
  };// --- Admin: leaderboard rewards ---
async function adminLoadLb(days){
  if (!requireConnected("Admin")) return;
  if (!requireAdminSignedIn()) return;
  const msg = $("adminLbMsg");
  if (msg) msg.textContent = "";
  try{
    const j = await api("/api/admin/leaderboard/referrals?days=" + days);
    const rows = (j.top || []).slice(0,3);
    const table = $("adminLbTable" + String(days));
    if (table){
      const tb = table.querySelector("tbody");
      if (tb){
        tb.innerHTML = rows.map(r=>{
          const h = escapeHtml(r.handle);
          const elig = Number(r.eligible||0)||0;
          const rank = Number(r.rank||0)||0;
          const btnId = `lb_award_${days}_${rank}`;
          return `<tr>
            <td>${rank}</td>
            <td><span class="kbd">@${h}</span></td>
            <td>${elig}</td>
            <td><button class="btn secondary" id="${btnId}" type="button">Award</button></td>
          </tr>`;
        }).join("") || `<tr><td colspan="4" class="muted">No data</td></tr>`;
        // Bind award buttons
        rows.forEach(r=>{
          const rank = Number(r.rank||0)||0;
          const b = $("lb_award_" + days + "_" + rank);
          if (b){
            b.onclick = async ()=>{
              if (!requireAdminSignedIn()) return;
              const handle = String(r.handle||"").trim();
              const place = rank;
              if (!handle) return;
              if (!confirm(`Award Pro to @${handle} for ${days} days (place #${place})?`)) return;
              try{
                b.disabled = true;
                const out = await api("/api/admin/leaderboard/award", "POST", { days, place, handle });
                if (msg) msg.innerHTML = `<span class="ok">Awarded @${escapeHtml(handle)} (${days}d). Code: <span class="kbd">${escapeHtml(out.code||"")}</span></span>`;
              }catch(e){
                if (msg) msg.innerHTML = `<span class="bad">${escapeHtml(e?.message||"award_failed")}</span>`;
              }finally{
                b.disabled = false;
              }
            };
          }
        });
      }
    }
    if (msg) msg.innerHTML = `<span class="ok">Loaded ${days}d winners.</span>`;
  }catch(e){
    if (msg) msg.innerHTML = `<span class="bad">${escapeHtml(e?.message||"failed")}</span>`;
  }
}

const adminLbLoad7 = $("adminLbLoad7");
if (adminLbLoad7) adminLbLoad7.onclick = ()=> adminLoadLb(7);

const adminLbLoad30 = $("adminLbLoad30");
if (adminLbLoad30) adminLbLoad30.onclick = ()=> adminLoadLb(30);







function pruneLegacyAdminPanels(){
  try{
    const retiredAnchors = ["adminSelBox", "adminSelHistory", "adminFaqBox", "adminHealthOut"];
    retiredAnchors.forEach((id)=>{
      const el = $(id);
      if (!el) return;
      const card = el.closest(".card");
      if (card) card.style.display = "none";
    });

    const adminRoot = $("tab-admin");
    if (!adminRoot) return;

    const firstNote = adminRoot.querySelector(".card .note");
    if (firstNote){
      firstNote.textContent = "Sign in once, then use access, code, and leaderboard tools only. Retired admin experiments are removed from this admin workspace.";
    }

    adminRoot.querySelectorAll(".card .title").forEach((node)=>{
      const text = String(node.textContent || "").trim();
      if (text === "Admin stats") node.textContent = "Admin access";
      if (text === "Admin: promo codes") node.textContent = "Create access codes";
      if (text === "Admin: leaderboard rewards") node.textContent = "Leaderboard rewards";
      if (text === "Admin: conversion metrics" || text === "Admin: extension health" || text === "Admin: FAQ base" || text === "Selectors history" || text === "Selectors JSON" || text.startsWith("Selectors")){
        const card = node.closest(".card");
        if (card) card.style.display = "none";
      }
    });
  }catch{}
}

  // ----- Redeem code -----
  const redeemBtn = $("btnRedeem");
  if (redeemBtn) redeemBtn.onclick = async ()=>{
    if (!requireConnected("Home")) return;
    const h = getHandle();
    if (!h){ tab("home"); return; }
    const code = $("redeemCode").value.trim();
    if (!code){
      $("connectMsg").innerHTML = `<span class="warn">Paste a code first.</span>`;
      return;
    }
    try{
      const j = await api("/api/billing/redeem", "POST", { handle: h, code });
      $("connectMsg").innerHTML = `<span class="ok">Activated.</span>`;
      renderWalletStatus(j.sub);
      await refreshUsage();
    }catch(e){
      $("connectMsg").innerHTML = `<span class="bad">${e.message || "redeem_failed"}</span>`;
    }
  };

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
      getGmView: () => gmView,
      getGnView: () => gnView,
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
  const connectBtn = $("btnConnect");
  if (connectBtn) connectBtn.onclick = async ()=>{
    const cm = $("connectMsg");
    if (cm) cm.textContent = "";
    const xh = $("xHandle");
    const handle = normalizeHandle(xh?.value);
    if (!handle){
      if (cm) cm.innerHTML = '<span class="bad">Enter a valid @handle</span>';
      return;
    }

    const params = new URLSearchParams(location.search);
    const ref = params.get("ref") || "";

    try{
      const j = await api("/api/user/init", "POST", { handle, ref });
      localStorage.setItem(LS_HANDLE, j.handle);
      localStorage.setItem(LS_TOKEN, j.token);
      try{ localStorage.setItem(LS_IS_ADMIN, j.isAdmin ? "1" : "0"); }catch{}
      try{ localStorage.setItem(LS_ADMIN_CLAIMABLE, j.adminClaimable ? "1" : "0"); }catch{}

      const hp = $("handlePill");
      if (hp) hp.textContent = j.handle;
      const rl = $("refLink");
      if (rl) rl.value = j.refLink || "";
      if (cm) cm.innerHTML = '';
      try{ localStorage.removeItem(LS_FORCE_LOGOUT); }catch{}
      try{ localStorage.removeItem(LS_FORCE_LOGOUT_V2); }catch{}
      try{ window.postMessage({ type: "GMX_SYNC_NOW", reason: "site_connect" }, "*"); }catch(_e){}
      AUTH_OK = true;
      try{ ping(); }catch{}

      applyAdminVisibility();
      await refreshUsage();
      await loadPlans();

      const code = params.get("code");
      if (code){
        const rc = $("redeemCode");
        if (rc) rc.value = code;
      }
    }catch(e){
      if (cm) cm.innerHTML = '<span class="bad">Connect error: ' + escapeHtml(friendlyUiErrorMessage(e.message || "request_failed", { scope:"connect" })) + '</span>';
    }
  };

  const resetBtn = $("btnReset");
  if (resetBtn) resetBtn.onclick = async ()=>{
    const xh = $("xHandle");
    try{ localStorage.removeItem(LS_HANDLE); }catch{}
    try{ localStorage.removeItem(LS_TOKEN); }catch{}
    try{ localStorage.removeItem(LS_IS_ADMIN); }catch{}
    try{ localStorage.removeItem(LS_ADMIN_CLAIMABLE); }catch{}
    try{ localStorage.removeItem("gmx_ui_tmp"); }catch{}

    const hp = $("handlePill");
    if (hp) hp.textContent = "not set";
    const cm = $("connectMsg");
    if (cm) cm.innerHTML = '<span class="ok">Session cleared.</span>';
    AUTH_OK = false;
    try{ localStorage.setItem(LS_FORCE_LOGOUT, String(Date.now())); }catch{}
    try{ localStorage.setItem(LS_FORCE_LOGOUT_V2, String(Date.now())); }catch{}
    try{ window.postMessage({ type: "GMX_SYNC_NOW", reason: "site_reset" }, "*"); }catch(_e){}
    try{ ping(); }catch{}
    applyAdminVisibility();
    try{ refreshUsage(); }catch{}
    try{ loadPlans(); }catch{}
    if (xh){
      try{ xh.focus(); }catch{}
    }
  };

})();
