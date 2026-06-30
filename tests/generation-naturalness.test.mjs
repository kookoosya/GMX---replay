/**
 * GM/GN naturalness regression — real engine, structural quality gate.
 */
import test from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import Database from "better-sqlite3";
import { createGenerator } from "../server/generation.mjs";
import {
  passesNaturalQuality,
  isKnownBadScreenshotLine,
  normalizedSkeleton,
  SCREENSHOT_REJECTS,
} from "../server/generation-natural-validator.mjs";
import { RE_ANY_EMOJI } from "../server/generation-min-substance.mjs";
import { SUPPORTED_REPLY_LANGS } from "../server/generation-lang.mjs";

const STYLES = ["classic", "noemoji", "emoji", "degen", "crypto", "warm", "calmer", "builder", "meme"];
const MODES = ["min", "mid"];

function makeGen(seed = 0) {
  let n = seed;
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
    nowIso: () => new Date(Date.now() + n++).toISOString(),
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

function assertNatural(line, kind, mode, lang) {
  assert.ok(line, "empty line");
  assert.ok(passesNaturalQuality(line, kind, mode, lang), `unnatural: ${line}`);
  assert.ok(!isKnownBadScreenshotLine(line), `screenshot reject: ${line}`);
}

function sampleLine(gen, handle, kind, mode, lang, style) {
  return gen.composeReply(kind, mode, lang, style);
}

test("validator rejects all ten screenshot word-salad lines", () => {
  for (const bad of SCREENSHOT_REJECTS) {
    assert.ok(!passesNaturalQuality(bad, "gm", "min", "en"), bad);
    assert.ok(isKnownBadScreenshotLine(bad), bad);
  }
});

test("1000 EN GM min/mid across styles stay natural", () => {
  const gen = makeGen(1);
  for (let i = 0; i < 1000; i++) {
    const mode = MODES[i % 2];
    const style = STYLES[i % STYLES.length];
    const line = sampleLine(gen, `@nat_en_gm_${i}`, "gm", mode, "en", style);
    assertNatural(line, "gm", mode, "en");
  }
});

test("1000 EN GN min/mid across styles stay natural", () => {
  const gen = makeGen(2);
  for (let i = 0; i < 1000; i++) {
    const mode = MODES[i % 2];
    const style = STYLES[i % STYLES.length];
    const line = sampleLine(gen, `@nat_en_gn_${i}`, "gn", mode, "en", style);
    assertNatural(line, "gn", mode, "en");
  }
});

for (const [lang, count] of [
  ["ru", 300],
  ["tr", 300],
  ["es", 300],
  ["ja", 200],
  ["zh", 200],
]) {
  test(`${count} ${lang.toUpperCase()} GM/GN generations stay natural`, () => {
    const gen = makeGen(lang.charCodeAt(0));
    for (let i = 0; i < count; i++) {
      const kind = i % 2 === 0 ? "gm" : "gn";
      const mode = MODES[i % 2];
      const style = STYLES[i % STYLES.length];
      const line = sampleLine(gen, `@nat_${lang}_${i}`, kind, mode, lang, style);
      assertNatural(line, kind, mode, lang);
      if (lang !== "en") {
        assert.ok(!/\b(morning light start|quick gm|grand rising)\b/i.test(line), line);
      }
    }
  });
}

test("all 15 languages produce natural GM min sample", () => {
  const gen = makeGen(99);
  for (const lang of SUPPORTED_REPLY_LANGS) {
    const line = sampleLine(gen, `@nat15_${lang}`, "gm", "min", lang, "classic");
    assertNatural(line, "gm", "min", lang);
  }
});

test("batch 10 EN GM has diversity and no normalized dupes", () => {
  const gen = makeGen(42);
  const batch = gen.generateRankedCandidates("@batch_en_gm", "gm", "min", "en", "classic", 10, 0, false);
  assert.equal(batch.length, 10);
  const exact = new Set(batch);
  assert.equal(exact.size, 10, `exact dupes: ${batch.join(" | ")}`);
  const normalized = batch.map((t) => normalizedSkeleton(t));
  assert.equal(new Set(normalized).size, 10, normalized.join(" | "));
  const emojiOnly = new Set(batch.map((t) => coreNoEmoji(t).toLowerCase()));
  assert.equal(emojiOnly.size, 10);
  const openings = batch.map((t) => coreNoEmoji(t).split(/\s+/).slice(0, 2).join(" ").toLowerCase());
  const openingCounts = new Map();
  for (const o of openings) openingCounts.set(o, (openingCounts.get(o) || 0) + 1);
  const maxOpening = Math.max(...openingCounts.values());
  assert.ok(maxOpening <= 3, `opening repeat ${maxOpening}: ${[...openingCounts.entries()]}`);
  const skeletons = new Set(batch.map((t) => normalizedSkeleton(t)));
  assert.ok(skeletons.size >= 5, `only ${skeletons.size} skeletons`);
});

test("batch 10 EN GN has diversity and no normalized dupes", () => {
  const gen = makeGen(43);
  const batch = gen.generateRankedCandidates("@batch_en_gn", "gn", "mid", "en", "classic", 10, 0, false);
  assert.equal(batch.length, 10);
  assert.equal(new Set(batch).size, 10);
  assert.equal(new Set(batch.map((t) => normalizedSkeleton(t))).size, 10);
});

test("GM lines do not leak GN semantics and vice versa", () => {
  const gen = makeGen(55);
  for (let i = 0; i < 80; i++) {
    const gm = sampleLine(gen, `@sem_gm_${i}`, "gm", "min", "en", "classic");
    const gn = sampleLine(gen, `@sem_gn_${i}`, "gn", "min", "en", "classic");
    assert.ok(!/\b(good night|sleep well|rest easy|gn)\b/i.test(gm), gm);
    assert.ok(!/\b(good morning|coffee first|gm)\b/i.test(gn) || /\bbetter morning tomorrow\b/i.test(gn), gn);
  }
});
