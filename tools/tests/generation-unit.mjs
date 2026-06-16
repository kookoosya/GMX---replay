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

const unique = gen.generateUnique("@unittest01", "gm", "mid", "en", "classic", 0);
if (!String(unique || "").trim()) fail("generateUnique returned empty");
ok("generateUnique");

const recent = gen.getRecentSet("@unittest01", "gm", 5);
if (!(recent instanceof Set)) fail("getRecentSet must return Set");
ok("getRecentSet");

console.log("GENERATION_UNIT_OK");
