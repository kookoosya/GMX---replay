(function (window) {
  if (window.__GMXShellDepsRunWireFactory) return;

  window.__GMXShellDepsRunWireFactory = function createGMXShellDepsRunWire(ctx) {
    ctx = ctx || {};
    const keys = ctx.keys || {};
    const mod = ctx.mod || {};

    function run() {
      if (!window.__GMXShellDepsWireFactory) throw new Error("GMX shelldepswire factory missing");
      return window.__GMXShellDepsWireFactory({
        K: keys.K,
        storage: mod.storage,
        logs: mod.logs,
        cleanfill: mod.cleanfill,
        antirepeat: mod.antirepeat,
        custombg: mod.custombg,
        tabtheme: mod.tabtheme,
      });
    }

    return { run };
  };
})(window);
