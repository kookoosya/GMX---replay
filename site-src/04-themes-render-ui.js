function applyTheme(id){
    const t = THEMES.find(x=>x.id===id) || THEMES[0];
    // persist selected site theme
    try { localStorage.setItem("gmx_theme", String(t.id || id)); } catch(e) {}
    // CSS uses both --accentA and --accentB across gradients.
    const a = t.a || "rgba(124,92,255,1)";
    const b = t.b || "rgba(0,229,255,1)";
    const root = document.documentElement;
    root.style.setProperty("--accentA", a);
    root.style.setProperty("--accentB", b);
    root.style.setProperty("--accentOn", pickAccentOn(a, b));
    root.classList.add("theme-applied");
    root.dataset.themeId = String(t.id || id);
    const isLight = root.classList.contains("mode-light");
    const glassBase = isLight ? "rgba(255,255,255,.88)" : "rgba(10,14,24,.72)";
    const glass2Base = isLight ? "rgba(255,255,255,.94)" : "rgba(8,12,22,.82)";
    root.style.setProperty("--glass", `color-mix(in srgb, ${glassBase} 84%, ${a} 16%)`);
    root.style.setProperty("--glass2", `color-mix(in srgb, ${glass2Base} 82%, ${b} 18%)`);
    root.style.setProperty("--stroke", `color-mix(in srgb, ${a} 30%, ${isLight ? "rgba(0,0,0,.10)" : "rgba(148,180,255,.14)"})`);
    root.style.setProperty("--stroke2", `color-mix(in srgb, ${b} 34%, ${isLight ? "rgba(0,0,0,.14)" : "rgba(148,180,255,.22)"})`);
    try{
      const tab = (typeof CURRENT_TAB === "string" && CURRENT_TAB) ? CURRENT_TAB : "home";
      if (typeof setBg === "function") setBg(tab);
    }catch(_e){}
  }
const LS_EXT_VIEW = K.EXT_VIEW;
const LS_EXT_WP = K.EXT_WP;
function extLsSet(key, value){ __gmxSt.extLsSet(key, value); }


// Custom background for extension popup (per-tab + global)
// Note: this is stored on the site and later synced to the extension.
const LS_EXT_CUSTOM_BG_GLOBAL = K.EXT_CUSTOM_BG_GLOBAL;

const LS_EXT_WP_TARGET = K.EXT_WP_TARGET;
const LS_EXT_WP_VIEW_PREFIX = K.EXT_WP_VIEW_PREFIX;
const EXT_WALLPAPER_VIEWS = [
  ["all", "All views"],
  ["popup", "Popup"],
  ["quick", "Quick panel"],
];

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
    extLsSet(key, safeId || "");
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





