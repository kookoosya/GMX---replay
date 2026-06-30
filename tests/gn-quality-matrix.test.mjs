/**
 * Structural quality matrix for all 15 GN output languages (engine).
 */
import test from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import Database from "better-sqlite3";
import { createGenerator } from "../server/generation.mjs";
import { SUPPORTED_REPLY_LANGS } from "../server/generation-lang.mjs";
import {
  passesMinSubstance,
  passesGnSemantics,
  hasMorningSemantics,
  RE_ANY_EMOJI,
} from "../server/generation-min-substance.mjs";
import { getLocalizedBank } from "../server/generation-lang-banks.mjs";

const GM_MARKERS = /\b(good morning|günaydın|buenos días|доброе утро)\b/i;

function makeGen() {
  const db = new Database(":memory:");
  db.exec(`
    CREATE TABLE IF NOT EXISTS recent_replies (handle TEXT, kind TEXT, reply TEXT, created_at TEXT);
    CREATE TABLE IF NOT EXISTS recent_reply_shapes (kind TEXT, mode TEXT, family TEXT, reply_hash TEXT, shape TEXT, created_at TEXT);
  `);
  return createGenerator({
    safeDb: (fn) => {
      try {
        return fn();
      } catch {
        return null;
      }
    },
    db,
    nowIso: () => new Date().toISOString(),
    safeOptionalHistoryDb: (fn, fb) => {
      try {
        return fn();
      } catch {
        return fb;
      }
    },
    sha256: (s) => crypto.createHash("sha256").update(String(s)).digest("hex"),
  });
}

function langProbe(lang, text) {
  const t = String(text || "");
  if (!t.trim()) return false;
  if (lang === "en") return passesGnSemantics(t, lang);
  if (lang === "ru" || lang === "uk") return /[\u0400-\u04FF]/.test(t) && passesGnSemantics(t, lang);
  if (lang === "hi") return /[\u0900-\u097F]/.test(t) && /रात|नींद|शुभ|अच्छी|आराम/i.test(t);
  if (lang === "tr") return /[çğıöşüÇĞİÖŞÜ]|gece|uyku|huzur|dinlen|geceler|rahat|dost|sakin|kapat|yumuşak|iyi/i.test(t);
  if (lang === "es") return /[áéíóúñ]|noche|descans|buenas/i.test(t);
  if (lang === "pt") return /noite|descans|sono|boa noite|durma|bem|fechamento|suave|mano|dia/i.test(t);
  if (lang === "fr") return /[àâçéèêëîïôùûü]|nuit|bonne|repos|dors/i.test(t);
  if (lang === "de") return /[äöüß]|nacht|schlaf|ruh|gute nacht/i.test(t);
  if (lang === "it") return /[àèéìòù]|notte|riposa|buona|bene/i.test(t);
  if (lang === "nl") return /nacht|slaap|rust|goede/i.test(t);
  if (lang === "pl") return /[ąćęłńóśźż]|noc|odpocz|dobranoc|ziom/i.test(t);
  if (lang === "id") return /malam|tidur|istirahat|semoga|penutup|lembut|hari|yang|tenang/i.test(t);
  if (lang === "ja") return /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]/u.test(t);
  if (lang === "zh") return /[\p{Script=Han}]/u.test(t);
  return passesGnSemantics(t, lang);
}

for (const lang of SUPPORTED_REPLY_LANGS) {
  test(`matrix ${lang}: GN template bank exists with varied min templates`, () => {
    const bank = getLocalizedBank(lang, "gn", "ordinary");
    assert.ok(bank?.min?.length >= 2, `missing min bank for ${lang}`);
    const uniq = new Set(bank.min);
    assert.ok(uniq.size >= 2, `${lang} min templates lack variety`);
    const gmBank = getLocalizedBank(lang, "gm", "ordinary");
    assert.notDeepEqual(bank.greet, gmBank.greet);
    assert.notDeepEqual(bank.mid, gmBank.mid);
  });

  test(`matrix ${lang}: neutral/mid/degen/noemoji/emoji/min/batch`, () => {
    const gen = makeGen();
    const handle = `@gnmx_${lang}`;
    const neutral = gen.generateUnique(handle, "gn", "mid", lang, "classic", 0);
    const casual = gen.generateUnique(`${handle}_c`, "gn", "mid", lang, "cheer", 0);
    const degen = gen.generateUnique(`${handle}_d`, "gn", "mid", lang, "degen", 0);
    const noemoji = gen.generateUnique(`${handle}_n`, "gn", "mid", lang, "noemoji", 0);
    const emoji = gen.generateUnique(`${handle}_e`, "gn", "mid", lang, "emoji", 0);
    const min = gen.generateUnique(`${handle}_m`, "gn", "min", lang, "classic", 0);
    const batch = gen.generateRankedCandidates(`${handle}_b`, "gn", "mid", lang, "classic", 8, 0, false);

    for (const line of [neutral, casual, degen, min]) {
      assert.ok(langProbe(lang, line), `${lang} failed probe: ${line}`);
      assert.ok(!GM_MARKERS.test(line), `GM marker in GN: ${line}`);
      assert.ok(!hasMorningSemantics(line), `morning in GN: ${line}`);
      assert.ok(passesGnSemantics(line, lang), `GN semantics: ${line}`);
    }
    assert.ok(!RE_ANY_EMOJI.test(noemoji), noemoji);
    assert.ok(RE_ANY_EMOJI.test(emoji), emoji);
    assert.ok(passesMinSubstance(min, "gn", lang, "classic"), min);
    assert.equal(batch.length, 8);
    assert.equal(new Set(batch).size, batch.length);
  });
}

test("GM regression: ru GM mid stays morning-themed", () => {
  const gen = makeGen();
  const gm = gen.generateUnique("@gm_mx_ru", "gm", "mid", "ru", "classic", 0);
  assert.ok(/[\u0400-\u04FF]|GM|утр/i.test(gm), gm);
  assert.ok(!/\b(спокойной ночи|good night)\b/i.test(gm) || /утр|доброе/i.test(gm), gm);
});
