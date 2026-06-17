(function (window) {
  if (window.__GMXPredictionWireFactory) return;

  window.__GMXPredictionWireFactory = function createGMXPredictionWire(ctx) {
    ctx = ctx || {};
    const tabState = ctx.tabState || {};

    if (!window.__GMXPredictionFactory) throw new Error("GMX prediction factory missing");
    const __gmxPrediction = window.__GMXPredictionFactory({
      $: ctx.$,
      escapeHtml: ctx.escapeHtml,
      t: ctx.t,
      api: ctx.api,
      getHandle: ctx.getHandle,
      getToken: ctx.getToken,
      friendlyUiErrorMessage: ctx.friendlyUiErrorMessage,
      getCurrentTab: () => tabState.getCurrentTab?.(),
    });

    const syncPredictionFilterCopy = () => __gmxPrediction.syncPredictionFilterCopy();
    const loadPredictionSignals = (opts) => __gmxPrediction.loadPredictionSignals(opts);
    __gmxPrediction.bindPredictionMarketUI();

    return { syncPredictionFilterCopy, loadPredictionSignals };
  };
})(window);
