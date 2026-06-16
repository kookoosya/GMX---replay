// ----- Prediction market -----
  if (!window.__GMXPredictionFactory) throw new Error("GMX prediction factory missing");
  const __gmxPrediction = window.__GMXPredictionFactory({
    $,
    escapeHtml,
    t,
    api,
    getHandle,
    getToken,
    friendlyUiErrorMessage,
    getCurrentTab: () => __gmxTabState.getCurrentTab(),
  });
  const syncPredictionFilterCopy = () => __gmxPrediction.syncPredictionFilterCopy();
  const loadPredictionSignals = (opts) => __gmxPrediction.loadPredictionSignals(opts);
  __gmxPrediction.bindPredictionMarketUI();
