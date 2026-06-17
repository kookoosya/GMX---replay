// ----- Best (pick a strong line and copy it) -----
let __gmxBestPick;
function pickBestLine(kind, lines){ return __gmxBestPick.pickBestLine(kind, lines); }
async function doBest(kind){ return __gmxBestPick.doBest(kind); }
async function doBestServer(kind){ return __gmxBestPick.doBestServer(kind); }

  if (!window.__GMXBankUiRunWireFactory) throw new Error("GMX bankuirunwire factory missing");
  const __gmxBankUiWire = window.__GMXBankUiRunWireFactory({
    core: {
      $,
      fmt: __gmxFmt,
      gen: __gmxGen,
      dedupeLines: __gmxGen.dedupeLines,
      api,
    },
    auth: {
      requireConnected,
      getHandle,
      isPro,
    },
    data: {
      keys: K,
      saveCap,
      saveCapFree: SAVE_CAP_FREE,
      lastSaved: LAST_SAVED,
      getBankKey,
      allLegacyKeysForKind,
      setLangIndex,
      getBankMigrationKey,
      readKey,
      writeKey,
      linesFromText,
    },
    ui: {
      chunkedRender,
      renderHelpModal,
      openLimitModal,
      toast,
      t,
      updateLangFlags,
      renderLangChips,
      refreshUsage,
      setBusy,
    },
    perf: {
      trackEvent,
    },
    params: {
      readGenParams,
      getAntiStrength,
    },
    state: {
      abort: ABORT,
    },
  }).run();
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
