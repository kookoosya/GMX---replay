(function (window) {
  if (window.__GMXUiWireFactory) return;

  window.__GMXUiWireFactory = function createGMXUiWire(ctx) {
    ctx = ctx || {};
    const ui = ctx.ui || {};

    function chunkedRender(grid, items, renderItem, opts) {
      return ui.chunkedRender?.(grid, items, renderItem, opts);
    }
    async function yieldToUiFrame() {
      return await ui.yieldToUiFrame?.();
    }
    function prefetchImage(url) {
      return ui.prefetchImage?.(url);
    }
    function observeLazyBg(el) {
      return ui.observeLazyBg?.(el);
    }
    async function postEvent(type, meta) {
      return ui.postEvent?.(type, meta);
    }

    return {
      chunkedRender,
      yieldToUiFrame,
      prefetchImage,
      observeLazyBg,
      postEvent,
    };
  };
})(window);
