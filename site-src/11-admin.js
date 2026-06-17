// ----- Admin -----
  if (!window.__GMXAdminWireFactory) throw new Error("GMX adminwire factory missing");
  const __gmxAdminWire = window.__GMXAdminWireFactory({
    $,
    escapeHtml,
    api,
    getHandle,
    requireConnected,
    setAdminToken,
    isAdminSignedIn,
    adminHandle: ADMIN_HANDLE,
  });
  const syncAdminUi = () => __gmxAdminWire.syncAdminUi();
  const requireAdminSignedIn = () => __gmxAdminWire.requireAdminSignedIn();
  const pruneLegacyAdminPanels = () => __gmxAdminWire.pruneLegacyAdminPanels();
