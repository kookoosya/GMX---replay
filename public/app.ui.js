(function (window) {
  if (window.__GMXUiFactory) return;

  window.__GMXUiFactory = function createGMXUi(ctx) {
    ctx = ctx || {};
    const api = String(ctx.api || "");
    const getToken = typeof ctx.getToken === "function" ? ctx.getToken : () => "";
    const __GRID_JOBS = Object.create(null);
    let __LAZY_OBSERVER = null;

    function chunkedRender(grid, items, renderItem, opts) {
      try {
        if (!grid) return;
        const o = opts || {};
        const key = String(o.key || grid.id || "grid");
        const chunk = Math.max(8, Number(o.chunk || 24));
        __GRID_JOBS[key] = (Number(__GRID_JOBS[key] || 0) + 1);
        const token = __GRID_JOBS[key];
        grid.innerHTML = "";
        let i = 0;
        const step = () => {
          if (__GRID_JOBS[key] !== token) return;
          const frag = document.createDocumentFragment();
          const end = Math.min(i + chunk, items.length);
          for (; i < end; i++) {
            const el = renderItem(items[i], i);
            if (el) frag.appendChild(el);
          }
          grid.appendChild(frag);
          if (i < items.length) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      } catch (_e) {
        try {
          grid.innerHTML = "";
          const frag = document.createDocumentFragment();
          items.forEach((it, idx) => {
            const el = renderItem(it, idx);
            if (el) frag.appendChild(el);
          });
          grid.appendChild(frag);
        } catch {}
      }
    }

    async function yieldToUiFrame() {
      await new Promise((resolve) => {
        try {
          if (typeof requestAnimationFrame === "function") {
            requestAnimationFrame(() => resolve());
            return;
          }
        } catch {}
        setTimeout(() => resolve(), 0);
      });
    }

    const __IMG_PREFETCH = new Map();
    function prefetchImage(url) {
      try {
        const u = String(url || "").trim();
        if (!u) return Promise.resolve(false);
        if (__IMG_PREFETCH.has(u)) return __IMG_PREFETCH.get(u);
        const p = new Promise((resolve) => {
          try {
            const img = new Image();
            img.decoding = "async";
            img.loading = "eager";
            img.referrerPolicy = "no-referrer";
            img.onload = async () => {
              try {
                if (img.decode) await img.decode();
              } catch {}
              resolve(true);
            };
            img.onerror = () => resolve(false);
            img.src = u;
          } catch {
            resolve(false);
          }
        });
        __IMG_PREFETCH.set(u, p);
        return p;
      } catch {
        return Promise.resolve(false);
      }
    }

    function observeLazyBg(el) {
      try {
        if (!el) return;
        const bg = el.getAttribute("data-bg");
        if (!bg) return;
        if (!("IntersectionObserver" in window)) {
          el.style.backgroundImage = `url('${bg}')`;
          el.removeAttribute("data-bg");
          return;
        }
        if (!__LAZY_OBSERVER) {
          __LAZY_OBSERVER = new IntersectionObserver(
            (entries) => {
              for (const e of entries) {
                if (!e.isIntersecting) continue;
                const node = e.target;
                const url = node.getAttribute("data-bg");
                if (url) {
                  node.style.backgroundImage = `url('${url}')`;
                  node.removeAttribute("data-bg");
                }
                try {
                  __LAZY_OBSERVER.unobserve(node);
                } catch {}
              }
            },
            { rootMargin: "240px" }
          );
        }
        __LAZY_OBSERVER.observe(el);
      } catch {}
    }

    async function postEvent(type, meta) {
      try {
        const tok = String(getToken() || "").trim();
        if (!tok || !api) return;
        await fetch(api + "/api/event", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: "Bearer " + tok },
          body: JSON.stringify({ type, meta: meta || null }),
        });
      } catch {}
    }

    return { chunkedRender, yieldToUiFrame, prefetchImage, observeLazyBg, postEvent };
  };
})(window);
