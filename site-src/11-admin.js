// ----- Admin -----
  if (!window.__GMXAdminWireFactory) throw new Error("GMX adminrunwire factory missing");
  const __gmxAdminWire = window.__GMXAdminWireFactory({
    core: { $, escapeHtml, api },
    auth: { getHandle, requireConnected },
    admin: { setAdminToken, isAdminSignedIn, adminHandle: ADMIN_HANDLE },
  });
  const syncAdminUi = () => __gmxAdminWire.syncAdminUi();
  const requireAdminSignedIn = () => __gmxAdminWire.requireAdminSignedIn();
  const pruneLegacyAdminPanels = () => __gmxAdminWire.pruneLegacyAdminPanels();
