  // ----- Redeem code -----
  if (!window.__GMXRedeemWireFactory) throw new Error("GMX redeemwire factory missing");
  window.__GMXRedeemWireFactory({
    $,
    api,
    requireConnected,
    getHandle,
    tab,
    renderWalletStatus,
    refreshUsage,
  });
