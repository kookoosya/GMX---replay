  // ----- Lightweight client logs (for support) -----
  const LOGS = [];
  function logEvent(type, data){
    try{
      LOGS.push({ ts: Date.now(), type, data: data || null });
      if (LOGS.length > 200) LOGS.shift();
    } catch {}
  }

  const INFLIGHT = { gm:false, gn:false };
  const ABORT = { gm:null, gn:null };

  const LS_HANDLE = "gmx_handle";
  const LS_TOKEN  = "gmx_token";

  const SS_ADMIN_TOKEN = "gmx_admin_token";

function getAdminToken(){
  try{ return String(sessionStorage.getItem(SS_ADMIN_TOKEN) || "").trim(); }catch(_e){ return ""; }
}
function setAdminToken(t){
  try{
    const v = String(t||"").trim();
    if (v) sessionStorage.setItem(SS_ADMIN_TOKEN, v);
    else sessionStorage.removeItem(SS_ADMIN_TOKEN);
  }catch(_e){}
}
function isAdminSignedIn(){ return !!getAdminToken(); }

  const LS_IS_ADMIN = "gmx_is_admin";
  const LS_ADMIN_CLAIMABLE = "gmx_admin_claimable";
  const LS_SITE_LANG = "gmx_site_lang";
  const LS_LAST_TAB = "gmx_last_tab";
  const LS_REF_PROMO_OPEN = "gmx_ref_promo_open";
  const LS_GM_REPLY_LANG = "gmx_gm_reply_lang";
  const LS_GN_REPLY_LANG = "gmx_gn_reply_lang";
  const LS_BEST_ENABLED = "gmx_best_enabled";
  const LS_FORCE_LOGOUT = "gmx_ext_force_logout";
  const LS_FORCE_LOGOUT_V2 = "gmx_ext_force_logout_v2";
  const LS_TOGGLES_BOOTSTRAP_V2 = "gmx_toggles_bootstrap_v2";


  const GM_GLOBAL = "gmx_gm_global";
  const GN_GLOBAL = "gmx_gn_global";
  const GM_LANGS  = "gmx_gm_langs";
  const GN_LANGS  = "gmx_gn_langs";

  const LS_CUSTOM_BG = "gmx_custom_bg";

  const LS_GM_PACK = "gmx_gm_pack";
  const LS_GN_PACK = "gmx_gn_pack";
  const LS_GM_ANTI = "gmx_gm_anti";
  const LS_GN_ANTI = "gmx_gn_anti";
  const LS_GM_CLEAN_FILL = "gmx_gm_clean_fill";
  const LS_GN_CLEAN_FILL = "gmx_gn_clean_fill";
  const CLEAN_FILL_STRENGTH = 2;
const LS_GM_RECENT = "gmx_gm_recent";
  const LS_GN_RECENT = "gmx_gn_recent";


  // Hidden repeat guard stays off in the normal flow.
  // Best pass uses its own fixed internal shape pass only when the user turns it on.
  function getAntiStrength(kind){
    return 0;
  }

  // Legacy helper kept for compatibility with old code paths.
  if (typeof window.antiWindow !== "function"){
    window.antiWindow = function(strength){
      const s = Math.max(0, Math.min(5, Math.trunc(Number(strength) || 0)));
      const map = [0, 10, 20, 30, 40, 50];
      return map[s] ?? 0;
    };
  }
  function antiWindow(strength){
    return window.antiWindow(strength);
  }

  function lsKeyCleanFill(kind){
    return (kind === "gn") ? LS_GN_CLEAN_FILL : LS_GM_CLEAN_FILL;
  }
  const LS_CLEAN_FILL_BOOTSTRAP = "gmx_clean_fill_bootstrap_v5";

function bootstrapCleanFillDefaults(){
  try{
    if (localStorage.getItem(LS_CLEAN_FILL_BOOTSTRAP) === "1") return;
    localStorage.setItem(LS_GM_CLEAN_FILL, "0");
    localStorage.setItem(LS_GN_CLEAN_FILL, "0");
    localStorage.setItem(LS_CLEAN_FILL_BOOTSTRAP, "1");
  }catch(_e){}
}

function getCleanFillEnabled(kind){
    try{ return localStorage.getItem(lsKeyCleanFill(kind)) === "1"; }catch(_e){ return false; }
  }
  function setCleanFillEnabled(kind, next, silent){
    const on = !!next;
    try{ localStorage.setItem(lsKeyCleanFill(kind), on ? "1" : "0"); }catch(_e){}
    try{ syncCleanFillUi(kind); }catch(_e){}
    if (!silent){
      try{ window.postMessage({ type: "GMX_CLEAN_FILL_SYNC", kind, value: on }, "*"); }catch(_e){}
      try{ window.postMessage({ type: "GMX_SYNC_NOW", reason: "clean_fill_change", kind, value: on }, "*"); }catch(_e){}
    }
    return on;
  }
  bootstrapCleanFillDefaults();

