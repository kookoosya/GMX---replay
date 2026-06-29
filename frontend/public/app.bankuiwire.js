(function (window) {
  if (window.__GMXBankUiWireFactory) return;

  window.__GMXBankUiWireFactory = function createGMXBankUiWire(ctx) {
    ctx = ctx || {};
    if (ctx.core) {
      const core = ctx.core || {};
    const auth = ctx.auth || {};
    const data = ctx.data || {};
    const ui = ctx.ui || {};
    const perf = ctx.perf || {};
    const params = ctx.params || {};
    const state = ctx.state || {};

    ctx = {
        $: core.$,
        fmt: core.fmt,
        gen: core.gen,
        keys: data.keys,
        requireConnected: auth.requireConnected,
        getHandle: auth.getHandle,
        isPro: auth.isPro,
        saveCap: data.saveCap,
        saveCapFree: data.saveCapFree,
        lastSaved: data.lastSaved,
        getBankKey: data.getBankKey,
        allLegacyKeysForKind: data.allLegacyKeysForKind,
        setLangIndex: data.setLangIndex,
        getBankMigrationKey: data.getBankMigrationKey,
        readKey: data.readKey,
        writeKey: data.writeKey,
        dedupeLines: core.dedupeLines,
        linesFromText: data.linesFromText,
        chunkedRender: ui.chunkedRender,
        mountLineListSkeleton: ui.mountLineListSkeleton,
        renderHelpModal: ui.renderHelpModal,
        openLimitModal: ui.openLimitModal,
        trackEvent: perf.trackEvent,
        toast: ui.toast,
        t: ui.t,
        updateLangFlags: ui.updateLangFlags,
        renderLangChips: ui.renderLangChips,
        abort: state.abort,
        api: core.api,
        readGenParams: params.readGenParams,
        getAntiStrength: params.getAntiStrength,
        refreshUsage: ui.refreshUsage,
        setBusy: ui.setBusy,
      };
    }
    const fmt = ctx.fmt || {};
    const gen = ctx.gen || {};
    const keys = ctx.keys || {};

    function escapeHtml(s) {
      return fmt.escapeHtml?.(s);
    }
    function isNetworkishErrorMessage(msg) {
      return fmt.isNetworkishErrorMessage?.(msg);
    }
    function friendlyUiErrorMessage(msg, opts) {
      return fmt.friendlyUiErrorMessage?.(msg, opts);
    }
    function currentLang(kind) {
      const isGn = String(kind || "").toLowerCase() === "gn";
      const lsKey = isGn ? keys.GN_REPLY_LANG || "gmx_gn_reply_lang" : keys.GM_REPLY_LANG || "gmx_gm_reply_lang";
      const selId = isGn ? "gnLang" : "gmLang";
      try {
        const v = ctx.$?.(selId)?.value;
        if (v) return String(v).trim() || "en";
      } catch (_e) {}
      try {
        const stored = ctx.storage?.lsGet?.(lsKey, "en");
        if (stored) return String(stored).trim() || "en";
      } catch (_e) {}
      return "en";
    }
    function activeKey(kind) {
      return ctx.getBankKey?.(kind);
    }
    function ensureIndexed(_kind, _lang) {
      return;
    }

    if (!window.__GMXBankUiFactory) throw new Error("GMX bankui factory missing");
    const bankUi = window.__GMXBankUiFactory({
      $: ctx.$,
      escapeHtml,
      requireConnected: ctx.requireConnected,
      getHandle: ctx.getHandle,
      isPro: ctx.isPro,
      saveCap: ctx.saveCap,
      saveCapFree: ctx.saveCapFree,
      lastSaved: ctx.lastSaved,
      getBankKey: ctx.getBankKey,
      allLegacyKeysForKind: ctx.allLegacyKeysForKind,
      setLangIndex: ctx.setLangIndex,
      getBankMigrationKey: ctx.getBankMigrationKey,
      readKey: ctx.readKey,
      writeKey: ctx.writeKey,
      dedupeLines: ctx.dedupeLines,
      normalizeLine: (s) => gen.normalizeLine?.(s),
      linesFromText: ctx.linesFromText,
      activeKey,
      currentLang,
      ensureIndexed,
      chunkedRender: ctx.chunkedRender,
      mountLineListSkeleton: ctx.mountLineListSkeleton,
      renderHelpModal: ctx.renderHelpModal,
      openLimitModal: ctx.openLimitModal,
      trackEvent: ctx.trackEvent,
      toast: ctx.toast,
      t: ctx.t,
      onNavigateConnect: ctx.onNavigateConnect,
      getBankListError: ctx.getBankListError,
      updateLangFlags: ctx.updateLangFlags,
      renderLangChips: ctx.renderLangChips,
      abort: ctx.abort,
      draftKeys: {
        gmNew: keys.DRAFT_GM_NEW,
        gnNew: keys.DRAFT_GN_NEW,
        gmPaste: keys.DRAFT_GM_PASTE,
        gnPaste: keys.DRAFT_GN_PASTE,
      },
    });

    const totalSaved = (kind) => bankUi.totalSaved?.(kind);
    const remainingSlots = (kind) => bankUi.remainingSlots?.(kind);
    const trimKindToCap = (kind) => bankUi.trimKindToCap?.(kind);
    const renderList = (kind) => bankUi.renderList?.(kind);
    const updateSavedUI = (kind) => bankUi.updateSavedUI?.(kind);
    const setView = (kind, scope) => bankUi.setView?.(kind, scope);
    const addLine = (kind) => bankUi.addLine?.(kind);
    const clearView = (kind) => bankUi.clearView?.(kind);
    const clearAll = (kind) => bankUi.clearAll?.(kind);
    const copyAll = (kind) => bankUi.copyAll?.(kind);
    const exportAll = (kind) => bankUi.exportAll?.(kind);
    const saveDraft = (kind) => bankUi.saveDraft?.(kind);
    const restoreDrafts = () => bankUi.restoreDrafts?.();
    const commitNewLine = (kind) => bankUi.commitNewLine?.(kind);
    const addPasted = (kind) => bankUi.addPasted?.(kind);

    if (!window.__GMXBestPickFactory) throw new Error("GMX bestpick factory missing");
    const bestPick = window.__GMXBestPickFactory({
      $: ctx.$,
      api: ctx.api,
      requireConnected: ctx.requireConnected,
      readGenParams: ctx.readGenParams,
      getAntiStrength: ctx.getAntiStrength,
      activeKey,
      readKey: ctx.readKey,
      writeKey: ctx.writeKey,
      dedupeLines: ctx.dedupeLines,
      remainingSlots,
      pushRecent: (...args) => ctx.pushRecent?.(...args),
      repeatKey: (...args) => ctx.repeatKey?.(...args),
      renderList,
      refreshUsage: ctx.refreshUsage,
      setBusy: ctx.setBusy,
      toast: ctx.toast,
      t: ctx.t,
      escapeHtml,
      gen,
    });

    return {
      bankUi,
      bestPick,
      totalSaved,
      remainingSlots,
      trimKindToCap,
      renderList,
      updateSavedUI,
      setView,
      addLine,
      clearView,
      clearAll,
      copyAll,
      exportAll,
      saveDraft,
      restoreDrafts,
      commitNewLine,
      addPasted,
      escapeHtml,
      isNetworkishErrorMessage,
      friendlyUiErrorMessage,
    };
  };
})(window);
