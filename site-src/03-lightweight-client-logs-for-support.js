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

  function renderCustomBgUI(){ /* merged into wallpapers tab */ }
  function syncCustomBgUI(){ /* merged into wallpapers tab */ }

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

