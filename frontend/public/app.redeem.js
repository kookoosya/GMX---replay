(function (window) {
  if (window.__GMXRedeemFactory) return;

  window.__GMXRedeemFactory = function createGMXRedeem(ctx) {
    ctx = ctx || {};
    const $ = typeof ctx.$ === "function" ? ctx.$ : (id) => document.getElementById(id);
    const api = typeof ctx.api === "function" ? ctx.api : async () => ({});
    const requireConnected =
      typeof ctx.requireConnected === "function" ? ctx.requireConnected : () => true;
    const getHandle = typeof ctx.getHandle === "function" ? ctx.getHandle : () => "";
    const tab = typeof ctx.tab === "function" ? ctx.tab : () => {};
    const renderWalletStatus =
      typeof ctx.renderWalletStatus === "function" ? ctx.renderWalletStatus : () => {};
    const refreshUsage = typeof ctx.refreshUsage === "function" ? ctx.refreshUsage : async () => {};

    function bindRedeem() {
      const redeemBtn = $("btnRedeem");
      if (!redeemBtn) return;
      redeemBtn.onclick = async () => {
        if (!requireConnected("Home")) return;
        const h = getHandle();
        if (!h) {
          tab("home");
          return;
        }
        const code = $("redeemCode").value.trim();
        if (!code) {
          $("connectMsg").innerHTML = `<span class="warn">Paste a code first.</span>`;
          return;
        }
        try {
          const j = await api("/api/billing/redeem", "POST", { handle: h, code });
          $("connectMsg").innerHTML = `<span class="ok">Activated.</span>`;
          renderWalletStatus(j.sub);
          await refreshUsage();
        } catch (e) {
          $("connectMsg").innerHTML = `<span class="bad">${e.message || "redeem_failed"}</span>`;
        }
      };
    }

    return { bindRedeem };
  };
})(window);
