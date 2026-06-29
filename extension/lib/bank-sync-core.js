(function (global) {
  if (global.GMXBankSyncCore) return;

  const SITE_GM_BANK_KEY = "gmx_gm_bank";
  const SITE_GN_BANK_KEY = "gmx_gn_bank";
  const EXT_BANK_GM_KEY = "gmx_ext_bank_gm_v1";
  const EXT_BANK_GN_KEY = "gmx_ext_bank_gn_v1";
  const EXT_BANK_SYNCED_AT_KEY = "gmx_ext_bank_synced_at_v1";
  const EXT_BANK_SCHEMA_VERSION = 1;
  const EMPTY = "__EMPTY__";

  function linesFromBankRaw(raw) {
    return String(raw || "")
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && line !== EMPTY);
  }

  function dedupeBankLines(lines) {
    const seen = new Set();
    const out = [];
    for (const line of lines || []) {
      const text = String(line || "").trim();
      if (!text || seen.has(text)) continue;
      seen.add(text);
      out.push(text);
    }
    return out;
  }

  function parseBankPayload(raw) {
    const lines = dedupeBankLines(linesFromBankRaw(raw));
    return { version: EXT_BANK_SCHEMA_VERSION, lines, count: lines.length };
  }

  function filterBankLines(lines, query) {
    const q = String(query || "").trim().toLowerCase();
    if (!q) return Array.isArray(lines) ? [...lines] : [];
    return (lines || []).filter((line) => String(line).toLowerCase().includes(q));
  }

  global.GMXBankSyncCore = {
    SITE_GM_BANK_KEY,
    SITE_GN_BANK_KEY,
    EXT_BANK_GM_KEY,
    EXT_BANK_GN_KEY,
    EXT_BANK_SYNCED_AT_KEY,
    EXT_BANK_SCHEMA_VERSION,
    linesFromBankRaw,
    dedupeBankLines,
    parseBankPayload,
    filterBankLines,
  };
})(typeof globalThis !== "undefined" ? globalThis : window);
