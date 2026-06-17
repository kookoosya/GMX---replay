// ----- Wallet / Billing -----
  if (!window.__GMXWalletWireFactory) throw new Error("GMX walletwire factory missing");
  const __gmxWalletWire = window.__GMXWalletWireFactory({
    $,
    api,
    K,
    modals: __gmxModals,
    escapeHtml,
    toast,
    trackEvent,
    abVariant,
    friendlyUiErrorMessage,
    setPayState,
    openPaySuccess,
    getHandle,
    refreshUsage,
  });
  const setWalletUi = () => __gmxWalletWire.setWalletUi();
  const loadPlans = () => __gmxWalletWire.loadPlans();
  const loadBillingProof = () => __gmxWalletWire.loadBillingProof();
  const loadActivity = () => __gmxWalletWire.loadActivity();
  const renderWalletStatus = (sub) => __gmxWalletWire.renderWalletStatus(sub);
  const bindWalletTab = () => __gmxWalletWire.bindWalletTab();
