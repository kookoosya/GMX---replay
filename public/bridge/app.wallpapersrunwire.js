(function (window) {
  if (window.__GMXWallpapersRunWireFactory) return;

  window.__GMXWallpapersRunWireFactory = function createGMXWallpapersRunWire(ctx) {
    ctx = ctx || {};
    const keys = ctx.keys || {};
    const mod = ctx.mod || {};

    function buildWireCtx() {
      return {
        keys: keys.K,
        wp: mod.wp,
        wpStore: mod.wpStore,
        customWp: mod.customWp,
        wpHelpers: mod.wpHelpers,
        extWpStore: mod.extWpStore,
        tabState: mod.tabState,
        wpApply: mod.wpApply,
        i18nUi: mod.i18nUi,
        wpUi: mod.wpUi,
        langUi: mod.langUi,
      };
    }

    function run() {
      if (!window.__GMXWallpapersWireFactory) throw new Error("GMX wallpaperswire factory missing");
      return window.__GMXWallpapersWireFactory(buildWireCtx());
    }

    return { run, buildWireCtx };
  };
})(window);
