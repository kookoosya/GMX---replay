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
  try{
    const tok = String(localStorage.getItem(LS_TOKEN) || "").trim();
    if (!tok) return;
    await fetch(API + "/api/event", {
      method:"POST",
      headers:{ "Content-Type":"application/json", "Authorization":"Bearer " + tok },
      body: JSON.stringify({ type, meta: meta || null })
    });
  }catch{}
}
