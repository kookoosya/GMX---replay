(function (window) {
  if (window.__GMXThemesRunWireFactory) return;

  window.__GMXThemesRunWireFactory = function createGMXThemesRunWire(ctx) {
    ctx = ctx || {};
    const keys = ctx.keys || {};
    const mod = ctx.mod || {};
    const catalog = ctx.catalog || {};

    function buildWireCtx() {
      return {
        extViewKey: keys.extViewKey,
        themeApply: mod.themeApply,
        extWpStore: mod.extWpStore,
        extView: mod.extView,
        wpUi: mod.wpUi,
        themesUi: mod.themesUi,
        extApply: mod.extApply,
        extCbgUi: mod.extCbgUi,
        extThemesUi: mod.extThemesUi,
        extWpUi: mod.extWpUi,
        unlockedCountByRefs: catalog.unlockedCountByRefs,
        extThemesLength: catalog.extThemesLength,
        freeVisibleExtThemes: catalog.freeVisibleExtThemes,
      };
    }

    function run() {
      if (!window.__GMXThemesWireFactory) throw new Error("GMX themeswire factory missing");
      return window.__GMXThemesWireFactory(buildWireCtx());
    }

    return { run, buildWireCtx };
  };
})(window);
