(function (window) {
  if (window.__GMXBankUiRunWireFactory) return;

  window.__GMXBankUiRunWireFactory = function createGMXBankUiRunWire(ctx) {
    ctx = ctx || {};
    const core = ctx.core || {};
    const auth = ctx.auth || {};
    const data = ctx.data || {};
    const ui = ctx.ui || {};
    const perf = ctx.perf || {};
    const params = ctx.params || {};
    const state = ctx.state || {};

    function buildWireCtx() {
      return {
        $: core.$,
        fmt: core.fmt,
        gen: core.gen,
        keys: data.keys,
        requireConnected: auth.requireConnected,
        getHandle: auth.getHandle,
        isPro: auth.isPro,
        saveCap: data.saveCap,
        saveCapFree: data.saveCapFree,
        lastSaved: data.lastSaved,
        getBankKey: data.getBankKey,
        allLegacyKeysForKind: data.allLegacyKeysForKind,
        setLangIndex: data.setLangIndex,
        getBankMigrationKey: data.getBankMigrationKey,
        readKey: data.readKey,
        writeKey: data.writeKey,
        dedupeLines: core.dedupeLines,
        linesFromText: data.linesFromText,
        chunkedRender: ui.chunkedRender,
        renderHelpModal: ui.renderHelpModal,
        openLimitModal: ui.openLimitModal,
        trackEvent: perf.trackEvent,
        toast: ui.toast,
        t: ui.t,
        updateLangFlags: ui.updateLangFlags,
        renderLangChips: ui.renderLangChips,
        abort: state.abort,
        api: core.api,
        readGenParams: params.readGenParams,
        getAntiStrength: params.getAntiStrength,
        refreshUsage: ui.refreshUsage,
        setBusy: ui.setBusy,
      };
    }

    function run() {
      if (!window.__GMXBankUiWireFactory) throw new Error("GMX bankuiwire factory missing");
      return window.__GMXBankUiWireFactory(buildWireCtx());
    }

    return { run, buildWireCtx };
  };
})(window);
