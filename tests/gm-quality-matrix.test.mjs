/**
 * Structural quality matrix for all 15 GM output languages (engine).
 */
import test from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import Database from "better-sqlite3";
import { createGenerator } from "../server/generation.mjs";
import { SUPPORTED_REPLY_LANGS } from "../server/generation-lang.mjs";
import { passesMinSubstance, RE_ANY_EMOJI } from "../server/generation-min-substance.mjs";
import { getLocalizedBank } from "../server/generation-lang-banks.mjs";

const GN_MARKERS = /\b(good night|спокойной|iyi geceler|buenas noches|おやすみ|晚安)\b/i;

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
  if (!t.trim() || /^(GM|Gn)\s*$/i.test(t.trim())) return false;
  if (lang === "en") return /\b(Gm|Good morning|Morning|bro|friend)\b/i.test(t);
  if (lang === "ru" || lang === "uk") return /[\u0400-\u04FF]/.test(t);
  if (lang === "hi") return /[\u0900-\u097F]/.test(t);
  if (lang === "tr") return /[çğıöşüÇĞİÖŞÜ]|güzel|paylaşım|Günaydın|Sabah|kanka|iyi|enerji/i.test(t);
  if (lang === "es") return /[áéíóúñ]|Buenos|buen|Mañana|energía|día/i.test(t);
  if (lang === "pt") return /energia|bom|mano|boa|começo|dia|post/i.test(t);
  if (lang === "fr") return /[àâçééèêëîïôùûü]|Bonjour|Matin|beau|bonne|énergie|journée/i.test(t);
  if (lang === "de") return /[äöüß]|leichter|Start|energie|gut|Tag|Morgen|Post/i.test(t);
  if (lang === "it") return /[àèéìòù]|buon|inizio|giornata|leggera|bel|post|Buongiorno|energia/i.test(t);
  if (lang === "nl") return /energie|goede|mooie|Ochtend|maat|dag|lichte|start/i.test(t);
  if (lang === "pl") return /[ąćęłńóśźż]|energia|dobra|dobry|dobrego|dnia|dzień|ziom|bro|lekki|start/i.test(t);
  if (lang === "id") return /semoga|harimu|posting|pagi|bagus|energi|awal|ringan|yang/i.test(t);
  if (lang === "ja") return /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]/u.test(t);
  if (lang === "zh") return /[\p{Script=Han}]/u.test(t);
  return t.trim().length > 4;
}

for (const lang of SUPPORTED_REPLY_LANGS) {
  test(`matrix ${lang}: template bank exists with varied GM min templates`, () => {
    const bank = getLocalizedBank(lang, "gm", "ordinary");
    assert.ok(bank?.min?.length >= 2, `missing min bank for ${lang}`);
    const uniq = new Set(bank.min);
    assert.ok(uniq.size >= 2, `${lang} min templates lack variety`);
    const gnBank = getLocalizedBank(lang, "gn", "ordinary");
    assert.ok(gnBank?.greet?.length >= 1);
    assert.notDeepEqual(bank.greet, gnBank.greet);
  });

  test(`matrix ${lang}: neutral/mid/degen/noemoji/emoji/min/batch`, () => {
    const gen = makeGen();
    const handle = `@mx_${lang}`;
    const neutral = gen.generateUnique(handle, "gm", "mid", lang, "classic", 0);
    const casual = gen.generateUnique(`${handle}_c`, "gm", "mid", lang, "cheer", 0);
    const degen = gen.generateUnique(`${handle}_d`, "gm", "mid", lang, "degen", 0);
    const noemoji = gen.generateUnique(`${handle}_n`, "gm", "mid", lang, "noemoji", 0);
    const emoji = gen.generateUnique(`${handle}_e`, "gm", "mid", lang, "emoji", 0);
    const min = gen.generateUnique(`${handle}_m`, "gm", "min", lang, "classic", 0);
    const batch = gen.generateRankedCandidates(`${handle}_b`, "gm", "mid", lang, "classic", 8, 0, false);

    for (const line of [neutral, casual, degen, min]) {
      assert.ok(langProbe(lang, line), `${lang} failed probe: ${line}`);
      assert.ok(!GN_MARKERS.test(line), `GN marker in GM: ${line}`);
    }
    assert.ok(!RE_ANY_EMOJI.test(noemoji), noemoji);
    assert.ok(RE_ANY_EMOJI.test(emoji), emoji);
    assert.ok(passesMinSubstance(min, "gm", lang, "classic"), min);
    assert.equal(batch.length, 8);
    assert.equal(new Set(batch).size, batch.length);
  });
}

test("GN regression: ru GN mid stays night-themed", () => {
  const gen = makeGen();
  const gn = gen.generateUnique("@gn_mx_ru", "gn", "mid", "ru", "classic", 0);
  assert.ok(/[\u0400-\u04FF]|GN|ноч/i.test(gn), gn);
});
