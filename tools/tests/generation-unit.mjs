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

for (const style of ["degen", "alpha"]) {
  for (let i = 0; i < 8; i++) {
    const line = gen.composeReply("gm", "mid", "en", style);
    if (BANNED_CRYPTO_RE.test(line)) fail(`composeReply crypto hype for style=${style}: ${line}`);
    if (/\b(ser|legend|mate|dear)\b/i.test(line)) fail(`composeReply legacy vocative for style=${style}: ${line}`);
  }
}
ok("crypto styles avoid hype and legacy vocatives");

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
