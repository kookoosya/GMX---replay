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
        renderReferralRightCopy: ui.renderReferralRightCopy,
        renderGuideRightCopy: ui.renderGuideRightCopy,
        applyRefCountEligible: ui.applyRefCountEligible,
        nextReferralUnlockAt: ui.nextReferralUnlockAt,
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
    });
    const revealReferralLinkUi = () => refStats.revealReferralLinkUi?.();
    const scheduleRefStatsRefresh = (delay) => refStats.scheduleRefStatsRefresh?.(delay);
    const refreshRefStats = (force) => refStats.refreshRefStats?.(force);

    if (!window.__GMXGenerateFlowFactory) throw new Error("GMX generateflow factory missing");
    const genFlow = window.__GMXGenerateFlowFactory({
      $: ctx.$,
      api: ctx.api,
      requireConnected: ctx.requireConnected,
      getToken: ctx.getToken,
      getHandle: ctx.getHandle,
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
      gen,
      mergeAppendUnique,
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
    };
  };
})(window);
