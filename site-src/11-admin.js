// ----- Admin -----
  if (!window.__GMXAdminRunWireFactory) throw new Error("GMX adminrunwire factory missing");
  const __gmxAdminWire = window.__GMXAdminRunWireFactory({
    core: { $, escapeHtml, api },
    auth: { getHandle, requireConnected },
    admin: { setAdminToken, isAdminSignedIn, adminHandle: ADMIN_HANDLE },
  }).run();
  const syncAdminUi = () => __gmxAdminWire.syncAdminUi();
  const requireAdminSignedIn = () => __gmxAdminWire.requireAdminSignedIn();
  const pruneLegacyAdminPanels = () => __gmxAdminWire.pruneLegacyAdminPanels();
