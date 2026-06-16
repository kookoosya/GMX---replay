(function (window) {
  if (window.__GMXStylesFactory) return;

  window.__GMXStylesFactory = function createGMXStyles(ctx) {
    const $ = typeof ctx.$ === "function" ? ctx.$ : () => null;
    const getStyles = typeof ctx.getStyles === "function" ? ctx.getStyles : () => [];
    const isPro = typeof ctx.isPro === "function" ? ctx.isPro : () => false;
    const reqRefsForUnlockIndex =
      typeof ctx.reqRefsForUnlockIndex === "function" ? ctx.reqRefsForUnlockIndex : () => 0;
    const unlockedCountByRefs =
      typeof ctx.unlockedCountByRefs === "function" ? ctx.unlockedCountByRefs : (total) => total;
    const freeVisibleStyles = Number(ctx.freeVisibleStyles) || 8;
    const t = typeof ctx.t === "function" ? ctx.t : (key) => key;

    function unlockedStylesCount() {
      return unlockedCountByRefs(getStyles().length, freeVisibleStyles);
    }

    function fillStyles() {
      const styles = getStyles();
      const unlocked = unlockedStylesCount();
      const fill = (sel) => {
        if (!sel) return;
        const prev = sel.value || "classic";
        sel.innerHTML = "";
        styles.forEach(([v, label], idx) => {
          const o = document.createElement("option");
          o.value = v;
          const locked = !isPro() && idx >= unlocked;
          const need = reqRefsForUnlockIndex(idx, freeVisibleStyles);
          o.textContent = locked ? `${t("locked") || "LOCKED"} (${need} ref)` : label;
          o.disabled = locked;
          sel.appendChild(o);
        });
        const prevIdx = styles.findIndex((x) => x[0] === prev);
        if (prevIdx !== -1 && (isPro() || prevIdx < unlocked)) sel.value = prev;
        else sel.value = styles[0] ? styles[0][0] : "classic";
      };
      fill($("gmStyle"));
      fill($("gnStyle"));
      const counter = $("stylesUnlocked");
      if (counter) counter.textContent = `${unlocked}/${styles.length}`;
    }

    return { fillStyles, unlockedStylesCount };
  };
})(window);
