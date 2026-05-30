(async () => {
  const API = location.origin;

  const ADMIN_HANDLE = "@Kristofer_Sol_";
  let SAVE_CAP_FREE = 50;
  const EMPTY = "__EMPTY__";

  let SUB = null;
  let REF_COUNT = 0;
  let AUTH_OK = false;
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
const FREE_VISIBLE_THEMES = 8;
const FREE_VISIBLE_STYLES = 5;
const FREE_VISIBLE_PACKS = 2;
const FREE_VISIBLE_WALLPAPERS = 8;
const FREE_VISIBLE_EXT_THEMES = 4;
const FREE_VISIBLE_EXT_WALLPAPERS = 6;
const ASSET_REV = "20260310a";

function reqRefsForUnlockIndex(idx, freeCount=FREE_VISIBLE_THEMES){
  if (idx < freeCount) return 0;
  const k = (idx - freeCount) + 1;
  if (k <= 8) return k * 3;
  return 24 + (k - 8) * 4;
}
function unlockedCountByRefs(total, freeCount=FREE_VISIBLE_THEMES){
  if (isPro()) return total;
  const r = Number(REF_COUNT||0);
  if (total <= freeCount) return total;
  const extraFast = Math.min(8, Math.floor(r / 3));
  const extraSlow = (r > 24) ? Math.floor((r - 24) / 4) : 0;
  const extra = extraFast + extraSlow;
  return Math.min(total, freeCount + extra);
}






  // ----- UI performance helpers -----
  const __GRID_JOBS = Object.create(null);
  function chunkedRender(grid, items, renderItem, opts){
    try{
      if (!grid) return;
      const o = opts || {};
      const key = String(o.key || grid.id || "grid");
      const chunk = Math.max(8, Number(o.chunk || 24));
      __GRID_JOBS[key] = (Number(__GRID_JOBS[key] || 0) + 1);
      const token = __GRID_JOBS[key];
      grid.innerHTML = "";
      let i = 0;
      const step = ()=>{
        if (__GRID_JOBS[key] !== token) return;
        const frag = document.createDocumentFragment();
        const end = Math.min(i + chunk, items.length);
        for (; i < end; i++){
          const el = renderItem(items[i], i);
          if (el) frag.appendChild(el);
        }
        grid.appendChild(frag);
        if (i < items.length) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }catch(_e){
      // worst-case fallback: render synchronously
      try{
        grid.innerHTML = "";
        const frag = document.createDocumentFragment();
        items.forEach((it, idx)=>{ const el = renderItem(it, idx); if (el) frag.appendChild(el); });
        grid.appendChild(frag);
      }catch{}
    }
  }

  async function yieldToUiFrame(){
    await new Promise((resolve)=>{
      try{
        if (typeof requestAnimationFrame === "function"){
          requestAnimationFrame(()=>resolve());
          return;
        }
      }catch{}
      setTimeout(()=>resolve(), 0);
    });
  }

  let __LAZY_OBSERVER = null;
  function observeLazyBg(el){
    try{
      if (!el) return;
      const bg = el.getAttribute("data-bg");
      if (!bg) return;
      if (!('IntersectionObserver' in window)){
        el.style.backgroundImage = `url('${bg}')`;
        el.removeAttribute("data-bg");
        return;
      }
      if (!__LAZY_OBSERVER){
        __LAZY_OBSERVER = new IntersectionObserver((entries)=>{
          for (const e of entries){
            if (!e.isIntersecting) continue;
            const node = e.target;
            const url = node.getAttribute("data-bg");
            if (url){
              node.style.backgroundImage = `url('${url}')`;
              node.removeAttribute("data-bg");
            }
            try{ __LAZY_OBSERVER.unobserve(node); }catch{}
          }
        }, { rootMargin: "240px" });
      }
      __LAZY_OBSERVER.observe(el);
    }catch{}
  }

const __IMG_PREFETCH = new Map();
function prefetchImage(url){
  try{
    const u = String(url||'').trim();
    if (!u) return Promise.resolve(false);
    if (__IMG_PREFETCH.has(u)) return __IMG_PREFETCH.get(u);
    const p = new Promise((resolve)=>{
      try{
        const img = new Image();
        img.decoding = 'async';
        img.loading = 'eager';
        img.referrerPolicy = 'no-referrer';
        img.onload = async ()=>{
          try{ if (img.decode) await img.decode(); }catch{}
          resolve(true);
        };
        img.onerror = ()=>resolve(false);
        img.src = u;
      }catch{ resolve(false); }
    });
    __IMG_PREFETCH.set(u, p);
    return p;
  }catch{
    return Promise.resolve(false);
  }
}

async function postEvent(type, meta){
  try{
    const tok = String(localStorage.getItem(LS_TOKEN) || "").trim();
    if (!tok) return;
    await fetch(API + "/api/event", {
      method:"POST",
      headers:{ "Content-Type":"application/json", "Authorization":"Bearer " + tok },
      body: JSON.stringify({ type, meta: meta || null })
    });
  }catch{}
}

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
  const SITE_WALLPAPER_PACK_COUNT = 8;
  const SITE_WALLPAPER_FREE_PACK_COUNT = 6;
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
  const CRYPTO_SITE_WALL_SOURCES = [
    "https://source.unsplash.com/1920x1080/?bitcoin,crypto,trading,neon",
    "https://source.unsplash.com/1920x1080/?ethereum,blockchain,night,city",
    "https://source.unsplash.com/1920x1080/?solana,crypto,gradient,technology",
    "https://source.unsplash.com/1920x1080/?dogecoin,meme,crypto,neon",
    "https://source.unsplash.com/1920x1080/?bonk,crypto,market,screen",
    "https://source.unsplash.com/1920x1080/?x,finance,charts,neon",
    "https://source.unsplash.com/1920x1080/?trading,terminal,crypto,desk",
    "https://source.unsplash.com/1920x1080/?blockchain,network,glow,dark"
  ];
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
      const n = String(Math.max(1, Math.min(50, Number(m[1]) || 1))).padStart(2, "0");
      return `extv3_${n}`;
    }
    m = v.match(/^ext_free_(\d{1,2})$/i);
    if (m){
      const n = String(Math.max(1, Math.min(2, Number(m[1]) || 1))).padStart(2, "0");
      return `ext_free_${n}`;
    }
    m = v.match(/^ext_(\d{1,2})$/i);
    if (m){
      const num = Math.max(1, Math.min(50, Number(m[1]) || 1));
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
    if (norm.startsWith("extv3_")) return extPackWallpaperDataUri(norm, false);
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
    if (norm.startsWith("extv3_")) return extPackWallpaperDataUri(norm, true);
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
    if (norm.startsWith("v2_")) return sitePackWallpaperDataUri(norm, false);
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
    if (norm.startsWith("v2_")) return sitePackWallpaperDataUri(norm, true);
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
    document.body.classList.toggle("hasWallBg", css !== "none");
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
  // ----- Themes + Writing Styles (gating) -----
// Free: first 10 items
// Referrals: unlock 1 item at 10 refs, then +1 per +5 refs
// Pro: unlock all
  const THEMES = [
    { id:"classic",  name:"Classic Glass", note:"Default neon glass", a:"rgba(124,92,255,1)", b:"rgba(0,229,255,1)" },
    { id:"midnight", name:"Midnight",      note:"Cool blue glow",    a:"rgba(98,114,255,1)",  b:"rgba(0,200,255,1)" },
    { id:"sunrise",  name:"Sunrise",       note:"Warm gradient",     a:"rgba(255,122,0,1)",   b:"rgba(255,75,145,1)" },
    { id:"emerald",  name:"Emerald",       note:"Fresh green",       a:"rgba(0,229,125,1)",   b:"rgba(0,200,255,1)" },
    { id:"gold",     name:"Gold Rush",     note:"Premium gold",      a:"rgba(255,210,77,1)",  b:"rgba(255,122,0,1)" },

    { id:"berry",    name:"Berry",         note:"Vibrant magenta",   a:"rgba(255,75,145,1)",  b:"rgba(124,92,255,1)" },
    { id:"ice",      name:"Ice",           note:"Bright icy",        a:"rgba(0,229,255,1)",   b:"rgba(200,245,255,1)" },
    { id:"lava",     name:"Lava",          note:"Hot orange",        a:"rgba(255,60,0,1)",    b:"rgba(255,210,77,1)" },
    { id:"matrix",   name:"Matrix",        note:"Green terminal",    a:"rgba(0,255,160,1)",   b:"rgba(0,200,80,1)" },
    { id:"violet",   name:"Violet",        note:"Purple glow",       a:"rgba(180,110,255,1)", b:"rgba(124,92,255,1)" },

    { id:"ocean",    name:"Ocean",         note:"Sea blue",          a:"rgba(0,160,255,1)",   b:"rgba(0,229,255,1)" },
    { id:"sand",     name:"Sand",          note:"Soft warm",         a:"rgba(255,210,150,1)", b:"rgba(255,122,0,1)" },
    { id:"carbon",   name:"Carbon",        note:"Muted pro",         a:"rgba(180,180,190,1)", b:"rgba(90,95,110,1)" },
    { id:"plasma",   name:"Plasma",        note:"Pink x cyan",       a:"rgba(255,75,145,1)",  b:"rgba(0,229,255,1)" },
    { id:"mint",     name:"Mint",          note:"Clean mint",        a:"rgba(120,255,210,1)", b:"rgba(0,200,255,1)" },

    { id:"royal",    name:"Royal",         note:"Purple x gold",     a:"rgba(124,92,255,1)",  b:"rgba(255,210,77,1)" },
    { id:"peach",    name:"Peach",         note:"Soft peach",        a:"rgba(255,160,120,1)", b:"rgba(255,75,145,1)" },
    { id:"storm",    name:"Storm",         note:"Dark blue",         a:"rgba(90,120,200,1)",  b:"rgba(80,90,140,1)" },
    { id:"neon",     name:"Neon",          note:"Cyber neon",        a:"rgba(0,229,255,1)",   b:"rgba(0,229,125,1)" },
    { id:"mono",     name:"Mono",          note:"Minimal gray",      a:"rgba(220,220,225,1)", b:"rgba(160,160,170,1)" },

    // Premium pack (80)
    { id:"p01", name:"Solana Aurora", note:"Solana neon aurora", a:"rgba(0,229,255,1)", b:"rgba(124,92,255,1)" },
    { id:"p02", name:"Degen Neon", note:"Loud degen glow", a:"rgba(255,75,145,1)", b:"rgba(0,229,255,1)" },
    { id:"p03", name:"Validator Night", note:"Deep infra vibes", a:"rgba(24,33,68,1)", b:"rgba(124,92,255,1)" },
    { id:"p04", name:"Meme Mint", note:"Playful mint pop", a:"rgba(0,229,125,1)", b:"rgba(255,75,145,1)" },
    { id:"p05", name:"Liquidity Pool", note:"Blue-green flow", a:"rgba(0,200,255,1)", b:"rgba(0,229,125,1)" },
    { id:"p06", name:"Airdrop Pink", note:"Candy airdrop", a:"rgba(255,75,145,1)", b:"rgba(255,210,77,1)" },
    { id:"p07", name:"MEV Shadow", note:"Dark purple edge", a:"rgba(70,29,132,1)", b:"rgba(0,200,255,1)" },
    { id:"p08", name:"Onchain Gold", note:"Premium chain shine", a:"rgba(255,210,77,1)", b:"rgba(124,92,255,1)" },
    { id:"p09", name:"Laser Grid", note:"Sharp grid glow", a:"rgba(0,229,255,1)", b:"rgba(255,122,0,1)" },
    { id:"p10", name:"Hodl Forest", note:"Calm green depth", a:"rgba(0,229,125,1)", b:"rgba(26,132,86,1)" },
    { id:"p11", name:"Alpha Crimson", note:"Aggressive red alpha", a:"rgba(220,38,38,1)", b:"rgba(124,92,255,1)" },
    { id:"p12", name:"Frogwave", note:"Meme wave", a:"rgba(34,197,94,1)", b:"rgba(0,229,255,1)" },
    { id:"p13", name:"NFT Chrome", note:"Chrome highlights", a:"rgba(229,231,235,1)", b:"rgba(124,92,255,1)" },
    { id:"p14", name:"ZK Mist", note:"Soft zk haze", a:"rgba(167,139,250,1)", b:"rgba(0,229,255,1)" },
    { id:"p15", name:"Gas Plasma", note:"Hot plasma", a:"rgba(255,122,0,1)", b:"rgba(255,75,145,1)" },
    { id:"p16", name:"Builder Steel", note:"Clean steel", a:"rgba(148,163,184,1)", b:"rgba(59,130,246,1)" },
    { id:"p17", name:"Iceberg", note:"Cold minimal", a:"rgba(186,230,253,1)", b:"rgba(124,92,255,1)" },
    { id:"p18", name:"Sunset DEX", note:"Warm dex sunset", a:"rgba(255,122,0,1)", b:"rgba(0,200,255,1)" },
    { id:"p19", name:"Orbit", note:"Cosmic orbit", a:"rgba(17,24,39,1)", b:"rgba(0,200,255,1)" },
    { id:"p20", name:"Photon", note:"Bright photon", a:"rgba(250,250,250,1)", b:"rgba(0,229,255,1)" },
    { id:"p21", name:"Cyber Lime", note:"Cyber lime", a:"rgba(163,230,53,1)", b:"rgba(0,200,255,1)" },
    { id:"p22", name:"Royal Violet", note:"Royal violet", a:"rgba(124,92,255,1)", b:"rgba(255,75,145,1)" },
    { id:"p23", name:"Ocean Matrix", note:"Ocean matrix", a:"rgba(0,200,255,1)", b:"rgba(2,132,199,1)" },
    { id:"p24", name:"Circuit Mint", note:"Circuit mint", a:"rgba(0,229,125,1)", b:"rgba(0,200,255,1)" },
    { id:"p25", name:"Pink Noise", note:"Pink noise", a:"rgba(255,75,145,1)", b:"rgba(124,92,255,1)" },
    { id:"p26", name:"Night Market", note:"Night market", a:"rgba(15,23,42,1)", b:"rgba(255,210,77,1)" },
    { id:"p27", name:"Starship", note:"Starship", a:"rgba(0,229,255,1)", b:"rgba(255,210,77,1)" },
    { id:"p28", name:"Turbo Teal", note:"Turbo teal", a:"rgba(20,184,166,1)", b:"rgba(124,92,255,1)" },
    { id:"p29", name:"Sapphire", note:"Sapphire", a:"rgba(59,130,246,1)", b:"rgba(124,92,255,1)" },
    { id:"p30", name:"Blackout Pro", note:"Near-black pro", a:"rgba(5,7,14,1)", b:"rgba(124,92,255,1)" },

    // Premium pack continued (80)
    { id:"p31", name:"Neon Bloom", note:"Clean neon gradient", a:"rgba(215,238,43,1)", b:"rgba(37,130,244,1)" },
    { id:"p32", name:"Chrome Circuit", note:"Dark pro glow", a:"rgba(95,238,43,1)", b:"rgba(195,37,244,1)" },
    { id:"p33", name:"Prism Wave", note:"Cold glass shine", a:"rgba(43,238,111,1)", b:"rgba(244,37,40,1)" },
    { id:"p34", name:"Aurora Grid", note:"Warm premium glow", a:"rgba(43,238,231,1)", b:"rgba(202,244,37,1)" },
    { id:"p35", name:"Void Flux", note:"Cyber pop", a:"rgba(43,124,238,1)", b:"rgba(37,244,123,1)" },
    { id:"p36", name:"Laser Drive", note:"Soft haze", a:"rgba(82,43,238,1)", b:"rgba(37,113,244,1)" },
    { id:"p37", name:"Cosmic Mist", note:"High-contrast UI", a:"rgba(202,43,238,1)", b:"rgba(213,37,244,1)" },
    { id:"p38", name:"Glitch Edge", note:"Muted pro tone", a:"rgba(238,43,153,1)", b:"rgba(244,51,37,1)" },
    { id:"p39", name:"Titan Engine", note:"Bright accent", a:"rgba(238,52,43,1)", b:"rgba(185,244,37,1)" },
    { id:"p40", name:"Sakura Orbit", note:"Deep space vibe", a:"rgba(238,173,43,1)", b:"rgba(37,244,140,1)" },
    { id:"p41", name:"Solstice Signal", note:"Clean neon gradient", a:"rgba(183,238,43,1)", b:"rgba(37,95,244,1)" },
    { id:"p42", name:"Phantom Drift", note:"Dark pro glow", a:"rgba(62,238,43,1)", b:"rgba(230,37,244,1)" },
    { id:"p43", name:"Jet Rift", note:"Cold glass shine", a:"rgba(43,238,144,1)", b:"rgba(244,68,37,1)" },
    { id:"p44", name:"Hyper Matrix", note:"Warm premium glow", a:"rgba(43,212,238,1)", b:"rgba(168,244,37,1)" },
    { id:"p45", name:"Pulse Runway", note:"Cyber pop", a:"rgba(43,91,238,1)", b:"rgba(37,244,157,1)" },
    { id:"p46", name:"Mirage Peak", note:"Soft haze", a:"rgba(114,43,238,1)", b:"rgba(37,78,244,1)" },
    { id:"p47", name:"Holo Forge", note:"High-contrast UI", a:"rgba(235,43,238,1)", b:"rgba(244,37,240,1)" },
    { id:"p48", name:"Cipher Harbor", note:"Muted pro tone", a:"rgba(238,43,121,1)", b:"rgba(244,85,37,1)" },
    { id:"p49", name:"Kinetic Relay", note:"Bright accent", a:"rgba(238,85,43,1)", b:"rgba(151,244,37,1)" },
    { id:"p50", name:"Obsidian Vortex", note:"Deep space vibe", a:"rgba(238,205,43,1)", b:"rgba(37,244,175,1)" },
    { id:"p51", name:"Arctic Spray", note:"Clean neon gradient", a:"rgba(150,238,43,1)", b:"rgba(37,61,244,1)" },
    { id:"p52", name:"Inferno Beacon", note:"Dark pro glow", a:"rgba(43,238,56,1)", b:"rgba(244,37,223,1)" },
    { id:"p53", name:"Cobalt Temple", note:"Cold glass shine", a:"rgba(43,238,176,1)", b:"rgba(244,102,37,1)" },
    { id:"p54", name:"Emerald Vista", note:"Warm premium glow", a:"rgba(43,179,238,1)", b:"rgba(133,244,37,1)" },
    { id:"p55", name:"Magenta Lane", note:"Cyber pop", a:"rgba(43,59,238,1)", b:"rgba(37,244,192,1)" },
    { id:"p56", name:"Solar Core", note:"Soft haze", a:"rgba(147,43,238,1)", b:"rgba(37,44,244,1)" },
    { id:"p57", name:"Lunar Pool", note:"High-contrast UI", a:"rgba(238,43,209,1)", b:"rgba(244,37,206,1)" },
    { id:"p58", name:"Turbo Garden", note:"Muted pro tone", a:"rgba(238,43,88,1)", b:"rgba(244,120,37,1)" },
    { id:"p59", name:"Quantum Storm", note:"Bright accent", a:"rgba(238,117,43,1)", b:"rgba(116,244,37,1)" },
    { id:"p60", name:"Iridescent Bridge", note:"Deep space vibe", a:"rgba(238,238,43,1)", b:"rgba(37,244,209,1)" },
    { id:"p61", name:"Onchain Deck", note:"Clean neon gradient", a:"rgba(117,238,43,1)", b:"rgba(47,37,244,1)" },
    { id:"p62", name:"Night Node", note:"Dark pro glow", a:"rgba(43,238,88,1)", b:"rgba(244,37,188,1)" },
    { id:"p63", name:"Dawn Tape", note:"Cold glass shine", a:"rgba(43,238,209,1)", b:"rgba(244,137,37,1)" },
    { id:"p64", name:"Dusk Portal", note:"Warm premium glow", a:"rgba(43,147,238,1)", b:"rgba(99,244,37,1)" },
    { id:"p65", name:"Frost Field", note:"Cyber pop", a:"rgba(59,43,238,1)", b:"rgba(37,244,226,1)" },
    { id:"p66", name:"Sable Valley", note:"Soft haze", a:"rgba(179,43,238,1)", b:"rgba(65,37,244,1)" },
    { id:"p67", name:"Vapor Spire", note:"High-contrast UI", a:"rgba(238,43,176,1)", b:"rgba(244,37,171,1)" },
    { id:"p68", name:"Ion Crown", note:"Muted pro tone", a:"rgba(238,43,56,1)", b:"rgba(244,154,37,1)" },
    { id:"p69", name:"Reactor Rise", note:"Bright accent", a:"rgba(238,150,43,1)", b:"rgba(82,244,37,1)" },
    { id:"p70", name:"Zen Shade", note:"Deep space vibe", a:"rgba(205,238,43,1)", b:"rgba(37,244,244,1)" },
    { id:"p71", name:"Neon Bloom Bloom", note:"Clean neon gradient", a:"rgba(85,238,43,1)", b:"rgba(82,37,244,1)" },
    { id:"p72", name:"Chrome Circuit Edge", note:"Dark pro glow", a:"rgba(43,238,121,1)", b:"rgba(244,37,154,1)" },
    { id:"p73", name:"Prism Wave Runway", note:"Cold glass shine", a:"rgba(43,235,238,1)", b:"rgba(244,171,37,1)" },
    { id:"p74", name:"Aurora Grid Beacon", note:"Warm premium glow", a:"rgba(43,114,238,1)", b:"rgba(65,244,37,1)" },
    { id:"p75", name:"Void Flux Storm", note:"Cyber pop", a:"rgba(91,43,238,1)", b:"rgba(37,226,244,1)" },
    { id:"p76", name:"Laser Drive Valley", note:"Soft haze", a:"rgba(212,43,238,1)", b:"rgba(99,37,244,1)" },
    { id:"p77", name:"Cosmic Mist Wave", note:"High-contrast UI", a:"rgba(238,43,144,1)", b:"rgba(244,37,137,1)" },
    { id:"p78", name:"Glitch Edge Orbit", note:"Muted pro tone", a:"rgba(238,62,43,1)", b:"rgba(244,188,37,1)" },
    { id:"p79", name:"Titan Engine Forge", note:"Bright accent", a:"rgba(238,183,43,1)", b:"rgba(47,244,37,1)" },
    { id:"p80", name:"Sakura Orbit Vista", note:"Deep space vibe", a:"rgba(173,238,43,1)", b:"rgba(37,209,244,1)" },
  ].slice(0, 60);

  const EXT_THEMES = THEMES.map(t=>({ id:t.id, name:t.name, note:t.note, a:t.a, b:t.b }));
  const EXT_WALLPAPER_FREE = [
    ["ext_free_01", "Free 01"],
    ["ext_free_02", "Free 02"],
  ];
  const EXT_WALLPAPER_PACK_COUNT = 50;
  const EXT_WALLPAPER_FREE_PACK_COUNT = 4;
  const EXT_WALLPAPER_LUX = [
    ["lux_ext_anime_neon_alley", "Anime Neon Alley"],
    ["lux_ext_cinematic_heroes", "Cinematic Heroes"],
    ["lux_ext_ct_warroom", "CT War Room"],
    ["lux_ext_degen_terminal", "Degen Terminal"],
    ["lux_ext_nft_gallery", "NFT Gallery"],
    ["lux_ext_noir_detective", "Noir Detective"],
    ["lux_ext_onchain_spaceport", "Onchain Spaceport"],
    ["lux_ext_solana_temple", "Solana Temple"],
  ];
  function buildExtWallpapers(){
    const out = EXT_WALLPAPER_FREE.map(([id, name])=>({ id, name, tier:"free" }));
    for (let i=1; i<=EXT_WALLPAPER_PACK_COUNT; i++){
      out.push({
        id: `extv3_${String(i).padStart(2, "0")}`,
        name: `Aurora ${i}`,
        tier: i <= EXT_WALLPAPER_FREE_PACK_COUNT ? "free" : "premium"
      });
    }
    for (const [id, name] of EXT_WALLPAPER_LUX) out.push({ id, name, tier:"premium" });
    return out;
  }
  const EXT_WALLPAPERS = buildExtWallpapers();
  function migrateLegacyExtWallpaperSelectionOnce(){
    try{
      const done = "gmx_ext_wallpaper_refresh_20260318";
      if (localStorage.getItem(done) === "1") return;
      // keep IDs stable; visual refresh now happens in URL resolver
      localStorage.setItem(done, "1");
    }catch{}
  }



  const STYLES = [
    ["classic","Natural / Balanced"],
    ["degen","CT / Market"],
    ["builder","Builder / Productive"],
    ["alpha","Alpha / Read"],
    ["calm","Soft / Calm"],
    ["meme","Light / Wry"],
    ["classy","Polished / Smooth"],
    ["minimal","Minimal / Tight"],
    ["noemoji","No emoji"],
    ["emoji","Emoji / Extra"],
    ["focus","Focused / Direct"],
    ["cheer","Warm / Light"],
  ];


  const PACKS = [
    { id:"classic", name:"Balanced",         pro:false, style:"classic", mode:null, anti:2, clean:true  },
    { id:"king",    name:"Market Read",      pro:false, style:"alpha",   mode:"mid", anti:2, clean:true  },
    { id:"degen",   name:"CT Market",        pro:true,  style:"degen",   mode:"mid", anti:4, clean:true  },
    { id:"minimal", name:"Tight Minimal",    pro:true,  style:"minimal", mode:"min", anti:4, clean:true  },
    { id:"builder", name:"Builder Clean",    pro:true,  style:"builder", mode:"mid", anti:4, clean:true  },
    { id:"kind",    name:"Soft Close",       pro:true,  style:"calm",    mode:"mid", anti:4, clean:true  },
    { id:"aggro",   name:"Alpha Push",       pro:true,  style:"alpha",   mode:"max", anti:3, clean:true  },
  ];

  function unlockedPacksCount(){ return unlockedCountByRefs(PACKS.length, FREE_VISIBLE_PACKS); }

  function fillPacks(){
    const unlocked = unlockedPacksCount();
    const fill = (sel, lsKey)=>{
      if (!sel) return;
      const prev = localStorage.getItem(lsKey) || "classic";
      sel.innerHTML = "";
      PACKS.forEach((p, idx)=>{
        const o = document.createElement("option");
        o.value = p.id;
        const locked = (!isPro() && idx >= unlocked);
        const need = reqRefsForUnlockIndex(idx, FREE_VISIBLE_PACKS);
        o.textContent = locked ? `${t("locked")||"LOCKED"} (${need} ref)` : p.name;
        o.disabled = locked;
        sel.appendChild(o);
      });
      if ([...sel.options].some(o=>o.value===prev && !o.disabled)) sel.value = prev;
      else sel.value = "classic";
    };
    fill($("gmPack"), LS_GM_PACK);
    fill($("gnPack"), LS_GN_PACK);
  }

  function unlockedThemesCount(){ return unlockedCountByRefs(THEMES.length, FREE_VISIBLE_THEMES); }
  function unlockedStylesCount(){ return unlockedCountByRefs(STYLES.length, FREE_VISIBLE_STYLES); }

  function rgbaToRgbTuple(s){
    const m = String(s||"").match(/rgba?\(([^)]+)\)/i);
    if (!m) return null;
    const parts = m[1].split(",").map(x=>x.trim());
    const r = Number(parts[0]); const g = Number(parts[1]); const b = Number(parts[2]);
    if (![r,g,b].every(Number.isFinite)) return null;
    return [Math.max(0,Math.min(255,r)), Math.max(0,Math.min(255,g)), Math.max(0,Math.min(255,b))];
  }
  function relLum(rgb){
    // sRGB to linear
    const f = (v)=>{ v/=255; return (v<=0.04045)? (v/12.92) : Math.pow((v+0.055)/1.055, 2.4); };
    const [r,g,b]=rgb;
    return 0.2126*f(r) + 0.7152*f(g) + 0.0722*f(b);
  }
  function pickAccentOn(a,b){
    const ra = rgbaToRgbTuple(a) || [124,92,255];
    const rb = rgbaToRgbTuple(b) || [0,229,255];
    const lum = (relLum(ra) + relLum(rb)) / 2;
    // If the gradient is bright, use dark text; otherwise use light text.
    return (lum > 0.62) ? "#0A0D15" : "#FFFFFF";
  }

function applyTheme(id){
    const t = THEMES.find(x=>x.id===id) || THEMES[0];
    // persist selected site theme
    try { localStorage.setItem("gmx_theme", String(t.id || id)); } catch(e) {}
    // CSS uses both --accentA and --accentB across gradients.
    document.documentElement.style.setProperty("--accentA", t.a);
    document.documentElement.style.setProperty("--accentB", t.b);
    document.documentElement.style.setProperty("--accentOn", pickAccentOn(t.a, t.b));
  }
const LS_EXT_VIEW = "gmx_ext_view"; // theme | wall | custom
const LS_EXT_WP = "gmx_ext_wp"; // selected extension wallpaper id

// Custom background for extension popup (per-tab + global)
// Note: this is stored on the site and later synced to the extension.
const LS_EXT_CUSTOM_BG_GLOBAL = "gmx_ext_custom_bg_global"; // dataURL
const LS_EXT_CUSTOM_BG_TAB_PREFIX = "gmx_ext_custom_bg_tab_"; // + tab
const LS_EXT_CUSTOM_BG_TARGET = "gmx_ext_custom_bg_target"; // selected tab in UI
const LS_EXT_CUSTOM_BG_LEGACY = "gmx_ext_custom_bg"; // legacy single key (migrated)

const EXT_POPUP_TABS = [
  ["all","wp_apply_all"],
  ["home","wp_apply_home"],
  ["gm","wp_apply_gm"],
  ["gn","wp_apply_gn"],
  ["referrals","wp_apply_referrals"],
  ["themes","wp_apply_themes"],
  ["wallet","wp_apply_wallet"],
];
const LS_EXT_WP_TARGET = "gmx_ext_wp_target"; // selected target inside extension wallpapers UI
const LS_EXT_WP_VIEW_PREFIX = "gmx_ext_wp_view_"; // + popup | quick
const EXT_WALLPAPER_VIEWS = [
  ["all", "All views"],
  ["popup", "Popup"],
  ["quick", "Quick panel"],
];

function extCustomBgKeyForTab(tab){
  return (tab === "all") ? LS_EXT_CUSTOM_BG_GLOBAL : (LS_EXT_CUSTOM_BG_TAB_PREFIX + tab);
}

function normalizeExtWallpaperView(view){
  const safe = String(view || "").trim().toLowerCase();
  return (safe === "popup" || safe === "quick") ? safe : "all";
}
function extWallpaperKeyForView(view){
  const safe = normalizeExtWallpaperView(view);
  return safe === "all" ? LS_EXT_WP : (LS_EXT_WP_VIEW_PREFIX + safe);
}
function getExtWallpaperForView(view){
  try{
    return normalizeExtWallpaperIdLocal(localStorage.getItem(extWallpaperKeyForView(view)) || "");
  }catch(_e){
    return "";
  }
}
function setExtWallpaperForView(view, id){
  try{
    const safeView = normalizeExtWallpaperView(view);
    const key = extWallpaperKeyForView(safeView);
    const safeId = normalizeExtWallpaperIdLocal(id);
    if (safeId) localStorage.setItem(key, safeId);
    else localStorage.removeItem(key);
  }catch(_e){}
}
function syncExtWallpaperTargetUI(sel, preferred){
  if (!sel) return "all";
  const current = normalizeExtWallpaperView(preferred || sel.value || localStorage.getItem(LS_EXT_WP_TARGET) || "all");
  sel.innerHTML = "";
  for (const [value, label] of EXT_WALLPAPER_VIEWS){
    const opt = document.createElement("option");
    opt.value = value;
    opt.textContent = label;
    sel.appendChild(opt);
  }
  sel.value = current;
  try{ localStorage.setItem(LS_EXT_WP_TARGET, current); }catch(_e){}
  return current;
}
function currentExtWallpaperTarget(){
  return normalizeExtWallpaperView(localStorage.getItem(LS_EXT_WP_TARGET) || "all");
}
function extWallpaperLabel(view){
  const safe = normalizeExtWallpaperView(view);
  return EXT_WALLPAPER_VIEWS.find((entry)=>entry[0]===safe)?.[1] || "All views";
}
function normalizeStoredExtWallpaperSelections(){
  try{
    const safeGlobal = normalizeExtWallpaperIdLocal(localStorage.getItem(LS_EXT_WP) || "");
    if (safeGlobal) localStorage.setItem(LS_EXT_WP, safeGlobal);
    else localStorage.removeItem(LS_EXT_WP);
  }catch(_e){}
  for (const [view] of EXT_WALLPAPER_VIEWS){
    if (view === "all") continue;
    try{
      const key = extWallpaperKeyForView(view);
      const safeId = normalizeExtWallpaperIdLocal(localStorage.getItem(key) || "");
      if (safeId) localStorage.setItem(key, safeId);
      else localStorage.removeItem(key);
    }catch(_e){}
  }
}

function migrateExtCustomBgLegacy(){
  try{
    const legacy = localStorage.getItem(LS_EXT_CUSTOM_BG_LEGACY);
    if (legacy && !localStorage.getItem(LS_EXT_CUSTOM_BG_GLOBAL)){
      localStorage.setItem(LS_EXT_CUSTOM_BG_GLOBAL, legacy);
    }
    if (legacy) localStorage.removeItem(LS_EXT_CUSTOM_BG_LEGACY);
  }catch(e){}
}
migrateExtCustomBgLegacy();

function listExtCustomBgUsedTabs(){
  const used = [];
  try{
    for (const [k] of EXT_POPUP_TABS){
      if (k === "all") continue;
      if (localStorage.getItem(LS_EXT_CUSTOM_BG_TAB_PREFIX + k)) used.push(k);
    }
    if (localStorage.getItem(LS_EXT_CUSTOM_BG_GLOBAL)) used.push("all");
  }catch(e){}
  return used;
}

function canSetExtCustomBgOnTab(tab){
  if (tab === "all") return true;
  if (isPro()) return true;

  const used = listExtCustomBgUsedTabs();
  if (used.includes(tab)) return true; // existing slot can always be edited/cleared

  // free: up to 3 tabs of choice
  if (used.filter(x=>x!=="all").length < 3) return true;

  // beyond 3: only if unlocked by refs
  const tabsOnly = EXT_POPUP_TABS.filter(t=>t[0]!=="all").map(t=>t[0]);
  const idx = tabsOnly.indexOf(tab);
  if (idx < 0) return false;
  const unlocked = unlockedCountByRefs(tabsOnly.length, 3);
  return idx < unlocked;
}

function requiredRefsForExtCustomBgTab(tab){
  if (tab === "all") return 0;
  const tabsOnly = EXT_POPUP_TABS.filter(t=>t[0]!=="all").map(t=>t[0]);
  const idx = tabsOnly.indexOf(tab);
  if (idx < 0) return 0;
  return reqRefsForUnlockIndex(idx, 3);
}

function renderExtCustomBgUI(){
  bindExtTabs();
  migrateExtCustomBgLegacy();

  const tabSel = $("extCustomBgTab");
  const st = $("extCustomBgStatus");
  const nm = $("extCustomBgName");
  const btnClear = $("extCustomBgClear");
  const btnPick = $("extCustomBgPick");
  const inp = $("extCustomBgFile");
  const btnRemove = $("extCustomBgRemove");

  if (!tabSel || !st || !btnPick || !inp || !btnRemove || !btnClear) return;

  const prev = localStorage.getItem(LS_EXT_CUSTOM_BG_TARGET) || tabSel.value || "all";

  tabSel.innerHTML = "";
  for (const [k, labelKey] of EXT_POPUP_TABS){
    const o = document.createElement("option");
    o.value = k;
    o.textContent = t(labelKey);
    tabSel.appendChild(o);
  }
  if ([...tabSel.options].some(o=>o.value===prev)) tabSel.value = prev;
  localStorage.setItem(LS_EXT_CUSTOM_BG_TARGET, tabSel.value);

  const target = tabSel.value || "all";
  const key = extCustomBgKeyForTab(target);
  const cur = localStorage.getItem(key);
  const used = listExtCustomBgUsedTabs();
  const usedCount = used.filter(x=>x!=="all").length;
  const slots = Math.min(EXT_POPUP_TABS.length-1, unlockedCountByRefs(EXT_POPUP_TABS.length-1, 3));
  const isAllowed = canSetExtCustomBgOnTab(target);
  const needRefs = requiredRefsForExtCustomBgTab(target);

  if (nm) nm.textContent = cur ? "saved" : "";

  let msg = cur
    ? `<span class="ok">Active.</span> Custom background is set for <b>${escapeHtml(t(EXT_POPUP_TABS.find(x=>x[0]===target)?.[1]||"wp_apply_all"))}</b>.`
    : `<span class="muted">None.</span> Upload an image to set a custom background.`;

  if (!isPro()){
    msg += ` <span class="muted">Slots:</span> ${Math.min(usedCount, slots)}/${slots}.`;
  }
  if (!isAllowed){
    msg += ` <span class="warn">Locked:</span> need ${needRefs} referrals for this tab (or upgrade to Pro).`;
  }
  st.innerHTML = msg;

  tabSel.onchange = ()=>{
    localStorage.setItem(LS_EXT_CUSTOM_BG_TARGET, tabSel.value);
    renderExtCustomBgUI();
  };

  btnClear.onclick = ()=>{
    if (!requireConnected("Extension themes")) return;
    try{
      localStorage.removeItem(LS_EXT_CUSTOM_BG_GLOBAL);
      for (const [k] of EXT_POPUP_TABS){
        if (k === "all") continue;
        localStorage.removeItem(LS_EXT_CUSTOM_BG_TAB_PREFIX + k);
      }
    }catch(e){}
    renderExtCustomBgUI();
    toast("ok", (t("toast_cleared")||"Cleared."));
  };

  btnPick.onclick = ()=>{
    if (!requireConnected("Extension themes")) return;
    if (!canSetExtCustomBgOnTab(target)){
      renderExtCustomBgUI();
      return;
    }
    inp.click();
  };

  if (!inp._bound){
    inp._bound = true;
    inp.addEventListener("change", async ()=>{
      try{
        if (!requireConnected("Extension themes")) { inp.value=""; return; }
        const tab = tabSel.value || "all";
        if (!canSetExtCustomBgOnTab(tab)){
          inp.value=""; renderExtCustomBgUI(); return;
        }
        const file = inp.files && inp.files[0];
        if (!file) return;
        if (nm) nm.textContent = file.name || "";

        const dataUrl = await compressImageToJpegDataURL(file, { profile: "ext" });
        localStorage.setItem(extCustomBgKeyForTab(tab), dataUrl);
        extSyncNow();

        renderExtCustomBgUI();
        if (st) st.innerHTML = `<span class="ok">Saved.</span> Auto-fitted for extension popup ratio.`;
        toast("ok", (t("toast_custom_bg_saved")||"Custom background saved."));
      }catch(e){
        st.innerHTML = `<span class="bad">Error.</span> Could not save background.`;
      }finally{
        inp.value = "";
      }
    });
  }

  btnRemove.onclick = ()=>{
    if (!requireConnected("Extension themes")) return;
    const tab = tabSel.value || "all";
    localStorage.removeItem(extCustomBgKeyForTab(tab));
    extSyncNow();
    renderExtCustomBgUI();
    toast("ok", (t("toast_removed")||"Removed."));
  };
}

function normalizeExtViewValue(view){
  const v = String(view || "").trim().toLowerCase();
  return (v === "wall") ? "wall" : "theme";
}

function setExtView(view, opts){
  const safeView = normalizeExtViewValue(view);
  const prev = normalizeExtViewValue(localStorage.getItem(LS_EXT_VIEW) || "theme");
  localStorage.setItem(LS_EXT_VIEW, safeView);
  const options = opts || {};
  if (!options.silent && prev !== safeView) extSyncNow("ext_view");
  const btnTheme = $("extTabTheme");
  const btnWall = $("extTabWall");
  const paneTheme = $("extThemePane");
  const paneWall = $("extWallPane");
  if (!btnTheme || !btnWall || !paneTheme || !paneWall) return;

  btnTheme.classList.toggle("active", safeView==="theme");
  btnWall.classList.toggle("active", safeView==="wall");

  btnTheme.setAttribute("aria-selected", safeView==="theme" ? "true" : "false");
  btnWall.setAttribute("aria-selected", safeView==="wall" ? "true" : "false");

  paneTheme.classList.toggle("hidden", safeView!=="theme");
  paneWall.classList.toggle("hidden", safeView!=="wall");

  const hasRenderedContent = (safeView==="theme" ? !!paneTheme.querySelector(".themeCard") : !!paneWall.querySelector(".wpCard"));
  const shouldRender = options.force === true || prev !== safeView || !hasRenderedContent;
  if (safeView==="theme" && shouldRender) renderExtThemes();
  if (safeView==="wall" && shouldRender) renderExtWallpapers();
}

  let __extSyncDebounce = 0;
  function extSyncNow(reason){
    try{ clearTimeout(__extSyncDebounce); }catch(_e){}
    __extSyncDebounce = setTimeout(()=>{
      try{ window.postMessage({ type: "GMX_SYNC_NOW", reason: reason || "ext_ui_change" }, "*"); }catch(_e){}
    }, 90);
  }

  function markExtThemeSelection(id){
    try{
      const grid = $("extThemeGrid");
      if (!grid) return;
      const cards = grid.querySelectorAll(".themeCard[data-theme-id]");
      cards.forEach((card)=>{
        card.classList.toggle("active", card.getAttribute("data-theme-id") === String(id || "").trim());
      });
    }catch(_e){}
  }

  function markWallpaperSelection(activeId){
    try{
      const grid = $('wpGrid');
      if (!grid) return;
      const chosen = String(activeId || '').trim();
      const cards = grid.querySelectorAll('.wpCard[data-wp-id]');
      cards.forEach((card)=>{
        card.classList.toggle('active', card.getAttribute('data-wp-id') === chosen);
      });
    }catch(_e){}
  }

function markExtWallpaperSelection(id){
    try{
      const grid = $("extWpGrid");
      if (!grid) return;
      const chosen = String(id || "").trim();
      const cards = grid.querySelectorAll(".wpCard[data-wp-id]");
      cards.forEach((card)=>{
        card.classList.toggle("active", card.getAttribute("data-wp-id") === chosen);
      });
    }catch(_e){}
  }

  function unlockedExtThemesCount(){ return unlockedCountByRefs(EXT_THEMES.length, FREE_VISIBLE_EXT_THEMES); }

  function applyExtTheme(id){
    const unlocked = unlockedExtThemesCount();
    const idx = EXT_THEMES.findIndex(x=>x.id===id);
    if (!isPro() && (idx<0 || idx >= unlocked)) return;
    localStorage.setItem("gmx_ext_theme", id);
    markExtThemeSelection(id);
    if (normalizeExtViewValue(localStorage.getItem(LS_EXT_VIEW) || "theme") !== "theme") setExtView("theme");
    extSyncNow("ext_theme");
    const st = $("extThemeStatus");
    if (st) st.innerHTML = '<span class="ok">Selected.</span>';
  }

  function applyExtWallpaper(id, targetView){
    const safeId = normalizeExtWallpaperIdLocal(id);
    if (!safeId) return;
    const safeTarget = normalizeExtWallpaperView(targetView || currentExtWallpaperTarget());
    setExtWallpaperForView(safeTarget, safeId);
    try{ localStorage.removeItem(LS_EXT_CUSTOM_BG_LEGACY); }catch(e){}
    if (normalizeExtViewValue(localStorage.getItem(LS_EXT_VIEW) || "theme") !== "wall") setExtView("wall");
    extSyncNow("ext_wallpaper");
    renderExtWallpapers();
  }


/* removed legacy renderExtThemes (cat/status filters) */

/* rebuilt Theme + Extension Themes renderers (no dead references) */

function themePreviewBg(th){
  const a = th?.a || "rgba(124,92,255,1)";
  const b = th?.b || "rgba(0,229,255,1)";
  return `linear-gradient(135deg, ${a}, ${b})`;
}

function unlockTagText(idx, unlocked, freeCount){
  if (idx < freeCount) return "FREE";
  if (unlocked) return "UNLOCKED";
  const need = reqRefsForUnlockIndex(idx, freeCount);
  return `${need} ref`;
}

function renderThemes(){
  const grid = $("themeGrid");
  if (!grid) return;

  const total = THEMES.length;
  const unlocked = unlockedThemesCount();
  const chosen = localStorage.getItem("gmx_theme") || "classic";

  const curThemes = Math.min(unlocked, total);
  const curWps = Math.min(unlockedCountByRefs(WALLPAPERS.length, FREE_VISIBLE_WALLPAPERS), WALLPAPERS.length);

  const thEl = $("themesUnlocked");
  if (thEl) thEl.textContent = `${curThemes}/${total}`;
  const thVal = $("themesUnlockedVal");
  if (thVal) thVal.textContent = `${curThemes}/${total}`;
  try{ setMeter("themesUnlockedVal", "themesUnlockedFill", curThemes, total); }catch{}
  const wpEl = $("wpUnlocked");
  if (wpEl) wpEl.textContent = `${curWps}/${WALLPAPERS.length}`;
  const wpVal = $("wpUnlockedVal");
  if (wpVal) wpVal.textContent = `${curWps}/${WALLPAPERS.length}`;
  try{ setMeter("wpUnlockedVal", "wpUnlockedFill", curWps, WALLPAPERS.length); }catch{}

  const items = THEMES.map((th, idx)=>({ th, idx }));
  chunkedRender(grid, items, ({ th, idx })=>{
    const isUnlocked = isPro() || (idx < unlocked);
    const card = document.createElement("button");
    card.type = "button";
    card.dataset.themeId = th.id;
    card.className = "themeCard" + (th.id === chosen ? " active" : "") + (!isUnlocked ? " mystery" : "");

    const sw = document.createElement("div");
    sw.className = "swatch";
    sw.style.background = themePreviewBg(th);

    const nm = document.createElement("div");
    nm.className = "tname";
    nm.textContent = th.name || th.id;

    const note = document.createElement("div");
    note.className = "tnote";
    note.textContent = th.note || "";

    const tag = document.createElement("div");
    tag.className = "lockTag";
    tag.textContent = unlockTagText(idx, isUnlocked, FREE_VISIBLE_THEMES);

    card.appendChild(sw);
    card.appendChild(nm);
    card.appendChild(note);
    card.appendChild(tag);

    if (!isUnlocked){
      const ov = document.createElement("div");
      ov.className = "mysteryOverlay";
      ov.textContent = (t("locked")||"LOCKED");
      card.appendChild(ov);
    }

    card.addEventListener("click", ()=>{
      if (!requireConnected("Themes")) return;
      if (!isUnlocked){
        const need = reqRefsForUnlockIndex(idx, FREE_VISIBLE_THEMES);
        toast("warn", (t("locked_unlock_at") || "Locked. Unlock at {n} referrals (+1 every 3 refs at first, then +1 every 4) or Pro.").replace("{n}", String(need)));
        return;
      }
      applyTheme(th.id);
      renderThemes();
    });

    return card;
  }, { key: "themeGrid", chunk: 24 });
}

function renderExtThemes(){
  const grid = $("extThemeGrid");
  const st = $("extThemeStatus");
  if (!grid || !st) return;

  const total = EXT_THEMES.length;
  const unlocked = unlockedCountByRefs(total, FREE_VISIBLE_EXT_THEMES);
  const chosen = localStorage.getItem("gmx_ext_theme") || "classic";

  const el = $("extThemesUnlocked");
  if (el) el.textContent = `${Math.min(unlocked,total)}/${total}`;
  const wEl = $("extWpUnlocked");
  if (wEl) wEl.textContent = `${Math.min(unlockedCountByRefs(EXT_WALLPAPERS.length, FREE_VISIBLE_EXT_WALLPAPERS), EXT_WALLPAPERS.length)}/${EXT_WALLPAPERS.length}`;

  const items = EXT_THEMES.map((th, idx)=>({ th, idx }));
  chunkedRender(grid, items, ({ th, idx })=>{
    const isUnlocked = isPro() || (idx < unlocked);
    const card = document.createElement("button");
    card.type = "button";
    card.className = "themeCard" + (th.id === chosen ? " active" : "") + (!isUnlocked ? " mystery" : "");

    const sw = document.createElement("div");
    sw.className = "swatch";
    sw.style.background = themePreviewBg(th);

    const nm = document.createElement("div");
    nm.className = "tname";
    nm.textContent = th.name || th.id;

    const note = document.createElement("div");
    note.className = "tnote";
    note.textContent = th.note || "";

    const tag = document.createElement("div");
    tag.className = "lockTag";
    tag.textContent = unlockTagText(idx, isUnlocked, FREE_VISIBLE_EXT_THEMES);

    card.appendChild(sw);
    card.appendChild(nm);
    card.appendChild(note);
    card.appendChild(tag);

    if (!isUnlocked){
      const ov = document.createElement("div");
      ov.className = "mysteryOverlay";
      ov.textContent = (t("locked")||"LOCKED");
      card.appendChild(ov);
    }

    card.addEventListener("click", ()=>{
      if (!requireConnected("Extension themes")) return;
      if (!isUnlocked){
        const need = reqRefsForUnlockIndex(idx, FREE_VISIBLE_EXT_THEMES);
        toast("warn", (t("locked_unlock_at") || "Locked. Unlock at {n} referrals (+1 every 3 refs at first, then +1 every 4) or Pro.").replace("{n}", String(need)));
        return;
      }
      applyExtTheme(th.id);
    });

    return card;
  }, { key: "extThemeGrid", chunk: 12 });

  const chosenName = EXT_THEMES.find(x=>x.id===chosen)?.name || chosen;
  st.innerHTML = `<span class="ok">Selected.</span> ${escapeHtml(chosenName)}.`;
}

function renderExtWallpapers(){
  const grid = $("extWpGrid");
  const st = $("extWpStatus");
  const targetSel = $("extWpTarget");
  if (!grid || !st) return;

  initExtWallpaperControls();
  loadCustomWallpapers().then((loaded)=>{
    if (loaded && document.contains(grid)) renderExtWallpapers();
  });
  const effectiveExtCustom = (()=>{
    const out = [...CUSTOM_WALLPAPERS_EXT];
    try{ if (localStorage.getItem(LS_EXT_CUSTOM_BG_GLOBAL)) out.push({ id: CUSTOM_UPLOAD_ID, name: "My upload", tier: "custom" }); }catch{}
    return out;
  })();
  const allExtWps = [...EXT_WALLPAPERS, ...effectiveExtCustom];
  const selectedTarget = syncExtWallpaperTargetUI(targetSel, targetSel?.value || currentExtWallpaperTarget());
  const total = allExtWps.length;
  const mainUnlockedExt = unlockedCountByRefs(EXT_WALLPAPERS.length, FREE_VISIBLE_EXT_WALLPAPERS);
  const customUnlockedExt = Math.min(effectiveExtCustom.length, isPro() ? effectiveExtCustom.length : CUSTOM_WP_FREE_COUNT);
  const unlocked = mainUnlockedExt + customUnlockedExt;
  const chosenDirect = getExtWallpaperForView(selectedTarget);
  const fallbackGlobal = selectedTarget === "all" ? "" : getExtWallpaperForView("all");
  const chosen = chosenDirect || fallbackGlobal || "";
  const wEl = $("extWpUnlocked");
  if (wEl) wEl.textContent = `${Math.min(unlocked,total)}/${total}`;

  const items = allExtWps.map((wp, idx)=>({ wp, idx }));
  chunkedRender(grid, items, ({ wp, idx })=>{
    const isUnlocked = wp.tier === "custom" ? (idx - EXT_WALLPAPERS.length < CUSTOM_WP_FREE_COUNT || isPro()) : (isPro() || idx < mainUnlockedExt);
    const card = document.createElement("button");
    card.type = "button";
    card.dataset.wpId = wp.id;
    card.dataset.tier = wp.tier || (idx < FREE_VISIBLE_EXT_WALLPAPERS ? "free" : "premium");
    card.className = "wpCard" + (wp.id === chosen ? " active" : "") + (!isUnlocked ? " mystery" : "");

    const thumb = document.createElement("div");
    thumb.className = "wpThumb";
    const thumbUrl = extWallpaperThumbUrl(wp.id);
    const fullUrl = extWallpaperFullUrl(wp.id);
    if (thumbUrl){
      thumb.setAttribute('data-bg', thumbUrl);
      observeLazyBg(thumb);
    }
    if (isUnlocked && fullUrl){
      card.addEventListener('pointerenter', ()=>{ try{ prefetchImage(fullUrl); }catch{} }, { passive:true });
    }

    const name = document.createElement("div");
    name.className = "wpName";
    name.textContent = wp.name || wp.id;

    const meta = document.createElement("div");
    meta.className = "wpMeta";
    meta.textContent = (wp.tier === "custom") ? "Custom" : (wp.tier || "");

    const tag = document.createElement("div");
    tag.className = "wpTag";
    tag.textContent = (wp.tier === "custom") ? "CUSTOM" : unlockTagText(idx, isUnlocked, FREE_VISIBLE_EXT_WALLPAPERS);

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
      if (!requireConnected("Extension themes")) return;
      if (!isUnlocked){
        const need = reqRefsForUnlockIndex(idx, FREE_VISIBLE_EXT_WALLPAPERS);
        toast("warn", (t("locked_unlock_at") || "Locked. Unlock at {n} referrals (+1 every 3 refs at first, then +1 every 4) or Pro.").replace("{n}", String(need)));
        return;
      }
      applyExtWallpaper(wp.id, selectedTarget);
    });

    return card;
  }, { key: "extWpGrid", chunk: 12 });

  if (!chosen){
    st.innerHTML = `<span class="muted">None.</span> Pick a wallpaper for <b>${escapeHtml(extWallpaperLabel(selectedTarget))}</b>.`;
    return;
  }
  const chosenName = EXT_WALLPAPERS.find(x=>x.id===chosen)?.name || effectiveExtCustom.find(x=>x.id===chosen)?.name || chosen;
  if (chosenDirect){
    st.innerHTML = `<span class="ok">Selected.</span> ${escapeHtml(chosenName)} for <b>${escapeHtml(extWallpaperLabel(selectedTarget))}</b>.`;
  } else {
    st.innerHTML = `<span class="ok">Using global.</span> ${escapeHtml(chosenName)} from <b>${escapeHtml(extWallpaperLabel("all"))}</b> is currently filling <b>${escapeHtml(extWallpaperLabel(selectedTarget))}</b>.`;
  }
}

