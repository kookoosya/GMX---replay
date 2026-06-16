(function (window) {
  if (window.__GMXGenParamsFactory) return;

  const VALID_STYLES = new Set([
    "classic",
    "classy",
    "emoji",
    "noemoji",
    "minimal",
    "meme",
    "degen",
    "alpha",
    "cheer",
    "calm",
    "builder",
    "focus",
  ]);

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

    function lsKeyStyle(kind) {
      return typeof storage.lsKeyStyle === "function"
        ? storage.lsKeyStyle(kind)
        : kind === "gn"
          ? K.GN_STYLE || "gmx_gn_style_v2"
          : K.GM_STYLE || "gmx_gm_style_v2";
    }

    function normalizeStyle(style) {
      const s = String(style || "classic").toLowerCase().trim();
      return VALID_STYLES.has(s) ? s : "classic";
    }

    function persistStyle(kind, style) {
      try {
        storage.lsSet(lsKeyStyle(kind), normalizeStyle(style));
      } catch {}
    }

    function packForKind(kind) {
      const packEl = kind === "gn" ? $("gnPack") : $("gmPack");
      const packId = packEl ? packEl.value || "classic" : "classic";
      const packs = packsForKind(kind);
      return packs.find((p) => p.id === packId) || packs[0] || null;
    }

    function getAntiStrength(kind) {
      try {
        const raw = storage.lsGet(lsKeyAnti(kind), "");
        if (raw !== null && raw !== "") {
          const n = Math.trunc(Number(raw));
          if (Number.isFinite(n)) return Math.max(0, Math.min(5, n));
        }
      } catch {}
      const pack = packForKind(kind);
      const anti = pack && Number.isFinite(pack.anti) ? pack.anti : 2;
      return Math.max(0, Math.min(5, anti));
    }

    function readGenParams(kind) {
      const modeEl = kind === "gm" ? $("gmMode") : $("gnMode");
      const styleEl = kind === "gm" ? $("gmStyle") : $("gnStyle");
      const pack = packForKind(kind);

      let mode = modeEl && modeEl.value ? modeEl.value : pack && pack.mode ? pack.mode : "mid";
      let style = "classic";

      if (styleEl) {
        const raw = styleEl.value || storage.lsGet(lsKeyStyle(kind), "") || "classic";
        style = normalizeStyle(raw);
        if (styleEl.value !== style) styleEl.value = style;
      } else {
        const saved = storage.lsGet(lsKeyStyle(kind), "");
        if (saved) style = normalizeStyle(saved);
        else if (pack && pack.style) style = normalizeStyle(pack.style);
      }

      const lang = getCurrentLang(kind);
      const strength = getAntiStrength(kind);
      const antiN = antiWindow(strength);
      return { mode, lang, style, antiN };
    }

    function applyPackDefaultsToUi(kind, pack) {
      if (!pack) return;
      const styleSel = kind === "gm" ? $("gmStyle") : $("gnStyle");
      const modeSel = kind === "gm" ? $("gmMode") : $("gnMode");
      if (styleSel && pack.style) {
        const style = normalizeStyle(pack.style);
        styleSel.value = style;
        persistStyle(kind, style);
      }
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
      VALID_STYLES,
      normalizeStyle,
      persistStyle,
      getAntiStrength,
      readGenParams,
      applyPackDefaultsToUi,
      unlockedPacksCountFor,
      fillPacks,
    };
  };
})(window);
