  // ----- Lightweight client logs (for support) -----
  const LOGS = [];
  function logEvent(type, data){
    try{
      LOGS.push({ ts: Date.now(), type, data: data || null });
      if (LOGS.length > 200) LOGS.shift();
    } catch {}
  }

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


  
  // ---- Custom background per tab (Themes) ----
  // Migration from old single-key storage:
  const LS_CUSTOM_BG_GLOBAL = K.CUSTOM_BG_GLOBAL;
  const LS_CUSTOM_BG_TAB_PREFIX = K.CUSTOM_BG_TAB_PREFIX;

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

    if (document.body.classList.contains("hasWallBg")){
      document.documentElement.style.setProperty("--bg_user", "none");
      document.body.classList.remove("hasUserBg");
      return;
    }

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