function bindExtTabs(){
  if (bindExtTabs._done) return;
  bindExtTabs._done = true;

  const themeBtn  = $("extTabTheme");
  const wallBtn   = $("extTabWall");

  if (themeBtn)  themeBtn.addEventListener("click", ()=>setExtView("theme"));
  if (wallBtn)   wallBtn.addEventListener("click",  ()=>setExtView("wall"));
}

function initExtWallpaperControls(){
  if (initExtWallpaperControls._done) return;
  initExtWallpaperControls._done = true;
  const sel = $("extWpTarget");
  const clearBtn = $("extWpClear");
  const addBtn = $("extWpAddCustom");
  const addFile = $("extWpAddFile");
  if (addBtn && addFile){
    addBtn.onclick = ()=>{ if (requireConnected("Extension themes")) addFile.click(); };
  }
  if (addFile){
    addFile.addEventListener("change", async ()=>{
      try{
        if (!requireConnected("Extension themes")) { addFile.value = ""; return; }
        const f = addFile.files && addFile.files[0];
        if (!f) return;
        const data = await compressImageToJpegDataURL(f, { profile: "ext" });
        localStorage.setItem(LS_EXT_CUSTOM_BG_GLOBAL, data);
        const target = ($("extWpTarget")?.value || "all");
        setExtWallpaperForView(normalizeExtWallpaperView(target), CUSTOM_UPLOAD_ID);
        extSyncNow("ext_wallpaper");
        try{ renderExtWallpapers(); }catch{}
        toast("ok", (t("toast_custom_bg_saved")||"Custom wallpaper saved."));
      }catch(e){
        toast("warn", (t("err_custom_wp_save")||"Could not save image."));
      }finally{
        addFile.value = "";
      }
    });
  }
  if (sel){
    syncExtWallpaperTargetUI(sel);
    sel.addEventListener("change", ()=>{
      const target = syncExtWallpaperTargetUI(sel, sel.value || "all");
      try{ localStorage.setItem(LS_EXT_WP_TARGET, target); }catch(_e){}
      renderExtWallpapers();
    });
  }
  if (clearBtn){
    clearBtn.addEventListener("click", ()=>{
      const selNow = $("extWpTarget");
      const target = normalizeExtWallpaperView(selNow?.value || currentExtWallpaperTarget());
      setExtWallpaperForView(target, "");
      renderExtWallpapers();
      extSyncNow("ext_wallpaper");
      toast("ok", (t("toast_wallpaper_cleared") || "Wallpaper cleared."));
    });
  }
}





