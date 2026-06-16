  // ----- Redeem code -----
  if (!window.__GMXRedeemFactory) throw new Error("GMX redeem factory missing");
  const __gmxRedeem = window.__GMXRedeemFactory({
    $,
    api,
    requireConnected,
    getHandle,
    tab,
    renderWalletStatus,
    refreshUsage,
  });
  __gmxRedeem.bindRedeem();
