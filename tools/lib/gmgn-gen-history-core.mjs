/** Last N GM/GN batch runs — local device history for copy-again UX. */

export const GEN_BATCH_HISTORY_KEY = "gmx_gen_batch_history_v1";
export const GEN_BATCH_HISTORY_MAX = 5;

function readStore(lsGet) {
  try {
    const raw = lsGet(GEN_BATCH_HISTORY_KEY, "{}");
    const j = typeof raw === "string" ? JSON.parse(raw) : raw;
    return j && typeof j === "object" ? j : {};
  } catch {
    return {};
  }
}

export function readBatchHistory(kind, lsGet) {
  const store = readStore(lsGet);
  const arr = Array.isArray(store[kind]) ? store[kind] : [];
  return arr.slice(0, GEN_BATCH_HISTORY_MAX);
}

export function pushBatchHistory(kind, entry, lsGet, lsSet) {
  const lines = Array.isArray(entry?.lines)
    ? entry.lines.map((s) => String(s || "").trim()).filter(Boolean)
    : [];
  if (!lines.length) return readBatchHistory(kind, lsGet);

  const store = readStore(lsGet);
  const prev = Array.isArray(store[kind]) ? store[kind] : [];
  const batch = {
    id: String(entry?.id || Date.now()),
    at: entry?.at || new Date().toISOString(),
    count: Math.max(1, Number(entry?.count) || lines.length),
    lines: lines.slice(0, 50),
    meta: entry?.meta && typeof entry.meta === "object" ? entry.meta : {},
  };
  store[kind] = [batch, ...prev].slice(0, GEN_BATCH_HISTORY_MAX);
  lsSet(GEN_BATCH_HISTORY_KEY, JSON.stringify(store));
  return store[kind];
}

export function formatBatchWhen(iso) {
  const d = new Date(iso || "");
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString();
}
