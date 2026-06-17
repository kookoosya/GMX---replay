  // ----- Redeem code -----
  if (!window.__GMXRedeemRunWireFactory) throw new Error("GMX redeemrunwire factory missing");
  window.__GMXRedeemRunWireFactory({
    core: { $, api },
    auth: { requireConnected, getHandle },
    ui: { tab, renderWalletStatus, refreshUsage },
  }).run();
