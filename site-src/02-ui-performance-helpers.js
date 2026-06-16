  // ----- UI performance helpers -----
  function chunkedRender(grid, items, renderItem, opts){
    return __gmxUi.chunkedRender(grid, items, renderItem, opts);
  }

  async function yieldToUiFrame(){
    return await __gmxUi.yieldToUiFrame();
  }

  function prefetchImage(url){
    return __gmxUi.prefetchImage(url);
  }

  function observeLazyBg(el){ return __gmxUi.observeLazyBg(el); }

async function postEvent(type, meta){
  return __gmxUi.postEvent(type, meta);
}
