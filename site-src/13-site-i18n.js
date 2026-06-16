  // ---- UI Translation (site language) ----
  // Important: Always apply the base catalog first, then override with the selected locale (fallback for all UI languages).
    // ---- UI Translation (site language) ----
  // Source of truth now lives in shared/i18n/locales/*.json and is generated into /public/i18n/siteI18n.js.
  const I18N = (globalThis.GMX_SITE_I18N && typeof globalThis.GMX_SITE_I18N.createSiteI18nCatalog === "function")
    ? globalThis.GMX_SITE_I18N.createSiteI18nCatalog()
    : { en: {} };

  function siteTr(key, fallback = ""){ return __gmxSiteI18nUi.siteTr(key, fallback); }
  function applyLang(){ return __gmxSiteI18nUi.applyLang(); }

  function getReferralUiCopy(lang){ return __gmxSiteI18nDynamic.getReferralUiCopy(lang); }
  function getGuideUiCopy(lang){ return __gmxSiteI18nDynamic.getGuideUiCopy(lang); }
  function renderGuideRightCopy(lang){ return __gmxSiteI18nDynamic.renderGuideRightCopy(lang); }
  function deriveReferralUnlocks(eligible, rawUnlocks){
    return __gmxSiteI18nDynamic.deriveReferralUnlocks(eligible, rawUnlocks);
  }
  function nextReferralUnlockAt(eligible){ return __gmxSiteI18nDynamic.nextReferralUnlockAt(eligible); }
  function nextReferralUnlockLabel(lang, step){
    return __gmxSiteI18nDynamic.nextReferralUnlockLabel(lang, step);
  }
  function renderReferralRightCopy(lang){ return __gmxSiteI18nDynamic.renderReferralRightCopy(lang); }
  function syncModePanelCopy(){ return __gmxSiteI18nDynamic.syncModePanelCopy(); }
  function patchDynamicCopy(lang, merged){ return __gmxSiteI18nDynamic.patchDynamicCopy(lang, merged); }


  function fillSelect(sel, arr){ return __gmxSiteLangMenu.fillSelect(sel, arr); }

  // --- init ---
  const { siteLangSel } = await __gmxSiteLangMenu.bootstrapSiteLangUi();

  applyLang();
  try{ syncBestModeUi(); }catch(_e){}
  try{ syncCleanFillUi(); }catch(_e){}
  pruneLegacyAdminPanels();

  __gmxSiteLangMenu.wireI18nObserver();

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

  __gmxSiteLangMenu.wireSiteLangSelectChange(siteLangSel);

  const { gmLangSel, gnLangSel } = __gmxSiteLangMenu.fillReplyLangSelects();

  // styles + theme (depend on SUB/REF_COUNT, but must exist before refreshUsage)
  fillStyles();
  try { __gmxStyles.wireStyleSelectors(); } catch (_e) {}
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
  if (!window.__GMXGmGnWireFactory) throw new Error("GMX gmgnwire factory missing");
  const __gmxGmGnWire = window.__GMXGmGnWireFactory({
    $,
    requireConnected,
    setView,
    generate,
    trackEvent,
    getBestMode,
    setBestMode,
    getCleanFillEnabled,
    setCleanFillEnabled,
    doBestServer,
    doBest,
    commitNewLine,
    oneClickCleanup,
    clearView,
    clearAll,
    addPasted,
    copyAll,
    exportAll,
    renderList,
    saveDraft,
    getHandle,
    getReplyLangs: () => REPLY_LANGS,
    lsGet: (k, d) => __gmxSt.lsGet(k, d),
    lsSet: (k, v) => { try { __gmxSt.lsSet(k, v); } catch {} },
    lsGmReplyLang: LS_GM_REPLY_LANG,
    lsGnReplyLang: LS_GN_REPLY_LANG,
    persistStyle: (kind, style) => { try { __gmxGp.persistStyle(kind, style); } catch {} },
    lsKeyPack: (kind) => __gmxSt.lsKeyPack(kind),
    getGmView: () => gmView,
    getGnView: () => gnView,
    ensureIndexed,
    renderLangChips,
    updateLangFlags,
  });
  __gmxGmGnWire.wireReplyLangSelects({ gmLangSel, gnLangSel });
  __gmxGmGnWire.wireGmGnPanels();

  if (!window.__GMXWallpaperUploadFactory) throw new Error("GMX wallpaperupload factory missing");
  window.__GMXWallpaperUploadFactory({
    $,
    requireConnected,
    compressImageToJpegDataURL,
    customUploadId: CUSTOM_UPLOAD_ID,
    lsSet: (k, v) => { try { __gmxSt.lsSet(k, v); } catch {} },
    customBgGlobalKey: LS_CUSTOM_BG_GLOBAL,
    wpGlobalKey: LS_WP_GLOBAL,
    setWallpaperForTab,
    renderWallpaperUI,
    currentTabName,
    applyWallpaper,
    applyUserBg,
    toast,
    t,
  }).wire();

  function pushRecent(kind, keys){ return __gmxAnti.pushRecent(kind, keys); }

  function repeatKey(s, strength){ return __gmxGen.repeatKey(s, strength); }

  function buildBanSet(kind, key, strength){ return __gmxAnti.buildBanSet(kind, key, strength); }

  function filterAntiRepeat(kind, key, lines){
    return __gmxAnti.filterLines(kind, key, lines, getAntiStrength(kind));
  }

  function setRangeText(id, v){
    const el = $(id);
    if (el) el.textContent = String(v);
  }

  function normalizeLine(s){ return __gmxGen.normalizeLine(s); }

  function dedupeLines(lines){ return __gmxGen.dedupeLines(lines); }

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

  if (!window.__GMXProControlsFactory) throw new Error("GMX procontrols factory missing");
  const __gmxProControls = window.__GMXProControlsFactory({
    $,
    isPro,
    escapeHtml,
    storage: __gmxSt,
    packsForKind,
    unlockedPacksCountFor,
    applyPackDefaultsToUi,
    logEvent,
    getProToolsNote: () =>
      (I18N[localStorage.getItem(LS_SITE_LANG) || "en"]?.pro_tools_note) ||
      (I18N.en?.pro_tools_note) ||
      "Pro-only tools.",
    readKey,
    writeKey,
    getBankKey,
    allKeysForKind,
    allLegacyKeysForKind,
    getHandle,
    dedupeLines,
    normalizeLine,
    cleanupKeyLines,
    setLangIndex,
    getBankMigrationKey,
    trimKindToCap,
    themeKey: "gmx_theme",
    customBgKey: LS_CUSTOM_BG_GLOBAL,
    gmReplyLangKey: LS_GM_REPLY_LANG,
    gnReplyLangKey: LS_GN_REPLY_LANG,
    onAfterImport: () => {
      applyTheme(localStorage.getItem("gmx_theme") || "classic");
      applyUserBg();
      initWallpapers();
      renderThemes();
      fillStyles();
      try { __gmxStyles.wireStyleSelectors(); } catch (_e) {}
      fillPacks();
      renderLangChips("gm");
      renderLangChips("gn");
      renderList("gm");
      renderList("gn");
    },
  });

  if (!window.__GMXSiteModeFactory) throw new Error("GMX sitemode factory missing");
  const __gmxSiteMode = window.__GMXSiteModeFactory({
    $,
    siteModeKey: K.SITE_MODE,
    lsGet: (k, d) => __gmxSt.lsGet(k, d),
    lsSet: (k, v) => { try { __gmxSt.lsSet(k, v); } catch {} },
  });

  __gmxProControls.wire();

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
  try{ __gmxSiteMode.initModeToggle(); }catch(e){}
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
  __gmxTabState.setCurrentTab(bootTab);
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
