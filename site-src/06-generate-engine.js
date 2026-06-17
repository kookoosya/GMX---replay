  if (!window.__GMXGenerateRunWireFactory) throw new Error("GMX generaterunwire factory missing");
  const __gmxGenerateWire = window.__GMXGenerateRunWireFactory({
    core: {
      $,
      api,
      gen: __gmxGen,
      bankUi: __gmxBankUi,
    },
    auth: {
      getHandle,
      requireConnected,
      getToken,
      initSession,
    },
    ui: {
      renderReferralRightCopy,
      renderGuideRightCopy,
      applyRefCountEligible,
      nextReferralUnlockAt,
      renderThemes,
      renderExtThemes,
      fillStyles,
      fillPacks,
      renderList,
      postEvent,
      setBusy,
      refreshUsage,
      toast,
    },
    params: {
      readGenParams,
      getAntiStrength,
      getCleanFillEnabled,
      getBestMode,
      filterAntiRepeat,
      repeatKey,
      cleanFillStrength: CLEAN_FILL_STRENGTH,
    },
    data: {
      siteLangKey: LS_SITE_LANG,
      refPromoOpenKey: LS_REF_PROMO_OPEN,
      ensureIndexed,
      activeKey,
      getGlobalKey,
      readKey,
      writeKey,
      remainingSlots,
      saveCap,
      pushRecent,
      oneClickCleanup,
    },
    text: {
      escapeHtml,
      siteTr,
      t,
      friendlyUiErrorMessage,
    },
    perf: {
      logEvent,
      yieldToUiFrame,
    },
    state: {
      inflight: INFLIGHT,
      abort: ABORT,
    },
  }).run();
  const {
    mergeAppendUnique,
    revealReferralLinkUi,
    scheduleRefStatsRefresh,
    refreshRefStats,
  } = __gmxGenerateWire;
  async function generate(kind, count){ return __gmxGenerateWire.generate(kind, count); }
