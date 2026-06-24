// ----- Wallet / Billing -----
let __gmxWalletWire = null;

function initWalletTab() {
  if (__gmxWalletWire) return __gmxWalletWire;
  if (!window.__GMXWalletWireFactory) throw new Error("GMX walletrunwire factory missing");
  __gmxWalletWire = window.__GMXWalletWireFactory({
    core: { $, api, K },
    mod: { modals: __gmxModals },
    text: { escapeHtml, friendlyUiErrorMessage },
    ui: { toast },
    perf: { trackEvent, abVariant },
    pay: { setPayState, openPaySuccess },
    session: { getHandle, refreshUsage },
  });
  return __gmxWalletWire;
}

window.__gmxLazyTabHooks = window.__gmxLazyTabHooks || {};
window.__gmxLazyTabHooks.wallet = () => { initWalletTab(); };

async function setWalletUi() {
  await window.__gmxEnsureTabPack("wallet");
  return initWalletTab().setWalletUi();
}

async function loadPlans() {
  await window.__gmxEnsureTabPack("wallet");
  return initWalletTab().loadPlans();
}

async function loadBillingProof() {
  await window.__gmxEnsureTabPack("wallet");
  return initWalletTab().loadBillingProof();
}

async function loadActivity() {
  await window.__gmxEnsureTabPack("wallet");
  return initWalletTab().loadActivity();
}

async function renderWalletStatus(sub) {
  await window.__gmxEnsureTabPack("wallet");
  return initWalletTab().renderWalletStatus(sub);
}

function bindWalletTab() {
  window.__gmxEnsureTabPack("wallet")
    .then(() => { try { initWalletTab().bindWalletTab(); } catch {} })
    .catch(() => {});
}
