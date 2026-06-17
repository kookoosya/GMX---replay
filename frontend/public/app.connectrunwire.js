(function (window) {
  if (window.__GMXConnectRunWireFactory) return;

  window.__GMXConnectRunWireFactory = function createGMXConnectRunWire(ctx) {
    ctx = ctx || {};
    const core = ctx.core || {};
    const auth = ctx.auth || {};
    const session = ctx.session || {};
    const keys = ctx.keys || {};

    function buildWireCtx() {
      return {
        $: core.$,
        api: core.api,
        escapeHtml: core.escapeHtml,
        friendlyUiErrorMessage: core.friendlyUiErrorMessage,
        normalizeHandle: core.normalizeHandle,
        setAuthOk: auth.setAuthOk,
        applyAdminVisibility: auth.applyAdminVisibility,
        refreshUsage: session.refreshUsage,
        loadPlans: session.loadPlans,
        ping: session.ping,
        keys: {
          handle: keys.handle,
          token: keys.token,
          isAdmin: keys.isAdmin,
          adminClaimable: keys.adminClaimable,
          forceLogout: keys.forceLogout,
          forceLogoutV2: keys.forceLogoutV2,
        },
      };
    }

    function run() {
      if (!window.__GMXConnectWireFactory) throw new Error("GMX connectwire factory missing");
      return window.__GMXConnectWireFactory(buildWireCtx());
    }

    return { run, buildWireCtx };
  };
})(window);
