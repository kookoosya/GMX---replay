// ----- Best (pick a strong line and copy it) -----
let __gmxBestPick;
function pickBestLine(kind, lines){ return __gmxBestPick.pickBestLine(kind, lines); }
async function doBest(kind){ return __gmxBestPick.doBest(kind); }
async function doBestServer(kind){ return __gmxBestPick.doBestServer(kind); }

  function currentLang(kind){
    try{
      const el = kind==="gm" ? $("gmLang") : $("gnLang");
      if (el) el.value = "en";
    }catch{}
    return "en";
  }
  function activeKey(kind){
    return getBankKey(kind);
  }

  function ensureIndexed(kind, lang){
    return;
  }

  if (!window.__GMXBankUiFactory) throw new Error("GMX bankui factory missing");
  const __gmxBankUi = window.__GMXBankUiFactory({
    $,
    escapeHtml,
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
    dedupeLines,
    normalizeLine: (s) => __gmxGen.normalizeLine(s),
    linesFromText,
    activeKey,
    currentLang,
    ensureIndexed,
    chunkedRender,
    renderHelpModal,
    openLimitModal,
    trackEvent,
    toast,
    t,
    updateLangFlags,
    renderLangChips,
    abort: ABORT,
    draftKeys: {
      gmNew: K.DRAFT_GM_NEW,
      gnNew: K.DRAFT_GN_NEW,
      gmPaste: K.DRAFT_GM_PASTE,
      gnPaste: K.DRAFT_GN_PASTE,
    },
  });

  const totalSaved = (kind) => __gmxBankUi.totalSaved(kind);
  const remainingSlots = (kind) => __gmxBankUi.remainingSlots(kind);
  const trimKindToCap = (kind) => __gmxBankUi.trimKindToCap(kind);
  const renderList = (kind) => __gmxBankUi.renderList(kind);
  const updateSavedUI = (kind) => __gmxBankUi.updateSavedUI(kind);
  const setView = (kind, scope) => __gmxBankUi.setView(kind, scope);
  const addLine = (kind) => __gmxBankUi.addLine(kind);
  const clearView = (kind) => __gmxBankUi.clearView(kind);
  const clearAll = (kind) => __gmxBankUi.clearAll(kind);
  const copyAll = (kind) => __gmxBankUi.copyAll(kind);
  const exportAll = (kind) => __gmxBankUi.exportAll(kind);
  const saveDraft = (kind) => __gmxBankUi.saveDraft(kind);
  const restoreDrafts = () => __gmxBankUi.restoreDrafts();
  const commitNewLine = (kind) => __gmxBankUi.commitNewLine(kind);
  const addPasted = (kind) => __gmxBankUi.addPasted(kind);

  if (!window.__GMXBestPickFactory) throw new Error("GMX bestpick factory missing");
  __gmxBestPick = window.__GMXBestPickFactory({
    $,
    api,
    requireConnected,
    readGenParams,
    getAntiStrength,
    activeKey,
    readKey,
    writeKey,
    dedupeLines,
    remainingSlots,
    pushRecent,
    repeatKey,
    renderList,
    refreshUsage,
    setBusy,
    toast,
    t,
    escapeHtml,
    gen: __gmxGen,
  });

  function escapeHtml(s){ return __gmxFmt.escapeHtml(s); }

  function isNetworkishErrorMessage(msg){ return __gmxFmt.isNetworkishErrorMessage(msg); }

  function friendlyUiErrorMessage(msg, opts){ return __gmxFmt.friendlyUiErrorMessage(msg, opts); }
