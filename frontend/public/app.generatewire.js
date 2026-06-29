(function (window) {
  if (window.__GMXGenerateWireFactory) return;

  window.__GMXGenerateWireFactory = function createGMXGenerateWire(ctx) {
    ctx = ctx || {};
    if (ctx.core) {
      const core = ctx.core || {};
    const auth = ctx.auth || {};
    const ui = ctx.ui || {};
    const params = ctx.params || {};
    const data = ctx.data || {};
    const text = ctx.text || {};
    const perf = ctx.perf || {};
    const state = ctx.state || {};

    ctx = {
        $: core.$,
        api: core.api,
        gen: core.gen,
        bankUi: core.bankUi,
        inflight: state.inflight,
        abort: state.abort,
        siteLangKey: data.siteLangKey,
        refPromoOpenKey: data.refPromoOpenKey,
        getHandle: auth.getHandle,
        isPro: auth.isPro,
        renderReferralRightCopy: ui.renderReferralRightCopy,
        renderGuideRightCopy: ui.renderGuideRightCopy,
        applyRefCountEligible: ui.applyRefCountEligible,
        nextReferralUnlockAt: ui.nextReferralUnlockAt,
        syncRefProgressMeter: ui.syncRefProgressMeter,
        renderReferralPromoNote: ui.renderReferralPromoNote,
        renderThemes: ui.renderThemes,
        renderExtThemes: ui.renderExtThemes,
        fillStyles: ui.fillStyles,
        fillPacks: ui.fillPacks,
        requireConnected: auth.requireConnected,
        getToken: auth.getToken,
        initSession: auth.initSession,
        readGenParams: params.readGenParams,
        getAntiStrength: params.getAntiStrength,
        getCleanFillEnabled: params.getCleanFillEnabled,
        getBestMode: params.getBestMode,
        ensureIndexed: data.ensureIndexed,
        activeKey: data.activeKey,
        getGlobalKey: data.getGlobalKey,
        readKey: data.readKey,
        writeKey: data.writeKey,
        remainingSlots: data.remainingSlots,
        saveCap: data.saveCap,
        getLastUsage: data.getLastUsage,
        renderList: ui.renderList,
        postEvent: ui.postEvent,
        setBusy: ui.setBusy,
        filterAntiRepeat: params.filterAntiRepeat,
        pushRecent: data.pushRecent,
        repeatKey: params.repeatKey,
        oneClickCleanup: data.oneClickCleanup,
        refreshUsage: ui.refreshUsage,
        logEvent: perf.logEvent,
        escapeHtml: text.escapeHtml,
        siteTr: text.siteTr,
        t: text.t,
        friendlyUiErrorMessage: text.friendlyUiErrorMessage,
        toast: ui.toast,
        openLimitModal: ui.openLimitModal,
        normLimitForUI: ui.normLimitForUI,
        yieldToUiFrame: perf.yieldToUiFrame,
        cleanFillStrength: params.cleanFillStrength,
      };
    }
    const gen = ctx.gen || {};
    const bankUi = ctx.bankUi || {};

    function mergeAppendUnique(existing, newLines) {
      return gen.mergeAppendUnique?.(existing, newLines);
    }

    if (!window.__GMXRefStatsFactory) throw new Error("GMX refstats factory missing");
    const refStats = window.__GMXRefStatsFactory({
      $: ctx.$,
      api: ctx.api,
      getHandle: ctx.getHandle,
      siteLangKey: ctx.siteLangKey,
      refPromoOpenKey: ctx.refPromoOpenKey,
      renderReferralRightCopy: ctx.renderReferralRightCopy,
      renderGuideRightCopy: ctx.renderGuideRightCopy,
      applyRefCountEligible: ctx.applyRefCountEligible,
      nextReferralUnlockAt: ctx.nextReferralUnlockAt,
      syncRefProgressMeter: ctx.syncRefProgressMeter,
      renderReferralPromoNote: ctx.renderReferralPromoNote,
    });
    const revealReferralLinkUi = () => refStats.revealReferralLinkUi?.();
    const scheduleRefStatsRefresh = (delay) => refStats.scheduleRefStatsRefresh?.(delay);
    const refreshRefStats = (force) => refStats.refreshRefStats?.(force);

    if (!window.__GMXGenerateFlowFactory) throw new Error("GMX generateflow factory missing");
    if (!window.__GMXGenHistoryUiFactory) throw new Error("GMX genhistoryui factory missing");
    const genHistoryUi = window.__GMXGenHistoryUiFactory({
      $: ctx.$,
      t: ctx.t,
      toast: ctx.toast,
      escapeHtml: ctx.escapeHtml,
    });
    const genFlow = window.__GMXGenerateFlowFactory({
      $: ctx.$,
      api: ctx.api,
      requireConnected: ctx.requireConnected,
      getToken: ctx.getToken,
      getHandle: ctx.getHandle,
      isPro: ctx.isPro,
      initSession: ctx.initSession,
      readGenParams: ctx.readGenParams,
      getAntiStrength: ctx.getAntiStrength,
      getCleanFillEnabled: ctx.getCleanFillEnabled,
      getBestMode: ctx.getBestMode,
      getGmView: () => bankUi.getGmView?.(),
      getGnView: () => bankUi.getGnView?.(),
      ensureIndexed: ctx.ensureIndexed,
      activeKey: ctx.activeKey,
      getGlobalKey: ctx.getGlobalKey,
      readKey: ctx.readKey,
      writeKey: ctx.writeKey,
      remainingSlots: ctx.remainingSlots,
      saveCap: ctx.saveCap,
      getLastUsage: ctx.getLastUsage,
      renderList: ctx.renderList,
      postEvent: ctx.postEvent,
      setBusy: ctx.setBusy,
      inflight: ctx.inflight,
      abort: ctx.abort,
      filterAntiRepeat: ctx.filterAntiRepeat,
      pushRecent: ctx.pushRecent,
      repeatKey: ctx.repeatKey,
      oneClickCleanup: ctx.oneClickCleanup,
      refreshUsage: ctx.refreshUsage,
      logEvent: ctx.logEvent,
      escapeHtml: ctx.escapeHtml,
      siteTr: ctx.siteTr,
      t: ctx.t,
      friendlyUiErrorMessage: ctx.friendlyUiErrorMessage,
      toast: ctx.toast,
      yieldToUiFrame: ctx.yieldToUiFrame,
      cleanFillStrength: ctx.cleanFillStrength,
      isPro: ctx.isPro,
      getLastUsage: ctx.getLastUsage,
      openLimitModal: ctx.openLimitModal,
      normLimitForUI: ctx.normLimitForUI,
      gen,
      mergeAppendUnique,
      recordBatchHistory: (kind, entry) => genHistoryUi.recordBatchHistory?.(kind, entry),
      renderGenHistory: (kind) => genHistoryUi.renderGenHistory?.(kind),
    });

    async function generate(kind, count) {
      return genFlow.generate?.(kind, count);
    }

    return {
      mergeAppendUnique,
      revealReferralLinkUi,
      scheduleRefStatsRefresh,
      refreshRefStats,
      generate,
      renderAllGenHistory: () => genHistoryUi.renderAllGenHistory?.(),
    };
  };
})(window);
