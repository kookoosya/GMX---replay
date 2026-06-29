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
    function resolveBeginSessionGeneration(source) {
      if (typeof source.beginSessionGeneration === "function") {
        return source.beginSessionGeneration;
      }
      if (typeof source.auth?.beginSessionGeneration === "function") {
        return source.auth.beginSessionGeneration;
      }
      if (typeof source.core?.api?.beginSessionGeneration === "function") {
        return source.core.api.beginSessionGeneration;
      }
      return undefined;
    }
    function resolveIsSessionGenerationCurrent(source) {
      if (typeof source.isSessionGenerationCurrent === "function") {
        return source.isSessionGenerationCurrent;
      }
      if (typeof source.auth?.isSessionGenerationCurrent === "function") {
        return source.auth.isSessionGenerationCurrent;
      }
      if (typeof source.core?.api?.isSessionGenerationCurrent === "function") {
        return source.core.api.isSessionGenerationCurrent;
      }
      return undefined;
    }
    if (ctx.core) {
      const core = ctx.core || {};
    const auth = ctx.auth || {};
    const session = ctx.session || {};
    const keys = ctx.keys || {};
    const invalidatePendingSessionInit = resolveInvalidatePendingSessionInit(ctx);
    const beginSessionGeneration = resolveBeginSessionGeneration(ctx);
    const isSessionGenerationCurrent = resolveIsSessionGenerationCurrent(ctx);

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
        beginSessionGeneration,
        isSessionGenerationCurrent,
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
    const beginSessionGeneration = resolveBeginSessionGeneration(ctx);
    const isSessionGenerationCurrent = resolveIsSessionGenerationCurrent(ctx);

    if (!window.__GMXConnectFactory) throw new Error("GMX connect factory missing");
    const referralPending =
      ctx.referralPending ||
      (window.__GMXReferralPendingFactory && ctx.storage
        ? window.__GMXReferralPendingFactory({
            lsGet: (k, fb) => ctx.storage.lsGet(k, fb),
            lsSet: (k, v) => ctx.storage.lsSet(k, v),
            lsRemove: (k) => ctx.storage.lsRemove(k),
            storageKey: ctx.referralPendingKey || "gmx_ref_pending_v1",
          })
        : null);
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
      beginSessionGeneration,
      isSessionGenerationCurrent,
      referralPending,
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
