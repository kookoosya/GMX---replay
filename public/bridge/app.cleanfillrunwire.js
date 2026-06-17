(function (window) {
  if (window.__GMXCleanFillRunWireFactory) return;

  window.__GMXCleanFillRunWireFactory = function createGMXCleanFillRunWire(ctx) {
    ctx = ctx || {};
    const format = ctx.format || {};
    const cleanfill = ctx.cleanfill || {};
    const gen = ctx.gen || {};
    const antirepeat = ctx.antirepeat || {};
    const ui = ctx.ui || {};

    if (!window.__GMXCleanFillRunFactory) throw new Error("GMX cleanfillrun factory missing");
    const cfr = window.__GMXCleanFillRunFactory({
      $: ctx.$,
      api: ctx.api,
      escapeHtml: (s) => format.escapeHtml?.(s) ?? String(s || ""),
      getCleanFillStrength: () => cleanfill.CLEAN_FILL_STRENGTH,
      readGenParams: ctx.readGenParams,
      activeKey: ctx.activeKey,
      readKey: ctx.readKey,
      writeKey: ctx.writeKey,
      remainingSlots: ctx.remainingSlots,
      normalizeLine: (s) => gen.normalizeLine?.(s),
      repeatKey: (s, strength) => gen.repeatKey?.(s, strength),
      dedupeLinesByShape: (lines, strength) => gen.dedupeLinesByShape?.(lines, strength),
      yieldToUiFrame: () => ui.yieldToUiFrame?.(),
      pushRecent: (kind, keys) => antirepeat.pushRecent?.(kind, keys),
      renderList: ctx.renderList,
      getHandle: ctx.getHandle,
      tab: ctx.tab,
    });

    function oneClickCleanup(kind, opts) {
      return cfr.oneClickCleanup(kind, opts);
    }
    function refillCleanFill(kind, targetCount, opts) {
      return cfr.refillCleanFill(kind, targetCount, opts);
    }
    function cleanupKeyLines(lines) {
      return cfr.cleanupKeyLines(lines);
    }
    function pushRecent(kind, keys) {
      return antirepeat.pushRecent?.(kind, keys);
    }
    function repeatKey(s, strength) {
      return gen.repeatKey?.(s, strength);
    }
    function filterAntiRepeat(kind, key, lines) {
      return antirepeat.filterLines?.(kind, key, lines, ctx.getAntiStrength?.(kind));
    }
    function normalizeLine(s) {
      return gen.normalizeLine?.(s);
    }
    function dedupeLines(lines) {
      return gen.dedupeLines?.(lines);
    }

    return {
      oneClickCleanup,
      refillCleanFill,
      cleanupKeyLines,
      pushRecent,
      repeatKey,
      filterAntiRepeat,
      normalizeLine,
      dedupeLines,
    };
  };
})(window);
