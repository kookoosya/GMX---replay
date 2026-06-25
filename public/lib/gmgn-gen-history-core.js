(function (global) {
  if (global.GMXGmGnGenHistoryCore) return;

  const GEN_BATCH_HISTORY_KEY = "gmx_gen_batch_history_v1";
  const GEN_BATCH_HISTORY_MAX = 5;

  function readStore(lsGet) {
    try {
      const raw = lsGet(GEN_BATCH_HISTORY_KEY, "{}");
      const j = typeof raw === "string" ? JSON.parse(raw) : raw;
      return j && typeof j === "object" ? j : {};
    } catch (_e) {
      return {};
    }
  }

  function readBatchHistory(kind, lsGet) {
    const store = readStore(lsGet);
    const arr = Array.isArray(store[kind]) ? store[kind] : [];
    return arr.slice(0, GEN_BATCH_HISTORY_MAX);
  }

  function pushBatchHistory(kind, entry, lsGet, lsSet) {
    const lines = Array.isArray(entry && entry.lines)
      ? entry.lines.map(function (s) {
          return String(s || "").trim();
        }).filter(Boolean)
      : [];
    if (!lines.length) return readBatchHistory(kind, lsGet);

    const store = readStore(lsGet);
    const prev = Array.isArray(store[kind]) ? store[kind] : [];
    const batch = {
      id: String((entry && entry.id) || Date.now()),
      at: (entry && entry.at) || new Date().toISOString(),
      count: Math.max(1, Number((entry && entry.count) || lines.length)),
      lines: lines.slice(0, 50),
      meta: entry && entry.meta && typeof entry.meta === "object" ? entry.meta : {},
    };
    store[kind] = [batch].concat(prev).slice(0, GEN_BATCH_HISTORY_MAX);
    lsSet(GEN_BATCH_HISTORY_KEY, JSON.stringify(store));
    return store[kind];
  }

  function formatBatchWhen(iso) {
    const d = new Date(iso || "");
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleString();
  }

  global.GMXGmGnGenHistoryCore = {
    GEN_BATCH_HISTORY_KEY: GEN_BATCH_HISTORY_KEY,
    GEN_BATCH_HISTORY_MAX: GEN_BATCH_HISTORY_MAX,
    readBatchHistory: readBatchHistory,
    pushBatchHistory: pushBatchHistory,
    formatBatchWhen: formatBatchWhen,
  };
})(typeof globalThis !== "undefined" ? globalThis : window);
