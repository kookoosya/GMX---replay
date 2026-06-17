(function (window) {
  if (window.__GMXRedeemRunWireFactory) return;

  window.__GMXRedeemRunWireFactory = function createGMXRedeemRunWire(ctx) {
    ctx = ctx || {};
    const core = ctx.core || {};
    const auth = ctx.auth || {};
    const ui = ctx.ui || {};

    function buildWireCtx() {
      return {
        $: core.$,
        api: core.api,
        requireConnected: auth.requireConnected,
        getHandle: auth.getHandle,
        tab: ui.tab,
        renderWalletStatus: ui.renderWalletStatus,
        refreshUsage: ui.refreshUsage,
      };
    }

    function run() {
      if (!window.__GMXRedeemWireFactory) throw new Error("GMX redeemwire factory missing");
      return window.__GMXRedeemWireFactory(buildWireCtx());
    }

    return { run, buildWireCtx };
  };
})(window);
