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

  let __LAZY_OBSERVER = null;
  function observeLazyBg(el){
    try{
      if (!el) return;
      const bg = el.getAttribute("data-bg");
      if (!bg) return;
      if (!('IntersectionObserver' in window)){
        el.style.backgroundImage = `url('${bg}')`;
        el.removeAttribute("data-bg");
        return;
      }
      if (!__LAZY_OBSERVER){
        __LAZY_OBSERVER = new IntersectionObserver((entries)=>{
          for (const e of entries){
            if (!e.isIntersecting) continue;
            const node = e.target;
            const url = node.getAttribute("data-bg");
            if (url){
              node.style.backgroundImage = `url('${url}')`;
              node.removeAttribute("data-bg");
            }
            try{ __LAZY_OBSERVER.unobserve(node); }catch{}
          }
        }, { rootMargin: "240px" });
      }
      __LAZY_OBSERVER.observe(el);
    }catch{}
  }

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
