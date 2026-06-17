// ----- Prediction market -----
  if (!window.__GMXPredictionRunWireFactory) throw new Error("GMX predictionrunwire factory missing");
  const __gmxPredictionWire = window.__GMXPredictionRunWireFactory({
    core: { $, escapeHtml, t, api, friendlyUiErrorMessage },
    auth: { getHandle, getToken },
    tab: { tabState: __gmxTabState },
  }).run();
  const syncPredictionFilterCopy = () => __gmxPredictionWire.syncPredictionFilterCopy();
  const loadPredictionSignals = (opts) => __gmxPredictionWire.loadPredictionSignals(opts);
