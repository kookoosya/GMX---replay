// ----- Best (pick a strong line and copy it) -----
let __gmxBestPick;
function pickBestLine(kind, lines){ return __gmxBestPick.pickBestLine(kind, lines); }
async function doBest(kind){ return __gmxBestPick.doBest(kind); }
async function doBestServer(kind){ return __gmxBestPick.doBestServer(kind); }

  if (!window.__GMXBankUiWireFactory) throw new Error("GMX bankuiwire factory missing");
  const __gmxBankUiWireCtx = {
    $,
    fmt: __gmxFmt,
    gen: __gmxGen,
    keys: K,
    requireConnected,
    getHandle,
    isPro,
    saveCap,
    saveCapFree: SAVE_CAP_FREE,
    lastSaved: LAST_SAVED,
    getBankKey,
    allLegacyKeysForKind,
    setLangIndex,
    getBankMigrationKey,
    readKey,
    writeKey,
    dedupeLines: __gmxGen.dedupeLines,
    linesFromText,
    chunkedRender,
    mountLineListSkeleton,
    renderHelpModal,
    openLimitModal,
    trackEvent,
    toast,
    t,
    updateLangFlags,
    renderLangChips,
    abort: ABORT,
    api,
    readGenParams,
    getAntiStrength,
    refreshUsage,
    setBusy,
    onNavigateConnect: () => {
      tab("home");
      try {
        const hi = $("xHandle");
        if (hi) {
          hi.focus();
          hi.scrollIntoView({ block: "center", behavior: "smooth" });
        }
      } catch (_e) {}
    },
  };
  const __gmxBankUiWire = window.__GMXBankUiWireFactory(__gmxBankUiWireCtx);
  __gmxBestPick = __gmxBankUiWire.bestPick;
  const __gmxBankUi = __gmxBankUiWire.bankUi;
  const {
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
    isNetworkishErrorMessage,
    friendlyUiErrorMessage,
  } = __gmxBankUiWire;
  function escapeHtml(s){ return __gmxBankUiWire.escapeHtml(s); }

  function ensureIndexed(kind, lang){
    return;
  }
  function activeKey(kind){
    return getBankKey(kind);
  }
