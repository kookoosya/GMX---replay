(function (window) {
  if (window.__GMXGenerateRunWireFactory) return;

  window.__GMXGenerateRunWireFactory = function createGMXGenerateRunWire(ctx) {
    ctx = ctx || {};
    const core = ctx.core || {};
    const auth = ctx.auth || {};
    const ui = ctx.ui || {};
    const params = ctx.params || {};
    const data = ctx.data || {};
    const text = ctx.text || {};
    const perf = ctx.perf || {};
    const state = ctx.state || {};

    function buildWireCtx() {
      return {
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

    function run() {
      if (!window.__GMXGenerateWireFactory) throw new Error("GMX generatewire factory missing");
      return window.__GMXGenerateWireFactory(buildWireCtx());
    }

    return { run, buildWireCtx };
  };
})(window);
