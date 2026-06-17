(function (window) {
  if (window.__GMXConnectWireFactory) return;

  window.__GMXConnectWireFactory = function createGMXConnectWire(ctx) {
    ctx = ctx || {};
    const keys = ctx.keys || {};

    if (!window.__GMXConnectFactory) throw new Error("GMX connect factory missing");
    const __gmxConnect = window.__GMXConnectFactory({
      $: ctx.$,
      api: ctx.api,
      escapeHtml: ctx.escapeHtml,
      friendlyUiErrorMessage: ctx.friendlyUiErrorMessage,
      normalizeHandle: ctx.normalizeHandle,
      setAuthOk: ctx.setAuthOk,
      applyAdminVisibility: ctx.applyAdminVisibility,
      refreshUsage: ctx.refreshUsage,
      loadPlans: ctx.loadPlans,
      ping: ctx.ping,
      keys: {
        handle: keys.handle,
        token: keys.token,
        isAdmin: keys.isAdmin,
        adminClaimable: keys.adminClaimable,
        forceLogout: keys.forceLogout,
        forceLogoutV2: keys.forceLogoutV2,
      },
    });
    __gmxConnect.bindConnect();

    return { bindConnect: () => __gmxConnect.bindConnect() };
  };
})(window);
