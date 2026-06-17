#!/usr/bin/env node
/** Unit checks for server/generation.mjs via createGenerator(). */
import Database from "better-sqlite3";
import { createGenerator } from "../../server/generation.mjs";
import { fail, ok } from "./_helpers.mjs";

const db = new Database(":memory:");
db.exec(`
  CREATE TABLE IF NOT EXISTS recent_replies (
    handle TEXT,
    kind TEXT,
    reply TEXT,
    created_at TEXT
  );
  CREATE TABLE IF NOT EXISTS recent_reply_shapes (
    kind TEXT,
    mode TEXT,
    family TEXT,
    reply_hash TEXT,
    shape TEXT,
    created_at TEXT
  );
`);

function safeDb(fn) {
  try {
    return fn();
  } catch {
    return null;
  }
}

function safeOptionalHistoryDb(fn, fallback) {
  try {
    return fn();
  } catch {
    return fallback;
  }
}

function sha256(s) {
  return String(s);
}

const gen = createGenerator({ safeDb, db, nowIso: () => new Date().toISOString(), safeOptionalHistoryDb, sha256 });

const required = [
  "composeReply",
  "generateUnique",
  "generateRankedCandidates",
  "getRecentSet",
];
for (const name of required) {
  if (typeof gen[name] !== "function") fail(`createGenerator() missing ${name}`);
}
ok("createGenerator exports");

const styles = [
  "classic", "classy", "emoji", "noemoji", "minimal", "meme",
  "degen", "alpha", "cheer", "calm", "builder", "focus",
];

for (const style of styles) {
  const line = gen.composeReply("gm", "mid", "en", style);
  if (!String(line || "").trim()) fail(`composeReply empty for style=${style}`);
}
ok(`composeReply ${styles.length} styles`);

const BANNED_CRYPTO_RE = /\b(?:wagmi|lfg|hodl|ath|moon|ape|aping)\b|diamond\s+hands?/i;
const RE_ANY_EMOJI = /[\p{Extended_Pictographic}]/gu;
const RE_GM_BAD_EMOJI = /[\u{1F319}\u{1F634}\u{1F4A4}\u{1F6CC}]/gu;
const RE_GN_BAD_EMOJI = /[\u{2600}\u{FE0F}\u{2615}\u{1F305}]/gu;

for (const style of ["degen", "alpha", "classy", "cheer", "calm", "builder", "focus"]) {
  for (let i = 0; i < 8; i++) {
    const line = gen.composeReply("gm", "mid", "en", style);
    if (BANNED_CRYPTO_RE.test(line)) fail(`composeReply crypto hype for style=${style}: ${line}`);
    if (/\b(ser|legend|mate|dear)\b/i.test(line)) fail(`composeReply legacy vocative for style=${style}: ${line}`);
  }
}
ok("crypto styles avoid hype and legacy vocatives");

for (const mode of ["min", "mid", "max"]) {
  for (let i = 0; i < 12; i++) {
    const line = gen.composeReply("gm", mode, "en", "classic");
    if (!gen.passesModeProfile(line, mode)) fail(`passesModeProfile gm/${mode}: ${line}`);
  }
  for (let i = 0; i < 12; i++) {
    const line = gen.composeReply("gn", mode, "en", "classic");
    if (!gen.passesModeProfile(line, mode)) fail(`passesModeProfile gn/${mode}: ${line}`);
  }
}
ok("passesModeProfile for min/mid/max");

for (let i = 0; i < 20; i++) {
  const line = gen.composeReply("gm", "mid", "en", "noemoji");
  if (RE_ANY_EMOJI.test(line)) fail(`noemoji style must not contain emoji: ${line}`);
}
for (let i = 0; i < 20; i++) {
  const line = gen.composeReply("gn", "mid", "en", "noemoji");
  if (RE_ANY_EMOJI.test(line)) fail(`noemoji style must not contain emoji: ${line}`);
}
ok("noemoji style strips emoji");

for (let i = 0; i < 16; i++) {
  const line = gen.composeReply("gm", "mid", "en", "classic");
  const emojis = line.match(RE_ANY_EMOJI) || [];
  if (emojis.length && RE_GM_BAD_EMOJI.test(line)) fail(`GM reply has night emoji: ${line}`);
}
for (let i = 0; i < 16; i++) {
  const line = gen.composeReply("gn", "mid", "en", "classic");
  const emojis = line.match(RE_ANY_EMOJI) || [];
  if (emojis.length && RE_GN_BAD_EMOJI.test(line)) fail(`GN reply has morning emoji: ${line}`);
}
ok("emoji tone matches GM/GN");

const bulkHandle = "@unittest03";
db.exec("DELETE FROM recent_replies WHERE handle='@unittest03'");
const bulk = gen.generateRankedCandidates(bulkHandle, "gm", "mid", "en", "classic", 8, 20, false);
if (!Array.isArray(bulk) || bulk.length < 4) fail("generateRankedCandidates should return multiple candidates");
const bulkShapes = new Set(bulk.map((x) => gen.shapeFingerprint(x, "gm")));
if (bulkShapes.size < Math.min(4, bulk.length)) fail("generateRankedCandidates should diversify shapes");
ok("generateRankedCandidates diversity");

for (const style of ["cheer", "calm", "builder", "focus", "meme", "classy"]) {
  for (const mode of ["min", "mid"]) {
    for (let i = 0; i < 6; i++) {
      const line = gen.composeReply("gn", mode, "en", style);
      if (!String(line || "").trim()) fail(`composeReply gn/${mode}/${style} empty`);
      if (!gen.passesModeProfile(line, mode)) fail(`passesModeProfile gn/${mode}/${style}: ${line}`);
    }
  }
}
ok("style families pass mode profile");

const antiHandle = "@unittest02";
db.exec("DELETE FROM recent_replies WHERE handle='@unittest02'");
const first = gen.generateUnique(antiHandle, "gm", "mid", "en", "classic", 0);
gen.saveRecent(antiHandle, "gm", first, "mid", "classic");
const second = gen.generateUnique(antiHandle, "gm", "mid", "en", "classic", 20);
if (!second || second === first) fail("generateUnique should avoid immediate repeat after saveRecent");
ok("generateUnique anti-repeat");

const unique = gen.generateUnique("@unittest01", "gm", "mid", "en", "classic", 0);
if (!String(unique || "").trim()) fail("generateUnique returned empty");
ok("generateUnique");

const recent = gen.getRecentSet("@unittest01", "gm", 5);
if (!(recent instanceof Set)) fail("getRecentSet must return Set");
ok("getRecentSet");

console.log("GENERATION_UNIT_OK");
