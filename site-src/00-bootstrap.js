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
const ASSET_REV = "20260616p";

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
const __gmxUi = window.__GMXUiFactory();

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



