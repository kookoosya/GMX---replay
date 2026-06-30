/**
 * Temporary human-review sample (do not commit output).
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import Database from "better-sqlite3";
import { fileURLToPath } from "node:url";
import { createGenerator } from "../server/generation.mjs";
import { passesNaturalQuality } from "../server/generation-natural-validator.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outPath = path.join(__dirname, ".generation-human-review.txt");

function makeGen() {
  const db = new Database(":memory:");
  db.exec(`
    CREATE TABLE recent_replies (handle TEXT, kind TEXT, reply TEXT, created_at TEXT);
    CREATE TABLE recent_reply_shapes (kind TEXT, mode TEXT, family TEXT, reply_hash TEXT, shape TEXT, created_at TEXT);
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

const plan = [
  ["en", "gm", 100],
  ["en", "gn", 100],
  ["ru", "gm", 20],
  ["ru", "gn", 20],
  ["tr", "gm", 20],
  ["tr", "gn", 20],
  ["es", "gm", 20],
  ["es", "gn", 20],
  ["ja", "gm", 13],
  ["ja", "gn", 12],
  ["zh", "gm", 13],
  ["zh", "gn", 12],
];

const gen = makeGen();
const lines = ["# GMXReply generation human review (auto)", ""];

for (const [lang, kind, count] of plan) {
  lines.push(`## ${lang.toUpperCase()} ${kind.toUpperCase()}`);
  for (let i = 0; i < count; i++) {
    const text = gen.composeReply(kind, i % 2 === 0 ? "min" : "mid", lang, "classic");
    const verdict = passesNaturalQuality(text, kind, i % 2 === 0 ? "min" : "mid", lang) ? "ACCEPT" : "REJECT";
    const reason = verdict === "ACCEPT" ? "natural complete sentence" : "failed structural validator";
    lines.push(`${verdict}\t${text}\t${reason}`);
  }
  lines.push("");
}

fs.writeFileSync(outPath, lines.join("\n"), "utf8");
console.log(`Wrote ${outPath}`);
