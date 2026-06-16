  // ----- Connect -----
  if (!window.__GMXConnectFactory) throw new Error("GMX connect factory missing");
  const __gmxConnect = window.__GMXConnectFactory({
    $,
    api,
    escapeHtml,
    friendlyUiErrorMessage,
    normalizeHandle,
    setAuthOk: (v) => { AUTH_OK = !!v; },
    applyAdminVisibility,
    refreshUsage,
    loadPlans,
    ping,
    keys: {
      handle: LS_HANDLE,
      token: LS_TOKEN,
      isAdmin: LS_IS_ADMIN,
      adminClaimable: LS_ADMIN_CLAIMABLE,
      forceLogout: LS_FORCE_LOGOUT,
      forceLogoutV2: LS_FORCE_LOGOUT_V2,
    },
  });
  __gmxConnect.bindConnect();

})();
