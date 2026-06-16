(function (window) {
  if (window.__GMXTogglesFactory) return;

  window.__GMXTogglesFactory = function createGMXToggles(ctx) {
    const storage = ctx && ctx.storage ? ctx.storage : {};
    const $ = typeof ctx.$ === "function" ? ctx.$ : () => null;
    const keys = storage.keys || {};
    const onAfterBestChange =
      typeof ctx.onAfterBestChange === "function" ? ctx.onAfterBestChange : () => {};

    function getBestMode() {
      return storage.lsGet(keys.BEST_ENABLED, "0") === "1";
    }

    function bestCopyText() {
      return getBestMode()
        ? {
            btn: "Best: live",
            hint: "Best live pulls fresh options, keeps the strongest one, and saves it.",
          }
        : {
            btn: "Best: saved",
            hint: "Best uses the strongest line from your saved list.",
          };
    }

    function syncBestModeUi() {
      const copy = bestCopyText();
      ["gmBestModeToggle", "gnBestModeToggle"].forEach((id) => {
        const el = $(id);
        if (el) el.textContent = copy.btn;
      });
      ["gmBestModeHint", "gnBestModeHint"].forEach((id) => {
        const el = $(id);
        if (el) el.textContent = copy.hint;
      });
      ["gmBestBtn", "gnBestBtn"].forEach((id) => {
        const el = $(id);
        if (el) el.textContent = getBestMode() ? "Best live" : "Best";
      });
    }

    function setBestMode(next, silent) {
      const on = !!next;
      storage.lsSet(keys.BEST_ENABLED, on ? "1" : "0");
      try {
        syncBestModeUi();
      } catch {}
      if (!silent) {
        try {
          window.postMessage({ type: "GMX_SYNC_NOW", reason: "best_mode_change" }, "*");
        } catch {}
      }
      return on;
    }

    function ensureFreshToggleDefaults() {
      if (storage.lsGet(keys.TOGGLES_BOOTSTRAP_V2, "") === "1") return;
      storage.lsSet(keys.BEST_ENABLED, "0");
      storage.lsSet(keys.GM_CLEAN_FILL, "0");
      storage.lsSet(keys.GN_CLEAN_FILL, "0");
      storage.lsSet(keys.TOGGLES_BOOTSTRAP_V2, "1");
    }

    function bootstrap() {
      ensureFreshToggleDefaults();
      try {
        syncBestModeUi();
      } catch {}
      try {
        onAfterBestChange();
      } catch {}
    }

    return {
      getBestMode,
      setBestMode,
      ensureFreshToggleDefaults,
      syncBestModeUi,
      bootstrap,
    };
  };
})(window);
