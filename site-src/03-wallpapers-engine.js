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

  let CUSTOM_WALLPAPERS_SITE = [];
  let CUSTOM_WALLPAPERS_EXT = [];
  let CUSTOM_WALLPAPERS_LOADED = false;
  async function loadCustomWallpapers(){
    if (CUSTOM_WALLPAPERS_LOADED) return false;
    try{
      const r = await fetch("/api/wallpapers/custom", { cache:"no-store" });
      const j = await r.json();
      if (j?.ok){
        CUSTOM_WALLPAPERS_LOADED = true;
        CUSTOM_WALLPAPERS_SITE = (j.site||[]).map(x=>({ ...x, tier:"custom" }));
        CUSTOM_WALLPAPERS_EXT = (j.ext||[]).map(x=>({ ...x, tier:"custom" }));
        return CUSTOM_WALLPAPERS_SITE.length > 0 || CUSTOM_WALLPAPERS_EXT.length > 0;
      }
    }catch{}
    return false;
  }

  // ---- Wallpaper migration / validation (keeps old saved ids from breaking the UI)
  function normalizeWallpaperId(id){
    return __gmxWp.normalizeWallpaperId(id, WALLPAPERS);
  }

  __gmxWpStore.normalizeAllWallpapers();

  function normalizeExtWallpaperIdLocal(id){
    return __gmxWp.normalizeExtWallpaperIdLocal(id, EXT_WALLPAPERS);
  }

  function extWallpaperAssetPath(id){
    return __gmxWp.extWallpaperAssetPath(id, EXT_WALLPAPERS);
  }

  function extWallpaperFullUrl(id){
    return __gmxWp.extWallpaperFullUrl(id, EXT_WALLPAPERS);
  }

  function extWallpaperThumbUrl(id){
    return __gmxWp.extWallpaperThumbUrl(id, EXT_WALLPAPERS);
  }
  try{ __gmxExtWpStore.normalizeStoredExtWallpaperSelections(); }catch{}

  const TOP_LEVEL_TABS = ["home","gm","gn","prediction","referrals","leaderboard","themes","extthemes","wallet","admin"];
  function normalizeTopLevelTab(raw){
    const name = String(raw || "").trim().toLowerCase();
    if (name === "upgrade") return "wallet";
    if (name === "extension-themes" || name === "extthemes") return "extthemes";
    return TOP_LEVEL_TABS.includes(name) ? name : "home";
  }

  let CURRENT_TAB = "home";
  function currentTabName(){ return CURRENT_TAB; }

  function wallpaperKeyForTab(tab){ return __gmxWpStore.wallpaperKeyForTab(tab); }
  function getWallpaperForTab(tab){ return __gmxWpStore.getWallpaperForTab(tab); }
  function setWallpaperForTab(tab, id){ return __gmxWpStore.setWallpaperForTab(tab, id); }
  function migrateLegacyWallpaperSelectionOnce(){ return __gmxWpStore.migrateLegacyWallpaperSelectionOnce(); }

  function wallpaperAssetPath(id){
    return __gmxWp.wallpaperAssetPath(id);
  }

  function wallpaperFullUrl(id){
    return __gmxWp.wallpaperFullUrl(id, WALLPAPERS);
  }

  function wallpaperThumbUrl(id){
    return __gmxWp.wallpaperThumbUrl(id, WALLPAPERS);
  }

  function wallpaperUrl(id){
    return __gmxWp.wallpaperUrl(id, WALLPAPERS);
  }

  function wallpaperUnlocked(wp, idx, effectiveCustomLen){
    if (!wp) return false;
    if (wp.tier === "custom"){
      const customIdx = idx;
      return isPro() || customIdx < CUSTOM_WP_FREE_COUNT;
    }
    const mainIdx = idx - (effectiveCustomLen || 0);
    return isPro() || (mainIdx < unlockedCountByRefs(WALLPAPERS.length, FREE_VISIBLE_WALLPAPERS));
  }

  function effectiveCustomWallpapersSite(){
    const out = [...CUSTOM_WALLPAPERS_SITE];
    try{ if (localStorage.getItem(LS_CUSTOM_BG_GLOBAL)) out.push({ id: CUSTOM_UPLOAD_ID, name: "My upload", tier: "custom" }); }catch{}
    return out;
  }

  function ensureWallpaperLayer(){ return __gmxWp.ensureWallpaperLayer(); }
  function setWallpaperLayerImage(layer, url){ return __gmxWp.setWallpaperLayerImage(layer, url); }

  function applyWallpaper(tab){ return __gmxWpApply.applyWallpaper(tab); }

  
  function sanitizeI18nValue(lang, value, fallback){
    const allowCyr = (lang === "ru" || lang === "uk");
    if (Array.isArray(value)){
      const fb = Array.isArray(fallback) ? fallback : [];
      const out = value.map((item, idx)=>sanitizeI18nValue(lang, item, fb[idx])).filter(v=>v !== undefined && v !== null && v !== "");
      if (out.length) return out;
      return fb.length ? fb : undefined;
    }
    if (typeof value === "string"){
      const txt = value.trim();
      if (!txt) return (typeof fallback === "string" && fallback.trim()) ? fallback : undefined;
      if (!allowCyr && /[\u0400-\u04FF]/.test(value)) return (typeof fallback === "string" && fallback.trim()) ? fallback : undefined;
      return value;
    }
    if (value === undefined || value === null) return fallback;
    return value;
  }

  function trWp(k){
    let lang = "en";
    try{ lang = localStorage.getItem(LS_SITE_LANG) || "en"; }catch{}
    let base = {}, dict = {};
    try{ base = I18N.en || {}; dict = I18N[lang] || {}; }catch{}
    const v = sanitizeI18nValue(lang, dict[k], base[k]);
    return (v ?? base[k] ?? k);
  }

  // i18n helper (global)
  function t(k){
    return trWp(k);
  }

  function prettyError(code){
    const c = String(code||"").trim();
    if (!c) return (t("err_unknown") || "Unknown error");
    const m = {
      invalid_handle: t("err_invalid_handle") || "Invalid handle",
      unauthorized: t("err_unauthorized") || "Unauthorized",
      forbidden: t("err_forbidden") || "Forbidden",
      rate_limited: t("err_rate_limited") || "Too many requests",
      busy_try_again: t("err_busy") || "Server busy, try again",
      limit_reached: t("err_limit_reached") || "Daily limit reached",
      upgrade_required: t("err_upgrade_required") || "Upgrade required",
      server_error: t("err_server_error") || "Server error",
      not_found: t("err_not_found") || "Not found",
      init_failed: t("err_init_failed") || "Init failed",
    };
    return m[c] || c;
  }



  function renderWallpaperUI(){ return __gmxWpUi.renderWallpaperUI(); }
  function setThemeWallView(view){ return __gmxWpUi.setThemeWallView(view); }
  function initThemeWallTabs(){ return __gmxWpUi.initThemeWallTabs(); }
  function initWallpapers(){ return __gmxWpUi.initWallpapers(); }

  let SITE_LANGS = [["en","English"]];

  // English-only product: UI and reply generation stay on English.
  let REPLY_LANGS = [["en","English"]];
// --- Flags + language chips (By language) ---
    function flagEmoji(code){
    const c = String(code || "").trim().toUpperCase();
    return c || "GLB";
  }

  function updateLangFlags(){
    const site = $("siteLang")?.value || "en";
    const gm = $("gmLang")?.value || "en";
    const gn = $("gnLang")?.value || "en";
    if ($("siteLangFlag")) $("siteLangFlag").textContent = (site === "en") ? "GLB" : flagEmoji(site);
    if ($("gmLangFlag")) $("gmLangFlag").textContent = flagEmoji(gm);
    if ($("gnLangFlag")) $("gnLangFlag").textContent = flagEmoji(gn);
  }

  function renderLangChips(kind){
    const wrap = kind==="gm" ? $("gmLangChipsWrap") : $("gnLangChipsWrap");
    const box  = kind==="gm" ? $("gmLangChips") : $("gnLangChips");
    if (wrap) wrap.style.display = "none";
    if (box) box.innerHTML = "";
  }
