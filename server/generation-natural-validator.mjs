/**
 * Structural naturalness gate for GM/GN generation output.
 */
import { RE_ANY_EMOJI, hasMorningSemantics, hasNightSemantics } from "./generation-min-substance.mjs";
import { normLang } from "./generation-lang.mjs";

const SCREENSHOT_REJECTS = [
  "morning light start",
  "good morning good thread",
  "morning coffee first",
  "morning morning reset",
  "morning easy start",
  "gm homie quick gm",
  "morning good looks",
  "grand rising easy start",
  "morning bro back at",
  "gm here for it",
];

const FRAGMENT_TAIL =
  /\b(light start|easy start|good thread|coffee first|morning reset|good looks|quick gm|here for it|back at it|rise easy|clean read|nice gm|good one|steady start|smooth start)\b/i;

const HYPE_GREET =
  /\b(big\s+gm|grand\s+rising|g\s+to\s+the\s+m)\b/i;

function coreText(text) {
  return String(text || "")
    .replace(RE_ANY_EMOJI, " ")
    .replace(/[^\p{L}\p{N}\s',.!?]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizedSkeleton(text) {
  return coreText(text)
    .toLowerCase()
    .replace(/\b(gm|good morning|morning)\b/g, "gm")
    .replace(/\b(gn|good night|night)\b/g, "gn")
    .replace(/\b(bro|homie|friend|degen)\b/g, "@v")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function hasAdjacentDuplicateWords(text) {
  const words = coreText(text)
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);
  for (let i = 1; i < words.length; i++) {
    if (words[i] === words[i - 1]) return true;
  }
  return false;
}

function hasDoubleGreeting(text, kind) {
  const core = coreText(text).toLowerCase();
  if (kind === "gm") {
    if (/\bmorning\s+morning\b/.test(core)) return true;
    if (/\bgm\b.*\bgm\b/.test(core)) return true;
    if (/\bbig\s+gm\b.*\bgm\b/.test(core)) return true;
    if (/^(good morning|morning|gm)\b[,]?\s+.*\b(good morning|gm)\b/.test(core)) return true;
  }
  if (kind === "gn") {
    if (/\bnight\s+night\b/.test(core)) return true;
    if (/\bgn\b.*\bgn\b/.test(core)) return true;
    if (/^(good night|night|gn)\b[,]?\s+.*\b(good night|gn)\b/.test(core)) return true;
  }
  return false;
}

function endsAbruptly(text) {
  const core = coreText(text).toLowerCase();
  return /\b(at|for|to|the|a|an|and|or|but|with|on|in|of|back)\s*$/i.test(core);
}

export function isKnownBadScreenshotLine(text) {
  const raw = coreText(text).toLowerCase();
  if (SCREENSHOT_REJECTS.some((bad) => raw === bad || raw.includes(bad))) return true;
  const n = normalizedSkeleton(text);
  return SCREENSHOT_REJECTS.some((bad) => n === bad || n.includes(bad));
}

export function passesNaturalQuality(text, kind, mode, lang = "en") {
  const k = String(kind || "").toLowerCase();
  const m = String(mode || "mid").toLowerCase();
  const code = normLang(lang) || "en";
  const t = String(text || "").trim();
  if (!t) return false;
  if (/undefined|null|```|\{|\}|#/.test(t)) return false;
  if (isKnownBadScreenshotLine(t)) return false;

  const core = coreText(t);
  if (!core) return false;
  if (hasAdjacentDuplicateWords(t)) return false;
  if (hasDoubleGreeting(t, k)) return false;
  if (m === "min" && endsAbruptly(t)) return false;

  if (k === "gm" && hasNightSemantics(t) && !/\bbetter morning tomorrow\b/i.test(core)) return false;
  if (k === "gn" && hasMorningSemantics(t)) return false;

  if (m === "min" && HYPE_GREET.test(core)) return false;

  if (code === "en" && m === "min") {
    if (FRAGMENT_TAIL.test(core) && !/,\s/.test(t.replace(RE_ANY_EMOJI, ""))) return false;
    const words = core.split(/\s+/).filter(Boolean);
    if (words.length < 3) return false;
    if (/^(morning|night|gm|gn)\s+(light|easy|good|coffee|morning|quick|here)\b/i.test(core)) return false;
  }

  return true;
}

export { SCREENSHOT_REJECTS, normalizedSkeleton };
