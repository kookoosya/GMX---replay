(function (window) {
  if (window.__GMXShellDepsWireFactory) return;

  window.__GMXShellDepsWireFactory = function createGMXShellDepsWire(ctx) {
    if (!window.__GMXShellDepsFactory) throw new Error("GMX shelldeps factory missing");
    return window.__GMXShellDepsFactory(ctx);
  };
})(window);