function fillStyles(){
    const unlocked = unlockedStylesCount();
    const fill = (sel)=>{
      if (!sel) return;
      const prev = (sel.value || "classic");
      sel.innerHTML = "";
      STYLES.forEach(([v,label], idx)=>{
        const o = document.createElement("option");
        o.value = v;
        const locked = (!isPro() && idx >= unlocked);
        const need = reqRefsForUnlockIndex(idx, FREE_VISIBLE_STYLES);
        o.textContent = locked ? `${t("locked")||"LOCKED"} (${need} ref)` : label;
        o.disabled = locked;
        sel.appendChild(o);
      });
      // restore previous selection if possible (do NOT reset on every refresh)
      const prevIdx = STYLES.findIndex(x=>x[0]===prev);
      if (prevIdx !== -1 && (isPro() || prevIdx < unlocked)){
        sel.value = prev;
      } else {
        sel.value = STYLES[0][0];
      }
    };
    fill($("gmStyle"));
    fill($("gnStyle"));
    if ($("stylesUnlocked")) $("stylesUnlocked").textContent = `${unlocked}/${STYLES.length}`;
  }

const $ = (id) => document.getElementById(id);

  function toast(type, html, ms=4500){
    const el = $("toast");
    if (!el) return;
    el.className = `toast ${type||""}`;
    el.innerHTML = `<div class="ticon">${type==="ok"?"OK":type==="warn"?"!":"!"}</div><div class="tmsg">${html}</div>`;
    el.classList.remove("hidden");
    if (ms > 0){
      clearTimeout(el.__t);
      el.__t = setTimeout(()=>{ el.classList.add("hidden"); }, ms);
    }
  }

  // --- Degraded / offline mode (prevents "white screen" when API flakes) ---
  let API_DEGRADED = false;
  let DEGRADED_HIDDEN = false;
  let LAST_ONLINE_AT = Date.now();

  function setDegraded(on, msg){
    API_DEGRADED = !!on;
    const bar = $("degradedBar");
    if (!bar) return;
    if (!API_DEGRADED){
      bar.classList.add("hidden");
      DEGRADED_HIDDEN = false;
      LAST_ONLINE_AT = Date.now();
      return;
    }
    if (DEGRADED_HIDDEN) return;
    const title = $("degradedTitle");
    const text  = $("degradedMsg");
    if (title) title.textContent = (navigator.onLine === false) ? "Offline (browser)" : "Offline mode";
    if (text)  text.textContent = msg || "API is unreachable. You can still edit lists locally; sync/verify will retry when back online.";
    bar.classList.remove("hidden");
  }

  const dRetry = $("degradedRetry");
  if (dRetry) dRetry.onclick = ()=>{ try{ window.__gmxRetryNow?.(); }catch{} };
  const dHide = $("degradedHide");
  if (dHide) dHide.onclick = ()=>{ DEGRADED_HIDDEN = true; $("degradedBar")?.classList.add("hidden"); };

  window.addEventListener("offline", ()=>setDegraded(true, "Browser reports offline. Check your connection."));

  
  let INIT_DONE = false;
  const esc = (s)=>String(s??"").replace(/[&<>"']/g, (c)=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]));

  function showFatal(msg){
    const ov = $("fatalOverlay");
    if (!ov) return;
    const fm = $("fatalMsg");
    if (fm) fm.textContent = msg || "Something went wrong.";
    ov.classList.remove("hidden");
  }

  function hideFatal(){
    const ov = $("fatalOverlay");
    if (!ov) return;
    ov.classList.add("hidden");
  }

  const fr = $("fatalReload");
  if (fr) fr.addEventListener("click", ()=>location.reload());
  const fh = $("fatalGoHome");
  if (fh) fh.addEventListener("click", ()=>{
    try{ hideFatal(); tab("home"); }catch{ location.href="/"; }
  });

  window.addEventListener("error", (e)=>{
    try{
      const msg = (e?.message || "Unexpected error");
      const net = String(msg).includes("Failed to fetch") || String(msg).includes("NetworkError") || String(msg).includes("request_failed") || String(msg).includes("timeout");
      if (net){ setDegraded(true, "Network/API error. You can still edit lists locally."); return; }
      toast("bad", `<b>Error:</b> ${esc(msg)} <span class="muted small">(try Reload)</span>`);
      if (!INIT_DONE) showFatal(msg);
    }catch{}
  });

  window.addEventListener("unhandledrejection", (e)=>{
    try{
      const msg = (e?.reason && (e.reason.message || String(e.reason))) || "Unhandled promise rejection";
      const net = String(msg).includes("Failed to fetch") || String(msg).includes("NetworkError") || String(msg).includes("request_failed") || String(msg).includes("timeout") || String(msg).includes("not_connected");
      if (net){ setDegraded(true, "Network/API error. You can still edit lists locally."); return; }
      toast("bad", `<b>Error:</b> ${esc(msg)} <span class="muted small">(try Reload)</span>`);
      if (!INIT_DONE) showFatal(msg);
    }catch{}
  });

  function setBusy(kind, on, label){
    INFLIGHT[kind] = !!on;
    const ids = (kind==="gm")
      ? ["gmRand1","gmRand10","gmBestBtn","gmNewAdd","gmPasteAdd","gmCleanup","gmClear","gmClearAll","gmCopyAll","gmExport","gmViewGlobal","gmViewLang","gmFilter","gmFilterClear"]
      : ["gnRand1","gnRand10","gnBestBtn","gnNewAdd","gnPasteAdd","gnCleanup","gnClear","gnClearAll","gnCopyAll","gnExport","gnViewGlobal","gnViewLang","gnFilter","gnFilterClear"];

    for (const id of ids){
      const el = $(id);
      if (!el) continue;
      if (el.tagName === "INPUT") el.disabled = !!on;
      else el.disabled = !!on;
    }

    const msgEl = kind==="gm" ? $("gmMsg") : $("gnMsg");
    if (msgEl){
      if (on){
        msgEl.innerHTML = `<span class="spinner"></span> <span class="muted">${escapeHtml(label||"Working...")}</span>`;
      } else {
        // keep whatever message was set by the action; do not overwrite
      }
    }
  }


    function setBg(tab){
    const theme = TAB_THEME[tab] || TAB_THEME.home;
    const bg = (typeof theme === "function") ? theme() : theme;
    document.documentElement.style.setProperty("--bg", bg);
    applyWallpaper(tab);
    applyUserBg(tab);
  }

  function ensurePredictionTabVisible(){
    try{
      const tabs = document.querySelector(".tabs");
      if (!tabs) return;
      let btn = document.getElementById("t_prediction");
      if (!btn){
        btn = document.createElement("button");
        btn.className = "tab";
        btn.id = "t_prediction";
        btn.dataset.tab = "prediction";
        btn.textContent = "Prediction Market";
        const before = document.getElementById("t_wallet");
        if (before && before.parentNode === tabs) tabs.insertBefore(btn, before);
        else tabs.appendChild(btn);
      }
      btn.classList.remove("hidden");
      let pane = document.getElementById("tab-prediction");
      if (!pane){
        pane = document.createElement("div");
        pane.id = "tab-prediction";
        pane.className = "hidden";
        pane.innerHTML = `<div class="card"><div class="title">Prediction Market</div><div class="note">Coming soon.</div></div>`;
        tabs.insertAdjacentElement("afterend", pane);
      }
      pane.classList.add("hidden");
    }catch{}
  }

    function showTab(name){
    name = normalizeTopLevelTab(name);
    CURRENT_TAB = name;
    document.querySelectorAll(".tab").forEach(b=>b.classList.toggle("active", b.dataset.tab===name));
    TOP_LEVEL_TABS.forEach(k=>{
      const el = document.getElementById("tab-"+k);
      if (el) el.classList.toggle("hidden", k!==name);
    });
    setBg(name);
    try{ localStorage.setItem(LS_LAST_TAB, name); }catch(_e){}
  
    try{ applyLang(); }catch(e){}
    try{ updateLangFlags(); }catch(e){}
    try{ renderWallpaperUI(); }catch(e){}
  
    if (name === "referrals"){
      try{ if (getHandle()) $("refLoad")?.click(); }catch(e){}
    }
    if (name === "leaderboard"){
      try{ bindLeaderboardUI(); }catch(e){}
      try{ loadLeaderboard(LB_DAYS||7); }catch(e){}
    }
    if (name === "prediction"){
      try{ loadPredictionSignals({ force:true }); }catch(e){}
    }
    if (name === "extthemes") {
      try{ renderExtThemes(); }catch(e){}
      try{ renderExtWallpapers(); }catch(e){}
      try{ renderExtCustomBgUI(); }catch(e){}
      try{ setExtView(normalizeExtViewValue(localStorage.getItem(LS_EXT_VIEW)||"theme"), { force:true, silent:true }); }catch(e){}
    }
    if (name === "admin"){
      try{ syncAdminUi(); }catch(e){}
    }
    if (name === "wallet"){
      try{ loadPlans(); }catch(e){}
      try{ loadBillingProof(); }catch(e){}
      try{ setSfUi(); }catch(e){}
    }
}

// Simple info modal (no dependencies)
  function showInfoModal(title, html){
    try{
      const old = document.getElementById("gmxInfoModal");
      if (old) old.remove();
      const wrap = document.createElement("div");
      wrap.id = "gmxInfoModal";
      wrap.style.cssText = "position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,.55);display:flex;align-items:center;justify-content:center;padding:16px;";
      wrap.innerHTML = `
        <div style="max-width:520px;width:100%;background:rgba(20,20,24,.98);border:1px solid rgba(255,255,255,.12);border-radius:16px;box-shadow:0 12px 40px rgba(0,0,0,.5);padding:16px 16px 12px;">
          <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:10px;">
            <div style="font-weight:800;font-size:15px;line-height:1.2;">${escapeHtml(title||"Info")}</div>
            <button id="gmxInfoClose" type="button" style="border:0;background:rgba(255,255,255,.08);color:#fff;border-radius:10px;padding:6px 10px;cursor:pointer;">OK</button>
          </div>
          <div style="font-size:13px;line-height:1.45;color:rgba(255,255,255,.88);">${html||""}</div>
        </div>
      `;
      wrap.addEventListener("click", (e)=>{ if (e.target===wrap) wrap.remove(); });
      document.body.appendChild(wrap);
      const btn = document.getElementById("gmxInfoClose");
      if (btn) btn.onclick = ()=>wrap.remove();
    }catch(e){}
  }


  function tab(name){
    const nextTab = (name === "_force_home") ? "home" : normalizeTopLevelTab(name);
    // Browsing is always allowed. Actions are gated via requireConnected().
    showTab(nextTab);
    try{ trackEvent("tab_open", { tab: String(nextTab||"") }); }catch(_e){}
  }
  try{ globalThis.__gmxShowTab = tab; }catch(_e){}
  try{ globalThis.switchTab = tab; }catch(_e){}
  ensurePredictionTabVisible();
  document.querySelectorAll(".tab").forEach(b=>b.addEventListener("click", ()=>tab(b.dataset.tab)));

  function normalizeHandle(input){ return __getGMXAuth().normalizeHandle(input); }

  function getHandle(){ return __getGMXAuth().getHandle(); }

  function siteLang(){
    try{ return String(localStorage.getItem(LS_SITE_LANG) || "en").toLowerCase(); }catch(_e){ return "en"; }
  }
  function getBestMode(){
    try{ return localStorage.getItem(LS_BEST_ENABLED) === "1"; }catch(_e){ return false; }
  }
  function setBestMode(next, silent){
    const on = !!next;
    try{ localStorage.setItem(LS_BEST_ENABLED, on ? "1" : "0"); }catch(_e){}
    try{ syncBestModeUi(); }catch(_e){}
    if (!silent){
      try{ window.postMessage({ type: "GMX_SYNC_NOW", reason: "best_mode_change" }, "*"); }catch(_e){}
    }
    return on;
  }
  function ensureFreshToggleDefaults(){
    try{
      if (localStorage.getItem(LS_TOGGLES_BOOTSTRAP_V2) === "1") return;
      localStorage.setItem(LS_BEST_ENABLED, "0");
      localStorage.setItem(LS_GM_CLEAN_FILL, "0");
      localStorage.setItem(LS_GN_CLEAN_FILL, "0");
      localStorage.setItem(LS_TOGGLES_BOOTSTRAP_V2, "1");
    }catch(_e){}
  }

  function bestCopyText(){
    return getBestMode()
      ? {
          btn: "Best: live",
          hint: "Best live pulls fresh options, keeps the strongest one, and saves it."
        }
      : {
          btn: "Best: saved",
          hint: "Best uses the strongest line from your saved list."
        };
  }
  function syncBestModeUi(){
    const copy = bestCopyText();
    ["gmBestModeToggle","gnBestModeToggle"].forEach((id)=>{ const el = $(id); if (el) el.textContent = copy.btn; });
    ["gmBestModeHint","gnBestModeHint"].forEach((id)=>{ const el = $(id); if (el) el.textContent = copy.hint; });
    ["gmBestBtn","gnBestBtn"].forEach((id)=>{ const el = $(id); if (el) el.textContent = getBestMode() ? "Best live" : "Best"; });
  }

  ensureFreshToggleDefaults();
  try{ syncBestModeUi(); }catch(_e){}
  try{ syncCleanFillUi(); }catch(_e){}

  // --- Lightweight analytics (no content) ---
  function abVariant(){
    const h = getHandle() || "anon";
    const key = "gmx_ab_paywall_v1_" + h;
    const cached = localStorage.getItem(key);
    if (cached === "A" || cached === "B") return cached;
    // stable hash (fast)
    let x = 5381;
    for (let i=0;i<h.length;i++) x = ((x<<5)+x) + h.charCodeAt(i);
    const v = (Math.abs(x) % 2 === 0) ? "A" : "B";
    localStorage.setItem(key, v);
    return v;
  }

  async function trackEvent(type, meta){
    if (!getToken()){ return; }
    try{
      if (!getHandle()) return;
      await api("/api/event", "POST", { type, meta: meta || {} });
    }catch(_e){}
  }

  // --- Soft paywall modal ---
  function openLimitModal(payload){
    const m = $("limit_modal");
    if (!m) return;
    const v = abVariant();
    const desc = $("limit_modal_desc");
    const hint = $("limit_modal_hint");
    const kind = payload?.kind || "gm";
    const resetAt = payload?.resetAt || "";
    if (desc){
      desc.textContent = (v === "A")
        ? `You reached the free saved-line cap for ${kind.toUpperCase()}. Upgrade to Pro for unlimited saved lines + all cosmetics`
        : `Free saved-line cap reached for ${kind.toUpperCase()}. Pro removes caps and unlocks everything`;
    }
    if (hint){
      hint.textContent = resetAt ? (`Next reset: ${resetAt}`) : "";
    }
    m.classList.remove("hidden");
    trackEvent("upgrade_modal_open", { v, kind, reason: payload?.reason || "limit" });
  }
  function closeLimitModal(){
    const m = $("limit_modal");
    if (m) m.classList.add("hidden");
  }

  function bindLimitModal(){
    const m = $("limit_modal");
    const close = $("limit_modal_close");
    const up = $("limit_modal_upgrade");
    if (m) m.addEventListener("click", (e)=>{ if (e.target === m) closeLimitModal(); });
    if (close) close.onclick = ()=>closeLimitModal();
    if (up) up.onclick = ()=>{
      closeLimitModal();
      // move user to Upgrade Pro tab
      try{ tab("wallet"); }catch{}
      trackEvent("pay_click", { v: abVariant(), source:"paywall_modal" });
    };
  }

  // --- Payment UX state machine ---
  function setPayState(state, hint){
    const box = $("pay_state_box");
    const s1 = $("pay_step_processing");
    const s2 = $("pay_step_confirming");
    const s3 = $("pay_step_verified");
    const h = $("pay_state_hint");
    if (!box || !s1 || !s2 || !s3) return;

    const reset = ()=>{
      [s1,s2,s3].forEach(x=>{
        x.style.opacity = "0.55";
        x.style.borderColor = "var(--border)";
      });
    };
    reset();
    box.classList.remove("hidden");

    const on = (el)=>{
      el.style.opacity = "1";
      el.style.borderColor = "rgba(0,0,0,0.25)";
    };

    if (state === "idle"){
      box.classList.add("hidden");
    } else if (state === "processing"){
      on(s1);
    } else if (state === "confirming"){
      on(s1); on(s2);
    } else if (state === "verified"){
      on(s1); on(s2); on(s3);
    } else if (state === "failed"){
      // show as processing but with hint
      on(s1);
    }
    if (h) h.textContent = hint ? String(hint) : "";
  }

  function openPaySuccess(){
    const m = $("pay_success_modal");
    if (!m) return;
    m.classList.remove("hidden");
  }
  function closePaySuccess(){
    const m = $("pay_success_modal");
    if (m) m.classList.add("hidden");
  }
  function bindPaySuccess(){
    const m = $("pay_success_modal");
    const ok = $("pay_success_ok");
    if (m) m.addEventListener("click", (e)=>{ if (e.target === m) closePaySuccess(); });
    if (ok) ok.onclick = ()=>closePaySuccess();
  }

  function getToken(){ return __getGMXAuth().getToken(); }

  function isConnected(){ return __getGMXAuth().isConnected(); }
  function requireConnected(target){ return __getGMXAuth().requireConnected(target); }

  
  function isPublicApi(path){ return __getGMXAuth().isPublicApi(path); }

  async function initSession(force=false){ return await __getGMXAuth().initSession(force); }

  async function api(path, method="GET", body, opts={}){ return await __getGMXAuth().api(path, method, body, opts); }

  var __gmxAuthInstance;

  function __getGMXAuth(){
    if (__gmxAuthInstance) return __gmxAuthInstance;
    if (!window.__GMXAuthFactory) throw new Error("GMX auth factory missing");
    __gmxAuthInstance = window.__GMXAuthFactory({
      API,
      LS_HANDLE,
      LS_TOKEN,
      LS_IS_ADMIN,
      LS_ADMIN_CLAIMABLE,
      isLocalDevHost,
      getAdminToken,
      setAuthOk: (v)=>{ AUTH_OK = !!v; },
      $,
      t,
      toast,
      escapeHtml,
      applyAdminVisibility,
      ping,
      setDegraded
    });
    return __gmxAuthInstance;
  }



  function setApiPillState(state){
    const d = $("apiDot");
    const tEl = $("apiText");
    const active = state === "active";
    if (d) d.classList.toggle("ok", active);
    if (tEl) tEl.textContent = active ? "active" : (state === "offline" ? "offline" : "inactive");
  }

  async function ping(){
    const sessionLive = !!(getHandle() && getToken() && AUTH_OK);
    if (!sessionLive){
      setApiPillState("inactive");
      return;
    }
    try{
      const j = await api("/api/health");
      setApiPillState(j && j.ok ? "active" : "offline");
    }catch{
      setApiPillState("offline");
    }
  }

  // Expose a retry hook for the degraded bar (wired earlier).
  window.__gmxRetryNow = async ()=>{
    try{ await ping(); }catch{}
    // If user already set a handle, try to refresh token silently.
    try{ if (getHandle()) await initSession(true); }catch{}
    // Refresh public panels when possible.
    try{ if (CURRENT_TAB === "wallet"){ await loadPlans(); await loadBillingProof(); } }catch{}
    try{ if (CURRENT_TAB === "referrals"){ scheduleRefStatsRefresh(120); } }catch{}
    try{ if (getHandle()) await refreshUsage(); }catch{}
  };

  window.addEventListener("online", ()=>{ try{ setDegraded(false); window.__gmxRetryNow?.(); }catch{} });

  let BUILD_ID = "";

  async function loadBuild(){
    try{
      const j = await api("/api/version?x=1");
      BUILD_ID = String(j.build || "");
      const b = $("ui_build");
      if (b) b.textContent = BUILD_ID ? ("build " + BUILD_ID) : "";
      const link = document.querySelector('link[rel="stylesheet"]');
      if (link && link.href.includes("BUILD")){
        link.href = "/app.css?v=" + encodeURIComponent(j.build);
      }
    }catch{
      AUTH_OK = false;
      try{ applyAdminVisibility(); }catch{}
    }
  }

  function watchBuildUpdates(){
    // Helps when the wallet/extension updates and the page needs a clean reload.
    let last = BUILD_ID;
    let busy = false;
    setInterval(async ()=>{
      if (busy) return;
      busy = true;
      try{
        const j = await api("/api/version?x=1");
        const now = String(j.build || "");
        if (last && now && now !== last){
          toast("ok", "Update installed. Reloading...");
          setTimeout(()=>{ try{ location.reload(); }catch{} }, 700);
        }
        if (now) last = now;
      }catch(e){}
      busy = false;
    }, 5 * 60 * 1000);
  }


  function normLimitForUI(limit){
    const n = Number(limit);
    if (!Number.isFinite(n)) return Infinity;
    // backend uses a huge number to represent "unlimited" for Pro
    if (n >= 999999) return Infinity;
    return n;
  }

  function setMeter(valId, fillId, used, limit){
    const v = $(valId);
    const f = $(fillId);
    const cap = normLimitForUI(limit);
    if (v) v.textContent = (cap === Infinity) ? `${used}/unlimited` : `${used}/${cap}`;
    if (f){
      const pct = (cap === Infinity) ? 100 : (cap ? Math.min(100, Math.round((used/cap)*100)) : 0);
      f.style.width = pct + "%";
    }
  }

function renderHelpModal(){
  const gmSaved = Number(LAST_SAVED.gm ?? 0) || 0;
  const gnSaved = Number(LAST_SAVED.gn ?? 0) || 0;
  const gmUsed = Number(LAST_USAGE?.gm?.used ?? 0) || 0;
  const gnUsed = Number(LAST_USAGE?.gn?.used ?? 0) || 0;
  const gmLimit = normLimitForUI(LAST_USAGE?.gm?.limit ?? 70);
  const gnLimit = normLimitForUI(LAST_USAGE?.gn?.limit ?? 70);

  const savedEl = $("help_saved");
  if (savedEl) savedEl.textContent = isPro() ? `GM ${gmSaved}/unlimited • GN ${gnSaved}/unlimited` : `GM ${gmSaved}/${SAVE_CAP_FREE} • GN ${gnSaved}/${SAVE_CAP_FREE}`;

  const dailyEl = $("help_daily");
  if (dailyEl) dailyEl.textContent = (isPro() || gmLimit===Infinity || gnLimit===Infinity)
    ? `GM ${gmUsed}/unlimited • GN ${gnUsed}/unlimited`
    : `GM ${gmUsed}/${gmLimit} • GN ${gnUsed}/${gnLimit}`;

  // aggregate bars
  const savedFill = $("helpSavedFill");
  if (savedFill){
    if (isPro()) savedFill.style.width = "100%";
    else{
      const used = gmSaved + gnSaved;
      const cap = SAVE_CAP_FREE * 2;
      savedFill.style.width = Math.min(100, Math.round((used/cap)*100)) + "%";
    }
  }
  const dailyFill = $("helpDailyFill");
  if (dailyFill){
    if (isPro() || gmLimit===Infinity || gnLimit===Infinity) dailyFill.style.width = "100%";
    else{
      const used = gmUsed + gnUsed;
      const cap = (gmLimit + gnLimit) || 140;
      dailyFill.style.width = Math.min(100, Math.round((used/cap)*100)) + "%";
    }
  }
}

function openHelpModal(){
  const m = $("help_modal");
  if (!m) return;
  try{ renderHelpModal(); }catch{}
  m.classList.remove("hidden");
}
function closeHelpModal(){
  const m = $("help_modal");
  if (!m) return;
  m.classList.add("hidden");
}

function bindHelpModal(){
  const m = $("help_modal");
  if (!m) return;
  m.addEventListener("click", (e)=>{ if (e.target === m) closeHelpModal(); });

  const closeBtn = $("help_close");
  if (closeBtn) closeBtn.onclick = ()=>closeHelpModal();

  const goWallet = $("help_go_wallet");
  if (goWallet) goWallet.onclick = ()=>{ closeHelpModal(); tab("wallet"); };

  const openBtn = $("btnHelp");
  if (openBtn) openBtn.onclick = ()=>openHelpModal();

  window.addEventListener("keydown", (e)=>{
    if (e.key === "Escape" && !$("help_modal")?.classList.contains("hidden")) closeHelpModal();
    if (e.key === "?" && ($("help_modal")?.classList.contains("hidden"))) openHelpModal();
  });
}

async function refreshUsage(){
    if (!getToken()){ return; }
    const h = getHandle();
    if (!h) return;
    try{
      const j = await api("/api/usage");
      AUTH_OK = true;
      applyAdminVisibility();

      const fallbackFree = Number(j?.limits?.freeDaily ?? 70) || 70;
      // Keep Free saved-lines cap in sync with backend config (no UI hardcodes)
      const cap = Number(j?.limits?.saveCapFree ?? SAVE_CAP_FREE) || SAVE_CAP_FREE;
      SAVE_CAP_FREE = Math.max(10, Math.min(1000, cap));
      const gm = j.gm || { used:0, limit:fallbackFree };
            const gn = j.gn || { used:0, limit:fallbackFree };

      LAST_USAGE = { gm, gn, resetAt: j.resetAt || null };

      SUB = j.sub || null;
      renderWalletStatus(j.sub);

      const gmCapUI = normLimitForUI(gm.limit);
      const gnCapUI = normLimitForUI(gn.limit);
      const up = $("usedPill");
      if (up) up.textContent = (isPro() || gmCapUI===Infinity || gnCapUI===Infinity)
        ? `GM ${gm.used}/unlimited • GN ${gn.used}/unlimited`
        : `GM ${gm.used}/${gmCapUI} • GN ${gn.used}/${gnCapUI}`;

      // Header status pills
      try{
        const pp = $("planPill");
        if (pp) pp.textContent = isPro() ? "Pro" : "Free";
        const sp = $("syncPill");
        if (sp) {
          const d = new Date();
          sp.textContent = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
        }
      }catch(_e){}

      // meters (optional)
      setMeter("gmDailyVal","gmDailyFill", gm.used, gm.limit);
      setMeter("gnDailyVal","gnDailyFill", gn.used, gn.limit);

      const gmu = $("kGmUsed");
      if (gmu) gmu.textContent = String(gm.used);
      const gnu = $("kGnUsed");
      if (gnu) gnu.textContent = String(gn.used);

      const ra = $("kResetAt");
      if (ra) ra.textContent = j.resetAt || "-";


      // refresh UI that depends on subscription / limits
      fillStyles();
      fillPacks();
      try{ window.__syncProControls && window.__syncProControls(); }catch(e){}

      applyUserBg();
      initWallpapers();

      // themes + view
      renderThemes();
      initExtWallpaperControls();
      normalizeStoredExtWallpaperSelections();
      renderExtThemes();
      renderExtWallpapers();
      renderExtCustomBgUI();
      setExtView(normalizeExtViewValue(localStorage.getItem(LS_EXT_VIEW)||"theme"), { force:true, silent:true });

      // also refresh referral count for unlocks
      try{ scheduleRefStatsRefresh(120); }catch(e){}

      try{ if (!$("help_modal")?.classList.contains("hidden")) renderHelpModal(); }catch(_e){}
    }catch(e){
      AUTH_OK = false;
      try{ applyAdminVisibility(); }catch(_e){}
    }
  }

  function applyAdminVisibility(){
    const h = getHandle();
    const tok = localStorage.getItem(LS_TOKEN) || "";
    // show Admin only after we validated the session in this page load
    const isAdmin = AUTH_OK && (localStorage.getItem(LS_IS_ADMIN) === "1");
    const ta = $("t_admin");
    if (ta) ta.classList.toggle("hidden", !isAdmin);
    if (!isAdmin) document.getElementById("tab-admin")?.classList.add("hidden");
  }


  // ----- Lists (single saved bank per kind; legacy global/lang banks migrate once) -----
  function linesFromText(t){
    return String(t||"").split(/\r?\n/).map(x=>x.trim()).filter(x=>x && x!==EMPTY);
  }

  function getLangIndexKey(kind){ return kind==="gm" ? GM_LANGS : GN_LANGS; }
  function getGlobalKey(kind){ return kind==="gm" ? GM_GLOBAL : GN_GLOBAL; }
  function getLangKey(kind, lang){ return `gmx_${kind}_lang_${lang}`; }
  function getBankKey(kind){ return kind==="gm" ? "gmx_gm_bank" : "gmx_gn_bank"; }
  function getBankMigrationKey(kind){ return kind==="gm" ? "gmx_gm_bank_migrated_v2" : "gmx_gn_bank_migrated_v2"; }

  function getLangIndex(kind){
    try{ return JSON.parse(localStorage.getItem(getLangIndexKey(kind)) || "[]"); }
    catch{ return []; }
  }
  function setLangIndex(kind, arr){
    const uniq = Array.from(new Set(arr.filter(Boolean)));
    localStorage.setItem(getLangIndexKey(kind), JSON.stringify(uniq));
  }

  function readKey(key){ return linesFromText(localStorage.getItem(key) || ""); }
  function writeKey(key, lines){ localStorage.setItem(key, lines.join("\n")); }

  function allLegacyKeysForKind(kind){
    const keys = [getGlobalKey(kind)];
    for (const lang of getLangIndex(kind)){
      keys.push(getLangKey(kind, lang));
    }
    return Array.from(new Set(keys));
  }

  function migrateLegacyBank(kind){
    const bankKey = getBankKey(kind);
    const marker = getBankMigrationKey(kind);
    const bankNow = dedupeLines(readKey(bankKey));
    if ((localStorage.getItem(marker) || "") === "1") {
      if (bankNow.join("\n") !== readKey(bankKey).join("\n")) writeKey(bankKey, bankNow);
      return bankNow.length;
    }

    const merged = [];
    for (const key of allLegacyKeysForKind(kind)){
      merged.push(...readKey(key));
    }
    merged.push(...bankNow);

    const finalBank = dedupeLines(merged);
    writeKey(bankKey, finalBank);

    for (const key of allLegacyKeysForKind(kind)){
      localStorage.removeItem(key);
    }
    setLangIndex(kind, []);
    try{ localStorage.setItem(kind === "gm" ? LS_GM_REPLY_LANG : LS_GN_REPLY_LANG, "en"); }catch{}
    try{ localStorage.setItem(marker, "1"); }catch{}
    return finalBank.length;
  }


// ----- Best (pick a strong line and copy it) -----
function bestLineShape(kind, s){
  const t = String(s || "").toLowerCase().trim();
  if (!t) return "";
  return t
    .replace(/[\u{1F300}-\u{1FAFF}]/gu, " ")
    .replace(/\b(gm|good morning|morning)\b/g, "gm")
    .replace(/\b(gn|good night|night)\b/g, "gn")
    .replace(/\b(legend|bro|degen|anon|friend|homie)\b/g, "@voc")
    .replace(/\b(clean|good|quiet|simple|steady|calm|nice|solid|strong|soft|easy|kind|warm|smooth)\b/g, "@adj")
    .replace(/\b(good one|nice post|clean one|strong post|solid post|good post|clean post|strong take|solid take|clean read|good read|nice gm|solid read|nice read)\b/g, "@post")
    .replace(/\b(sleep easy|sleep well|rest easy|rest well|good rest|real rest|proper rest|easy reset|soft landing|calm close|easy close|soft close)\b/g, "@close")
    .replace(/\b(start the day|start the session|open the day|open the morning|open the session|close the day|end the day)\b/g, "@phase")
    .replace(/[^a-z0-9\s]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function scoreLineForBest(kind, s){
  const t = String(s || "").trim();
  if (!t) return -1e9;

  const len = t.length;
  const lower = t.toLowerCase();
  const words = lower
    .replace(/[^a-z0-9\u00c0-\u024f\s']+/gi, " ")
    .split(/\s+/)
    .map(x => x.trim())
    .filter(Boolean);
  const clauses = t.split(",").map(x => x.trim()).filter(Boolean);
  const concreteRx = /(coffee|brain|screen|pace|hour|desk|today|tonight|tomorrow|morning|night|rest|scroll|tab|room|start|stop|sleep|reset|sunrise|sunset|bed|wake|waking|closing|working|loading|watching|shipping|waiting|window|rain|light|chair|thread|reply)/i;
  const motionRx = /(starting|keeping|calling|logging|leaving|waking|closing|working|loading|watching|shipping|waiting|forcing|scrolling|typing|sending|holding|parking|dragging|landing|resetting|sleeping)/i;
  const greetOnlyRx = /^(gm|good morning|morning|gn|good night|night)(?:\s+(legend|bro|degen|anon|friend|homie))?(?:\s*[\u{1F300}-\u{1FAFF}])?$/iu;
  const fillerRx = /(nice read here|this was a solid read|strong post and a clean start|wishing you a smooth day ahead|hope your day starts easy|hope the morning treats you well|hope you get a calm reset tonight|soft close here|rest well after this one|hope you get an easy reset|calm post to end the day on|sleep well tonight)/i;
  const hollowRx = /(strong post|solid read|clean read|nice read|good read|clean post|good post|solid post|strong take|clean take|good take)/i;
  const cannedStarterRx = /^(gm|gn)\s*,?\s*(this|keeping|saving|holding)\b/i;
  const cannedClauseRx = /\b(this (reads|lands|sits|holds|closes)\b|keeping this one\b|saving this one\b|holding this one\b)\b/i;
  const phaseClicheRx = /\b(before the feed gets loud|once the feed calms down|while the tab is still quiet|for the slower close|the last scroll tonight|better morning shape than most)\b/i;
  let score = 0;

  if (len >= 18 && len <= 84) score += 12;
  else if (len >= 14 && len <= 96) score += 6;
  else if (len < 14) score -= 16;
  else score -= 8;

  if (words.length >= 4 && words.length <= 11) score += 10;
  else if (words.length >= 3 && words.length <= 13) score += 4;
  else score -= 10;

  if (clauses.length === 2) score += 5;
  else if (clauses.length <= 3) score += 2;
  else score -= (clauses.length - 3) * 4;

  if (/[\.\!\?]$/.test(t)) score -= 2;
  if (/[—–-]/.test(t)) score -= 5;
  try {
    const emojiHits = (t.match(/[\u{1F300}-\u{1FAFF}]/gu) || []).length;
    if (emojiHits === 1) score += 5;
    else if (emojiHits === 2) score += 2;
    else if (emojiHits === 0) score -= 6;
    else score -= (emojiHits - 2) * 5;
  } catch {}

  if (kind === "gm") {
    if (/^gm\b/i.test(t)) score += 7;
    else if (/^good morning\b/i.test(t)) score += 3;
  } else {
    if (/^gn\b/i.test(t)) score += 7;
    else if (/^good night\b/i.test(t)) score += 3;
  }

  if (greetOnlyRx.test(t)) score -= 32;
  if (lower === "gm" || lower === "gn" || lower === "good morning" || lower === "good night") score -= 18;
  if (/^(that|this|when|what|why|you|yeah|love|feels|there's)\b/i.test(t)) score -= 10;
  if (/(platform|campaign|liquidity|interoperability|tokenomics|roadmap|investors|engagement|strategy)/i.test(t)) score -= 10;
  if (/(morning legend|night legend|gm legend|gn legend|good alpha|nice gm|good looks)$/i.test(lower)) score -= 18;

  if (concreteRx.test(t)) score += 8;
  else score -= 6;
  if (motionRx.test(t)) score += 6;
  if (/(hope|wishing|sending|sleep easy|easy start|good morning|good night|soft landing|kind start|quiet reset)/i.test(t)) score += 5;
  if (/\b(still|but|yet|though|maybe|almost|barely|even if)\b/i.test(t)) score += 4;
  if (fillerRx.test(t)) score -= 16;
  if (hollowRx.test(t)) score -= 12;
  if (/(that reads fine|that is the line|that moves enough|that is enough to watch)/i.test(t)) score -= 10;

  const uniq = new Set(words);
  score += Math.min(6, uniq.size);
  if (words.length >= 5 && uniq.size <= Math.max(2, Math.floor(words.length * 0.55))) score -= 8;

  const stale = ["clean", "good", "quiet", "simple", "steady", "calm"];
  for (const word of stale){
    const m = lower.match(new RegExp(`\\b${word}\\b`, "g"));
    const count = Array.isArray(m) ? m.length : 0;
    if (count > 1) score -= (count - 1) * 4;
  }

  if (/(smooth day ahead|rest well tonight)/i.test(t)) score -= 10;
  if (/(gm|gn|good morning|good night).*(gm|gn|good morning|good night)/i.test(t)) score -= 8;

  return score;
}

function pickBestLine(kind, lines){
  const arr = (lines||[]).map(x=>String(x||"").trim()).filter(Boolean);
  if (!arr.length) return "";

  const byShape = new Map();
  for (const v of arr){
    const sc = scoreLineForBest(kind, v);
    if (!Number.isFinite(sc) || sc <= -1e8) continue;
    const shape = bestLineShape(kind, v) || v.toLowerCase();
    const prev = byShape.get(shape);
    if (!prev || sc > prev.sc || (sc === prev.sc && v.length > prev.v.length)) byShape.set(shape, { v, sc, shape });
  }

  const scored = Array.from(byShape.values());
  if (!scored.length) return arr[0] || "";

  scored.sort((a,b)=> b.sc - a.sc || b.v.length - a.v.length);
  const lastKey = (kind === "gm") ? "gmx_last_best_gm" : "gmx_last_best_gn";
  const histKey = (kind === "gm") ? "gmx_last_best_shapes_gm" : "gmx_last_best_shapes_gn";
  const last = (localStorage.getItem(lastKey) || "").trim();
  const lastShape = bestLineShape(kind, last);
  let recentShapes = [];
  try{ recentShapes = JSON.parse(localStorage.getItem(histKey) || "[]"); }catch{}
  recentShapes = Array.isArray(recentShapes) ? recentShapes.map(x=>String(x||"").trim()).filter(Boolean).slice(-3) : [];
  const recentSet = new Set(recentShapes);
  const pick = (scored.find(x => x.v.trim() !== last && x.shape !== lastShape && !recentSet.has(x.shape))
    || scored.find(x => x.v.trim() !== last && x.shape !== lastShape)
    || scored[0] || {}).v || "";
  try{
    localStorage.setItem(lastKey, pick);
    const nextShape = bestLineShape(kind, pick);
    const merged = nextShape ? [...recentShapes, nextShape].slice(-3) : recentShapes;
    localStorage.setItem(histKey, JSON.stringify(merged));
  }catch{}
  return pick;
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

  const mode = modeEl ? modeEl.value : "mid";
  const lang = currentLang(kind);
  let style = styleEl ? styleEl.value : "classic";
  const packId = packEl ? (packEl.value || "classic") : "classic";
  const packIdx = PACKS.findIndex(p=>p.id===packId);
  const packLocked = (!isPro() && packIdx >= unlockedPacksCount());
  const pack = PACKS.find(p=>p.id===packId) || PACKS[0];
  if (!packLocked && pack && pack.style) style = pack.style;

  const strength = getAntiStrength(kind);
  const antiN = antiWindow(strength);
  const keyActive = activeKey(kind);

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
    const rk = best.toLowerCase();
    const bestShape = bestLineShape(kind, best);
    const already = cur.some((s)=>{
      const raw = String(s||"").trim();
      if (!raw) return false;
      if (raw.toLowerCase() === rk) return true;
      return !!bestShape && bestLineShape(kind, raw) === bestShape;
    });
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

  function escapeHtml(s){
    return String(s||"")
      .replaceAll("&","&amp;")
      .replaceAll("<","&lt;")
      .replaceAll(">","&gt;")
      .replaceAll('"',"&quot;")
      .replaceAll("'","&#039;");
  }

  function isNetworkishErrorMessage(msg){
    const m = String(msg || "").trim();
    if (!m) return false;
    return m === "request_failed"
      || m === "timeout"
      || m === "not_connected"
      || m.includes("Failed to fetch")
      || m.includes("NetworkError")
      || m.includes("fetch")
      || m.includes("ECONN");
  }

  function friendlyUiErrorMessage(msg, opts){
    const m = String(msg || "").trim();
    const scope = String(opts && opts.scope || "").trim();
    if (!m) return scope === "connect" ? "Connection failed. Try again." : "Request failed. Try again.";
    if (m === "timeout") return scope === "generate" ? "Generation timed out. Try again." : "Network timeout. Try again.";
    if (m === "unauthorized") return "Unauthorized. Re-connect your handle.";
    if (m === "request_failed"){
      if (scope === "generate") return "Generation request failed. Check the backend and try again.";
      if (scope === "connect") return "Connection failed. Check the backend/runtime and try again.";
      return "Request failed. Check the backend/runtime and try again.";
    }
    if (m === "not_connected") return "Connect first.";
    if (m === "rpc_unavailable") return "Solana RPC is unavailable right now. Try again in a moment.";
    if (m === "wallet_bind_required") return "Wallet binding is required before verify. Sign the wallet message and try again.";
    if (isNetworkishErrorMessage(m)) return "Network/API error. Try again.";
    return m;
  }

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

  const LS_DRAFT_GM_NEW = "gmx_draft_gm_new";
  const LS_DRAFT_GN_NEW = "gmx_draft_gn_new";
  const LS_DRAFT_GM_PASTE = "gmx_draft_gm_paste";
  const LS_DRAFT_GN_PASTE = "gmx_draft_gn_paste";

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
  function mergeAppendUnique(existing, newLines){
    const out = (existing||[]).map(s=>String(s||"").trim()).filter(Boolean);
    const seen = new Set(out.map(s=>s.toLowerCase()));
    for (const s of (newLines||[])){
      const t = String(s||"").trim();
      if (!t) continue;
      const k = t.toLowerCase();
      if (seen.has(k)) continue;
      seen.add(k);
      out.push(t);
    }
    return out;
  }
async function generate(kind, count){
    if (!requireConnected(kind==="gm"?"GM":"GN")) return;
    const h = getHandle();

    const modeEl  = kind==="gm" ? $("gmMode") : $("gnMode");
    const styleEl = kind==="gm" ? $("gmStyle") : $("gnStyle");
    const packEl  = kind==="gm" ? $("gmPack") : $("gnPack");

    const mode = modeEl ? modeEl.value : "mid";
    const lang = currentLang(kind);

    let style = styleEl ? styleEl.value : "classic";
    const packId = packEl ? (packEl.value || "classic") : "classic";
    const packIdx = PACKS.findIndex(p=>p.id===packId);
    const packLocked = (!isPro() && packIdx >= unlockedPacksCount());
    const pack = PACKS.find(p=>p.id===packId) || PACKS[0];

    const msgEl = kind==="gm" ? $("gmMsg") : $("gnMsg");

    const strength = getAntiStrength(kind);
    const antiN = 0;
    const autoClean = (count <= 1) ? getCleanFillEnabled(kind) : false;

    if ((kind==="gm" ? gmView : gnView) === "lang") ensureIndexed(kind, lang);

    // Pack influences the effective style for generation (without locking manual style).
    if (!packLocked && pack && pack.style) style = pack.style;

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
    setBusy(kind, true);
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

        const cur = readKey(keyActive);
        const r = String(reply||"").trim();
        const exactKey = r.toLowerCase();
        const nearKey = repeatKey(r, Math.max(1, strength));
        const already = cur.some((s)=>{
          const raw = String(s||"").trim();
          if (!raw) return false;
          if (raw.toLowerCase() === exactKey) return true;
          if (strength > 0 && nearKey && repeatKey(raw, Math.max(1, strength)) === nearKey) return true;
          return false;
        });
        if (already){
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
        const exactSeen = new Set(readKey(keyActive).map(s=>String(s||"").trim().toLowerCase()).filter(Boolean));
        const accepted = [];
        const acceptedExact = new Set();
        const takeLines = (arr)=>{
          for (const raw of (arr || [])){
            const s = normalizeLine(raw);
            if (!s) continue;
            const exact = s.toLowerCase();
            if (exactSeen.has(exact)) continue;
            if (acceptedExact.has(exact)) continue;
            acceptedExact.add(exact);
            exactSeen.add(exact);
            accepted.push(s);
            if (accepted.length >= effCount) break;
          }
        };

        const buffer = 24;
        const genDeadline = Date.now() + 45000;
        let attempts = 0;
        while (accepted.length < effCount && attempts < 1){
          if (Date.now() > genDeadline) break;
          attempts++;
          const missing = effCount - accepted.length;
          const reqCount = Math.min(140, missing + buffer);
          const bulk = await api(`/api/generate-bulk?kind=${kind}&mode=${encodeURIComponent(mode)}&lang=${encodeURIComponent(lang)}&style=${encodeURIComponent(style)}&anti_last_n=0&count=${reqCount}`, "GET", null, { signal: ctrl.signal, timeoutMs: 12000 });
          takeLines(bulk.list || []);
          if (!Array.isArray(bulk.list) || bulk.list.length === 0) break;
        }

        const incoming = accepted.slice();
        const preferBest = autoClean || getBestMode();
        let selected = [];
        if (preferBest){
          const byShape = new Map();
          for (const line of incoming){
            const v = String(line || "").trim();
            if (!v) continue;
            const sc = scoreLineForBest(kind, v);
            if (!Number.isFinite(sc) || sc <= -1e8) continue;
            const shape = bestLineShape(kind, v) || v.toLowerCase();
            const prev = byShape.get(shape);
            if (!prev || sc > prev.sc || (sc === prev.sc && v.length > prev.v.length)) byShape.set(shape, { v, sc });
          }
          selected = Array.from(byShape.values())
            .sort((a,b)=> b.sc - a.sc || b.v.length - a.v.length)
            .slice(0, effCount)
            .map(x=>x.v);
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
      msgEl.innerHTML = `<span class="bad">${escapeHtml(friendly)}</span>`;
      logEvent("gen_error", { kind, err: m, friendly });
    } finally {
      INFLIGHT[kind] = false;
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

    REF_COUNT = eligible;

    if ($("refCountPill")) $("refCountPill").textContent = String(eligible);
    if ($("refCountRight")) $("refCountRight").textContent = String(eligible);
    if ($("refCountInline")) $("refCountInline").textContent = String(eligible);

    if ($("refConfirmedInline")) $("refConfirmedInline").textContent = String(confirmed);
    if ($("refActiveInline")) $("refActiveInline").textContent = String(active);
    if ($("refEligibleInline")) $("refEligibleInline").textContent = String(eligible);

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
    if (st)     try{ initWpLazyLoad(); }catch(_e){}

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
      REF_COUNT = eligible;
      if ($("refCountPill")) $("refCountPill").textContent = String(eligible);
      if ($("refCountRight")) $("refCountRight").textContent = String(eligible);
      if ($("refConfirmedInline")) $("refConfirmedInline").textContent = String(confirmed);
      if ($("refActiveInline")) $("refActiveInline").textContent = String(active);
      if ($("refEligibleInline")) $("refEligibleInline").textContent = String(eligible);
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
      if (CURRENT_TAB === "prediction") loadPredictionSignals({ force:false });
    }catch{}
  }, 60000);

// ----- Wallet / Billing -----
  let BILLING = { receiver:"", plans:[], solUsd:0, rpcPublic:"" };
  let selectedCurrency = "SOL"; // SOL | USDC | USDT
  let selectedPlanKey = "";
  let selectedPlan = null;

  // Wallet discovery: Wallet Standard + legacy injected providers.
  const WS_CHAIN = "solana:mainnet";
  const LS_WALLET_CHOICE = "gmx_wallet_choice_v2";

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

  // Minimal base58 (for signatures)
  const B58_ALPH = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
  const BILLING_MEMO_PROGRAM_ID = "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr";
  function b58encode(bytes){
    try{
      const src = (bytes instanceof Uint8Array) ? bytes : new Uint8Array(bytes);
      if (!src.length) return "";
      let digits = [0];
      for (let i=0;i<src.length;i++){
        let carry = src[i];
        for (let j=0;j<digits.length;j++){
          const x = (digits[j] << 8) + carry;
          digits[j] = x % 58;
          carry = (x / 58) | 0;
        }
        while (carry){
          digits.push(carry % 58);
          carry = (carry / 58) | 0;
        }
      }
      let str = "";
      for (let k=0;k<src.length && src[k] === 0;k++) str += "1";
      for (let q=digits.length-1;q>=0;q--) str += B58_ALPH[digits[q]];
      return str;
    }catch{ return ""; }
  }

  function walletSigBytes(out){
    const raw = out?.signature || out?.signedMessage || out?.signatureBytes || out;
    if (raw instanceof Uint8Array) return raw;
    if (ArrayBuffer.isView(raw)) return new Uint8Array(raw.buffer.slice(raw.byteOffset, raw.byteOffset + raw.byteLength));
    if (raw instanceof ArrayBuffer) return new Uint8Array(raw);
    if (Array.isArray(raw)) return new Uint8Array(raw);
    return null;
  }

  async function walletSignMessageBytes(messageBytes){
    const bytes = (messageBytes instanceof Uint8Array) ? messageBytes : new Uint8Array(messageBytes || []);
    if (!bytes.length) throw new Error("wallet_bind_required");

    if (WALLET.kind === "standard") {
      const w = WALLET.wallet;
      const acc = WALLET.account;
      const feat = w?.features?.["solana:signMessage"]?.signMessage;
      if (typeof feat !== "function") throw new Error("wallet_no_message_sign");
      const out = await feat({ account: acc, message: bytes });
      const sig = b58encode(walletSigBytes(out) || []);
      if (!sig) throw new Error("wallet_bind_required");
      return sig;
    }

    const p = WALLET.provider;
    if (typeof p?.signMessage === "function") {
      let out = null;
      try {
        out = await p.signMessage(bytes, "utf8");
      } catch (_e) {
        out = await p.signMessage(bytes);
      }
      const sig = b58encode(walletSigBytes(out) || []);
      if (!sig) throw new Error("wallet_bind_required");
      return sig;
    }

    throw new Error("wallet_no_message_sign");
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
    const id = String(intentId || "").trim();
    if (!tx || !id || !web3?.TransactionInstruction || !web3?.PublicKey) return;
    tx.add(new web3.TransactionInstruction({
      programId: new web3.PublicKey(BILLING_MEMO_PROGRAM_ID),
      keys: [],
      data: new TextEncoder().encode(`GMXReply|${id}`)
    }));
  }

  function shortPk(pk){
    try{
      const s = String(pk?.toString?.() || pk || "");
      if (!s) return "";
      return s.slice(0,4) + "..." + s.slice(-4);
    }catch{ return ""; }
  }

  function safeIconSrc(icon){
    const s0 = String(icon || "").trim();
    if (!s0) return "";
    if (s0.startsWith("ipfs://")) return "https://ipfs.io/ipfs/" + s0.slice(7);
    const ok = ["data:","https://","http://","/assets/","chrome-extension://","moz-extension://","safari-extension://","blob:"];
    if (ok.some(p=>s0.startsWith(p))) return s0;
    return "";
  }
function defaultWalletIcon(name){
  const k = walletNameKey(name);
  if (k === "solflare") return "/assets/wallets/solflare.svg";
  if (k === "phantom") return "/assets/wallets/phantom.svg";
  if (k === "backpack") return "/assets/wallets/backpack.svg";

  // Fallback: simple letter avatar (data URL).
  const txt = (String(name||"W").slice(0,1).toUpperCase());
  const s = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><rect rx="18" ry="18" width="64" height="64" fill="rgba(14,165,233,1)"/><text x="32" y="40" text-anchor="middle" font-family="system-ui, -apple-system, Segoe UI, Roboto, Arial" font-weight="800" font-size="22" fill="white">${txt}</text></svg>`;
  return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(s);
}

  function walletNameKey(name){ return String(name || "").trim().toLowerCase(); }

  function getWalletStandardWallets(){
    try{
      const w = window.navigator?.wallets;
      if (!w) return [];
      if (Array.isArray(w)) return w;
      if (typeof w.get === "function") return w.get() || [];
      if (typeof w.values === "function") return Array.from(w.values());
      if (typeof w[Symbol.iterator] === "function") return Array.from(w);
    }catch{}
    return [];
  }

  function listWalletChoices(){
    const out = [];

    // Wallet Standard
    try{
      const ws = getWalletStandardWallets();
      for (const w of ws){
        if (!w?.features?.["standard:connect"]) continue;
        const chains = w?.chains || [];
        const isSol = chains.some(c => String(c||"").startsWith("solana:"));
        if (!isSol) continue;
        out.push({ kind:"standard", name: String(w.name || "Wallet"), icon: (safeIconSrc(w.icon) || defaultWalletIcon(w.name)), wallet: w });
      }
    }catch{}

    // Legacy injected providers (still common)
    try{
      const p = window.solflare || (window.solana?.isSolflare ? window.solana : null);
      if (p?.connect && (p?.signAndSendTransaction || p?.signTransaction)) out.push({ kind:"legacy", name:"Solflare", icon: defaultWalletIcon("Solflare"), provider:p });
    }catch{}
    try{
      const p = window.solana;
      if (p?.isPhantom && p?.connect && (p?.signAndSendTransaction || p?.signTransaction)) out.push({ kind:"legacy", name:"Phantom", icon: defaultWalletIcon("Phantom"), provider:p });
    }catch{}
    try{
      const p = window.backpack?.solana || (window.solana?.isBackpack ? window.solana : null);
      if (p?.connect && (p?.signAndSendTransaction || p?.signTransaction)) out.push({ kind:"legacy", name:"Backpack", icon: defaultWalletIcon("Backpack"), provider:p });
    }catch{}
    try{
      const p = window.solana;
      if (p?.connect && (p?.signAndSendTransaction || p?.signTransaction) && !p?.isPhantom && !p?.isSolflare && !p?.isBackpack){
        const nm = String(p?.name || p?.walletName || "Injected Wallet");
        out.push({ kind:"legacy", name:nm, icon: defaultWalletIcon(nm), provider:p });
      }
    }catch{}

    // Deduplicate by name (prefer standard)
    const byName = new Map();
    for (const w of out){
      const k = walletNameKey(w.name);
      const prev = byName.get(k);
      if (!prev || (prev.kind !== "standard" && w.kind === "standard")) byName.set(k, w);
    }
    const list = Array.from(byName.values());

    // Sort: Solflare first, then Phantom, Backpack, then others
    const order = ["solflare","phantom","backpack"];
    list.sort((a,b)=>{
      const ak = walletNameKey(a.name);
      const bk = walletNameKey(b.name);
      const ai = order.indexOf(ak);
      const bi = order.indexOf(bk);
      if (ai !== -1 || bi !== -1){
        if (ai === -1) return 1;
        if (bi === -1) return -1;
        return ai - bi;
      }
      return String(a.name).localeCompare(String(b.name));
    });

    return list;
  }

  function readWalletChoice(){
    try{ return localStorage.getItem(LS_WALLET_CHOICE) || ""; }catch{ return ""; }
  }
  function saveWalletChoice(name){
    try{ localStorage.setItem(LS_WALLET_CHOICE, String(name||"")); }catch{}
  }

  function setWalletUi(){
    const addr = $("sf_addr");
    const label = $("sf_label");
    const btnConnect = $("sf_connect");
    const btnDisconnect = $("sf_disconnect");
    const payBtn = $("sf_pay");
    const hint = $("sf_hint");

    if (addr){
      addr.textContent = (!WALLET.connected || !WALLET.publicKey) ? "not connected" : shortPk(WALLET.publicKey);
    }
    if (label){
      label.textContent = WALLET.connected ? (WALLET.name || "Wallet") : "Wallet";
    }

    if (btnConnect) btnConnect.classList.toggle("hidden", !!WALLET.connected);
    if (btnDisconnect) btnDisconnect.classList.toggle("hidden", !WALLET.connected);

    const canPay = !!(selectedPlan && WALLET.connected && WALLET.publicKey);
    if (payBtn) payBtn.disabled = !canPay;

    if (hint){
      if (!selectedPlan) hint.innerHTML = `<span class="muted">Select a plan above to continue.</span>`;
      else if (!WALLET.connected) hint.innerHTML = `<span class="muted">Now connect a wallet to pay in ${escapeHtml(selectedCurrency)}.</span>`;
      else hint.innerHTML = `<span class="ok">Ready.</span>`;
    }
  }

  
  function openPlanModal(){
    const m = $("plan_modal");
    if (!m) return;
    m.classList.remove("hidden");
  }
  function closePlanModal(){
    const m = $("plan_modal");
    if (!m) return;
    m.classList.add("hidden");
  }

function openWalletModal(){
    const m = $("sf_modal");
    if (!m) return;
    m.classList.remove("hidden");
    renderWalletList();
    // receiver hint
    const r = $("sf_modal_receiver");
    if (r) r.textContent = BILLING?.receiver ? shortPk(BILLING.receiver) : "—";
    const hm = $("sf_modal_msg");
    if (hm) hm.textContent = "";
  }
  function closeWalletModal(){
    const m = $("sf_modal");
    if (!m) return;
    m.classList.add("hidden");
  }

  function renderWalletList(){
    const listEl = $("walletPick");
    const hintEl = $("walletPickHint");
    const connectBtn = $("sf_modal_connect");
    if (!listEl) return;

    const choices = listWalletChoices();
    listEl.innerHTML = "";

    if (!choices.length){
      if (hintEl) hintEl.innerHTML = `<span class="muted">No wallet detected. Install Solflare / Phantom / Backpack.</span>`;
      if (connectBtn) connectBtn.disabled = true;
      return;
    }

    if (hintEl) hintEl.innerHTML = `<span class="muted">Choose a wallet and click Connect.</span>`;

    const saved = readWalletChoice();
    let picked = choices.find(x => walletNameKey(x.name) === walletNameKey(saved)) || choices[0];
    saveWalletChoice(picked.name);

    for (const c of choices){
      const row = document.createElement("div");
      row.className = "walletItem";
      row.dataset.name = c.name;
      row.classList.toggle("active", walletNameKey(c.name) === walletNameKey(picked.name));

      const icon = document.createElement("div");
      icon.className = "walletIcon";
      const src = safeIconSrc(c.icon) || defaultWalletIcon(c.name);
if (src){
  const img = document.createElement("img");
  img.alt = c.name;
  img.src = src;
  icon.appendChild(img);
} else {
  icon.textContent = (c.name || "W").slice(0,1).toUpperCase();
}

      const mid = document.createElement("div");
      mid.style.display = "flex";
      mid.style.flexDirection = "column";
      const nm = document.createElement("div");
      nm.className = "walletName";
      nm.textContent = c.name;
      const sub = document.createElement("div");
      sub.className = "walletSub";
      sub.textContent = (c.kind === "standard") ? "Wallet Standard" : "";
      mid.appendChild(nm);
      mid.appendChild(sub);

      row.appendChild(icon);
      row.appendChild(mid);

      row.onclick = ()=>{
        picked = c;
        saveWalletChoice(picked.name);
        Array.from(listEl.children).forEach(ch=>{
          try{ ch.classList.toggle("active", walletNameKey(ch.dataset.name) === walletNameKey(picked.name)); }catch{}
        });
      };

      listEl.appendChild(row);
    }

    if (connectBtn){
      connectBtn.disabled = false;
      connectBtn.onclick = async ()=>{
        const msg = $("sf_modal_msg");
        try{
          connectBtn.disabled = true;
          if (msg) msg.textContent = "Opening wallet...";
          await connectWalletByChoice(picked);
          closeWalletModal();
          const out = $("w_msg");
          if (out) out.innerHTML = `<span class="ok">Wallet connected.</span>`;
        }catch(e){
          if (msg) msg.innerHTML = `<span class="bad">${escapeHtml(String(e?.message || "wallet_connect_failed"))}</span>`;
        }finally{
          connectBtn.disabled = false;
          setWalletUi();
        }
      };
    }
  }

  async function connectWalletByChoice(choice){
    if (!choice) throw new Error("wallet_not_selected");
    const web3 = window.solanaWeb3;
    if (!web3?.PublicKey) throw new Error("web3_unavailable");

    // reset
    WALLET.connected = false;
    WALLET.kind = null;
    WALLET.name = "";
    WALLET.icon = "";
    WALLET.wallet = null;
    WALLET.account = null;
    WALLET.provider = null;
    WALLET.publicKey = null;

    if (choice.kind === "standard"){
      const w = choice.wallet;
      const connect = w?.features?.["standard:connect"]?.connect;
      if (typeof connect !== "function") throw new Error("wallet_connect_unavailable");
      const res = await connect();
      const accounts = res?.accounts || [];
      const acc = accounts.find(a => (a?.chains || []).includes(WS_CHAIN)) || accounts.find(a => (a?.chains || []).some(c=>String(c||"").startsWith("solana:"))) || accounts[0];
      if (!acc?.address) throw new Error("wallet_no_account");

      WALLET.connected = true;
      WALLET.kind = "standard";
      WALLET.name = choice.name;
      WALLET.icon = choice.icon;
      WALLET.wallet = w;
      WALLET.account = acc;
      WALLET.publicKey = new web3.PublicKey(acc.address);

      // auto-update on changes
      try{
        const ev = w?.features?.["standard:events"]?.on;
        if (typeof ev === "function"){
          ev("disconnect", ()=>{
            disconnectWallet();
            toast("warn", "Wallet disconnected.");
          });
          ev("change", ({ accounts })=>{
            try{
              const accs = accounts || [];
              const next = accs.find(a => (a?.chains || []).includes(WS_CHAIN)) || accs[0];
              if (!next?.address){ disconnectWallet(); return; }
              WALLET.account = next;
              WALLET.publicKey = new web3.PublicKey(next.address);
              setWalletUi();
            }catch{}
          });
        }
      }catch{}
      return;
    }

    // legacy
    const p = choice.provider;
    if (!p?.connect) throw new Error("wallet_connect_unavailable");
    const r = await p.connect();
    const pk = p.publicKey || r?.publicKey;
    if (!pk) throw new Error("wallet_no_account");

    WALLET.connected = true;
    WALLET.kind = "legacy";
    WALLET.name = choice.name;
    WALLET.provider = p;
    WALLET.publicKey = pk?.toBase58 ? pk : new web3.PublicKey(String(pk));
  }

  async function disconnectWallet(){
    try{
      if (WALLET.kind === "standard" && WALLET.wallet?.features?.["standard:disconnect"]?.disconnect){
        await WALLET.wallet.features["standard:disconnect"].disconnect();
      } else if (WALLET.kind === "legacy" && WALLET.provider?.disconnect){
        await WALLET.provider.disconnect();
      }
    }catch{}
    WALLET.connected = false;
    WALLET.kind = null;
    WALLET.name = "";
    WALLET.icon = "";
    WALLET.wallet = null;
    WALLET.account = null;
    WALLET.provider = null;
    WALLET.publicKey = null;
    setWalletUi();
  }

  function getRpcUrl(){
    const v = String(BILLING?.rpcPublic || "").trim();
    if (v && /^https?:\/\//i.test(v)) return v;
    try{
      if (typeof window.solanaWeb3?.clusterApiUrl === "function") return window.solanaWeb3.clusterApiUrl("mainnet-beta");
    }catch{}
    return "https://api.mainnet-beta.solana.com";
  }

  function rpcCandidates(){
    const out = [];
    const push = (url)=>{
      const v = String(url || "").trim();
      if (!v || !/^https?:\/\//i.test(v)) return;
      if (!out.includes(v)) out.push(v);
    };
    push(BILLING?.rpcPublic || "");
    try{ if (typeof window.solanaWeb3?.clusterApiUrl === "function") push(window.solanaWeb3.clusterApiUrl("mainnet-beta")); }catch{}
    push("https://api.mainnet-beta.solana.com");
    return out;
  }

  function shouldRetryRpc(err){
    const m = String(err?.message || err || "");
    return /403|401|429|access forbidden|blockhash|failed to fetch|network request failed/i.test(m);
  }

  async function getServerTxContext(){
    try{
      const j = await api("/api/billing/tx-context");
      if (j?.ok && j?.blockhash) return j;
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

  function fmtSol(x){
    const n = Number(x||0);
    if (!Number.isFinite(n) || n<=0) return "";
    if (n < 0.01) return n.toFixed(4);
    if (n < 0.1) return n.toFixed(3);
    return n.toFixed(2);
  }

  function planPricePrimary(plan, currency){
    if (currency === "SOL"){
      const sol = fmtSol(plan.solApprox || 0);
      return sol ? `${sol} SOL` : "SOL quote unavailable";
    }
    return `$${plan.usd} ${currency}`;
  }
  function planPriceSecondary(plan, currency){
    if (currency === "SOL"){
      return `$${plan.usd}`;
    }
    const sol = fmtSol(plan.solApprox || 0);
    return sol ? `≈ ${sol} SOL` : "";
  }

  function renderPlanGrid(){
    const grid = $("planGrid");
    if (!grid) return;
    grid.innerHTML = "";

    const plans = BILLING?.plans || [];
    for (const p of plans){
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "planCard";
      btn.dataset.key = p.key;
      btn.classList.toggle("active", p.key === selectedPlanKey);

      const primary = planPricePrimary(p, selectedCurrency);
      const secondary = planPriceSecondary(p, selectedCurrency);

      // simple badges
      p.badge = (Number(p.days||0) >= 365) ? "2 mo free" : (Number(p.days||0) >= 180 ? "Popular" : "");
      if (!p.badge) p.badge = "";

      btn.innerHTML = `
        <div class="planTop">
          <div>
            <div class="planName">${escapeHtml(p.label || p.key)}</div>
            ${p.badge ? `<div class="planBadge" style="margin-top:6px">${escapeHtml(p.badge)}</div>` : ``}
          </div>
          <div class="planPrice">${escapeHtml(primary)}</div>
        </div>
        <div class="planSub">${secondary ? escapeHtml(secondary) : ""}</div>
        <div class="planMeta">Unlock Pro for ${escapeHtml(String(p.days||0))} days</div>
      `;

      btn.onclick = ()=>{
        selectedPlanKey = p.key;
        selectedPlan = p;
        try{ $("walletActions")?.classList.remove("hidden"); }catch{}
        renderPlanGrid();
        setWalletUi();
      };

      grid.appendChild(btn);
    }
  }

  function setCurrency(cur){
    selectedCurrency = cur;
    // buttons
    ["SOL","USDC","USDT"].forEach(c=>{
      const el = $("token_" + c);
      if (el) el.classList.toggle("active", c === selectedCurrency);
    });
    renderPlanGrid();
    setWalletUi();
  }

  async function loadPlans(){
    try{
      const j = await api("/api/billing/plans");
      BILLING = j || BILLING;
      const plans = BILLING?.plans || [];
      if (selectedPlanKey && !plans.some(p=>p.key === selectedPlanKey)){
        selectedPlanKey = "";
        selectedPlan = null;
      }
      if (selectedPlanKey){
        selectedPlan = plans.find(p=>p.key === selectedPlanKey) || null;
      }
      renderPlanGrid();
      setWalletUi();
    }catch(e){
      // silent
    }
  }

  async function loadBillingProof(){
    const list = $("w_proof_list");
    const stats = $("w_proof_stats");
    if (!list || !stats) return;
    try{
      const j = await api("/api/billing/proof");
      const items = j?.recent || [];
      list.innerHTML = "";
      if (!items.length){
        list.innerHTML = `<div class="muted">No receipts yet.</div>`;
        stats.textContent = "—";
        return;
      }
      stats.textContent = `${items.length} receipt${items.length===1?"":"s"}`;
      for (const it of items){
        const row = document.createElement("div");
        row.className = "proofItem";
        const amt = `${it.amount} ${it.currency || "SOL"}`;
        const when = it.createdAt ? new Date(it.createdAt).toLocaleString() : "";
        row.innerHTML = `
          <div class="proofTop">
            <div class="proofLeft">
              <div class="proofPlan">${escapeHtml(String(it.plan||"Pro"))}</div>
              <div class="proofMeta">${when ? escapeHtml(when) : ""}</div>
            </div>
            <div class="proofAmt">${escapeHtml(amt)}</div>
          </div>
        `;
        list.appendChild(row);
      }
    }catch(e){
      list.innerHTML = `<div class="muted">Receipts unavailable.</div>`;
      stats.textContent = "—";
    }
  }

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

  

  async function loadActivity(){
    const list = $("w_activity_list");
    const msg = $("w_activity_msg");
    if (msg) msg.textContent = "";
    if (list) list.innerHTML = '<div class="muted">Loading...</div>';
    try{
      if (!getHandle()){
        if (list) list.innerHTML = '<div class="muted">Sign in to see activity.</div>';
        return;
      }
      const j = await api('/api/activity?limit=50');
      const items = Array.isArray(j.items) ? j.items : [];
      if (!items.length){
        if (list) list.innerHTML = '<div class="muted">No activity yet.</div>';
        return;
      }
      const label = (t)=>{
        const x = String(t||'');
        if (x === 'payment_verified') return 'Payment verified';
        if (x === 'billing_intent_created') return 'Checkout started';
        if (x === 'referral_confirmed') return 'Referral confirmed';
        if (x === 'referral_used') return 'Referral used';
        if (x === 'code_redeemed') return 'Promo code redeemed';
        if (x === 'feature_flag_set') return 'Feature flag changed';
        return x.replace(/_/g,' ');
      };
      const rows = items.slice(0, 50).map(it=>{
        const meta = it && typeof it.meta === 'object' && it.meta ? it.meta : null;
        const metaTxt = meta ? escapeHtml(JSON.stringify(meta)) : '';
        const when = it.createdAt ? escapeHtml(String(it.createdAt)) : '';
        return `<div class="pill" style="justify-content:space-between;gap:10px;flex-wrap:wrap"><strong>${escapeHtml(label(it.type))}</strong><span class="muted">${when}</span></div>` +
               (metaTxt ? `<div class="muted small" style="margin:-6px 0 10px 0">${metaTxt}</div>` : `<div style="height:8px"></div>`);
      }).join('');
      if (list) list.innerHTML = rows;
    }catch(e){
      if (list) list.innerHTML = "";
      if (msg) msg.innerHTML = `<span class="bad">${escapeHtml(friendlyUiErrorMessage(e.message||'failed'))}</span>`;
    }
  }

function billingErrMsg(code){
    const m = String(code || "");
    if (m.includes("rejected") || m.includes("Rejected") || m.includes("User rejected")) return "Transaction was cancelled in the wallet.";
    if (m === "spl_token_unavailable") return "USDC/USDT helper is unavailable in this build. Hard refresh the page once.";
    if (m === "insufficient_sol_funds") return "The connected wallet does not have enough SOL for this payment plus network fee.";
    if (m === "insufficient_token_funds") return "The connected wallet does not have enough token balance for this payment.";
    if (m === "payer_token_account_missing") return "The connected wallet does not have that token account. Switch token or fund the wallet first.";
    if (m === "web3_unavailable") return "Solana web3 library is not available. Refresh the page and try again.";
    if (m === "buffer_unavailable" || /buffer is not defined/i.test(m)) return "Browser Buffer helper did not load. Refresh once and try again.";
    if (m === "wallet_no_send_feature") return "This wallet can't send transactions from the browser. Try Solflare/Phantom/Backpack.";
    if (m === "wallet_no_message_sign") return "This wallet can't sign the checkout message. Try Solflare/Phantom/Backpack.";
    if (m === "wallet_bind_required") return "Wallet binding is required before payment verify. Sign the wallet message and try again.";
    if (m === "invalid_nonce_sig") return "Wallet binding signature was invalid. Sign the wallet message again.";
    if (m === "rpc_unavailable") return "Solana RPC is unavailable right now. Try again in a moment.";
    if (/403|401|429|access forbidden|blockhash/i.test(m)) return "RPC refused the payment request. Refresh once and try again.";
    if (m === "payment_not_verified") return "Payment not found or not confirmed yet. Wait a moment and it will auto-verify.";
    if (m === "invalid_sig") return "Invalid transaction signature.";
    if (m === "payment_intent_mismatch") return "This transaction does not match the current checkout intent.";
    if (m === "intent_expired") return "This checkout expired. Start a new payment.";
    if (m === "sig_already_used") return "This transaction signature was already used.";
    if (m === "invalid_plan") return "Invalid plan.";
    return m || "billing_failed";
  }

    let PAY_INFLIGHT = false;

async function payNow(){
    const msg = $("w_msg");
    if (!selectedPlan){
      if (msg) msg.innerHTML = `<span class="warn">Select a plan first.</span>`;
      return;
    }
    if (!WALLET.connected){
      openWalletModal();
      if (msg) msg.innerHTML = `<span class="warn">Connect a wallet to continue.</span>`;
      return;
    }

    const payBtn = $("sf_pay");
    const cur = selectedCurrency;
    const v = abVariant();

    try{
      PAY_INFLIGHT = true;
      if (payBtn) payBtn.disabled = true;

      setPayState("processing", "Creating checkout...");
      if (msg) msg.textContent = "Creating payment...";
      trackEvent("pay_click", { v, plan: selectedPlan.key, cur, source:"wallet_tab" });

      const intent = await api("/api/billing/intent", "POST", { planKey: selectedPlan.key, currency: cur });

      setPayState("processing", "Binding wallet...");
      if (msg) msg.textContent = "Sign the wallet message to bind this checkout...";
      await bindWalletToIntent(intent);

      setPayState("processing", "Building transaction...");
      if (msg) msg.textContent = "Building transaction...";
      const built = await buildPaymentTx(intent);

      setPayState("processing", "Approve in wallet...");
      if (msg) msg.textContent = "Approve the transaction in your wallet...";
      const payer = String(WALLET.publicKey?.toString?.() || "");
      const sig = await walletSendTransaction(built.tx, built.connection);

      setPayState("confirming", "Confirming on-chain...");
      if (msg) msg.textContent = "Confirming & verifying on-chain...";
      const j = await verifyIntentWithRetry(intent.id, sig, payer);

      setPayState("verified", "Verified. Pro activated.");
      if (msg) msg.innerHTML = `<span class="ok">Paid & verified.</span>`;
      trackEvent("pay_success", { v, plan: selectedPlan.key, cur });

      try{ await refreshUsage(); }catch{}
      try{ await loadBillingProof(); }catch{}
      try{ await loadActivity(); }catch{}
      renderWalletStatus(j.sub);

      openPaySuccess();
    }catch(e){
      const m = String(e?.message || "billing_failed");
      setPayState("failed", billingErrMsg(m));
      if (msg) msg.innerHTML = `<span class="bad">${escapeHtml(billingErrMsg(m))}</span>`;
      trackEvent("pay_fail", { v, code: m, plan: selectedPlan?.key || "", cur: selectedCurrency });
    }finally{
      PAY_INFLIGHT = false;
      if (payBtn) payBtn.disabled = !(selectedPlan && WALLET.connected) || PAY_INFLIGHT;
      setWalletUi();
    }
  }

  function renderWalletStatus(sub){
    const el = $("w_status_desc");
    if (!el) return;
    if (!sub){
      el.innerHTML = `<span class="muted">Status unknown.</span>`;
      return;
    }
    if (sub.active){
      const until = sub.paidUntil ? ` (until ${escapeHtml(String(sub.paidUntil))})` : "";
      el.innerHTML = `<span class="ok">Pro active</span>${until}`;
    } else {
      el.innerHTML = `<span class="muted">Free</span>`;
    }
  }

  function bindWalletTab(){
    // currency buttons
    const bSol = $("token_SOL");
    const bUsdc = $("token_USDC");
    const bUsdt = $("token_USDT");
    if (bSol) bSol.onclick = ()=>setCurrency("SOL");
    if (bUsdc) bUsdc.onclick = ()=>setCurrency("USDC");
    if (bUsdt) bUsdt.onclick = ()=>setCurrency("USDT");

    // modal
    const modal = $("sf_modal");
    const close = $("sf_modal_close");
    if (modal){
      modal.addEventListener("click", (e)=>{ if (e.target === modal) closeWalletModal(); });
    }
    if (close) close.onclick = ()=>closeWalletModal();


    // plan compare modal
    const pc = $("plan_compare_btn");
    const pm = $("plan_modal");
    const pmClose = $("plan_modal_close");
    if (pc) pc.onclick = ()=>openPlanModal();
    if (pm) pm.addEventListener("click", (e)=>{ if (e.target === pm) closePlanModal(); });
    if (pmClose) pmClose.onclick = ()=>closePlanModal();

    // connect/disconnect
    const btnConnect = $("sf_connect");
    const btnDisconnect = $("sf_disconnect");
    if (btnConnect) btnConnect.onclick = ()=>openWalletModal();
    if (btnDisconnect) btnDisconnect.onclick = ()=>disconnectWallet();

    // pay
    const payBtn = $("sf_pay");
    if (payBtn) payBtn.onclick = ()=>payNow();


    // activity
    const actBtn = $("w_activity_refresh");
    if (actBtn) actBtn.onclick = ()=>loadActivity();

    // initial
    setCurrency(selectedCurrency);
    setWalletUi();

    // refresh wallet list on focus (wallet extensions sometimes restart)
    try{
      const check = ()=>{
        if (WALLET.connected){
          const choices = listWalletChoices();
          const stillThere = choices.some(x => walletNameKey(x.name) === walletNameKey(WALLET.name));
          if (!stillThere){
            disconnectWallet();
            toast("warn", "Wallet was updated/restarted. Please reconnect.");
          }
        }
      };
      window.addEventListener("focus", check);
      document.addEventListener("visibilitychange", ()=>{ if (document.visibilityState === "visible") check(); });
    }catch{}
  }


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
    try{ window.postMessage({ type: "GMX_SYNC_NOW", reason: "site_reset" }, "*"); }catch(_e){}
    try{ ping(); }catch{}
    applyAdminVisibility();
    try{ refreshUsage(); }catch{}
    try{ loadPlans(); }catch{}
    if (xh){
      try{ xh.focus(); }catch{}
    }
  };

  // ---- UI Translation (site language) ----
  // Important: Always apply the base catalog first, then override with the selected locale (fallback for all UI languages).
    // ---- UI Translation (site language) ----
  // Source of truth now lives in shared/i18n/locales/*.json and is generated into /public/i18n/siteI18n.js.
  const I18N = (globalThis.GMX_SITE_I18N && typeof globalThis.GMX_SITE_I18N.createSiteI18nCatalog === "function")
    ? globalThis.GMX_SITE_I18N.createSiteI18nCatalog()
    : { en: {} };



  function setPh(id, key, merged){
    try{
      const el = document.getElementById(id);
      if (!el) return;
      const v = merged[key];
      if (v !== undefined && v !== null) el.placeholder = String(v);
    }catch{}
  }

  function sanitizeMiniHTML(input){
    // Very small HTML allowlist for translated bullet points.
    // Allowed tags: b, strong, em, br, span, kbd, code. No attributes.
    const tpl = document.createElement("template");
    tpl.innerHTML = String(input ?? "");
    const ALLOWED = new Set(["B","STRONG","EM","BR","SPAN","KBD","CODE"]);
    const nodes = tpl.content.querySelectorAll("*");
    nodes.forEach(node=>{
      if (!ALLOWED.has(node.tagName)){
        node.replaceWith(document.createTextNode(node.textContent || ""));
        return;
      }
      [...node.attributes].forEach(a=>node.removeAttribute(a.name));
    });
    tpl.content.querySelectorAll("script,style,iframe,object,embed,link,meta").forEach(n=>n.remove());
    return tpl.innerHTML;
  }

  function setText(id, val){
    const el = document.getElementById(id);
    if (!el || val === undefined || val === null) return;

    // Allow UL translation via array-of-items
    if (Array.isArray(val) && el.tagName === "UL"){
      el.innerHTML = val.map(x => `<li>${sanitizeMiniHTML(x)}</li>`).join("");
      return;
    }

    const raw = String(val);

    // Explicit HTML prefix stays supported.
    if (raw.startsWith("HTML:")){
      el.innerHTML = sanitizeMiniHTML(raw.slice(5));
      return;
    }

    // Many locale strings already contain small safe tags like <b>/<span class="kbd">.
    // Render those through the allowlist instead of showing literal markup in the UI.
    if (/<\/?[a-z][^>]*>/i.test(raw)){
      el.innerHTML = sanitizeMiniHTML(raw);
      return;
    }

    el.textContent = raw;
  }



  const FORCE_EN_KEYS = new Set([]);

  function applyLang(){
    const lang = localStorage.getItem(LS_SITE_LANG) || "en";
    const base = I18N.en || {};
    const d = I18N[lang] || {};

    const merged = Object.assign({}, base);
    for (const [k,v] of Object.entries(d)){
      const safe = sanitizeI18nValue(lang, v, base[k]);
      if (safe === "" || safe === null || safe === undefined) continue;
      merged[k] = safe;
    }

    for (const k of Object.keys(merged)){
      const v = (lang !== "en" && FORCE_EN_KEYS.has(k)) ? (base[k] ?? merged[k]) : merged[k];
      setText(k, v);
    }

    // Placeholders
    setPh("xHandle","xHandle_ph",merged);
    setPh("redeemCode","redeemCode_ph",merged);
    setPh("gmNewLine","gmNewLine_ph",merged);
    setPh("gmFilter","gmFilter_ph",merged);
    setPh("gmPaste","gmPaste_ph",merged);
    setPh("gnNewLine","gnNewLine_ph",merged);
    setPh("gnFilter","gnFilter_ph",merged);
    setPh("gnPaste","gnPaste_ph",merged);
    setPh("w_wallet","w_wallet_ph",merged);
    setPh("w_sig","w_sig_ph",merged);
    setPh("w_payer","w_payer_ph",merged);
    setPh("adminSecret","adminSecret_ph",merged);
    setPh("adminOut","adminOut_ph",merged);
    setPh("supportOut","supportOut_ph",merged);

    // Referral link placeholder depends on auth state
    try{ const rl=$("refLink"); if(rl) rl.placeholder = merged["connectFirst"] || ""; }catch{}
    try{ patchDynamicCopy(lang, merged); }catch(e){}
  }

function getReferralUiCopy(_lang){
  const fallback = {
    title: "How it works",
    note: "Referrals unlock perks only after real product usage (not just signups).",
    desc: "What actually unlocks perks:",
    items: [
      "Share your link. Only real usage moves unlocks.",
      "<b>Confirmed</b> = a handle connected through your link.",
      "<b>Active</b> = that confirmed user actually used GM or GN.",
      "<b>Eligible</b> = max(active, carry-over)."
    ],
    promoterTitle: "Promoter details",
    baseDaily: "Base daily",
    unlocksNow: "Unlocks now",
    nextUnlock: "Next unlock",
    allUnlocked: "All listed unlocks reached",
    antiAbuse: "Only eligible referrals count. Signups alone do not unlock perks.",
    confirmed: "Confirmed",
    active: "Active",
    eligible: "Eligible",
    legacy: "Carry-over",
    clicks: "Clicks",
    bgSlots: "BG slots",
    saveCap: "Save cap",
    unlimited: "Unlimited",
    onePack: "1 cosmetics pack",
    allPacks: "All cosmetics packs",
    proTrial: "Pro Trial 7d",
    discount: "50% off 1 month",
    toolkit: "Referral Toolkit",
    copied: "Copied.",
    leaderboardLoading: "Loading...",
    leaderboardEmpty: "No data yet",
    youLabel: "You",
    rulesLabel: "rules",
    invitedNote: "This list shows real usage only. Fraud-flagged or empty signups do not stay here."
  };
  const items = [
    t("r_li1") || fallback.items[0],
    t("r_li2c") || t("r_li2") || fallback.items[1],
    t("r_li3") || fallback.items[2],
    t("r_li4") || fallback.items[3]
  ];
  return {
    title: t("r_how") || fallback.title,
    note: t("r_note") || fallback.note,
    desc: t("r_desc") || fallback.desc,
    items,
    promoterTitle: t("ref_promoter_details") || fallback.promoterTitle,
    baseDaily: t("ref_daily_limit_title") || fallback.baseDaily,
    unlocksNow: fallback.unlocksNow,
    nextUnlock: fallback.nextUnlock,
    allUnlocked: fallback.allUnlocked,
    antiAbuse: t("ref_abuse_note") || fallback.antiAbuse,
    confirmed: t("ref_k_confirmed") || fallback.confirmed,
    active: t("ref_k_active") || fallback.active,
    eligible: t("ref_k_eligible") || fallback.eligible,
    legacy: t("ref_k_legacy") || fallback.legacy,
    clicks: fallback.clicks,
    bgSlots: fallback.bgSlots,
    saveCap: fallback.saveCap,
    unlimited: fallback.unlimited,
    onePack: fallback.onePack,
    allPacks: fallback.allPacks,
    proTrial: fallback.proTrial,
    discount: fallback.discount,
    toolkit: fallback.toolkit,
    copied: t("toast_copied") || fallback.copied,
    leaderboardLoading: t("r_loading") || fallback.leaderboardLoading,
    leaderboardEmpty: t("lb_empty") || fallback.leaderboardEmpty,
    youLabel: t("lb_you") || fallback.youLabel,
    rulesLabel: fallback.rulesLabel,
    invitedNote: t("r_invited_note") || fallback.invitedNote
  };
}

function getGuideUiCopy(_lang){
  const toList = (val, fallback)=> Array.isArray(val) && val.length ? val : fallback;
  return {
    gm: {
      title: t("gm_right") || "How to use GM",
      desc: t("gm_right_desc") || "Build short English morning replies that are natural, direct, and easy to paste.",
      items: toList(t("gm_right_list"), [
        "Use Random 1/10/70 to add fresh lines.",
        "Use Repeat guard to avoid near-duplicates in batches.",
        "Use Filter to search inside saved lines."
      ])
    },
    gn: {
      title: t("gn_right") || "How to use GN",
      desc: t("gn_right_desc") || "Build short English night replies that are calm, human, and easy to paste.",
      items: toList(t("gn_right_list"), [
        "Use Random 1/10/70 to add fresh lines.",
        "Use Repeat guard to avoid near-duplicates in batches.",
        "Use Filter to search inside saved lines."
      ])
    },
    ext: {
      title: t("extthemes_right_title") || "How unlocks work",
      desc: t("extthemes_right_desc") || "Extension skins and wallpapers sync from the site.",
      items: toList(t("extthemes_right_list"), [
        "Skins and wallpapers are applied from the site.",
        "Only one skin is active at a time.",
        "Pro unlocks all cosmetics."
      ])
    }
  };
}

function renderGuideRightCopy(lang){
  const ui = getGuideUiCopy(lang);
  if ($("gm_right")) $("gm_right").textContent = ui.gm.title;
  if ($("gm_right_desc")) $("gm_right_desc").textContent = ui.gm.desc;
  if ($("gm_right_list")) $("gm_right_list").innerHTML = ui.gm.items.map((x)=>`<li>${x}</li>`).join("");
  if ($("gn_right")) $("gn_right").textContent = ui.gn.title;
  if ($("gn_right_desc")) $("gn_right_desc").textContent = ui.gn.desc;
  if ($("gn_right_list")) $("gn_right_list").innerHTML = ui.gn.items.map((x)=>`<li>${x}</li>`).join("");
  if ($("extthemes_right_title")) $("extthemes_right_title").textContent = ui.ext.title;
  if ($("extthemes_right_desc")) $("extthemes_right_desc").textContent = ui.ext.desc;
  if ($("extthemes_right_list")) $("extthemes_right_list").innerHTML = ui.ext.items.map((x)=>`<li>${x}</li>`).join("");
}

  function deriveReferralUnlocks(eligible, rawUnlocks){
    const raw = (rawUnlocks && typeof rawUnlocks === "object") ? rawUnlocks : null;
    if (raw){
      const bgSlotsRaw = Number(raw.bgSlots ?? raw.bg_slots ?? 0) || 0;
      const saveCapBonus = Number(raw.saveCapBonus ?? raw.save_cap_bonus ?? 0) || 0;
      return {
        bgSlots: bgSlotsRaw > 0 ? bgSlotsRaw : 3,
        unlimitedBg: !!raw.unlimitedBg || bgSlotsRaw >= 9999,
        saveCapBonus,
        onePack: !!raw.onePack,
        allPacks: !!raw.allPacks,
        proTrial: !!raw.proTrial,
        discount: !!raw.discount,
        toolkit: !!raw.toolkit,
      };
    }
    const e = Number(eligible || 0) || 0;
    return {
      bgSlots: e >= 15 ? 9999 : e >= 7 ? 12 : e >= 3 ? 8 : e >= 1 ? 5 : 3,
      unlimitedBg: e >= 15,
      saveCapBonus: e >= 7 ? 50 : 0,
      onePack: e >= 3,
      allPacks: e >= 15,
      proTrial: e >= 30,
      discount: e >= 50,
      toolkit: e >= 100,
    };
  }

  function nextReferralUnlockAt(eligible){
    const e = Number(eligible || 0) || 0;
    const steps = [1, 3, 7, 15, 30, 50, 100];
    for (const step of steps){
      if (e < step) return step;
    }
    return 0;
  }

  function nextReferralUnlockLabel(lang, step){
    const ui = getReferralUiCopy(lang);
    const s = Number(step || 0) || 0;
    if (s === 1) return `1 -> ${ui.bgSlots}: 5`;
    if (s === 3) return `3 -> ${ui.bgSlots}: 8 + ${ui.onePack}`;
    if (s === 7) return `7 -> ${ui.bgSlots}: 12 + ${ui.saveCap}: 120`;
    if (s === 15) return `15 -> ${ui.unlimited} ${String(ui.bgSlots).toLowerCase()} + ${ui.allPacks}`;
    if (s === 30) return `30 -> ${ui.proTrial}`;
    if (s === 50) return `50 -> ${ui.discount}`;
    if (s === 100) return `100 -> ${ui.toolkit}`;
    return ui.allUnlocked;
  }

function renderReferralRightCopy(lang){
  const ui = getReferralUiCopy(lang);
  const title = $("r_how");
  if (title) title.textContent = ui.title;
  const desc = $("r_desc");
  if (desc) desc.textContent = ui.desc;
  const invited = $("r_invited_note");
  if (invited) invited.textContent = ui.invitedNote;
  const list = $("r_list");
  if (list) {
    list.innerHTML = ui.items.map((line, i)=>`<li id="r_li${i + 1}">${line}</li>`).join("");
  }
  }

  function patchDynamicCopy(lang, merged){
    try{
      const msg = $("refMsg");
      if (msg && msg.textContent && msg.textContent.trim() === "Loaded."){
        msg.innerHTML = '<span class="ok">' + escapeHtml(t("ref_loaded")) + '</span>';
      }
    }catch{}
    try{ renderReferralRightCopy(lang); }catch{}
    try{ syncPredictionFilterCopy(); }catch{}
    try{ syncModePanelCopy(); }catch{}
    try{ syncCleanFillUi(); }catch{}
    try{ syncReferralCardCopy(); }catch{}
    try{ initReferralPromoDetailsState(); }catch{}
    try{
      if (CURRENT_TAB === "referrals" && getHandle()){
        scheduleRefStatsRefresh(220);
      }
    }catch{}
  }





  function fillSelect(sel, arr){
    sel.innerHTML = "";
    for (const [v, label] of arr){
      const o = document.createElement("option");
      o.value = v;
      o.textContent = label;
      sel.appendChild(o);
    }
  }

async function loadLocalConfig(){
  try{
    const r = await fetch("/extension-config.json", { cache: "no-store" });
    if (!r.ok) return;
    const cfg = await r.json().catch(()=>null);
    if (!cfg || typeof cfg !== "object") return;
    if (cfg.languages && Array.isArray(cfg.languages.site)) SITE_LANGS = cfg.languages.site;
    if (cfg.languages && Array.isArray(cfg.languages.reply)) {
      const onlyEnglish = cfg.languages.reply.filter((item)=>Array.isArray(item) && String(item[0]||"").toLowerCase() === "en");
      REPLY_LANGS = onlyEnglish.length ? onlyEnglish : [["en","English"]];
    } else {
      REPLY_LANGS = [["en","English"]];
    }
  }catch{}
}


  // --- init ---
  await loadLocalConfig();

  // site language (UI translation)
  const siteLangSel = $("siteLang");
  if (siteLangSel) fillSelect(siteLangSel, SITE_LANGS);

  function langFlagSrc(code){
    const c = String(code||"").trim().toLowerCase();
    return "/assets/flags/" + c + ".svg";
  }


  function renderSiteLangMenu(){
    const btn = $("siteLangBtn");
    const menu = $("siteLangMenu");
    const flag = $("siteLangFlag");
    const label = $("siteLangLabel");
    if (!btn || !menu || !flag || !label) return;

    const cur = localStorage.getItem(LS_SITE_LANG) || "en";
    const curRow = SITE_LANGS.find(x=>x[0]===cur) || SITE_LANGS[0] || ["en","English"];
    flag.src = langFlagSrc(curRow[0]); flag.alt = curRow[1];
    label.textContent = curRow[1];

    menu.innerHTML = "";
    for (const [v, lab] of SITE_LANGS){
      const b = document.createElement("button");
      b.type = "button";
      b.className = "langItem" + (v===cur ? " active" : "");
      b.setAttribute("role","option");
      b.setAttribute("aria-selected", v===cur ? "true" : "false");
      b.innerHTML = `<img class="flagImg" src="${langFlagSrc(v)}" alt="" /><span>${escapeHtml(lab)}</span>`;
      b.addEventListener("click", ()=>{
        try{ localStorage.setItem(LS_SITE_LANG, v); }catch{}
        if (siteLangSel) siteLangSel.value = v;
        try{ applyLang(); }catch{}
        renderSiteLangMenu();
        closeLangMenu();
      });
      menu.appendChild(b);
    }
  }

  function ensureLangMenuPortal(){
  const pick = $("siteLangPick");
  const menu = $("siteLangMenu");
  const btn = $("siteLangBtn");
  if (!pick || !menu || !btn) return;
  if (menu._portal) return;
  // Move menu to body to avoid clipping by overflow/stacking contexts.
  try{
    document.body.appendChild(menu);
    menu._portal = true;
    menu.style.right = "auto";
    menu.style.top = "0px";
    menu.style.left = "0px";
  }catch{}
}

function positionLangMenu(){
  const btn = $("siteLangBtn");
  const menu = $("siteLangMenu");
  if (!btn || !menu) return;
  const r = btn.getBoundingClientRect();
  const w = Math.max(240, Math.min(340, r.width + 140));
  const left = Math.min(window.innerWidth - w - 12, Math.max(12, r.right - w));
  const top = Math.min(window.innerHeight - 12, r.bottom + 8);
  menu.style.width = w + "px";
  menu.style.left = left + "px";
  menu.style.top = top + "px";
}

function openLangMenu(){
  const btn = $("siteLangBtn");
  const menu = $("siteLangMenu");
  if (!btn || !menu) return;
  ensureLangMenuPortal();
  positionLangMenu();
  menu.classList.remove("hidden");
  btn.setAttribute("aria-expanded","true");
}
function closeLangMenu(){
  const btn = $("siteLangBtn");
  const menu = $("siteLangMenu");
  if (!btn || !menu) return;
  menu.classList.add("hidden");
  btn.setAttribute("aria-expanded","false");
}

  // Default UI language must be English on first visit,
  // but user-selected language should persist after that.
  const storedUiLang = localStorage.getItem(LS_SITE_LANG);
  const validUiLang = SITE_LANGS.some(([v]) => v === storedUiLang) ? storedUiLang : "en";
  localStorage.setItem(LS_SITE_LANG, validUiLang);
  if (siteLangSel) siteLangSel.value = validUiLang;

  // Wire dropdown UI
  try{
    renderSiteLangMenu();
    const btn = $("siteLangBtn");
    if (btn && !btn._bound){
      btn._bound = true;
      btn.addEventListener("click", (e)=>{
        e.preventDefault();
        const menu = $("siteLangMenu");
        if (!menu) return;
        const open = !menu.classList.contains("hidden");
        if (open) closeLangMenu(); else openLangMenu();
      });
      document.addEventListener("click", (e)=>{
        const pick = $("siteLangPick");
        const menu = $("siteLangMenu");
        if (!pick || !menu) return;
        if (menu.classList.contains("hidden")) return;
        if (!pick.contains(e.target) && !menu.contains(e.target)) closeLangMenu();
      });
      document.addEventListener("keydown", (e)=>{ if (e.key === "Escape") closeLangMenu(); });
    }
  }catch{}

  applyLang();
  try{ syncBestModeUi(); }catch(_e){}
  try{ syncCleanFillUi(); }catch(_e){}
  pruneLegacyAdminPanels();

    // Keep translations consistent even when UI re-renders content dynamically.
    (function(){
      let t=null;
      function kick(){
        if(t) clearTimeout(t);
        t=setTimeout(()=>{ try{ applyLang(); }catch{} try{ syncBestModeUi(); }catch{} try{ syncCleanFillUi(); }catch{} }, 30);
      }
      try{
        const obs = new MutationObserver(()=>kick());
        obs.observe(document.body, {subtree:true, childList:true, characterData:true});
        window.__i18nObserver = obs;
      }catch{}
    })();

  updateLangFlags();

  // Track referral link clicks (promoter analytics)
  try{
    const ref = new URLSearchParams(location.search).get("ref");
    if (ref){
      fetch("/api/referral/click?ref=" + encodeURIComponent(ref)).catch(()=>{});
    }
  }catch{}

  window.addEventListener("message", (e)=>{
    try{
      if (!e || !e.data) return;
      if (e.data.type === "GMX_BEST_MODE_SYNC"){
        setBestMode(e.data.value === true, true);
        return;
      }
      if (e.data.type === "GMX_CLEAN_FILL_SYNC"){
        if (e.data.kind === "gm" || e.data.kind === "gn") setCleanFillEnabled(e.data.kind, e.data.value === true, true);
      }
    }catch(_e){}
  });

  if (siteLangSel) siteLangSel.addEventListener("change", ()=>{
    localStorage.setItem(LS_SITE_LANG, siteLangSel.value);
    applyLang();
    try{ syncBestModeUi(); }catch(_e){}
    try{ syncCleanFillUi(); }catch(_e){}
    try{ window.postMessage({ type: "GMX_SYNC_NOW", reason: "site_lang_change" }, "*"); }catch(_e){}
    updateLangFlags();
    // ensure per-tab wallpaper controls refresh labels/state
    try{ renderWallpaperUI(); }catch{}
  });

  // reply language selects
  const gmLangSel = $("gmLang");
  const gnLangSel = $("gnLang");
  if (gmLangSel) fillSelect(gmLangSel, REPLY_LANGS);
  if (gnLangSel) fillSelect(gnLangSel, REPLY_LANGS);

  // styles + theme (depend on SUB/REF_COUNT, but must exist before refreshUsage)
  fillStyles();
      fillPacks();
  applyTheme(localStorage.getItem("gmx_theme") || "classic");
  renderThemes();
  applyUserBg();
  initWallpapers();

  // initial language chips
  renderLangChips("gm");
  renderLangChips("gn");

  // referrals UI

  // default reply langs (persist per tab)
  const validReply = (v)=> REPLY_LANGS.some(([code])=>code===v) ? v : "en";
  const storedGm = localStorage.getItem(LS_GM_REPLY_LANG) || "en";
  const storedGn = localStorage.getItem(LS_GN_REPLY_LANG) || "en";
  if (gmLangSel) gmLangSel.value = validReply(storedGm);
  if (gnLangSel) gnLangSel.value = validReply(storedGn);

  if (gmLangSel) gmLangSel.addEventListener("change", ()=>{
    try{ localStorage.setItem(LS_GM_REPLY_LANG, gmLangSel.value); }catch{}
    updateLangFlags();
    if (gmView === "lang") ensureIndexed("gm", gmLangSel.value);
    renderList("gm");
    renderLangChips("gm");
  });
  if (gnLangSel) gnLangSel.addEventListener("change", ()=>{
    try{ localStorage.setItem(LS_GN_REPLY_LANG, gnLangSel.value); }catch{}
    updateLangFlags();
    if (gnView === "lang") ensureIndexed("gn", gnLangSel.value);
    renderList("gn");
    renderLangChips("gn");
  });

  const gmViewGlobalBtn = $("gmViewGlobal");
  if (gmViewGlobalBtn) gmViewGlobalBtn.onclick = ()=>{ if(requireConnected("GM")) setView("gm","global"); };
  const gmViewLangBtn = $("gmViewLang");
  if (gmViewLangBtn) gmViewLangBtn.onclick = ()=>{ if(requireConnected("GM")) setView("gm","lang"); };
  const gnViewGlobalBtn = $("gnViewGlobal");
  if (gnViewGlobalBtn) gnViewGlobalBtn.onclick = ()=>{ if(requireConnected("GN")) setView("gn","global"); };
  const gnViewLangBtn = $("gnViewLang");
  if (gnViewLangBtn) gnViewLangBtn.onclick = ()=>{ if(requireConnected("GN")) setView("gn","lang"); };

  const gmRand1Btn = $("gmRand1");
  if (gmRand1Btn) gmRand1Btn.onclick = ()=>{ if(requireConnected("GM")){ try{trackEvent("generate_click",{kind:"gm",count:1});}catch(_e){} generate("gm", 1); } };
  const gmRand10Btn = $("gmRand10");
  if (gmRand10Btn) gmRand10Btn.onclick = ()=>{ if(requireConnected("GM")){ try{trackEvent("generate_click",{kind:"gm",count:10});}catch(_e){} generate("gm", 10); } };
  const gmBestBtn = $("gmBestBtn");
  if (gmBestBtn) gmBestBtn.onclick = ()=>{ if(requireConnected("GM")){ try{trackEvent("best_click",{kind:"gm",mode:getBestMode()?"live":"saved"});}catch(_e){} (getBestMode() ? doBestServer("gm") : doBest("gm")); } };

  const gmBestModeToggle = $("gmBestModeToggle");
  if (gmBestModeToggle) gmBestModeToggle.onclick = ()=>{ setBestMode(!getBestMode()); };
  const gmCleanFillToggle = $("gmCleanFillToggle");
  if (gmCleanFillToggle) gmCleanFillToggle.onclick = ()=>{ setCleanFillEnabled("gm", !getCleanFillEnabled("gm")); };

  const gnRand1Btn = $("gnRand1");
  if (gnRand1Btn) gnRand1Btn.onclick = ()=>{ if(requireConnected("GN")){ try{trackEvent("generate_click",{kind:"gn",count:1});}catch(_e){} generate("gn", 1); } };
  const gnRand10Btn = $("gnRand10");
  if (gnRand10Btn) gnRand10Btn.onclick = ()=>{ if(requireConnected("GN")){ try{trackEvent("generate_click",{kind:"gn",count:10});}catch(_e){} generate("gn", 10); } };
  const gnBestBtn = $("gnBestBtn");
  if (gnBestBtn) gnBestBtn.onclick = ()=>{ if(requireConnected("GN")){ try{trackEvent("best_click",{kind:"gn",mode:getBestMode()?"live":"saved"});}catch(_e){} (getBestMode() ? doBestServer("gn") : doBest("gn")); } };

  const gnBestModeToggle = $("gnBestModeToggle");
  if (gnBestModeToggle) gnBestModeToggle.onclick = ()=>{ setBestMode(!getBestMode()); };
  const gnCleanFillToggle = $("gnCleanFillToggle");
  if (gnCleanFillToggle) gnCleanFillToggle.onclick = ()=>{ setCleanFillEnabled("gn", !getCleanFillEnabled("gn")); };

  const gmNewAddBtn = $("gmNewAdd");
  if (gmNewAddBtn) gmNewAddBtn.onclick = ()=>{ if(requireConnected("GM")) commitNewLine("gm"); };
  const gmNewLineInp = $("gmNewLine");
  if (gmNewLineInp) gmNewLineInp.addEventListener("keydown", (e)=>{ if(e.key==="Enter"){ e.preventDefault(); if(requireConnected("GM")) commitNewLine("gm"); } });
  const gmCleanupBtn = $("gmCleanup");
  if (gmCleanupBtn) gmCleanupBtn.onclick = ()=>{ if(requireConnected("GM")) oneClickCleanup("gm"); };
  const gmClearBtn = $("gmClear");
  if (gmClearBtn) gmClearBtn.onclick = ()=>{ if(requireConnected("GM")) clearView("gm"); };
  const gmClearAllBtn = $("gmClearAll");
  if (gmClearAllBtn) gmClearAllBtn.onclick = ()=>{ if(requireConnected("GM")) clearAll("gm"); };
  const gmPasteAddBtn = $("gmPasteAdd");
  if (gmPasteAddBtn) gmPasteAddBtn.onclick = ()=>{ if(requireConnected("GM")) addPasted("gm"); };

  const gnNewAddBtn = $("gnNewAdd");
  if (gnNewAddBtn) gnNewAddBtn.onclick = ()=>{ if(requireConnected("GN")) commitNewLine("gn"); };
  const gnNewLineInp = $("gnNewLine");
  if (gnNewLineInp) gnNewLineInp.addEventListener("keydown", (e)=>{ if(e.key==="Enter"){ e.preventDefault(); if(requireConnected("GN")) commitNewLine("gn"); } });
  const gnCleanupBtn = $("gnCleanup");
  if (gnCleanupBtn) gnCleanupBtn.onclick = ()=>{ if(requireConnected("GN")) oneClickCleanup("gn"); };
  const gnClearBtn = $("gnClear");
  if (gnClearBtn) gnClearBtn.onclick = ()=>{ if(requireConnected("GN")) clearView("gn"); };
  const gnClearAllBtn = $("gnClearAll");
  if (gnClearAllBtn) gnClearAllBtn.onclick = ()=>{ if(requireConnected("GN")) clearAll("gn"); };
  const gnPasteAddBtn = $("gnPasteAdd");
  if (gnPasteAddBtn) gnPasteAddBtn.onclick = ()=>{ if(requireConnected("GN")) addPasted("gn"); };

  // copy/export
  const gmCopyAllBtn = $("gmCopyAll");
  if (gmCopyAllBtn) gmCopyAllBtn.onclick = ()=>{ if(requireConnected("GM")) copyAll("gm"); };
  const gmExportBtn = $("gmExport");
  if (gmExportBtn) gmExportBtn.onclick = ()=>{ if(requireConnected("GM")) exportAll("gm"); };
  const gnCopyAllBtn = $("gnCopyAll");
  if (gnCopyAllBtn) gnCopyAllBtn.onclick = ()=>{ if(requireConnected("GN")) copyAll("gn"); };
  const gnExportBtn = $("gnExport");
  if (gnExportBtn) gnExportBtn.onclick = ()=>{ if(requireConnected("GN")) exportAll("gn"); };

  // filters (view only)
  const gmFilterInp = $("gmFilter");
  if (gmFilterInp) gmFilterInp.addEventListener("input", ()=>renderList("gm"));
  const gnFilterInp = $("gnFilter");
  if (gnFilterInp) gnFilterInp.addEventListener("input", ()=>renderList("gn"));
  const gmFilterClearBtn = $("gmFilterClear");
  if (gmFilterClearBtn) gmFilterClearBtn.onclick = ()=>{ if (gmFilterInp) gmFilterInp.value=""; renderList("gm"); };
  const gnFilterClearBtn = $("gnFilterClear");
  if (gnFilterClearBtn) gnFilterClearBtn.onclick = ()=>{ if (gnFilterInp) gnFilterInp.value=""; renderList("gn"); };

  // Quick presets: Casual / Pro / Fun
  document.querySelectorAll(".quickPresets [data-preset]").forEach(btn=>{
    btn.onclick = ()=>{
      const wrap = btn.closest(".quickPresets");
      const kind = wrap?.dataset?.kind || "gm";
      const preset = btn.dataset.preset || "casual";
      const modeEl = kind==="gm" ? $("gmMode") : $("gnMode");
      const styleEl = kind==="gm" ? $("gmStyle") : $("gnStyle");
      const packEl = kind==="gm" ? $("gmPack") : $("gnPack");
      if (preset==="casual"){ if(modeEl) modeEl.value="mid"; if(styleEl) styleEl.value="classic"; if(packEl) packEl.value="classic"; }
      else if (preset==="pro"){ if(modeEl) modeEl.value="mid"; if(styleEl) styleEl.value="alpha"; if(packEl) packEl.value="king"; }
      else if (preset==="fun"){ if(modeEl) modeEl.value="min"; if(styleEl) styleEl.value="cheer"; if(packEl) packEl.value="classic"; }
      wrap?.querySelectorAll("[data-preset]").forEach(b=>b.classList.toggle("active", b===btn));
    };
  });

  // Ctrl+Enter = Batch 10 when on GM/GN tab
  document.addEventListener("keydown", (e)=>{
    if (!(e.ctrlKey||e.metaKey) || e.key!=="Enter") return;
    const active = $("t_gm")?.classList.contains("active") ? "gm" : ($("t_gn")?.classList.contains("active") ? "gn" : null);
    if (!active) return;
    const target = e.target; if (!target) return;
    const inGM = active==="gm" && target.closest("#tab-gm");
    const inGN = active==="gn" && target.closest("#tab-gn");
    if (inGM && getHandle()){ e.preventDefault(); generate("gm", 10); }
    else if (inGN && getHandle()){ e.preventDefault(); generate("gn", 10); }
  });

  // draft autosave
  const gmPaste = $("gmPaste");
  const gnPaste = $("gnPaste");
  if (gmNewLineInp) gmNewLineInp.addEventListener("input", ()=>saveDraft("gm"));
  if (gnNewLineInp) gnNewLineInp.addEventListener("input", ()=>saveDraft("gn"));
  if (gmPaste) gmPaste.addEventListener("input", ()=>saveDraft("gm"));
  if (gnPaste) gnPaste.addEventListener("input", ()=>saveDraft("gn"));


  // Add wallpaper (themes - custom upload in wallpapers tab)
  const wpAddCustom = $("wpAddCustom");
  const wpAddFile = $("wpAddFile");
  if (wpAddCustom && wpAddFile){
    wpAddCustom.onclick = ()=>{ if (requireConnected("Themes")) wpAddFile.click(); };
  }
  if (wpAddFile){
    wpAddFile.addEventListener("change", async ()=>{
      try{
        if (!requireConnected("Themes")) { wpAddFile.value = ""; return; }
        const f = wpAddFile.files && wpAddFile.files[0];
        if (!f) return;
        const data = await compressImageToJpegDataURL(f, { profile: "site" });
        localStorage.setItem(LS_CUSTOM_BG_GLOBAL, data);
        const targetTab = ($("wpTab")?.value || "all");
        if (targetTab === "all") localStorage.setItem(LS_WP_GLOBAL, CUSTOM_UPLOAD_ID);
        else setWallpaperForTab(targetTab, CUSTOM_UPLOAD_ID);
        try{ renderWallpaperUI(); }catch{}
        const previewTab = (targetTab === "all") ? currentTabName() : targetTab;
        applyWallpaper(previewTab);
        applyUserBg(previewTab);
        toast("ok", (t("toast_custom_bg_saved")||"Custom wallpaper saved."));
      }catch(e){
        toast("warn", (t("err_custom_wp_save")||"Could not save image (too large or blocked)."));
      }finally{
        wpAddFile.value = "";
      }
    });
  }
  function pushRecent(kind, keys){
    try{
      const cur = getRecent(kind);
      const merged = cur.concat(keys || []);
      const out = merged.slice(-120);
      localStorage.setItem(lsKeyRecent(kind), JSON.stringify(out));
    } catch {}
  }

  function repeatKey(s, strength){
    let t = normalizeLine(s).toLowerCase();
    if (!t) return "";
    try{ t = t.replace(/\p{Extended_Pictographic}/gu, " "); }catch{}
    t = t.replace(/\b(gm|good morning|morning)\b/g, "gm");
    t = t.replace(/\b(gn|good night|night)\b/g, "gn");
    if (strength >= 1){
      t = t.replace(/\b(legend|bro|degen|friend|homie)\b/g, "@voc");
    }
    if (strength >= 2){
      t = t.replace(/[~`!@#$%^&*()_=+\[\]{};:'",.<>/?\\|]/g, " ");
      t = t.replace(/\s+/g, " ").trim();
    }
    if (strength >= 3){
      try{
        t = t.replace(/[^\p{L}\p{N}\s]/gu, " ");
      } catch {
        t = t.replace(/[^a-z0-9\s]/gi, " ");
      }
      t = t.replace(/\b(a|an|the|and|to|your|you|on|this|that|here|today|tonight|tomorrow|back|really|just)\b/g, " ");
      t = t.replace(/\s+/g, " ").trim();
    }
    if (strength >= 4){
      t = t.replace(/\b(good|nice|solid|strong|clean|calm|soft|easy|quiet|steady|warm|kind|smooth)\b/g, "@adj");
      t = t.replace(/\b(gm|gn)\s+(this|keeping|saving|holding|closing)\b/g, "@open");
      t = t.replace(/\b(good one|nice post|clean one|strong post|solid post|good post|clean post|strong take|solid take|clean read|good read|nice read|solid read)\b/g, "@post");
      t = t.replace(/\b(sleep easy|sleep well|rest easy|rest well|good rest|real rest|proper rest|easy reset|soft landing|calm close|easy close|soft close)\b/g, "@close");
      t = t.replace(/\b(this reads|this lands|this sits|this holds|this closes|keeping this one|saving this one|holding this one)\b/g, "@canned");
      t = t.replace(/\b(start the day|start the session|open the day|open the morning|open the session|close the day|end the day)\b/g, "@phase");
      t = t.replace(/\s+/g, " ").trim();
    }
    return t;
  }

  function buildBanSet(kind, key, strength){
    const ban = new Set();
    if (strength <= 0) return ban;

    const recent = getRecent(kind);
    const keep = Math.min(recent.length, antiWindow(strength));
    for (const k of recent.slice(recent.length - keep)) ban.add(k);

    // Also ban everything already saved in the active list (so Bulk never repeats what you already have).
    const cur = readKey(key);
    for (const s of cur){
      const rk = repeatKey(s, Math.max(1, strength));
      if (rk) ban.add(rk);
    }
    return ban;
  }

  function filterAntiRepeat(kind, key, lines){
    const strength = getAntiStrength(kind);
    if (strength <= 0) return lines || [];
    const ban = buildBanSet(kind, key, strength);

    const out = [];
    for (const s of (lines || [])){
      const rk = repeatKey(s, strength);
      if (!rk) continue;
      if (ban.has(rk)) continue;
      ban.add(rk);
      out.push(s);
    }
    return out;
  }

  
  const CLEAN_FILL_INFLIGHT = { gm:false, gn:false };

  function dedupeLinesByShape(lines, strength){
    const out = [];
    const seenExact = new Set();
    const seenShape = new Set();
    for (const raw of (lines || [])){
      const t = normalizeLine(raw);
      if (!t) continue;
      const exact = t.toLowerCase();
      if (seenExact.has(exact)) continue;
      const shape = repeatKey(t, Math.max(1, strength));
      if (shape && seenShape.has(shape)) continue;
      seenExact.add(exact);
      if (shape) seenShape.add(shape);
      out.push(t);
    }
    return out;
  }

  async function dedupeLinesByShapeAsync(lines, strength, yieldEvery){
    const out = [];
    const seenExact = new Set();
    const seenShape = new Set();
    const step = Math.max(40, Number(yieldEvery) || 180);
    let scanned = 0;
    for (const raw of (lines || [])){
      scanned++;
      const t = normalizeLine(raw);
      if (!t) {
        if ((scanned % step) === 0) await yieldToUiFrame();
        continue;
      }
      const exact = t.toLowerCase();
      if (seenExact.has(exact)) {
        if ((scanned % step) === 0) await yieldToUiFrame();
        continue;
      }
      const shape = repeatKey(t, Math.max(1, strength));
      if (shape && seenShape.has(shape)) {
        if ((scanned % step) === 0) await yieldToUiFrame();
        continue;
      }
      seenExact.add(exact);
      if (shape) seenShape.add(shape);
      out.push(t);
      if ((scanned % step) === 0) await yieldToUiFrame();
    }
    return out;
  }

  async function refillCleanFill(kind, targetCount, opts){
    const key = activeKey(kind);
    const modeEl  = kind==="gm" ? $("gmMode") : $("gnMode");
    const styleEl = kind==="gm" ? $("gmStyle") : $("gnStyle");
    const packEl  = kind==="gm" ? $("gmPack") : $("gnPack");
    const mode = modeEl ? modeEl.value : "mid";
    const lang = currentLang(kind);
    let style = styleEl ? styleEl.value : "classic";
    const packId = packEl ? (packEl.value || "classic") : "classic";
    const packIdx = PACKS.findIndex(p=>p.id===packId);
    const packLocked = (!isPro() && packIdx >= unlockedPacksCount());
    const pack = PACKS.find(p=>p.id===packId) || PACKS[0];
    if (!packLocked && pack && pack.style) style = pack.style;

    const before = readKey(key);
    const cleaned = await dedupeLinesByShapeAsync(before, CLEAN_FILL_STRENGTH, 200);
    const removed = Math.max(0, before.length - cleaned.length);
    let cur = cleaned.slice();
    writeKey(key, cur);
    await yieldToUiFrame();

    const remSlotsNow = remainingSlots(kind);
    let desiredTotal = Number.isFinite(targetCount) ? Math.max(0, Math.trunc(targetCount)) : before.length;
    if (remSlotsNow !== Infinity){
      desiredTotal = Math.min(cur.length + remSlotsNow, desiredTotal);
    }
    desiredTotal = Math.max(cur.length, desiredTotal);

    const exactSeen = new Set(cur.map(s=>String(s||"").trim().toLowerCase()).filter(Boolean));
    const shapeSeen = new Set(cur.map(s=>repeatKey(s, CLEAN_FILL_STRENGTH)).filter(Boolean));
    const addedShapeKeys = [];
    let refilled = 0;
    let attempts = 0;
    let stalled = 0;
    const refillDeadline = Date.now() + 45000;
    while (cur.length < desiredTotal && attempts < 3){
      if (Date.now() > refillDeadline) break;
      attempts++;
      const missing = desiredTotal - cur.length;
      const reqCount = Math.min(180, missing + 50 + (stalled * 20));
      const bulk = await api(`/api/generate-bulk?kind=${kind}&mode=${encodeURIComponent(mode)}&lang=${encodeURIComponent(lang)}&style=${encodeURIComponent(style)}&anti_last_n=0&count=${reqCount}`, "GET", null, { signal: opts?.signal, timeoutMs: 12000 });
      const list = Array.isArray(bulk?.list) ? bulk.list : [];
      if (!list.length) {
        stalled++;
        if (stalled >= 2) break;
        continue;
      }
      let progress = 0;
      let scannedBatch = 0;
      for (const raw of list){
        scannedBatch++;
        const t = normalizeLine(raw);
        if (!t) continue;
        const exact = t.toLowerCase();
        if (exactSeen.has(exact)) continue;
        const shape = repeatKey(t, CLEAN_FILL_STRENGTH);
        if (shape && shapeSeen.has(shape)) continue;
        exactSeen.add(exact);
        if (shape){
          shapeSeen.add(shape);
          addedShapeKeys.push(shape);
        }
        cur.push(t);
        refilled++;
        progress++;
        if ((scannedBatch % 120) === 0) await yieldToUiFrame();
        if (cur.length >= desiredTotal) break;
      }
      if (progress <= 0) {
        stalled++;
        if (stalled >= 2) break;
        continue;
      }
      stalled = 0;
    }

    writeKey(key, cur);
    if (addedShapeKeys.length) pushRecent(kind, addedShapeKeys);
    return { removed, refilled, finalCount: cur.length, targetCount: desiredTotal };
  }

  async function oneClickCleanup(kind, opts){
    const msgEl = kind==="gm" ? $("gmMsg") : $("gnMsg");
    if (!getHandle()){
      tab("home");
      return { removed:0, refilled:0, finalCount:0, targetCount:0 };
    }
    if (CLEAN_FILL_INFLIGHT[kind]) return null;
    const key = activeKey(kind);
    const cur = readKey(key);
    const targetCount = Number.isFinite(opts?.targetCount) ? Math.max(0, Math.trunc(opts.targetCount)) : cur.length;
    if (!cur.length && targetCount <= 0){
      if (msgEl && !opts?.silent) msgEl.innerHTML = `<span class="muted">Nothing saved yet.</span>`;
      return { removed:0, refilled:0, finalCount:0, targetCount:0 };
    }

    CLEAN_FILL_INFLIGHT[kind] = true;
    try{
      if (msgEl && !opts?.silent) msgEl.innerHTML = `<span class="muted">Best pass...</span>`;
      const res = await refillCleanFill(kind, targetCount, opts || {});
      renderList(kind);
      if (msgEl && !opts?.keepMessage){
        if (res.finalCount >= res.targetCount){
          msgEl.innerHTML = `<span class="ok">Best pass removed ${res.removed} and refilled ${res.refilled}. Bank now has ${res.finalCount}/${res.targetCount}.</span>`;
        } else {
          msgEl.innerHTML = `<span class="warn">Best pass removed ${res.removed} and refilled ${res.refilled}. Bank finished at ${res.finalCount}/${res.targetCount}. Try another tone or preset for a wider pool.</span>`;
        }
      }
      return res;
    } catch(e){
      const m = (e && e.message) ? e.message : "failed";
      if (msgEl && !opts?.keepMessage) msgEl.innerHTML = `<span class="bad">${escapeHtml(m)}</span>`;
      return { removed:0, refilled:0, finalCount:cur.length, targetCount };
    } finally {
      CLEAN_FILL_INFLIGHT[kind] = false;
    }
  }

function cleanupKeyLines(lines){
    return dedupeLinesByShape((lines||[]).filter(Boolean), CLEAN_FILL_STRENGTH);
  }

  function setRangeText(id, v){
    const el = $(id);
    if (el) el.textContent = String(v);
  }

  function normalizeLine(s){
    let t = String(s||"");
    t = t.replace(/\s+/g, " ").trim();
    // remove leading dashes that look botted
    t = t.replace(/^(?:-|–|—)+\s*/,"");
    return t;
  }

  function dedupeLines(lines){
    const seen = new Set();
    const out = [];
    for (const x of lines){
      const t = normalizeLine(x);
      const key = t.toLowerCase();
      if (!t) continue;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(t);
    }
    return out;
  }

  function normalizeKind(kind){
    let changed = 0;
    for (const k of allKeysForKind(kind)){
      const before = readKey(k);
      const after = before.map(normalizeLine).filter(Boolean);
      if (after.join("\n") !== before.join("\n")){
        writeKey(k, after);
        changed++;
      }
    }
    return changed;
  }

  function cleanupKind(kind){
    let changed = 0;
    for (const k of allKeysForKind(kind)){
      const before = readKey(k);
      const after = cleanupKeyLines(before).map(normalizeLine).filter(Boolean);
      if (after.join("\n") !== before.join("\n")){
        writeKey(k, after);
        changed++;
      }
    }
    return changed;
  }

  function dedupeKind(kind){
    let changed = 0;
    for (const k of allKeysForKind(kind)){
      const before = readKey(k);
      const after = dedupeLines(before);
      if (after.join("\n") !== before.join("\n")){
        writeKey(k, after);
        changed++;
      }
    }
    return changed;
  }

  function exportData(){
    const gmBank = readKey(getBankKey("gm"));
    const gnBank = readKey(getBankKey("gn"));
    const data = {
      v: 2,
      handle: getHandle(),
      theme: localStorage.getItem("gmx_theme") || "classic",
      customBg: localStorage.getItem(LS_CUSTOM_BG_GLOBAL) || null,
      gm: { bank: gmBank, index: [], global: gmBank, langs: {} },
      gn: { bank: gnBank, index: [], global: gnBank, langs: {} }
    };
    return JSON.stringify(data);
  }

  function importData(jsonText){
    const data = JSON.parse(jsonText);
    if (!data || typeof data !== "object") throw new Error("bad_json");
    if (!data.gm || !data.gn) throw new Error("missing_sections");

    if (data.theme) localStorage.setItem("gmx_theme", String(data.theme));
    if ("customBg" in data){
      if (data.customBg) localStorage.setItem(LS_CUSTOM_BG_GLOBAL, String(data.customBg));
      else localStorage.removeItem(LS_CUSTOM_BG_GLOBAL);
    }

    const mergeImportedBank = (kind, payload)=>{
      const direct = Array.isArray(payload?.bank) ? payload.bank : [];
      const legacyGlobal = Array.isArray(payload?.global) ? payload.global : [];
      const legacyLangs = (payload?.langs && typeof payload.langs === "object") ? payload.langs : {};
      const merged = [];
      merged.push(...direct);
      merged.push(...legacyGlobal);
      for (const arr of Object.values(legacyLangs)){
        if (Array.isArray(arr)) merged.push(...arr);
      }
      for (const k of Array.from(new Set([...allLegacyKeysForKind(kind), getBankKey(kind)]))) localStorage.removeItem(k);
      setLangIndex(kind, []);
      writeKey(getBankKey(kind), dedupeLines(merged));
      try{ localStorage.setItem(kind === "gm" ? LS_GM_REPLY_LANG : LS_GN_REPLY_LANG, "en"); }catch{}
      try{ localStorage.setItem(getBankMigrationKey(kind), "1"); }catch{}
    };

    mergeImportedBank("gm", data.gm);
    mergeImportedBank("gn", data.gn);

    applyTheme(localStorage.getItem("gmx_theme") || "classic");
    applyUserBg();
    initWallpapers();
    renderThemes();
    fillStyles();
    fillPacks();
    renderLangChips("gm"); renderLangChips("gn");
    renderList("gm"); renderList("gn");
  }

  async function copyToClipboard(text){
    try{
      await navigator.clipboard.writeText(text);
      return true;
    }catch{
      // fallback
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      try{ document.execCommand("copy"); }catch{}
      ta.remove();
      return true;
    }
  }

  function supportBundle(){
    const bundle = {
      product: "GMXReply",
      build: $("ui_build") ? $("ui_build").textContent : "",
      handle: getHandle(),
      uiLang: localStorage.getItem(LS_SITE_LANG) || "en",
      gm: { total: totalSaved("gm"), langs: getLangIndex("gm") },
      gn: { total: totalSaved("gn"), langs: getLangIndex("gn") },
      sub: SUB ? { active:true, tier: SUB.tier || SUB.plan || "", until: SUB.until || SUB.expires || "" } : { active:false },
      theme: localStorage.getItem("gmx_theme") || "classic",
      hasCustomBg: !!localStorage.getItem(LS_CUSTOM_BG_GLOBAL),
      ua: navigator.userAgent
    };
    return JSON.stringify(bundle, null, 2);
  }

  function logsBundle(){
    const out = {
      ts: new Date().toISOString(),
      handle: getHandle(),
      logs: LOGS.slice(-120)
    };
    return JSON.stringify(out, null, 2);
  }


  function bindProTools(){
    const note = $("pro_tools_note");
    const gate = ()=>{
      if (!isPro()){
        if (note) note.textContent = (I18N[localStorage.getItem(LS_SITE_LANG)||"en"]?.pro_tools_note) || (I18N.en?.pro_tools_note) || "Pro-only tools.";
        return false;
      }
      if (note) note.textContent = "";
      return true;
    };

    const on = (id, fn)=>{
      const el = $(id);
      if (!el) return;
      el.addEventListener("click", async ()=>{
        if (!gate()) return;
        try{
          const msg = fn();
          if (note) note.textContent = msg || "Done.";
        }catch(e){
          if (note) note.textContent = "Failed: " + (e && e.message ? e.message : "error");
        }
      });
    };

        on("toolCleanupGm", ()=> `GM: cleaned ${cleanupKind("gm")} list(s).`);
    on("toolCleanupGn", ()=> `GN: cleaned ${cleanupKind("gn")} list(s).`);

    const expBtn = $("toolExport");
    if (expBtn){
      expBtn.addEventListener("click", async ()=>{
        if (!gate()) return;
        const data = exportData();
        await copyToClipboard(data);
        if (note) note.textContent = "Export copied to clipboard (JSON).";
      });
    }
    const impBtn = $("toolImport");
    if (impBtn){
      impBtn.addEventListener("click", ()=>{
        if (!gate()) return;
        const v = prompt("Paste export JSON here:");
        if (!v) return;
        try{
          importData(v);
          if (note) note.textContent = "Import complete.";
        }catch(e){
          if (note) note.textContent = "Import failed: " + (e && e.message ? e.message : "error");
        }
      });
    }
    const supBtn = $("toolSupport");
    if (supBtn){
      supBtn.addEventListener("click", async ()=>{
        const data = supportBundle();
        await copyToClipboard(data);
        if (note) note.textContent = "Support bundle copied. Send it only if support asks for it.";
      });
    }

    const logsBtn = $("toolLogs");
    if (logsBtn){
      logsBtn.addEventListener("click", async ()=>{
        const out = logsBundle();
        const ta = $("supportOut");
        if (ta) ta.value = out;
        await copyToClipboard(out);
        if (note) note.textContent = "Logs copied. Send them only if support asks for them.";
        logEvent("support_logs", { size: out.length });
      });
    }
  }


  function bindProControls(){
    // packs
    const bindPack = (kind)=>{
      const sel = kind==="gm" ? $("gmPack") : $("gnPack");
      const btn = kind==="gm" ? $("gmPackApply") : $("gnPackApply");
      const msgEl = kind==="gm" ? $("gmMsg") : $("gnMsg");
      if (sel){
        sel.addEventListener("change", ()=>{
          localStorage.setItem(lsKeyPack(kind), sel.value);
          logEvent("pack_change", { kind, pack: sel.value });
        });
      }
      if (btn){
        btn.addEventListener("click", ()=>{
          const pid = sel ? (sel.value || "classic") : "classic";
          const p = PACKS.find(x=>x.id===pid) || PACKS[0];
          const idx = PACKS.findIndex(x=>x.id===pid);
          const locked = (!isPro() && idx >= unlockedPacksCount());
          if (locked){
            if (msgEl) msgEl.innerHTML = `<span class="warn">Pack is locked. Upgrade to Pro or unlock via referrals.</span>`;
            return;
          }
          // apply preset defaults
          const styleSel = kind==="gm" ? $("gmStyle") : $("gnStyle");
          const modeSel  = kind==="gm" ? $("gmMode")  : $("gnMode");
          if (styleSel && p.style) styleSel.value = p.style;
          if (modeSel && p.mode) modeSel.value = p.mode;

          if (msgEl) msgEl.innerHTML = `<span class="ok">Applied pack: ${escapeHtml(p.name)}</span>`;
          logEvent("pack_apply", { kind, pack: pid });
        });
      }
    };

    const bindRanges = (_kind)=>{};

    // initial sync hook kept only for compatibility after removing the old anti-repeat slider.
    const sync = (_kind)=>{};

    ["gm","gn"].forEach(kind=>{
      bindPack(kind);
      bindRanges(kind);
      sync(kind);
    });

    // Expose a safe re-sync hook after subscription/referral refresh
    try{ window.__syncProControls = ()=>{ ["gm","gn"].forEach(sync); }; } catch {}
  }

  // Light/Dark mode (site-only)
  const LS_SITE_MODE = "gmx_site_mode"; // "dark" | "light"
  function applySiteMode(mode, persist){
    const m = (mode === "light") ? "light" : "dark";
    document.documentElement.classList.toggle("mode-light", m === "light");
    if (persist){ try{ localStorage.setItem(LS_SITE_MODE, m); }catch{} }
    const btn = $("btnMode");
    if (btn) btn.textContent = (m === "light") ? "Dark" : "Light";
  }
  function initModeToggle(){
    const btn = $("btnMode");
    if (!btn) return;
    let m = "dark";
    try{ m = localStorage.getItem(LS_SITE_MODE) || ""; }catch{}
    if (!m) m = document.documentElement.classList.contains("mode-light") ? "light" : "dark";
    applySiteMode(m, false);
    btn.addEventListener("click", ()=>{
      const now = document.documentElement.classList.contains("mode-light") ? "light" : "dark";
      applySiteMode(now === "light" ? "dark" : "light", true);
    });
  }

  bindProTools();
  bindProControls();

  if (typeof window !== "undefined" && /^(127\.0\.0\.1|localhost)$/.test(location.hostname)) {
    window.__GMX_TEST__ = Object.assign(window.__GMX_TEST__ || {}, {
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
      dedupeLines
    });
  }

  AUTH_OK = !!(getHandle() && getToken());

  // restore session if exists
  $("handlePill").textContent = getHandle() ? getHandle() : "not set";
  $("xHandle").value = getHandle() || "";

  applyAdminVisibility();
  try{ initModeToggle(); }catch(e){}
  applyLang();
  try{ initThemeWallTabs(); }catch{}
  try{ bindExtTabs(); }catch{}
  try{ initExtWallpaperControls(); }catch{}
  try{ normalizeStoredExtWallpaperSelections(); }catch{}
  try{ migrateLegacyWallpaperSelectionOnce(); }catch{}
  try{ migrateLegacyExtWallpaperSelectionOnce(); }catch{}
  try{ renderExtThemes(); }catch{}
  try{ renderExtWallpapers(); }catch{}
  try{ renderExtCustomBgUI(); }catch{}
  try{ setExtView(normalizeExtViewValue(localStorage.getItem(LS_EXT_VIEW) || "theme"), { force:true, silent:true }); }catch{}
  restoreDrafts();

  let bootTab = "home";
  try{
    const storedTab = String(localStorage.getItem(LS_LAST_TAB) || "").trim();
    bootTab = normalizeTopLevelTab(storedTab || "home");
  }catch{}
  tab(bootTab);
  CURRENT_TAB = bootTab;
  setBg(bootTab);

  ping();
  loadBuild();
  try{ bindWalletTab(); }catch(e){}
  try{ bindLimitModal(); }catch(e){}
  try{ bindPaySuccess(); }catch(e){}
  try{ loadPlans(); }catch(e){}
  try{ loadBillingProof(); }catch(e){}
  try{ bindHelpModal(); }catch(e){}
  try{ watchBuildUpdates(); }catch(e){}

  // Only refresh protected stats when we successfully obtained a token.
  // If init fails (API down, invalid handle, etc.) we keep the UI usable and avoid noisy 401s.
  if (getHandle()){
    initSession(false).then(async (tok)=>{
      if (!tok) return;
      try{ await refreshUsage(); }catch{}
      // Plans & proof are public; already loaded above.
    }).catch(()=>{});
  }

  try{ migrateLegacyBank("gm"); }catch(e){}
  try{ migrateLegacyBank("gn"); }catch(e){}

  renderList("gm");
  renderList("gn");

    try{ initProTabs(); }catch(e){}
INIT_DONE = true;

// --- Stability watchdog (auto-recover from unexpected runtime crashes) ---
(function(){
  const KEY = "gmx_autorecover_v1";
  function read(){
    try{ return JSON.parse(localStorage.getItem(KEY) || "{}"); }catch(e){ return {}; }
  }
  function write(v){
    try{ localStorage.setItem(KEY, JSON.stringify(v)); }catch(e){}
  }
  function shouldReload(){
    const now = Date.now();
    const s = read();
    const arr = Array.isArray(s.reloads) ? s.reloads : [];
    const fresh = arr.filter(ts => (now - ts) < 10*60*1000);
    if (fresh.length >= 3) return false; // prevent reload loops
    fresh.push(now);
    s.reloads = fresh;
    write(s);
    return true;
  }
  function scheduleReload(){
    if (window.__gmxRecovering) return;
    if (!shouldReload()) return;
    window.__gmxRecovering = true;
    try{
      try{ if (typeof toast === "function") toast("warn", "Recovering... reloading", 2500); }catch{}
    }catch{}
    setTimeout(()=>{ try{ location.reload(); }catch{} }, 1200);
  }
  window.addEventListener("error", (e)=>{
    // Ignore extremely noisy non-critical errors
    const msg = String(e?.message || "");
    if (msg.includes("ResizeObserver") || msg.includes("Non-Error promise rejection")) return;
    // Never auto-reload on expected network/API errors (we show degraded mode instead)
    if (msg.includes("Failed to fetch") || msg.includes("NetworkError") || msg.includes("request_failed") || msg.includes("timeout")){
      try{ if (typeof setDegraded === "function") setDegraded(true, "API/network issue. You can still edit lists locally."); }catch{}
      return;
    }
    scheduleReload();
  });
  window.addEventListener("unhandledrejection", (e)=>{
    const msg = String(e?.reason?.message || e?.reason || "");
    if (msg.includes("ResizeObserver")) return;
    if (msg.includes("Failed to fetch") || msg.includes("NetworkError") || msg.includes("request_failed") || msg.includes("timeout") || msg.includes("not_connected")){
      try{ if (typeof setDegraded === "function") setDegraded(true, "API/network issue. You can still edit lists locally."); }catch{}
      return;
    }
    scheduleReload();
  });
})();


})();
