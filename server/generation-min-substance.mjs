/**
 * Language-aware min-mode substance checks for GM output.
 */
import { LANG_PACKS } from "./generation-lang-banks.mjs";
import { normLang } from "./generation-lang.mjs";

export const RE_ANY_EMOJI = /\p{Extended_Pictographic}/u;

const GN_MARKERS =
  /\b(good night|sleep well|rest easy|спокойной|iyi geceler|buenas noches|bonne nuit|gute nacht|buonanotte|goedenacht|dobranoc|selamat malam|शुभ रात्रि|おやすみ|晚安|лёгкой ночи|спокойной ночи)\b/i;

function normalizeBare(token) {
  return String(token || "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]/gu, "");
}

function greetBareSet(lang, kind) {
  const pack = LANG_PACKS[lang];
  const greets = pack?.[kind]?.greet;
  const set = new Set(["gm", "gn"]);
  if (Array.isArray(greets)) {
    for (const g of greets) set.add(normalizeBare(g));
  }
  return set;
}

function coreText(text) {
  return String(text || "")
    .replace(RE_ANY_EMOJI, " ")
    .replace(/[^\p{L}\p{N}\s']/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function isThinMinTemplate(template) {
  const t = String(template || "").trim();
  if (!t) return true;
  if (/^\{greet\}!\s*\{emoji\}$/.test(t)) return true;
  if (/^\{greet\}\s*\{voc\}\s*\{emoji\}$/.test(t)) return true;
  if (/^\{greet\},\s*\{voc\}\s*\{emoji\}$/.test(t)) return true;
  return false;
}

export function filterSubstantiveMinTemplates(templates) {
  const list = (Array.isArray(templates) ? templates : []).filter((t) => t && !isThinMinTemplate(t));
  return list.length ? list : templates;
}

/**
 * GM min output must be more than greeting + emoji (or greeting-only).
 */
export function passesMinSubstance(text, kind, lang, style) {
  if (String(kind || "").toLowerCase() !== "gm") return true;
  const code = normLang(lang) || "en";
  const t = String(text || "").trim();
  if (!t) return false;
  if (String(style || "").toLowerCase() === "noemoji" && RE_ANY_EMOJI.test(t)) return false;

  const core = coreText(t);
  if (!core) return false;
  if (GN_MARKERS.test(core)) return false;

  if (code === "ja" || code === "zh") {
    const meaningful = (core.match(/[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]/gu) || []).length;
    return meaningful >= 4;
  }

  if (code === "hi") {
    return (core.match(/[\u0900-\u097F]/g) || []).length >= 6;
  }

  const greets = greetBareSet(code, kind);
  const tokens = core.split(/\s+/).filter(Boolean);
  const nonGreet = tokens.filter((tok) => !greets.has(normalizeBare(tok)));
  if (nonGreet.length === 0) return false;

  const bareCore = normalizeBare(core);
  if (bareCore === "gm" || bareCore === "gn") return false;

  return true;
}
