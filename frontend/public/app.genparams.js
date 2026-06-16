(function (window) {
  if (window.__GMXGenParamsFactory) return;

  window.__GMXGenParamsFactory = function createGMXGenParams(ctx) {
    const $ = typeof ctx.$ === "function" ? ctx.$ : () => null;
    const storage = ctx.storage || {};
    const packsForKind = typeof ctx.packsForKind === "function" ? ctx.packsForKind : () => [];
    const antiWindow = typeof ctx.antiWindow === "function" ? ctx.antiWindow : () => 0;
    const getCurrentLang = typeof ctx.getCurrentLang === "function" ? ctx.getCurrentLang : () => "en";
    const isPro = typeof ctx.isPro === "function" ? ctx.isPro : () => false;
    const reqRefsForUnlockIndex =
      typeof ctx.reqRefsForUnlockIndex === "function" ? ctx.reqRefsForUnlockIndex : () => 0;
    const unlockedCountByRefs =
      typeof ctx.unlockedCountByRefs === "function" ? ctx.unlockedCountByRefs : (total) => total;
    const freeVisiblePacks = Number(ctx.freeVisiblePacks) || 8;
    const t = typeof ctx.t === "function" ? ctx.t : (key) => key;
    const syncModePanelCopy = typeof ctx.syncModePanelCopy === "function" ? ctx.syncModePanelCopy : () => {};
    const K = storage.keys || {};

    function lsKeyAnti(kind) {
      return typeof storage.lsKeyAnti === "function"
        ? storage.lsKeyAnti(kind)
        : kind === "gn"
          ? "gmx_gn_anti"
          : "gmx_gm_anti";
    }

    function getAntiStrength(kind) {
      try {
        const raw = storage.lsGet(lsKeyAnti(kind), "");
        if (raw !== null && raw !== "") {
          const n = Math.trunc(Number(raw));
          if (Number.isFinite(n)) return Math.max(0, Math.min(5, n));
        }
      } catch {}
      const packEl = kind === "gn" ? $("gnPack") : $("gmPack");
      const pid = packEl ? packEl.value || "classic" : "classic";
      const packs = packsForKind(kind);
      const pack = packs.find((p) => p.id === pid) || packs[0];
      const anti = pack && Number.isFinite(pack.anti) ? pack.anti : 2;
      return Math.max(0, Math.min(5, anti));
    }

    function readGenParams(kind) {
      const modeEl = kind === "gm" ? $("gmMode") : $("gnMode");
      const styleEl = kind === "gm" ? $("gmStyle") : $("gnStyle");
      const mode = modeEl ? modeEl.value : "mid";
      const lang = getCurrentLang(kind);
      const style = styleEl ? styleEl.value : "classic";
      const strength = getAntiStrength(kind);
      const antiN = antiWindow(strength);
      return { mode, lang, style, antiN };
    }

    function applyPackDefaultsToUi(kind, pack) {
      if (!pack) return;
      const styleSel = kind === "gm" ? $("gmStyle") : $("gnStyle");
      const modeSel = kind === "gm" ? $("gmMode") : $("gnMode");
      if (styleSel && pack.style) styleSel.value = pack.style;
      if (modeSel && pack.mode) modeSel.value = pack.mode;
      try {
        syncModePanelCopy();
      } catch {}
    }

    function unlockedPacksCountFor(kind) {
      return unlockedCountByRefs(packsForKind(kind).length, freeVisiblePacks);
    }

    function fillPacks() {
      const fill = (kind, sel, lsKey) => {
        if (!sel) return;
        const packs = packsForKind(kind);
        const unlocked = unlockedPacksCountFor(kind);
        const prev = storage.lsGet(lsKey, "classic") || "classic";
        sel.innerHTML = "";
        packs.forEach((p, idx) => {
          const o = document.createElement("option");
          o.value = p.id;
          const locked = !isPro() && idx >= unlocked;
          const need = reqRefsForUnlockIndex(idx, freeVisiblePacks);
          o.textContent = locked ? `${t("locked") || "LOCKED"} (${need} ref)` : p.name;
          o.disabled = locked;
          sel.appendChild(o);
        });
        if ([...sel.options].some((o) => o.value === prev && !o.disabled)) sel.value = prev;
        else sel.value = "classic";
      };
      fill("gm", $("gmPack"), K.GM_PACK || "gmx_gm_pack");
      fill("gn", $("gnPack"), K.GN_PACK || "gmx_gn_pack");
    }

    return {
      getAntiStrength,
      readGenParams,
      applyPackDefaultsToUi,
      unlockedPacksCountFor,
      fillPacks,
    };
  };
})(window);
