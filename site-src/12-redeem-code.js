  // ----- Redeem code -----
  function initRedeemTab() {
    if (window.__gmxRedeemTabInited) return;
    if (!window.__GMXRedeemWireFactory) throw new Error("GMX redeemrunwire factory missing");
    window.__GMXRedeemWireFactory({
      core: { $, api },
      auth: { requireConnected, getHandle },
      ui: { tab, renderWalletStatus, refreshUsage },
    });
    window.__gmxRedeemTabInited = true;
  }

  window.__gmxLazyTabHooks = window.__gmxLazyTabHooks || {};
  window.__gmxLazyTabHooks.redeem = () => { initRedeemTab(); };
