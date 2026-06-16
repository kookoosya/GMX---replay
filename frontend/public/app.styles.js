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
    const storage = ctx.storage || {};
    const K = storage.keys || {};
    const normalizeStyle =
      typeof ctx.normalizeStyle === "function"
        ? ctx.normalizeStyle
        : (style) => String(style || "classic").toLowerCase().trim() || "classic";
    const syncModePanelCopy =
      typeof ctx.syncModePanelCopy === "function" ? ctx.syncModePanelCopy : () => {};

    function lsKeyStyle(kind) {
      return typeof storage.lsKeyStyle === "function"
        ? storage.lsKeyStyle(kind)
        : kind === "gn"
          ? K.GN_STYLE || "gmx_gn_style_v2"
          : K.GM_STYLE || "gmx_gm_style_v2";
    }

    function persistStyle(kind, style) {
      try {
        storage.lsSet(lsKeyStyle(kind), normalizeStyle(style));
      } catch {}
    }

    function unlockedStylesCount() {
      return unlockedCountByRefs(getStyles().length, freeVisibleStyles);
    }

    function fillStyles() {
      const styles = getStyles();
      const unlocked = unlockedStylesCount();
      const fill = (kind, sel) => {
        if (!sel) return;
        const saved = storage.lsGet(lsKeyStyle(kind), "");
        const prev = normalizeStyle(saved || sel.value || "classic");
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
        persistStyle(kind, sel.value);
      };
      fill("gm", $("gmStyle"));
      fill("gn", $("gnStyle"));
      const counter = $("stylesUnlocked");
      if (counter) counter.textContent = `${unlocked}/${styles.length}`;
    }

    function wireStyleSelectors() {
      const wire = (kind) => {
        const sel = kind === "gm" ? $("gmStyle") : $("gnStyle");
        if (!sel || sel._gmxStyleBound) return;
        sel._gmxStyleBound = true;
        sel.addEventListener("change", () => {
          const style = normalizeStyle(sel.value);
          if (sel.value !== style) sel.value = style;
          persistStyle(kind, style);
          try {
            syncModePanelCopy();
          } catch {}
        });
      };
      wire("gm");
      wire("gn");
    }

    return { fillStyles, wireStyleSelectors, unlockedStylesCount, persistStyle };
  };
})(window);
