/**
 * GM vs GN semantic separation (real engine).
 */
import test from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import Database from "better-sqlite3";
import { createGenerator } from "../server/generation.mjs";
import { SUPPORTED_REPLY_LANGS } from "../server/generation-lang.mjs";
import { getLocalizedBank } from "../server/generation-lang-banks.mjs";
import {
  hasMorningSemantics,
  hasNightSemantics,
  passesGnSemantics,
  passesMinSubstance,
} from "../server/generation-min-substance.mjs";

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

const MATRIX = [
  { lang: "en", style: "classic" },
  { lang: "ru", style: "classic" },
  { lang: "tr", style: "cheer" },
  { lang: "es", style: "noemoji" },
  { lang: "ja", style: "classic" },
];

for (const { lang, style } of MATRIX) {
  test(`semantic ${lang}/${style}: GM morning, GN night, outputs differ`, () => {
    const gen = makeGen();
    const handle = `@sem_${lang}`;
    const gm = gen.generateUnique(handle, "gm", "mid", lang, style, 0);
    const gn = gen.generateUnique(`${handle}_n`, "gn", "mid", lang, style, 0);
    assert.ok(gm.trim(), "empty gm");
    assert.ok(gn.trim(), "empty gn");
    assert.notEqual(gm, gn);
    assert.ok(!passesGnSemantics(gm, lang), `GM looks like GN: ${gm}`);
    assert.ok(passesGnSemantics(gn, lang), `GN failed night contract: ${gn}`);
    assert.ok(!hasMorningSemantics(gn), `GN has morning: ${gn}`);
    assert.ok(!/\bgm\b/i.test(gn) || hasNightSemantics(gn), `GN has bare GM: ${gn}`);
  });
}

test("template banks: GM and GN greets differ for all 15 languages", () => {
  for (const lang of SUPPORTED_REPLY_LANGS) {
    const gm = getLocalizedBank(lang, "gm", "ordinary");
    const gn = getLocalizedBank(lang, "gn", "ordinary");
    assert.notDeepEqual(gm.greet, gn.greet, lang);
    assert.notDeepEqual(gm.mid, gn.mid, lang);
  }
});

test("GN mid does not equal GM mid with greet swap only", () => {
  const gen = makeGen();
  for (const lang of ["en", "ru", "tr", "de", "es"]) {
    const gm = gen.generateUnique(`@gmx_${lang}`, "gm", "mid", lang, "classic", 0);
    const gn = gen.generateUnique(`@gnx_${lang}`, "gn", "mid", lang, "classic", 0);
    const swapped = gm.replace(/\b(Gm|GM|Good morning|Morning)\b/gi, "Gn").replace(/☀️|🌅|☕/g, "🌙");
    assert.notEqual(gn, swapped, `${lang}: GN looks like swapped GM`);
  }
});

test("GM history kind does not mix with GN generation", () => {
  const gen = makeGen();
  const h = "@hist_mix";
  gen.generateUnique(h, "gm", "mid", "en", "classic", 0);
  gen.generateUnique(h, "gm", "mid", "en", "classic", 0);
  const gn = gen.generateUnique(h, "gn", "mid", "en", "classic", 0);
  assert.ok(passesGnSemantics(gn, "en"), gn);
});

test("GN min passes substance and night semantics", () => {
  const gen = makeGen();
  for (const lang of ["en", "ru", "tr", "ja", "zh"]) {
    const line = gen.generateUnique(`@gnmin_${lang}`, "gn", "min", lang, "classic", 0);
    assert.ok(passesMinSubstance(line, "gn", lang, "classic"), line);
    assert.ok(!hasMorningSemantics(line), line);
    assert.ok(passesGnSemantics(line, lang), line);
  }
});
