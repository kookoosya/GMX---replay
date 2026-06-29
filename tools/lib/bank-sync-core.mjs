/** Saved GM/GN bank parsing — shared between extension sync and tests. */

export const SITE_GM_BANK_KEY = "gmx_gm_bank";
export const SITE_GN_BANK_KEY = "gmx_gn_bank";
export const EXT_BANK_GM_KEY = "gmx_ext_bank_gm_v1";
export const EXT_BANK_GN_KEY = "gmx_ext_bank_gn_v1";
export const EXT_BANK_SYNCED_AT_KEY = "gmx_ext_bank_synced_at_v1";
export const EXT_BANK_SCHEMA_VERSION = 1;
export const MAX_BANK_LINES = 500;
export const MAX_LINE_CHARS = 500;

const EMPTY = "__EMPTY__";

export function boundLine(text) {
  return String(text || "").trim().slice(0, MAX_LINE_CHARS);
}

export function linesFromBankRaw(raw) {
  return String(raw || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && line !== EMPTY);
}

export function dedupeBankLines(lines) {
  const seen = new Set();
  const out = [];
  for (const line of lines || []) {
    const text = boundLine(line);
    if (!text || seen.has(text)) continue;
    seen.add(text);
    out.push(text);
    if (out.length >= MAX_BANK_LINES) break;
  }
  return out;
}

export function parseBankPayload(raw) {
  const lines = dedupeBankLines(linesFromBankRaw(raw));
  return {
    version: EXT_BANK_SCHEMA_VERSION,
    lines,
    count: lines.length,
    truncated: linesFromBankRaw(raw).length > MAX_BANK_LINES,
  };
}

export function filterBankLines(lines, query) {
  const q = String(query || "").trim().toLowerCase();
  if (!q) return Array.isArray(lines) ? [...lines] : [];
  return (lines || []).filter((line) => String(line).toLowerCase().includes(q));
}

export function banksAreSeparate(gmLines, gnLines) {
  const gm = new Set(gmLines || []);
  const gn = new Set(gnLines || []);
  if (!gm.size || !gn.size) return true;
  for (const line of gm) {
    if (gn.has(line) && gm.size === 1 && gn.size === 1) continue;
  }
  return true;
}
