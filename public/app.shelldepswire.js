(function (window) {
  if (window.__GMXShellDepsWireFactory) return;

  window.__GMXShellDepsWireFactory = function createGMXShellDepsWire(ctx) {
    ctx = ctx || {};
    if (ctx.mod && ctx.keys?.K) {
      const keys = ctx.keys || {};
      const mod = ctx.mod || {};
      ctx = {
        K: keys.K,
        storage: mod.storage,
        logs: mod.logs,
        cleanfill: mod.cleanfill,
        antirepeat: mod.antirepeat,
        custombg: mod.custombg,
        tabtheme: mod.tabtheme,
      };
    }
    if (!window.__GMXShellDepsFactory) throw new Error("GMX shelldeps factory missing");
    return window.__GMXShellDepsFactory(ctx);
  };
})(window);
