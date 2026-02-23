/* eslint-disable */
// @ts-nocheck
export async function startLegacyApp(){
  if (globalThis.__GMX_LEGACY_STARTED) return;
  globalThis.__GMX_LEGACY_STARTED = true;
const API = (globalThis.__GMX_API_ORIGIN || location.origin);

  const ADMIN_HANDLE = "@Kristofer_Sol_";
  let SAVE_CAP_FREE = 70;
  const EMPTY = "__EMPTY__";

  let SUB = null;
  let REF_COUNT = 0;
  let AUTH_OK = false;
  let LAST_USAGE = { gm:{ used:0, limit:0 }, gn:{ used:0, limit:0 }, resetAt:null };
  let LAST_SAVED = { gm:0, gn:0 };
  function isPro(){ return !!(SUB && SUB.active); }
  function saveCap(){ return isPro() ? Infinity : SAVE_CAP_FREE; }
// --- Unlock logic (Variant A)
const FREE_VISIBLE_THEMES = 10;
const FREE_VISIBLE_STYLES = 5;
const FREE_VISIBLE_PACKS = 2;
const FREE_VISIBLE_WALLPAPERS = 10;
const FREE_VISIBLE_EXT_THEMES = 10;
const FREE_VISIBLE_EXT_WALLPAPERS = 10;

function reqRefsForUnlockIndex(idx, freeCount=FREE_VISIBLE_THEMES){
  // idx is 0-based. Items [0..freeCount-1] are free.
  if (idx < freeCount) return 0;
  return 10 + (idx - freeCount) * 5;
}
function unlockedCountByRefs(total, freeCount=FREE_VISIBLE_THEMES){
  if (isPro()) return total;
  const r = Number(REF_COUNT||0);
  if (total <= freeCount) return total;
  if (r < 10) return Math.min(total, freeCount);
  const extra = 1 + Math.floor((r - 10) / 5);
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
  const LS_GM_REPLY_LANG = "gmx_gm_reply_lang";
  const LS_GN_REPLY_LANG = "gmx_gn_reply_lang";


  const GM_GLOBAL = "gmx_gm_global";
  const GN_GLOBAL = "gmx_gn_global";
  const GM_LANGS  = "gmx_gm_langs";
  const GN_LANGS  = "gmx_gn_langs";

  const LS_CUSTOM_BG = "gmx_custom_bg";

  const LS_GM_PACK = "gmx_gm_pack";
  const LS_GN_PACK = "gmx_gn_pack";
  const LS_GM_ANTI = "gmx_gm_anti";
  const LS_GN_ANTI = "gmx_gn_anti";
const LS_GM_RECENT = "gmx_gm_recent";
  const LS_GN_RECENT = "gmx_gn_recent";


  // Anti-repeat strength (0..5) stored per GM.
  function getAntiStrength(kind){
    try{
      const key = (kind==="gm") ? LS_GM_ANTI : LS_GN_ANTI;
      const raw = localStorage.getItem(key);
      const v = parseInt(raw ?? "2", 10);
      if (!Number.isFinite(v)) return 2;
      return Math.max(0, Math.min(5, v));
    } catch {
      return 2;
    }
  }

  // Map anti-repeat strength (0..5) to a display "window" size (how many recent items to block).
  // This is UI-only; backend still uses the strength value.
  if (typeof window.antiWindow !== "function"){
    window.antiWindow = function(strength){
      const s = Math.max(0, Math.min(5, Math.trunc(Number(strength) || 0)));
      const map = [0, 10, 20, 30, 40, 50]; // strength 0..5
      return map[s] ?? 20;
    };
  }
  // Also expose a local alias for legacy calls in this file.
  function antiWindow(strength){
    return window.antiWindow(strength);
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
      document.documentElement.style.setProperty("--bg_user", `url("${data}") center/cover no-repeat fixed`);
    } else {
      document.documentElement.style.setProperty("--bg_user", "none");
    }
    document.body.classList.toggle("hasUserBg", on);
  }

  async function fitImageToCoverDataUrl(file, maxW=1920, maxH=1080, quality=0.86){
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


  function renderCustomBgUI(){
    const tabSel = $("customBgTab");
    const st = $("customBg_status");
    const nm = $("customBgName");
    if (!tabSel || !st) return;

    const prev = tabSel.value || "all";
    tabSel.innerHTML = "";

    const used = listCustomBgUsedTabs();
    const usedCount = used.length;
    const unlocked = customBgUnlockedTabCount(); // ordered count
    const tabsOnly = TABS.filter(t=>t[0]!=="all").map(t=>t[0]);

    // build options
    TABS_PUBLIC.forEach(([key, labelKey])=>{
      const opt = document.createElement("option");
      opt.value = key;

      // label: keep existing i18n for apply-to
      opt.textContent = t(labelKey);

      if (key !== "all" && !isPro()){
        const alreadyUsed = used.includes(key);
        if (!alreadyUsed){
          // If free slots remaining, allow any new tab
          if (usedCount < 3){
            opt.disabled = false;
          } else {
            const idx = tabsOnly.indexOf(key);
            const allow = (idx >= 0 && idx < unlocked);
            opt.disabled = !allow;
            if (!allow){
              const need = requiredRefsForCustomBgTab(key);
              opt.textContent = `${t(labelKey)} (${need} ref)`;
            }
          }
        }
      }

      tabSel.appendChild(opt);
    });

    // restore selection
    const found = Array.from(tabSel.options).some(o=>o.value===prev && !o.disabled);
    tabSel.value = found ? prev : "all";

    const target = tabSel.value || "all";
    const has = !!localStorage.getItem(customBgKeyForTab(target));
    if (nm){ nm.textContent = has ? "Saved background" : ""; }

    // status text
    if (isPro()){
      st.textContent = has ? "Custom background is active for this target." : "Choose an image to set a custom background.";
    } else {
      const freeLeft = Math.max(0, 3 - usedCount);
      if (target === "all"){
        st.textContent = "Free: apply a custom background to All pages (does not count toward your 3 free tabs).";
      } else if (used.includes(target)){
        st.textContent = has ? "Custom background is active for this tab." : "No custom background set for this tab.";
      } else if (freeLeft > 0){
        st.textContent = `Free: you can set custom backgrounds for ${freeLeft} more tab(s).`;
      } else {
        const need = requiredRefsForCustomBgTab(target);
        st.textContent = `Locked: need ${need} referrals to unlock more tabs (or upgrade to Pro).`;
      }
    }
  }

  function syncCustomBgUI(){
    const rm = $("customBgRemove");
    const clearBtn = $("customBgClear");
    const tabSel = $("customBgTab");

    // Bind listeners once (Themes tab can be opened/closed many times)
    if (!syncCustomBgUI._bound){
      syncCustomBgUI._bound = true;

      if (tabSel){
        tabSel.addEventListener("change", ()=>{
          renderCustomBgUI();
          const target = (tabSel.value || "all");
          const previewTab = (target === "all") ? currentTabName() : target;
          applyUserBg(previewTab);
        });
      }

      if (clearBtn){
        clearBtn.addEventListener("click", ()=>{
          if (!requireConnected("Themes")) return;
          const target = ($("customBgTab")?.value || "all");
          setCustomBgForTab(target, null);
          renderCustomBgUI();
          const previewTab = (target === "all") ? currentTabName() : target;
          applyUserBg(previewTab);
          toast("ok", (t("toast_custom_bg_cleared")||"Custom background cleared."));
        });
      }
    }

    if (rm){ rm.disabled = false; }

    renderCustomBgUI();
    const target = (tabSel?.value || "all");
    const previewTab = (target === "all") ? currentTabName() : target;
    applyUserBg(previewTab);
  }

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

  async function compressImageToJpegDataURL(file){
    const src = await readFileAsDataURL(file);
    const img = await loadImage(src);

    const MAX = 2200; // max dimension
    let w = img.naturalWidth || img.width;
    let h = img.naturalHeight || img.height;
    if (!w || !h) return src;

    const scale = Math.min(1, MAX / Math.max(w, h));
    const tw = Math.max(1, Math.round(w * scale));
    const th = Math.max(1, Math.round(h * scale));

    const canvas = document.createElement("canvas");
    canvas.width = tw;
    canvas.height = th;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0, tw, th);

    // Use jpeg to keep it small
    return canvas.toDataURL("image/jpeg", 0.86);
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
      themes:    ()=> mk(18,10,84,20, sheen45),
      extthemes: ()=> mk(18,12,82,22, sheen225),
      wallet:    ()=> mk(22,12,76,22, conicPay)
    };
  })();


  // Wallpapers (SVG) — per-tab (Option 2). 2 free wallpapers for trial, 30 locked (Shark/Pro).
  const LS_WP_GLOBAL = "gmx_wp_all";
  const LS_WP_TAB_PREFIX = "gmx_wp_tab_"; // + tab name

  const WALLPAPERS = [
    
    { id:"free01", name:"Free — Solana Waves", tier:"free" },
    { id:"free02", name:"Free — Solflare Glow", tier:"free" },
    { id:"w01", name:"Free — Mask Polygon", tier:"free" },
    { id:"w02", name:"Free — DeFi Circuit", tier:"free" },
    { id:"w03", name:"Free — Bitcoin Spark", tier:"free" },
    { id:"w04", name:"Free — Ethereum Mist", tier:"free" },
    { id:"w05", name:"Free — Stable Grid", tier:"free" },
    { id:"w06", name:"Free — Degen Matrix", tier:"free" },
    { id:"w07", name:"Free — On-chain Radar", tier:"free" },
    { id:"w08", name:"Free — Neon Validator", tier:"free" },
    { id:"w09", name:"Premium #09 — NFT", tier:"premium" },
    { id:"w10", name:"Premium #10 — Jupiter", tier:"premium" },
    { id:"w11", name:"Premium #11 — Raydium", tier:"premium" },
    { id:"w12", name:"Premium #12 — MEV", tier:"premium" },
    { id:"w13", name:"Premium #13 — LFG", tier:"premium" },
    { id:"w14", name:"Premium #14 — Onchain", tier:"premium" },
    { id:"w15", name:"Premium #15 — SPL", tier:"premium" },
    { id:"w16", name:"Premium #16 — Gasless", tier:"premium" },
    { id:"w17", name:"Premium #17 — Wen", tier:"premium" },
    { id:"w18", name:"Premium #18 — Diamond", tier:"premium" },
    { id:"w19", name:"Premium #19 — CEX", tier:"premium" },
    { id:"w20", name:"Premium #20 — DEX", tier:"premium" },
    { id:"w21", name:"Premium #21 — Ape", tier:"premium" },
    { id:"w22", name:"Premium #22 — HODL", tier:"premium" },
    { id:"w23", name:"Premium #23 — FOMO", tier:"premium" },
    { id:"w24", name:"Premium #24 — FUD", tier:"premium" },
    { id:"w25", name:"Premium #25 — Pump", tier:"premium" },
    { id:"w26", name:"Premium #26 — Chart", tier:"premium" },
    { id:"w27", name:"Premium #27 — Whale", tier:"premium" },
    { id:"w28", name:"Premium #28 — Fren", tier:"premium" },
    { id:"w29", name:"Premium #29 — GM", tier:"premium" },
    { id:"w30", name:"Premium #30 — Night", tier:"premium" },
    { id:"w31", name:"Premium #31 — FrenTech", tier:"premium" },
    { id:"w32", name:"Premium #32 — Szn", tier:"premium" },
    { id:"w33", name:"Premium #33 — Yield", tier:"premium" },
    { id:"w34", name:"Premium #34 — Staking", tier:"premium" },
    { id:"w35", name:"Premium #35 — Bridge", tier:"premium" },
    { id:"w36", name:"Premium #36 — Swap", tier:"premium" },
    { id:"w37", name:"Premium #37 — Orderbook", tier:"premium" },
    { id:"w38", name:"Premium #38 — Futures", tier:"premium" },
    { id:"w39", name:"Premium #39 — ApeMode", tier:"premium" },
    { id:"w40", name:"Premium #40 — Bull", tier:"premium" },
    { id:"w41", name:"Premium #41 — Bear", tier:"premium" },
    { id:"w42", name:"Premium #42 — Moon", tier:"premium" },
    { id:"w43", name:"Premium #43 — Sunrise", tier:"premium" },
    { id:"w44", name:"Premium #44 — Neon", tier:"premium" },
    { id:"w45", name:"Premium #45 — Cyber", tier:"premium" },
    { id:"w46", name:"Premium #46 — Matrix", tier:"premium" },
    { id:"w47", name:"Premium #47 — Signal", tier:"premium" },
    { id:"w48", name:"Premium #48 — Orbit", tier:"premium" },
    { id:"w49", name:"Premium #49 — Nova", tier:"premium" },
    { id:"w50", name:"Premium #50 — Pulse", tier:"premium" },
    { id:"w51", name:"Premium #51 — Wave", tier:"premium" },
    { id:"w52", name:"Premium #52 — Rekt", tier:"premium" },
    { id:"w53", name:"Premium #53 — Cook", tier:"premium" },
    { id:"w54", name:"Premium #54 — Mint", tier:"premium" },
    { id:"w55", name:"Premium #55 — Drop", tier:"premium" },
    { id:"w56", name:"Premium #56 — Tape", tier:"premium" },
    { id:"w57", name:"Premium #57 — Terminal", tier:"premium" },
    { id:"w58", name:"Premium #58 — Saga", tier:"premium" },
    { id:"w59", name:"Premium #59 — Phantom", tier:"premium" },
    { id:"w60", name:"Premium #60 — Bonk", tier:"premium" },
    { id:"w61", name:"Premium #61 — Wif", tier:"premium" },
    { id:"w62", name:"Premium #62 — Jito", tier:"premium" },
    { id:"w63", name:"Premium #63 — Drift", tier:"premium" },
    { id:"w64", name:"Premium #64 — Solana", tier:"premium" },
    { id:"w65", name:"Premium #65 — Degen", tier:"premium" },
    { id:"w66", name:"Premium #66 — Liquidity", tier:"premium" },
    { id:"w67", name:"Premium #67 — Alpha", tier:"premium" },
    { id:"w68", name:"Premium #68 — Meme", tier:"premium" },
    { id:"w69", name:"Premium #69 — Validator", tier:"premium" },
    { id:"w70", name:"Premium #70 — RPC", tier:"premium" },
    { id:"w71", name:"Premium #71 — Signal", tier:"premium" },
    { id:"w72", name:"Premium #72 — Pulse", tier:"premium" },
    { id:"w73", name:"Premium #73 — Nebula", tier:"premium" },
    { id:"w74", name:"Premium #74 — Arcade", tier:"premium" },
    { id:"w75", name:"Premium #75 — Chrome", tier:"premium" },
    { id:"w76", name:"Premium #76 — Prism", tier:"premium" },
    { id:"w77", name:"Premium #77 — Aurora", tier:"premium" },
    { id:"w78", name:"Premium #78 — Grid", tier:"premium" },
    { id:"w79", name:"Premium #79 — Flux", tier:"premium" },
    { id:"w80", name:"Premium #80 — Orbit", tier:"premium" },
    { id:"w81", name:"Premium #81 — Vortex", tier:"premium" },
    { id:"w82", name:"Premium #82 — Circuit", tier:"premium" },
    { id:"w83", name:"Premium #83 — Drift", tier:"premium" },
    { id:"w84", name:"Premium #84 — Nova", tier:"premium" },
    { id:"w85", name:"Premium #85 — Ion", tier:"premium" },
    { id:"w86", name:"Premium #86 — Sakura", tier:"premium" },
    { id:"w87", name:"Premium #87 — Phantom", tier:"premium" },
    { id:"w88", name:"Premium #88 — Solstice", tier:"premium" },
    { id:"w89", name:"Premium #89 — Neon", tier:"premium" },
    { id:"w90", name:"Premium #90 — Matrix", tier:"premium" },
    { id:"w91", name:"Premium #91 — Reactor", tier:"premium" },
    { id:"w92", name:"Premium #92 — Zen", tier:"premium" },
    { id:"w93", name:"Premium #93 — Turbo", tier:"premium" },
    { id:"w94", name:"Premium #94 — Crown", tier:"premium" },
    { id:"w95", name:"Premium #95 — Forge", tier:"premium" },
    { id:"w96", name:"Premium #96 — Harbor", tier:"premium" },
    { id:"w97", name:"Premium #97 — Portal", tier:"premium" },
    { id:"w98", name:"Premium #98 — Rift", tier:"premium" },
  ];

  const WALLPAPER_TABS = [
    ["all","wp_apply_all"],
    ["home","wp_apply_home"],
    ["gm","wp_apply_gm"],
    ["gn","wp_apply_gn"],
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

  function wallpaperUrl(id){
    if (!id) return "none";
    // Lite build ships wallpapers as SVG to keep size small and avoid 404 noise.
    return `url("/assets/wallpapers/${id}.svg") center/cover no-repeat fixed`;
  }

  function wallpaperUnlocked(wp, idx){
    if (!wp) return false;
    return isPro() || (idx < unlockedCountByRefs(WALLPAPERS.length, FREE_VISIBLE_WALLPAPERS));
  }

  function applyWallpaper(tab){
    const id = getWallpaperForTab(tab);
    const wp = WALLPAPERS.find(x=>x.id===id) || null;
    let idx = -1;
    try{ idx = wp ? WALLPAPERS.findIndex(x=>x.id===id) : -1; }catch{}
    const ok = wp ? wallpaperUnlocked(wp, idx) : true;

    const css = (id && ok) ? wallpaperUrl(id) : "none";
    document.documentElement.style.setProperty("--bg_wall", css);
    document.body.classList.toggle("hasWallBg", css !== "none");
  }

  
  function trWp(k){
    let lang = "en";
    try{ lang = localStorage.getItem(LS_SITE_LANG) || "en"; }catch{}
    let base = {}, dict = {};
    try{ base = I18N.en || {}; dict = I18N[lang] || {}; }catch{}
    return (dict[k] ?? base[k] ?? k);
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

    const unlocked = unlockedCountByRefs(WALLPAPERS.length, FREE_VISIBLE_WALLPAPERS);
    const unlockedAll = isPro() || unlocked >= WALLPAPERS.length;
    const nextReq = reqRefsForUnlockIndex(unlocked, FREE_VISIBLE_WALLPAPERS);
    st.innerHTML = unlockedAll
      ? `<span class="ok">Unlocked.</span> All wallpapers available.`
      : `<span class="warn">Locked.</span> First ${FREE_VISIBLE_WALLPAPERS} wallpapers are free. Next unlock at <b>${nextReq} ref</b> (then +1 every 5).`;

    const items = WALLPAPERS.map((wp, idx)=>({ wp, idx }));
    chunkedRender(grid, items, ({ wp, idx })=>{
      const isUnlocked = wallpaperUnlocked(wp, idx);
      const card = document.createElement("button");
      card.type = "button";
      card.className = "wpCard" + (isUnlocked ? "" : " mystery") + (wp.id===activeId ? " active" : "");

      const thumb = document.createElement("div");
      thumb.className = "wpThumb";
      thumb.setAttribute("data-bg", `/assets/wallpapers/${wp.id}.svg`);
      observeLazyBg(thumb);

      const name = document.createElement("div");
      name.className = "wpName";
      name.textContent = wp.name;

      const meta = document.createElement("div");
      meta.className = "wpMeta";
      meta.textContent = (idx < FREE_VISIBLE_WALLPAPERS) ? "Free" : (isPro() ? "Pro" : "Locked");

      const tag = document.createElement("div");
      tag.className = "wpTag";
      tag.textContent = (idx < FREE_VISIBLE_WALLPAPERS) ? "FREE" : (isUnlocked ? "UNLOCKED" : (reqRefsForUnlockIndex(idx, FREE_VISIBLE_WALLPAPERS) + " ref"));

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
          toast("warn", (t("locked_unlock_at") || "Locked. Unlock at {n} referrals (then +1 every 5) or Pro.").replace("{n}", String(reqRefsForUnlockIndex(idx, FREE_VISIBLE_WALLPAPERS))));
          return;
        }

        // Apply wallpaper implies wallpaper should be visible: clear custom background for the same target.
        if (targetTab === "all"){
          localStorage.setItem(LS_WP_GLOBAL, wp.id);
          clearCustomBgForTab("all");
        } else {
          setWallpaperForTab(targetTab, wp.id);
          clearCustomBgForTab(targetTab);
        }

        renderWallpaperUI();

        // Preview: apply to selected tab (not to the Themes tab).
        const previewTab = (targetTab === "all") ? currentTabName() : targetTab;
        applyUserBg(previewTab);
        applyWallpaper(previewTab);
      });

      return card;
    }, { key: "wpGrid", chunk: 18 });
  }
// Theme / Wallpaper toggle inside Themes tab
  const LS_THEMEWALL_VIEW = "gmx_themewall_view"; // "theme" | "wall" | "custom"

  function setThemeWallView(view){
    const themeBtn  = $("tabTheme");
    const wallBtn   = $("tabWall");
    const customBtn = $("tabCustom");
    const themePane  = $("themePane");
    const wallPane   = $("wallPane");
    const customPane = $("customPane");
    const wpNote = $("wp_note");
    const cbNote = $("customBg_note");
    if (!themeBtn || !wallBtn || !customBtn || !themePane || !wallPane || !customPane) return;

    const v = (view === "wall" || view === "custom") ? view : "theme";
    localStorage.setItem(LS_THEMEWALL_VIEW, v);

    const themeOn  = (v === "theme");
    const wallOn   = (v === "wall");
    const customOn = (v === "custom");

    themeBtn.classList.toggle("active", themeOn);
    wallBtn.classList.toggle("active", wallOn);
    customBtn.classList.toggle("active", customOn);

    themeBtn.setAttribute("aria-selected", themeOn ? "true" : "false");
    wallBtn.setAttribute("aria-selected", wallOn ? "true" : "false");
    customBtn.setAttribute("aria-selected", customOn ? "true" : "false");

    themePane.classList.toggle("hidden", !themeOn);
    wallPane.classList.toggle("hidden", !wallOn);
    customPane.classList.toggle("hidden", !customOn);

    if (wpNote) wpNote.classList.toggle("hidden", !wallOn);
    if (cbNote) cbNote.classList.toggle("hidden", !customOn);

    if (wallOn){
      try{ renderWallpaperUI(); }catch{}
    }
    if (customOn){
      try{ syncCustomBgUI(); }catch{}
    }
  }

  function initThemeWallTabs(){
    const themeBtn  = $("tabTheme");
    const wallBtn   = $("tabWall");
    const customBtn = $("tabCustom");
    if (themeBtn)  themeBtn.addEventListener("click", ()=>setThemeWallView("theme"));
    if (wallBtn)   wallBtn.addEventListener("click",  ()=>setThemeWallView("wall"));
    if (customBtn) customBtn.addEventListener("click", ()=>setThemeWallView("custom"));

    const saved = localStorage.getItem(LS_THEMEWALL_VIEW) || "theme";
    setThemeWallView(saved);
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
  let SITE_LANGS = [
    ["en","English"],["es","Español"],["pt","Português"],["fr","Français"],["de","Deutsch"],
    ["it","Italiano"],["nl","Nederlands"],["tr","Türkçe"],["pl","Polski"],["id","Indonesia"],
    ["ru","Русский"],["uk","Українська"],["hi","हिन्दी"],["ja","日本語"],["zh","中文"]
  ];

  // Reply language list (NO auto)
  let REPLY_LANGS = [
    ["en","English"],["es","Español"],["pt","Português"],["fr","Français"],["de","Deutsch"],
    ["it","Italiano"],["nl","Nederlands"],["tr","Türkçe"],["pl","Polski"],["id","Indonesia"],
    ["ru","Русский"],["uk","Українська"],["hi","हिन्दी"],["ja","日本語"],["zh","中文"]
  ];
// --- Flags + language chips (By language) ---
    function flagEmoji(code){
    const m = {
      en:"🇺🇸", es:"🇪🇸", pt:"🇵🇹", fr:"🇫🇷", de:"🇩🇪", it:"🇮🇹", nl:"🇳🇱",
      tr:"🇹🇷", pl:"🇵🇱", id:"🇮🇩", ru:"🇷🇺", uk:"🇺🇦", hi:"🇮🇳", ja:"🇯🇵", zh:"🇨🇳"
    };
    return m[code] || "🌐";
  }

  function updateLangFlags(){
    const site = $("siteLang")?.value || "en";
    const gm = $("gmLang")?.value || "en";
    const gn = $("gnLang")?.value || "en";
    if ($("siteLangFlag")) $("siteLangFlag").textContent = (site === "en") ? "🌐" : flagEmoji(site);
    if ($("gmLangFlag")) $("gmLangFlag").textContent = flagEmoji(gm);
    if ($("gnLangFlag")) $("gnLangFlag").textContent = flagEmoji(gn);
  }

  function renderLangChips(kind){
    const wrap = kind==="gm" ? $("gmLangChipsWrap") : $("gnLangChipsWrap");
    const box  = kind==="gm" ? $("gmLangChips") : $("gnLangChips");
    if (!wrap || !box) return;

    const view = kind==="gm" ? gmView : gnView;
    wrap.style.display = (view === "lang") ? "block" : "none";
    if (view !== "lang"){ box.innerHTML = ""; return; }

    const idx = getLangIndex(kind);
    // Sort by REPLY_LANGS order (then alphabetically)
    const order = new Map(REPLY_LANGS.map((x,i)=>[x[0], i]));
    const sorted = [...idx].sort((a,b)=>{
      const oa = order.has(a) ? order.get(a) : 999;
      const ob = order.has(b) ? order.get(b) : 999;
      if (oa !== ob) return oa-ob;
      return a.localeCompare(b);
    });

    box.innerHTML = "";
    for (const lang of sorted){
      const key = getLangKey(kind, lang);
      const count = readKey(key).length;
      const b = document.createElement("button");
      b.type = "button";
      b.className = "chip" + (currentLang(kind)===lang ? " active" : "");
      b.innerHTML = `<span class="f">${flagEmoji(lang)}</span><span class="c">${lang.toUpperCase()}</span><span class="n">${count}</span>`;
      b.onclick = ()=>{
        if (kind==="gm") $("gmLang").value = lang;
        else $("gnLang").value = lang;
        updateLangFlags();

        renderList(kind);
        renderLangChips(kind);
      };
      box.appendChild(b);
    }
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
  ];

  const EXT_THEMES = THEMES.map(t=>({ id:t.id, name:t.name, note:t.note, a:t.a, b:t.b }));


  const EXT_WALLPAPERS = [
    { id:"ext_free_01", name:"Free 01" },
    { id:"ext_free_02", name:"Free 02" },
    { id:"ext_03", name:"Premium 03" },
    { id:"ext_04", name:"Premium 04" },
    { id:"ext_05", name:"Premium 05" },
    { id:"ext_06", name:"Premium 06" },
    { id:"ext_07", name:"Premium 07" },
    { id:"ext_08", name:"Premium 08" },
    { id:"ext_09", name:"Premium 09" },
    { id:"ext_10", name:"Premium 10" },
    { id:"ext_11", name:"Premium 11" },
    { id:"ext_12", name:"Premium 12" },
    { id:"ext_13", name:"Premium 13" },
    { id:"ext_14", name:"Premium 14" },
    { id:"ext_15", name:"Premium 15" },
    { id:"ext_16", name:"Premium 16" },
    { id:"ext_17", name:"Premium 17" },
    { id:"ext_18", name:"Premium 18" },
    { id:"ext_19", name:"Premium 19" },
    { id:"ext_20", name:"Premium 20" },
    { id:"ext_21", name:"Premium 21" },
    { id:"ext_22", name:"Premium 22" },
    { id:"ext_23", name:"Premium 23" },
    { id:"ext_24", name:"Premium 24" },
    { id:"ext_25", name:"Premium 25" },
    { id:"ext_26", name:"Premium 26" },
    { id:"ext_27", name:"Premium 27" },
    { id:"ext_28", name:"Premium 28" },
    { id:"ext_29", name:"Premium 29" },
    { id:"ext_30", name:"Premium 30" },
    { id:"ext_31", name:"Premium 31" },
    { id:"ext_32", name:"Premium 32" },
    { id:"ext_33", name:"Premium 33" },
    { id:"ext_34", name:"Premium 34" },
    { id:"ext_35", name:"Premium 35" },
    { id:"ext_36", name:"Premium 36" },
    { id:"ext_37", name:"Premium 37" },
    { id:"ext_38", name:"Premium 38" },
    { id:"ext_39", name:"Premium 39" },
    { id:"ext_40", name:"Premium 40" },
    { id:"ext_41", name:"Premium 41" },
    { id:"ext_42", name:"Premium 42" },
    { id:"ext_43", name:"Premium 43" },
    { id:"ext_44", name:"Premium 44" },
    { id:"ext_45", name:"Premium 45" },
    { id:"ext_46", name:"Premium 46" },
    { id:"ext_47", name:"Premium 47" },
    { id:"ext_48", name:"Premium 48" },
    { id:"ext_49", name:"Premium 49" },
    { id:"ext_50", name:"Premium 50" },
    { id:"ext_51", name:"Premium 51" },
    { id:"ext_52", name:"Premium 52" },
    { id:"ext_53", name:"Premium 53" },
    { id:"ext_54", name:"Premium 54" },
    { id:"ext_55", name:"Premium 55" },
    { id:"ext_56", name:"Premium 56" },
    { id:"ext_57", name:"Premium 57" },
    { id:"ext_58", name:"Premium 58" },
    { id:"ext_59", name:"Premium 59" },
    { id:"ext_60", name:"Premium 60" },
    { id:"ext_61", name:"Premium 61" },
    { id:"ext_62", name:"Premium 62" },
    { id:"ext_63", name:"Premium 63" },
    { id:"ext_64", name:"Premium 64" },
    { id:"ext_65", name:"Premium 65" },
    { id:"ext_66", name:"Premium 66" },
    { id:"ext_67", name:"Premium 67" },
    { id:"ext_68", name:"Premium 68" },
    { id:"ext_69", name:"Premium 69" },
    { id:"ext_70", name:"Premium 70" },
    { id:"ext_71", name:"Premium 71" },
    { id:"ext_72", name:"Premium 72" },
    { id:"ext_73", name:"Premium 73" },
    { id:"ext_74", name:"Premium 74" },
    { id:"ext_75", name:"Premium 75" },
    { id:"ext_76", name:"Premium 76" },
    { id:"ext_77", name:"Premium 77" },
    { id:"ext_78", name:"Premium 78" },
    { id:"ext_79", name:"Premium 79" },
    { id:"ext_80", name:"Premium 80" },
    { id:"ext_81", name:"Premium 81" },
    { id:"ext_82", name:"Premium 82" },
    { id:"ext_83", name:"Premium 83" },
    { id:"ext_84", name:"Premium 84" },
    { id:"ext_85", name:"Premium 85" },
    { id:"ext_86", name:"Premium 86" },
    { id:"ext_87", name:"Premium 87" },
    { id:"ext_88", name:"Premium 88" },
    { id:"ext_89", name:"Premium 89" },
    { id:"ext_90", name:"Premium 90" },
    { id:"ext_91", name:"Premium 91" },
    { id:"ext_92", name:"Premium 92" },
    { id:"ext_93", name:"Premium 93" },
    { id:"ext_94", name:"Premium 94" },
    { id:"ext_95", name:"Premium 95" },
    { id:"ext_96", name:"Premium 96" },
    { id:"ext_97", name:"Premium 97" },
    { id:"ext_98", name:"Premium 98" },
    { id:"ext_99", name:"Premium 99" },
    { id:"ext_100", name:"Premium 100" },
  ];



  const STYLES = [
    ["classic","Classic (default)"],
    ["degen","Degen CT"],
    ["builder","Builder / Ship"],
    ["alpha","Alpha / Hype"],
    ["calm","Calm / Clean"],
    ["meme","Meme / Fun"],
    ["classy","Classy"],
    ["minimal","Minimal"],
    ["noemoji","No emoji"],
    ["emoji","Emoji heavy"],
    ["focus","Focused"],
    ["cheer","Cheerful"],
  ];


  const PACKS = [
    { id:"classic", name:"Classic (default)", pro:false, style:"classic", mode:null, anti:1, clean:false },
    { id:"king",    name:"King",             pro:false, style:"alpha",   mode:"max", anti:2, clean:true  },
    { id:"degen",   name:"Degen",            pro:true,  style:"degen",   mode:"mid", anti:3, clean:true  },
    { id:"minimal", name:"Minimal",          pro:true,  style:"minimal", mode:"min", anti:3, clean:true  },
    { id:"builder", name:"Builder",          pro:true,  style:"builder", mode:"mid", anti:3, clean:true  },
    { id:"kind",    name:"Kind",             pro:true,  style:"calm",    mode:"mid", anti:4, clean:true  },
    { id:"aggro",   name:"Aggro",            pro:true,  style:"alpha",   mode:"max", anti:2, clean:true  },
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

function extCustomBgKeyForTab(tab){
  return (tab === "all") ? LS_EXT_CUSTOM_BG_GLOBAL : (LS_EXT_CUSTOM_BG_TAB_PREFIX + tab);
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

        const dataUrl = await compressImageToJpegDataURL(file);
        localStorage.setItem(extCustomBgKeyForTab(tab), dataUrl);
        extSyncNow();

        renderExtCustomBgUI();
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

function setExtView(view){
  localStorage.setItem(LS_EXT_VIEW, view);
  const btnTheme = $("extTabTheme");
  const btnWall = $("extTabWall");
  const btnCustom = $("extTabCustom");
  const paneTheme = $("extThemePane");
  const paneWall = $("extWallPane");
  const paneCustom = $("extCustomPane");
  if (!btnTheme || !btnWall || !btnCustom || !paneTheme || !paneWall || !paneCustom) return;

  btnTheme.classList.toggle("active", view==="theme");
  btnWall.classList.toggle("active", view==="wall");
  btnCustom.classList.toggle("active", view==="custom");

  btnTheme.setAttribute("aria-selected", view==="theme" ? "true" : "false");
  btnWall.setAttribute("aria-selected", view==="wall" ? "true" : "false");
  btnCustom.setAttribute("aria-selected", view==="custom" ? "true" : "false");

  paneTheme.classList.toggle("hidden", view!=="theme");
  paneWall.classList.toggle("hidden", view!=="wall");
  paneCustom.classList.toggle("hidden", view!=="custom");

  if (view==="theme") renderExtThemes();
  if (view==="wall") renderExtWallpapers();
  if (view==="custom") renderExtCustomBgUI();
}


  

  function extSyncNow(){
    try{ window.postMessage({ type: "GMX_SYNC_NOW" }, "*"); }catch(_e){}
  }

  function unlockedExtThemesCount(){ return unlockedCountByRefs(EXT_THEMES.length, FREE_VISIBLE_EXT_THEMES); }

  function applyExtTheme(id){
    const unlocked = unlockedExtThemesCount();
    const idx = EXT_THEMES.findIndex(x=>x.id===id);
    if (!isPro() && (idx<0 || idx >= unlocked)) return;
    localStorage.setItem("gmx_ext_theme", id);
    extSyncNow();
    setExtView(localStorage.getItem(LS_EXT_VIEW)||"theme");
    const st = $("extThemeStatus");
    if (st) st.innerHTML = '<span class="ok">Selected.</span>';
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
        toast("warn", (t("locked_unlock_at") || "Locked. Unlock at {n} referrals (then +1 every 5) or Pro.").replace("{n}", String(need)));
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
        toast("warn", (t("locked_unlock_at") || "Locked. Unlock at {n} referrals (then +1 every 5) or Pro.").replace("{n}", String(need)));
        return;
      }
      applyExtTheme(th.id);
      renderExtThemes();
    });

    return card;
  }, { key: "extThemeGrid", chunk: 24 });

  const chosenName = EXT_THEMES.find(x=>x.id===chosen)?.name || chosen;
  st.innerHTML = `<span class="ok">Selected.</span> ${escapeHtml(chosenName)}.`;
}

