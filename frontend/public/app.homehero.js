(function (window) {
  if (window.__GMXHomeHeroFactory) return;

  window.__GMXHomeHeroFactory = function createGMXHomeHero(ctx) {
    ctx = ctx || {};
    const $ = typeof ctx.$ === "function" ? ctx.$ : (id) => document.getElementById(id);

    function prefersReducedMotion() {
      try {
        return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      } catch {
        return false;
      }
    }

    function bindHomeHero() {
      const root = $("homeHero");
      if (!root) return;

      const video = $("homeHeroVideo");
      const anim = $("homeHeroAnim");
      const reduced = prefersReducedMotion();

      const showAnim = () => {
        if (video) video.classList.add("hidden");
        if (anim) anim.classList.remove("hidden");
      };

      const showVideo = () => {
        if (anim) anim.classList.add("hidden");
        if (!video) return;
        video.classList.remove("hidden");
        const play = video.play?.();
        if (play && typeof play.catch === "function") play.catch(() => showAnim());
      };

      if (reduced) {
        if (video) video.classList.add("hidden");
        if (anim) anim.classList.add("hidden");
      } else if (video) {
        const source = video.querySelector("source");
        const mp4 = source && source.getAttribute("src");
        if (!mp4) {
          showAnim();
        } else {
          fetch(mp4, { method: "HEAD", cache: "no-store" })
            .then((res) => (res.ok ? showVideo() : showAnim()))
            .catch(() => showAnim());
          video.addEventListener("error", showAnim, { once: true });
        }
      }

      const tryBtn = $("hero_try_demo");
      if (tryBtn) {
        tryBtn.addEventListener("click", () => {
          const anchor = $("h_try_title") || $("homeTryGm");
          if (anchor && anchor.scrollIntoView) {
            try {
              anchor.scrollIntoView({ behavior: "smooth", block: "center" });
            } catch {
              anchor.scrollIntoView();
            }
          }
          const gm = $("homeTryGm");
          if (gm) window.setTimeout(() => gm.click(), 450);
        });
      }
    }

    return { bindHomeHero };
  };
})(window);