function cleanFillCopy(kind){
    const ru = siteLang() === "ru";
    const on = getCleanFillEnabled(kind);
    return {
      label: ru ? "Best pass" : "Best pass",
      button: on ? (ru ? "Best pass: on" : "Best pass: on") : (ru ? "Best pass: off" : "Best pass: off"),
      hint: on
        ? (ru
            ? "Включено: Best pass после запуска режет shape-дубли в сохранённом списке и добивает недостающее обратно до текущей цели."
            : "On: Best pass prunes shape-level near-duplicates from the saved list, then refills the missing slots back to your current target.")
        : (ru
            ? "Выключено: сначала идёт loose random fill. Если первая пачка слишком узкая, Batch автоматически добирает недостающее. Включай Best pass, когда хочешь ещё и чистить сохранённый банк после запуска."
            : "Off: generation starts as loose random fill. If the first batch comes back too thin, Batch auto-refills the missing slots. Turn Best pass on when you also want the saved bank cleaned after the run."),
      action: ru ? "Run best pass" : "Run best pass"
    };
  }
  function syncCleanFillUi(kind){
    const kinds = kind ? [kind] : ["gm","gn"];
    kinds.forEach((k)=>{
      const copy = cleanFillCopy(k);
      const label = $(k === "gm" ? "gm_anti_label" : "gn_anti_label");
      if (label) label.textContent = copy.label;
      const note = $(k === "gm" ? "gm_repeat_note" : "gn_repeat_note");
      if (note) note.textContent = copy.hint;
      const toggle = $(k + "CleanFillToggle");
      if (toggle){
        toggle.textContent = copy.button;
        toggle.classList.toggle("active", getCleanFillEnabled(k));
        toggle.setAttribute("aria-pressed", getCleanFillEnabled(k) ? "true" : "false");
      }
      const cleanupBtn = $(k + "Cleanup");
      if (cleanupBtn){
        cleanupBtn.style.display = "";
        cleanupBtn.textContent = copy.action;
      }
    });
  }

  // Helpers for LS key selection (used by Pro controls).
  function lsKeyPack(kind){
    return (kind === "gn") ? LS_GN_PACK : LS_GM_PACK;
  }
  function lsKeyAnti(kind){
    return (kind === "gn") ? LS_GN_ANTI : LS_GM_ANTI;
  }

  function lsKeyRecent(kind){
    return (kind === "gn") ? LS_GN_RECENT : LS_GM_RECENT;
  }
  function getRecent(kind){
    try{
      const raw = localStorage.getItem(lsKeyRecent(kind));
      const arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr.filter(x=>typeof x==="string") : [];
    } catch {
      return [];
    }
  }


  
  // ---- Custom background per tab (Themes) ----
  // Migration from old single-key storage:
  const LS_CUSTOM_BG_GLOBAL = "gmx_custom_bg_global";
  const LS_CUSTOM_BG_TAB_PREFIX = "gmx_custom_bg_tab_";

  (function migrateCustomBg(){
    try{
      const legacy = localStorage.getItem(LS_CUSTOM_BG);
      if (legacy && !localStorage.getItem(LS_CUSTOM_BG_GLOBAL)){
        localStorage.setItem(LS_CUSTOM_BG_GLOBAL, legacy);
      }
      if (legacy) localStorage.removeItem(LS_CUSTOM_BG);
    }catch{}
  })();

  function customBgKeyForTab(tab){
    if (!tab || tab === "all") return LS_CUSTOM_BG_GLOBAL;
    return LS_CUSTOM_BG_TAB_PREFIX + tab;
  }
  function getCustomBgForTab(tab){
    const direct = localStorage.getItem(customBgKeyForTab(tab)) || "";
    if (direct) return direct;
    const global = localStorage.getItem(LS_CUSTOM_BG_GLOBAL) || "";
    return global;
  }
  
function clearCustomBgForTab(tab){
  if (!tab) return;
  if (tab === "all"){
    try{ localStorage.removeItem(LS_CUSTOM_BG_GLOBAL); }catch{}
    return;
  }
  try{ localStorage.removeItem(customBgKeyForTab(tab)); }catch{}
}

function setCustomBgForTab(tab, dataUrl){
    const k = customBgKeyForTab(tab);
    if (!dataUrl){
      localStorage.removeItem(k);
    } else {
      localStorage.setItem(k, String(dataUrl));
    }
  }

  
  // Tabs used by Wallpapers / Custom background "Apply to" selectors.
// Must match main nav data-tab values.
const TABS = [
  ["all","wp_apply_all"],
  ["home","wp_apply_home"],
  ["gm","wp_apply_gm"],
  ["gn","wp_apply_gn"],
  ["prediction","wp_apply_prediction"],
  ["referrals","wp_apply_referrals"],
  ["leaderboard","wp_apply_leaderboard"],
  ["themes","wp_apply_themes"],
  ["extthemes","wp_apply_extthemes"],
  ["wallet","wp_apply_wallet"]
];

