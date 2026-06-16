// ----- Admin -----
  if (!window.__GMXAdminFactory) throw new Error("GMX admin factory missing");
  const __gmxAdmin = window.__GMXAdminFactory({
    $,
    escapeHtml,
    api,
    getHandle,
    requireConnected,
    setAdminToken,
    isAdminSignedIn,
    adminHandle: ADMIN_HANDLE,
  });
  const syncAdminUi = () => __gmxAdmin.syncAdminUi();
  const requireAdminSignedIn = () => __gmxAdmin.requireAdminSignedIn();
  const pruneLegacyAdminPanels = () => __gmxAdmin.pruneLegacyAdminPanels();
  __gmxAdmin.bindAdmin();
