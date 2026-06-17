(function (window) {
  if (window.__GMXWalletRunWireFactory) return;

  window.__GMXWalletRunWireFactory = function createGMXWalletRunWire(ctx) {
    ctx = ctx || {};
    const core = ctx.core || {};
    const mod = ctx.mod || {};
    const text = ctx.text || {};
    const ui = ctx.ui || {};
    const perf = ctx.perf || {};
    const pay = ctx.pay || {};
    const session = ctx.session || {};

    function buildWireCtx() {
      return {
        $: core.$,
        api: core.api,
        K: core.K,
        modals: mod.modals,
        escapeHtml: text.escapeHtml,
        toast: ui.toast,
        trackEvent: perf.trackEvent,
        abVariant: perf.abVariant,
        friendlyUiErrorMessage: text.friendlyUiErrorMessage,
        setPayState: pay.setPayState,
        openPaySuccess: pay.openPaySuccess,
        getHandle: session.getHandle,
        refreshUsage: session.refreshUsage,
      };
    }

    function run() {
      if (!window.__GMXWalletWireFactory) throw new Error("GMX walletwire factory missing");
      return window.__GMXWalletWireFactory(buildWireCtx());
    }

    return { run, buildWireCtx };
  };
})(window);
