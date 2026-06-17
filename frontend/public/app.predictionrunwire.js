(function (window) {
  if (window.__GMXPredictionRunWireFactory) return;

  window.__GMXPredictionRunWireFactory = function createGMXPredictionRunWire(ctx) {
    ctx = ctx || {};
    const core = ctx.core || {};
    const auth = ctx.auth || {};
    const tab = ctx.tab || {};

    function buildWireCtx() {
      return {
        $: core.$,
        escapeHtml: core.escapeHtml,
        t: core.t,
        api: core.api,
        friendlyUiErrorMessage: core.friendlyUiErrorMessage,
        getHandle: auth.getHandle,
        getToken: auth.getToken,
        tabState: tab.tabState,
      };
    }

    function run() {
      if (!window.__GMXPredictionWireFactory) throw new Error("GMX predictionwire factory missing");
      return window.__GMXPredictionWireFactory(buildWireCtx());
    }

    return { run, buildWireCtx };
  };
})(window);
