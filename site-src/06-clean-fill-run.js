  if (!window.__GMXCleanFillRunFactory) throw new Error("GMX cleanfillrun factory missing");
  const __gmxCfr = window.__GMXCleanFillRunFactory({
    $,
    api,
    escapeHtml: (s) => __gmxFmt.escapeHtml(s),
    getCleanFillStrength: () => __gmxCf.CLEAN_FILL_STRENGTH,
    readGenParams,
    activeKey,
    readKey,
    writeKey,
    remainingSlots,
    normalizeLine: (s) => __gmxGen.normalizeLine(s),
    repeatKey: (s, strength) => __gmxGen.repeatKey(s, strength),
    dedupeLinesByShape: (lines, strength) => __gmxGen.dedupeLinesByShape(lines, strength),
    yieldToUiFrame: () => __gmxUi.yieldToUiFrame(),
    pushRecent: (kind, keys) => __gmxAnti.pushRecent(kind, keys),
    renderList,
    getHandle,
    tab,
  });

  function oneClickCleanup(kind, opts) {
    return __gmxCfr.oneClickCleanup(kind, opts);
  }
  function refillCleanFill(kind, targetCount, opts) {
    return __gmxCfr.refillCleanFill(kind, targetCount, opts);
  }
  function cleanupKeyLines(lines) {
    return __gmxCfr.cleanupKeyLines(lines);
  }
