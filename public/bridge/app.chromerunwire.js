(function (window) {
  if (window.__GMXChromeRunWireFactory) return;

  window.__GMXChromeRunWireFactory = function createGMXChromeRunWire(ctx) {
    ctx = ctx || {};
    const mod = ctx.mod || {};
    const keys = ctx.keys || {};
    const hooks = ctx.hooks || {};
    const session = ctx.session || {};

    function buildWireCtx() {
      return {
        chrome: mod.chrome,
        fmt: mod.fmt,
        styles: mod.styles,
        nav: mod.nav,
        setBg: mod.setBg,
        modals: mod.modals,
        toggles: mod.toggles,
        paywall: mod.paywall,
        health: mod.health,
        usage: mod.usage,
        help: mod.help,
        account: mod.account,
        getInitDone: session.getInitDone,
        normalizeTopLevelTab: hooks.normalizeTopLevelTab,
        LS_SITE_LANG: keys.LS_SITE_LANG,
        API: keys.API,
        LS_HANDLE: keys.LS_HANDLE,
        LS_TOKEN: keys.LS_TOKEN,
        LS_IS_ADMIN: keys.LS_IS_ADMIN,
        LS_ADMIN_CLAIMABLE: keys.LS_ADMIN_CLAIMABLE,
        isLocalDevHost: hooks.isLocalDevHost,
        getAdminToken: hooks.getAdminToken,
        setAuthOk: session.setAuthOk,
        t: hooks.t,
      };
    }

    function run() {
      if (!window.__GMXChromeWireFactory) throw new Error("GMX chromewire factory missing");
      return window.__GMXChromeWireFactory(buildWireCtx());
    }

    return { run, buildWireCtx };
  };
})(window);
