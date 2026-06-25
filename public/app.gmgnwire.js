(function (window) {
  if (window.__GMXGmGnWireFactory) return;

  window.__GMXGmGnWireFactory = function createGMXGmGnWire(ctx) {
    ctx = ctx || {};
    const $ = typeof ctx.$ === "function" ? ctx.$ : (id) => document.getElementById(id);
    const requireConnected =
      typeof ctx.requireConnected === "function" ? ctx.requireConnected : () => true;
    const setView = typeof ctx.setView === "function" ? ctx.setView : () => {};
    const generate = typeof ctx.generate === "function" ? ctx.generate : () => {};
    const trackEvent = typeof ctx.trackEvent === "function" ? ctx.trackEvent : () => {};
    const getBestMode = typeof ctx.getBestMode === "function" ? ctx.getBestMode : () => false;
    const setBestMode = typeof ctx.setBestMode === "function" ? ctx.setBestMode : () => {};
    const getCleanFillEnabled =
      typeof ctx.getCleanFillEnabled === "function" ? ctx.getCleanFillEnabled : () => false;
    const setCleanFillEnabled =
      typeof ctx.setCleanFillEnabled === "function" ? ctx.setCleanFillEnabled : () => {};
    const doBestServer = typeof ctx.doBestServer === "function" ? ctx.doBestServer : () => {};
    const doBest = typeof ctx.doBest === "function" ? ctx.doBest : () => {};
    const commitNewLine = typeof ctx.commitNewLine === "function" ? ctx.commitNewLine : () => {};
    const oneClickCleanup =
      typeof ctx.oneClickCleanup === "function" ? ctx.oneClickCleanup : () => {};
    const clearView = typeof ctx.clearView === "function" ? ctx.clearView : () => {};
    const clearAll = typeof ctx.clearAll === "function" ? ctx.clearAll : () => {};
    const addPasted = typeof ctx.addPasted === "function" ? ctx.addPasted : () => {};
    const copyAll = typeof ctx.copyAll === "function" ? ctx.copyAll : () => {};
    const exportAll = typeof ctx.exportAll === "function" ? ctx.exportAll : () => {};
    const renderList = typeof ctx.renderList === "function" ? ctx.renderList : () => {};
    const saveDraft = typeof ctx.saveDraft === "function" ? ctx.saveDraft : () => {};
    const getHandle = typeof ctx.getHandle === "function" ? ctx.getHandle : () => "";
    const getReplyLangs = typeof ctx.getReplyLangs === "function" ? ctx.getReplyLangs : () => [];
    const lsGet = typeof ctx.lsGet === "function" ? ctx.lsGet : () => "";
    const lsSet = typeof ctx.lsSet === "function" ? ctx.lsSet : () => {};
    const lsGmReplyLang = ctx.lsGmReplyLang || "gmx_gm_reply_lang";
    const lsGnReplyLang = ctx.lsGnReplyLang || "gmx_gn_reply_lang";
    const persistStyle = typeof ctx.persistStyle === "function" ? ctx.persistStyle : () => {};
    const lsKeyPack = typeof ctx.lsKeyPack === "function" ? ctx.lsKeyPack : () => "";
    const getGmView = typeof ctx.getGmView === "function" ? ctx.getGmView : () => "global";
    const getGnView = typeof ctx.getGnView === "function" ? ctx.getGnView : () => "global";
    const ensureIndexed = typeof ctx.ensureIndexed === "function" ? ctx.ensureIndexed : () => {};
    const renderLangChips =
      typeof ctx.renderLangChips === "function" ? ctx.renderLangChips : () => {};
    const updateLangFlags =
      typeof ctx.updateLangFlags === "function" ? ctx.updateLangFlags : () => {};
    const syncModePanelCopy =
      typeof ctx.syncModePanelCopy === "function" ? ctx.syncModePanelCopy : () => {};

    const QUICK_PRESETS = {
      casual: { mode: "mid", style: "classic", pack: "classic" },
      professional: { mode: "mid", style: "alpha", pack: "king" },
      fun: { mode: "min", style: "cheer", pack: "classic" },
    };

    function applyQuickPreset(kind, presetId) {
      const presetKey = presetId === "pro" ? "professional" : presetId;
      const preset = QUICK_PRESETS[presetKey];
      if (!preset) return false;

      const modeEl = kind === "gm" ? $("gmMode") : $("gnMode");
      const styleEl = kind === "gm" ? $("gmStyle") : $("gnStyle");
      const packEl = kind === "gm" ? $("gmPack") : $("gnPack");

      if (modeEl) {
        const hasMode = Array.from(modeEl.options).some((o) => o.value === preset.mode);
        if (hasMode) modeEl.value = preset.mode;
      }
      if (styleEl) {
        const styleOpt = Array.from(styleEl.options).find((o) => o.value === preset.style && !o.disabled);
        if (styleOpt) styleEl.value = preset.style;
        else if (styleEl.options.length) styleEl.value = styleEl.options[0].value;
        persistStyle(kind, styleEl.value);
      }
      if (packEl) {
        const packOpt = Array.from(packEl.options).find((o) => o.value === preset.pack && !o.disabled);
        if (packOpt) packEl.value = preset.pack;
        else if (packEl.options.length) packEl.value = packEl.options[0].value;
        try {
          lsSet(lsKeyPack(kind), packEl.value || "classic");
        } catch (_e) {}
      }

      try {
        modeEl?.dispatchEvent(new Event("change", { bubbles: true }));
        styleEl?.dispatchEvent(new Event("change", { bubbles: true }));
        packEl?.dispatchEvent(new Event("change", { bubbles: true }));
      } catch (_e) {}
      try {
        syncModePanelCopy();
      } catch (_e) {}
      return true;
    }

    function wireQuickPresets() {
      document.querySelectorAll(".quickPresets [data-preset]").forEach((btn) => {
        btn.onclick = () => {
          const wrap = btn.closest(".quickPresets");
          const kind = wrap?.dataset?.kind || "gm";
          const preset = btn.dataset.preset || "casual";
          applyQuickPreset(kind, preset);
          wrap?.querySelectorAll("[data-preset]").forEach((b) => {
            b.classList.toggle("active", b === btn);
          });
          try {
            trackEvent("quick_preset", { kind, preset });
          } catch (_e) {}
        };
      });
    }

    function wireKindPanel(kind) {
      const K = kind.toUpperCase();
      const viewGlobalBtn = $(`${kind}ViewGlobal`);
      if (viewGlobalBtn) {
        viewGlobalBtn.onclick = () => {
          if (requireConnected(K)) setView(kind, "global");
        };
      }
      const viewLangBtn = $(`${kind}ViewLang`);
      if (viewLangBtn) {
        viewLangBtn.onclick = () => {
          if (requireConnected(K)) setView(kind, "lang");
        };
      }

      const rand1Btn = $(`${kind}Rand1`);
      if (rand1Btn) {
        rand1Btn.onclick = () => {
          if (!requireConnected(K)) return;
          try {
            trackEvent("generate_click", { kind, count: 1 });
          } catch (_e) {}
          generate(kind, 1);
        };
      }
      const rand10Btn = $(`${kind}Rand10`);
      if (rand10Btn) {
        rand10Btn.onclick = () => {
          if (!requireConnected(K)) return;
          try {
            trackEvent("generate_click", { kind, count: 10 });
          } catch (_e) {}
          generate(kind, 10);
        };
      }

      const bestBtn = $(`${kind}BestBtn`);
      if (bestBtn) {
        bestBtn.onclick = () => {
          if (!requireConnected(K)) return;
          try {
            trackEvent("best_click", { kind, mode: getBestMode() ? "live" : "saved" });
          } catch (_e) {}
          if (getBestMode()) doBestServer(kind);
          else doBest(kind);
        };
      }

      const newAddBtn = $(`${kind}NewAdd`);
      if (newAddBtn) {
        newAddBtn.onclick = () => {
          if (requireConnected(K)) commitNewLine(kind);
        };
      }
      const newLineInp = $(`${kind}NewLine`);
      if (newLineInp) {
        newLineInp.addEventListener("keydown", (e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            if (requireConnected(K)) commitNewLine(kind);
          }
        });
        newLineInp.addEventListener("input", () => saveDraft(kind));
      }

      const cleanupBtn = $(`${kind}Cleanup`);
      if (cleanupBtn) {
        cleanupBtn.onclick = () => {
          if (requireConnected(K)) oneClickCleanup(kind);
        };
      }
      const clearBtn = $(`${kind}Clear`);
      if (clearBtn) {
        clearBtn.onclick = () => {
          if (requireConnected(K)) clearView(kind);
        };
      }
      const clearAllBtn = $(`${kind}ClearAll`);
      if (clearAllBtn) {
        clearAllBtn.onclick = () => {
          if (requireConnected(K)) clearAll(kind);
        };
      }
      const pasteAddBtn = $(`${kind}PasteAdd`);
      if (pasteAddBtn) {
        pasteAddBtn.onclick = () => {
          if (requireConnected(K)) addPasted(kind);
        };
      }

      const copyAllBtn = $(`${kind}CopyAll`);
      if (copyAllBtn) {
        copyAllBtn.onclick = () => {
          if (requireConnected(K)) copyAll(kind);
        };
      }
      const exportBtn = $(`${kind}Export`);
      if (exportBtn) {
        exportBtn.onclick = () => {
          if (requireConnected(K)) exportAll(kind);
        };
      }

      const filterInp = $(`${kind}Filter`);
      if (filterInp) filterInp.addEventListener("input", () => renderList(kind));
      const filterClearBtn = $(`${kind}FilterClear`);
      if (filterClearBtn) {
        filterClearBtn.onclick = () => {
          if (filterInp) filterInp.value = "";
          renderList(kind);
        };
      }

      const paste = $(`${kind}Paste`);
      if (paste) paste.addEventListener("input", () => saveDraft(kind));
    }

    function wireReplyLangSelects(sel) {
      const gmLangSel = sel?.gmLangSel;
      const gnLangSel = sel?.gnLangSel;
      const replyLangs = getReplyLangs();
      const validReply = (v) =>
        replyLangs.some(([code]) => code === v) ? v : "en";

      if (gmLangSel) gmLangSel.value = validReply(lsGet(lsGmReplyLang, "en"));
      if (gnLangSel) gnLangSel.value = validReply(lsGet(lsGnReplyLang, "en"));

      if (gmLangSel) {
        gmLangSel.addEventListener("change", () => {
          try {
            lsSet(lsGmReplyLang, gmLangSel.value);
          } catch (_e) {}
          updateLangFlags();
          if (getGmView() === "lang") ensureIndexed("gm", gmLangSel.value);
          renderList("gm");
          renderLangChips("gm");
        });
      }
      if (gnLangSel) {
        gnLangSel.addEventListener("change", () => {
          try {
            lsSet(lsGnReplyLang, gnLangSel.value);
          } catch (_e) {}
          updateLangFlags();
          if (getGnView() === "lang") ensureIndexed("gn", gnLangSel.value);
          renderList("gn");
          renderLangChips("gn");
        });
      }
    }

    function wireCtrlEnterBatch() {
      document.addEventListener("keydown", (e) => {
        if (!(e.ctrlKey || e.metaKey) || e.key !== "Enter") return;
        if (!getHandle()) return;
        const active = $("t_gm")?.classList.contains("active")
          ? "gm"
          : $("t_gn")?.classList.contains("active")
            ? "gn"
            : null;
        if (!active) return;
        const tab = $(`tab-${active}`);
        if (!tab || tab.classList.contains("hidden")) return;
        e.preventDefault();
        try {
          trackEvent("generate_click", { kind: active, count: 10, via: "ctrl_enter" });
        } catch (_e) {}
        generate(active, 10);
      });
    }

    function wireGmGnPanels() {
      const gmBestModeToggle = $("gmBestModeToggle");
      if (gmBestModeToggle) gmBestModeToggle.onclick = () => setBestMode(!getBestMode());
      const gmCleanFillToggle = $("gmCleanFillToggle");
      if (gmCleanFillToggle) {
        gmCleanFillToggle.onclick = () => setCleanFillEnabled("gm", !getCleanFillEnabled("gm"));
      }
      const gnBestModeToggle = $("gnBestModeToggle");
      if (gnBestModeToggle) gnBestModeToggle.onclick = () => setBestMode(!getBestMode());
      const gnCleanFillToggle = $("gnCleanFillToggle");
      if (gnCleanFillToggle) {
        gnCleanFillToggle.onclick = () => setCleanFillEnabled("gn", !getCleanFillEnabled("gn"));
      }

      wireKindPanel("gm");
      wireKindPanel("gn");
      wireQuickPresets();
      wireCtrlEnterBatch();
      try {
        if (typeof ctx.renderAllGenHistory === "function") ctx.renderAllGenHistory();
      } catch (_e) {}
    }

    return {
      wireReplyLangSelects,
      wireGmGnPanels,
    };
  };
})(window);
