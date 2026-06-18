  // ----- Redeem code -----
  if (!window.__GMXRedeemWireFactory) throw new Error("GMX redeemrunwire factory missing");
  window.__GMXRedeemWireFactory({
    core: { $, api },
    auth: { requireConnected, getHandle },
    ui: { tab, renderWalletStatus, refreshUsage },
  });