// Tabs for apply-to selectors visible to all users (no Admin)
const TABS_PUBLIC = TABS;
function listCustomBgUsedTabs(){
    const used = [];
    try{
      // tabs excluding "all"
      TABS.forEach(([k], idx)=>{
        if (k === "all") return;
        const v = localStorage.getItem(customBgKeyForTab(k)) || "";
        if (v) used.push(k);
      });
    }catch{}
    return used;
  }

  function customBgUnlockedTabCount(){
    // How many per-tab targets are eligible (excluding "all") for NEW backgrounds.
    // Free: 3 tabs of choice, then unlock by refs: 10 / 15 / 20 / ... (+5)
    const tabsOnly = TABS.filter(t=>t[0]!=="all");
    if (isPro()) return tabsOnly.length;
    // reuse generic unlock logic with freeCount=3
    return unlockedCountByRefs(tabsOnly.length, 3);
  }

  function canSetCustomBgOnTab(tab){
    if (tab === "all") return true;
    if (isPro()) return true;

    const used = listCustomBgUsedTabs();
    if (used.includes(tab)) return true; // existing slot can always be edited/cleared

    // free: up to 3 tabs of choice
    if (used.length < 3) return true;

    // beyond 3: only if unlocked by refs (Variant A)
    const tabsOnly = TABS.filter(t=>t[0]!=="all").map(t=>t[0]);
    const idx = tabsOnly.indexOf(tab);
    if (idx < 0) return false;
    const unlocked = customBgUnlockedTabCount(); // count of unlocked tabs in ordered list
    return idx < unlocked;
  }

  function requiredRefsForCustomBgTab(tab){
    if (tab === "all") return 0;
    const tabsOnly = TABS.filter(t=>t[0]!=="all").map(t=>t[0]);
    const idx = tabsOnly.indexOf(tab);
    if (idx < 0) return 0;
    // freeCount=3
    return reqRefsForUnlockIndex(idx, 3);
  }

  function applyUserBg(tab){
    const target = tab || currentTabName();

    // Priority: per-tab custom background.
    let data = "";
    try{ data = localStorage.getItem(customBgKeyForTab(target)) || ""; }catch{}

    // Global custom background only applies when there is NO active (unlocked) wallpaper.
    if (!data){
      let wallOk = false;
      try{
        const wid = getWallpaperForTab(target);
        if (wid){
          const wp = WALLPAPERS.find(x=>x.id===wid) || null;
          let idx = -1;
          try{ idx = wp ? WALLPAPERS.findIndex(x=>x.id===wid) : -1; }catch{}
          wallOk = wp ? wallpaperUnlocked(wp, idx) : false;
        }
      }catch{}
      if (!wallOk){
        try{ data = localStorage.getItem(LS_CUSTOM_BG_GLOBAL) || ""; }catch{}
      }
    }

    const on = !!data;
    if (on){
      document.documentElement.style.setProperty("--bg_user", `url("${data}")`);
    } else {
      document.documentElement.style.setProperty("--bg_user", "none");
    }
    document.body.classList.toggle("hasUserBg", on);
  }

  async function fitImageToCoverDataUrl(file, maxW=2560, maxH=1440, quality=0.88){
    // Downscale + crop-to-cover to keep localStorage small and ensure it fits the page.
    // Output: JPEG data URL.
    return new Promise((resolve, reject)=>{
      try{
        const fr = new FileReader();
        fr.onerror = ()=>reject(new Error("read_failed"));
        fr.onload = ()=>{
          const img = new Image();
          img.onerror = ()=>reject(new Error("image_decode_failed"));
          img.onload = ()=>{
            try{
              const iw = img.naturalWidth || img.width || 1;
              const ih = img.naturalHeight || img.height || 1;
              const targetW = Math.min(maxW, iw);
              const targetH = Math.min(maxH, ih);
              const canvas = document.createElement("canvas");
              canvas.width = targetW;
              canvas.height = targetH;
              const ctx = canvas.getContext("2d", { alpha:false });
              // cover crop
              const scale = Math.max(targetW/iw, targetH/ih);
              const sw = targetW/scale;
              const sh = targetH/scale;
              const sx = (iw - sw)/2;
              const sy = (ih - sh)/2;
              ctx.drawImage(img, sx, sy, sw, sh, 0, 0, targetW, targetH);
              const out = canvas.toDataURL("image/jpeg", quality);
              resolve(out);
            }catch(e){ reject(e); }
          };
          img.src = String(fr.result||"");
        };
        fr.readAsDataURL(file);
      }catch(e){ reject(e); }
    });
  }


  function renderCustomBgUI(){ /* merged into wallpapers tab */ }
  function syncCustomBgUI(){ /* merged into wallpapers tab */ }

