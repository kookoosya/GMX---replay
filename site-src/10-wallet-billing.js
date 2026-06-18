// ----- Wallet / Billing -----
  if (!window.__GMXWalletWireFactory) throw new Error("GMX walletrunwire factory missing");
  const __gmxWalletWire = window.__GMXWalletWireFactory({
    core: { $, api, K },
    mod: { modals: __gmxModals },
    text: { escapeHtml, friendlyUiErrorMessage },
    ui: { toast },
    perf: { trackEvent, abVariant },
    pay: { setPayState, openPaySuccess },
    session: { getHandle, refreshUsage },
  });
  const setWalletUi = () => __gmxWalletWire.setWalletUi();
  const loadPlans = () => __gmxWalletWire.loadPlans();
  const loadBillingProof = () => __gmxWalletWire.loadBillingProof();
  const loadActivity = () => __gmxWalletWire.loadActivity();
  const renderWalletStatus = (sub) => __gmxWalletWire.renderWalletStatus(sub);
  const bindWalletTab = () => __gmxWalletWire.bindWalletTab();
