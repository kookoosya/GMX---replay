/**
 * GM min-mode substance and style contract tests (real engine).
 */
import test from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import Database from "better-sqlite3";
import { createGenerator } from "../server/generation.mjs";
import { passesMinSubstance, RE_ANY_EMOJI } from "../server/generation-min-substance.mjs";

function makeGen() {
  const db = new Database(":memory:");
  db.exec(`
    CREATE TABLE IF NOT EXISTS recent_replies (handle TEXT, kind TEXT, reply TEXT, created_at TEXT);
    CREATE TABLE IF NOT EXISTS recent_reply_shapes (kind TEXT, mode TEXT, family TEXT, reply_hash TEXT, shape TEXT, created_at TEXT);
  `);
  const safeDb = (fn) => {
    try {
      return fn();
    } catch {
      return null;
    }
  };
  return createGenerator({
    safeDb,
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

function coreNoEmoji(text) {
  return String(text || "")
    .replace(RE_ANY_EMOJI, " ")
    .replace(/[^\p{L}\p{N}\s']/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function gmMin(gen, lang, style, handle) {
  return gen.generateUnique(handle, "gm", "min", lang, style, 0);
}

test("EN min noemoji is not greeting-only", () => {
  const gen = makeGen();
  const line = gmMin(gen, "en", "noemoji", "@min_en_ne");
  assert.ok(passesMinSubstance(line, "gm", "en", "noemoji"), line);
  const core = coreNoEmoji(line);
  assert.notEqual(core.toLowerCase(), "gm");
  assert.notEqual(core.toLowerCase(), "good morning");
});

test("EN min emoji is not GM plus emoji only", () => {
  const gen = makeGen();
  const line = gmMin(gen, "en", "emoji", "@min_en_em");
  assert.ok(passesMinSubstance(line, "gm", "en", "emoji"), line);
  const core = coreNoEmoji(line);
  assert.ok(core.split(/\s+/).filter(Boolean).length >= 2, core);
});

test("RU min contains substantive Cyrillic", () => {
  const gen = makeGen();
  const line = gmMin(gen, "ru", "classic", "@min_ru");
  assert.ok(/[\u0400-\u04FF]{4,}/.test(line), line);
  assert.ok(passesMinSubstance(line, "gm", "ru", "classic"), line);
});

test("TR min contains substantive Turkish text", () => {
  const gen = makeGen();
  const line = gmMin(gen, "tr", "classic", "@min_tr");
  assert.ok(/[çğıöşüÇĞİÖŞÜ]|\b(güzel|paylaşım|sabah|gün|kanka|iyi)\b/i.test(line), line);
  assert.ok(passesMinSubstance(line, "gm", "tr", "classic"), line);
});

test("JA min contains meaningful Japanese script", () => {
  const gen = makeGen();
  const line = gmMin(gen, "ja", "classic", "@min_ja");
  assert.ok(/[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]{4,}/u.test(line), line);
  assert.ok(passesMinSubstance(line, "gm", "ja", "classic"), line);
});

test("ZH min contains meaningful Chinese characters", () => {
  const gen = makeGen();
  const line = gmMin(gen, "zh", "classic", "@min_zh");
  assert.ok(/[\p{Script=Han}]{4,}/u.test(line), line);
  assert.ok(passesMinSubstance(line, "gm", "zh", "classic"), line);
});

test("min preserves degen style vs classic for EN", () => {
  const gen = makeGen();
  const classic = gmMin(gen, "en", "classic", "@min_st_c");
  const degen = gmMin(gen, "en", "degen", "@min_st_d");
  assert.ok(passesMinSubstance(classic, "gm", "en", "classic"));
  assert.ok(passesMinSubstance(degen, "gm", "en", "degen"));
  assert.notEqual(classic, degen);
});

test("ten EN min generations are not all identical", () => {
  const gen = makeGen();
  const set = new Set();
  for (let i = 0; i < 10; i++) {
    const line = gmMin(gen, "en", "classic", `@min_dup_${i}`);
    set.add(line);
  }
  assert.ok(set.size >= 2, `only ${set.size} unique min lines`);
});

test("GM min does not use GN night markers", () => {
  const gen = makeGen();
  for (const lang of ["en", "ru", "tr", "es"]) {
    const line = gmMin(gen, lang, "classic", `@min_gn_${lang}`);
    assert.ok(!/\b(good night|спокойной|iyi geceler|buenas noches)\b/i.test(line), line);
  }
});

test("min output is shorter than mid for same language", () => {
  const gen = makeGen();
  const minLen = gmMin(gen, "en", "classic", "@min_len").length;
  const midLen = gen.generateUnique("@mid_len", "gm", "mid", "en", "classic", 0).length;
  assert.ok(minLen <= midLen, `min=${minLen} mid=${midLen}`);
});
