(function (window) {
  if (window.__GMXAdminRunWireFactory) return;

  window.__GMXAdminRunWireFactory = function createGMXAdminRunWire(ctx) {
    ctx = ctx || {};
    const core = ctx.core || {};
    const auth = ctx.auth || {};
    const admin = ctx.admin || {};

    function buildWireCtx() {
      return {
        $: core.$,
        escapeHtml: core.escapeHtml,
        api: core.api,
        getHandle: auth.getHandle,
        requireConnected: auth.requireConnected,
        setAdminToken: admin.setAdminToken,
        isAdminSignedIn: admin.isAdminSignedIn,
        adminHandle: admin.adminHandle,
      };
    }

    function run() {
      if (!window.__GMXAdminWireFactory) throw new Error("GMX adminwire factory missing");
      return window.__GMXAdminWireFactory(buildWireCtx());
    }

    return { run, buildWireCtx };
  };
})(window);
