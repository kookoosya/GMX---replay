// ----- Prediction market -----
  if (!window.__GMXPredictionWireFactory) throw new Error("GMX predictionwire factory missing");
  const __gmxPredictionWire = window.__GMXPredictionWireFactory({
    $,
    escapeHtml,
    t,
    api,
    getHandle,
    getToken,
    friendlyUiErrorMessage,
    tabState: __gmxTabState,
  });
  const syncPredictionFilterCopy = () => __gmxPredictionWire.syncPredictionFilterCopy();
  const loadPredictionSignals = (opts) => __gmxPredictionWire.loadPredictionSignals(opts);
