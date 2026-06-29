/**
 * GN min-mode substance and style contract tests (real engine).
 */
import test from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import Database from "better-sqlite3";
import { createGenerator } from "../server/generation.mjs";
import {
  passesMinSubstance,
  hasMorningSemantics,
  hasNightSemantics,
  RE_ANY_EMOJI,
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

function gnMin(gen, lang, style, handle) {
  return gen.generateUnique(handle, "gn", "min", lang, style, 0);
}

function coreNoEmoji(text) {
  return String(text || "")
    .replace(RE_ANY_EMOJI, " ")
    .replace(/[^\p{L}\p{N}\s']/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

test("EN min noemoji is not greeting-only", () => {
  const gen = makeGen();
  const line = gnMin(gen, "en", "noemoji", "@gnmin_en");
  assert.ok(passesMinSubstance(line, "gn", "en", "noemoji"), line);
  assert.notEqual(coreNoEmoji(line).toLowerCase(), "gn");
  assert.ok(!hasMorningSemantics(line), line);
});

test("EN min emoji is not GN plus emoji only", () => {
  const gen = makeGen();
  const line = gnMin(gen, "en", "emoji", "@gnmin_em");
  assert.ok(passesMinSubstance(line, "gn", "en", "emoji"), line);
  assert.ok(coreNoEmoji(line).split(/\s+/).filter(Boolean).length >= 2, line);
});

test("RU min contains substantive Cyrillic night text", () => {
  const gen = makeGen();
  const line = gnMin(gen, "ru", "classic", "@gnmin_ru");
  assert.ok(/[\u0400-\u04FF]{4,}/.test(line), line);
  assert.ok(passesMinSubstance(line, "gn", "ru", "classic"), line);
  assert.ok(hasNightSemantics(line) || /ноч|отдых|спокой/i.test(line), line);
});

test("TR min contains substantive Turkish night text", () => {
  const gen = makeGen();
  const line = gnMin(gen, "tr", "classic", "@gnmin_tr");
  assert.ok(/[çğıöşüÇĞİÖŞÜ]|gece|uyku|huzur|dinlen/i.test(line), line);
  assert.ok(passesMinSubstance(line, "gn", "tr", "classic"), line);
});

test("JA min contains meaningful Japanese script", () => {
  const gen = makeGen();
  const line = gnMin(gen, "ja", "classic", "@gnmin_ja");
  assert.ok(/[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]{4,}/u.test(line), line);
  assert.ok(passesMinSubstance(line, "gn", "ja", "classic"), line);
});

test("ZH min contains meaningful Chinese characters", () => {
  const gen = makeGen();
  const line = gnMin(gen, "zh", "classic", "@gnmin_zh");
  assert.ok(/[\p{Script=Han}]{4,}/u.test(line), line);
  assert.ok(passesMinSubstance(line, "gn", "zh", "classic"), line);
});

test("ten EN min generations are not all identical", () => {
  const gen = makeGen();
  const set = new Set();
  for (let i = 0; i < 10; i++) {
    set.add(gnMin(gen, "en", "classic", `@gnmin_dup_${i}`));
  }
  assert.ok(set.size >= 2);
});

test("GN min is shorter than GN mid", () => {
  const gen = makeGen();
  const minLen = gnMin(gen, "en", "classic", "@gnlen").length;
  const midLen = gen.generateUnique("@gnmid_len", "gn", "mid", "en", "classic", 0).length;
  assert.ok(minLen <= midLen);
});

test("GN min differs from GM min for same language", () => {
  const gen = makeGen();
  const gm = gen.generateUnique("@cmp_gm2", "gm", "min", "en", "classic", 0);
  const gn = gnMin(gen, "en", "classic", "@cmp_gn");
  assert.notEqual(gm, gn);
});

test("GN min does not contain morning vocabulary", () => {
  const gen = makeGen();
  for (const lang of ["en", "ru", "tr", "es", "de"]) {
    const line = gnMin(gen, lang, "classic", `@gnmor_${lang}`);
    assert.ok(!hasMorningSemantics(line), `${lang}: ${line}`);
  }
});
