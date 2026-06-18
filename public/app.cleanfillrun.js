(function (window) {
  if (window.__GMXCleanFillRunCoreFactory) return;

  window.__GMXCleanFillRunCoreFactory = function createGMXCleanFillRunCore(ctx) {
    ctx = ctx || {};
    const $ = typeof ctx.$ === "function" ? ctx.$ : (id) => document.getElementById(id);
    const api = typeof ctx.api === "function" ? ctx.api : async () => ({});
    const escapeHtml = typeof ctx.escapeHtml === "function" ? ctx.escapeHtml : (s) => String(s || "");
    const getCleanFillStrength =
      typeof ctx.getCleanFillStrength === "function" ? ctx.getCleanFillStrength : () => 2;
    const readGenParams = typeof ctx.readGenParams === "function" ? ctx.readGenParams : () => ({});
    const activeKey = typeof ctx.activeKey === "function" ? ctx.activeKey : () => "";
    const readKey = typeof ctx.readKey === "function" ? ctx.readKey : () => [];
    const writeKey = typeof ctx.writeKey === "function" ? ctx.writeKey : () => {};
    const remainingSlots = typeof ctx.remainingSlots === "function" ? ctx.remainingSlots : () => Infinity;
    const normalizeLine = typeof ctx.normalizeLine === "function" ? ctx.normalizeLine : (s) => String(s || "").trim();
    const repeatKey = typeof ctx.repeatKey === "function" ? ctx.repeatKey : () => "";
    const dedupeLinesByShape =
      typeof ctx.dedupeLinesByShape === "function" ? ctx.dedupeLinesByShape : (lines) => lines;
    const yieldToUiFrame =
      typeof ctx.yieldToUiFrame === "function" ? ctx.yieldToUiFrame : async () => {};
    const pushRecent = typeof ctx.pushRecent === "function" ? ctx.pushRecent : () => {};
    const renderList = typeof ctx.renderList === "function" ? ctx.renderList : () => {};
    const getHandle = typeof ctx.getHandle === "function" ? ctx.getHandle : () => "";
    const tab = typeof ctx.tab === "function" ? ctx.tab : () => {};

    const inflight = { gm: false, gn: false };

    async function dedupeLinesByShapeAsync(lines, strength, yieldEvery) {
      const out = [];
      const seenExact = new Set();
      const seenShape = new Set();
      const step = Math.max(40, Number(yieldEvery) || 180);
      let scanned = 0;
      for (const raw of lines || []) {
        scanned++;
        const line = normalizeLine(raw);
        if (!line) {
          if (scanned % step === 0) await yieldToUiFrame();
          continue;
        }
        const exact = line.toLowerCase();
        if (seenExact.has(exact)) {
          if (scanned % step === 0) await yieldToUiFrame();
          continue;
        }
        const shape = repeatKey(line, Math.max(1, strength));
        if (shape && seenShape.has(shape)) {
          if (scanned % step === 0) await yieldToUiFrame();
          continue;
        }
        seenExact.add(exact);
        if (shape) seenShape.add(shape);
        out.push(line);
        if (scanned % step === 0) await yieldToUiFrame();
      }
      return out;
    }

    function cleanupKeyLines(lines) {
      return dedupeLinesByShape((lines || []).filter(Boolean), getCleanFillStrength());
    }

    async function refillCleanFill(kind, targetCount, opts) {
      const strength = getCleanFillStrength();
      const key = activeKey(kind);
      const { mode, lang, style, antiN } = readGenParams(kind);

      const before = readKey(key);
      const cleaned = await dedupeLinesByShapeAsync(before, strength, 200);
      const removed = Math.max(0, before.length - cleaned.length);
      let cur = cleaned.slice();
      writeKey(key, cur);
      await yieldToUiFrame();

      const remSlotsNow = remainingSlots(kind);
      let desiredTotal = Number.isFinite(targetCount) ? Math.max(0, Math.trunc(targetCount)) : before.length;
      if (remSlotsNow !== Infinity) {
        desiredTotal = Math.min(cur.length + remSlotsNow, desiredTotal);
      }
      desiredTotal = Math.max(cur.length, desiredTotal);

      const exactSeen = new Set(cur.map((s) => String(s || "").trim().toLowerCase()).filter(Boolean));
      const shapeSeen = new Set(cur.map((s) => repeatKey(s, strength)).filter(Boolean));
      const addedShapeKeys = [];
      let refilled = 0;
      let attempts = 0;
      let stalled = 0;
      const refillDeadline = Date.now() + 45000;
      while (cur.length < desiredTotal && attempts < 3) {
        if (Date.now() > refillDeadline) break;
        attempts++;
        const missing = desiredTotal - cur.length;
        const reqCount = Math.min(180, missing + 50 + stalled * 20);
        const bulk = await api(
          `/api/generate-bulk?kind=${kind}&mode=${encodeURIComponent(mode)}&lang=${encodeURIComponent(lang)}&style=${encodeURIComponent(style)}&anti_last_n=${encodeURIComponent(antiN)}&count=${reqCount}`,
          "GET",
          null,
          { signal: opts?.signal, timeoutMs: 12000 }
        );
        const list = Array.isArray(bulk?.list) ? bulk.list : [];
        if (!list.length) {
          stalled++;
          if (stalled >= 2) break;
          continue;
        }
        let progress = 0;
        let scannedBatch = 0;
        for (const raw of list) {
          scannedBatch++;
          const line = normalizeLine(raw);
          if (!line) continue;
          const exact = line.toLowerCase();
          if (exactSeen.has(exact)) continue;
          const shape = repeatKey(line, strength);
          if (shape && shapeSeen.has(shape)) continue;
          exactSeen.add(exact);
          if (shape) {
            shapeSeen.add(shape);
            addedShapeKeys.push(shape);
          }
          cur.push(line);
          refilled++;
          progress++;
          if (scannedBatch % 120 === 0) await yieldToUiFrame();
          if (cur.length >= desiredTotal) break;
        }
        if (progress <= 0) {
          stalled++;
          if (stalled >= 2) break;
          continue;
        }
        stalled = 0;
      }

      writeKey(key, cur);
      if (addedShapeKeys.length) pushRecent(kind, addedShapeKeys);
      return { removed, refilled, finalCount: cur.length, targetCount: desiredTotal };
    }

    async function oneClickCleanup(kind, opts) {
      const msgEl = kind === "gm" ? $("gmMsg") : $("gnMsg");
      if (!getHandle()) {
        tab("home");
        return { removed: 0, refilled: 0, finalCount: 0, targetCount: 0 };
      }
      if (inflight[kind]) return null;
      const key = activeKey(kind);
      const cur = readKey(key);
      const targetCount = Number.isFinite(opts?.targetCount)
        ? Math.max(0, Math.trunc(opts.targetCount))
        : cur.length;
      if (!cur.length && targetCount <= 0) {
        if (msgEl && !opts?.silent) {
          msgEl.innerHTML = '<span class="muted">Nothing saved yet.</span>';
        }
        return { removed: 0, refilled: 0, finalCount: 0, targetCount: 0 };
      }

      inflight[kind] = true;
      try {
        if (msgEl && !opts?.silent) {
          msgEl.innerHTML = '<span class="muted">Best pass...</span>';
        }
        const res = await refillCleanFill(kind, targetCount, opts || {});
        renderList(kind);
        if (msgEl && !opts?.keepMessage) {
          if (res.finalCount >= res.targetCount) {
            msgEl.innerHTML = `<span class="ok">Best pass removed ${res.removed} and refilled ${res.refilled}. Bank now has ${res.finalCount}/${res.targetCount}.</span>`;
          } else {
            msgEl.innerHTML = `<span class="warn">Best pass removed ${res.removed} and refilled ${res.refilled}. Bank finished at ${res.finalCount}/${res.targetCount}. Try another tone or preset for a wider pool.</span>`;
          }
        }
        return res;
      } catch (e) {
        const m = e && e.message ? e.message : "failed";
        if (msgEl && !opts?.keepMessage) {
          msgEl.innerHTML = `<span class="bad">${escapeHtml(m)}</span>`;
        }
        return { removed: 0, refilled: 0, finalCount: cur.length, targetCount };
      } finally {
        inflight[kind] = false;
      }
    }

    return {
      dedupeLinesByShapeAsync,
      cleanupKeyLines,
      refillCleanFill,
      oneClickCleanup,
    };
  };
})(window);

(function (window) {
  if (window.__GMXCleanFillRunFactory) return;

  window.__GMXCleanFillRunFactory = function createGMXCleanFillRun(ctx) {
    ctx = ctx || {};
    if (!(ctx.format || ctx.cleanfill || ctx.gen)) {
      return window.__GMXCleanFillRunCoreFactory(ctx);
    }
    const format = ctx.format || {};
    const cleanfill = ctx.cleanfill || {};
    const gen = ctx.gen || {};
    const antirepeat = ctx.antirepeat || {};
    const ui = ctx.ui || {};

    if (!window.__GMXCleanFillRunCoreFactory) throw new Error("GMX cleanfillrun core factory missing");
    const cfr = window.__GMXCleanFillRunCoreFactory({
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
