(function (window) {
  if (window.__GMXAdminWireFactory) return;

  window.__GMXAdminWireFactory = function createGMXAdminWire(ctx) {
    ctx = ctx || {};

    if (!window.__GMXAdminFactory) throw new Error("GMX admin factory missing");
    const __gmxAdmin = window.__GMXAdminFactory({
      $: ctx.$,
      escapeHtml: ctx.escapeHtml,
      api: ctx.api,
      getHandle: ctx.getHandle,
      requireConnected: ctx.requireConnected,
      setAdminToken: ctx.setAdminToken,
      isAdminSignedIn: ctx.isAdminSignedIn,
      adminHandle: ctx.adminHandle,
    });

    const syncAdminUi = () => __gmxAdmin.syncAdminUi();
    const requireAdminSignedIn = () => __gmxAdmin.requireAdminSignedIn();
    const pruneLegacyAdminPanels = () => __gmxAdmin.pruneLegacyAdminPanels();
    __gmxAdmin.bindAdmin();

    return { syncAdminUi, requireAdminSignedIn, pruneLegacyAdminPanels };
  };
})(window);
