import { SUPPORTED_REPLY_LANGS, getLocalizedBank } from "./generation-lang-banks.mjs";

export { SUPPORTED_REPLY_LANGS, getLocalizedBank };

/** Canonical default when lang query is missing or empty. */
export const DEFAULT_REPLY_LANG = "en";

/**
 * @returns {string|null} Supported code, default "en" when empty, null when explicitly invalid.
 */
export function normLang(input) {
  const raw = String(input ?? "").trim().toLowerCase();
  if (!raw) return DEFAULT_REPLY_LANG;
  return SUPPORTED_REPLY_LANGS.includes(raw) ? raw : null;
}

export function isSupportedReplyLang(code) {
  return SUPPORTED_REPLY_LANGS.includes(String(code || "").trim().toLowerCase());
}
