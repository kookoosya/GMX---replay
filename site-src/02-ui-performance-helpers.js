  if (!window.__GMXUiWireFactory) throw new Error("GMX uiwire factory missing");
  const __gmxUiWire = window.__GMXUiWireFactory({ ui: __gmxUi });
  function chunkedRender(grid, items, renderItem, opts){
    return __gmxUiWire.chunkedRender(grid, items, renderItem, opts);
  }
  function mountLineListSkeleton(container, count){
    return __gmxUiWire.mountLineListSkeleton(container, count);
  }
  async function yieldToUiFrame(){
    return await __gmxUiWire.yieldToUiFrame();
  }
  function prefetchImage(url){
    return __gmxUiWire.prefetchImage(url);
  }
  function observeLazyBg(el){ return __gmxUiWire.observeLazyBg(el); }
  async function postEvent(type, meta){
    return __gmxUiWire.postEvent(type, meta);
  }
