  // Wallpapers — per-tab. Photo pack (webp under /assets/wallpapers/v2_*.webp).
  const LS_WP_GLOBAL = K.WP_GLOBAL;
  const LS_WP_TAB_PREFIX = K.WP_TAB_PREFIX;
  const SITE_WALLPAPER_PACK_COUNT = __gmxWp.SITE_PACK_COUNT;
  const SITE_WALLPAPER_FREE_PACK_COUNT = __gmxWp.SITE_FREE_PACK_COUNT;
  const CUSTOM_WP_FREE_COUNT = __gmxWp.CUSTOM_WP_FREE_COUNT;
  const CUSTOM_UPLOAD_ID = __gmxWp.CUSTOM_UPLOAD_ID;
  const CUSTOM_WP_RE = __gmxWp.CUSTOM_WP_RE;
  const WALLPAPERS = __gmxWp.buildSiteWallpapers();
  const WALLPAPER_REFRESH_MIGRATION_KEY = K.WALLPAPER_REFRESH_MIGRATION;
  function migrateLegacyWallpaperSelectionOnce(){
    try{
      if (localStorage.getItem(WALLPAPER_REFRESH_MIGRATION_KEY) === "1") return;
      const mapLegacy = (id) => {
        const v = String(id || "").trim();
        if (!v) return "";
        if (/^free0[12]$/i.test(v) || /^w\d+$/i.test(v) || /^v3_\d+$/i.test(v) || /^lux_/i.test(v)) return "v2_001";
        if (v.startsWith("v2_")) return v;
        return "v2_001";
      };
      const g = mapLegacy(localStorage.getItem(LS_WP_GLOBAL));
      if (g) localStorage.setItem(LS_WP_GLOBAL, g); else localStorage.removeItem(LS_WP_GLOBAL);
      for (const [tab] of WALLPAPER_TABS){
        const k = wallpaperKeyForTab(tab);
        const norm = mapLegacy(localStorage.getItem(k));
        if (norm) localStorage.setItem(k, norm); else localStorage.removeItem(k);
      }
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

  function applyWallpaper(tab){
    const safeTab = String(tab || currentTabName() || "home");
    const id = getWallpaperForTab(safeTab);
    const effectiveCustom = effectiveCustomWallpapersSite();
    const allWps = [...effectiveCustom, ...WALLPAPERS];
    const wp = effectiveCustom.find(x=>x.id===id) || WALLPAPERS.find(x=>x.id===id) || null;
    let idx = -1;
    try{ idx = wp ? allWps.findIndex(x=>x.id===id) : -1; }catch{}
    const ok = !id || !wp || wallpaperUnlocked(wp, idx, effectiveCustom.length);

    const layer = ensureWallpaperLayer();
    const full = (id && ok) ? wallpaperFullUrl(id) : "";
    const on = !!(id && ok && full);

    setWallpaperLayerImage(layer, on ? full : "");
    document.documentElement.style.setProperty("--bg_wall", "none");
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
  const LS_THEMEWALL_VIEW = K.THEMEWALL_VIEW;

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
