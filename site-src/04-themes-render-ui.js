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
const LS_EXT_CUSTOM_BG_TAB_PREFIX = K.EXT_CUSTOM_BG_TAB_PREFIX;
const LS_EXT_CUSTOM_BG_TARGET = K.EXT_CUSTOM_BG_TARGET;
const LS_EXT_CUSTOM_BG_LEGACY = K.EXT_CUSTOM_BG_LEGACY;

const EXT_POPUP_TABS = [
  ["all","wp_apply_all"],
  ["home","wp_apply_home"],
  ["gm","wp_apply_gm"],
  ["gn","wp_apply_gn"],
  ["referrals","wp_apply_referrals"],
  ["themes","wp_apply_themes"],
  ["wallet","wp_apply_wallet"],
];
const LS_EXT_WP_TARGET = K.EXT_WP_TARGET;
const LS_EXT_WP_VIEW_PREFIX = K.EXT_WP_VIEW_PREFIX;
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
  if (v === "wall" || v === "custom") return v;
  return "theme";
}

function setExtView(view, opts){
  const safeView = normalizeExtViewValue(view);
  const prev = normalizeExtViewValue(localStorage.getItem(LS_EXT_VIEW) || "theme");
  extLsSet(LS_EXT_VIEW, safeView);
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

  function markWallpaperSelection(activeId){ return __gmxWpUi.markWallpaperSelection(activeId); }

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
    extLsSet("gmx_ext_theme", id);
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


function syncThemesUnlockMeters(curThemes, totalThemes, curWps, totalWps){
  const label = formatUnlockMeter(curThemes, totalThemes);
  const wpLabel = formatUnlockMeter(curWps, totalWps);
  for (const id of ["themesUnlocked", "themesUnlockedVal"]) {
    const el = $(id);
    if (el) el.textContent = label;
  }
  for (const id of ["wpUnlocked", "wpUnlockedVal"]) {
    const el = $(id);
    if (el) el.textContent = wpLabel;
  }
  try{ setMeter("themesUnlockedVal", "themesUnlockedFill", curThemes, totalThemes); }catch{}
  try{ setMeter("wpUnlockedVal", "wpUnlockedFill", curWps, totalWps); }catch{}
  const refKpi = $("themes_k_ref")?.closest?.(".kpi");
  if (refKpi) refKpi.style.display = isPro() ? "none" : "";
  const freeTip = $("themes_free_tip");
  if (freeTip) {
    freeTip.textContent = isPro()
      ? (t("themes_pro_tip") || "Pro unlocks the full theme and wallpaper library.")
      : (t("themes_free_tip") || "On Free, referrals increase your cosmetic room. On Pro, the full set is already open.");
  }
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

  syncThemesUnlockMeters(curThemes, total, curWps, WALLPAPERS.length);

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
  if (el) el.textContent = formatUnlockMeter(Math.min(unlocked, total), total);
  const wEl = $("extWpUnlocked");
  if (wEl) wEl.textContent = formatUnlockMeter(Math.min(unlockedCountByRefs(EXT_WALLPAPERS.length, FREE_VISIBLE_EXT_WALLPAPERS), EXT_WALLPAPERS.length), EXT_WALLPAPERS.length);

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

function renderExtWallpapers(){ return __gmxExtWpUi.renderExtWallpapers(); }

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
        extLsSet(LS_EXT_CUSTOM_BG_GLOBAL, data);
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





