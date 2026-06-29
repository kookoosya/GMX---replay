/**
 * Language-aware min-mode substance and GM/GN semantic checks.
 */
import { LANG_PACKS } from "./generation-lang-banks.mjs";
import { normLang } from "./generation-lang.mjs";

export const RE_ANY_EMOJI = /\p{Extended_Pictographic}/u;

export const GN_MARKERS =
  /\b(good night|sleep well|rest easy|спокойной|iyi geceler|buenas noches|bonne nuit|gute nacht|buonanotte|goedenacht|dobranoc|selamat malam|शुभ रात्रि|おやすみ|晚安|лёгкой ночи|спокойной ночи|спокойной|iyi uykular|que descanses|dormi bien|slaap lekker|dobranoc|selamat tidur)\b/i;

export const GM_MARKERS =
  /\b(good morning|morning energy|productive day|start the day|start easy|solid start|great morning|coffee first|sunrise|günaydın|buenos días|доброе утро|доброго ранку|bonjour|guten morgen|buongiorno|goedemorgen|dzień dobry|selamat pagi|सुप्रभात|おはよう|早上好|утренн|sabah|mañana|morgen|matin|manhã|mattina|ochtend|poranek|pagi)\b/i;

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

export function hasMorningSemantics(text) {
  const core = coreText(text);
  if (!core) return false;
  if (/\b(better morning tomorrow|fresh in the morning|wait till morning|charts wait till morning)\b/i.test(core)) {
    return false;
  }
  if (GM_MARKERS.test(core)) return true;
  if (/\b(gm|good morning|morning)\b/i.test(core) && !/\b(gn|good night)\b/i.test(core)) return true;
  if (/おはよう|朝[、\s]|良い一日|早上好|早安/.test(core)) return true;
  return false;
}

export function hasNightSemantics(text) {
  const core = coreText(text);
  if (!core) return false;
  if (GN_MARKERS.test(core)) return true;
  if (/\b(gn|good night|night|sleep|rest|tonight)\b/i.test(core)) return true;
  if (/[\u0400-\u04FF]/.test(core) && /ноч|отдых|спокойн|высп/i.test(core)) return true;
  if (/[çğıöşüÇĞİÖŞÜ]/.test(core) && /gece|uyku|huzur|dinlen|rahat/i.test(core)) return true;
  if (/[áéíóúñ]/.test(core) && /noche|descans|dormi|buenas/i.test(core)) return true;
  if (/おやすみ|ゆっくり|休んで|夜|休息|良い/.test(core)) return true;
  if (/晚安|夜|休息|安稳|好梦/.test(core)) return true;
  if (/[\u0900-\u097F]/.test(core) && /रात्रि|रात|नींद|शुभ|अच्छी|आराम/.test(core)) return true;
  if (/\b(riposa|notte|repos|nuit|nacht|noc|odpocz|durma|istirahat|tidur|malam)\b/i.test(core)) return true;
  return false;
}

export function passesGnSemantics(text, lang) {
  const code = normLang(lang) || "en";
  const t = String(text || "").trim();
  if (!t) return false;
  if (hasMorningSemantics(t)) return false;
  const core = coreText(t);
  if (/\bgm\b/i.test(core) && !hasNightSemantics(t)) return false;
  if (code === "ja" || code === "zh") {
    return /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]/u.test(t) && hasNightSemantics(t);
  }
  if (code === "hi") {
    return /[\u0900-\u097F]/.test(t) && /रात|नींद|शुभ|आराम|अच्छी/.test(t);
  }
  if (code === "ru" || code === "uk") {
    return /[\u0400-\u04FF]/.test(t) && hasNightSemantics(t);
  }
  return hasNightSemantics(t);
}

function substantiveBeyondGreet(core, code, kind) {
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

/**
 * Min output must be more than greeting + emoji (or greeting-only).
 */
export function passesMinSubstance(text, kind, lang, style) {
  const k = String(kind || "").toLowerCase();
  if (k !== "gm" && k !== "gn") return true;
  const code = normLang(lang) || "en";
  const t = String(text || "").trim();
  if (!t) return false;
  if (String(style || "").toLowerCase() === "noemoji" && RE_ANY_EMOJI.test(t)) return false;

  const core = coreText(t);
  if (!core) return false;

  if (k === "gm") {
    if (GN_MARKERS.test(core)) return false;
    return substantiveBeyondGreet(core, code, kind);
  }

  if (hasMorningSemantics(t)) return false;
  if (/\bgm\b/i.test(core) && !hasNightSemantics(t)) return false;
  if (!substantiveBeyondGreet(core, code, kind)) return false;
  return hasNightSemantics(t) || core.split(/\s+/).filter(Boolean).length >= 3;
}
