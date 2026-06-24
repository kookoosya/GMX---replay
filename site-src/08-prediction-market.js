// ----- Prediction market -----
let __gmxPredictionWire = null;

function initPredictionTab() {
  if (__gmxPredictionWire) return __gmxPredictionWire;
  if (!window.__GMXPredictionWireFactory) throw new Error("GMX predictionrunwire factory missing");
  __gmxPredictionWire = window.__GMXPredictionWireFactory({
    core: { $, escapeHtml, t, api, friendlyUiErrorMessage },
    auth: { getHandle, getToken },
    tab: { tabState: __gmxTabState },
  });
  return __gmxPredictionWire;
}

window.__gmxLazyTabHooks = window.__gmxLazyTabHooks || {};
window.__gmxLazyTabHooks.prediction = () => { initPredictionTab(); };

function syncPredictionFilterCopy() {
  if (!__gmxPredictionWire) return;
  try { __gmxPredictionWire.syncPredictionFilterCopy(); } catch {}
}

async function loadPredictionSignals(opts) {
  await window.__gmxEnsureTabPack("prediction");
  return initPredictionTab().loadPredictionSignals(opts);
}