function readFileAsDataURL(file){
    return new Promise((resolve, reject)=>{
      const r = new FileReader();
      r.onload = ()=>resolve(String(r.result||""));
      r.onerror = ()=>reject(r.error||new Error("read failed"));
      r.readAsDataURL(file);
    });
  }

  function loadImage(src){
    return new Promise((resolve, reject)=>{
      const img = new Image();
      img.onload = ()=>resolve(img);
      img.onerror = ()=>reject(new Error("image load failed"));
      img.src = src;
    });
  }

  async function compressImageToJpegDataURL(file, options){
    const src = await readFileAsDataURL(file);
    const img = await loadImage(src);
    const opts = options || {};
    const profile = String(opts.profile || "generic").toLowerCase();
    const MAX = profile === "site" ? 2560 : (profile === "ext" ? 1600 : 2200);
    const targetRatio = profile === "site" ? (16 / 9) : (profile === "ext" ? (9 / 16) : 0);
    let w = img.naturalWidth || img.width;
    let h = img.naturalHeight || img.height;
    if (!w || !h) return src;
    let sx = 0;
    let sy = 0;
    let sw = w;
    let sh = h;
    if (targetRatio > 0){
      const srcRatio = w / h;
      if (srcRatio > targetRatio){
        sw = Math.max(1, Math.round(h * targetRatio));
        sx = Math.max(0, Math.round((w - sw) / 2));
      } else if (srcRatio < targetRatio){
        sh = Math.max(1, Math.round(w / targetRatio));
        sy = Math.max(0, Math.round((h - sh) / 2));
      }
    }
    const scale = Math.min(1, MAX / Math.max(sw, sh));
    const tw = Math.max(1, Math.round(sw * scale));
    const th = Math.max(1, Math.round(sh * scale));
    const canvas = document.createElement("canvas");
    canvas.width = tw;
    canvas.height = th;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, tw, th);
    return canvas.toDataURL("image/jpeg", 0.88);
  }

  // Background themes per tab (CSS-only, no assets)
  const TAB_THEME = (function(){
    const base = "linear-gradient(180deg, rgba(10,12,18,1) 0%, rgba(8,10,14,1) 100%)";
    const readVar = (name, fallback)=> (getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback);
    const parseRGB = (s)=>{
      // accepts rgb(...) / rgba(...)
      const m = String(s||"").match(/rgba?\((\s*\d+\s*),\s*(\d+)\s*,\s*(\d+)/i);
      if (m) return { r:+m[1], g:+m[2], b:+m[3] };
      return { r:124, g:92, b:255 };
    };
    const tint = (s, a)=>{
      const c = parseRGB(s);
      return `rgba(${c.r},${c.g},${c.b},${a})`;
    };
    const A = (a)=> tint(readVar("--accentA","rgba(124,92,255,1)"), a);
    const B = (a)=> tint(readVar("--accentB","rgba(0,229,255,1)"), a);

    function mk(aX,aY,bX,bY, extra=""){
      const layers = [
        `radial-gradient(1200px 620px at ${aX}% ${aY}%, ${A(.22)}, transparent 60%)`,
        `radial-gradient(900px 520px at ${bX}% ${bY}%, ${B(.18)}, transparent 58%)`,
        `radial-gradient(760px 440px at 60% 100%, ${A(.10)}, transparent 62%)`,
        `radial-gradient(720px 420px at 10% 92%, ${B(.08)}, transparent 65%)`,
        base
      ];
      if (extra) layers.unshift(extra);
      return layers.join(", ");
    }

    const stripe135 = "repeating-linear-gradient(135deg, rgba(255,255,255,.04) 0 2px, transparent 2px 10px)";
    const stripe90  = "repeating-linear-gradient(90deg, rgba(255,255,255,.035) 0 2px, transparent 2px 12px)";
    const sheen45   = `linear-gradient(135deg, rgba(255,255,255,.04), transparent 55%)`;
    const sheen225  = `linear-gradient(225deg, rgba(255,255,255,.04), transparent 60%)`;
    const sheenA    = ()=> `linear-gradient(135deg, ${A(.10)}, transparent 55%)`;
    const sheenB    = ()=> `linear-gradient(135deg, ${B(.10)}, transparent 60%)`;
    const conicGM   = ()=> `conic-gradient(from 210deg at 18% 22%, ${A(.12)}, transparent 35%, ${B(.10)}, transparent 70%)`;
    const conicGN   = ()=> `conic-gradient(from 180deg at 80% 20%, ${B(.12)}, transparent 40%, ${A(.10)}, transparent 75%)`;
    const conicPay  = "conic-gradient(from 230deg at 50% 10%, rgba(255,255,255,.05), transparent 25%, rgba(255,255,255,.04), transparent 60%)";
    const topSoft   = "linear-gradient(0deg, rgba(255,255,255,.03), transparent 45%)";
    const topSoft2  = "linear-gradient(180deg, rgba(255,255,255,.03), transparent 60%)";

    return {
      home:      ()=> mk(20,10,80,20),
      gm:        ()=> mk(22,12,76,18, conicGM()),
      gn:        ()=> mk(18,18,82,14, conicGN()),

      studio:    ()=> mk(18,12,82,24, sheenA()),
      packs:     ()=> mk(24,14,78,26, sheenB()),
      bulk:      ()=> mk(20,16,86,18, stripe135),
      history:   ()=> mk(16,16,84,22, topSoft),
      favorites: ()=> mk(24,10,78,20, topSoft2),

      referrals: ()=> mk(20,14,86,22, stripe90),
      prediction:()=> mk(18,12,82,22, conicPay),
      themes:    ()=> mk(18,10,84,20, sheen45),
      extthemes: ()=> mk(18,12,82,22, sheen225),
      wallet:    ()=> mk(22,12,76,22, conicPay)
    };
  })();


  // Wallpapers — per-tab. Honest catalog: 2 free SVG + 50 pack slots + 8 premium lux wallpapers = 60 total.
  const LS_WP_GLOBAL = "gmx_wp_all";
  const LS_WP_TAB_PREFIX = "gmx_wp_tab_"; // + tab name
  const SITE_WALLPAPER_FREE = [
    ["free01", "Free — Solana Waves"],
    ["free02", "Free — Solflare Glow"],
  ];
  const SITE_WALLPAPER_PACK_COUNT = 58;
  const SITE_WALLPAPER_FREE_PACK_COUNT = 10;
  const SITE_WALLPAPER_LUX = [
    ["lux_anime_neon_alley", "Anime Neon Alley"],
    ["lux_cinematic_heroes", "Cinematic Heroes"],
    ["lux_ct_warroom", "CT War Room"],
    ["lux_degen_terminal", "Degen Terminal"],
    ["lux_nft_gallery", "NFT Gallery"],
    ["lux_noir_detective", "Noir Detective"],
    ["lux_onchain_spaceport", "Onchain Spaceport"],
    ["lux_solana_temple", "Solana Temple"],
  ];
  const CRYPTO_SITE_WALL_SOURCES = [];
  function buildSiteWallpapers(){
    const out = SITE_WALLPAPER_FREE.map(([id, name])=>({ id, name, tier:"free" }));
    for (let i=1; i<=SITE_WALLPAPER_PACK_COUNT; i++){
      const n = String(i).padStart(3, "0");
      out.push({
        id: `v2_${n}`,
        name: `Aurora #${n}`,
        tier: i <= SITE_WALLPAPER_FREE_PACK_COUNT ? "free" : "premium"
      });
    }
    for (const [id, name] of SITE_WALLPAPER_LUX) out.push({ id, name, tier:"premium" });
    return out;
  }
  const WALLPAPERS = buildSiteWallpapers();
  const WALLPAPER_REFRESH_MIGRATION_KEY = "gmx_wallpaper_refresh_20260318";
  function migrateLegacyWallpaperSelectionOnce(){
    try{
      if (localStorage.getItem(WALLPAPER_REFRESH_MIGRATION_KEY) === "1") return;
      // keep IDs stable; visual refresh now happens in URL resolver
      localStorage.setItem(WALLPAPER_REFRESH_MIGRATION_KEY, "1");
    }catch{}
  }

  const WALLPAPER_TABS = [
    ["all","wp_apply_all"],
    ["home","wp_apply_home"],
    ["gm","wp_apply_gm"],
    ["gn","wp_apply_gn"],
    ["prediction","wp_apply_prediction"],
    ["studio","wp_apply_studio"],
    ["packs","wp_apply_packs"],
    ["bulk","wp_apply_bulk"],
    ["history","wp_apply_history"],
    ["favorites","wp_apply_favorites"],
    ["referrals","wp_apply_referrals"],
    ["themes","wp_apply_themes"],
    ["extthemes","wp_apply_extthemes"],
    ["wallet","wp_apply_wallet"]
  ];

  const CUSTOM_WP_RE = /^custom_[a-zA-Z0-9_.-]+\.(png|jpg|jpeg|webp)$/i;
  const CUSTOM_WP_FREE_COUNT = 5;
  const CUSTOM_UPLOAD_ID = "custom_upload";
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
    const v = String(id||"").trim();
    if (!v) return "";
    if (WALLPAPERS.some(x=>x.id===v)) return v;
    if (v === CUSTOM_UPLOAD_ID) return v;
    if (CUSTOM_WP_RE.test(v)) return v;
    // migrate legacy svg ids (w01..w99) or removed v3 ids to a safe default
    if (/^w\d+$/i.test(v) || /^v3_\d+$/i.test(v)) return (WALLPAPERS.find(x=>x.id==="v2_001")?"v2_001":"free01");
    return (WALLPAPERS.find(x=>x.id==="v2_001")?"v2_001":"free01");
  }

  function normalizeAllWallpapers(){
    try{
      const g = normalizeWallpaperId(localStorage.getItem(LS_WP_GLOBAL));
      if (g) localStorage.setItem(LS_WP_GLOBAL, g);
      else localStorage.removeItem(LS_WP_GLOBAL);
    }catch{}
    try{
      for (const [tab] of WALLPAPER_TABS){
        const k = wallpaperKeyForTab(tab);
        const cur = localStorage.getItem(k);
        const norm = normalizeWallpaperId(cur);
        if (norm) localStorage.setItem(k, norm);
        else localStorage.removeItem(k);
      }
    }catch{}
  }
  normalizeAllWallpapers();

  function normalizeExtWallpaperIdLocal(id){
    const v = String(id||"").trim();
    if (!v) return "";
    if (EXT_WALLPAPERS.some(x=>String(x.id||"").toLowerCase()===v.toLowerCase())) return v;
    if (v === CUSTOM_UPLOAD_ID) return v;
    if (CUSTOM_WP_RE.test(v)) return v;
    let m = v.match(/^extv3_(\d{1,2})$/i);
    if (m){
      const n = String(Math.max(1, Math.min(58, Number(m[1]) || 1))).padStart(2, "0");
      return `extv3_${n}`;
    }
    m = v.match(/^ext_free_(\d{1,2})$/i);
    if (m){
      const n = String(Math.max(1, Math.min(2, Number(m[1]) || 1))).padStart(2, "0");
      return `ext_free_${n}`;
    }
    m = v.match(/^ext_(\d{1,2})$/i);
    if (m){
      const num = Math.max(1, Math.min(58, Number(m[1]) || 1));
      return `extv3_${String(num).padStart(2, "0")}`;
    }
    if (/^lux_ext_[a-z0-9_]+$/i.test(v)) return v;
    return "ext_free_01";
  }

  function svgDataUri(svg){
    return `data:image/svg+xml;utf8,${encodeURIComponent(String(svg || ""))}`;
  }

  const SITE_PACK_PALETTES = [
    { coin: "BTC", c1: "#f7931a", c2: "#ffb347", vibe: "Bitcoin orange" },
    { coin: "ETH", c1: "#627eea", c2: "#c2d9ff", vibe: "Ethereum blue" },
    { coin: "SOL", c1: "#9945ff", c2: "#14f195", vibe: "Solana gradient" },
    { coin: "AVAX", c1: "#e84142", c2: "#ff6b6b", vibe: "Avalanche red" },
    { coin: "ARB", c1: "#28a0f0", c2: "#00d4ff", vibe: "Arbitrum cyan" },
    { coin: "OP", c1: "#ff0420", c2: "#ff6b7a", vibe: "Optimism red" },
    { coin: "SUI", c1: "#6fbcf0", c2: "#00b4d8", vibe: "Sui blue" },
    { coin: "BNB", c1: "#f3ba2f", c2: "#fcd535", vibe: "BNB gold" },
    { coin: "DOGE", c1: "#c2a633", c2: "#e8d44d", vibe: "Dogecoin" },
    { coin: "XRP", c1: "#23292f", c2: "#00aae4", vibe: "XRP ripple" },
    { coin: "LINK", c1: "#2a5ada", c2: "#375bd2", vibe: "Chainlink" },
    { coin: "APT", c1: "#12b3a8", c2: "#00ffdd", vibe: "Aptos teal" }
  ];

  function sitePackWallpaperDataUri(id, thumb){
    const n = Math.max(1, Number(String(id || "").slice(3)) || 1);
    const p = SITE_PACK_PALETTES[(n - 1) % SITE_PACK_PALETTES.length];
    const w = thumb ? 480 : 1920;
    const h = thumb ? 270 : 1080;
    const blur = thumb ? 60 : 180;
    const orbs = [
      { cx: 0.15 + (n % 7) * 0.1, cy: 0.2, r: 0.4, c: p.c1, op: 0.22 },
      { cx: 0.85 - (n % 5) * 0.08, cy: 0.75, r: 0.35, c: p.c2, op: 0.18 },
      { cx: 0.5 + (n % 3) * 0.15, cy: 0.5, r: 0.3, c: p.c1, op: 0.08 },
      { cx: 0.3, cy: 0.9, r: 0.25, c: p.c2, op: 0.12 },
      { cx: 0.7, cy: 0.1, r: 0.2, c: p.c1, op: 0.1 }
    ];
    const orbEls = orbs.map((o,i)=>`<ellipse cx="${w*o.cx}" cy="${h*o.cy}" rx="${w*o.r}" ry="${h*o.r*0.6}" fill="${o.c}" opacity="${o.op}" filter="url(#blur)"/>`).join("");
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}"><defs><linearGradient id="bg" x1="0" x2="1" y1="0" y2="1"><stop offset="0%" stop-color="#070a12"/><stop offset="50%" stop-color="#0a0e18"/><stop offset="100%" stop-color="#050810"/></linearGradient><radialGradient id="top" cx="0.5" cy="0" r="1"><stop offset="0%" stop-color="${p.c1}" stop-opacity="0.15"/><stop offset="100%" stop-color="transparent"/></radialGradient><filter id="blur"><feGaussianBlur stdDeviation="${blur}"/></filter></defs><rect width="${w}" height="${h}" fill="url(#bg)"/>${orbEls}<rect width="${w}" height="${h}" fill="url(#top)" opacity="0.6"/></svg>`;
    return svgDataUri(svg);
  }

  const EXT_PACK_PALETTES = [
    { tag: "GM", c1: "#9945ff", c2: "#14f195" },
    { tag: "DEGEN", c1: "#ff6b35", c2: "#f7931a" },
    { tag: "ALPHA", c1: "#00d4ff", c2: "#7c3aed" },
    { tag: "WAGMI", c1: "#22c55e", c2: "#10b981" },
    { tag: "NGMI", c1: "#ef4444", c2: "#f97316" },
    { tag: "LFG", c1: "#8b5cf6", c2: "#ec4899" },
    { tag: "SER", c1: "#06b6d4", c2: "#3b82f6" },
    { tag: "APE", c1: "#eab308", c2: "#f59e0b" },
    { tag: "MOON", c1: "#a855f7", c2: "#6366f1" },
    { tag: "CHAD", c1: "#14b8a6", c2: "#0d9488" },
    { tag: "SIZE", c1: "#f43f5e", c2: "#ec4899" },
    { tag: "CT", c1: "#64748b", c2: "#94a3b8" }
  ];

  function extPackWallpaperDataUri(id, thumb){
    const n = Math.max(1, Number(String(id || "").slice(6)) || 1);
    const p = EXT_PACK_PALETTES[(n - 1) % EXT_PACK_PALETTES.length];
    const w = thumb ? 360 : 1080;
    const h = thumb ? 640 : 1920;
    const blur = thumb ? 40 : 120;
    const orbs = [
      { cx: 0.2 + (n % 5) * 0.1, cy: 0.25, r: 0.5, c: p.c1, op: 0.2 },
      { cx: 0.8 - (n % 4) * 0.1, cy: 0.7, r: 0.4, c: p.c2, op: 0.18 },
      { cx: 0.5, cy: 0.5, r: 0.35, c: p.c1, op: 0.06 }
    ];
    const orbEls = orbs.map(o=>`<ellipse cx="${w*o.cx}" cy="${h*o.cy}" rx="${w*o.r}" ry="${h*o.r*0.8}" fill="${o.c}" opacity="${o.op}" filter="url(#blur)"/>`).join("");
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}"><defs><linearGradient id="bg" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stop-color="#070a12"/><stop offset="100%" stop-color="#050810"/></linearGradient><filter id="blur"><feGaussianBlur stdDeviation="${blur}"/></filter></defs><rect width="${w}" height="${h}" fill="url(#bg)"/>${orbEls}</svg>`;
    return svgDataUri(svg);
  }

  function extWallpaperAssetPath(id){
    const norm = normalizeExtWallpaperIdLocal(id);
    if (!norm) return "";
    if (norm.startsWith("extv3_")) {
      const lux = EXT_WALLPAPER_LUX.map(([v])=>String(v || "")).filter(Boolean);
      const num = Math.max(1, Number(norm.slice(6)) || 1);
      const mapped = lux.length ? lux[(num - 1) % lux.length] : norm;
      if (mapped.startsWith("lux_ext_")) return mapped + ".svg";
      return norm + ".webp";
    }
    return norm + ".svg";
  }

  function extWallpaperFullUrl(id){
    const norm = normalizeExtWallpaperIdLocal(id);
    if (!norm) return "";
    if (norm === CUSTOM_UPLOAD_ID){
      try{ return localStorage.getItem(LS_EXT_CUSTOM_BG_GLOBAL) || ""; }catch{ return ""; }
    }
    if (norm.startsWith("custom_")) return `/assets/extbg/custom/${norm.slice(7)}?v=${ASSET_REV}`;
    if (norm.startsWith("extv3_")) return `/assets/extbg/${norm}.webp?v=${ASSET_REV}`;
    const p = extWallpaperAssetPath(norm);
    return p ? `/assets/extbg/${p}?v=${ASSET_REV}` : "";
  }

  function extWallpaperThumbUrl(id){
    const norm = normalizeExtWallpaperIdLocal(id);
    if (!norm) return "";
    if (norm === CUSTOM_UPLOAD_ID){
      try{ return localStorage.getItem(LS_EXT_CUSTOM_BG_GLOBAL) || ""; }catch{ return ""; }
    }
    if (norm.startsWith("custom_")) return `/assets/extbg/custom/${norm.slice(7)}?v=${ASSET_REV}`;
    if (norm.startsWith("extv3_")) return `/assets/extbg/thumbs/${norm}.webp?v=${ASSET_REV}`;
    return `/assets/extbg/${norm}.svg?v=${ASSET_REV}`;
  }
  try{
    const cur = localStorage.getItem(LS_EXT_WP);
    const norm = normalizeExtWallpaperIdLocal(cur);
    if (norm) localStorage.setItem(LS_EXT_WP, norm);
    else localStorage.removeItem(LS_EXT_WP);
  }catch{}

  const TOP_LEVEL_TABS = ["home","gm","gn","prediction","referrals","leaderboard","themes","extthemes","wallet","admin"];
  function normalizeTopLevelTab(raw){
    const name = String(raw || "").trim().toLowerCase();
    if (name === "upgrade") return "wallet";
    if (name === "extension-themes" || name === "extthemes") return "extthemes";
    return TOP_LEVEL_TABS.includes(name) ? name : "home";
  }

  let CURRENT_TAB = "home";
  function currentTabName(){ return CURRENT_TAB; }

  function wallpaperKeyForTab(tab){
    if (!tab || tab === "all") return LS_WP_GLOBAL;
    return LS_WP_TAB_PREFIX + tab;
  }

  function getWallpaperForTab(tab){
    const direct = localStorage.getItem(wallpaperKeyForTab(tab)) || "";
    if (direct) return direct;
    const global = localStorage.getItem(LS_WP_GLOBAL) || "";
    return global;
  }

  function setWallpaperForTab(tab, id){
    const k = wallpaperKeyForTab(tab);
    if (!id) localStorage.removeItem(k);
    else localStorage.setItem(k, id);
  }

  function wallpaperAssetPath(id){
    if (!id) return "";
    if (typeof id === "string" && id.startsWith("v2_")) {
      const lux = SITE_WALLPAPER_LUX.map(([v])=>String(v || "")).filter(Boolean);
      const num = Math.max(1, Number(String(id).slice(3)) || 1);
      const mapped = lux.length ? lux[(num - 1) % lux.length] : id;
      if (mapped.startsWith("lux_")) return mapped + ".svg";
      return id + ".webp";
    }
    return String(id) + ".svg";
  }

  function wallpaperFullUrl(id){
    const norm = normalizeWallpaperId(id);
    if (!norm) return "";
    if (norm === CUSTOM_UPLOAD_ID){
      try{ return localStorage.getItem(LS_CUSTOM_BG_GLOBAL) || ""; }catch{ return ""; }
    }
    if (norm.startsWith("custom_")) return `/assets/wallpapers/custom/${norm.slice(7)}?v=${ASSET_REV}`;
    if (norm.startsWith("v2_")) return `/assets/wallpapers/${norm}.webp?v=${ASSET_REV}`;
    const p = wallpaperAssetPath(norm);
    return p ? `/assets/wallpapers/${p}?v=${ASSET_REV}` : "";
  }

  function wallpaperThumbUrl(id){
    const norm = normalizeWallpaperId(id);
    if (!norm) return "";
    if (norm === CUSTOM_UPLOAD_ID){
      try{ return localStorage.getItem(LS_CUSTOM_BG_GLOBAL) || ""; }catch{ return ""; }
    }
    if (norm.startsWith("custom_")) return `/assets/wallpapers/custom/${norm.slice(7)}?v=${ASSET_REV}`;
    if (norm.startsWith("v2_")) return `/assets/wallpapers/thumbs/${norm}.webp?v=${ASSET_REV}`;
    return `/assets/wallpapers/${norm}.svg?v=${ASSET_REV}`;
  }

  function wallpaperUrl(id){
    const full = wallpaperFullUrl(id);
    return full ? `url("${full}")` : "none";
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
  function applyWallpaper(tab){
    const id = getWallpaperForTab(tab);
    const effectiveCustom = effectiveCustomWallpapersSite();
    const allWps = [...effectiveCustom, ...WALLPAPERS];
    const wp = effectiveCustom.find(x=>x.id===id) || WALLPAPERS.find(x=>x.id===id) || null;
    let idx = -1;
    try{ idx = wp ? allWps.findIndex(x=>x.id===id) : -1; }catch{}
    const ok = wp ? wallpaperUnlocked(wp, idx, effectiveCustom.length) : true;

    const css = (id && ok) ? wallpaperUrl(id) : "none";
    document.documentElement.style.setProperty("--bg_wall", css);
    const on = css !== "none";
    document.body.classList.toggle("hasWallBg", on);
    document.body.classList.toggle("has-wallpaper", on);
  }

  
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



function renderWallpaperUI(){
    const tabSel = $("wpTab");
    const grid = $("wpGrid");
    const st = $("wpStatus");
    if (!tabSel || !grid || !st) return;

    // fill select (keep value across re-render; re-renders on UI language changes)
    const prev = tabSel.value || "all";
    tabSel.innerHTML = "";
    for (const [v,l] of WALLPAPER_TABS){
      const o = document.createElement("option");
      o.value = v;
      o.textContent = trWp(l);
      tabSel.appendChild(o);
    }
    // restore previous selection if still present
    try{
      const ok = Array.from(tabSel.options).some(o=>o.value===prev);
      tabSel.value = ok ? prev : "all";
    }catch{}

    const targetTab = tabSel.value || "all";
    const activeId = (targetTab === "all")
      ? (localStorage.getItem(LS_WP_GLOBAL) || "")
      : (localStorage.getItem(wallpaperKeyForTab(targetTab)) || "");

    const effectiveCustom = effectiveCustomWallpapersSite();
    const allWps = [...effectiveCustom, ...WALLPAPERS];
    const mainUnlocked = unlockedCountByRefs(WALLPAPERS.length, FREE_VISIBLE_WALLPAPERS);
    const customUnlocked = Math.min(effectiveCustom.length, isPro() ? effectiveCustom.length : CUSTOM_WP_FREE_COUNT);
    const unlocked = mainUnlocked + customUnlocked;
    const unlockedAll = isPro() || unlocked >= allWps.length;
    const nextReq = reqRefsForUnlockIndex(unlockedCountByRefs(WALLPAPERS.length, FREE_VISIBLE_WALLPAPERS), FREE_VISIBLE_WALLPAPERS);
    st.innerHTML = unlockedAll
      ? `<span class="ok">Unlocked.</span> All wallpapers available. First ${CUSTOM_WP_FREE_COUNT} custom free, rest Pro.`
      : `<span class="warn">Locked.</span> First ${FREE_VISIBLE_WALLPAPERS} main + ${CUSTOM_WP_FREE_COUNT} custom free. Next unlock at <b>${nextReq} ref</b>.`;

    loadCustomWallpapers().then((loaded)=>{
      if (loaded && document.contains(grid)) renderWallpaperUI();
    });

    const items = allWps.map((wp, idx)=>({ wp, idx }));
    chunkedRender(grid, items, ({ wp, idx })=>{
      const isUnlocked = wallpaperUnlocked(wp, idx, effectiveCustom.length);
      const card = document.createElement("button");
      card.type = "button";
      card.dataset.wpId = wp.id;
      const mainIdx = wp.tier === "custom" ? -1 : (idx - effectiveCustom.length);
      card.dataset.tier = wp.tier || (mainIdx >= 0 && mainIdx < FREE_VISIBLE_WALLPAPERS ? "free" : "premium");
      card.className = "wpCard" + (isUnlocked ? "" : " mystery") + (wp.id===activeId ? " active" : "");

      const thumb = document.createElement("div");
      thumb.className = "wpThumb";
      const thumbUrl = wallpaperThumbUrl(wp.id);
      const fullUrl = wallpaperFullUrl(wp.id);
      if (thumbUrl) thumb.setAttribute('data-bg', thumbUrl);
      observeLazyBg(thumb);
      // Warm cache for instant apply.
      if (isUnlocked && fullUrl){
        card.addEventListener('pointerenter', ()=>{ try{ prefetchImage(fullUrl); }catch{} }, { passive:true });
      }

      const name = document.createElement("div");
      name.className = "wpName";
      name.textContent = wp.name;

      const meta = document.createElement("div");
      meta.className = "wpMeta";
      meta.textContent = (wp.tier === "custom") ? "Custom" : ((mainIdx >= 0 && mainIdx < FREE_VISIBLE_WALLPAPERS) ? "Free" : (isPro() ? "Pro" : "Locked"));

      const tag = document.createElement("div");
      tag.className = "wpTag";
      tag.textContent = (wp.tier === "custom") ? "CUSTOM" : ((mainIdx >= 0 && mainIdx < FREE_VISIBLE_WALLPAPERS) ? "FREE" : (isUnlocked ? "UNLOCKED" : (reqRefsForUnlockIndex(mainIdx, FREE_VISIBLE_WALLPAPERS) + " ref")));

      card.appendChild(thumb);
      card.appendChild(name);
      card.appendChild(meta);
      card.appendChild(tag);

      if (!isUnlocked){
        const ov = document.createElement("div");
        ov.className = "mysteryOverlay";
        ov.textContent = (t("locked")||"LOCKED");
        card.appendChild(ov);
      }

      card.addEventListener("click", ()=>{
        if (!isUnlocked){
          const reqIdx = wp.tier === "custom" ? idx : (idx - effectiveCustom.length);
          toast("warn", (t("locked_unlock_at") || "Locked. Unlock at {n} referrals (+1 every 3 refs at first, then +1 every 4) or Pro.").replace("{n}", String(reqRefsForUnlockIndex(reqIdx, FREE_VISIBLE_WALLPAPERS))));
          return;
        }

        if (targetTab === "all"){
          localStorage.setItem(LS_WP_GLOBAL, wp.id);
        } else {
          setWallpaperForTab(targetTab, wp.id);
        }

        // Avoid full grid re-render (prevents UI freeze).
        const newActive = (targetTab === 'all')
          ? (localStorage.getItem(LS_WP_GLOBAL) || '')
          : (localStorage.getItem(wallpaperKeyForTab(targetTab)) || '');
        markWallpaperSelection(newActive);

        // Preview: apply to selected tab (not to the Themes tab).
        const previewTab = (targetTab === "all") ? currentTabName() : targetTab;
        // Preload before applying (smooth, avoids jank on first paint).
        const _full = wallpaperFullUrl(wp.id);
        if (_full){
          prefetchImage(_full).finally(()=>{
            applyUserBg(previewTab);
            applyWallpaper(previewTab);
          });
        } else {
          applyUserBg(previewTab);
          applyWallpaper(previewTab);
        }
      });

      return card;
    }, { key: "wpGrid", chunk: 12 });
  }
// Theme / Wallpaper toggle inside Themes tab
  const LS_THEMEWALL_VIEW = "gmx_themewall_view"; // "theme" | "wall" | "custom"

  function setThemeWallView(view){
    const themeBtn  = $("tabTheme");
    const wallBtn   = $("tabWall");
    const themePane  = $("themePane");
    const wallPane   = $("wallPane");
    const wpNote = $("wp_note");
    if (!themeBtn || !wallBtn || !themePane || !wallPane) return;

    const v = (view === "wall") ? "wall" : "theme";
    localStorage.setItem(LS_THEMEWALL_VIEW, v);

    const themeOn  = (v === "theme");
    const wallOn   = (v === "wall");

    themeBtn.classList.toggle("active", themeOn);
    wallBtn.classList.toggle("active", wallOn);

    themeBtn.setAttribute("aria-selected", themeOn ? "true" : "false");
    wallBtn.setAttribute("aria-selected", wallOn ? "true" : "false");

    themePane.classList.toggle("hidden", !themeOn);
    wallPane.classList.toggle("hidden", !wallOn);

    if (wpNote) wpNote.classList.toggle("hidden", !wallOn);

    if (wallOn){
      try{ renderWallpaperUI(); }catch{}
    }
  }

  function initThemeWallTabs(){
    const themeBtn  = $("tabTheme");
    const wallBtn   = $("tabWall");
    if (themeBtn)  themeBtn.addEventListener("click", ()=>setThemeWallView("theme"));
    if (wallBtn)   wallBtn.addEventListener("click",  ()=>setThemeWallView("wall"));

    const saved = localStorage.getItem(LS_THEMEWALL_VIEW) || "theme";
    setThemeWallView(saved === "custom" ? "wall" : saved);
  }


  function initWallpapers(){
  if (initWallpapers._done) return;
  initWallpapers._done = true;
    const tabSel = $("wpTab");
    const clearBtn = $("wpClear");
    if (tabSel){
      tabSel.addEventListener("change", ()=>{
        renderWallpaperUI();
      });
    }
    if (clearBtn){
      clearBtn.addEventListener("click", ()=>{
        const targetTab = ($("wpTab")?.value || "all");
        if (targetTab === "all") localStorage.removeItem(LS_WP_GLOBAL);
        else setWallpaperForTab(targetTab, "");
        renderWallpaperUI();
        const previewTab = (targetTab === "all") ? currentTabName() : targetTab;
        applyUserBg(previewTab);
        applyWallpaper(previewTab);
        toast("ok", (t("toast_wallpaper_cleared")||"Wallpaper cleared."));
      });
    }
    renderWallpaperUI();
  }
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
