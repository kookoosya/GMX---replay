(function (window) {
  if (window.__GMXCleanFillFactory) return;

  window.__GMXCleanFillFactory = function createGMXCleanFill(ctx) {
    const storage = ctx && ctx.storage ? ctx.storage : {};
    const $ = typeof ctx.$ === "function" ? ctx.$ : () => null;
    const siteLang = typeof ctx.siteLang === "function" ? ctx.siteLang : () => "en";

    const CLEAN_FILL_STRENGTH = 2;

    function bootstrap() {
      if (typeof storage.bootstrapCleanFillDefaults === "function") storage.bootstrapCleanFillDefaults();
    }

    function getEnabled(kind) {
      return typeof storage.getCleanFillEnabled === "function" ? storage.getCleanFillEnabled(kind) : false;
    }

    function copyForKind(kind) {
      const ru = siteLang() === "ru";
      const on = getEnabled(kind);
      return {
        label: "Best pass",
        button: on ? "Best pass: on" : "Best pass: off",
        hint: on
          ? ru
            ? "Включено: Best pass после запуска режет shape-дубли в сохранённом списке и добивает недостающее обратно до текущей цели."
            : "On: Best pass prunes shape-level near-duplicates from the saved list, then refills the missing slots back to your current target."
          : ru
            ? "Выключено: сначала идёт loose random fill. Если первая пачка слишком узкая, Batch автоматически добирает недостающее. Включай Best pass, когда хочешь ещё и чистить сохранённый банк после запуска."
            : "Off: generation starts as loose random fill. If the first batch comes back too thin, Batch auto-refills the missing slots. Turn Best pass on when you also want the saved bank cleaned after the run.",
        action: "Run best pass",
      };
    }

    function syncUi(kind) {
      const kinds = kind ? [kind] : ["gm", "gn"];
      kinds.forEach((k) => {
        const copy = copyForKind(k);
        const label = $(k === "gm" ? "gm_anti_label" : "gn_anti_label");
        if (label) label.textContent = copy.label;
        const note = $(k === "gm" ? "gm_repeat_note" : "gn_repeat_note");
        if (note) note.textContent = copy.hint;
        const toggle = $(k + "CleanFillToggle");
        if (toggle) {
          toggle.textContent = copy.button;
          toggle.classList.toggle("active", getEnabled(k));
          toggle.setAttribute("aria-pressed", getEnabled(k) ? "true" : "false");
        }
        const cleanupBtn = $(k + "Cleanup");
        if (cleanupBtn) {
          cleanupBtn.style.display = "";
          cleanupBtn.textContent = copy.action;
        }
      });
    }

    function setEnabled(kind, next, silent) {
      const on = !!next;
      if (typeof storage.setCleanFillEnabledRaw === "function") storage.setCleanFillEnabledRaw(kind, on);
      try {
        syncUi(kind);
      } catch {}
      if (!silent) {
        try {
          window.postMessage({ type: "GMX_CLEAN_FILL_SYNC", kind, value: on }, "*");
        } catch {}
        try {
          window.postMessage({ type: "GMX_SYNC_NOW", reason: "clean_fill_change", kind, value: on }, "*");
        } catch {}
      }
      return on;
    }

    return {
      CLEAN_FILL_STRENGTH,
      bootstrap,
      getEnabled,
      setEnabled,
      copyForKind,
      syncUi,
    };
  };
})(window);
