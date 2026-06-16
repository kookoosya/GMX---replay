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

  if (!window.__GMXSiteSyncFactory) throw new Error("GMX sitesync factory missing");
  window.__GMXSiteSyncFactory({
    setBestMode,
    setCleanFillEnabled,
  }).wire();

  // --- init ---
  const { siteLangSel } = await __gmxSiteLangMenu.bootstrapSiteLangUi();

  applyLang();
  try{ syncBestModeUi(); }catch(_e){}
  try{ syncCleanFillUi(); }catch(_e){}
  pruneLegacyAdminPanels();

  __gmxSiteLangMenu.wireI18nObserver();

  updateLangFlags();

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

  if (!window.__GMXSiteBootFactory) throw new Error("GMX siteboot factory missing");
  window.__GMXSiteBootFactory({
    $,
    getHandle,
    getToken,
    setAuthOk: (v) => { AUTH_OK = !!v; },
    setInitDone: (v) => { INIT_DONE = !!v; },
    applyAdminVisibility,
    initModeToggle: () => __gmxSiteMode.initModeToggle(),
    applyLang,
    initThemeWallTabs,
    bindExtTabs,
    initExtWallpaperControls,
    normalizeStoredExtWallpaperSelections,
    migrateLegacyWallpaperSelectionOnce,
    migrateLegacyExtWallpaperSelectionOnce,
    renderExtThemes,
    renderExtWallpapers,
    renderExtCustomBgUI,
    setExtView,
    normalizeExtViewValue,
    restoreDrafts,
    normalizeTopLevelTab,
    tab,
    setCurrentTab: (n) => __gmxTabState.setCurrentTab(n),
    setBg,
    ping,
    loadBuild,
    bindWalletTab,
    bindLimitModal,
    bindPaySuccess,
    loadPlans,
    loadBillingProof,
    bindHelpModal,
    watchBuildUpdates,
    initSession,
    refreshUsage,
    migrateLegacyBank,
    renderList,
    initProTabs,
    lsGet: (k, d) => __gmxSt.lsGet(k, d),
    lastTabKey: LS_LAST_TAB,
    extViewKey: LS_EXT_VIEW,
  }).run();

  if (!window.__GMXRecoverFactory) throw new Error("GMX recover factory missing");
  window.__GMXRecoverFactory({
    toast,
    setDegraded,
    lsGet: (k, d) => __gmxSt.lsGet(k, d),
    lsSet: (k, v) => { try { __gmxSt.lsSet(k, v); } catch {} },
  }).wire();
