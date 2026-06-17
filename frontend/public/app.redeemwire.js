(function (window) {
  if (window.__GMXRedeemWireFactory) return;

  window.__GMXRedeemWireFactory = function createGMXRedeemWire(ctx) {
    ctx = ctx || {};

    if (!window.__GMXRedeemFactory) throw new Error("GMX redeem factory missing");
    const __gmxRedeem = window.__GMXRedeemFactory({
      $: ctx.$,
      api: ctx.api,
      requireConnected: ctx.requireConnected,
      getHandle: ctx.getHandle,
      tab: ctx.tab,
      renderWalletStatus: ctx.renderWalletStatus,
      refreshUsage: ctx.refreshUsage,
    });
    __gmxRedeem.bindRedeem();

    return { bindRedeem: () => __gmxRedeem.bindRedeem() };
  };
})(window);
