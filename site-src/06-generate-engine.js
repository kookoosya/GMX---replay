  function mergeAppendUnique(existing, newLines){
    return __gmxGen.mergeAppendUnique(existing, newLines);
  }

  if (!window.__GMXRefStatsFactory) throw new Error("GMX refstats factory missing");
  const __gmxRefStats = window.__GMXRefStatsFactory({
    $,
    api,
    getHandle,
    siteLangKey: LS_SITE_LANG,
    refPromoOpenKey: LS_REF_PROMO_OPEN,
    renderReferralRightCopy,
    renderGuideRightCopy,
    applyRefCountEligible,
    nextReferralUnlockAt,
    renderThemes,
    renderExtThemes,
    fillStyles,
    fillPacks,
  });
  const revealReferralLinkUi = () => __gmxRefStats.revealReferralLinkUi();
  const scheduleRefStatsRefresh = (delay) => __gmxRefStats.scheduleRefStatsRefresh(delay);
  const refreshRefStats = (force) => __gmxRefStats.refreshRefStats(force);

  if (!window.__GMXGenerateFlowFactory) throw new Error("GMX generateflow factory missing");
  const __gmxGenFlow = window.__GMXGenerateFlowFactory({
    $,
    api,
    requireConnected,
    getToken,
    getHandle,
    initSession,
    readGenParams,
    getAntiStrength,
    getCleanFillEnabled,
    getBestMode,
    getGmView: () => __gmxBankUi.getGmView(),
    getGnView: () => __gmxBankUi.getGnView(),
    ensureIndexed,
    activeKey,
    getGlobalKey,
    readKey,
    writeKey,
    remainingSlots,
    saveCap,
    renderList,
    postEvent,
    setBusy,
    inflight: INFLIGHT,
    abort: ABORT,
    filterAntiRepeat,
    pushRecent,
    repeatKey,
    oneClickCleanup,
    refreshUsage,
    logEvent,
    escapeHtml,
    siteTr,
    t,
    friendlyUiErrorMessage,
    toast,
    yieldToUiFrame,
    cleanFillStrength: CLEAN_FILL_STRENGTH,
    gen: __gmxGen,
    mergeAppendUnique,
  });
  async function generate(kind, count){
    return __gmxGenFlow.generate(kind, count);
  }
