// ----- Prediction market -----
  if (!window.__GMXPredictionWireFactory) throw new Error("GMX predictionrunwire factory missing");
  const __gmxPredictionWire = window.__GMXPredictionWireFactory({
    core: { $, escapeHtml, t, api, friendlyUiErrorMessage },
    auth: { getHandle, getToken },
    tab: { tabState: __gmxTabState },
  });
  const syncPredictionFilterCopy = () => __gmxPredictionWire.syncPredictionFilterCopy();
  const loadPredictionSignals = (opts) => __gmxPredictionWire.loadPredictionSignals(opts);