function renderExtWallpapers(){
  const grid = $("extWpGrid");
  const st = $("extWpStatus");
  if (!grid || !st) return;

  const total = EXT_WALLPAPERS.length;
  const unlocked = unlockedCountByRefs(total, FREE_VISIBLE_EXT_WALLPAPERS);
  const chosen = localStorage.getItem(LS_EXT_WP) || "";
  const wEl = $("extWpUnlocked");
  if (wEl) wEl.textContent = `${Math.min(unlocked,total)}/${total}`;

  const items = EXT_WALLPAPERS.map((wp, idx)=>({ wp, idx }));
  chunkedRender(grid, items, ({ wp, idx })=>{
    const isUnlocked = isPro() || (idx < unlocked);
    const card = document.createElement("button");
    card.type = "button";
    card.className = "wpCard" + (wp.id === chosen ? " active" : "") + (!isUnlocked ? " mystery" : "");

    const thumb = document.createElement("div");
    thumb.className = "wpThumb";
    thumb.setAttribute("data-bg", `/assets/extbg/${wp.id}.svg`);
    observeLazyBg(thumb);

    const name = document.createElement("div");
    name.className = "wpName";
    name.textContent = wp.name || wp.id;

    const meta = document.createElement("div");
    meta.className = "wpMeta";
    meta.textContent = wp.tier || "";

    const tag = document.createElement("div");
    tag.className = "wpTag";
    tag.textContent = unlockTagText(idx, isUnlocked, FREE_VISIBLE_EXT_WALLPAPERS);

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
        toast("warn", (t("locked_unlock_at") || "Locked. Unlock at {n} referrals (then +1 every 5) or Pro.").replace("{n}", String(need)));
        return;
      }
      applyExtWallpaper(wp.id);
      renderExtWallpapers();
    });

    return card;
  }, { key: "extWpGrid", chunk: 18 });

  if (!chosen){
    st.innerHTML = `<span class="muted">None.</span> ${escapeHtml(t("ext_wp_none") || "Pick a wallpaper (optional).")}`;
  }else{
    const chosenName = EXT_WALLPAPERS.find(x=>x.id===chosen)?.name || chosen;
    st.innerHTML = `<span class="ok">Selected.</span> ${escapeHtml(chosenName)}.`;
  }
}

