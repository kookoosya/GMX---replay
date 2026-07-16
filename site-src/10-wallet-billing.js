// ----- Wallet / Billing -----
let __gmxWalletWire = null;
let __gmxSolanaWeb3Promise = null;

function ensureSolanaWeb3() {
  if (window.solanaWeb3) return Promise.resolve(window.solanaWeb3);
  if (__gmxSolanaWeb3Promise) return __gmxSolanaWeb3Promise;

  __gmxSolanaWeb3Promise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.async = true;
    script.dataset.gmxSolanaWeb3 = "1";
    script.src = "https://cdn.jsdelivr.net/npm/@solana/web3.js@1.95.8/lib/index.iife.min.js";
    script.onload = () => window.solanaWeb3 ? resolve(window.solanaWeb3) : reject(new Error("solana_web3_unavailable"));
    script.onerror = () => reject(new Error("solana_web3_load_failed"));
    document.head.appendChild(script);
  }).finally(() => {
    __gmxSolanaWeb3Promise = null;
  });

  return __gmxSolanaWeb3Promise;
}

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
    session: {
      getHandle,
      getToken,
      requireConnected,
      ensureSolanaWeb3,
      onNavigateHome: () => tab("home"),
      refreshUsage,
    },
  });
  return __gmxWalletWire;
}

window.__gmxLazyTabHooks = window.__gmxLazyTabHooks || {};
window.__gmxLazyTabHooks.wallet = () => {
  initWalletTab();
  ensureSolanaWeb3().catch(() => {});
};

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
