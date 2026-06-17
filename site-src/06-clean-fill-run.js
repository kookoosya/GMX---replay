  if (!window.__GMXCleanFillRunWireFactory) throw new Error("GMX cleanfillrunwire factory missing");
  const {
    oneClickCleanup,
    refillCleanFill,
    cleanupKeyLines,
    pushRecent,
    repeatKey,
    filterAntiRepeat,
    normalizeLine,
    dedupeLines,
  } = window.__GMXCleanFillRunWireFactory({
    $,
    api,
    format: __gmxFmt,
    cleanfill: __gmxCf,
    gen: __gmxGen,
    antirepeat: __gmxAnti,
    ui: __gmxUi,
    readGenParams,
    getAntiStrength,
    activeKey,
    readKey,
    writeKey,
    remainingSlots,
    renderList,
    getHandle,
    tab,
  });
  __gmxBankUiWireCtx.pushRecent = pushRecent;
  __gmxBankUiWireCtx.repeatKey = repeatKey;