function bindExtTabs(){
  if (bindExtTabs._done) return;
  bindExtTabs._done = true;

  const themeBtn  = $("extTabTheme");
  const wallBtn   = $("extTabWall");
  const customBtn = $("extTabCustom");

  if (themeBtn)  themeBtn.addEventListener("click", ()=>setExtView("theme"));
  if (wallBtn)   wallBtn.addEventListener("click",  ()=>setExtView("wall"));
  if (customBtn) customBtn.addEventListener("click", ()=>setExtView("custom"));
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
      ? ["gmRand1","gmRand10","gmRand70","gmBestBtn","gmNewAdd","gmPasteAdd","gmCleanup","gmClear","gmClearAll","gmCopyAll","gmExport","gmViewGlobal","gmViewLang","gmFilter","gmFilterClear"]
      : ["gnRand1","gnRand10","gnRand70","gnBestBtn","gnNewAdd","gnPasteAdd","gnCleanup","gnClear","gnClearAll","gnCopyAll","gnExport","gnViewGlobal","gnViewLang","gnFilter","gnFilterClear"];

    for (const id of ids){
      const el = $(id);
      if (!el) continue;
      if (el.tagName === "INPUT") el.disabled = !!on;
      else el.disabled = !!on;
    }

    const msgEl = kind==="gm" ? $("gmMsg") : $("gnMsg");
    if (msgEl){
      if (on){
        msgEl.innerHTML = `<span class="spinner"></span> <span class="muted">${escapeHtml(label||"Working…")}</span>`;
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

    function showTab(name){
    CURRENT_TAB = name;
    document.querySelectorAll(".tab").forEach(b=>b.classList.toggle("active", b.dataset.tab===name));
    ["home","gm","gn","referrals","leaderboard","themes","extthemes","wallet","admin"].forEach(k=>{
      const el = document.getElementById("tab-"+k);
      if (el) el.classList.toggle("hidden", k!==name);
    });
    setBg(name);
  
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
    if (name === "extthemes"){
      try{ setExtView(localStorage.getItem(LS_EXT_VIEW)||"theme"); }catch(e){}
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
    if (name === "_force_home"){ showTab("home"); return; }
    // Browsing is always allowed. Actions are gated via requireConnected().
    showTab(name);
    try{ trackEvent("tab_open", { tab: String(name||"") }); }catch(_e){}
  }
  try{ globalThis.__gmxShowTab = tab; }catch(_e){}
  document.querySelectorAll(".tab").forEach(b=>b.addEventListener("click", ()=>tab(b.dataset.tab)));

  function normalizeHandle(input){
    let t = String(input||"").trim();
    if (!t) return "";
    t = t.replace(/^https?:\/\/(www\.)?x\.com\//i, "");
    t = t.replace(/^https?:\/\/(www\.)?twitter\.com\//i, "");
    t = t.replace(/^@+/, "");
    t = t.replace(/[^a-zA-Z0-9_]/g, "");
    t = t.slice(0, 15);
    return t ? "@" + t : "";
  }

  function getHandle(){ return localStorage.getItem(LS_HANDLE) || ""; }

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
        ? `You hit the free daily limit for ${kind.toUpperCase()}. Upgrade to Pro for unlimited inserts + all cosmetics`
        : `Daily cap reached for ${kind.toUpperCase()}. Pro removes limits and unlocks everything`;
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
      try{ switchTab("wallet"); }catch{}
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

  function getToken(){ return localStorage.getItem(LS_TOKEN) || ""; }

  function isConnected(){
    // "Always online" = handle is bound. Token may refresh silently.
    return !!getHandle();
  }
  function requireConnected(target){
    if (isConnected()) return true;
    const cm = $("connectMsg");
    const warnHtml = t("connect_warn_html") || '<span class="warn">Connect your @handle to continue.</span>';
    if (cm) cm.innerHTML = warnHtml;

    const tpl = t("connect_toast_html") || 'Connect your @handle first to use <b>{feature}</b>.';
    const feat = escapeHtml(target || (t("this_feature") || "this feature"));
    toast("warn", tpl.replace("{feature}", feat));

    const hi = $("xHandle");
    if (hi){
      hi.focus();
      try{ hi.scrollIntoView({ block:"center", behavior:"smooth" }); }catch{}
    }
    return false;
  }

  
  function isPublicApi(path){
    return (
      path.startsWith("/api/health") ||
      path.startsWith("/api/version") ||
      path.startsWith("/api/user/init") ||
      path.startsWith("/api/billing/plans") ||
      path.startsWith("/api/billing/proof") ||
      path.startsWith("/api/config") ||
      path.startsWith("/api/event") ||
      path.startsWith("/api/public/")
    );
  }

  async function initSession(force=false){
    const handle = getHandle();
    if (!handle) return null;
    if (!force && getToken()) {
    AUTH_OK = true;
    try{ applyAdminVisibility(); }catch{}
    return getToken();
  }
    try{
      const params = new URLSearchParams(location.search);
      const ref = params.get("ref") || "";
      const r = await fetch(API + "/api/user/init", {
        method: "POST",
        headers: { "Content-Type":"application/json" },
        body: JSON.stringify({ handle, ref })
      });
      const j = await r.json().catch(()=>({}));
      if (!r.ok || !j.token) throw new Error(j.error_code || j.error || "init_failed");
      try{ localStorage.setItem(LS_HANDLE, j.handle || handle); }catch{}
      try{ localStorage.setItem(LS_TOKEN, j.token); }catch{}
      try{ $("handlePill").textContent = j.handle || handle; }catch{}
      try{ localStorage.setItem(LS_IS_ADMIN, j.isAdmin ? "1" : "0"); }catch{}
      try{ localStorage.setItem(LS_ADMIN_CLAIMABLE, j.adminClaimable ? "1" : "0"); }catch{}
      AUTH_OK = true;
      try{ applyAdminVisibility(); }catch{}
      return j.token;
    }catch(e){
      AUTH_OK = false;
      try{ applyAdminVisibility(); }catch{}
      return null;
    }
  }

  async function api(path, method="GET", body, opts={}){
    // STRICT MODE: never call protected endpoints until @handle is connected.
    if (!getHandle() && path.startsWith("/api/") && !isPublicApi(path)){
      throw new Error("not_connected");
    }

    const timeoutMs = Number(opts.timeoutMs || 20000);

    let lastErr = null;

    for (let attempt = 0; attempt < 2; attempt++){
      const headers = { "Content-Type":"application/json" };
      const tok = getToken();
      if (tok) headers["Authorization"] = "Bearer " + tok;
      // Allow caller-specified extra headers
      if (opts.headers && typeof opts.headers === "object"){
        try{
          for (const k of Object.keys(opts.headers)){
            const v = opts.headers[k];
            if (v != null) headers[k] = String(v);
          }
        }catch(_e){}
      }

      // Admin API: pass session token via header
      if (path.startsWith("/api/admin/")){
        const at = getAdminToken();
        if (at) headers["X-Admin-Token"] = at;
      }

      const controller = new AbortController();
      const timer = setTimeout(()=>controller.abort("timeout"), timeoutMs);

      // Allow caller to pass an external signal (for cancel on tab change/clear)
      if (opts.signal){
        try{
          if (opts.signal.aborted) controller.abort("aborted");
          else opts.signal.addEventListener("abort", ()=>controller.abort("aborted"), { once:true });
        }catch{}
      }

      try{
        const r = await fetch(API + path, {
          method,
          headers,
          body: body ? JSON.stringify(body) : null,
          signal: controller.signal
        });

        const ct = (r.headers.get("content-type")||"").toLowerCase();

        if (ct.includes("application/json")){
          const j = await r.json().catch(()=>({}));
          if (!r.ok){
            const is401 = (r.status === 401 || j.error === "unauthorized");
            // One silent refresh + retry (only when handle exists and endpoint is not init)
            if (is401 && attempt === 0 && tok && getHandle() && !path.startsWith("/api/user/init") && !path.startsWith("/api/admin/")){
              try{ localStorage.removeItem(LS_TOKEN); }catch{}
              AUTH_OK = false;
              try{ applyAdminVisibility(); }catch{}
              await initSession(true);
              continue;
            }
            if (is401 && tok && !path.startsWith("/api/admin/")){
              try{ localStorage.removeItem(LS_TOKEN); }catch{}
              AUTH_OK = false;
              try{ applyAdminVisibility(); }catch{}
            }
            throw new Error(j.error || "request_failed");
          }
          try{ setDegraded(false); }catch{}
          return j;
        } else {
          const rawText = await r.text().catch(()=> "");
          if (!r.ok) throw new Error(rawText || ("http_"+r.status));
          try{ setDegraded(false); }catch{}
          return { ok:true, text: rawText };
        }
      } catch (e){
        if (String(e?.name||"") === "AbortError" || String(e) === "timeout" || String(e) === "aborted"){
          lastErr = new Error("timeout");
        } else {
          lastErr = e;
        }

        // Network-style failures -> enter degraded mode (UI stays usable).
        try{
          const msg = String(lastErr?.message || lastErr || "");
          const net = (msg === "timeout") || msg.includes("Failed to fetch") || msg.includes("NetworkError") || msg.includes("fetch") || msg.includes("ECONN");
          if (net) setDegraded(true, msg === "timeout" ? "API timeout. You can still edit lists locally." : "API is unreachable. You can still edit lists locally.");
        }catch{}
      } finally {
        clearTimeout(timer);
      }

      if (lastErr && lastErr.message === "timeout") throw lastErr;
    }

    throw lastErr || new Error("request_failed");
  }

  async function ping(){
    try{
      const j = await api("/api/health");
      const d = $("apiDot");
      // UX: If user is not connected, don't show "online" (confusing).
      const hasHandle = !!getHandle();
      const pill = $("apiPill");
      if (pill) pill.classList.toggle("hidden", !hasHandle);
      if (d) d.classList.toggle("ok", !!(j.ok && hasHandle));
      const t = $("apiText");
      if (t) t.textContent = hasHandle ? (j.ok ? "online" : "offline") : "—";
    }catch{
      const pill = $("apiPill");
      if (pill) pill.classList.toggle("hidden", !getHandle());
      const d = $("apiDot");
      if (d) d.classList.remove("ok");
      const t = $("apiText");
      if (t) t.textContent = getHandle() ? "offline" : "—";
    }
  }

  // Expose a retry hook for the degraded bar (wired earlier).
  window.__gmxRetryNow = async ()=>{
    try{ await ping(); }catch{}
    // If user already set a handle, try to refresh token silently.
    try{ if (getHandle()) await initSession(true); }catch{}
    // Refresh public panels when possible.
    try{ if (CURRENT_TAB === "wallet"){ await loadPlans(); await loadBillingProof(); } }catch{}
    try{ if (CURRENT_TAB === "referrals"){ await refreshRefStats(); } }catch{}
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
          toast("ok", "Update installed. Reloading…");
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
    if (v) v.textContent = (cap === Infinity) ? `${used}/∞` : `${used}/${cap}`;
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
  if (savedEl) savedEl.textContent = isPro() ? `GM ${gmSaved}/∞ • GN ${gnSaved}/∞` : `GM ${gmSaved}/${SAVE_CAP_FREE} • GN ${gnSaved}/${SAVE_CAP_FREE}`;

  const dailyEl = $("help_daily");
  if (dailyEl) dailyEl.textContent = (isPro() || gmLimit===Infinity || gnLimit===Infinity)
    ? `GM ${gmUsed}/∞ • GN ${gnUsed}/∞`
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
        ? `GM ${gm.used}/∞ • GN ${gn.used}/∞`
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

      syncCustomBgUI();
      applyUserBg();
      initWallpapers();

      // themes + view
      renderThemes();
      setExtView(localStorage.getItem(LS_EXT_VIEW)||"theme");

      // also refresh referral count for unlocks
      try{ await refreshRefStats(); }catch(e){}

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


  // ----- Lists (Global + per-language, total cap per kind, no overwrite) -----
  function linesFromText(t){
    return String(t||"").split(/\r?\n/).map(x=>x.trim()).filter(x=>x && x!==EMPTY);
  }

  function getLangIndexKey(kind){ return kind==="gm" ? GM_LANGS : GN_LANGS; }
  function getGlobalKey(kind){ return kind==="gm" ? GM_GLOBAL : GN_GLOBAL; }
  function getLangKey(kind, lang){ return `gmx_${kind}_lang_${lang}`; }

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


// ----- Best (pick a strong line and copy it) -----
function scoreLineForBest(kind, s){
  const t = String(s||"").trim();
  if (!t) return -1e9;

  let score = 0;

  // Prefer 2 sentences, but accept 1–3
  const sentences = t.split(/[.!?]+/).map(x=>x.trim()).filter(Boolean).length;
  if (sentences === 2) score += 4;
  else if (sentences === 1 || sentences === 3) score += 1;
  else score -= 3;

  // Prefer medium length
  const len = t.length;
  if (len < 4) score -= 10;
  else if (len < 8) score -= 6;
  else if (len <= 120) score += 2;
  else score -= 4;

  // Avoid ending punctuation (our style usually avoids final period)
  if (/[\.!?]$/.test(t)) score -= 2;

  // Dashes look bot-like in this app
  if (/[—–-]/.test(t)) score -= 3;

  // Emojis penalized heavily (reply style bans them)
  try{ if (/[\u{1F300}-\u{1FAFF}]/u.test(t)) score -= 6; }catch{}

  const low = t.toLowerCase();

  // Prefer correct greeting
  if (kind === "gm"){
    if (low.startsWith("gm")) score += 4;
    if (low.startsWith("good morning")) score += 3;
  } else {
    if (low.startsWith("gn")) score += 4;
    if (low.startsWith("good night")) score += 3;
  }

  // Penalize ultra-generic
  if (low === "gm" || low === "gn" || low === "good morning" || low === "good night") score -= 3;

  // Penalize "marketing / analysis" style
  if (/(platform|campaign|liquidity|interoperability|tokenomics|roadmap|investors)/i.test(t)) score -= 2;

  // Prefer CT vibe a bit
  if (/(ct|fam|gang|degen|builders|build|grind)/i.test(t)) score += 2;

  // Avoid banned starting words from the strict reply prompt
  if (/^(that|this|when|what|why|you|yeah|love|feels|there\'s)\b/i.test(t)) score -= 5;

  return score;
}

function pickBestLine(kind, lines){
  const arr = (lines||[]).map(x=>String(x||"").trim()).filter(Boolean);
  if (!arr.length) return "";

  const scored = arr.map(v=>({ v, sc: scoreLineForBest(kind, v) }))
    .filter(x => Number.isFinite(x.sc) && x.sc > -1e8);

  if (!scored.length){
    return arr[Math.floor(Math.random()*arr.length)];
  }

  scored.sort((a,b)=>b.sc - a.sc);
  const topScore = scored[0].sc;

  // Pick from a near-top pool so it doesn't always return the same line
  const pool = scored
    .filter(x => x.sc >= topScore - 2.5)
    .slice(0, 12)
    .map(x=>x.v);

  const lastKey = (kind === "gm") ? "gmx_last_best_gm" : "gmx_last_best_gn";
  const last = (localStorage.getItem(lastKey) || "").trim();
  const poolNoRepeat = pool.filter(x => x.trim() !== last);

  const pickFrom = poolNoRepeat.length ? poolNoRepeat : pool;
  const pick = pickFrom[Math.floor(Math.random()*pickFrom.length)];
  try{ localStorage.setItem(lastKey, pick); }catch{}
  return pick;
}

async function doBest(kind){
  // Consider BOTH Global + current language list.
  const lang = currentLang(kind);
  const globalLines = readKey(getGlobalKey(kind));
  const langLines = readKey(getLangKey(kind, lang));
  const lines = dedupeLines(globalLines.concat(langLines));
  if (!lines || !lines.length){
    toast("warn", t("toast_nothing_to_copy") || "Nothing to copy", 2500);
    return;
  }
  const best = pickBestLine(kind, lines);
  if (!best){
    toast("warn", t("toast_nothing_to_copy") || "Nothing to copy", 2500);
    return;
  }

  // Copy
  try{ await navigator.clipboard.writeText(best); }catch(_e){}
  toast("ok", `Best copied<br><span class="muted">${escapeHtml(best)}</span>`, 6000);

  // Make the best line actually *selected* in the visible list:
  // - If it came from Global but we're viewing Language list, switch to Global (and vice versa).
  try{
    const bestTrim = String(best).trim();
    const inLang = langLines.some(x=>String(x).trim() === bestTrim);
    const inGlobal = globalLines.some(x=>String(x).trim() === bestTrim);
    const view = (kind === "gm" ? gmView : gnView);

    if (inGlobal && view !== "global") setView(kind, "global");
    if (inLang && view !== "lang") setView(kind, "lang");

    // Wait for DOM re-render
    await new Promise(r=>requestAnimationFrame(r));

    const container = kind==="gm" ? $("gmList") : $("gnList");
    if (container){
      // clear previous selection
      container.querySelectorAll(".lineRow.selected").forEach(r=>r.classList.remove("selected"));

      const rows = Array.from(container.querySelectorAll(".lineRow"));
      const row = rows.find(r => (r.querySelector("input")?.value||"").trim() === bestTrim);
      if (row){
        row.classList.add("selected");
        row.classList.add("bestFlash");
        try{ row.scrollIntoView({ behavior:"smooth", block:"center" }); }catch(_e){}
        try{
          const inp = row.querySelector("input");
          if (inp){ inp.focus(); inp.select(); }
        }catch(_e){}
        setTimeout(()=>row.classList.remove("bestFlash"), 1600);
      }
    }
  }catch(_e){}
}

  function allKeysForKind(kind){
    const keys = [getGlobalKey(kind)];
    for (const lang of getLangIndex(kind)){
      keys.push(getLangKey(kind, lang));
    }
    return keys;
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
  const cur = readKey(key);
  if (!cur || !cur.length) return false;
  const idx = Math.floor(Math.random() * cur.length);
  cur[idx] = newLine;
  writeKey(key, cur);
  return true;
}



  function countsByScope(kind){
    const g = readKey(getGlobalKey(kind)).length;
    let langsTotal = 0;
    for (const lang of getLangIndex(kind)){
      langsTotal += readKey(getLangKey(kind, lang)).length;
    }
    return { global: g, langs: langsTotal, total: g + langsTotal };
  }

  function updateSavedUI(kind){
    const totalEl = kind==='gm' ? $('gmTotal') : $('gnTotal');
    const capEl = kind==='gm' ? $('gmCap') : $('gnCap');
    if (totalEl) totalEl.textContent = totalSaved(kind);
    if (capEl) capEl.textContent = isPro() ? '∞' : String(SAVE_CAP_FREE);
    const br = countsByScope(kind);
    const brEl = kind==='gm' ? $('gmSavedBreakdown') : $('gnSavedBreakdown');
    if (brEl){
      brEl.textContent = 'Global: ' + br.global + ' • Language lists: ' + br.langs;
    }

    // meters (GM/GN side panels) + help modal
    try{
      const used = totalSaved(kind);
      LAST_SAVED[kind] = used;
      const cap = SAVE_CAP_FREE;
      const valId = (kind==="gm") ? "gmSavedVal" : "gnSavedVal";
      const fillId = (kind==="gm") ? "gmSavedFill" : "gnSavedFill";
      const v = $(valId);
      const f = $(fillId);
      if (v) v.textContent = isPro() ? `${used}/∞` : `${used}/${cap}`;
      if (f) f.style.width = isPro() ? "100%" : (Math.min(100, Math.round((used/cap)*100)) + "%");

      if (!$("help_modal")?.classList.contains("hidden")) renderHelpModal();
    }catch(e){}
  }

  function pruneEmptyLang(kind, lang){
    if (!lang) return;
    const lk = getLangKey(kind, lang);
    if (readKey(lk).length) return;
    const idx = getLangIndex(kind).filter(x=>x!==lang);
    setLangIndex(kind, idx);
  }


  function trimKindToCap(kind){
    let removed = 0;
    // deterministic trim: global last, then first language keys
    while (totalSaved(kind) > saveCap()){
      const gk = getGlobalKey(kind);
      const g = readKey(gk);
      if (g.length){
        g.pop();
        writeKey(gk, g);
        removed++;
        continue;
      }
      const idx = getLangIndex(kind);
      let did = false;
      for (const lang of idx){
        const lk = getLangKey(kind, lang);
        const l = readKey(lk);
        if (l.length){
          l.pop();
          writeKey(lk, l);
          removed++;
          did = true;
          break;
        }
      }
      if (!did) break;
    }
    return removed;
  }

  let gmView = "lang";
  let gnView = "lang";

  function currentLang(kind){
    return kind==="gm" ? $("gmLang").value : $("gnLang").value;
  }
  function activeKey(kind){
    const view = kind==="gm" ? gmView : gnView;
    if (view === "global") return getGlobalKey(kind);
    const lang = currentLang(kind);
    return getLangKey(kind, lang);
  }

  function ensureIndexed(kind, lang){
    const idx = getLangIndex(kind);
    if (!idx.includes(lang)){
      idx.push(lang);
      setLangIndex(kind, idx);
    }
    renderLangChips(kind);
  }

  function escapeHtml(s){
    return String(s||"")
      .replaceAll("&","&amp;")
      .replaceAll("<","&lt;")
      .replaceAll(">","&gt;")
      .replaceAll('"',"&quot;")
      .replaceAll("'","&#039;");
  }

  function renderList(kind){
    const container = kind==="gm" ? $("gmList") : $("gnList");
    const countEl = kind==="gm" ? $("gmCount") : $("gnCount");
    const msgEl = kind==="gm" ? $("gmMsg") : $("gnMsg");
    if (!container || !countEl) return;

    const key = activeKey(kind);
    const lines = readKey(key);

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
      const br = countsByScope(kind);
      if (msgEl){
        if (br.total > 0){
          msgEl.innerHTML = `<span class="muted">This view is empty. You still have <b>${br.total}</b> saved across other lists (Global ${br.global} / Language lists ${br.langs}).</span>`;
        } else {
          msgEl.textContent = "List is empty.";
        }
      }
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

    items.forEach((item, pos)=>{
      const i = item.idx;
      const val = item.val;

      const row = document.createElement("div");
      row.className = "lineRow";
      row.innerHTML = `
        <div class="idx">${pos+1}</div>
        <input class="lineInput" name="line" aria-label="Saved reply ${pos+1}" value="${escapeHtml(val)}" />
        <button class="delBtn" title="Remove" type="button">×</button>
      `;
      const input = row.querySelector("input");
      const del = row.querySelector("button");

      input.addEventListener("input", ()=>{
        const cur = readKey(key);
        const v = input.value.trim();
        if (!v){
          cur.splice(i, 1);
          writeKey(key, cur);
          renderList(kind);
          return;
        }
        cur[i] = v;
        writeKey(key, cur);
        countEl.textContent = cur.length;
      });

      del.addEventListener("click", ()=>{
        const cur = readKey(key);
        cur.splice(i, 1);
        writeKey(key, cur);
        renderList(kind);
      });

      container.appendChild(row);
    });
  }

  function setView(kind, scope){
    if (kind==="gm"){
      gmView = scope;
      const a = $("gmViewGlobal"); if (a) a.classList.toggle("active", scope==="global");
      const b = $("gmViewLang");   if (b) b.classList.toggle("active", scope==="lang");
    } else {
      gnView = scope;
      const a = $("gnViewGlobal"); if (a) a.classList.toggle("active", scope==="global");
      const b = $("gnViewLang");   if (b) b.classList.toggle("active", scope==="lang");
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
    if (cur.length && !confirm("Clear this list? This cannot be undone.")) return;
    writeKey(key, []);
    const view = (kind==="gm" ? gmView : gnView);
    if (view === "lang"){
      pruneEmptyLang(kind, currentLang(kind));
      renderLangChips(kind);
    }
    renderList(kind);
    const msgEl = kind==="gm" ? $("gmMsg") : $("gnMsg");
    if (msgEl) msgEl.innerHTML = `<span class="ok">Cleared.</span>`;
  }

  function clearAll(kind){
    if (!requireConnected(kind==="gm"?"GM":"GN")) return;
    try{ if (ABORT[kind]) ABORT[kind].abort(); }catch{}
    const br = countsByScope(kind);
    if (br.total && !confirm("Clear ALL saved lines (Global + all language lists)? This cannot be undone.")) return;
    for (const k of allKeysForKind(kind)) writeKey(k, []);
    setLangIndex(kind, []);
    if (kind==="gm"){
      gmView = "lang";
      const a = $("gmViewGlobal"); if (a) a.classList.remove("active");
      const b = $("gmViewLang");   if (b) b.classList.add("active");
    } else {
      gnView = "lang";
      const a = $("gnViewGlobal"); if (a) a.classList.remove("active");
      const b = $("gnViewLang");   if (b) b.classList.add("active");
    }
    updateLangFlags();
    renderLangChips(kind);
    renderList(kind);
    toast("ok", (t("toast_cleared_all_saved_lines")||"Cleared all saved lines."));
  }

  function formatAllExport(kind){
    const keys = allKeysForKind(kind);
    const out = [];
    for (const k of keys){
      const lines = readKey(k);
      if (!lines.length) continue;
      let header = "Global";
      const pref = `gmx_${kind}_lang_`;
      if (k.startsWith(pref)){
        header = "Lang: " + k.slice(pref.length);
      }
      out.push(`### ${header} (${lines.length})`);
      out.push(...lines);
      out.push("");
    }
    if (!out.length) return "";
    return out.join("\n").trim() + "\n";
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
    const antiN = antiWindow(strength);

    if ((kind==="gm" ? gmView : gnView) === "lang") ensureIndexed(kind, lang);

    // Pack influences the effective style for generation (without locking manual style).
    if (!packLocked && pack && pack.style) style = pack.style;

    const keyActive = activeKey(kind);
    const keyGlobal = getGlobalKey(kind);

    // Respect save cap (70) for Free. Editing remains unlimited.
    const remSlots = remainingSlots(kind);
    const effCount = (remSlots === Infinity) ? count : Math.max(0, Math.min(count, remSlots));
    
if (effCount <= 0){
  // At cap: allow variety by REPLACING an existing saved line (does not increase list size)
  try{
    const capCtrl = new AbortController();
    const j = await api(`/api/generate?kind=${kind}&mode=${encodeURIComponent(mode)}&lang=${encodeURIComponent(lang)}&style=${encodeURIComponent(style)}&anti_last_n=${encodeURIComponent(antiN)}`, "GET", null, { signal: capCtrl.signal, timeoutMs: 20000 });
    const r = String(j.reply || "").trim();
    if (r && replaceRandomSavedLine(kind, r)){
      renderList(kind);
      if (msgEl) msgEl.innerHTML = `<span class="ok">Replaced 1</span> <span class="muted small">(free cap ${saveCap()})</span>`;
      postEvent('limit_hit', { where:'save_cap', kind });
      return;
    }
  }catch{}
  if (msgEl) msgEl.innerHTML = `<span class="warn">Free save limit reached (${saveCap()}). You can still edit existing lines. Upgrade for more.</span>`;
  postEvent('limit_hit', { where:'save_cap', kind });
  return;
}
      if (INFLIGHT[kind]){
      if (msgEl) msgEl.innerHTML = '<span class="muted">Working…</span>';
      return;
    }
    INFLIGHT[kind] = true;
    setBusy(kind, true);
    try{ if (ABORT[kind]) ABORT[kind].abort(); }catch{}
    const ctrl = new AbortController();
    ABORT[kind] = ctrl;

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
        const rk = r.toLowerCase();
        const already = cur.some(s=>String(s||"").trim().toLowerCase()===rk);
        if (already){
          renderList(kind);
          if (msgEl) msgEl.innerHTML = `<span class="muted">Duplicate ignored.</span>`;
          return;
        }
        // respect free cap: when at cap, replace a random existing line (keeps list size at 70)
        if (remainingSlots(kind) <= 0){
          if (r && replaceRandomSavedLine(kind, r)){
            renderList(kind);
            if (msgEl) msgEl.innerHTML = `<span class="ok">Replaced 1</span> <span class="muted small">(free cap ${saveCap()})</span>`;
            postEvent('limit_hit', { where:'save_cap', kind });
            return;
          }
          if (msgEl) msgEl.innerHTML = `<span class="warn">Free save limit reached (${saveCap()} lines). You can still edit existing lines. Upgrade for more.</span>`;
          postEvent('limit_hit', { where:'save_cap', kind });
          renderList(kind);
          return;
        }
        cur.push(r);
        writeKey(keyActive, cur);

        pushRecent(kind, [repeatKey(reply, Math.max(1, strength))]);
        renderList(kind);
        msgEl.innerHTML = `<span class="ok">Added 1</span>`;
        logEvent("gen_one", { kind, lang, style, pack: packId, view: (kind==="gm"?gmView:gnView) });
        try{ await refreshUsage(); }catch{}
      } else {
        // Bulk generate with top-up to reach effCount (dedupe + anti-repeat)
        const view = (kind==="gm" ? gmView : gnView);
        const ban = buildBanSet(kind, keyActive, strength);
        const accepted = [];
        const takeLines = (arr)=>{
          for (const s of (arr || [])){
            const rk = repeatKey(s, strength);
            if (!rk) continue;
            if (ban.has(rk)) continue;
            ban.add(rk);
            accepted.push(s);
            if (accepted.length >= effCount) break;
          }
        };

        const buffer = Math.min(80, Math.max(15, Math.round(antiN * 0.7)));

        // Mode ladder to help fill big batches (e.g., Free 70) when min pool is small.
        const modePlan = [mode];
        if (mode === "min" && effCount > 30){
          modePlan.push("mid", "max");
        } else if (mode === "mid" && effCount > 50){
          modePlan.push("max");
        }

        for (const modeTry of modePlan){
          let attempts = 0;
          while (accepted.length < effCount && attempts < 2){
            attempts++;
            const missing = effCount - accepted.length;
            const reqCount = Math.min(200, missing + buffer);
            const bulk = await api(`/api/generate-bulk?kind=${kind}&mode=${encodeURIComponent(modeTry)}&lang=${encodeURIComponent(lang)}&style=${encodeURIComponent(style)}&anti_last_n=${encodeURIComponent(antiN)}&count=${reqCount}`, "GET", null, { signal: ctrl.signal, timeoutMs: 30000 });
            takeLines(bulk.list || []);
          }
        }

        // Last resort: relax server anti-repeat, keep local de-dupe / ban.
        if (accepted.length < effCount){
          const missing = effCount - accepted.length;
          const reqCount = Math.min(200, missing + 20);
          const lastMode = (mode === "min" ? "max" : mode);
          const bulk = await api(`/api/generate-bulk?kind=${kind}&mode=${encodeURIComponent(lastMode)}&lang=${encodeURIComponent(lang)}&style=${encodeURIComponent(style)}&anti_last_n=0&count=${reqCount}`, "GET", null, { signal: ctrl.signal, timeoutMs: 20000 });
          takeLines(bulk.list || []);
        }

        const incoming = accepted.slice(0, effCount);
        const shuffled = incoming.slice().sort(()=>Math.random()-0.5);


        const applyToKey = (k, list)=>{
          if (!list || !list.length) return;
          const cur = readKey(k);
          let merged = mergeAppendUnique(cur, list);
writeKey(k, merged);
        };
        applyToKey(keyActive, shuffled);
        pushRecent(kind, shuffled.map(x=>repeatKey(x, Math.max(1, strength))));
renderList(kind);
        const added = shuffled.length;
        if (added < effCount){
          const minNote = (mode === "min" && effCount > 30) ? "Min mode has a smaller unique pool (~30). We auto top-up with mid/max. " : "";
          msgEl.innerHTML = `<span class="warn">${minNote}Added ${added}/${effCount}. Anti-repeat filtered similar lines. Tip: switch <b>Global</b> / language / Mode, or lower Anti-repeat to fill your free cap.</span>`;
        } else {
          msgEl.innerHTML = `<span class="ok">Added ${added}</span>`;
        }
        logEvent("gen_bulk", { kind, lang, style, pack: packId, count: effCount, view: (kind==="gm"?gmView:gnView) });
        try{ await refreshUsage(); }catch{}
      }
    } catch(e){
      const m = (e && e.message) ? e.message : "failed";
      if (m === "timeout"){
        msgEl.innerHTML = `<span class="bad">Network timeout. Try again.</span>`;
      } else if (m === "unauthorized"){
        msgEl.innerHTML = `<span class="bad">Unauthorized. Re-connect your handle.</span>`;
      } else {
        msgEl.innerHTML = `<span class="bad">${escapeHtml(m)}</span>`;
      }
      logEvent("gen_error", { kind, err: m });
    } finally {
      INFLIGHT[kind] = false;
      try{ ABORT[kind] = null; }catch{}
      setBusy(kind, false);
    }
  }

  

async function refreshRefStats(){
  if (!getHandle()) return null;
  try{
    const j = await api("/api/referral/stats");
    const confirmed = Number(j.confirmedRefs ?? 0) || 0;
    const active = Number(j.activeRefs ?? 0) || 0;
    const eligible = Number(j.eligibleRefs ?? j.referrals ?? j.count ?? 0) || 0;
    const legacy = Number(j.legacyReferrals ?? 0) || 0;

    REF_COUNT = eligible;

    if ($("refCountPill")) $("refCountPill").textContent = String(eligible);
    if ($("refCountRight")) $("refCountRight").textContent = String(eligible);
    if ($("refCountInline")) $("refCountInline").textContent = String(eligible);

    if ($("refConfirmedInline")) $("refConfirmedInline").textContent = String(confirmed);
    if ($("refActiveInline")) $("refActiveInline").textContent = String(active);
    if ($("refEligibleInline")) $("refEligibleInline").textContent = String(eligible);

    const link = $("refLink");
    if (link) link.value = j.refLink || "";

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
      const freeDaily = Number(j.freeDaily||0) || 0;
      const dailyBonus = Number(j.dailyBonus||0) || 0;
      const per20 = Number(j.bonusPer20||10) || 10;
      const bonusChunks = Number(j.bonusChunks||0) || 0;
      const nextAt = Number(j.nextBonusAt||((bonusChunks+1)*20)) || ((bonusChunks+1)*20);
      const cap = Number(j.bonusCap ?? 0) || 0;
      const ownerActive = (j.ownerActive === true);

      const limNow = freeDaily + dailyBonus;
      const capNote = cap > 0 ? ` <span class="muted">(${t('ref_cap_note').replace('{cap}', String(cap))})</span>` : "";
      const activeGate = ownerActive ? "" : ` <span class="muted">(${t('ref_owner_inactive')})</span>`;
      promoNote.innerHTML = `
        <b>${t('ref_promo_title')}</b><br>
        <b>${t('ref_k_confirmed')}</b>: ${t('ref_def_confirmed')}<br>
        <b>${t('ref_k_active')}</b>: ${t('ref_def_active')}<br>
        <b>${t('ref_k_legacy')}</b>: ${t('ref_def_legacy')}<br>
        <b>${t('ref_k_eligible')}</b>: ${t('ref_def_eligible')}<br><br>
        <b>${t('ref_daily_limit_title')}</b>: <b>${limNow}</b> ${t('ref_per_day')}<br>
        <span class="muted">${t('ref_base_plus_bonus').replace('{base}', String(freeDaily)).replace('{bonus}', String(dailyBonus))}</span>${capNote}${activeGate}<br>
        ${t('ref_bonus_rule').replace('{per20}', String(per20)).replace('{chunks}', String(bonusChunks))}<br>
        <span class="muted">${t('ref_next_bonus').replace('{nextAt}', String(nextAt))}</span><br>
        <span class="muted">${t('ref_abuse_note')}</span>
      `;
    }

    const promoDetails = $("promoDetails");
    if (promoDetails){
      const bonusNow = Number(j.dailyBonus||0) || 0;
      promoDetails.open = (eligible >= 20) || (bonusNow > 0);
    }

    // re-render unlock-dependent UI
    try{ renderThemes(); }catch(e){}
    try{ renderExtThemes(); }catch(e){}
    try{ fillStyles(); }catch(e){}
    try{ fillPacks(); }catch(e){}
    return j;
  }catch(e){
    // swallow; caller may show UI
    return null;
  }
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
        you.innerHTML = `${escapeHtml(t('lb_you')||'You')}: <b>#${rank}</b> @${h} · ${escapeHtml(t('lb_eligible')||'Eligible')}: <b>${eligible}</b>`;
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
    body.innerHTML = `<tr><td colspan="4" class="muted">${t("r_loading") || "Loading…"}<\/td><\/tr>`;
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
    if (body) body.innerHTML = '<tr><td colspan="3" class="muted">Loading…</td></tr>';
    const j = await api("/api/leaderboard/referrals?days=" + encodeURIComponent(String(days)));
    if (!j || !j.ok) throw new Error("leaderboard_failed");
    const top = Array.isArray(j.top) ? j.top : [];
    if (!top.length){
      if (body) body.innerHTML = '<tr><td colspan="3" class="muted">No data yet</td></tr>';
    } else {
      if (body) body.innerHTML = top.map((r,i)=>`<tr><td>${i+1}</td><td>${escHtml(r.handle||"")}</td><td>${Number(r.eligible||0)}</td></tr>`).join("");
    }
    if (meEl){
      if (j.me && j.me.handle){
        meEl.textContent = `You: ${j.me.handle} — eligible ${Number(j.me.eligible||0)} (rules: ≥${j.rules?.minInserts||5} inserts + ≥${j.rules?.minActiveDays||3} active days in ${days}d)`;
      } else {
        meEl.textContent = "";
      }
    }
  }


  const refLoadBtn = $("refLoad");
  if (refLoadBtn) refLoadBtn.onclick = async ()=>{
    if (!requireConnected("Referrals")) return;
    try{
      const j = await refreshRefStats() || await api("/api/referral/stats");
      const link = $("refLink");
      if (link) link.value = j.refLink || "";
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
      if (msg) msg.innerHTML = '<span class="ok">Loaded.</span>';
      try{ fillStyles(); fillPacks(); }catch{}
      try{ await refreshUsage(); }catch{}
    }catch(e){
      const msg = $("refMsg");
      if (msg) msg.innerHTML = '<span class="bad">' + escapeHtml(e?.message||"failed") + '</span>';
    }
  };

  const refCopyBtn = $("refCopy");
  if (refCopyBtn) refCopyBtn.onclick = async ()=>{
    if (!requireConnected("Referrals")) return;
    const link = $("refLink");
    const v = (link?.value || "").trim();
    if (!v) return;
    await navigator.clipboard.writeText(v);
    const msg = $("refMsg");
    if (msg) msg.innerHTML = '<span class="ok">Copied.</span>';
  };

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

  function shortPk(pk){
    try{
      const s = String(pk?.toString?.() || pk || "");
      if (!s) return "";
      return s.slice(0,4) + "…" + s.slice(-4);
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
          if (msg) msg.textContent = "Opening wallet…";
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
      p.badge = (Number(p.days||0) >= 365) ? "Best value" : (Number(p.days||0) >= 180 ? "Popular" : "");
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

  async function ensureSplToken(){
    if (window.__splTokenMod) return window.__splTokenMod;
    try{
      const mod = await import("https://cdn.jsdelivr.net/npm/@solana/spl-token@0.4.9/+esm");
      window.__splTokenMod = mod;
      return mod;
    }catch(e){
      throw new Error("spl_token_unavailable");
    }
  }

  async function buildPaymentTx(intent){
    const web3 = window.solanaWeb3;
    if (!web3?.Transaction || !web3?.SystemProgram) throw new Error("web3_unavailable");
    if (!WALLET.publicKey) throw new Error("wallet_not_connected");

    const connection = new web3.Connection(getRpcUrl(), "confirmed");
    const payer = WALLET.publicKey;
    const receiver = new web3.PublicKey(String(intent.receiver || BILLING.receiver || ""));
    if (!receiver) throw new Error("receiver_missing");

    const tx = new web3.Transaction();
    tx.feePayer = payer;
    const bh = await connection.getLatestBlockhash("finalized");
    tx.recentBlockhash = bh.blockhash;

    const amountBase = BigInt(String(intent.amountBase || intent.amount_base || "0"));
    if (amountBase <= 0n) throw new Error("invalid_amount");

    if (String(intent.currency || selectedCurrency) === "SOL"){
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

    const recvInfo = await connection.getAccountInfo(receiverAta);
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
    if (list) list.innerHTML = '<div class="muted">Loading…</div>';
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
      if (msg) msg.innerHTML = `<span class="bad">${escapeHtml(e.message||'failed')}</span>`;
    }
  }

function billingErrMsg(code){
    const m = String(code || "");
    if (m.includes("rejected") || m.includes("Rejected") || m.includes("User rejected")) return "Transaction was cancelled in the wallet.";
    if (m === "spl_token_unavailable") return "Could not load SPL Token helper (needed for USDC/USDT). Disable strict blockers and refresh.";
    if (m === "web3_unavailable") return "Solana web3 library is not available. Refresh the page and try again.";
    if (m === "wallet_no_send_feature") return "This wallet can't send transactions from the browser. Try Solflare/Phantom/Backpack.";
    if (m === "payment_not_verified") return "Payment not found or not confirmed yet. Wait a moment and it will auto-verify.";
    if (m === "invalid_sig") return "Invalid transaction signature.";
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

      setPayState("processing", "Creating checkout…");
      if (msg) msg.textContent = "Creating payment…";
      trackEvent("pay_click", { v, plan: selectedPlan.key, cur, source:"wallet_tab" });

      const intent = await api("/api/billing/intent", "POST", { planKey: selectedPlan.key, currency: cur });

      setPayState("processing", "Building transaction…");
      if (msg) msg.textContent = "Building transaction…";
      const built = await buildPaymentTx(intent);

      setPayState("processing", "Approve in wallet…");
      if (msg) msg.textContent = "Approve the transaction in your wallet…";
      const payer = String(WALLET.publicKey?.toString?.() || "");
      const sig = await walletSendTransaction(built.tx, built.connection);

      setPayState("confirming", "Confirming on-chain…");
      if (msg) msg.textContent = "Confirming & verifying on-chain…";
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
const adminStatsBtn = $("adminStats");
  if (adminStatsBtn) adminStatsBtn.onclick = async ()=>{
    if (!requireConnected("Admin")) return;
    $("adminMsg").textContent = "";
    try{
      const path = "/api/admin/stats";      const j = await api(path);
      $("aOnline").textContent = j.onlineUsers10m;
      $("aTotal").textContent = j.totalUsers;
      $("aExt").textContent = j.extensionUsers;
      $("aIns").textContent = j.totalInsertsToday;
      $("adminMsg").innerHTML = '<span class="ok">Loaded.</span>';
    }catch(e){
      $("adminMsg").innerHTML = '<span class="bad">' + (e.message||"failed") + '</span>';
    }
  };


  const adminMetricsBtn = $("adminMetricsLoad");
  if (adminMetricsBtn) adminMetricsBtn.onclick = async ()=>{
    if (!requireConnected("Admin")) return;
    $("adminMetricsMsg").textContent = "";
    const hours = Math.max(1, Math.min(720, Math.floor(Number(($("adminMetricsHours")?.value || "24").trim()) || 24)));
    try{
      const path = "/api/admin/metrics?hours=" + hours;      const j = await api(path);
      $("aDau").textContent = j.dau;
      $("aMau").textContent = j.mau;
      $("aPro").textContent = j.proActive;

      $("aLimitHit").textContent = (j.funnel?.limit_hit?.users ?? 0) + " users";
      $("aPaywallOpen").textContent = (j.funnel?.upgrade_modal_open?.users ?? 0) + " users";
      $("aPayClick").textContent = (j.funnel?.pay_click?.users ?? 0) + " users";
      $("aPaySuccess").textContent = (j.funnel?.pay_success?.users ?? 0) + " users";
      $("aBusy").textContent = (j.funnel?.busy_try_again?.total ?? 0) + " events";

      const fmt = (x)=> (Math.round(Number(x||0)*1000)/10).toFixed(1) + "%";
      $("aRateOC").textContent = fmt(j.rates?.open_to_click);
      $("aRateCS").textContent = fmt(j.rates?.click_to_success);
      $("aRateOS").textContent = fmt(j.rates?.open_to_success);

      $("adminMetricsMsg").innerHTML = '<span class="ok">Loaded.</span> <span class="muted small">Window: ' + hours + 'h</span>';
    }catch(e){
      $("adminMetricsMsg").innerHTML = '<span class="bad">' + (e.message||"failed") + '</span>';
    }
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





const adminSelLoadBtn = $("adminSelLoad");
const adminSelSaveBtn = $("adminSelSave");
const adminSelResetBtn = $("adminSelReset");
const adminSelTouchBtn = $("adminSelTouch");
const adminSelApplyRolloutBtn = $("adminSelApplyRollout");
const adminSelRotateSaltBtn = $("adminSelRotateSalt");
const adminSelBox = $("adminSelBox");

function adminNote(){
  return String(($("adminSelNote")?.value || "")).trim();
}

async function adminSelFetch(method, body){
  if (!requireAdminSignedIn()) throw new Error("admin_not_signed_in");
  if (method === "GET"){    return await api("/api/admin/ext/selectors");
  }
  return await api("/api/admin/ext/selectors", "POST", { ...(body||{}) });
}

function renderAdminSelectors(j){
  try{
    const rollout = j.rollout || {};
    if ($("adminSelRollout")) $("adminSelRollout").value = String(Number(rollout.rollout_percent ?? 100));
    if ($("adminSelRolloutInfo")){
      const salt = String(rollout.rollout_salt || "");
      const ts = String(rollout.updated_at || "");
      $("adminSelRolloutInfo").innerHTML =
        `Rollout: <span class="kbd">${escapeHtml(String(rollout.rollout_percent ?? 100))}%</span> ` +
        (salt ? (`salt <span class="kbd">${escapeHtml(salt)}</span> `) : "") +
        (ts ? (`updated <span class="kbd">${escapeHtml(ts)}</span>`) : "");
    }

    const preview = j.preview || j.default || {};
    if (adminSelBox) adminSelBox.value = JSON.stringify(preview, null, 2);

    const histRoot = $("adminSelHistory");
    if (histRoot){
      const rows = Array.isArray(j.history) ? j.history : [];
      histRoot.innerHTML = rows.map(r=>{
        const id = r.id;
        const act = escapeHtml(String(r.action || ""));
        const ts = escapeHtml(String(r.created_at || ""));
        const note = escapeHtml(String(r.note || ""));
        const rp = (r.rollout_percent !== null && r.rollout_percent !== undefined) ? (` ${escapeHtml(String(r.rollout_percent))}%`) : "";
        return `<div class="split" style="align-items:center;margin:6px 0;gap:10px;flex-wrap:wrap">
          <div style="flex:1;min-width:220px">
            <div><span class="kbd">#${id}</span> <b>${act}</b> <span class="muted">${ts}</span>${rp}</div>
            ${note ? `<div class="muted small">${note}</div>` : ``}
          </div>
          <button class="btn secondary" data-hid="${id}" type="button">Rollback</button>
        </div>`;
      }).join("") || `<div class="muted">No history yet.</div>`;

      histRoot.querySelectorAll("button[data-hid]").forEach(btn=>{
        btn.onclick = async ()=>{
          const hid = Number(btn.getAttribute("data-hid") || "0");
          if (!hid) return;
          if (!confirm("Rollback selectors to history #" + hid + "?")) return;
          $("adminSelMsg").textContent = "";
          try{
            const j2 = await adminSelFetch("POST", { action:"rollback", historyId: hid, note: adminNote() });
            renderAdminSelectors(j2);
            $("adminSelMsg").innerHTML = '<span class="ok">Rolled back.</span>';
          }catch(e){
            $("adminSelMsg").innerHTML = '<span class="bad">' + escapeHtml(e.message||"failed") + '</span>';
          }
        };
      });
    }
  }catch(_e){}
}

if (adminSelLoadBtn) adminSelLoadBtn.onclick = async ()=>{
  if (!requireConnected("Admin")) return;
  $("adminSelMsg").textContent = "";
  try{
    const j = await adminSelFetch("GET");
    renderAdminSelectors(j);
    const ts = j.overrideUpdatedAt ? ("Override updated: " + j.overrideUpdatedAt) : "Using default selectors.";
    $("adminSelMsg").innerHTML = '<span class="ok">Loaded.</span> <span class="muted">' + escapeHtml(ts) + '</span>';
  }catch(e){
    $("adminSelMsg").innerHTML = '<span class="bad">' + escapeHtml(e.message||"failed") + '</span>';
  }
};

if (adminSelSaveBtn) adminSelSaveBtn.onclick = async ()=>{
  if (!requireConnected("Admin")) return;
  $("adminSelMsg").textContent = "";
  try{
    const raw = (adminSelBox?.value || "").trim();
    if (!raw) throw new Error("Paste JSON first.");
    const obj = JSON.parse(raw);
    const j = await adminSelFetch("POST", { action:"save", selectors: obj, note: adminNote() });
    renderAdminSelectors(j);
    $("adminSelMsg").innerHTML = '<span class="ok">Saved.</span> <span class="muted">Clients will auto-refresh selectors on failures and during periodic polling.</span>';
  }catch(e){
    $("adminSelMsg").innerHTML = '<span class="bad">' + escapeHtml(String(e?.message||"failed")) + '</span>';
  }
};

if (adminSelResetBtn) adminSelResetBtn.onclick = async ()=>{
  if (!requireConnected("Admin")) return;
  $("adminSelMsg").textContent = "";
  try{
    const j = await adminSelFetch("POST", { action:"reset", note: adminNote() });
    renderAdminSelectors(j);
    $("adminSelMsg").innerHTML = '<span class="ok">Reset to default.</span>';
  }catch(e){
    $("adminSelMsg").innerHTML = '<span class="bad">' + escapeHtml(e.message||"failed") + '</span>';
  }
};

if (adminSelTouchBtn) adminSelTouchBtn.onclick = async ()=>{
  if (!requireConnected("Admin")) return;
  $("adminSelMsg").textContent = "";
  try{
    const j = await adminSelFetch("POST", { action:"touch", note: adminNote() });
    renderAdminSelectors(j);
    const ts = j.overrideUpdatedAt ? ("Override updated: " + j.overrideUpdatedAt) : "";
    $("adminSelMsg").innerHTML = '<span class="ok">Forced refresh queued.</span> <span class="muted">' + escapeHtml(ts) + '</span>';
  }catch(e){
    $("adminSelMsg").innerHTML = '<span class="bad">' + escapeHtml(e.message||"failed") + '</span>';
  }
};

if (adminSelApplyRolloutBtn) adminSelApplyRolloutBtn.onclick = async ()=>{
  if (!requireConnected("Admin")) return;
  $("adminSelMsg").textContent = "";
  try{
    const p = Number(($("adminSelRollout")?.value || "100").trim());
    const j = await adminSelFetch("POST", { action:"rollout", rollout_percent: p, note: adminNote() });
    renderAdminSelectors(j);
    $("adminSelMsg").innerHTML = '<span class="ok">Rollout updated.</span>';
  }catch(e){
    $("adminSelMsg").innerHTML = '<span class="bad">' + escapeHtml(e.message||"failed") + '</span>';
  }
};

if (adminSelRotateSaltBtn) adminSelRotateSaltBtn.onclick = async ()=>{
  if (!requireConnected("Admin")) return;
  $("adminSelMsg").textContent = "";
  try{
    const p = Number(($("adminSelRollout")?.value || "100").trim());
    const j = await adminSelFetch("POST", { action:"rotate_salt", rollout_percent: p, note: adminNote() });
    renderAdminSelectors(j);
    $("adminSelMsg").innerHTML = '<span class="ok">Salt rotated (clients re-bucketed).</span>';
  }catch(e){
    $("adminSelMsg").innerHTML = '<span class="bad">' + escapeHtml(e.message||"failed") + '</span>';
  }
};

// ---- Admin: extension health ----
async function adminHealthFetch(){
  if (!requireAdminSignedIn()) throw new Error("admin_not_signed_in");
  const hours = Number(($("adminHealthHours")?.value || "24").trim());
  const q = new URLSearchParams();  if (Number.isFinite(hours)) q.set("hours", String(hours));
  return await api("/api/admin/ext/health?" + q.toString());
}

const adminHealthLoadBtn = $("adminHealthLoad");
if (adminHealthLoadBtn) adminHealthLoadBtn.onclick = async ()=>{
  if (!requireConnected("Admin")) return;
  $("adminHealthOut").textContent = "";
  try{
    const j = await adminHealthFetch();
    const view = {
      hours: j.hours,
      sinceIso: j.sinceIso,
      totals: j.totals,
      byType: j.byType,
      topErrors: j.topErrors,
      versions: j.versions,
      last: j.last
    };
    $("adminHealthOut").textContent = JSON.stringify(view, null, 2);
  }catch(e){
    $("adminHealthOut").textContent = "Error: " + (e.message||"failed");
  }
};

// ---- Admin: FAQ ----
async function adminFaqFetch(method, body){
  if (!requireAdminSignedIn()) throw new Error("admin_not_signed_in");
  if (method === "GET"){    return await api("/api/admin/faq");
  }
  return await api("/api/admin/faq", "POST", { ...(body||{}) });
}

const adminFaqLoadBtn = $("adminFaqLoad");
const adminFaqSaveBtn = $("adminFaqSave");
const adminFaqBox = $("adminFaqBox");

if (adminFaqLoadBtn) adminFaqLoadBtn.onclick = async ()=>{
  if (!requireConnected("Admin")) return;
  $("adminFaqMsg").textContent = "";
  try{
    const j = await adminFaqFetch("GET");
    if (adminFaqBox) adminFaqBox.value = JSON.stringify({ items: j.items || [] }, null, 2);
    $("adminFaqMsg").innerHTML = '<span class="ok">Loaded.</span>';
  }catch(e){
    $("adminFaqMsg").innerHTML = '<span class="bad">' + escapeHtml(e.message||"failed") + '</span>';
  }
};

if (adminFaqSaveBtn) adminFaqSaveBtn.onclick = async ()=>{
  if (!requireConnected("Admin")) return;
  $("adminFaqMsg").textContent = "";
  try{
    const raw = (adminFaqBox?.value || "").trim();
    if (!raw) throw new Error("Paste JSON first.");
    const obj = JSON.parse(raw);
    const j = await adminFaqFetch("POST", obj);
    if (adminFaqBox) adminFaqBox.value = JSON.stringify({ items: j.items || [] }, null, 2);
    $("adminFaqMsg").innerHTML = '<span class="ok">Saved.</span>';
  }catch(e){
    $("adminFaqMsg").innerHTML = '<span class="bad">' + escapeHtml(e.message||"failed") + '</span>';
  }
};



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
      if (cm) cm.innerHTML = '<span class="ok">Connected.</span>';

      applyAdminVisibility();
      await refreshUsage();
      await loadPlans();

      const code = params.get("code");
      if (code){
        const rc = $("redeemCode");
        if (rc) rc.value = code;
      }
    }catch(e){
      if (cm) cm.innerHTML = '<span class="bad">Connect error: ' + escapeHtml(e.message || "request_failed") + '</span>';
    }
  };

  const resetBtn = $("btnReset");
  if (resetBtn) resetBtn.onclick = ()=>{
    localStorage.removeItem(LS_HANDLE);
    localStorage.removeItem(LS_TOKEN);
    try{ localStorage.removeItem(LS_IS_ADMIN); }catch{}
    try{ localStorage.removeItem(LS_ADMIN_CLAIMABLE); }catch{}
    const hp = $("handlePill");
    if (hp) hp.textContent = "not set";
    const cm = $("connectMsg");
    if (cm) cm.innerHTML = '<span class="ok">Local reset done.</span>';
    applyAdminVisibility();
  };

  // ---- UI Translation (site language) ----
  // Important: Always apply EN first, then override with selected lang (fallback for all UI languages).
  const I18N = {
    en: {
      plan_compare_btn:"Compare",
      plan_modal_title:"Plan comparison",
      plan_modal_close:"Close",
      plan_modal_desc:"Pick what you need — you can extend anytime. Pro unlocks everything instantly.",
      w_activity_title:"Your activity",
      w_activity_refresh:"Refresh",
      w_activity_hint:"Shows recent events for your handle (payments, referrals, upgrades)",
      refCopy:"Copy link",
      refLoad:"Load stats",

      loading:"Loading…",
      error:"Error",
      connectFirst:"Connect first.",
      lb_you:"You",
      lb_eligible:"Eligible",
      lb_empty:"No data yet.",
      lb_failed:"Could not load leaderboard.",

      // Errors / toasts (audit-required)
      err_unauthorized:"Unauthorized",
      err_forbidden:"Forbidden",
      err_not_found:"Not found",
      err_rate_limited:"Too many requests",
      err_busy:"Busy, try again",
      err_limit_reached:"Limit reached",
      err_upgrade_required:"Upgrade required",
      err_invalid_handle:"Invalid handle",
      err_init_failed:"Init failed",
      err_server_error:"Server error",
      err_unknown:"Unknown error",
      toast_copied:"Copied.",
      toast_copy_failed:"Copy failed.",
      toast_removed:"Removed.",
      toast_cleared:"Cleared.",
      toast_cleared_all_saved_lines:"Cleared all saved lines.",
      toast_nothing_to_copy:"Nothing to copy.",
      toast_nothing_to_export:"Nothing to export.",
      toast_custom_bg_saved:"Custom background saved.",
      toast_custom_bg_cleared:"Custom background cleared.",
      toast_wallpaper_cleared:"Wallpaper cleared.",
      connect_warn_html:"Open the extension and click Connect on the site.",
      connect_toast_html:"Connected.",
      this_feature:"This feature",
      locked:"Locked",
      locked_unlock_at:"Unlocks at {n} referrals",
      ext_wp_none:"No wallpaper",

      // Referrals list / leaderboard
      r_loading:"Loading…",
      r_no_invited:"No invited users yet",
      r_not_yet:"Not yet",
      r_eligible:"Eligible",
      r_flagged:"Flagged",
      r_leader_title:"Leaderboard",
      r_leader_note:"Ranks by eligible referrals with real usage in the selected period.",
      r_lb_handle:"Handle",
      r_lb_eligible:"Eligible",
      r_why_not_yet:"Not counted yet: no product usage detected",
      r_why_ok:"Counted: real usage detected",
      r_why_flagged:"Not counted: flagged as abuse",
      r_lb_failed:"Failed to load",
      ref_promo_title:"Promoter rules",
      ref_k_confirmed:"Confirmed",
      ref_k_active:"Active",
      ref_k_legacy:"Legacy",
      ref_k_eligible:"Eligible",
      ref_def_confirmed:"Confirmed = signup via your link.",
      ref_def_active:"Active = confirmed referral with at least one real usage.",
      ref_def_legacy:"Legacy = older referrals kept for compatibility.",
      ref_def_eligible:"Eligible = max(active, legacy).",
      ref_daily_limit_title:"Daily limit",
      ref_per_day:"per day",
      ref_base_plus_bonus:"Base {base} + bonus {bonus}",
      ref_bonus_rule:"Bonus: +{per20} per 20 eligible (chunks: {chunks})",
      ref_next_bonus:"Next bonus at {nextAt} eligible",
      ref_cap_note:"cap {cap}",
      ref_owner_inactive:"bonus paused until you use the product",
      ref_abuse_note:"Abuse (bots/self-referrals/automation) is excluded.",

      t_home:"Home",
      t_gm:"GM",
      t_gn:"GN",
      t_studio:"Studio",
      t_packs:"Packs",
      t_bulk:"Bulk",
      t_history:"History",
      t_favorites:"Favorites",
      t_ref:"Referrals",
      t_themes:"Themes",
      t_extthemes:"Extension Themes",
      t_wallet:"Upgrade Pro",
      t_admin:"Admin",
      r_li1:"Copy your link and share it.",
      r_li2:"Confirmed = someone connected using your link.",
      r_li3:"Active = confirmed users with usage. Eligible = bonus (legacy included).",

      ui_sub:"",
      themes_k_ref:"Referrals",
      themes_k_styles:"Unlocked styles",
      themes_k_themes:"Unlocked themes",
      customBg_status:"",
      customBg_remove:"Remove",
      customBg_label:"Upload image",
      customBg_note:"Pro only. Upload an image and we auto-fit it to any screen (desktop/mobile). This will later sync to the extension.",
      customBg_title:"Custom background",
      themes_right_desc:"Use Themes to change the app’s look. Wallpapers and backgrounds set the vibe.",
      themes_right_list:[
        "Pick any unlocked theme on the left.",
        "Wallpapers and backgrounds are applied instantly.",
        "In Free, some items are locked. Pro unlocks everything and removes the 70-line cap.",
        "Custom backgrounds (Pro) are auto-fit and will later sync to the extension."
      ],
      extthemes_right_title:"How unlocks work",
      extthemes_right_desc:"Up to 100 extension skins and 100 wallpapers. Free preview: first 10 skins. Unlock +1 at 10 referrals, then +1 every 5. Pro unlocks all cosmetics.",
      extthemes_right_list:[
        "Skins and wallpapers are applied from the site and synced to the extension.",
        "Only 1 skin is active at a time.",
        "Pro removes the 70-line cap and unlocks all writing styles / preset packs."
      ],
      themes_right:"About Themes",
      themes_desc:"Themes change the UI. Wallpapers and backgrounds change the vibe. Some items are locked in Free. Pro unlocks everything.",
      r_desc:"Short version:",
      home_desc:"Home: bind your X handle, redeem a Pro code (if you have one), and check today’s GM usage.",
      gm_desc:"",
      gm_lang_tabs_note:"Saved language lists (click a flag to open).",
      gn_lang_tabs_note:"Saved language lists (click a flag to open).",
      gm_right:"How to use GM",
      gm_right_desc:"Build a clean, human-sounding list so the extension can insert replies instantly on X.",
      gm_right_list:["<b>Global</b>: universal list used for any language.","<b>This language</b>: saves only for the selected Reply language (flag chips show saved languages).","<b>Random 1/10/70</b>: adds new lines to the active view. For big batches in <b>min</b>, the app auto-top-ups from <b>mid → max</b> to reach your target.","<b>Anti-repeat</b>: filters out recent/too-similar lines. Higher setting = fewer repeats but may reduce how many new lines can be added in <b>min</b>.","Use <b>Filter</b> to search inside your saved lines.","<b>Copy all</b> / <b>Export .txt</b>: backup your GM lists (Global + all languages).","Manual input drafts are auto-saved.","<b>Clear view</b> clears only the current view. <b>Clear ALL</b> clears Global + all language lists.","Free cap counts across Global + all languages. If you hit 70/70, new generated lines replace older ones (editing is unlimited)."],
      gn_right:"How to use GN",
      gn_right_desc:"Build a clean, human-sounding list so the extension can insert replies instantly on X.",
      gn_right_list:["Same rules as GM: use <b>Global</b> or <b>This language</b> for the selected reply language.","<b>Random 1/10/70</b> adds lines. For big batches in <b>min</b>, the app auto-top-ups from <b>mid → max</b>.","<b>Anti-repeat</b> reduces duplicates and overly similar lines.","Use <b>Filter</b> to search inside your saved lines.","<b>Copy all</b> / <b>Export .txt</b>: backup your GN lists (Global + all languages).","Manual input drafts are auto-saved.","<b>Clear view</b> clears only the current view. <b>Clear ALL</b> clears Global + all language lists.","Free cap is 70 saved lines total (Global + all languages). If you hit 70/70, new generated lines replace older ones. Editing is unlimited."],
      gn_desc:"",
      ref_desc:"Referrals: share your link. Confirmed = connected, Active = used, Eligible = bonus (legacy included). Bonus: +10/day per 20 eligible (+12 at 50+).",
      wallet_desc:"Upgrade Pro: unlimited daily GM/GN lines + unlock all cosmetics (Themes, Styles, Extension skins & wallpapers). Pay on Solana with SOL / USDC / USDT. Auto-verified on-chain.", w_pay_desc:"Select a plan to enable payment.", w_status_desc:"After you approve the transaction in your wallet, we verify it automatically on-chain.", w_status_list:["Select a plan and token first.", "Connect your wallet (Solflare, Phantom, Backpack, etc.).", "Approve the transaction — verification runs automatically."], r_list:["<b>Confirmed</b> counts when someone connects a handle with your link.","<b>Active</b> counts confirmed users with recorded usage. <b>Eligible</b> = max(active, legacy).","Every <b>20 eligible</b> adds <b>+10</b> daily inserts (Promoter 50+ = <b>+12</b> per 20).","Daily inserts affect the extension endpoint <b>/api/random</b> (not the site generator). Pro removes caps and unlocks everything."],
      themes_title:"Themes",
      themes_note:"Themes change the look of the app. Wallpapers and backgrounds change the vibe. Some items are locked in Free.",
      themes_rules:"Free: 5 themes + 5 writing styles. Every 100 referrals unlocks +5 themes and +2 styles. Pro unlocks everything and removes the 70-line cap.",
      themes_pick_title:"Pick a theme",
      themes_pick_note:"Click any unlocked theme to apply it instantly.",
      gm_style_label:"Writing style",
      gn_style_label:"Writing style",
      t_home:"Home", t_gm:"GM", t_gn:"GN", t_ref:"Referrals", t_themes:"Themes", t_wallet:"Upgrade Pro", t_admin:"Admin",
      h_title:"Connect", h_note:"Enter your X handle and connect once. The app will not work without a valid @handle.",
      h_label_handle:"X handle", h_code_title:"Activate code", h_code_note:"If you received a tester/subscription code, paste it here and activate.",
      h_status:"Quick guide", h_desc:"GMXReply is built for fast, human-style GM replies without looking botted.", h_guide:["<b>Step 1:</b> Connect your X handle (one-time).","<b>Step 2:</b> Build lists in <span class=\"kbd\">GM</span> / <span class=\"kbd\">GN</span> tabs (Global + per-language).","<b>Step 3:</b> Use the Chrome extension on X to insert a reply with one click.","<b>Limits:</b> Free = up to <b>70 saved lines</b> for GM (Global + all languages). Editing is unlimited. Pro removes the cap."],
      gm_title:"GM replies", gm_note:"",
      gn_title:"replies", gn_note:"",
      r_title:"Referrals", r_note:"Your referral link is unique. Share it to grow your bonus.",
      refLinkLabel:"Referral link",
      connectFirst:"Connect first",
      xHandle_ph:"@your_handle",
      redeemCode_ph:"Activation code",
      gmNewLine_ph:"Type your own line…",
      gmFilter_ph:"Filter saved lines…",
      gmPaste_ph:"Paste lines...",
      gnNewLine_ph:"Type your own line…",
      gnFilter_ph:"Filter saved lines…",
      gnPaste_ph:"Paste lines...",
      w_wallet_ph:"Select a plan first",
      w_sig_ph:"Paste here...",
      w_payer_label:"Sender wallet (payer)",
      w_payer_ph:"Paste the sender address (auto-filled when wallet is connected)",
      w_payer_hint:"Needed to verify safely (prevents someone’s transaction reuse).",
      adminSecret_ph:"ADMIN_SECRET (optional)",
      adminOut_ph:"Codes appear here...",
      w_title:"Upgrade Pro", w_note:"Select a plan → choose token (SOL/USDC/USDT) → connect wallet → Pay → auto-verify.",
      btnConnect:"Connect",
      btnReset:"Local reset",
      btnExt:"Get extension",
      btnRedeem:"Redeem code",
      gmViewGlobal:"Global list",
      gmViewLang:"Language list",
      gmRand1:"Random 1",
      gmRand10:"Random 10",
      gmRand70:"Random 70",
      gmAddLine:"+ Add line",
      gmClear:"Clear view",
      gmPasteAdd:"Paste & add",
      gnViewGlobal:"Global list",
      gnViewLang:"Language list",
      gnRand1:"Random 1",
      gnRand10:"Random 10",
      gnRand70:"Random 70",
      gnAddLine:"+ Add line",
      gnClear:"Clear view",
      gnPasteAdd:"Paste & add",
      refLoad:"Load stats",
      refCopy:"Copy link",
      w_verify:"Verify payment",
      w_refresh:"Refresh status",
      adminStats:"Refresh stats",
      adminGen:"Generate code",
      adminList:"List codes",
      ui_site_lang:"Language",
      "apply_upgrade_pro": "Upgrade Pro",
      "ref_promoter_title": "Referral rewards (Promoters)",
      "ref_promoter_body": "Clicks are welcome. Rewards are based on eligible users only (connect + first real use). High traffic can be queued daily.",

    
      r_li2b:"We track clicks separately. Rewards/unlocks use connected referrals.",
      r_li2c:"Promoters: your free daily cap increases automatically with referrals (bonus is added to your base limit).",
      r_li4:"Bonus: +10/day per 20 eligible (+12 at 50+). Pro unlocks everything.",
      r_note:"Share your referral link. When a new user connects using it, your referral count increases.",
      themes_right_title:"Quick guide",
      w_pay_help_list:[
        "Select a plan and token (SOL/USDC/USDT).",
        "Connect your wallet and approve the transaction.",
        "After auto-verify, Pro activates for your handle."
      ],
      w_pay_help_title:"Payment steps",
      w_right:"How Pro & referrals work",
      ui_plan:"Plan",
      ui_sync:"Sync",
      w_right_desc:"Free lets you build and edit your GM/GN lists. Pro unlocks everything and removes limits.",
      w_right_list:[
        "<b>Free:</b> save up to <b>70</b> GM lines + <b>70</b> GN lines (edit anytime). Daily inserts: <b>70</b> each.",
        "<b>Free cosmetics:</b> <b>10</b> themes + <b>10</b> wallpapers. More via referrals or Pro.",
        "<b>Referrals:</b> unlock more cosmetics gradually. Full details in <b>Referrals</b> tab.",
        "<b>Pro:</b> unlimited daily inserts + unlimited saved lines, unlock everything (including Cloud sync).",
        "<b>Pay:</b> select a plan → choose SOL/USDC/USDT → connect wallet → approve transfer → auto-verify."
      ],

      w_support_title:"Support",
      w_support_desc:"Copy a safe diagnostics bundle (no private keys) to help debug issues fast.",
      toolSupport:"Copy support bundle",
      toolDiag:"Copy diagnostics",
      toolLogs:"Copy local logs",
      supportOut_ph:"Paste support notes here...",

      w_faq_title:"FAQ",
      w_faq_list:[
        "<b>Is Pro tied to my wallet?</b> No — Pro is tied to your X handle. You can pay from any wallet.",
        "<b>Paid but Pro isn’t active?</b> Use the Support buttons above and send us the bundle.",
        "<b>Do you store my replies?</b> Lists are stored locally in your browser. Cloud sync is Pro-only."
      ],
      wp_note:"Set a wallpaper per tab (Home / GM / Referrals / Themes / Extension Themes / Upgrade Pro). Free preview: first 10 wallpapers. Unlock +1 at 10 referrals, then +1 every 5, or Pro.",

    themes_k_walls:"Unlocked wallpapers",

    ext_k_themes:"Unlocked themes",

    ext_k_walls:"Unlocked wallpapers",

    ext_k_ref:"Referrals",
},
    de: {
      plan_compare_btn:"Vergleichen",
      plan_modal_title:"Tarifvergleich",
      plan_modal_close:"Schließen",
      plan_modal_desc:"Wähle, was du brauchst — du kannst jederzeit verlängern. Pro schaltet alles sofort frei.",
      w_activity_title:"Deine Aktivität",
      w_activity_refresh:"Aktualisieren",
      w_activity_hint:"Zeigt aktuelle Ereignisse für deinen Handle (Zahlungen, Referrals, Upgrades)",
      refCopy:"Link kopieren",
      refLoad:"Stats laden",

      t_home:"Start",
      t_gm:"GM",
      t_gn:"GN",
      t_ref:"Empfehlungen",
      t_themes:"Themes",
      t_extthemes:"Erweiterungs-Themes",
      t_wallet:"Pro upgraden",
      t_admin:"Admin",
      r_li1:"Kopiere deinen Link und teile ihn.",
      r_li2:"Wenn ein neuer Nutzer über deinen Link verbindet, steigt dein Referral-Zähler.",
      r_li3:"Referrals schalten mit der Zeit mehr Kosmetik und Presets frei.",
 ui_sub:"",
      themes_title:"Themes",
      themes_desc:"Themes ändern die UI. Wallpapers und Hintergründe ändern den Look. Einige Elemente sind in Free gesperrt. Pro schaltet alles frei.",
      themes_rules:"Free: 5 Themes + 5 Stile. Je 100 Referrals werden +5 Themes und +2 Stile freigeschaltet. Pro schaltet alles frei und entfernt das 70‑Zeilen‑Limit.",
      themes_pick_title:"Theme auswählen",
      themes_pick_note:"Klicke auf ein freigeschaltetes Theme, um es sofort anzuwenden.",
      customBg_title:"Eigenes Hintergrundbild",
      customBg_note:"Nur Pro. Lade ein Bild hoch, wir passen es automatisch an jede Bildschirmgröße an (Desktop/Mobil). Später Sync zur Extension.",
      customBg_label:"Bild hochladen",
      customBg_remove:"Entfernen",
      themes_right:"Über Themes",
      themes_right_desc:"Nutze Themes für das Design der App. Wallpapers und Hintergründe setzen den Look.",
      themes_right_list:[
        "Wähle links ein freigeschaltetes Theme aus.",
        "Wallpapers und Hintergründe werden sofort angewendet.",
        "In Free sind einige Dinge gesperrt. Pro schaltet alles frei und entfernt das 70‑Zeilen‑Limit.",
        "Custom Backgrounds (Pro) sind auto‑fit und werden später zur Extension synchronisiert."
      ],
      h_safe:"Sicherheit: Zu schnelle Replies auf X können Limits auslösen. Bitte verantwortungsvoll nutzen.",
      gm_desc:"",
      gm_note:"",
      gm_right_desc:"Halte die Liste sauber, damit die Extension sofort natürliche Replies einfügen kann.",
      gm_right_list:["<b>Global</b> ist universell.","<b>Diese Sprache</b> erstellt eine Liste für die gewählte Sprache.","<b>Random 1</b> fügt eine neue Zeile hinzu.","<b>Random 10/70</b> fügt mehrere neue Zeilen hinzu.","<b>Frei editieren</b>: Zeile anklicken und eigenen Text tippen.","Wenn du 70/70 erreichst, lösche ein paar Zeilen, um neue hinzuzufügen (Bearbeiten ist unbegrenzt)."],
      gn_desc:"",
      gn_note:"",
      gn_right_desc:"Halte die Liste sauber, damit die Extension sofort natürliche Replies einfügen kann.",
      gn_right_list:["<b>Global</b> funktioniert überall.","<b>Diese Sprache</b> hält eine eigene GN-Liste pro Sprache.","<b>Random 1/10/70</b> fügt frische Zeilen hinzu.","<b>Frei editieren</b>: Jede Zeile jederzeit ändern.","Free-Cap 70 gilt über alle GN-Listen."],
      ref_desc:"Referrals: Link teilen. Jede 100 Referrals schalten +5 Themes und +2 Styles frei (gratis). Pro schaltet alles frei.",
      r_desc:"Referrals: Link kopieren, teilen und Counter verfolgen.",
      r_list:["Alle <b>20 Referrals</b> gibt es <b>+10</b> Inserts pro Tag.","Daily Inserts betreffen den Extension-Endpoint <b>/api/random</b> (nicht den Site-Generator).","Link teilen. Leute verbinden einmal. Bonus aktualisiert automatisch."],
      wallet_desc:"Pro: Entfernt das 70er-Limit, schaltet alle Themes & Styles frei und gibt unbegrenzte Generation. Voller Wallet-Connect kommt später — bewusst vorsichtig wegen Security. Verify per Signature ist sicherer und zuverlässig.",
      w_note:"Plan wählen → Token (SOL/USDC/USDT) → Wallet verbinden → Pay → Auto‑Verify.",
      w_pay_desc:"Empfänger-Wallet erscheint nach Plan-Auswahl.",
      w_status_desc:"Einfach & sicher: Du sendest aus deiner Wallet und fügst die Signatur zur Verifizierung ein.",
      w_status_list:["Keine Wallet-Verbindung nötig (kleinere Angriffsfläche).","Funktioniert mit jeder Wallet (du fügst die Signatur ein).","Voller Wallet-Connect kommt nach Security-Review."],
      pro_tools_title:"Pro-Tools",
      pro_tools_desc:"Listen bereinigen, Daten exportieren/importieren und ein Support-Bundle kopieren.",
      pro_tools_note:"Nur Pro. In Free bitte auf Pro upgraden, um diese Buttons zu nutzen.",
      gm_right:"So nutzt du GM",
      gn_right:"So nutzt du GN",
      r_how:"So funktioniert’s",
      w_status:"Zahlungen",
      extthemes_right_desc:"Bis zu 100 Extension-Skins und 100 Wallpapers. Free‑Vorschau: erste 10 Skins. Unlock +1 bei 10 Referrals, dann +1 alle 5. Pro schaltet alle Cosmetics frei.",
      extthemes_right_list:[
        "Skins und Wallpapers werden auf der Website gewählt und mit der Extension synchronisiert.",
        "Es kann nur 1 Skin gleichzeitig aktiv sein.",
        "Pro entfernt außerdem das 70‑Zeilen‑Limit und schaltet alle Writing Styles / Preset Packs frei."
      ],
      extthemes_right_title:"So funktionieren Unlocks",
      r_li2b:"Klicks zählen wir separat. Rewards/Unlocks basieren auf verbundenen Referrals.",
      r_li2c:"Promoters: dein Free‑Daily‑Cap steigt automatisch mit Referrals (Bonus wird zum Basis‑Limit addiert).",
      r_li4:"Pro schaltet alles sofort frei.",
      r_note:"Teile deinen Referral-Link. Wenn sich ein neuer Nutzer darüber verbindet, steigt dein Referral‑Zähler.",
      r_title:"Referrals",
      themes_right_title:"Kurzanleitung",
      w_pay_help_list:[
        "Wähle einen Plan und Token (SOL/USDC/USDT).",
        "Wallet verbinden und Transaktion bestätigen.",
        "Nach Auto‑Verify wird Pro für deinen Handle aktiviert."
      ],
      w_pay_help_title:"Zahlungsschritte",
      w_right:"So funktionieren Pro & Referrals",
      w_right_desc:"Free: GM-Listen bauen und bearbeiten. Pro schaltet alles frei und entfernt Limits.",
      w_right_list:[
        "<b>Free:</b> Listen frei bauen &amp; bearbeiten. Daily inserts: <b>70</b>.",
        "<b>Referrals:</b> schalten Themes/Skins/Packs nach und nach frei. Details im Tab <b>Referrals</b>.",
        "<b>Pro:</b> unbegrenzte daily inserts, alles freigeschaltet, erweiterte Controls.",
        "<b>Pay:</b> Plan wählen → Token wählen → Wallet verbinden → Pay → Auto‑Verify."
      ],
      wp_note:"Wallpaper pro Tab (Home / GM / Referrals / Themes / Extension Themes / Upgrade Pro). Free‑Vorschau: erste 10 Wallpapers. Unlock +1 bei 10 Referrals, dann +1 alle 5, oder Pro.",

    themes_k_walls:"Freigeschaltete Wallpaper",

    ext_k_themes:"Freigeschaltete Themes",

    ext_k_walls:"Freigeschaltete Wallpaper",

    ext_k_ref:"Empfehlungen",
},
    fr: {
      plan_compare_btn:"Comparer",
      plan_modal_title:"Comparaison des offres",
      plan_modal_close:"Fermer",
      plan_modal_desc:"Choisis ce dont tu as besoin — tu peux prolonger à tout moment. Pro déverrouille tout instantanément.",
      w_activity_title:"Ton activité",
      w_activity_refresh:"Rafraîchir",
      w_activity_hint:"Affiche les événements récents pour ton handle (paiements, parrainages, upgrades)",
      refCopy:"Copier le lien",
      refLoad:"Charger stats",

      t_home:"Accueil",
      t_gm:"GM",
      t_gn:"GN",
      t_ref:"Parrainage",
      t_themes:"Thèmes",
      t_extthemes:"Thèmes extension",
      t_wallet:"Passer Pro",
      t_admin:"Admin",
      r_li1:"Copie ton lien et partage-le.",
      r_li2:"Quand un nouvel utilisateur se connecte via ton lien, ton compteur augmente.",
      r_li3:"Les parrainages débloquent plus de cosmétiques et de presets au fil du temps.",
 ui_sub:"",
      themes_title:"Thèmes",
      themes_desc:"Les thèmes changent l’UI. Les wallpapers et arrière-plans changent le style. Certains éléments sont verrouillés en Free. Pro débloque tout.",
      themes_rules:"Free : 5 thèmes + 5 styles. Chaque 100 parrainages débloque +5 thèmes et +2 styles. Pro débloque tout et supprime la limite de 70 lignes.",
      themes_pick_title:"Choisir un thème",
      themes_pick_note:"Clique sur un thème débloqué pour l’appliquer instantanément.",
      customBg_title:"Arrière‑plan personnalisé",
      customBg_note:"Pro uniquement. Importez une image et nous l’ajustons automatiquement à tous les écrans (mobile/desktop). Synchronisation extension plus tard.",
      customBg_label:"Importer une image",
      customBg_remove:"Retirer",
      themes_right:"À propos des thèmes",
      themes_right_desc:"Utilisez Thèmes pour changer le look de l’app. Wallpapers et arrière‑plans donnent l’ambiance.",
      themes_right_list:[
        "Choisis un thème débloqué à gauche.",
        "Wallpapers et arrière‑plans s’appliquent instantanément.",
        "En Free, certains éléments sont verrouillés. Pro débloque tout et enlève la limite de 70 lignes.",
        "Les fonds personnalisés (Pro) sont auto‑fit et seront plus tard synchronisés à l’extension."
      ],
      h_safe:"Sécurité : répondre trop vite sur X peut déclencher des limites. Utilisez avec prudence.",
      gm_desc:"",
      gm_note:"",
      gm_right_desc:"Gardez une liste propre pour que l’extension insère des réponses naturelles instantanément.",
      gm_right_list:["<b>Global</b> est universel.","<b>Cette langue</b> crée une liste dédiée pour la langue sélectionnée.","<b>Random 1</b> ajoute une nouvelle ligne.","<b>Random 10/70</b> ajoute plusieurs nouvelles lignes.","<b>Éditez librement</b> : cliquez sur une ligne et tapez votre texte.","Si tu atteins 70/70, supprime quelques lignes pour en ajouter de nouvelles (l’édition est illimitée)."],
      gn_desc:"",
      gn_note:"",
      gn_right_desc:"Gardez une liste propre pour que l’extension insère des réponses naturelles instantanément.",
      gn_right_list:["<b>Global</b> fonctionne partout.","<b>Cette langue</b> garde une liste dédiée par langue.","<b>Random 1/10/70</b> ajoute des lignes fraîches à la vue active.","<b>Éditez librement</b> : modifiez n’importe quelle ligne à tout moment.","Le cap 70 en Free s’applique à toutes les listes GN."],
      ref_desc:"Parrainage : partagez votre lien. Chaque 100 parrainages débloque +5 thèmes et +2 styles (gratuit). Pro débloque tout.",
      r_desc:"Parrainage : copiez votre lien, partagez-le et suivez votre compteur.",
      r_list:["Chaque <b>20 parrainages</b> ajoute <b>+10</b> insertions quotidiennes.","Les insertions quotidiennes concernent l’endpoint extension <b>/api/random</b> (pas le générateur du site).","Partagez votre lien. Les gens se connectent une fois. Le bonus se met à jour automatiquement."],
      wallet_desc:"Upgrade Pro : supprime la limite 70 et débloque tous les cosmétiques (thèmes, styles, skins & wallpapers d’extension). Paiement sur Solana en SOL / USDC / USDT. Vérification automatique on‑chain.",
      w_note:"Choisir plan → token (SOL/USDC/USDT) → connecter wallet → Pay → auto‑verify.",
      w_pay_desc:"Le wallet receveur s’affichera après la sélection d’un plan.",
      w_status_desc:"Après validation dans ton wallet, on vérifie automatiquement la transaction on‑chain.",
      w_status_list:["Choisir un plan et un token.", "Connecter ton wallet (Solflare, Phantom, Backpack, etc.).", "Valider la transaction — auto‑verify ensuite."],
      pro_tools_title:"Outils Pro",
      pro_tools_desc:"Nettoyez vos listes, exportez/importez vos données, et copiez un “support bundle” pour obtenir de l’aide vite.",
      pro_tools_note:"Outils Pro uniquement. En Free, passez Pro pour activer ces boutons.",
      gm_right:"Comment utiliser GM",
      gn_right:"Comment utiliser GN",
      r_how:"Comment ça marche",
      w_status:"À propos des paiements",
      extthemes_right_desc:"Jusqu’à 100 skins d’extension et 100 fonds d’écran. Aperçu Free : 10 premiers skins. Unlock +1 à 10 parrainages, puis +1 tous les 5. Pro débloque toute la cosmétique.",
      extthemes_right_list:[
        "Les skins et fonds d’écran se choisissent sur le site et se synchronisent avec l’extension.",
        "Un seul skin peut être actif à la fois.",
        "Pro supprime aussi la limite de 70 lignes et débloque tous les writing styles / preset packs."
      ],
      extthemes_right_title:"Comment fonctionnent les unlocks",
      r_li2b:"Les clics sont comptés à part. Rewards/unlocks utilisent les parrainages connectés.",
      r_li2c:"Promoters : ton free daily cap augmente automatiquement avec les parrainages (le bonus s’ajoute à la base).",
      r_li4:"Pro débloque tout instantanément.",
      r_note:"Partage ton lien de parrainage. Quand un nouvel utilisateur se connecte via ce lien, ton compteur augmente.",
      r_title:"Parrainages",
      themes_right_title:"Guide rapide",
      w_pay_help_list:[
        "Choisis un plan et un token (SOL/USDC/USDT).",
        "Connecte ton wallet et valide la transaction.",
        "Après auto‑verify, Pro s’active pour ton handle."
      ],
      w_pay_help_title:"Étapes de paiement",
      w_right:"Pro & parrainages",
      w_right_desc:"Free permet de créer et modifier tes listes GM. Pro débloque tout et enlève les limites.",
      w_right_list:[
        "<b>Free :</b> créer &amp; modifier librement. Daily inserts : <b>70 GM</b> .",
        "<b>Parrainages :</b> débloquent progressivement thèmes/skins/packs. Détails dans l’onglet <b>Referrals</b>.",
        "<b>Pro :</b> daily inserts illimités, tout débloqué, contrôles avancés.",
        "<b>Pay:</b> select a plan → choose token → connect wallet → Pay → auto-verify."
      ],
      wp_note:"Fond d’écran par onglet (Home / GM / Referrals / Themes / Extension Themes / Upgrade Pro). Aperçu Free : 10 premiers fonds d’écran. Unlock +1 à 10 parrainages, puis +1 tous les 5, ou Pro.",

    themes_k_walls:"Fonds d’écran débloqués",

    ext_k_themes:"Thèmes débloqués",

    ext_k_walls:"Fonds d’écran débloqués",

    ext_k_ref:"Parrainages",
},
    es: {
      plan_compare_btn:"Comparar",
      plan_modal_title:"Comparación de planes",
      plan_modal_close:"Cerrar",
      plan_modal_desc:"Elige lo que necesitas — puedes ampliar cuando quieras. Pro desbloquea todo al instante.",
      w_activity_title:"Tu actividad",
      w_activity_refresh:"Actualizar",
      w_activity_hint:"Muestra eventos recientes para tu handle (pagos, referidos, upgrades)",
      refCopy:"Copiar enlace",
      refLoad:"Cargar stats",

      t_home:"Inicio",
      t_gm:"GM",
      t_gn:"GN",
      t_ref:"Referidos",
      t_themes:"Temas",
      t_extthemes:"Temas de extensión",
      t_wallet:"Mejorar a Pro",
      t_admin:"Admin",
      r_li1:"Copia tu enlace y compártelo.",
      r_li2:"Cuando un usuario nuevo se conecte con tu enlace, sube tu contador.",
      r_li3:"Los referidos desbloquean más cosméticos y presets con el tiempo.",
 ui_sub:"",
      themes_title:"Temas",
      themes_desc:"Los temas cambian la UI. Los wallpapers y fondos cambian el estilo. Algunas opciones están bloqueadas en Free. Pro lo desbloquea todo.",
      themes_rules:"Free: 5 temas + 5 estilos. Cada 100 referidos desbloquea +5 temas y +2 estilos. Pro desbloquea todo y elimina el límite de 70 líneas.",
      themes_pick_title:"Elige un tema",
      themes_pick_note:"Haz clic en un tema desbloqueado para aplicarlo al instante.",
      customBg_title:"Fondo personalizado",
      customBg_note:"Solo Pro. Sube una imagen y la ajustamos automáticamente a cualquier pantalla (móvil/escritorio). Luego se sincronizará con la extensión.",
      customBg_label:"Subir imagen",
      customBg_remove:"Eliminar",
      themes_right:"Sobre Temas",
      themes_right_desc:"Usa Temas para cambiar el aspecto de la app. Los wallpapers y fondos marcan la vibra.",
      themes_right_list:[
        "Elige un tema desbloqueado a la izquierda.",
        "Los wallpapers y fondos se aplican al instante.",
        "En Free, algunas opciones están bloqueadas. Pro lo desbloquea todo y quita el límite de 70 líneas.",
        "Los fondos personalizados (Pro) se auto‑ajustan y luego se sincronizarán con la extensión."
      ],
      h_safe:"Seguridad: responder demasiado rápido en X puede activar límites. Úsalo con cuidado.",
      gm_desc:"",
      gm_note:"",
      gm_right_desc:"Mantén una lista limpia para que la extensión inserte respuestas naturales al instante.",
      gm_right_list:["<b>Global</b> es universal.","<b>Este idioma</b> crea una lista dedicada para el idioma seleccionado.","<b>Random 1</b> añade una línea nueva.","<b>Random 10/70</b> añade varias líneas nuevas.","<b>Edita libremente</b>: haz clic en una línea y escribe tu texto.","Si llegas a 70/70, elimina algunas líneas para poder añadir nuevas (editar es ilimitado)."],
      gn_desc:"",
      gn_note:"",
      gn_right_desc:"Mantén una lista limpia para que la extensión inserte respuestas naturales al instante.",
      gn_right_list:["<b>Global</b> funciona en cualquier sitio.","<b>Este idioma</b> guarda una lista dedicada por idioma.","<b>Random 1/10/70</b> añade líneas nuevas a la vista activa.","<b>Edita libremente</b>: cambia cualquier línea cuando quieras.","El límite 70 en Free se aplica a todas las listas GN."],
      ref_desc:"Referidos: comparte tu enlace. Cada 100 referidos desbloquea +5 temas y +2 estilos (gratis). Pro desbloquea todo.",
      r_desc:"Referidos: copia tu enlace, compártelo y revisa tu contador.",
      r_list:["Cada <b>20 referidos</b> añade <b>+10</b> inserciones diarias.","Las inserciones diarias afectan al endpoint de la extensión <b>/api/random</b> (no al generador del sitio).","Comparte tu enlace. La gente conecta una vez. El bonus se actualiza automáticamente."],
      wallet_desc:"Pro: elimina el límite de 70, desbloquea todos los temas y estilos, y obtén generación ilimitada. Wallet-connect completo llegará pronto — lo implementamos con cuidado por seguridad. Verificar por firma es más seguro y fiable.",
      w_note:"Elige plan → token (SOL/USDC/USDT) → conecta wallet → Pay → auto‑verify.",
      w_pay_desc:"La wallet receptora aparecerá después de elegir un plan.",
      w_status_desc:"Verificación simple y segura: envía desde tu propia wallet y pega la firma para verificar.",
      w_status_list:["No se requiere conectar la wallet (menor superficie de ataque).","Funciona con cualquier wallet (tú envías y pegas la firma).","Wallet-connect completo llegará después de una revisión de seguridad."],
      pro_tools_title:"Herramientas Pro",
      pro_tools_desc:"Limpia tus listas, exporta/importa datos y copia un paquete de soporte para recibir ayuda rápido.",
      pro_tools_note:"Solo Pro. Si estás en Free, mejora a Pro para usar estos botones.",
      gm_right:"Cómo usar GM",
      gn_right:"Cómo usar GN",
      r_how:"Cómo funciona",
      w_status:"Sobre pagos",
      extthemes_right_desc:"Hasta 100 skins de la extensión y 100 wallpapers. Preview Free: primeros 10 skins. Unlock +1 a 10 referidos, luego +1 cada 5. Pro desbloquea toda la cosmética.",
      extthemes_right_list:[
        "Skins y wallpapers se eligen en el sitio y se sincronizan con la extensión.",
        "Solo 1 skin puede estar activo a la vez.",
        "Pro también quita el límite de 70 líneas y desbloquea todos los writing styles / preset packs."
      ],
      extthemes_right_title:"Cómo funcionan los unlocks",
      r_li2b:"Los clics se registran por separado. Rewards/unlocks usan referidos conectados.",
      r_li2c:"Promoters: tu free daily cap aumenta automáticamente con referidos (el bonus se suma a tu base).",
      r_li4:"Pro desbloquea todo al instante.",
      r_note:"Comparte tu link de referidos. Cuando un usuario nuevo se conecta con él, tu contador sube.",
      r_title:"Referidos",
      themes_right_title:"Guía rápida",
      w_pay_help_list:[
        "Elige un plan y token (SOL/USDC/USDT).",
        "Conecta tu wallet y aprueba la transacción.",
        "Tras auto‑verify, Pro se activa para tu handle."
      ],
      w_pay_help_title:"Pasos de pago",
      w_right:"Cómo funcionan Pro y referidos",
      w_right_desc:"Free te deja crear y editar tus listas GM. Pro desbloquea todo y quita límites.",
      w_right_list:[
        "<b>Free:</b> crea &amp; edita listas libremente. Daily inserts: <b>70</b>.",
        "<b>Referidos:</b> desbloquean temas/skins/packs poco a poco. Detalles en <b>Referrals</b>.",
        "<b>Pro:</b> daily inserts ilimitados, todo desbloqueado, controles avanzados.",
        "<b>Pagar:</b> elige plan → elige token → conecta wallet → Pay → auto‑verify. → Verify."
      ],
      wp_note:"Wallpaper por pestaña (Home / GM / Referrals / Themes / Extension Themes / Upgrade Pro). Preview Free: primeros 10 wallpapers. Unlock +1 a 10 referidos, luego +1 cada 5, o Pro.",

    themes_k_walls:"Fondos desbloqueados",

    ext_k_themes:"Temas desbloqueados",

    ext_k_walls:"Fondos desbloqueados",

    ext_k_ref:"Referidos",
},
    pt: {
      plan_compare_btn:"Comparar",
      plan_modal_title:"Comparação de planos",
      plan_modal_close:"Fechar",
      plan_modal_desc:"Escolhe o que precisas — podes prolongar a qualquer momento. Pro desbloqueia tudo na hora.",
      w_activity_title:"A tua atividade",
      w_activity_refresh:"Atualizar",
      w_activity_hint:"Mostra eventos recentes do teu handle (pagamentos, referrals, upgrades)",
      refCopy:"Copiar link",
      refLoad:"Carregar stats",

      t_home:"Início",
      t_gm:"GM",
      t_gn:"GN",
      t_ref:"Indicações",
      t_themes:"Temas",
      t_extthemes:"Temas da extensão",
      t_wallet:"Upgrade Pro",
      t_admin:"Admin",
      r_li1:"Copie seu link e compartilhe.",
      r_li2:"Quando um novo usuário conectar pelo seu link, seu contador aumenta.",
      r_li3:"As indicações desbloqueiam mais cosméticos e presets ao longo do tempo.",
 ui_sub:"",
      themes_title:"Temas",
      themes_desc:"Os temas mudam a UI. Wallpapers e fundos mudam o visual. Alguns itens ficam bloqueados no Free. Pro libera tudo.",
      themes_rules:"Free: 5 temas + 5 estilos. A cada 100 referrals desbloqueia +5 temas e +2 estilos. Pro desbloqueia tudo e remove o limite de 70 linhas.",
      themes_pick_title:"Escolha um tema",
      themes_pick_note:"Clique em um tema desbloqueado para aplicar na hora.",
      customBg_title:"Fundo personalizado",
      customBg_note:"Somente Pro. Envie uma imagem e ajustamos automaticamente para qualquer tela (mobile/desktop). Depois sincroniza com a extensão.",
      customBg_label:"Enviar imagem",
      customBg_remove:"Remover",
      themes_right:"Sobre temas",
      themes_right_desc:"Use Temas para mudar o visual do app. Wallpapers e fundos definem a vibe.",
      themes_right_list:[
        "Escolha um tema desbloqueado à esquerda.",
        "Wallpapers e fundos aplicam na hora.",
        "No Free, alguns itens ficam bloqueados. Pro libera tudo e remove o limite de 70 linhas.",
        "Fundos personalizados (Pro) são auto‑fit e depois serão sincronizados com a extensão."
      ],
      h_safe:"Segurança: responder muito rápido no X pode ativar limites. Use com cuidado.",
      gm_desc:"",
      gm_note:"",
      gm_right_desc:"Mantenha uma lista limpa para a extensão inserir respostas naturais instantaneamente.",
      gm_right_list:["<b>Global</b> é universal.","<b>Este idioma</b> cria uma lista dedicada para o idioma selecionado.","<b>Random 1</b> adiciona uma linha nova.","<b>Random 10/70</b> adiciona várias linhas novas.","<b>Edite livremente</b>: clique em uma linha e digite seu texto.","Se o limite 70 estiver cheio, novas linhas <b>substituem as antigas</b> automaticamente."],
      gn_desc:"",
      gn_note:"",
      gn_right_desc:"Mantenha uma lista limpa para a extensão inserir respostas naturais instantaneamente.",
      gn_right_list:["<b>Global</b> funciona em qualquer lugar.","<b>Este idioma</b> mantém uma lista dedicada por idioma.","<b>Random 1/10/70</b> adiciona linhas novas à visão ativa.","<b>Edite livremente</b>: altere qualquer linha quando quiser.","O limite 70 no Free vale para todas as listas GN."],
      ref_desc:"Indicações: compartilhe seu link. A cada 100 indicações desbloqueia +5 temas e +2 estilos (grátis). Pro desbloqueia tudo.",
      r_desc:"Indicações: copie seu link, compartilhe e acompanhe sua contagem.",
      r_list:["A cada <b>20 indicações</b> adiciona <b>+10</b> inserções diárias.","Inserções diárias afetam o endpoint da extensão <b>/api/random</b> (não o gerador do site).","Compartilhe seu link. A pessoa conecta uma vez. O bônus atualiza automaticamente."],
      wallet_desc:"Pro: remove o limite de 70, desbloqueia todos os temas e estilos e libera geração ilimitada. Wallet-connect completo chega em breve — com foco em segurança. Verificar por assinatura é mais seguro e confiável.",
      w_note:"Plano → token (SOL/USDC/USDT) → conectar wallet → Pay → auto‑verify.",
      w_pay_desc:"A wallet receptora aparece depois de escolher um plano.",
      w_status_desc:"Verificação simples e segura: envie da sua própria wallet e cole a assinatura para verificar.",
      w_status_list:["Não precisa conectar a wallet (menor superfície de ataque).","Funciona com qualquer wallet (você envia e cola a assinatura).","Wallet-connect completo virá depois de revisão de segurança."],
      pro_tools_title:"Ferramentas Pro",
      pro_tools_desc:"Limpe listas, exporte/importe dados e copie um pacote de suporte para ajuda rápida.",
      pro_tools_note:"Somente Pro. Se estiver no Free, faça upgrade para usar esses botões.",
      gm_right:"Como usar GM",
      gn_right:"Como usar GN",
      r_how:"Como funciona",
      w_status:"Sobre pagamentos",
      extthemes_right_desc:"Até 100 skins da extensão e 100 wallpapers. Preview Free: primeiros 10 skins. Unlock +1 com 10 indicações, depois +1 a cada 5. Pro desbloqueia toda a cosmética.",
      extthemes_right_list:[
        "Skins e wallpapers são escolhidos no site e sincronizados com a extensão.",
        "Apenas 1 skin pode ficar ativo por vez.",
        "Pro também remove o limite de 70 linhas e desbloqueia todos os writing styles / preset packs."
      ],
      extthemes_right_title:"Como funcionam os unlocks",
      r_li2b:"Cliques são contados separadamente. Rewards/unlocks usam indicações conectadas.",
      r_li2c:"Promoters: seu free daily cap aumenta automaticamente com indicações (o bônus soma no limite base).",
      r_li4:"Pro desbloqueia tudo instantaneamente.",
      r_note:"Compartilhe seu link de indicação. Quando um novo usuário conecta por ele, seu contador aumenta.",
      r_title:"Indicações",
      themes_right_title:"Guia rápido",
      w_pay_help_list:[
        "Escolha um plano e token (SOL/USDC/USDT).",
        "Conecte o wallet e aprove a transação.",
        "Após auto‑verify, o Pro ativa no seu handle."
      ],
      w_pay_help_title:"Passos de pagamento",
      w_right:"Como funcionam Pro e indicações",
      w_right_desc:"Free permite montar e editar suas listas GM. Pro desbloqueia tudo e remove limites.",
      w_right_list:[
        "<b>Free:</b> monte &amp; edite listas livremente. Daily inserts: <b>70</b>.",
        "<b>Indicações:</b> desbloqueiam temas/skins/packs aos poucos. Detalhes na aba <b>Referrals</b>.",
        "<b>Pro:</b> daily inserts ilimitados, tudo liberado, controles avançados.",
        "<b>Pay:</b> plano → token → conectar wallet → Pay → auto‑verify./solscan → Verify."
      ],
      wp_note:"Wallpaper por aba (Home / GM / Referrals / Themes / Extension Themes / Upgrade Pro). Preview Free: primeiros 10 wallpapers. Unlock +1 com 10 indicações, depois +1 a cada 5, ou Pro.",

    themes_k_walls:"Papéis de parede desbloqueados",

    ext_k_themes:"Temas desbloqueados",

    ext_k_walls:"Papéis de parede desbloqueados",

    ext_k_ref:"Indicações",
},
    it: {
      plan_compare_btn:"Confronta",
      plan_modal_title:"Confronto piani",
      plan_modal_close:"Chiudi",
      plan_modal_desc:"Scegli ciò che ti serve — puoi estendere quando vuoi. Pro sblocca tutto subito.",
      w_activity_title:"La tua attività",
      w_activity_refresh:"Aggiorna",
      w_activity_hint:"Mostra eventi recenti per il tuo handle (pagamenti, referral, upgrade)",
      refCopy:"Copia link",
      refLoad:"Carica stats",

      t_home:"Home",
      t_gm:"GM",
      t_gn:"GN",
      t_ref:"Referral",
      t_themes:"Temi",
      t_extthemes:"Temi estensione",
      t_wallet:"Passa a Pro",
      t_admin:"Admin",
      r_li1:"Copia il tuo link e condividilo.",
      r_li2:"Quando un nuovo utente si connette con il tuo link, il contatore aumenta.",
      r_li3:"I referral sbloccano più cosmetici e preset nel tempo.",

      ui_sub:"",
      home_desc:"Home: connect your X handle, activate a Pro code, and check your daily usage.",
      gm_desc:"",
      gn_desc:"",
      ref_desc:"Рефералы: делись ссылкой. Каждые 20 eligible дают +10 вставок в день (Promoter 50+ = +12 за 20). Pro открывает всё.",
      wallet_desc:"Upgrade Pro: rimuove il limite 70 e sblocca tutti i cosmetici (Themes, Styles, skin & wallpaper dell’estensione). Pagamento su Solana con SOL / USDC / USDT. Verifica automatica on‑chain.", w_pay_desc:"Seleziona un piano per abilitare il pagamento.", w_status_desc:"Dopo l’approvazione nel wallet, verifichiamo automaticamente on‑chain.", w_status_list:["Scegli piano e token.", "Collega il wallet (Solflare, Phantom, Backpack, ecc.).", "Approva la transazione — auto‑verify."], r_list:["Every <b>20 referrals</b> adds <b>+10</b> daily inserts.","Daily inserts affect the extension endpoint <b>/api/random</b> (not the site generator).","Share your link. People connect once. Bonus updates automatically."],
      themes_title:"Temi",
      themes_note:"Themes change the look of the app. Wallpapers and backgrounds change the vibe. Some items are locked in Free.",
      themes_rules:"Free: 5 themes + 5 writing styles. Every 100 referrals unlocks +5 themes and +2 styles. Pro unlocks everything and removes the 70-line cap.",
      themes_pick_title:"Pick a theme",
      themes_pick_note:"Click any unlocked theme to apply it instantly.",
      t_home:"Home",
      t_gm:"GM",
      t_gn:"GN",
      t_studio:"Studio",
      t_packs:"Packs",
      t_bulk:"Bulk",
      t_history:"History",
      t_favorites:"Favorites",
      t_ref:"Referrals",
      t_themes:"Temi",
      t_wallet:"Sblocca Pro",
      t_admin:"Admin",
      btnConnect:"Connetti",
      xHandle_ph:"@il_tuo_handle",
      redeemCode_ph:"Codice di attivazione",
      gmNewLine_ph:"Scrivi la tua riga…",
      gmFilter_ph:"Filtra righe salvate…",
      gmPaste_ph:"Incolla righe...",
      gnNewLine_ph:"Scrivi la tua riga…",
      gnFilter_ph:"Filtra righe salvate…",
      gnPaste_ph:"Incolla righe...",
      w_wallet_ph:"Seleziona prima un piano",
      w_sig_ph:"Incolla qui...",
      adminSecret_ph:"ADMIN_SECRET (opzionale)",
      xHandle_ph:"@dein_handle",
      redeemCode_ph:"Aktivierungscode",
      gmNewLine_ph:"Eigene Zeile eingeben…",
      gmFilter_ph:"Gespeicherte Zeilen filtern…",
      gmPaste_ph:"Zeilen einfügen...",
      gnNewLine_ph:"Eigene Zeile eingeben…",
      gnFilter_ph:"Gespeicherte Zeilen filtern…",
      gnPaste_ph:"Zeilen einfügen...",
      w_wallet_ph:"Wähle zuerst einen Plan",
      w_sig_ph:"Hier einfügen...",
      adminSecret_ph:"ADMIN_SECRET (optional)",
      xHandle_ph:"@votre_handle",
      redeemCode_ph:"Code d’activation",
      gmNewLine_ph:"Tapez votre propre ligne…",
      gmFilter_ph:"Filtrer les lignes sauvegardées…",
      gmPaste_ph:"Collez des lignes...",
      gnNewLine_ph:"Tapez votre propre ligne…",
      gnFilter_ph:"Filtrer les lignes sauvegardées…",
      gnPaste_ph:"Collez des lignes...",
      w_wallet_ph:"Choisissez un plan d’abord",
      w_sig_ph:"Collez ici...",
      adminSecret_ph:"ADMIN_SECRET (optionnel)",
      xHandle_ph:"@seu_handle",
      redeemCode_ph:"Código de ativação",
      gmNewLine_ph:"Digite sua própria linha…",
      gmFilter_ph:"Filtrar linhas salvas…",
      gmPaste_ph:"Cole linhas...",
      gnNewLine_ph:"Digite sua própria linha…",
      gnFilter_ph:"Filtrar linhas salvas…",
      gnPaste_ph:"Cole linhas...",
      w_wallet_ph:"Selecione um plano primeiro",
      w_sig_ph:"Cole aqui...",
      adminSecret_ph:"ADMIN_SECRET (opcional)",
      xHandle_ph:"@tu_handle",
      redeemCode_ph:"Código de activación",
      gmNewLine_ph:"Escribe tu propia línea…",
      gmFilter_ph:"Filtrar líneas guardadas…",
      gmPaste_ph:"Pega líneas...",
      gnNewLine_ph:"Escribe tu propia línea…",
      gnFilter_ph:"Filtrar líneas guardadas…",
      gnPaste_ph:"Pega líneas...",
      w_wallet_ph:"Primero elige un plan",
      w_sig_ph:"Pega aquí...",
      adminSecret_ph:"ADMIN_SECRET (opcional)",
      btnReset:"Reset locale",
      btnExt:"Get extension",
      btnRedeem:"Riscatta codice",
      gmViewGlobal:"Globale",
      gmViewLang:"Per lingua",
      gmRand1:"Casuale 1",
      gmRand10:"Casuale 10",
      gmRand70:"Casuale 70",
      gmAddLine:"+ Aggiungi riga",
      gmClear:"Pulisci",
      gmPasteAdd:"Incolla e aggiungi",
      gnViewGlobal:"Global list",
      gnViewLang:"Language list",
      gnRand1:"Random 1",
      gnRand10:"Random 10",
      gnRand70:"Random 70",
      gnAddLine:"+ Add line",
      gnClear:"Clear view",
      gnPasteAdd:"Paste & add",
      refLoad:"Carica statistiche",
      refCopy:"Copia link",
      w_verify:"Verifica pagamento",
      w_refresh:"Aggiorna stato",
      adminStats:"Refresh stats",
      adminGen:"Generate code",
      adminList:"List codes",
      gm_style_label:"Stile",
      gn_style_label:"Stile",
      ui_site_lang:"Lingua",
      themes_desc:"I temi cambiano la UI. Wallpapers e sfondi cambiano il look. Alcuni elementi sono bloccati in Free. Pro sblocca tutto.",
      customBg_title:"Sfondo personalizzato",
      customBg_note:"Solo Pro. Carica un’immagine e la adattiamo automaticamente a qualsiasi schermo (mobile/desktop). Poi verrà sincronizzata con l’estensione.",
      customBg_label:"Carica immagine",
      customBg_remove:"Rimuovi",
      themes_right:"Info Temi",
      themes_right_desc:"Usa Temi per cambiare l’aspetto dell’app. Wallpapers e sfondi danno l’atmosfera.",
      themes_right_list:[
        "Scegli un tema sbloccato a sinistra.",
        "Wallpapers e sfondi si applicano subito.",
        "In Free alcune cose sono bloccate. Pro sblocca tutto e rimuove il limite di 70 righe.",
        "Gli sfondi personalizzati (Pro) sono auto‑fit e in futuro si sincronizzeranno con l’estensione."
      ],
      h_safe:"Sicurezza: rispondere troppo velocemente su X può attivare limiti. Usa con attenzione.",
      gm_desc:"",
      gm_note:"",
      gm_right_desc:"Mantieni una lista pulita così l’estensione inserisce risposte naturali subito.",
      gm_right_list:["<b>Global</b> è universale.","<b>Questa lingua</b> crea una lista dedicata per la lingua selezionata.","<b>Random 1</b> aggiunge una nuova riga.","<b>Random 10/70</b> aggiunge più righe nuove.","<b>Modifica liberamente</b>: clicca una riga e scrivi il tuo testo.","Se arrivi a 70/70, rimuovi alcune righe per aggiungerne di nuove (la modifica è illimitata)."],
      gn_desc:"",
      gn_note:"",
      gn_right_desc:"Mantieni una lista pulita così l’estensione inserisce risposte naturali subito.",
      gn_right_list:["<b>Global</b> funziona ovunque.","<b>Questa lingua</b> mantiene una lista GN dedicata per lingua.","<b>Random 1/10/70</b> aggiunge righe nuove alla vista attiva.","<b>Modifica liberamente</b>: aggiorna qualsiasi riga quando vuoi.","Il cap 70 nel Free vale su tutte le liste GN."],
      ref_desc:"Referral: condividi il link. Ogni 100 referral sblocca +5 temi e +2 stili (gratis). Pro sblocca tutto.",
      r_desc:"Referral: copia il link, condividi e controlla il conteggio.",
      r_list:["Ogni <b>20 referral</b> aggiunge <b>+10</b> inserimenti giornalieri.","Gli inserimenti giornalieri riguardano l’endpoint extension <b>/api/random</b> (non il generatore del sito).","Condividi il link. Le persone collegano una volta. Il bonus si aggiorna automaticamente."],
      wallet_desc:"Upgrade Pro: rimuove il limite 70 e sblocca tutti i cosmetici (Themes, Styles, skin & wallpaper dell’estensione). Pagamento su Solana con SOL / USDC / USDT. Verifica automatica on‑chain.",
      w_note:"Piano → token (SOL/USDC/USDT) → collega wallet → Pay → auto‑verify.",
      w_pay_desc:"Il wallet destinatario apparirà dopo la scelta del piano.",
      w_status_desc:"Dopo l’approvazione nel wallet, verifichiamo automaticamente on‑chain.",
      w_status_list:["Scegli piano e token.", "Collega il wallet (Solflare, Phantom, Backpack, ecc.).", "Approva la transazione — auto‑verify."],
      pro_tools_title:"Strumenti Pro",
      pro_tools_desc:"Pulisci le liste, esporta/importa dati e copia un support bundle per aiuto rapido.",
      pro_tools_note:"Solo Pro. In Free fai upgrade a Pro per usare questi pulsanti.",
      gm_right:"Come usare GM",
      gn_right:"Come usare GN",
      r_how:"Come funziona",
      w_status:"Pagamenti",
      extthemes_right_desc:"Fino a 100 skin dell’estensione e 100 wallpapers. Anteprima Free: prime 10 skin. Unlock +1 a 10 referral, poi +1 ogni 5. Pro sblocca tutta la cosmetica.",
      extthemes_right_list:[
        "Skin e wallpapers si scelgono dal sito e si sincronizzano con l’estensione.",
        "Può essere attiva solo 1 skin alla volta.",
        "Pro rimuove anche il limite di 70 righe e sblocca tutti i writing styles / preset packs."
      ],
      extthemes_right_title:"Come funzionano gli unlock",
      r_li2b:"I click sono tracciati separatamente. Rewards/unlock usano referral connessi.",
      r_li2c:"Promoters: il tuo free daily cap aumenta automaticamente con i referral (il bonus si aggiunge al limite base).",
      r_li4:"Pro sblocca tutto istantaneamente.",
      r_note:"Condividi il tuo link referral. Quando un nuovo utente si connette tramite il link, il contatore aumenta.",
      r_title:"Referral",
      themes_right_title:"Guida rapida",
      w_pay_help_list:[
        "Scegli un piano e token (SOL/USDC/USDT).",
        "Collega il wallet e approva la transazione.",
        "Dopo auto‑verify, Pro si attiva per il tuo handle."
      ],
      w_pay_help_title:"Passaggi di pagamento",
      w_right:"Come funzionano Pro e referral",
      w_right_desc:"Free ti permette di creare e modificare le liste GM. Pro sblocca tutto e rimuove i limiti.",
      w_right_list:[
        "<b>Free:</b> crea &amp; modifica liberamente. Daily inserts: <b>70</b>.",
        "<b>Referral:</b> sbloccano temi/skin/pacchetti gradualmente. Dettagli nella tab <b>Referrals</b>.",
        "<b>Pro:</b> daily inserts illimitati, tutto sbloccato, controlli avanzati.",
        "<b>Pay:</b> piano → token → collega wallet → Pay → auto‑verify. → Verify."
      ],
      wp_note:"Wallpaper per tab (Home / GM / Referrals / Themes / Extension Themes / Upgrade Pro). Anteprima Free: primi 10 wallpapers. Unlock +1 a 10 referral, poi +1 ogni 5, oppure Pro.",

    themes_k_walls:"Sfondi sbloccati",

    ext_k_themes:"Temi sbloccati",

    ext_k_walls:"Sfondi sbloccati",

    ext_k_ref:"Referral",
},
    nl: {
      plan_compare_btn:"Vergelijken",
      plan_modal_title:"Abonnementen vergelijken",
      plan_modal_close:"Sluiten",
      plan_modal_desc:"Kies wat je nodig hebt — je kunt altijd verlengen. Pro ontgrendelt alles meteen.",
      w_activity_title:"Jouw activiteit",
      w_activity_refresh:"Vernieuwen",
      w_activity_hint:"Toont recente events voor je handle (betalingen, referrals, upgrades)",
      refCopy:"Link kopiëren",
      refLoad:"Stats laden",

      t_home:"Home",
      t_gm:"GM",
      t_gn:"GN",
      t_ref:"Verwijzingen",
      t_themes:"Thema’s",
      t_extthemes:"Extensie-thema’s",
      t_wallet:"Upgrade Pro",
      t_admin:"Admin",
      r_li1:"Kopieer je link en deel hem.",
      r_li2:"Als een nieuwe gebruiker via je link verbindt, stijgt je teller.",
      r_li3:"Referrals ontgrendelen na verloop van tijd meer cosmetics en presets.",

      ui_sub:"",
      home_desc:"Home: connect your X handle, activate a Pro code, and check your daily usage.",
      gm_desc:"",
      gn_desc:"",
      ref_desc:"Рефералы: делись ссылкой. Каждые 20 eligible дают +10 вставок в день (Promoter 50+ = +12 за 20). Pro открывает всё.",
      wallet_desc:"Upgrade Pro: verwijdert de 70‑limiet en ontgrendelt alle cosmetics (Themes, Styles, Extension skins & wallpapers). Betalen op Solana met SOL / USDC / USDT. Automatisch on‑chain geverifieerd.", w_pay_desc:"Kies eerst een plan om te betalen.", w_status_desc:"Na goedkeuring in je wallet verifiëren we automatisch on‑chain.", w_status_list:["Kies plan en token.", "Verbind je wallet (Solflare, Phantom, Backpack, etc.).", "Keur de transactie goed — auto‑verify."], r_list:["Every <b>20 referrals</b> adds <b>+10</b> daily inserts.","Daily inserts affect the extension endpoint <b>/api/random</b> (not the site generator).","Share your link. People connect once. Bonus updates automatically."],
      themes_title:"Thema’s",
      themes_note:"Themes change the look of the app. Wallpapers and backgrounds change the vibe. Some items are locked in Free.",
      themes_rules:"Free: 5 themes + 5 writing styles. Every 100 referrals unlocks +5 themes and +2 styles. Pro unlocks everything and removes the 70-line cap.",
      themes_pick_title:"Pick a theme",
      themes_pick_note:"Click any unlocked theme to apply it instantly.",
      t_home:"Home",
      t_gm:"GM",
      t_gn:"GN",
      t_studio:"Studio",
      t_packs:"Packs",
      t_bulk:"Bulk",
      t_history:"History",
      t_favorites:"Favorites",
      t_ref:"Referrals",
      t_themes:"Thema's",
      t_wallet:"Pro ontgrendelen",
      t_admin:"Admin",
      btnConnect:"Koppelen",
      xHandle_ph:"@jouw_handle",
      redeemCode_ph:"Activatiecode",
      gmNewLine_ph:"Typ je eigen regel…",
      gmFilter_ph:"Filter opgeslagen regels…",
      gmPaste_ph:"Plak regels...",
      gnNewLine_ph:"Typ je eigen regel…",
      gnFilter_ph:"Filter opgeslagen regels…",
      gnPaste_ph:"Plak regels...",
      w_wallet_ph:"Kies eerst een plan",
      w_sig_ph:"Plak hier...",
      adminSecret_ph:"ADMIN_SECRET (optioneel)",
      btnReset:"Lokale reset",
      btnExt:"Get extension",
      btnRedeem:"Code activeren",
      gmViewGlobal:"Globaal",
      gmViewLang:"Per taal",
      gmRand1:"Random 1",
      gmRand10:"Random 10",
      gmRand70:"Random 70",
      gmAddLine:"+ Regel toevoegen",
      gmClear:"Wissen",
      gmPasteAdd:"Plakken en toevoegen",
      gnViewGlobal:"Global list",
      gnViewLang:"Language list",
      gnRand1:"Random 1",
      gnRand10:"Random 10",
      gnRand70:"Random 70",
      gnAddLine:"+ Add line",
      gnClear:"Clear view",
      gnPasteAdd:"Paste & add",
      refLoad:"Statistieken laden",
      refCopy:"Link kopiëren",
      w_verify:"Betaling verifiëren",
      w_refresh:"Status vernieuwen",
      adminStats:"Refresh stats",
      adminGen:"Generate code",
      adminList:"List codes",
      gm_style_label:"Schrijfstijl",
      gn_style_label:"Schrijfstijl",
      ui_site_lang:"Taal",
      themes_desc:"Thema’s veranderen de UI. Wallpapers en achtergronden veranderen de vibe. Sommige items zijn vergrendeld in Free. Pro unlockt alles.",
      customBg_title:"Aangepaste achtergrond",
      customBg_note:"Alleen Pro. Upload een afbeelding en we passen die automatisch aan voor elk scherm (mobiel/desktop). Later sync met de extensie.",
      customBg_label:"Upload afbeelding",
      customBg_remove:"Verwijderen",
      themes_right:"Over thema’s",
      themes_right_desc:"Gebruik Thema’s om de look van de app te veranderen. Wallpapers en achtergronden zetten de vibe.",
      themes_right_list:[
        "Kies links een ontgrendeld thema.",
        "Wallpapers en achtergronden worden direct toegepast.",
        "In Free zijn sommige items locked. Pro unlockt alles en verwijdert de 70‑regels limiet.",
        "Custom backgrounds (Pro) zijn auto‑fit en syncen later naar de extensie."
      ],
      h_safe:"Veiligheid: te snel reageren op X kan limieten triggeren. Gebruik verstandig.",
      gm_desc:"",
      gm_note:"",
      gm_right_desc:"Houd je lijst clean zodat de extensie direct natuurlijke replies kan invoegen.",
      gm_right_list:["<b>Global</b> is universeel.","<b>Deze taal</b> maakt een lijst voor de gekozen taal.","<b>Random 1</b> voegt één nieuwe regel toe.","<b>Random 10/70</b> voegt meerdere nieuwe regels toe.","<b>Vrij bewerken</b>: klik een regel en typ je eigen tekst.","Als 70 vol is, <b>vervangen</b> nieuwe regels oude automatisch."],
      gn_desc:"",
      gn_note:"",
      gn_right_desc:"Houd je lijst clean zodat de extensie direct natuurlijke replies kan invoegen.",
      gn_right_list:["<b>Global</b> werkt overal.","<b>Deze taal</b> houdt een aparte GN-lijst per taal.","<b>Random 1/10/70</b> voegt nieuwe regels toe.","<b>Vrij bewerken</b>: pas elke regel altijd aan.","Free cap 70 geldt over alle GN-lijsten."],
      ref_desc:"Referrals: deel je link. Elke 100 referrals ontgrendelt +5 themes en +2 styles (gratis). Pro ontgrendelt alles.",
      r_desc:"Referrals: kopieer je link, deel en volg je teller.",
      r_list:["Elke <b>20 referrals</b> geeft <b>+10</b> inserts per dag.","Daily inserts gelden voor de extension endpoint <b>/api/random</b> (niet de site generator).","Deel je link. Mensen koppelen één keer. Bonus update automatisch."],
      wallet_desc:"Pro: verwijdert de 70-cap, ontgrendelt alle themes & styles en geeft onbeperkte generatie. Volledige wallet-connect komt later — bewust voorzichtig voor security. Verify via signature is veiliger en betrouwbaar.",
      w_note:"Plan kiezen → token (SOL/USDC/USDT) → wallet verbinden → Pay → auto‑verify.",
      w_pay_desc:"Receiver wallet verschijnt na het kiezen van een plan.",
      w_status_desc:"Simpel & veilig: je stuurt vanuit je eigen wallet en plakt de signature ter verificatie.",
      w_status_list:["Geen wallet-connection nodig (kleiner aanvalsvlak).","Werkt met elke wallet (je plakt de signature).","Volledige wallet-connect na security review."],
      pro_tools_title:"Pro tools",
      pro_tools_desc:"Maak lijsten schoon, exporteer/importeer data en kopieer een support bundle voor snelle hulp.",
      pro_tools_note:"Alleen Pro. In Free moet je upgraden om deze knoppen te gebruiken.",
      gm_right:"GM gebruiken",
      gn_right:"GN gebruiken",
      r_how:"Hoe het werkt",
      w_status:"Betalingen",
      extthemes_right_desc:"Tot 100 extension skins en 100 wallpapers. Free preview: eerste 10 skins. Unlock +1 bij 10 referrals, daarna +1 elke 5. Pro unlockt alle cosmetics.",
      extthemes_right_list:[
        "Skins en wallpapers kies je op de site en worden gesynchroniseerd naar de extension.",
        "Er kan maar 1 skin tegelijk actief zijn.",
        "Pro verwijdert ook de 70‑regels cap en unlockt alle writing styles / preset packs."
      ],
      extthemes_right_title:"Hoe unlocks werken",
      r_li2b:"Clicks tellen we apart. Rewards/unlocks gebruiken connected referrals.",
      r_li2c:"Promoters: je free daily cap stijgt automatisch met referrals (bonus wordt bij je basislimiet opgeteld).",
      r_li4:"Pro unlockt alles meteen.",
      r_note:"Deel je referral-link. Als een nieuwe gebruiker via jouw link connect, gaat je teller omhoog.",
      r_title:"Referrals",
      themes_right_title:"Snelle uitleg",
      w_pay_help_list:[
        "Kies een plan en token (SOL/USDC/USDT).",
        "Verbind je wallet en keur de transactie goed.",
        "Na auto‑verify activeert Pro voor je handle."
      ],
      w_pay_help_title:"Betalingsstappen",
      w_right:"Hoe Pro & referrals werken",
      w_right_desc:"Free: je kunt je GM-lijsten bouwen en bewerken. Pro unlockt alles en verwijdert limieten.",
      w_right_list:[
        "<b>Free:</b> lijsten vrij bouwen &amp; bewerken. Daily inserts: <b>70</b>.",
        "<b>Referrals:</b> unlocken geleidelijk themes/skins/packs. Details in tab <b>Referrals</b>.",
        "<b>Pro:</b> onbeperkte daily inserts, alles unlocked, advanced controls.",
        "<b>Pay:</b> select a plan → choose token → connect wallet → Pay → auto-verify."
      ],
      wp_note:"Wallpaper per tab (Home / GM / Referrals / Themes / Extension Themes / Upgrade Pro). Free preview: eerste 10 wallpapers. Unlock +1 bij 10 referrals, daarna +1 elke 5, of Pro.",

    themes_k_walls:"Ontgrendelde achtergronden",

    ext_k_themes:"Ontgrendelde thema’s",

    ext_k_walls:"Ontgrendelde achtergronden",

    ext_k_ref:"Referrals",
},
    tr: {
      plan_compare_btn:"Karşılaştır",
      plan_modal_title:"Plan karşılaştırma",
      plan_modal_close:"Kapat",
      plan_modal_desc:"İhtiyacını seç — istediğin zaman uzatabilirsin. Pro her şeyi anında açar.",
      w_activity_title:"Aktiviten",
      w_activity_refresh:"Yenile",
      w_activity_hint:"Handle’ın için son olayları gösterir (ödemeler, referanslar, yükseltmeler)",
      refCopy:"Linki kopyala",
      refLoad:"İstatistik yükle",

      t_home:"Ana sayfa",
      t_gm:"GM",
      t_gn:"GN",
      t_ref:"Referanslar",
      t_themes:"Temalar",
      t_extthemes:"Eklenti temaları",
      t_wallet:"Pro yükselt",
      t_admin:"Yönetici",
      r_li1:"Bağlantını kopyala ve paylaş.",
      r_li2:"Yeni biri senin linkinle bağlanınca sayacın artar.",
      r_li3:"Referanslar zamanla daha fazla kozmetik ve preset’in kilidini açar.",

      ui_sub:"",
      home_desc:"Home: connect your X handle, activate a Pro code, and check your daily usage.",
      gm_desc:"",
      gn_desc:"",
      ref_desc:"Рефералы: делись ссылкой. Каждые 20 eligible дают +10 вставок в день (Promoter 50+ = +12 за 20). Pro открывает всё.",
      wallet_desc:"Upgrade Pro: 70 limitini kaldırır ve tüm kozmetikleri açar (Themes, Styles, Extension skin & wallpaper). Solana’da SOL / USDC / USDT ile ödeme. Otomatik on‑chain doğrulama.", w_pay_desc:"Ödeme için önce plan seç.", w_status_desc:"Wallet’ta onayladıktan sonra işlemi otomatik olarak on‑chain doğrularız.", w_status_list:["Plan ve token seç.", "Wallet bağla (Solflare, Phantom, Backpack, vb.).", "İşlemi onayla — auto‑verify."], r_list:["Every <b>20 referrals</b> adds <b>+10</b> daily inserts.","Daily inserts affect the extension endpoint <b>/api/random</b> (not the site generator).","Share your link. People connect once. Bonus updates automatically."],
      themes_title:"Temalar",
      themes_note:"Themes change the look of the app. Wallpapers and backgrounds change the vibe. Some items are locked in Free.",
      themes_rules:"Free: 5 themes + 5 writing styles. Every 100 referrals unlocks +5 themes and +2 styles. Pro unlocks everything and removes the 70-line cap.",
      themes_pick_title:"Pick a theme",
      themes_pick_note:"Click any unlocked theme to apply it instantly.",
      t_home:"Home",
      t_gm:"GM",
      t_gn:"GN",
      t_studio:"Studio",
      t_packs:"Packs",
      t_bulk:"Bulk",
      t_history:"History",
      t_favorites:"Favorites",
      t_ref:"Referrals",
      t_themes:"Temalar",
      t_wallet:"Pro Aç",
      t_admin:"Admin",
      btnConnect:"Bağlan",
      xHandle_ph:"@kullanici_adin",
      redeemCode_ph:"Aktivasyon kodu",
      gmNewLine_ph:"Kendi satırını yaz…",
      gmFilter_ph:"Kaydedilen satırları filtrele…",
      gmPaste_ph:"Satırları yapıştır...",
      gnNewLine_ph:"Kendi satırını yaz…",
      gnFilter_ph:"Kaydedilen satırları filtrele…",
      gnPaste_ph:"Satırları yapıştır...",
      w_wallet_ph:"Önce bir plan seç",
      w_sig_ph:"Buraya yapıştır...",
      adminSecret_ph:"ADMIN_SECRET (isteğe bağlı)",
      btnReset:"Yerel sıfırla",
      btnExt:"Get extension",
      btnRedeem:"Kodu kullan",
      gmViewGlobal:"Genel",
      gmViewLang:"Dile göre",
      gmRand1:"Random 1",
      gmRand10:"Random 10",
      gmRand70:"Random 70",
      gmAddLine:"+ Satır ekle",
      gmClear:"Temizle",
      gmPasteAdd:"Yapıştır & ekle",
      gnViewGlobal:"Global list",
      gnViewLang:"Language list",
      gnRand1:"Random 1",
      gnRand10:"Random 10",
      gnRand70:"Random 70",
      gnAddLine:"+ Add line",
      gnClear:"Clear view",
      gnPasteAdd:"Paste & add",
      refLoad:"İstatistikleri yükle",
      refCopy:"Bağlantıyı kopyala",
      w_verify:"Ödemeyi doğrula",
      w_refresh:"Durumu yenile",
      adminStats:"Refresh stats",
      adminGen:"Generate code",
      adminList:"List codes",
      gm_style_label:"Yazım stili",
      gn_style_label:"Yazım stili",
      ui_site_lang:"Dil",
      themes_desc:"Temalar arayüzü değiştirir. Duvar kâğıtları ve arka planlar görünümü değiştirir. Bazı öğeler Free’de kilitlidir. Pro hepsini açar.",
      customBg_title:"Özel arka plan",
      customBg_note:"Sadece Pro. Görsel yükle, tüm ekranlara otomatik uydururuz (mobil/desktop). Sonra eklentiyle senkronlanır.",
      customBg_label:"Görsel yükle",
      customBg_remove:"Kaldır",
      themes_right:"Temalar hakkında",
      themes_right_desc:"Uygulamanın görünümünü Temalar ile değiştir. Duvar kâğıtları ve arka planlar vibe’ı belirler.",
      themes_right_list:[
        "Solda kilidi açık bir tema seç.",
        "Duvar kâğıtları ve arka planlar anında uygulanır.",
        "Free’de bazı öğeler kilitli. Pro hepsini açar ve 70 satır limitini kaldırır.",
        "Özel arka planlar (Pro) auto‑fit ve daha sonra eklentiye senkronlanır."
      ],
      h_safe:"Güvenlik: X’te çok hızlı yanıt vermek limitlere takılabilir. Dikkatli kullan.",
      gm_desc:"",
      gm_note:"",
      gm_right_desc:"Listeyi temiz tut; uzantı anında doğal yanıt ekleyebilsin.",
      gm_right_list:["<b>Global</b> evrenseldir.","<b>Bu dil</b> seçili dil için liste oluşturur.","<b>Random 1</b> tek yeni satır ekler.","<b>Random 10/70</b> birden çok satır ekler.","<b>Serbest düzenle</b>: satıra tıkla ve kendi metnini yaz.","70 doluysa yeni satırlar <b>eskilerin yerine geçer</b>."],
      gn_desc:"",
      gn_note:"",
      gn_right_desc:"Listeyi temiz tut; uzantı anında doğal yanıt ekleyebilsin.",
      gn_right_list:["<b>Global</b> her yerde çalışır.","<b>Bu dil</b> dil bazlı GN listesi tutar.","<b>Random 1/10/70</b> aktif görünüme yeni satır ekler.","<b>Serbest düzenle</b>: istediğin zaman satır değiştir.","Free 70 cap tüm GN listeleri için geçerli."],
      ref_desc:"Referrals: linkini paylaş. Her 100 referral +5 tema ve +2 stil açar (ücretsiz). Pro hepsini açar.",
      r_desc:"Referrals: linkini kopyala, paylaş ve sayacı takip et.",
      r_list:["Her <b>20 referral</b> <b>+10</b> günlük insert ekler.","Daily insert, uzantı endpoint’i <b>/api/random</b> içindir (site jeneratörü değil).","Linki paylaş. İnsanlar bir kez bağlanır. Bonus otomatik güncellenir."],
      wallet_desc:"Pro: 70 cap’i kaldırır, tüm temaları & stilleri açar ve sınırsız üretim verir. Tam wallet-connect yakında — güvenlik için dikkatli gidiyoruz. Signature ile doğrulama daha güvenli ve stabil.",
      w_note:"Plan → token (SOL/USDC/USDT) → wallet bağla → Pay → auto‑verify.",
      w_pay_desc:"Alıcı cüzdan plan seçildikten sonra görünür.",
      w_status_desc:"Basit & güvenli: kendi cüzdanından gönderip signature’ı yapıştırırsın.",
      w_status_list:["Wallet bağlama yok (daha düşük risk).","Her wallet ile çalışır (signature’ı yapıştırırsın).","Tam wallet-connect güvenlik incelemesinden sonra."],
      pro_tools_title:"Pro araçları",
      pro_tools_desc:"Listeleri temizle, verini dışa/İçe aktar ve hızlı destek için support bundle kopyala.",
      pro_tools_note:"Sadece Pro. Free’de bu butonlar için Pro’ya yükselt.",
      gm_right:"GM nasıl kullanılır",
      gn_right:"GN nasıl kullanılır",
      r_how:"Nasıl çalışır",
      w_status:"Ödemeler hakkında",
      extthemes_right_desc:"100’e kadar extension skin ve 100 duvar kâğıdı. Free önizleme: ilk 10 skin. Unlock +1 (10 referans), sonra her 5’te +1. Pro tüm kozmetiği açar.",
      extthemes_right_list:[
        "Skin ve duvar kâğıtları siteden seçilir ve extension’a senkronlanır.",
        "Aynı anda sadece 1 skin aktif olabilir.",
        "Pro ayrıca 70 satır limitini kaldırır ve tüm writing styles / preset packs’i açar."
      ],
      extthemes_right_title:"Unlock’lar nasıl çalışır",
      r_li2b:"Tıklamalar ayrı sayılır. Rewards/unlocks connected referrals ile hesaplanır.",
      r_li2c:"Promoters: free daily cap referanslarla otomatik artar (bonus base limite eklenir).",
      r_li4:"Pro her şeyi anında açar.",
      r_note:"Referans linkini paylaş. Yeni bir kullanıcı linkle bağlanınca sayacın artar.",
      r_title:"Referanslar",
      themes_right_title:"Hızlı rehber",
      w_pay_help_list:[
        "Plan ve token seç (SOL/USDC/USDT).",
        "Wallet bağla ve işlemi onayla.",
        "Auto‑verify sonrası Pro handle’ında aktif olur."
      ],
      w_pay_help_title:"Ödeme adımları",
      w_right:"Pro ve referanslar",
      w_right_desc:"Free: GM listelerini oluşturup düzenleyebilirsin. Pro her şeyi açar ve limitleri kaldırır.",
      w_right_list:[
        "<b>Free:</b> listeleri özgürce oluştur &amp; düzenle. Daily inserts: <b>70</b>.",
        "<b>Referanslar:</b> temaları/skinleri/paketleri kademeli açar. Detaylar <b>Referrals</b> sekmesinde.",
        "<b>Pro:</b> sınırsız daily inserts, her şey açık, gelişmiş kontroller.",
        "<b>Pay:</b> select a plan → choose token → connect wallet → Pay → auto-verify."
      ],
      wp_note:"Sekme başına duvar kâğıdı (Home / GM / Referrals / Themes / Extension Themes / Upgrade Pro). Free önizleme: ilk 10 duvar kâğıdı. Unlock +1 (10 referans), sonra her 5’te +1 veya Pro.",

    themes_k_walls:"Kilidi açılmış duvar kâğıtları",

    ext_k_themes:"Kilidi açılmış temalar",

    ext_k_walls:"Kilidi açılmış duvar kâğıtları",

    ext_k_ref:"Referanslar",
},
    pl: {
      plan_compare_btn:"Porównaj",
      plan_modal_title:"Porównanie planów",
      plan_modal_close:"Zamknij",
      plan_modal_desc:"Wybierz, czego potrzebujesz — możesz przedłużyć w każdej chwili. Pro odblokowuje wszystko od razu.",
      w_activity_title:"Twoja aktywność",
      w_activity_refresh:"Odśwież",
      w_activity_hint:"Pokazuje ostatnie zdarzenia dla Twojego handle (płatności, polecenia, upgrade)",
      refCopy:"Kopiuj link",
      refLoad:"Wczytaj statystyki",

      t_home:"Start",
      t_gm:"GM",
      t_gn:"GN",
      t_ref:"Polecenia",
      t_themes:"Motywy",
      t_extthemes:"Motywy rozszerzenia",
      t_wallet:"Ulepsz do Pro",
      t_admin:"Admin",
      r_li1:"Skopiuj link i udostępnij.",
      r_li2:"Gdy nowy użytkownik połączy się z twojego linku, licznik rośnie.",
      r_li3:"Polecenia odblokowują z czasem więcej dodatków i presetów.",

      ui_sub:"",
      home_desc:"Home: connect your X handle, activate a Pro code, and check your daily usage.",
      gm_desc:"",
      gn_desc:"",
      ref_desc:"Рефералы: делись ссылкой. Каждые 20 eligible дают +10 вставок в день (Promoter 50+ = +12 за 20). Pro открывает всё.",
      wallet_desc:"Upgrade Pro: usuwa limit 70 i odblokowuje wszystkie kosmetyki (Themes, Styles, skiny i tapety w rozszerzeniu). Płatność na Solanie: SOL / USDC / USDT. Automatyczna weryfikacja on‑chain.", w_pay_desc:"Wybierz plan, aby włączyć płatność.", w_status_desc:"Po zatwierdzeniu w portfelu weryfikujemy automatycznie on‑chain.", w_status_list:["Wybierz plan i token.", "Podłącz portfel (Solflare, Phantom, Backpack, itp.).", "Zatwierdź transakcję — auto‑verify."], r_list:["Every <b>20 referrals</b> adds <b>+10</b> daily inserts.","Daily inserts affect the extension endpoint <b>/api/random</b> (not the site generator).","Share your link. People connect once. Bonus updates automatically."],
      themes_title:"Motywy",
      themes_note:"Themes change the look of the app. Wallpapers and backgrounds change the vibe. Some items are locked in Free.",
      themes_rules:"Free: 5 themes + 5 writing styles. Every 100 referrals unlocks +5 themes and +2 styles. Pro unlocks everything and removes the 70-line cap.",
      themes_pick_title:"Pick a theme",
      themes_pick_note:"Click any unlocked theme to apply it instantly.",
      t_home:"Home",
      t_gm:"GM",
      t_gn:"GN",
      t_studio:"Studio",
      t_packs:"Packs",
      t_bulk:"Bulk",
      t_history:"History",
      t_favorites:"Favorites",
      t_ref:"Referrals",
      t_themes:"Motywy",
      t_wallet:"Odblokuj Pro",
      t_admin:"Admin",
      btnConnect:"Połącz",
      xHandle_ph:"@twoj_handle",
      redeemCode_ph:"Kod aktywacji",
      gmNewLine_ph:"Wpisz własną linijkę…",
      gmFilter_ph:"Filtruj zapisane linie…",
      gmPaste_ph:"Wklej linie...",
      gnNewLine_ph:"Wpisz własną linijkę…",
      gnFilter_ph:"Filtruj zapisane linie…",
      gnPaste_ph:"Wklej linie...",
      w_wallet_ph:"Najpierw wybierz plan",
      w_sig_ph:"Wklej tutaj...",
      adminSecret_ph:"ADMIN_SECRET (opcjonalnie)",
      btnReset:"Reset lokalny",
      btnExt:"Get extension",
      btnRedeem:"Aktywuj kod",
      gmViewGlobal:"Globalnie",
      gmViewLang:"Wg języka",
      gmRand1:"Random 1",
      gmRand10:"Random 10",
      gmRand70:"Random 70",
      gmAddLine:"+ Dodaj linię",
      gmClear:"Wyczyść",
      gmPasteAdd:"Wklej i dodaj",
      gnViewGlobal:"Global list",
      gnViewLang:"Language list",
      gnRand1:"Random 1",
      gnRand10:"Random 10",
      gnRand70:"Random 70",
      gnAddLine:"+ Add line",
      gnClear:"Clear view",
      gnPasteAdd:"Paste & add",
      refLoad:"Wczytaj statystyki",
      refCopy:"Kopiuj link",
      w_verify:"Zweryfikuj płatność",
      w_refresh:"Odśwież status",
      adminStats:"Refresh stats",
      adminGen:"Generate code",
      adminList:"List codes",
      gm_style_label:"Styl",
      gn_style_label:"Styl",
      ui_site_lang:"Język",
      themes_desc:"Motywy zmieniają UI. Tapety i tła zmieniają klimat. Część opcji jest zablokowana w Free. Pro odblokowuje wszystko.",
      customBg_title:"Własne tło",
      customBg_note:"Tylko Pro. Wgraj obraz, a my dopasujemy go automatycznie do każdego ekranu (mobile/desktop). Później synchronizacja z rozszerzeniem.",
      customBg_label:"Wgraj obraz",
      customBg_remove:"Usuń",
      themes_right:"O motywach",
      themes_right_desc:"Użyj Motywów, aby zmienić wygląd aplikacji. Tapety i tła ustawiają klimat.",
      themes_right_list:[
        "Wybierz odblokowany motyw po lewej.",
        "Tapety i tła stosują się od razu.",
        "W Free część opcji jest zablokowana. Pro odblokowuje wszystko i usuwa limit 70 linii.",
        "Tła własne (Pro) są auto‑fit i później będą synchronizowane do rozszerzenia."
      ],
      h_safe:"Bezpieczeństwo: zbyt szybkie odpowiadanie na X może włączyć limity. Używaj ostrożnie.",
      gm_desc:"",
      gm_note:"",
      gm_right_desc:"Utrzymuj listę czystą, by rozszerzenie mogło szybko wstawiać naturalne odpowiedzi.",
      gm_right_list:["<b>Global</b> jest uniwersalny.","<b>Ten język</b> tworzy listę dla wybranego języka.","<b>Random 1</b> dodaje jedną nową linię.","<b>Random 10/70</b> dodaje więcej nowych linii.","<b>Edytuj</b>: kliknij linię i wpisz własny tekst.","Gdy cap 70 jest pełny, nowe linie <b>zastępują stare</b> automatycznie."],
      gn_desc:"",
      gn_note:"",
      gn_right_desc:"Utrzymuj listę czystą, by rozszerzenie mogło szybko wstawiać naturalne odpowiedzi.",
      gn_right_list:["<b>Global</b> działa wszędzie.","<b>Ten język</b> trzyma osobną listę GN dla języka.","<b>Random 1/10/70</b> dodaje świeże linie.","<b>Edytuj</b>: zmieniaj linie kiedy chcesz.","Free cap 70 dotyczy wszystkich list GN."],
      ref_desc:"Referrals: udostępnij link. Co 100 referrals odblokowuje +5 tematów i +2 style (darmowe). Pro odblokowuje wszystko.",
      r_desc:"Referrals: skopiuj link, udostępnij i śledź licznik.",
      r_list:["Co <b>20 referrals</b> daje <b>+10</b> dziennych insertów.","Daily inserts dotyczą endpointu rozszerzenia <b>/api/random</b> (nie generatora strony).","Udostępnij link. Ludzie łączą raz. Bonus aktualizuje się automatycznie."],
      wallet_desc:"Pro: usuwa cap 70, odblokowuje wszystkie motywy i style oraz daje nielimitowaną generację. Pełny wallet-connect wkrótce — ostrożnie ze względów bezpieczeństwa. Weryfikacja podpisem jest bezpieczniejsza i stabilna.",
      w_note:"Plan → token (SOL/USDC/USDT) → podłącz portfel → Pay → auto‑verify.",
      w_pay_desc:"Portfel odbiorcy pojawi się po wybraniu planu.",
      w_status_desc:"Prosto i bezpiecznie: wysyłasz ze swojego portfela i wklejasz signature do weryfikacji.",
      w_status_list:["Bez łączenia portfela (mniejsze ryzyko).","Działa z każdym portfelem (wklejasz signature).","Pełny wallet-connect po review bezpieczeństwa."],
      pro_tools_title:"Narzędzia Pro",
      pro_tools_desc:"Czyść listy, eksportuj/importuj dane i skopiuj pakiet wsparcia do szybkiej pomocy.",
      pro_tools_note:"Tylko Pro. W Free musisz przejść na Pro, aby użyć tych przycisków.",
      gm_right:"Jak używać GM",
      gn_right:"Jak używać GN",
      r_how:"Jak to działa",
      w_status:"Płatności",
      extthemes_right_desc:"Do 100 skórek rozszerzenia i 100 tapet. Podgląd Free: pierwsze 10 skórek. Unlock +1 przy 10 referralach, potem +1 co 5. Pro odblokowuje całą kosmetykę.",
      extthemes_right_list:[
        "Skórki i tapety wybierasz na stronie i są synchronizowane do rozszerzenia.",
        "Tylko 1 skórka może być aktywna naraz.",
        "Pro usuwa też limit 70 linii i odblokowuje wszystkie writing styles / preset packs."
      ],
      extthemes_right_title:"Jak działają unlocki",
      r_li2b:"Kliknięcia liczymy osobno. Rewards/unlocks liczą się po connected referrals.",
      r_li2c:"Promoters: free daily cap rośnie automatycznie z referralami (bonus dodaje się do limitu bazowego).",
      r_li4:"Pro odblokowuje wszystko od razu.",
      r_note:"Udostępnij link referral. Gdy nowy użytkownik połączy się przez niego, licznik rośnie.",
      r_title:"Referrale",
      themes_right_title:"Szybki przewodnik",
      w_pay_help_list:[
        "Wybierz plan i token (SOL/USDC/USDT).",
        "Podłącz portfel i zatwierdź transakcję.",
        "Po auto‑verify Pro aktywuje się na twoim handle."
      ],
      w_pay_help_title:"Kroki płatności",
      w_right:"Jak działają Pro i referrale",
      w_right_desc:"Free pozwala budować i edytować listy GM. Pro odblokowuje wszystko i usuwa limity.",
      w_right_list:[
        "<b>Free:</b> buduj &amp; edytuj listy bez ograniczeń. Daily inserts: <b>70</b>.",
        "<b>Referrale:</b> stopniowo odblokowują motywy/skórki/paczki. Szczegóły w zakładce <b>Referrals</b>.",
        "<b>Pro:</b> nielimitowane daily inserts, wszystko odblokowane, zaawansowane opcje.",
        "<b>Pay:</b> select a plan → choose token → connect wallet → Pay → auto-verify."
      ],
      wp_note:"Tapeta per zakładka (Home / GM / Referrals / Themes / Extension Themes / Upgrade Pro). Podgląd Free: pierwsze 10 tapet. Unlock +1 przy 10 referralach, potem +1 co 5 albo Pro.",

    themes_k_walls:"Odblokowane tapety",

    ext_k_themes:"Odblokowane motywy",

    ext_k_walls:"Odblokowane tapety",

    ext_k_ref:"Polecenia",
},
    id: {
      plan_compare_btn:"Bandingkan",
      plan_modal_title:"Perbandingan paket",
      plan_modal_close:"Tutup",
      plan_modal_desc:"Pilih yang kamu butuhkan — bisa perpanjang kapan saja. Pro membuka semuanya langsung.",
      w_activity_title:"Aktivitas kamu",
      w_activity_refresh:"Muat ulang",
      w_activity_hint:"Menampilkan aktivitas terbaru untuk handle kamu (pembayaran, referral, upgrade)",
      refCopy:"Salin tautan",
      refLoad:"Muat statistik",

      t_home:"Beranda",
      t_gm:"GM",
      t_gn:"GN",
      t_ref:"Referral",
      t_themes:"Tema",
      t_extthemes:"Tema Ekstensi",
      t_wallet:"Upgrade Pro",
      t_admin:"Admin",
      r_li1:"Salin tautanmu dan bagikan.",
      r_li2:"Saat pengguna baru terhubung lewat tautanmu, hitungan referral bertambah.",
      r_li3:"Referral membuka lebih banyak kosmetik dan preset seiring waktu.",

      ui_sub:"",
      home_desc:"Home: connect your X handle, activate a Pro code, and check your daily usage.",
      gm_desc:"",
      gn_desc:"",
      ref_desc:"Рефералы: делись ссылкой. Каждые 20 eligible дают +10 вставок в день (Promoter 50+ = +12 за 20). Pro открывает всё.",
      wallet_desc:"Upgrade Pro: hilangkan limit 70 dan unlock semua kosmetik (Themes, Styles, skin & wallpaper extension). Bayar di Solana dengan SOL / USDC / USDT. Auto‑verify on‑chain.", w_pay_desc:"Pilih plan untuk mulai bayar.", w_status_desc:"Setelah kamu approve di wallet, transaksi diverifikasi otomatis on‑chain.", w_status_list:["Pilih plan dan token.", "Connect wallet (Solflare, Phantom, Backpack, dll.).", "Approve transaksi — auto‑verify."], r_list:["Every <b>20 referrals</b> adds <b>+10</b> daily inserts.","Daily inserts affect the extension endpoint <b>/api/random</b> (not the site generator).","Share your link. People connect once. Bonus updates automatically."],
      themes_title:"Tema",
      themes_note:"Themes change the look of the app. Wallpapers and backgrounds change the vibe. Some items are locked in Free.",
      themes_rules:"Free: 5 themes + 5 writing styles. Every 100 referrals unlocks +5 themes and +2 styles. Pro unlocks everything and removes the 70-line cap.",
      themes_pick_title:"Pick a theme",
      themes_pick_note:"Click any unlocked theme to apply it instantly.",
      t_home:"Home",
      t_gm:"GM",
      t_gn:"GN",
      t_studio:"Studio",
      t_packs:"Packs",
      t_bulk:"Bulk",
      t_history:"History",
      t_favorites:"Favorites",
      t_ref:"Referrals",
      t_themes:"Tema",
      t_wallet:"Buka Pro",
      t_admin:"Admin",
      btnConnect:"Hubungkan",
      xHandle_ph:"@handle_kamu",
      redeemCode_ph:"Kode aktivasi",
      gmNewLine_ph:"Tulis baris kamu…",
      gmFilter_ph:"Saring baris tersimpan…",
      gmPaste_ph:"Tempel baris...",
      gnNewLine_ph:"Tulis baris kamu…",
      gnFilter_ph:"Saring baris tersimpan…",
      gnPaste_ph:"Tempel baris...",
      w_wallet_ph:"Pilih paket dulu",
      w_sig_ph:"Tempel di sini...",
      adminSecret_ph:"ADMIN_SECRET (opsional)",
      btnReset:"Reset lokal",
      btnExt:"Get extension",
      btnRedeem:"Tukar kode",
      gmViewGlobal:"Global",
      gmViewLang:"Per bahasa",
      gmRand1:"Random 1",
      gmRand10:"Random 10",
      gmRand70:"Random 70",
      gmAddLine:"+ Tambah baris",
      gmClear:"Bersihkan",
      gmPasteAdd:"Tempel & tambah",
      gnViewGlobal:"Global list",
      gnViewLang:"Language list",
      gnRand1:"Random 1",
      gnRand10:"Random 10",
      gnRand70:"Random 70",
      gnAddLine:"+ Add line",
      gnClear:"Clear view",
      gnPasteAdd:"Paste & add",
      refLoad:"Muat statistik",
      refCopy:"Salin tautan",
      w_verify:"Verifikasi pembayaran",
      w_refresh:"Segarkan status",
      adminStats:"Refresh stats",
      adminGen:"Generate code",
      adminList:"List codes",
      gm_style_label:"Gaya tulisan",
      gn_style_label:"Gaya tulisan",
      ui_site_lang:"Bahasa",
      themes_desc:"Tema mengubah UI. Wallpaper dan background mengubah vibe. Beberapa item terkunci di Free. Pro membuka semuanya.",
      customBg_title:"Latar belakang kustom",
      customBg_note:"Khusus Pro. Upload gambar dan kami auto-fit untuk semua layar (mobile/desktop). Nanti akan sinkron ke ekstensi.",
      customBg_label:"Upload gambar",
      customBg_remove:"Hapus",
      themes_right:"Tentang Tema",
      themes_right_desc:"Gunakan Tema untuk mengubah tampilan app. Wallpaper dan background menentukan vibe.",
      themes_right_list:[
        "Pilih tema yang sudah terbuka di kiri.",
        "Wallpaper dan background langsung diterapkan.",
        "Di Free, sebagian item terkunci. Pro membuka semuanya dan menghapus limit 70 baris.",
        "Custom background (Pro) auto‑fit dan nanti akan sinkron ke extension."
      ],
      h_safe:"Safety: balas terlalu cepat di X bisa kena rate limit. Pakai dengan bijak.",
      gm_desc:"",
      gm_note:"",
      gm_right_desc:"Jaga list tetap rapi supaya extension bisa insert balasan natural dengan cepat.",
      gm_right_list:["<b>Global</b> universal.","<b>Bahasa ini</b> buat list khusus untuk bahasa yang dipilih.","<b>Random 1</b> tambah 1 baris baru.","<b>Random 10/70</b> tambah beberapa baris baru.","<b>Edit bebas</b>: klik baris lalu ketik teks kamu.","Kalau cap 70 penuh, baris baru <b>mengganti yang lama</b> otomatis."],
      gn_desc:"",
      gn_note:"",
      gn_right_desc:"Jaga list tetap rapi supaya extension bisa insert balasan natural dengan cepat.",
      gn_right_list:["<b>Global</b> bisa dipakai di mana saja.","<b>Bahasa ini</b> simpan list GN khusus per bahasa.","<b>Random 1/10/70</b> tambah baris baru ke view aktif.","<b>Edit bebas</b>: ubah baris kapan saja.","Cap 70 Free berlaku untuk semua list GN."],
      ref_desc:"Referrals: share link kamu. Tiap 100 referrals unlock +5 tema dan +2 style (free). Pro unlock semua.",
      r_desc:"Referrals: copy link, share, dan pantau jumlahnya.",
      r_list:["Setiap <b>20 referrals</b> tambah <b>+10</b> insert harian.","Daily insert berlaku untuk endpoint extension <b>/api/random</b> (bukan generator site).","Share link. Orang connect sekali. Bonus update otomatis."],
      wallet_desc:"Pro: hapus cap 70, unlock semua tema & style, dan unlimited generation. Full wallet-connect segera — kita implement pelan demi keamanan. Verify via signature lebih aman dan stabil.",
      w_note:"Pilih plan → token (SOL/USDC/USDT) → connect wallet → Pay → auto‑verify.",
      w_pay_desc:"Wallet penerima muncul setelah memilih plan.",
      w_status_desc:"Flow aman & simpel: kirim dari wallet kamu lalu paste signature untuk verifikasi.",
      w_status_list:["Tidak perlu connect wallet (lebih aman).","Bekerja dengan wallet apa pun (kamu paste signature).","Full wallet-connect setelah security review."],
      pro_tools_title:"Pro tools",
      pro_tools_desc:"Bersihkan list, export/import data, dan copy support bundle untuk bantuan cepat.",
      pro_tools_note:"Khusus Pro. Free harus upgrade untuk pakai tombol ini.",
      gm_right:"Cara pakai GM",
      gn_right:"Cara pakai GN",
      r_how:"Cara kerja",
      w_status:"Tentang pembayaran",
      extthemes_right_desc:"Hingga 100 skin extension dan 100 wallpaper. Preview Free: 10 skin pertama. Unlock +1 di 10 referral, lalu +1 tiap 5. Pro membuka semua kosmetik.",
      extthemes_right_list:[
        "Skin dan wallpaper dipilih di site dan disinkronkan ke extension.",
        "Hanya 1 skin yang aktif pada satu waktu.",
        "Pro juga menghapus batas 70 baris dan membuka semua writing styles / preset packs."
      ],
      extthemes_right_title:"Cara unlock bekerja",
      r_li2b:"Klik dihitung terpisah. Rewards/unlocks pakai connected referrals.",
      r_li2c:"Promoters: free daily cap naik otomatis dengan referral (bonus ditambahkan ke limit dasar).",
      r_li4:"Pro membuka semuanya instan.",
      r_note:"Bagikan link referral kamu. Saat user baru connect lewat link itu, jumlah referral naik.",
      r_title:"Referral",
      themes_right_title:"Panduan cepat",
      w_pay_help_list:[
        "Pilih plan dan token (SOL/USDC/USDT).",
        "Connect wallet dan approve transaksi.",
        "Setelah auto‑verify, Pro aktif untuk handle kamu."
      ],
      w_pay_help_title:"Langkah pembayaran",
      w_right:"Cara kerja Pro & referral",
      w_right_desc:"Free: kamu bisa membuat dan mengedit list GM. Pro membuka semuanya dan menghapus limit.",
      w_right_list:[
        "<b>Free:</b> buat &amp; edit list bebas. Daily inserts: <b>70</b>.",
        "<b>Referral:</b> membuka theme/skin/pack bertahap. Detail di tab <b>Referrals</b>.",
        "<b>Pro:</b> daily inserts tanpa batas, semua unlocked, kontrol lanjutan.",
        "<b>Pay:</b> select a plan → choose token → connect wallet → Pay → auto-verify."
      ],
      wp_note:"Wallpaper per tab (Home / GM / Referrals / Themes / Extension Themes / Upgrade Pro). Preview Free: 10 wallpaper pertama. Unlock +1 di 10 referral, lalu +1 tiap 5, atau Pro.",

    themes_k_walls:"Wallpaper terbuka",

    ext_k_themes:"Tema terbuka",

    ext_k_walls:"Wallpaper terbuka",

    ext_k_ref:"Referral",
},
    ru: {
      plan_compare_btn:"Сравнить",
      plan_modal_title:"Сравнение планов",
      plan_modal_close:"Закрыть",
      plan_modal_desc:"Выбирай что нужно — продлить можно в любой момент. Pro открывает всё сразу.",
      w_activity_title:"Ваша активность",
      w_activity_refresh:"Обновить",
      w_activity_hint:"Показывает последние события по вашему хэндлу (платежи, рефералы, апгрейды)",
      refCopy:"Копировать ссылку",
      refLoad:"Загрузить статистику",

      loading:"Загрузка…",
      error:"Ошибка",
      connectFirst:"Сначала подключитесь.",
      lb_you:"Вы",
      lb_eligible:"Засчитано",
      lb_empty:"Пока нет данных.",
      lb_failed:"Не удалось загрузить лидерборд.",

      // Ошибки / тосты (нужно для полного RU)
      err_unauthorized:"Нет доступа",
      err_forbidden:"Запрещено",
      err_not_found:"Не найдено",
      err_rate_limited:"Слишком часто",
      err_busy:"Занято, попробуйте ещё раз",
      err_limit_reached:"Лимит достигнут",
      err_upgrade_required:"Нужен апгрейд",
      err_invalid_handle:"Неверный хэндл",
      err_init_failed:"Не удалось инициализировать",
      err_server_error:"Ошибка сервера",
      err_unknown:"Неизвестная ошибка",
      toast_copied:"Скопировано.",
      toast_copy_failed:"Не удалось скопировать.",
      toast_removed:"Удалено.",
      toast_cleared:"Очищено.",
      toast_cleared_all_saved_lines:"Все сохранённые строки очищены.",
      toast_nothing_to_copy:"Нечего копировать.",
      toast_nothing_to_export:"Нечего экспортировать.",
      toast_custom_bg_saved:"Кастомный фон сохранён.",
      toast_custom_bg_cleared:"Кастомный фон очищен.",
      toast_wallpaper_cleared:"Обои очищены.",
      connect_warn_html:"Открой расширение и нажми Connect на сайте.",
      connect_toast_html:"Подключено.",
      this_feature:"Эта функция",
      locked:"Закрыто",
      locked_unlock_at:"Откроется при {n} рефералах",
      ext_wp_none:"Без обоев",

      // Рефералы / лидерборд
      r_loading:"Загрузка…",
      r_no_invited:"Пока нет приглашённых",
      r_not_yet:"Пока нет",
      r_eligible:"Засчитан",
      r_flagged:"Фрод",
      r_leader_title:"Лидерборд",
      r_leader_note:"Ранжирование по eligible с реальным использованием за выбранный период.",
      r_lb_handle:"Хэндл",
      r_lb_eligible:"Eligible",
      r_why_not_yet:"Пока не засчитано: нет использования продукта",
      r_why_ok:"Засчитано: есть реальное использование",
      r_why_flagged:"Не засчитано: отмечено как злоупотребление",
      r_lb_failed:"Не удалось загрузить",
      ref_promo_title:"Правила промоутера",
      ref_k_confirmed:"Confirmed",
      ref_k_active:"Active",
      ref_k_legacy:"Legacy",
      ref_k_eligible:"Eligible",
      ref_def_confirmed:"Confirmed = регистрация по вашей ссылке.",
      ref_def_active:"Active = confirmed с хотя бы одним использованием продукта.",
      ref_def_legacy:"Legacy = старые рефералы (grandfather).",
      ref_def_eligible:"Eligible = max(active, legacy).",
      ref_daily_limit_title:"Дневной лимит",
      ref_per_day:"в день",
      ref_base_plus_bonus:"База {base} + бонус {bonus}",
      ref_bonus_rule:"Бонус: +{per20} за каждые 20 eligible (чанков: {chunks})",
      ref_next_bonus:"Следующий бонус при {nextAt} eligible",
      ref_cap_note:"лимит {cap}",
      ref_owner_inactive:"бонус на паузе, пока вы не используете продукт",
      ref_abuse_note:"Боты/саморефералы/автоматизация исключаются.",

      t_home:"Главная",
      t_gm:"GM",
      t_gn:"GN",
      t_ref:"Рефералы",
      t_themes:"Темы",
      t_extthemes:"Темы расширения",
      t_wallet:"Апгрейд Pro",
      t_admin:"Админ",
      r_li1:"Скопируй ссылку и поделись ею.",
      r_li2:"Confirmed = кто-то подключился по твоей ссылке.",
      r_li3:"Active = confirmed с использованием. Eligible = бонус (с учётом legacy).",

      ui_sub:"",
gm_badge_this:"Этот список",
gm_badge_total:"Сохранено",
gn_badge_this:"Этот список",
gn_badge_total:"Сохранено",
gm_anti_label:"Не повторять последние",
gn_anti_label:"Не повторять последние",
      home_desc:"Home: подключи @handle, активируй Pro‑код (если есть) и смотри счётчики.",
      gm_desc:"",
      gm_lang_tabs_note:"Списки по языкам (нажми флаг, чтобы открыть).",
      gn_lang_tabs_note:"Списки по языкам (нажми флаг, чтобы открыть).",
      gm_right:"Как использовать GM",
      gm_right_desc:"Собери чистый список ответов — расширение будет вставлять человеческие сообщения в один клик.",
      gm_right_list:["<b>Global</b> — универсальный список (для любого языка).","<b>This language</b> — отдельный список под выбранный Reply language (флаги показывают сохранённые языки).","<b>Random 1/10/70</b> добавляет строки в текущий вид. В режиме <b>min</b> при большом количестве добираем через <b>mid → max</b>, чтобы дойти до цели.","<b>Anti‑repeat</b> режет повторы/похожие строки. Чем выше — тем меньше повторов, но тем сложнее добить количество в <b>min</b>.","<b>Clear view</b> очищает только текущий вид. <b>Clear ALL</b> очищает Global + все языки.","Free cap считается по Global + всем языкам. Если 70/70 — удали пару строк, чтобы освободить места (редактирование безлимитно)."],
      gn_right:"Как использовать GN",
      gn_right_desc:"То же, что GM: делай списки, генерируй новые строки, редактируй, а расширение вставит ответ.",
      gn_right_list:["Правила те же, что и в GM: <b>Global</b> или <b>This language</b> под выбранный Reply language.","<b>Random 1/10/70</b> добавляет строки. В режиме <b>min</b> при необходимости добираем через <b>mid → max</b>.","<b>Anti‑repeat</b> уменьшает дубликаты и слишком похожие варианты.","<b>Clear view</b> — очистка текущего вида. <b>Clear ALL</b> — очистка Global + всех языков.","Free cap = 70 сохранённых строк суммарно. Редактирование безлимитно."],
      gn_desc:"",
      ref_desc:"Рефералы: делись ссылкой. Confirmed = подключились, Active = использовали, Eligible = бонус (с учётом legacy). Бонус: +10/день за 20 eligible (+12 при 50+).",
      wallet_desc:"Upgrade Pro: безлимит на строки GM/GN в день + все косметики открыты (темы, стили, скины и обои для расширения). Оплата в Solana: SOL / USDC / USDT. Авто‑проверка on‑chain.", w_pay_desc:"Выберите план, чтобы включить оплату.", w_status_desc:"После подтверждения транзакции в кошельке мы автоматически проверяем оплату on‑chain.", w_status_list:["Сначала выберите план и токен.", "Подключите кошелёк (Solflare, Phantom, Backpack и т. д.).", "Подтвердите транзакцию — дальше авто‑verify."], r_list:["Every <b>20 referrals</b> adds <b>+10</b> daily inserts.","Daily inserts affect the extension endpoint <b>/api/random</b> (not the site generator).","Share your link. People connect once. Bonus updates automatically."],
      themes_title:"Темы",
      themes_note:"Themes change the look of the app. Wallpapers and backgrounds change the vibe. Some items are locked in Free.",
      themes_rules:"Free: 5 themes + 5 writing styles. Every 100 referrals unlocks +5 themes and +2 styles. Pro unlocks everything and removes the 70-line cap.",
      themes_pick_title:"Выбрать тему",
      themes_pick_note:"Кликни по доступной теме — применится сразу.",
      t_home:"Home",
      t_gm:"GM",
      t_gn:"GN",
      t_studio:"Studio",
      t_packs:"Packs",
      t_bulk:"Bulk",
      t_history:"History",
      t_favorites:"Favorites",
      t_ref:"Referrals",
      t_themes:"Темы",
      t_wallet:"Pro / Оплата",
      t_admin:"Admin",
      btnConnect:"Подключить",
      xHandle_ph:"@ваш_хендл",
      redeemCode_ph:"Код активации",
      gmNewLine_ph:"Введите свою строку…",
      gmFilter_ph:"Фильтр сохранённых строк…",
      gmPaste_ph:"Вставьте строки...",
      gnNewLine_ph:"Введите свою строку…",
      gnFilter_ph:"Фильтр сохранённых строк…",
      gnPaste_ph:"Вставьте строки...",
      w_wallet_ph:"Сначала выберите план",
      w_sig_ph:"Вставьте сюда...",
      w_payer_label:"Кошелёк отправителя (payer)",
      w_payer_ph:"Вставьте адрес отправителя (автозаполнение при подключении кошелька)",
      w_payer_hint:"Нужно для безопасной проверки (чтобы нельзя было переиспользовать чужую транзакцию).",
      adminSecret_ph:"ADMIN_SECRET (необязательно)",
      btnReset:"Сброс (локально)",
      btnExt:"Скачать расширение",
      btnRedeem:"Активировать код",
      gmViewGlobal:"Глобально",
      gmViewLang:"По языкам",
      gmRand1:"Рандом 1",
      gmRand10:"Рандом 10",
      gmRand70:"Рандом 70",
      gmAddLine:"+ Добавить строку",
      gmClear:"Очистить вид",
      gmPasteAdd:"Вставить и добавить",
      gnViewGlobal:"Глобально",
      gnViewLang:"По языкам",
      gnRand1:"Рандом 1",
      gnRand10:"Рандом 10",
      gnRand70:"Рандом 70",
      gnAddLine:"+ Добавить строку",
      gnClear:"Очистить вид",
      gnPasteAdd:"Вставить и добавить",
      refLoad:"Загрузить",
      refCopy:"Скопировать ссылку",
      w_verify:"Проверить оплату",
      w_refresh:"Обновить статус",
      adminStats:"Refresh stats",
      adminGen:"Generate code",
      adminList:"List codes",
      gm_style_label:"Стиль текста",
      gn_style_label:"Стиль текста",
      ui_site_lang:"Язык",
      themes_desc:"Темы меняют интерфейс. Обои и фон задают атмосферу. В Free часть функций заблокирована. Pro открывает всё.",
      customBg_title:"Свой фон",
      customBg_note:"Только Pro. Загрузи картинку — мы автоматически подгоним её под любой экран (моб/десктоп). Позже это синхронизируется с расширением.",
      customBg_label:"Загрузить картинку",
      customBg_remove:"Удалить",
      themes_right:"О темах",
      themes_right_desc:"Используй Темы для внешнего вида. Обои и фон задают атмосферу.",
      themes_right_list:[
        "Выбери любую открытую тему слева.",
        "Обои и фон применяются сразу.",
        "В Free часть функций заблокирована. Pro открывает всё и снимает лимит 70 строк.",
        "Кастомный фон (Pro) auto‑fit и позже будет синхронизирован в расширение."
      ],
      extthemes_right_title:"Как работают анлоки",
      extthemes_right_desc:"До 100 скинов и 100 обоев для расширения. Free preview: первые 10 скинов. Анлок +1 на 10 рефералов, затем +1 каждые 5. Pro открывает всё.",
      extthemes_right_list:[
        "Скины и обои применяются на сайте и синкаются в расширение.",
        "Активен только один скин одновременно.",
        "Pro снимает лимит 70 строк и открывает все стили / пресеты."
      ],
      h_safe:"Безопасность: слишком быстрые ответы в X могут дать лимиты. Используй аккуратно.",
      gm_desc:"",
      gm_note:"",
      gm_right_desc:"Держи список чистым, чтобы расширение вставляло естественные ответы мгновенно.",
      gm_right_list:["<b>Global</b> универсален.","<b>Этот язык</b> создаёт отдельный список под выбранный язык.","<b>Random 1</b> добавляет одну новую строку.","<b>Random 10/70</b> добавляет несколько новых строк.","<b>Редактируй</b>: кликни строку и введи свой текст.","Если ты упёрся в 70/70, удали несколько строк, чтобы добавить новые (редактирование безлимитно)."],
      gn_desc:"",
      gn_note:"",
      gn_right_desc:"Держи список чистым, чтобы расширение вставляло естественные ответы мгновенно.",
      gn_right_list:["<b>Global</b> работает везде.","<b>Этот язык</b> держит отдельный GN-список под язык.","<b>Random 1/10/70</b> добавляет свежие строки в активный вид.","<b>Редактируй</b>: меняй любую строку когда угодно.","Free cap 70 действует на все GN-списки."],
      ref_desc:"Рефералы: делись ссылкой. Каждые 20 eligible дают +10 вставок в день (Promoter 50+ = +12 за 20). Pro открывает всё.",
      r_desc:"Коротко:",
      r_list:["<b>Confirmed</b> — человек подключил хендл по твоей ссылке.","<b>Active</b> — confirmed, кто реально использовал продукт (есть usage). <b>Eligible</b> = max(active, legacy).","Каждые <b>20 eligible</b> дают <b>+10</b> вставок в день (Promoter 50+ = <b>+12</b> за 20).","Дневные вставки влияют на endpoint расширения <b>/api/random</b> (не на генератор сайта)."],
      wallet_desc:"Pro: снимает cap 70, открывает все темы и стили и даёт безлимит генерации. Wallet-connect поддерживает Solflare и другие кошельки через Wallet Standard. Верификация по signature остаётся для максимальной безопасности.",
      w_note:"План → токен (SOL/USDC/USDT) → подключить кошелёк → Pay → авто‑verify.",
      w_pay_desc:"Кошелёк получателя появится после выбора плана.",
      w_status_desc:"Просто и безопасно: ты отправляешь со своего кошелька и вставляешь signature для проверки.",
      w_status_list:["Без подключения кошелька (меньше риск).","Работает с любым кошельком (ты вставляешь signature).","Полный wallet-connect — после security review."],
      pro_tools_title:"Pro инструменты",
      pro_tools_desc:"Чистка списков, экспорт/импорт данных и копирование support bundle для быстрой поддержки.",
      pro_tools_note:"Только Pro. В Free нужно обновиться до Pro, чтобы использовать эти кнопки.",
      gm_right:"Как использовать GM",
      gn_right:"Как использовать GN",
      r_how:"Как это работает",
      w_status:"О платежах",
      r_li2b:"Клики считаются отдельно. Награды/анлоки считаются по подключившимся рефералам.",
      r_li2c:"Промоутерам: free daily cap растёт автоматически с рефералами (бонус добавляется к базовому лимиту).",
      r_li4:"Бонус: +10/день за 20 eligible (+12 при 50+). Pro открывает всё.",
      r_note:"Поделись реф-ссылкой. Когда новый пользователь подключается по ней, счётчик рефералов растёт.",
      r_title:"Рефералы",
      themes_right_title:"Короткий гайд",
      w_pay_help_list:[
        "Выберите план и токен (SOL/USDC/USDT).",
        "Подключите кошелёк и подтвердите транзакцию.",
        "После авто‑verify Pro активируется на ваш @handle."
      ],
      w_pay_help_title:"Шаги оплаты",
      w_right:"Как работают Pro и рефералы",
      ui_plan:"План",
      ui_sync:"Синх.",
      w_right_desc:"Free: можно собирать и редактировать списки GM/GN. Pro открывает всё и снимает лимиты.",
      w_right_list:[
        "<b>Free:</b> до <b>70</b> строк GM + <b>70</b> строк GN (редактирование безлимитно). Daily inserts: <b>70</b> для каждого.",
        "<b>Free косметика:</b> <b>10</b> тем + <b>10</b> обоев. Больше — через рефералы или Pro.",
        "<b>Рефералы:</b> постепенно открывают больше косметики. Подробности во вкладке <b>Referrals</b>.",
        "<b>Pro:</b> безлимитные daily inserts + безлимит на сохранённые строки, всё открыто (включая Cloud sync).",
        "<b>Pay:</b> выбери план → SOL/USDC/USDT → подключи кошелёк → подтверди перевод → авто‑verify."
      ],

      w_support_title:"Поддержка",
      w_support_desc:"Скопируй безопасный диагностический пакет (без приватных ключей), чтобы быстро найти проблему.",
      toolSupport:"Копировать support bundle",
      toolDiag:"Копировать диагностику",
      toolLogs:"Копировать локальные логи",
      supportOut_ph:"Вставь сюда заметки/ответ поддержки...",

      w_faq_title:"FAQ",
      w_faq_list:[
        "<b>Pro привязан к кошельку?</b> Нет — Pro привязан к твоему X‑хендлу. Платить можно с любого кошелька.",
        "<b>Оплатил, но Pro не активировался</b> Нажми кнопки Поддержки выше и отправь нам bundle.",
        "<b>Вы храните мои ответы?</b> Списки хранятся локально в браузере. Cloud sync — только в Pro."
      ],
      wp_note:"Обои можно ставить по вкладкам (Home / GM / Referrals / Themes / Extension Themes / Upgrade Pro). Free превью: первые 10 обоев. Unlock +1 при 10 рефералах, затем +1 каждые 5, либо Pro.",

    themes_k_walls:"Открытые обои",

    ext_k_themes:"Открытые темы",

    ext_k_walls:"Открытые обои",

    ext_k_ref:"Рефералы",
},
    uk: {
      plan_compare_btn:"Порівняти",
      plan_modal_title:"Порівняння планів",
      plan_modal_close:"Закрити",
      plan_modal_desc:"Обирай, що потрібно — продовжити можна будь-коли. Pro відкриває все одразу.",
      w_activity_title:"Твоя активність",
      w_activity_refresh:"Оновити",
      w_activity_hint:"Показує останні події для твого хендлу (платежі, реферали, апгрейди)",
      refCopy:"Копіювати посилання",
      refLoad:"Завантажити статистику",

      t_home:"Головна",
      t_gm:"GM",
      t_gn:"GN",
      t_ref:"Реферали",
      t_themes:"Теми",
      t_extthemes:"Теми розширення",
      t_wallet:"Оновити Pro",
      t_admin:"Адмін",
      r_li1:"Скопіюй посилання та поділись ним.",
      r_li2:"Коли новий користувач підключиться за твоїм посиланням, лічильник зросте.",
      r_li3:"Реферали з часом відкривають більше косметики та пресетів.",

      ui_sub:"",
gm_badge_this:"Цей список",
gm_badge_total:"Збережено",
gn_badge_this:"Цей список",
gn_badge_total:"Збережено",
gm_anti_label:"Не повторювати останні",
gn_anti_label:"Не повторювати останні",
      home_desc:"Home: connect your X handle, activate a Pro code, and check your daily usage.",
      gm_desc:"",
      gm_lang_tabs_note:"Списки за мовами (натисни прапор, щоб відкрити).",
      gn_lang_tabs_note:"Списки за мовами (натисни прапор, щоб відкрити).",
      gm_right:"Як користуватись GM",
      gm_right_desc:"Збери охайний список відповідей — розширення вставлятиме людські повідомлення в один клік.",
      gm_right_list:[
        "<b>Global</b> — універсальний список.",
        "<b>This language</b> — окремий список для обраної мови відповіді.",
        "<b>Рандом 1</b> додає одну нову строку зверху.",
        "<b>Рандом 10/70</b> додає нові строки (не перезаписує).",
        "<b>Редагуй</b>: натисни на строку та вводь свій текст.",
        "Якщо ти вперся в 70/70, видали кілька рядків, щоб додати нові (редагування безлімітне)."
      ],
      gn_right:"Як користуватись GN",
      gn_right_desc:"Так само як GM: роби списки, генеруй нові строки, редагуй, а розширення вставить відповідь.",
      gn_right_list:[
        "<b>Global</b> — працює всюди.",
        "<b>This language</b> — окремий GN список під мову відповіді.",
        "<b>Рандом 1/10/70</b> додає нові строки в активний список.",
        "<b>Редагуй</b>: змінюй будь-які строки коли завгодно.",
        "Ліміт 70 у Free діє на всі GN списки."
      ],
      gn_desc:"",
      ref_desc:"Рефералы: делись ссылкой. Каждые 20 eligible дают +10 вставок в день (Promoter 50+ = +12 за 20). Pro открывает всё.",
      wallet_desc:"Upgrade Pro: знімає ліміт 70 і відкриває всі косметики (теми, стилі, скіни та шпалери для розширення). Оплата в Solana: SOL / USDC / USDT. Авто‑перевірка on‑chain.", w_pay_desc:"Оберіть план, щоб увімкнути оплату.", w_status_desc:"Після підтвердження транзакції в гаманці ми автоматично перевіряємо оплату on‑chain.", w_status_list:["Спочатку оберіть план і токен.", "Підключіть гаманець (Solflare, Phantom, Backpack тощо).", "Підтвердіть транзакцію — далі авто‑verify."], r_list:["Every <b>20 referrals</b> adds <b>+10</b> daily inserts.","Daily inserts affect the extension endpoint <b>/api/random</b> (not the site generator).","Share your link. People connect once. Bonus updates automatically."],
      themes_title:"Теми",
      themes_note:"Themes change the look of the app. Wallpapers and backgrounds change the vibe. Some items are locked in Free.",
      themes_rules:"Free: 5 themes + 5 writing styles. Every 100 referrals unlocks +5 themes and +2 styles. Pro unlocks everything and removes the 70-line cap.",
      themes_pick_title:"Обрати тему",
      themes_pick_note:"Натисни на доступну тему — застосуємо одразу.",
      t_home:"Home",
      t_gm:"GM",
      t_gn:"GN",
      t_studio:"Studio",
      t_packs:"Packs",
      t_bulk:"Bulk",
      t_history:"History",
      t_favorites:"Favorites",
      t_ref:"Referrals",
      t_themes:"Теми",
      t_wallet:"Pro / Оплата",
      t_admin:"Admin",
      btnConnect:"Підключити",
      xHandle_ph:"@ваш_хендл",
      redeemCode_ph:"Код активації",
      gmNewLine_ph:"Введіть свій рядок…",
      gmFilter_ph:"Фільтр збережених рядків…",
      gmPaste_ph:"Вставте рядки...",
      gnNewLine_ph:"Введіть свій рядок…",
      gnFilter_ph:"Фільтр збережених рядків…",
      gnPaste_ph:"Вставте рядки...",
      w_wallet_ph:"Спочатку оберіть план",
      w_sig_ph:"Вставте сюди...",
      adminSecret_ph:"ADMIN_SECRET (необовʼязково)",
      btnReset:"Скинути (локально)",
      btnExt:"Завантажити розширення",
      btnRedeem:"Активувати код",
      gmViewGlobal:"Глобально",
      gmViewLang:"За мовами",
      gmRand1:"Рандом 1",
      gmRand10:"Рандом 10",
      gmRand70:"Рандом 70",
      gmAddLine:"+ Додати рядок",
      gmClear:"Очистити вигляд",
      gmPasteAdd:"Вставити та додати",
      gnViewGlobal:"Глобально",
      gnViewLang:"За мовами",
      gnRand1:"Рандом 1",
      gnRand10:"Рандом 10",
      gnRand70:"Рандом 70",
      gnAddLine:"+ Додати рядок",
      gnClear:"Очистити вигляд",
      gnPasteAdd:"Вставити та додати",
      refLoad:"Завантажити",
      refCopy:"Скопіювати посилання",
      w_verify:"Перевірити оплату",
      w_refresh:"Оновити статус",
      adminStats:"Refresh stats",
      adminGen:"Generate code",
      adminList:"List codes",
      gm_style_label:"Стиль тексту",
      gn_style_label:"Стиль тексту",
      ui_site_lang:"Мова",
      themes_desc:"Теми змінюють інтерфейс. Шпалери та фон задають атмосферу. У Free частина функцій заблокована. Pro відкриває все.",
      customBg_title:"Свій фон",
      customBg_note:"Лише Pro. Завантаж картинку — ми автоматично підженемо під будь‑який екран (моб/десктоп). Пізніше це синхронізується з розширенням.",
      customBg_label:"Завантажити картинку",
      customBg_remove:"Видалити",
      themes_right:"Про теми",
      themes_right_desc:"Використовуй Теми для вигляду застосунку. Шпалери та фон задають атмосферу.",
      themes_right_list:[
        "Обери будь‑яку відкриту тему зліва.",
        "Шпалери та фон застосовуються одразу.",
        "У Free частина функцій заблокована. Pro відкриває все і прибирає ліміт 70 рядків.",
        "Кастомний фон (Pro) auto‑fit і пізніше буде синхронізований в розширення."
      ],
      h_safe:"Безпека: надто швидкі відповіді в X можуть дати ліміти. Використовуй обережно.",
      gm_desc:"",
      gm_note:"",
      gm_right_desc:"Тримай список чистим, щоб розширення вставляло природні відповіді миттєво.",
      gm_right_list:["<b>Global</b> універсальний.","<b>Ця мова</b> створює окремий список під вибрану мову.","<b>Random 1</b> додає один новий рядок.","<b>Random 10/70</b> додає кілька нових рядків.","<b>Редагуй</b>: клікни рядок і введи свій текст.","Якщо ти вперся в 70/70, видали кілька рядків, щоб додати нові (редагування безлімітне)."],
      gn_desc:"",
      gn_note:"",
      gn_right_desc:"Тримай список чистим, щоб розширення вставляло природні відповіді миттєво.",
      gn_right_list:["<b>Global</b> працює всюди.","<b>Ця мова</b> тримає окремий GN-список під мову.","<b>Random 1/10/70</b> додає свіжі рядки у активний вигляд.","<b>Редагуй</b>: змінюй будь-який рядок коли завгодно.","Free cap 70 діє на всі GN-списки."],
      ref_desc:"Реферали: ділись посиланням. Кожні 100 рефералів відкривають +5 тем і +2 стилі (безкоштовно). Pro відкриває все.",
      r_desc:"Реферали: скопіюй посилання, ділись і дивись лічильник.",
      r_list:["Кожні <b>20 рефералів</b> дають <b>+10</b> вставок на день.","Денні вставки впливають на endpoint розширення <b>/api/random</b> (не на генератор сайту).","Ділись посиланням. Люди підключаються один раз. Бонус оновлюється автоматично."],
      wallet_desc:"Pro: знімає cap 70, відкриває всі теми та стилі і дає безліміт генерації. Повний wallet-connect скоро — робимо обережно заради безпеки. Верифікація по signature безпечніша та стабільніша.",
      w_note:"План → токен (SOL/USDC/USDT) → підключити гаманець → Pay → авто‑verify.",
      w_pay_desc:"Гаманець отримувача з’явиться після вибору плану.",
      w_status_desc:"Просто і безпечно: ти відправляєш зі свого гаманця і вставляєш signature для перевірки.",
      w_status_list:["Без підключення гаманця (менше ризиків).","Працює з будь-яким гаманцем (ти вставляєш signature).","Повний wallet-connect — після security review."],
      pro_tools_title:"Pro інструменти",
      pro_tools_desc:"Чистка списків, експорт/імпорт даних і копіювання support bundle для швидкої підтримки.",
      pro_tools_note:"Тільки Pro. У Free треба перейти на Pro, щоб використати ці кнопки.",
      gm_right:"Як використовувати GM",
      gn_right:"Як використовувати GN",
      r_how:"Як це працює",
      w_status:"Про платежі",
      extthemes_right_desc:"До 100 скінів для extension і 100 шпалер. Free прев’ю: перші 10 скінів. Unlock +1 при 10 рефералах, потім +1 кожні 5. Pro відкриває всю косметику.",
      extthemes_right_list:[
        "Скіни та шпалери обираються на сайті й синкаються в розширення.",
        "Одночасно активний лише 1 скін.",
        "Pro також знімає ліміт 70 рядків і відкриває всі writing styles / preset packs."
      ],
      extthemes_right_title:"Як працюють анлоки",
      r_li2b:"Кліки рахуємо окремо. Нагороди/анлоки — за підключеними рефералами.",
      r_li2c:"Промоутерам: free daily cap автоматично зростає з рефералами (бонус додається до базового ліміту).",
      r_li4:"Pro відкриває все одразу.",
      r_note:"Поділись реф-посиланням. Коли новий користувач підключається за ним, лічильник рефералів зростає.",
      r_title:"Реферали",
      themes_right_title:"Короткий гайд",
      w_pay_help_list:[
        "Оберіть план і токен (SOL/USDC/USDT).",
        "Підключіть гаманець і підтвердіть транзакцію.",
        "Після авто‑verify Pro активується для вашого @handle."
      ],
      w_pay_help_title:"Кроки оплати",
      w_right:"Як працюють Pro і реферали",
      ui_plan:"План",
      ui_sync:"Синх.",
      w_right_desc:"Free: можна збирати й редагувати списки GM/GN. Pro відкриває все й знімає ліміти.",
      w_right_list:[
        "<b>Free:</b> до <b>70</b> рядків GM + <b>70</b> рядків GN (редагування безлімітне). Daily inserts: <b>70</b> для кожного.",
        "<b>Free косметика:</b> <b>10</b> тем + <b>10</b> шпалер. Більше — через реферали або Pro.",
        "<b>Реферали:</b> поступово відкривають більше косметики. Деталі у вкладці <b>Referrals</b>.",
        "<b>Pro:</b> безлімітні daily inserts + безліміт на збережені рядки, усе відкрито (включно з Cloud sync).",
        "<b>Pay:</b> обери план → SOL/USDC/USDT → підключи гаманець → підтверди переказ → авто‑verify."
      ],

      w_support_title:"Підтримка",
      w_support_desc:"Скопіюй безпечний діагностичний пакет (без приватних ключів), щоб швидко знайти проблему.",
      toolSupport:"Копіювати support bundle",
      toolDiag:"Копіювати діагностику",
      toolLogs:"Копіювати локальні логи",
      supportOut_ph:"Встав сюди нотатки/відповідь підтримки...",

      w_faq_title:"FAQ",
      w_faq_list:[
        "<b>Pro прив'язаний до гаманця?</b> Ні — Pro прив'язаний до твого X‑хендлу. Платити можна з будь-якого гаманця.",
        "<b>Оплатив, але Pro не активувався</b> Натисни кнопки Підтримки вище та надішли нам bundle.",
        "<b>Ви зберігаєте мої відповіді?</b> Списки зберігаються локально в браузері. Cloud sync — тільки в Pro."
      ],
      wp_note:"Шпалери можна ставити по вкладках (Home / GM / Referrals / Themes / Extension Themes / Upgrade Pro). Free прев’ю: перші 10 шпалер. Unlock +1 при 10 рефералах, потім +1 кожні 5, або Pro.",

    themes_k_walls:"Відкриті шпалери",

    ext_k_themes:"Відкриті теми",

    ext_k_walls:"Відкриті шпалери",

    ext_k_ref:"Реферали",
},
      hi:{
        ui_site_lang:"भाषा",
        t_home:"Home", t_gm:"GM", t_gn:"GN", t_ref:"Referrals", t_themes:"Themes", t_extthemes:"Extension Themes", t_wallet:"Upgrade Pro"
      ,
      customBg_note:"केवल Pro. एक image upload करें और हम उसे किसी भी screen पर auto‑fit करते हैं (desktop/mobile). बाद में यह extension के साथ sync होगा।",
      extthemes_right_desc:"100 तक extension skins और 100 wallpapers. Free preview: पहले 10 skins. Unlock +1 (10 referrals), फिर हर 5 पर +1. Pro सारी cosmetics unlock करता है।",
      extthemes_right_list:[
        "Skins और wallpapers साइट पर चुने जाते हैं और extension में sync होते हैं।",
        "एक समय में सिर्फ 1 skin active रहता है।",
        "Pro 70‑line cap भी हटाता है और सभी writing styles / preset packs unlock करता है।"
      ],
      extthemes_right_title:"Unlocks कैसे काम करते हैं",
      gm_right:"GM कैसे इस्तेमाल करें",
      gm_right_desc:"एक साफ GM लिस्ट बनाइए ताकि extension human‑style replies को natural typing delay के साथ insert कर सके।",
      gm_right_list:[
        "<b>Style</b> और <b>Preset pack</b> चुनें (optional).",
        "<b>Random 1 / 10 / 70</b> नए unique lines जोड़ता है (status में <b>Added X/Y</b>).",
        "<b>Anti-repeat</b> saved lines से duplicates ब्लॉक करता है।",
        "किसी भी line को क्लिक करके <b>Edit</b> कर सकते हैं।",
        "<b>Free cap:</b> कुल <b>70</b> GM lines (full होने पर adding रुकता है, editing हमेशा चलेगी)।"
      ],
      gn_right:"GN कैसे इस्तेमाल करें",
      gn_right_desc:"एक साफ GN लिस्ट बनाइए ताकि extension human‑style good night replies को natural typing delay के साथ insert कर सके।",
      gn_right_list:[
        "<b>Style</b> और <b>Preset pack</b> चुनें (optional).",
        "<b>Random 1 / 10 / 70</b> नए unique lines जोड़ता है (status में <b>Added X/Y</b>).",
        "<b>Anti-repeat</b> saved lines से duplicates ब्लॉक करता है।",
        "किसी भी line को क्लिक करके <b>Edit</b> कर सकते हैं।",
        "<b>Free cap:</b> कुल <b>70</b> GN lines (full होने पर adding रुकता है, editing हमेशा चलेगी)।"
      ],
      r_li1:"Link copy करें और शेयर करें।",
      r_li2:"जब नया user आपके link से connect करता है, referral count बढ़ता है।",
      r_li2b:"Clicks अलग से track होते हैं। Rewards/unlocks connected referrals पर होते हैं।",
      r_li2c:"Promoters: referrals के साथ आपका free daily cap ऑटो बढ़ता है (bonus base limit में जुड़ता है)।",
      r_li3:"Referrals समय के साथ और cosmetics/presets unlock करते हैं।",
      r_li4:"Pro सब कुछ तुरंत unlock करता है।",
      r_note:"अपना referral link शेयर करें। जब नया user उस link से connect करता है, आपका referral count बढ़ता है।",
      r_title:"Referrals",
      themes_right_desc:"Themes UI बदलते हैं। Wallpapers और custom background tab के हिसाब से look बदलते हैं। Referrals previews unlock करते हैं (Pro सब unlock करता है)।",
      themes_right_list:[
        "बाएँ से कोई भी unlocked theme चुनें।",
        "<b>Wallpapers</b> tab‑wise हैं; <b>Custom background</b> केवल Pro में है।",
        "<b>Writing styles</b> सिर्फ Random generation पर लागू होते हैं (manual edits सुरक्षित रहते हैं)।",
        "<b>Referrals</b> समय के साथ cosmetics unlock करते हैं; <b>Pro</b> सब unlock करता है।"
      ],
      themes_right_title:"त्वरित गाइड",
      themes_rules:"Free preview: पहले 5 themes + 5 writing styles + 10 wallpapers. Unlock +1 (10 referrals), फिर हर 5 पर +1. Pro सब unlock करता है और 70‑line cap हटाता है।",
      w_pay_help_list:[
        "Plan चुनें और receiver wallet को exact SOL amount भेजें।",
        "Connect your wallet and approve the transaction.",
        "Verification के बाद Pro आपके handle पर active हो जाता है।"
      ],
      w_pay_help_title:"Payment steps",
      w_right:"Pro और referrals कैसे काम करते हैं",
      w_right_desc:"Free में आप GM lists बना/एडिट कर सकते हैं। Pro सब unlock करता है और limits हटाता है।",
      w_right_list:[
        "<b>Free:</b> lists को freely build &amp; edit करें। Daily inserts: <b>70</b>.",
        "<b>Referrals:</b> धीरे‑धीरे themes/skins/packs unlock करते हैं। Details <b>Referrals</b> tab में।",
        "<b>Pro:</b> unlimited daily inserts, सब unlocked, advanced controls.",
        "Connect your wallet and approve the transaction."
      ],
      wp_note:"हर tab के लिए wallpaper (Home / GM / Referrals / Themes / Extension Themes / Upgrade Pro). Free preview: पहले 10 wallpapers. Unlock +1 (10 referrals), फिर हर 5 पर +1, या Pro.",
},
      ja:{
        ui_site_lang:"言語",
        t_home:"Home", t_gm:"GM", t_gn:"GN", t_ref:"Referrals", t_themes:"Themes", t_extthemes:"Extension Themes", t_wallet:"Upgrade Pro"
      ,
      customBg_note:"Pro のみ。画像をアップロードすると desktop/mobile に自動フィットします（後で extension に同期）。",
      extthemes_right_desc:"最大 100 の extension skins と 100 wallpapers。Free preview: 最初の 10 skins。Unlock +1（10 referrals）、その後 5 ごとに +1。Pro は全 cosmetics 解除。",
      extthemes_right_list:[
        "Skins と wallpapers はサイトで選び、extension に同期されます。",
        "同時に有効なのは 1 skin のみ。",
        "Pro は 70 行制限を解除し、全 writing styles / preset packs も解除します。"
      ],
      extthemes_right_title:"Unlock の仕組み",
      gm_right:"GM の使い方",
      gm_right_desc:"拡張機能が自然な入力遅延付きで human‑style の返信を挿入できるよう、きれいな GM リストを作ります。",
      gm_right_list:[
        "<b>Style</b> と <b>Preset pack</b> を選択（任意）。",
        "<b>Random 1 / 10 / 70</b> で新しいユニーク行を追加（ステータスに <b>Added X/Y</b>）。",
        "<b>Anti-repeat</b> で保存済み行の重複をブロック。",
        "行をクリックして自由に <b>Edit</b>。",
        "<b>Free cap:</b> GM は合計 <b>70</b> 行まで（満杯でも編集は可能）。"
      ],
      gn_right:"GN の使い方",
      gn_right_desc:"拡張機能が自然な入力遅延付きで human‑style の GN 返信を挿入できるよう、きれいな GN リストを作ります。",
      gn_right_list:[
        "<b>Style</b> と <b>Preset pack</b> を選択（任意）。",
        "<b>Random 1 / 10 / 70</b> で新しいユニーク行を追加（ステータスに <b>Added X/Y</b>）。",
        "<b>Anti-repeat</b> で保存済み行の重複をブロック。",
        "行をクリックして自由に <b>Edit</b>。",
        "<b>Free cap:</b> GN は合計 <b>70</b> 行まで（満杯でも編集は可能）。"
      ],
      r_li1:"リンクをコピーして共有。",
      r_li2:"新規ユーザーがリンクで接続すると referral count が増えます。",
      r_li2b:"クリックは別で計測。Rewards/unlocks は接続済み referrals を使用。",
      r_li2c:"Promoters: referrals に応じて free daily cap が自動で増加（ボーナスがベースに加算）。",
      r_li3:"Referrals で cosmetics/presets を段階的に解除。",
      r_li4:"Pro はすべて即時解除。",
      r_note:"referral link を共有。新規ユーザーがそのリンクで接続すると referral count が増えます。",
      r_title:"Referrals",
      themes_right_desc:"Themes はUIを変更。Wallpapers と custom background はタブごとの見た目を変更。Referrals でプレビューが解除（Pro は全部解除）。",
      themes_right_list:[
        "左から unlocked theme を選択。",
        "<b>Wallpapers</b> はタブ別。<b>Custom background</b> は Pro のみ。",
        "<b>Writing styles</b> は Random 生成にのみ影響（手動編集は保持）。",
        "<b>Referrals</b> で cosmetics を段階解除。<b>Pro</b> は全部解除。"
      ],
      themes_right_title:"クイックガイド",
      themes_rules:"Free preview: 最初の 5 themes + 5 writing styles + 10 wallpapers。Unlock +1（10 referrals）、その後 5 ごとに +1。Pro は全解除＆70行制限を解除。",
      w_pay_help_list:[
        "プランを選び、指定の受取ウォレットへ正確な SOL を送金。",
        "Connect your wallet and approve the transaction.",
        "検証後、Pro があなたの handle に有効化されます。"
      ],
      w_pay_help_title:"支払い手順",
      w_right:"Pro と referrals の仕組み",
      w_right_desc:"Free では GM リストを作成・編集できます。Pro は全解除＆制限解除。",
      w_right_list:[
        "<b>Free:</b> リスト作成/編集は自由。Daily inserts: <b>70 GM</b> 。",
        "<b>Referrals:</b> themes/skins/packs を段階的に解除。詳細は <b>Referrals</b> タブ。",
        "<b>Pro:</b> daily inserts 無制限、全解除、advanced controls。",
        "Connect your wallet and approve the transaction."
      ],
      wp_note:"タブ別 wallpaper（Home / GM / Referrals / Themes / Extension Themes / Upgrade Pro）。Free preview: 最初の 10 wallpapers。Unlock +1（10 referrals）、その後 5 ごとに +1、または Pro。",
},
      zh:{
        ui_site_lang:"语言",
        t_home:"Home", t_gm:"GM", t_gn:"GN", t_ref:"Referrals", t_themes:"Themes", t_extthemes:"Extension Themes", t_wallet:"Upgrade Pro"
      ,
      customBg_note:"仅 Pro。上传图片后会自动适配任意屏幕（桌面/手机），之后会同步到扩展。",
      extthemes_right_desc:"最多 100 个扩展 skins 和 100 张 wallpapers。Free 预览：前 10 个 skins。10 个 referrals 解锁 +1，之后每 5 个再 +1。Pro 解锁全部外观。",
      extthemes_right_list:[
        "Skins 和 wallpapers 在网站选择，并同步到扩展。",
        "同一时间只能启用 1 个 skin。",
        "Pro 也会移除 70 行限制，并解锁全部 writing styles / preset packs。"
      ],
      extthemes_right_title:"解锁规则",
      gm_right:"GM 使用方法",
      gm_right_desc:"先把 GM 列表整理干净，这样扩展就能用自然的输入延迟插入 human‑style 回复。",
      gm_right_list:[
        "可选：选择 <b>Style</b> 和 <b>Preset pack</b>。",
        "<b>Random 1 / 10 / 70</b> 会添加新的唯一内容（状态显示 <b>Added X/Y</b>）。",
        "<b>Anti-repeat</b> 会从已保存内容中屏蔽重复。",
        "点击任意一行即可 <b>Edit</b> 修改。",
        "<b>Free cap:</b> GM 最多保存 <b>70</b> 行（满了就不再新增，但编辑一直可用）。"
      ],
      gn_right:"GN 使用方法",
      gn_right_desc:"先把 GN 列表整理干净，这样扩展就能用自然的输入延迟插入 human‑style 晚安回复。",
      gn_right_list:[
        "可选：选择 <b>Style</b> 和 <b>Preset pack</b>。",
        "<b>Random 1 / 10 / 70</b> 会添加新的唯一内容（状态显示 <b>Added X/Y</b>）。",
        "<b>Anti-repeat</b> 会从已保存内容中屏蔽重复。",
        "点击任意一行即可 <b>Edit</b> 修改。",
        "<b>Free cap:</b> GN 最多保存 <b>70</b> 行（满了就不再新增，但编辑一直可用）。"
      ],
      r_li1:"复制链接并分享。",
      r_li2:"新用户通过你的链接连接后，referral 数会增加。",
      r_li2b:"Clicks 单独统计。Rewards/unlocks 以已连接的 referrals 为准。",
      r_li2c:"Promoters：free daily cap 会随 referrals 自动增加（bonus 加到基础额度）。",
      r_li3:"Referrals 会逐步解锁更多外观和预设。",
      r_li4:"Pro 立即全部解锁。",
      r_note:"分享你的 referral 链接。新用户通过该链接连接后，referral 数会增加。",
      r_title:"Referrals",
      themes_right_desc:"Themes 改变界面。Wallpapers 和自定义背景按标签页改变外观。Referrals 解锁预览（Pro 全部解锁）。",
      themes_right_list:[
        "在左侧选择任意已解锁的 theme。",
        "<b>Wallpapers</b> 按标签页设置；<b>Custom background</b> 仅 Pro。",
        "<b>Writing styles</b> 只影响 Random 生成（手动编辑始终保留）。",
        "<b>Referrals</b> 逐步解锁更多外观；<b>Pro</b> 一次性全解锁。"
      ],
      themes_right_title:"快速指南",
      themes_rules:"Free 预览：前 5 个 themes + 5 个 writing styles + 10 张 wallpapers。10 个 referrals 解锁 +1，之后每 5 个再 +1。Pro 全部解锁并移除 70 行限制。",
      w_pay_help_list:[
        "选择套餐并向收款钱包发送精确的 SOL 金额。",
        "Connect your wallet and approve the transaction.",
        "验证通过后，Pro 将在你的 handle 上激活。"
      ],
      w_pay_help_title:"支付步骤",
      w_right:"Pro 与 referrals 说明",
      w_right_desc:"Free 可以创建/编辑 GM 列表。Pro 解锁全部并移除限制。",
      w_right_list:[
        "<b>Free:</b> 列表可自由创建/编辑。Daily inserts: <b>70 GM</b> 。",
        "<b>Referrals:</b> 逐步解锁 themes/skins/packs。详情见 <b>Referrals</b> 标签。",
        "<b>Pro:</b> daily inserts 无限、全部解锁、高级控制。",
        "Connect your wallet and approve the transaction."
      ],
      wp_note:"每个标签页可单独设置 wallpaper（Home / GM / Referrals / Themes / Extension Themes / Upgrade Pro）。Free 预览：前 10 张 wallpapers。10 个 referrals 解锁 +1，之后每 5 个再 +1，或 Pro。",
}
  };



// --- i18n hotfixes (RU) ---
  (function(){
    const FIX = {
      ru: {
        // Tabs
        t_home:"Главная", t_gm:"GM", t_gn:"GN", t_ref:"Рефералы", t_themes:"Темы", t_extthemes:"Темы расширения", t_wallet:"Апгрейд Pro", t_admin:"Админ",
        // Home
        h_title:"Подключение", h_note:"Введите ваш X handle и подключитесь один раз. Без валидного @handle приложение не работает.",
        h_label_handle:"X handle", h_code_title:"Код активации", h_code_note:"Если у вас есть тестовый/подписочный код — вставьте его сюда и активируйте.",
        h_status:"Быстрый гайд", h_desc:"GMXReply сделан для быстрых, живых GM/GN ответов без ощущения бота.",
        h_guide:[
          "<b>Шаг 1:</b> Подключите X handle (один раз).",
          "<b>Шаг 2:</b> Соберите списки в вкладках <span class=\"kbd\">GM</span> / <span class=\"kbd\">GN</span> (Global + по языкам).",
          "<b>Шаг 3:</b> Используйте расширение Chrome в X — вставка в один клик.",
          "<b>Лимиты:</b> Free = до <b>70 сохранённых строк</b> для GM (Global + все языки). Редактирование безлимитно. Pro снимает лимит."
        ],
        // Home: sections
        h_what_title:"Что ты получаешь",
        h_what_1:"HTML:Живые ответы <b>GM</b> и <b>GN</b> с естественным разнообразием.",
        h_what_2:"HTML:Один клик + хоткеи в расширении для мгновенной вставки в X.",
        h_what_3:"Премиум темы и обои, которые применяются ко всему продукту.",
        h_free_title:"Free vs Pro",
        h_freepro_1:"HTML:<b>Free:</b> создаёшь и редактируешь списки, есть лимиты на дневные вставки и сохранения.",
        h_freepro_2:"HTML:<b>Pro:</b> снимает лимиты, открывает премиум‑контроль и хоткеи Best.",
        h_try_title:"Попробовать сразу (free)",
        h_try_note:"Кошелёк не нужен. Попробуй, а потом подключи @handle чтобы сохранять и открыть Pro инструменты.",
        homeTryGm:"Попробовать GM",
        homeTryGn:"Попробовать GN",

        // Core section titles
        gm_title:"GM ответы", gn_title:"GN ответы",
        r_title:"Рефералы", r_note:"Ваша реферальная ссылка уникальна. Делитесь ею, чтобы увеличивать бонус.",
        // Descriptions (right panel)
        home_desc:"Home: подключи @handle, активируй Pro‑код (если есть) и смотри счётчики.",
        ref_desc:"Рефералы: делись ссылкой. Каждые 20 eligible дают +10 вставок в день (Promoter 50+ = +12 за 20). Pro открывает всё.",
        themes_note:"Themes меняют вид приложения. Wallpapers и фон меняют вайб. Часть предметов закрыта в Free.",
        themes_rules:"Free: 5 themes + 5 writing styles. Каждые 100 referrals открывают +5 themes и +2 styles. Pro открывает всё и снимает лимит 70 строк.",
        wallet_desc:"Апгрейд Pro: безлимит на строки GM/GN в день + вся косметика открыта (темы, стили, скины и обои для расширения). Оплата в Solana: SOL / USDC / USDT. Авто‑проверка on‑chain.",

        // Status / errors
        degradedTitle:"Офлайн режим",
        degradedMsg:"API недоступен. Всё безопасно, но часть действий может не работать до восстановления связи.",
        degradedRetry:"Повторить",
        degradedHide:"Скрыть",
        fatalTitle:"Что-то пошло не так",
        fatalReload:"Перезагрузить",
        fatalGoHome:"На главную",
        fatalTip:"Подсказка: если у тебя много расширений Chrome (кошельки, security), попробуй Инкогнито с выключенными расширениями — так проще понять, нет ли инжекта."
      }
    };
    try{
      for (const [lang, pack] of Object.entries(FIX)){
        if (!I18N[lang]) I18N[lang] = {};
        Object.assign(I18N[lang], pack);
      }
    }catch(_e){}
  })();



// Extra i18n labels for Best buttons
(function(){
  const ADD = {
    en: { gmBestBtn:"Best", gnBestBtn:"Best" },
    ru: { gmBestBtn:"Лучшее", gnBestBtn:"Лучшее" }
  };
  try{
    for (const [lang, pack] of Object.entries(ADD)){
      if (!I18N[lang]) I18N[lang] = {};
      Object.assign(I18N[lang], pack);
    }
  }catch(_e){}
})();

// Extra i18n labels for wallpaper "Apply to" tabs
  (function(){
    const ADD = {
      en: { wp_apply_all:"All tabs", wp_apply_home:"Home", wp_apply_gm:"GM", wp_apply_gn:"GN", wp_apply_studio:"Studio", wp_apply_packs:"Packs", wp_apply_bulk:"Bulk", wp_apply_history:"History", wp_apply_favorites:"Favorites", wp_apply_referrals:"Referrals", wp_apply_leaderboard:"Leaderboard", wp_apply_themes:"Themes", wp_apply_extthemes:"Extension themes", wp_apply_wallet:"Upgrade Pro" },
      es: { wp_apply_all:"Todas las pestañas", wp_apply_home:"Inicio", wp_apply_gm:"GM", wp_apply_gn:"GN", wp_apply_studio:"Studio", wp_apply_packs:"Paquetes", wp_apply_bulk:"Masivo", wp_apply_history:"Historial", wp_apply_favorites:"Favoritos", wp_apply_referrals:"Referidos", wp_apply_leaderboard:"Leaderboard", wp_apply_themes:"Temas", wp_apply_extthemes:"Temas de extensión", wp_apply_wallet:"Upgrade Pro" },
      pt: { wp_apply_all:"Todas as abas", wp_apply_home:"Início", wp_apply_gm:"GM", wp_apply_gn:"GN", wp_apply_studio:"Estúdio", wp_apply_packs:"Pacotes", wp_apply_bulk:"Em lote", wp_apply_history:"Histórico", wp_apply_favorites:"Favoritos", wp_apply_referrals:"Referências", wp_apply_leaderboard:"Leaderboard", wp_apply_themes:"Temas", wp_apply_extthemes:"Temas da extensão", wp_apply_wallet:"Upgrade Pro" },
      fr: { wp_apply_all:"Tous les onglets", wp_apply_home:"Accueil", wp_apply_gm:"GM", wp_apply_gn:"GN", wp_apply_studio:"Studio", wp_apply_packs:"Packs", wp_apply_bulk:"Lot", wp_apply_history:"Historique", wp_apply_favorites:"Favoris", wp_apply_referrals:"Parrainages", wp_apply_leaderboard:"Leaderboard", wp_apply_themes:"Thèmes", wp_apply_extthemes:"Thèmes extension", wp_apply_wallet:"Upgrade Pro" },
      de: { wp_apply_all:"Alle Tabs", wp_apply_home:"Start", wp_apply_gm:"GM", wp_apply_gn:"GN", wp_apply_studio:"Studio", wp_apply_packs:"Packs", wp_apply_bulk:"Batch", wp_apply_history:"Verlauf", wp_apply_favorites:"Favoriten", wp_apply_referrals:"Empfehlungen", wp_apply_leaderboard:"Leaderboard", wp_apply_themes:"Designs", wp_apply_extthemes:"Erweiterung-Designs", wp_apply_wallet:"Upgrade Pro" },
      it: { wp_apply_all:"Tutte le schede", wp_apply_home:"Home", wp_apply_gm:"GM", wp_apply_gn:"GN", wp_apply_studio:"Studio", wp_apply_packs:"Pacchetti", wp_apply_bulk:"Lotto", wp_apply_history:"Cronologia", wp_apply_favorites:"Preferiti", wp_apply_referrals:"Referral", wp_apply_leaderboard:"Leaderboard", wp_apply_themes:"Temi", wp_apply_extthemes:"Temi estensione", wp_apply_wallet:"Upgrade Pro" },
      nl: { wp_apply_all:"Alle tabbladen", wp_apply_home:"Home", wp_apply_gm:"GM", wp_apply_gn:"GN", wp_apply_studio:"Studio", wp_apply_packs:"Packs", wp_apply_bulk:"Batch", wp_apply_history:"Geschiedenis", wp_apply_favorites:"Favorieten", wp_apply_referrals:"Referrals", wp_apply_leaderboard:"Leaderboard", wp_apply_themes:"Thema\'s", wp_apply_extthemes:"Extensiethema\'s", wp_apply_wallet:"Upgrade Pro" },
      tr: { wp_apply_all:"Tüm sekmeler", wp_apply_home:"Ana", wp_apply_gm:"GM", wp_apply_gn:"GN", wp_apply_studio:"Stüdyo", wp_apply_packs:"Paketler", wp_apply_bulk:"Toplu", wp_apply_history:"Geçmiş", wp_apply_favorites:"Favoriler", wp_apply_referrals:"Referanslar", wp_apply_leaderboard:"Leaderboard", wp_apply_themes:"Temalar", wp_apply_extthemes:"Eklenti temaları", wp_apply_wallet:"Upgrade Pro" },
      pl: { wp_apply_all:"Wszystkie karty", wp_apply_home:"Strona główna", wp_apply_gm:"GM", wp_apply_gn:"GN", wp_apply_studio:"Studio", wp_apply_packs:"Pakiety", wp_apply_bulk:"Hurtowo", wp_apply_history:"Historia", wp_apply_favorites:"Ulubione", wp_apply_referrals:"Polecenia", wp_apply_leaderboard:"Leaderboard", wp_apply_themes:"Motywy", wp_apply_extthemes:"Motywy rozszerzenia", wp_apply_wallet:"Upgrade Pro" },
      id: { wp_apply_all:"Semua tab", wp_apply_home:"Beranda", wp_apply_gm:"GM", wp_apply_gn:"GN", wp_apply_studio:"Studio", wp_apply_packs:"Paket", wp_apply_bulk:"Massal", wp_apply_history:"Riwayat", wp_apply_favorites:"Favorit", wp_apply_referrals:"Referral", wp_apply_leaderboard:"Leaderboard", wp_apply_themes:"Tema", wp_apply_extthemes:"Tema ekstensi", wp_apply_wallet:"Upgrade Pro" },
      ru: { wp_apply_all:"Все вкладки", wp_apply_home:"Главная", wp_apply_gm:"GM", wp_apply_gn:"GN", wp_apply_studio:"Студия", wp_apply_packs:"Паки", wp_apply_bulk:"Пакетно", wp_apply_history:"История", wp_apply_favorites:"Избранное", wp_apply_referrals:"Рефералы", wp_apply_leaderboard:"Лидерборд", wp_apply_themes:"Темы", wp_apply_extthemes:"Темы расширения", wp_apply_wallet:"Upgrade Pro" },
      uk: { wp_apply_all:"Усі вкладки", wp_apply_home:"Головна", wp_apply_gm:"GM", wp_apply_gn:"GN", wp_apply_studio:"Студія", wp_apply_packs:"Пакети", wp_apply_bulk:"Пакетом", wp_apply_history:"Історія", wp_apply_favorites:"Вибране", wp_apply_referrals:"Реферали", wp_apply_leaderboard:"Leaderboard", wp_apply_themes:"Теми", wp_apply_extthemes:"Теми розширення", wp_apply_wallet:"Upgrade Pro" },
      hi: { wp_apply_all:"सभी टैब", wp_apply_home:"होम", wp_apply_gm:"GM", wp_apply_gn:"GN", wp_apply_studio:"स्टूडियो", wp_apply_packs:"पैक्स", wp_apply_bulk:"बल्क", wp_apply_history:"इतिहास", wp_apply_favorites:"पसंदीदा", wp_apply_referrals:"रेफ़रल", wp_apply_leaderboard:"Leaderboard", wp_apply_themes:"थीम्स", wp_apply_extthemes:"एक्सटेंशन थीम्स", wp_apply_wallet:"Upgrade Pro" },
      ja: { wp_apply_all:"すべてのタブ", wp_apply_home:"ホーム", wp_apply_gm:"GM", wp_apply_gn:"GN", wp_apply_studio:"スタジオ", wp_apply_packs:"パック", wp_apply_bulk:"一括", wp_apply_history:"履歴", wp_apply_favorites:"お気に入り", wp_apply_referrals:"紹介", wp_apply_leaderboard:"Leaderboard", wp_apply_themes:"テーマ", wp_apply_extthemes:"拡張機能テーマ", wp_apply_wallet:"Upgrade Pro" },
      zh: { wp_apply_all:"所有标签", wp_apply_home:"主页", wp_apply_gm:"GM", wp_apply_gn:"GN", wp_apply_studio:"工作室", wp_apply_packs:"套餐", wp_apply_bulk:"批量", wp_apply_history:"历史", wp_apply_favorites:"收藏", wp_apply_referrals:"邀请", wp_apply_leaderboard:"Leaderboard", wp_apply_themes:"主题", wp_apply_extthemes:"扩展主题", wp_apply_wallet:"Upgrade Pro" }
    };
    try{
      for (const [lang, pack] of Object.entries(ADD)){
        if (!I18N[lang]) continue;
        Object.assign(I18N[lang], pack);
      }
    }catch{}
  })();
  // Extra i18n for common toast messages
  (function(){
    const ADD_TOAST = {
      en: { toast_custom_bg_cleared:"Custom background cleared.", toast_wallpaper_cleared:"Wallpaper cleared.", toast_cleared:"Cleared.", toast_custom_bg_saved:"Custom background saved.", toast_removed:"Removed.", toast_cleared_all_saved_lines:"Cleared all saved lines.", toast_nothing_to_copy:"Nothing to copy.", toast_copied:"Copied.", toast_copy_failed:"Copy failed.", toast_nothing_to_export:"Nothing to export." },
      es: { toast_custom_bg_cleared:"Fondo personalizado borrado.", toast_wallpaper_cleared:"Fondo de pantalla borrado.", toast_cleared:"Borrado.", toast_custom_bg_saved:"Fondo personalizado guardado.", toast_removed:"Eliminado.", toast_cleared_all_saved_lines:"Se borraron todas las líneas guardadas.", toast_nothing_to_copy:"Nada para copiar.", toast_copied:"Copiado.", toast_copy_failed:"Error al copiar.", toast_nothing_to_export:"Nada para exportar." },
      pt: { toast_custom_bg_cleared:"Fundo personalizado limpo.", toast_wallpaper_cleared:"Papel de parede limpo.", toast_cleared:"Limpo.", toast_custom_bg_saved:"Fundo personalizado salvo.", toast_removed:"Removido.", toast_cleared_all_saved_lines:"Todas as linhas salvas foram limpas.", toast_nothing_to_copy:"Nada para copiar.", toast_copied:"Copiado.", toast_copy_failed:"Falha ao copiar.", toast_nothing_to_export:"Nada para exportar." },
      fr: { toast_custom_bg_cleared:"Arrière-plan personnalisé effacé.", toast_wallpaper_cleared:"Fond d’écran effacé.", toast_cleared:"Effacé.", toast_custom_bg_saved:"Arrière-plan personnalisé enregistré.", toast_removed:"Supprimé.", toast_cleared_all_saved_lines:"Toutes les lignes enregistrées ont été effacées.", toast_nothing_to_copy:"Rien à copier.", toast_copied:"Copié.", toast_copy_failed:"Échec de la copie.", toast_nothing_to_export:"Rien à exporter." },
      de: { toast_custom_bg_cleared:"Benutzerhintergrund gelöscht.", toast_wallpaper_cleared:"Hintergrundbild gelöscht.", toast_cleared:"Geleert.", toast_custom_bg_saved:"Benutzerhintergrund gespeichert.", toast_removed:"Entfernt.", toast_cleared_all_saved_lines:"Alle gespeicherten Zeilen gelöscht.", toast_nothing_to_copy:"Nichts zu kopieren.", toast_copied:"Kopiert.", toast_copy_failed:"Kopieren fehlgeschlagen.", toast_nothing_to_export:"Nichts zu exportieren." },
      it: { toast_custom_bg_cleared:"Sfondo personalizzato cancellato.", toast_wallpaper_cleared:"Wallpaper cancellato.", toast_cleared:"Cancellato.", toast_custom_bg_saved:"Sfondo personalizzato salvato.", toast_removed:"Rimosso.", toast_cleared_all_saved_lines:"Tutte le righe salvate sono state cancellate.", toast_nothing_to_copy:"Niente da copiare.", toast_copied:"Copiato.", toast_copy_failed:"Copia non riuscita.", toast_nothing_to_export:"Niente da esportare." },
      nl: { toast_custom_bg_cleared:"Aangepaste achtergrond gewist.", toast_wallpaper_cleared:"Achtergrondafbeelding gewist.", toast_cleared:"Gewist.", toast_custom_bg_saved:"Aangepaste achtergrond opgeslagen.", toast_removed:"Verwijderd.", toast_cleared_all_saved_lines:"Alle opgeslagen regels gewist.", toast_nothing_to_copy:"Niets om te kopiëren.", toast_copied:"Gekopieerd.", toast_copy_failed:"Kopiëren mislukt.", toast_nothing_to_export:"Niets om te exporteren." },
      tr: { toast_custom_bg_cleared:"Özel arka plan temizlendi.", toast_wallpaper_cleared:"Duvar kağıdı temizlendi.", toast_cleared:"Temizlendi.", toast_custom_bg_saved:"Özel arka plan kaydedildi.", toast_removed:"Kaldırıldı.", toast_cleared_all_saved_lines:"Tüm kayıtlı satırlar temizlendi.", toast_nothing_to_copy:"Kopyalanacak bir şey yok.", toast_copied:"Kopyalandı.", toast_copy_failed:"Kopyalama başarısız.", toast_nothing_to_export:"Dışa aktarılacak bir şey yok." },
      pl: { toast_custom_bg_cleared:"Niestandardowe tło wyczyszczone.", toast_wallpaper_cleared:"Tapeta wyczyszczona.", toast_cleared:"Wyczyszczono.", toast_custom_bg_saved:"Niestandardowe tło zapisane.", toast_removed:"Usunięto.", toast_cleared_all_saved_lines:"Wyczyszczono wszystkie zapisane linie.", toast_nothing_to_copy:"Nie ma nic do skopiowania.", toast_copied:"Skopiowano.", toast_copy_failed:"Nie udało się skopiować.", toast_nothing_to_export:"Nie ma nic do eksportu." },
      id: { toast_custom_bg_cleared:"Latar khusus dibersihkan.", toast_wallpaper_cleared:"Wallpaper dibersihkan.", toast_cleared:"Dibersihkan.", toast_custom_bg_saved:"Latar khusus disimpan.", toast_removed:"Dihapus.", toast_cleared_all_saved_lines:"Semua baris tersimpan dibersihkan.", toast_nothing_to_copy:"Tidak ada yang bisa disalin.", toast_copied:"Disalin.", toast_copy_failed:"Gagal menyalin.", toast_nothing_to_export:"Tidak ada yang bisa diekspor." },
      ru: { toast_custom_bg_cleared:"Кастомный фон очищен.", toast_wallpaper_cleared:"Обои очищены.", toast_cleared:"Очищено.", toast_custom_bg_saved:"Кастомный фон сохранён.", toast_removed:"Удалено.", toast_cleared_all_saved_lines:"Все сохранённые строки очищены.", toast_nothing_to_copy:"Нечего копировать.", toast_copied:"Скопировано.", toast_copy_failed:"Не удалось скопировать.", toast_nothing_to_export:"Нечего экспортировать." },
      uk: { toast_custom_bg_cleared:"Кастомний фон очищено.", toast_wallpaper_cleared:"Шпалери очищено.", toast_cleared:"Очищено.", toast_custom_bg_saved:"Кастомний фон збережено.", toast_removed:"Видалено.", toast_cleared_all_saved_lines:"Усі збережені рядки очищено.", toast_nothing_to_copy:"Немає що копіювати.", toast_copied:"Скопійовано.", toast_copy_failed:"Не вдалося скопіювати.", toast_nothing_to_export:"Немає що експортувати." },
      hi: { toast_custom_bg_cleared:"कस्टम बैकग्राउंड साफ़ किया गया।", toast_wallpaper_cleared:"वॉलपेपर साफ़ किया गया।", toast_cleared:"साफ़ किया गया।", toast_custom_bg_saved:"कस्टम बैकग्राउंड सेव किया गया।", toast_removed:"हटा दिया गया।", toast_cleared_all_saved_lines:"सभी सेव की गई लाइन्स साफ़ की गईं।", toast_nothing_to_copy:"कॉपी करने के लिए कुछ नहीं।", toast_copied:"कॉपी हो गया।", toast_copy_failed:"कॉपी नहीं हो सका।", toast_nothing_to_export:"एक्सपोर्ट करने के लिए कुछ नहीं।" },
      ja: { toast_custom_bg_cleared:"カスタム背景をクリアしました。", toast_wallpaper_cleared:"壁紙をクリアしました。", toast_cleared:"クリアしました。", toast_custom_bg_saved:"カスタム背景を保存しました。", toast_removed:"削除しました。", toast_cleared_all_saved_lines:"保存済みの行をすべてクリアしました。", toast_nothing_to_copy:"コピーするものがありません。", toast_copied:"コピーしました。", toast_copy_failed:"コピーに失敗しました。", toast_nothing_to_export:"エクスポートするものがありません。" },
      zh: { toast_custom_bg_cleared:"自定义背景已清除。", toast_wallpaper_cleared:"壁纸已清除。", toast_cleared:"已清除。", toast_custom_bg_saved:"自定义背景已保存。", toast_removed:"已移除。", toast_cleared_all_saved_lines:"已清除所有已保存的内容。", toast_nothing_to_copy:"没有可复制的内容。", toast_copied:"已复制。", toast_copy_failed:"复制失败。", toast_nothing_to_export:"没有可导出的内容。" }
    };
    try{
      for (const [lang, pack] of Object.entries(ADD_TOAST)){
        if (!I18N[lang]) continue;
        Object.assign(I18N[lang], pack);
      }
    }catch{}
  })();

  // Extra i18n for Referrals minimal UI
  (function(){
    const ADD_REF = {
      en: {
        r_loading:"Loading…",
        r_no_invited:"No invited users yet",
        r_flagged:"Flagged",
        r_eligible:"Eligible",
        r_not_yet:"Not yet",
        r_note:"Referrals count only when they lead to real product usage (not just signups).",
        r_invited_note:"Active means the invited user used the product at least once. Fraud-flagged invites don’t count.",
        r_desc:"Short version:",
        r_li1:"Share your referral link.",
        r_li2:"Confirmed = signup via your link.",
        r_li3:"Active = confirmed referral who used the product at least once.",
        r_li4:"Eligible = max(active, legacy). Legacy is grandfathered and only used if larger.",
        r_col_handle:"Handle",
        r_col_inserts:"Used",
        r_col_active:"Active days",
        r_col_status:"Status",

        ref_promo_title:"Promoter rules",
        ref_k_confirmed:"Confirmed",
        ref_k_active:"Active",
        ref_k_legacy:"Legacy",
        ref_k_eligible:"Eligible",
        ref_def_confirmed:"users who registered via your link.",
        ref_def_active:"confirmed users with at least one recorded usage.",
        ref_def_legacy:"older referrals from the previous system.",
        ref_def_eligible:"max(active, legacy) (grandfather rule).",
        ref_daily_limit_title:"Daily inserts limit (GM + GN each)",
        ref_per_day:"per day",
        ref_base_plus_bonus:"base {base} + bonus {bonus}",
        ref_bonus_rule:"Bonus: +{per20} daily inserts for each 20 eligible referrals (steps unlocked: {chunks}).",
        ref_next_bonus:"Next bonus step at {nextAt} eligible referrals.",
        ref_cap_note:"bonus capped at {cap}",
        ref_owner_inactive:"bonus paused until you use the product",
        ref_abuse_note:"Automation, self-referrals, duplicates and fraud do not count. Bonuses may be recalculated if abuse is detected."
      },
      ru: {
        r_loading:"Загрузка…",
        r_no_invited:"Пока нет приглашённых",
        r_flagged:"Флаг",
        r_eligible:"Зачтён",
        r_not_yet:"Пока нет",
        r_note:"Рефералы считаются только при реальном использовании продукта (не за регистрацию).",
        r_invited_note:"Active = приглашённый использовал продукт хотя бы один раз. Флагнутые приглашения не считаются.",
        r_desc:"Коротко:",
        r_li1:"Поделись своей ссылкой.",
        r_li2:"Confirmed = регистрация по твоей ссылке.",
        r_li3:"Active = confirmed, кто использовал продукт хотя бы один раз.",
        r_li4:"Eligible = max(active, legacy). Legacy учитывается только если больше (grandfather).",
        r_col_handle:"Хендл",
        r_col_inserts:"Использование",
        r_col_active:"Активные дни",
        r_col_status:"Статус",

        ref_promo_title:"Правила промоутеров",
        ref_k_confirmed:"Confirmed",
        ref_k_active:"Active",
        ref_k_legacy:"Legacy",
        ref_k_eligible:"Eligible",
        ref_def_confirmed:"пользователи, зарегистрировавшиеся по твоей ссылке.",
        ref_def_active:"confirmed с хотя бы одним реальным использованием.",
        ref_def_legacy:"старые рефералы из предыдущей системы.",
        ref_def_eligible:"max(active, legacy) (правило grandfather).",
        ref_daily_limit_title:"Дневной лимит вставок (GM + GN отдельно)",
        ref_per_day:"в день",
        ref_base_plus_bonus:"база {base} + бонус {bonus}",
        ref_bonus_rule:"Бонус: +{per20} к дневному лимиту за каждые 20 eligible (шагов открыто: {chunks}).",
        ref_next_bonus:"Следующий шаг бонуса на {nextAt} eligible.",
        ref_cap_note:"бонус ограничен {cap}",
        ref_owner_inactive:"бонус остановлен, пока ты сам не используешь продукт",
        ref_abuse_note:"Автоматизация, саморефералы, дубликаты и фрод не считаются. Бонусы могут быть пересчитаны при злоупотреблениях."
      }
    };
    try{
      for (const [lang, pack] of Object.entries(ADD_REF)){
        if (!I18N[lang]) continue;
        Object.assign(I18N[lang], pack);
      }
    }catch{}
  })();

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

    // Allow explicit HTML for specific nodes
    if (typeof val === "string" && val.startsWith("HTML:")){
      el.innerHTML = val.slice(5);
      return;
    }

    el.textContent = String(val);
  }



  const FORCE_EN_KEYS = new Set([]);

  function applyLang(){
    const lang = localStorage.getItem(LS_SITE_LANG) || "en";
    const base = I18N.en || {};
    const d = I18N[lang] || {};

    // Treat empty translations as missing (fallback to EN)
    const merged = Object.assign({}, base);
    for (const [k,v] of Object.entries(d)){
      if (v === "" || v === null || v === undefined) continue;
      merged[k] = v;
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

  function patchDynamicCopy(lang, merged){
    // Ensure limits copy stays consistent with actual constants.
    try{
      const ul = $("h_guide");
      if (ul && ul.tagName === "UL"){
        const items = Array.from(ul.querySelectorAll("li")).map(li=>li.innerHTML);
        if (items.length){
          const en = `<b>Limits:</b> Free = up to <b>${SAVE_CAP_FREE}</b> saved lines for GM and <b>${SAVE_CAP_FREE}</b> for GN. Free cosmetics: <b>${FREE_VISIBLE_THEMES}</b> themes + <b>${FREE_VISIBLE_WALLPAPERS}</b> wallpapers. Editing is unlimited. Pro removes caps and unlocks everything.`;
          const ru = `<b>Лимиты:</b> Бесплатно = до <b>${SAVE_CAP_FREE}</b> строк для GM и до <b>${SAVE_CAP_FREE}</b> для GN. Бесплатные визуальные: <b>${FREE_VISIBLE_THEMES}</b> тем и <b>${FREE_VISIBLE_WALLPAPERS}</b> обоев. Редактирование без лимита. Pro снимает лимиты и открывает всё.`;
          items[items.length-1] = (String(lang||"") === "ru") ? ru : en;
          ul.innerHTML = items.map(x=>`<li>${x}</li>`).join("");
        }
      }
    }catch(e){}

    try{
      const tr = $("themes_rules");
      if (tr){
        const en = `Free: ${FREE_VISIBLE_THEMES} themes + ${FREE_VISIBLE_WALLPAPERS} wallpapers. Referrals unlock more cosmetics. Pro unlocks everything and removes the ${SAVE_CAP_FREE}-line cap.`;
        const ru = `Бесплатно: ${FREE_VISIBLE_THEMES} тем и ${FREE_VISIBLE_WALLPAPERS} обоев. Рефералы открывают больше визуальных. Pro открывает всё и снимает лимит ${SAVE_CAP_FREE} строк.`;
        tr.textContent = (String(lang||"") === "ru") ? ru : en;
      }
    }catch(e){}

    // Wallet / Upgrade right-side copy (was hardcoded -> did not translate)
    try{
      const isRu = (String(lang||"") === "ru");
      const title = $("w_right");
      const desc  = $("w_right_desc");
      const list  = $("w_right_list");
      const pht = $("w_pay_help_title");
      const phl = $("w_pay_help_list");
      const tt  = $("w_trust_title");
      const tl  = $("w_trust_list");

      if (title) title.textContent = isRu ? "Как работает Pro и рефералы" : "How Pro & referrals work";
      if (desc) desc.textContent = isRu
        ? "Free позволяет собирать и редактировать списки GM/GN. Pro снимает лимиты и открывает всё."
        : "Free lets you build and edit your GM/GN lists. Pro unlocks everything and removes limits.";

      if (list){
        const en = [
          `<li><b>Free:</b> save up to <b>${SAVE_CAP_FREE}</b> GM lines + <b>${SAVE_CAP_FREE}</b> GN lines. Daily inserts: <b>${DAILY_FREE}</b> each.</li>`,
          `<li><b>Free cosmetics:</b> <b>${FREE_VISIBLE_THEMES}</b> themes + <b>${FREE_VISIBLE_WALLPAPERS}</b> wallpapers. More via referrals or Pro.</li>`,
          `<li><b>Referrals:</b> unlock more cosmetics gradually. Full details in <b>Referrals</b> tab.</li>`,
          `<li><b>Pro:</b> unlimited daily inserts, unlock everything, advanced controls.</li>`,
          `<li><b>Pay:</b> select a plan → choose SOL/USDC/USDT → connect wallet → approve transfer.</li>`
        ].join("");
        const ru = [
          `<li><b>Free:</b> до <b>${SAVE_CAP_FREE}</b> строк GM и <b>${SAVE_CAP_FREE}</b> строк GN. Дневные вставки: <b>${DAILY_FREE}</b> для каждого.</li>`,
          `<li><b>Бесплатные визуальные:</b> <b>${FREE_VISIBLE_THEMES}</b> тем и <b>${FREE_VISIBLE_WALLPAPERS}</b> обоев. Больше — через рефералы или Pro.</li>`,
          `<li><b>Рефералы:</b> постепенно открывают больше визуальных. Детали — во вкладке <b>Referrals</b>.</li>`,
          `<li><b>Pro:</b> безлимит дневных вставок, всё открыто, расширенные настройки.</li>`,
          `<li><b>Оплата:</b> выбери план → SOL/USDC/USDT → подключи кошелёк → подтверди перевод.</li>`
        ].join("");
        list.innerHTML = isRu ? ru : en;
      }

      if (pht) pht.textContent = isRu ? "Шаги оплаты" : "Payment steps";
      if (phl) phl.innerHTML = (isRu ? [
        `<li>Выбери план и токен оплаты (SOL / USDC / USDT).</li>`,
        `<li>Подключи кошелёк и подтверди перевод внутри кошелька.</li>`,
        `<li>Мы проверим транзакцию в сети Solana и активируем Pro для твоего @.</li>`
      ] : [
        `<li>Select a plan and choose a payment token (SOL / USDC / USDT).</li>`,
        `<li>Connect a wallet and approve the transfer inside your wallet.</li>`,
        `<li>We verify the transaction on-chain and activate Pro for your handle.</li>`
      ]).join("");

      if (tt) tt.textContent = isRu ? "Доверие и безопасность" : "Trust & safety";
      if (tl) tl.innerHTML = (isRu ? [
        `<li><b>Без seed-фразы:</b> мы никогда не просим секретные слова или приватные ключи.</li>`,
        `<li><b>Обычный перевод:</b> адрес получателя и сумма всегда видны в кошельке до подтверждения.</li>`,
        `<li><b>Проверка on-chain:</b> Pro активируется только после подтверждённой транзакции.</li>`
      ] : [
        `<li><b>No seed phrase:</b> we never ask for your secret words or private keys.</li>`,
        `<li><b>Standard transfer:</b> you will always see receiver address and amount inside your wallet before approving.</li>`,
        `<li><b>On-chain verification:</b> Pro activates only after we verify your transaction on Solana.</li>`
      ]).join("");
    }catch(e){}

    // Extension themes right-side copy (was hardcoded -> did not translate)
    try{
      const isRu = (String(lang||"") === "ru");
      const t1 = $("extthemes_right_title");
      const d1 = $("extthemes_right_desc");
      const l1 = $("extthemes_right_list");
      if (t1) t1.textContent = isRu ? "Как работают разблокировки" : "How unlocks work";
      if (d1) d1.textContent = isRu
        ? `Бесплатный просмотр: первые ${FREE_VISIBLE_EXT_THEMES} скинов. +1 скин при ${FREE_VISIBLE_EXT_THEMES} рефералах, затем +1 каждые 5. Pro открывает всё.`
        : `Free preview: first ${FREE_VISIBLE_EXT_THEMES} extension skins. Unlock +1 at ${FREE_VISIBLE_EXT_THEMES} referrals, then +1 every 5. Pro unlocks everything.`;
      if (l1) l1.innerHTML = (isRu ? [
        `<li>Скин выбирается на сайте и синхронизируется в расширение.</li>`,
        `<li>Одновременно активен только один скин.</li>`,
        `<li>Pro также снимает лимит ${SAVE_CAP_FREE} строк и открывает все стили/пакеты.</li>`
      ] : [
        `<li>Skins are applied from the site and synced to the extension.</li>`,
        `<li>Only 1 skin is active at a time.</li>`,
        `<li>Pro also removes the ${SAVE_CAP_FREE}-line cap and unlocks all writing styles/preset packs.</li>`
      ]).join("");
    }catch(e){}
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
    if (cfg.languages && Array.isArray(cfg.languages.reply)) REPLY_LANGS = cfg.languages.reply;
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

    // Keep translations consistent even when UI re-renders content dynamically.
    (function(){
      let t=null;
      function kick(){
        if(t) clearTimeout(t);
        t=setTimeout(()=>{ try{ applyLang(); }catch{} }, 30);
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

  if (siteLangSel) siteLangSel.addEventListener("change", ()=>{
    localStorage.setItem(LS_SITE_LANG, siteLangSel.value);
    applyLang();
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
  syncCustomBgUI();
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
  const gmRand70Btn = $("gmRand70");
  if (gmRand70Btn) gmRand70Btn.onclick = ()=>{ if(requireConnected("GM")){ try{trackEvent("generate_click",{kind:"gm",count:70});}catch(_e){} generate("gm", 70); } };
  const gmBestBtn = $("gmBestBtn");
  if (gmBestBtn) gmBestBtn.onclick = ()=>{ if(requireConnected("GM")){ try{trackEvent("best_click",{kind:"gm"});}catch(_e){} doBest("gm"); } };

  const gnRand1Btn = $("gnRand1");
  if (gnRand1Btn) gnRand1Btn.onclick = ()=>{ if(requireConnected("GN")){ try{trackEvent("generate_click",{kind:"gn",count:1});}catch(_e){} generate("gn", 1); } };
  const gnRand10Btn = $("gnRand10");
  if (gnRand10Btn) gnRand10Btn.onclick = ()=>{ if(requireConnected("GN")){ try{trackEvent("generate_click",{kind:"gn",count:10});}catch(_e){} generate("gn", 10); } };
  const gnRand70Btn = $("gnRand70");
  if (gnRand70Btn) gnRand70Btn.onclick = ()=>{ if(requireConnected("GN")){ try{trackEvent("generate_click",{kind:"gn",count:70});}catch(_e){} generate("gn", 70); } };
  const gnBestBtn = $("gnBestBtn");
  if (gnBestBtn) gnBestBtn.onclick = ()=>{ if(requireConnected("GN")){ try{trackEvent("best_click",{kind:"gn"});}catch(_e){} doBest("gn"); } };

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

  // draft autosave
  const gmPaste = $("gmPaste");
  const gnPaste = $("gnPaste");
  if (gmNewLineInp) gmNewLineInp.addEventListener("input", ()=>saveDraft("gm"));
  if (gnNewLineInp) gnNewLineInp.addEventListener("input", ()=>saveDraft("gn"));
  if (gmPaste) gmPaste.addEventListener("input", ()=>saveDraft("gm"));
  if (gnPaste) gnPaste.addEventListener("input", ()=>saveDraft("gn"));


  // custom background (themes)
  const customPick = $("customBgPick");
  const customFile = $("customBgFile");
  const customRm = $("customBgRemove");
  const customClear = $("customBgClear");
  const customTabSel = $("customBgTab");

  if (customPick && customFile){
    customPick.onclick = ()=>{
      if(!requireConnected("Themes")) return;
      const target = (customTabSel?.value || "all");
      if (!canSetCustomBgOnTab(target)){
        const need = requiredRefsForCustomBgTab(target);
        if ($("customBg_status")) $("customBg_status").textContent = `Locked: need ${need} referrals to unlock this tab (or upgrade to Pro).`;
        return;
      }
      customFile.click();
    };
  }

  if (customFile){
    customFile.addEventListener("change", async ()=>{
      try{
        if (!requireConnected("Themes")) { customFile.value = ""; return; }
        const target = (customTabSel?.value || "all");
        if (!canSetCustomBgOnTab(target)){
          const need = requiredRefsForCustomBgTab(target);
          if ($("customBg_status")) $("customBg_status").textContent = `Locked: need ${need} referrals to unlock this tab (or upgrade to Pro).`;
          customFile.value = "";
          return;
        }
        const f = customFile.files && customFile.files[0];
        if (!f) return;
        if ($("customBgName")) $("customBgName").textContent = f.name || "";
        const data = await compressImageToJpegDataURL(f);
        setCustomBgForTab(target, data);
        renderCustomBgUI();
        {
          const previewTab = (target === "all") ? currentTabName() : target;
          applyUserBg(previewTab);
        }
        toast("ok", (t("toast_custom_bg_saved")||"Custom background saved."));
      }catch(e){
        if ($("customBg_status")) $("customBg_status").textContent = "Could not save this image (too large or blocked by browser storage).";
      }finally{
        customFile.value = "";
      }
    });
  }

  if (customRm){
    customRm.addEventListener("click", ()=>{
      if (!requireConnected("Themes")) return;
      const target = (customTabSel?.value || "all");
      setCustomBgForTab(target, null);
      renderCustomBgUI();
      applyUserBg();
      toast("ok", (t("toast_removed")||"Removed."));
    });
  }

  // init custom bg UI (fills select + clear)
  try{ syncCustomBgUI(); }catch(e){}
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
    if (strength >= 2){
      t = t.replace(/[~`!@#$%^&*()_=+\[\]{};:'",.<>/?\\|]/g, " ");
      t = t.replace(/\s+/g, " ").trim();
    }
    if (strength >= 3){
      try{
        t = t.replace(/[^\p{L}\p{N}\s]/gu, " ");
        t = t.replace(/\s+/g, " ").trim();
      } catch {
        t = t.replace(/[^a-z0-9\s]/gi, " ");
        t = t.replace(/\s+/g, " ").trim();
      }
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

  
  function oneClickCleanup(kind){
    if (!getHandle()){ tab("home"); return; }
    const key = activeKey(kind);
    const cur = readKey(key);
    const cleaned = cleanupKeyLines(cur);
    writeKey(key, cleaned);
    renderList(kind);
    const msgEl = kind==="gm" ? $("gmMsg") : $("gnMsg");
    msgEl.innerHTML = `<span class="ok">Cleaned: ${cur.length} → ${cleaned.length}</span>`;
  }

function cleanupKeyLines(lines){
    return dedupeLines((lines||[]).filter(Boolean));
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
      const after = dedupeLines(before).map(normalizeLine).filter(Boolean);
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
    const data = {
      v: 1,
      handle: getHandle(),
      theme: localStorage.getItem("gmx_theme") || "classic",
      customBg: localStorage.getItem(LS_CUSTOM_BG_GLOBAL) || null,
      gm: {
        index: getLangIndex("gm"),
        global: readKey(getGlobalKey("gm")),
        langs: Object.fromEntries(getLangIndex("gm").map(l => [l, readKey(getLangKey("gm", l))]))
      },
      gn: {
        index: getLangIndex("gn"),
        global: readKey(getGlobalKey("gn")),
        langs: Object.fromEntries(getLangIndex("gn").map(l => [l, readKey(getLangKey("gn", l))]))
      }
    };
    return JSON.stringify(data);
  }

  function importData(jsonText){
    const data = JSON.parse(jsonText);
    if (!data || typeof data !== "object") throw new Error("bad_json");
    if (!data.gm || !data.gn) throw new Error("missing_sections");

    // theme + bg (optional)
    if (data.theme) localStorage.setItem("gmx_theme", String(data.theme));
    if ("customBg" in data){
      if (data.customBg) localStorage.setItem(LS_CUSTOM_BG_GLOBAL, String(data.customBg));
      else localStorage.removeItem(LS_CUSTOM_BG_GLOBAL);
    }

    // GM
    const gmIndex = Array.isArray(data.gm.index) ? data.gm.index : [];
    setLangIndex("gm", gmIndex);
    writeKey(getGlobalKey("gm"), Array.isArray(data.gm.global) ? data.gm.global : []);
    const gmLangs = data.gm.langs && typeof data.gm.langs === "object" ? data.gm.langs : {};
    for (const l of gmIndex){
      const arr = Array.isArray(gmLangs[l]) ? gmLangs[l] : [];
      writeKey(getLangKey("gm", l), arr);
    }

    // GN
    const gnIndex = Array.isArray(data.gn.index) ? data.gn.index : [];
    setLangIndex("gn", gnIndex);
    writeKey(getGlobalKey("gn"), Array.isArray(data.gn.global) ? data.gn.global : []);
    const gnLangs = data.gn.langs && typeof data.gn.langs === "object" ? data.gn.langs : {};
    for (const l of gnIndex){
      const arr = Array.isArray(gnLangs[l]) ? gnLangs[l] : [];
      writeKey(getLangKey("gn", l), arr);
    }

    // re-render
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

  function diagnosticsBundle(){
    const uiLang = localStorage.getItem(LS_SITE_LANG) || "en";
    const gmLang = currentLang("gm");
    const gnLang = currentLang("gn");
    const diag = {
      product: "GMXReply",
      ts: new Date().toISOString(),
      handle: getHandle(),
      isPro: isPro(),
      refCount: REF_COUNT || 0,
      sub: SUB ? { active:true, tier: SUB.tier || SUB.plan || "", until: SUB.until || SUB.expires || "" } : { active:false },
      uiLang,
      settings: {
        gm: { pack: localStorage.getItem(LS_GM_PACK)||"classic", anti: getAntiStrength("gm"), view: gmView, replyLang: gmLang, style: $("gmStyle") ? $("gmStyle").value : "" },
        gn: { pack: localStorage.getItem(LS_GN_PACK)||"classic", anti: getAntiStrength("gn"), view: gnView, replyLang: gnLang, style: $("gnStyle") ? $("gnStyle").value : "" },
      },
      lists: {
        gmTotal: totalSaved("gm"),
        gnTotal: totalSaved("gn"),
        gmLangs: getLangIndex("gm"),
        gnLangs: getLangIndex("gn"),
      },
      theme: localStorage.getItem("gmx_theme") || "classic",
      hasCustomBg: !!localStorage.getItem(LS_CUSTOM_BG_GLOBAL),
      storage: {
        approxBytes: (()=>{ try{ let n=0; for (const k in localStorage){ const v=localStorage.getItem(k)||""; n += (k.length+v.length)*2; } return n; } catch { return null; } })()
      },
      ua: navigator.userAgent
    };
    return JSON.stringify(diag, null, 2);
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
        if (note) note.textContent = "Support bundle copied. Paste it to support.";
      });
    }

    const diagBtn = $("toolDiag");
    if (diagBtn){
      diagBtn.addEventListener("click", async ()=>{
        const out = diagnosticsBundle();
        const ta = $("supportOut");
        if (ta) ta.value = out;
        await copyToClipboard(out);
        if (note) note.textContent = "Diagnostics copied. Paste it to support.";
        logEvent("support_diag", { size: out.length });
      });
    }

    const logsBtn = $("toolLogs");
    if (logsBtn){
      logsBtn.addEventListener("click", async ()=>{
        const out = logsBundle();
        const ta = $("supportOut");
        if (ta) ta.value = out;
        await copyToClipboard(out);
        if (note) note.textContent = "Logs copied. Paste it to support.";
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

          // anti defaults
          const antiEl = kind==="gm" ? $("gmAnti") : $("gnAnti");
          if (antiEl){
            const max = isPro() ? 5 : 2;
            const v = Math.max(0, Math.min(max, p.anti));
            antiEl.value = String(v);
            localStorage.setItem(lsKeyAnti(kind), String(v));
            setRangeText(kind==="gm" ? "gmAntiVal" : "gnAntiVal", antiWindow(v));
          }

          if (msgEl) msgEl.innerHTML = `<span class="ok">Applied pack: ${escapeHtml(p.name)}</span>`;
          logEvent("pack_apply", { kind, pack: pid });
        });
      }
    };

    const bindRanges = (kind)=>{
      const antiEl = kind==="gm" ? $("gmAnti") : $("gnAnti");
      if (antiEl){
        antiEl.addEventListener("input", ()=>{
          const max = isPro() ? 5 : 2;
          let v = parseInt(String(antiEl.value||"0"),10);
          if (isNaN(v)) v = 0;
          v = Math.max(0, Math.min(max, v));
          antiEl.value = String(v);
          localStorage.setItem(lsKeyAnti(kind), String(v));
          setRangeText(kind==="gm" ? "gmAntiVal" : "gnAntiVal", antiWindow(v));
        });
      }
    };

    // initial sync
    const sync = (kind)=>{
      const antiEl = kind==="gm" ? $("gmAnti") : $("gnAnti");
      const anti = getAntiStrength(kind);
      if (antiEl){
        antiEl.value = String(anti);
        setRangeText(kind==="gm" ? "gmAntiVal" : "gnAntiVal", antiWindow(anti));
      }
    };

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

  // restore session if exists
  $("handlePill").textContent = getHandle() ? getHandle() : "not set";
  $("xHandle").value = getHandle() || "";

  applyAdminVisibility();
  try{ initModeToggle(); }catch(e){}
  applyLang();
  try{ initThemeWallTabs(); }catch{}
  try{ bindExtTabs(); }catch{}
  try{ setExtView(localStorage.getItem(LS_EXT_VIEW) || "theme"); }catch{}
  restoreDrafts();

  tab("home");
  CURRENT_TAB = "home";
  setBg("home");

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
      try{ if (typeof toast === "function") toast("warn", "Recovering… reloading", 2500); }catch{}
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


}
