  // ----- Connect -----
  if (!window.__GMXConnectWireFactory) throw new Error("GMX connectrunwire factory missing");
  window.__GMXConnectWireFactory({
    core: { $, api, escapeHtml, friendlyUiErrorMessage, normalizeHandle },
    auth: { setAuthOk: (v) => { AUTH_OK = !!v; }, applyAdminVisibility },
    session: { refreshUsage, loadPlans, ping },
    keys: {
      handle: LS_HANDLE,
      token: LS_TOKEN,
      isAdmin: LS_IS_ADMIN,
      adminClaimable: LS_ADMIN_CLAIMABLE,
      forceLogout: LS_FORCE_LOGOUT,
      forceLogoutV2: LS_FORCE_LOGOUT_V2,
    },
  });

})();
