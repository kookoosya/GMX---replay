(function (window) {
  if (window.__GMXConnectWireFactory) return;

  window.__GMXConnectWireFactory = function createGMXConnectWire(ctx) {
    ctx = ctx || {};
    function resolveInvalidatePendingSessionInit(source) {
      if (typeof source.invalidatePendingSessionInit === "function") {
        return source.invalidatePendingSessionInit;
      }
      if (typeof source.auth?.invalidatePendingSessionInit === "function") {
        return source.auth.invalidatePendingSessionInit;
      }
      if (typeof source.core?.api?.invalidatePendingSessionInit === "function") {
        return source.core.api.invalidatePendingSessionInit;
      }
      return () => {};
    }
    if (ctx.core) {
      const core = ctx.core || {};
    const auth = ctx.auth || {};
    const session = ctx.session || {};
    const keys = ctx.keys || {};
    const invalidatePendingSessionInit = resolveInvalidatePendingSessionInit(ctx);

    ctx = {
        $: core.$,
        api: core.api,
        escapeHtml: core.escapeHtml,
        friendlyUiErrorMessage: core.friendlyUiErrorMessage,
        normalizeHandle: core.normalizeHandle,
        tr: core.tr,
        setAuthOk: auth.setAuthOk,
        applyAdminVisibility: auth.applyAdminVisibility,
        refreshUsage: session.refreshUsage,
        loadPlans: session.loadPlans,
        ping: session.ping,
        invalidatePendingSessionInit,
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
    const keys = ctx.keys || {};
    const invalidatePendingSessionInit = resolveInvalidatePendingSessionInit(ctx);

    if (!window.__GMXConnectFactory) throw new Error("GMX connect factory missing");
    const __gmxConnect = window.__GMXConnectFactory({
      $: ctx.$,
      api: ctx.api,
      escapeHtml: ctx.escapeHtml,
      friendlyUiErrorMessage: ctx.friendlyUiErrorMessage,
      normalizeHandle: ctx.normalizeHandle,
      tr: ctx.tr,
      setAuthOk: ctx.setAuthOk,
      applyAdminVisibility: ctx.applyAdminVisibility,
      refreshUsage: ctx.refreshUsage,
      loadPlans: ctx.loadPlans,
      ping: ctx.ping,
      invalidatePendingSessionInit,
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
