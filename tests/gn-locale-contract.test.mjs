/**
 * GN quota and terminology semantic contract across all 15 locale sources.
 */
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const localesDir = path.join(path.resolve(path.dirname(fileURLToPath(import.meta.url)), ".."), "shared", "i18n", "locales");

const GN_KEYS = [
  "gn_desc",
  "gn_pro_1",
  "gn_daily_label",
  "gnRand1",
  "gnRand10",
  "gnRand70",
  "gen_daily_limit_reached",
  "limit_modal_daily_a",
  "limit_modal_daily_b",
];

const BAD_QUOTA = [
  /\b70\b/,
  /\b70\s*\/\s*day\b/i,
  /\b50\s*\/\s*day\b/i,
  /\b50\/day\b/i,
  /\b50\s+per\s+day\b/i,
  /\bdaily\s+reset\b/i,
  /\bRandom\s+70\b/i,
  /\bdaily\s+generation\s+limit\b/i,
];

const BAD_GN_TERM = [
  /\bRandom\s+1\b/i,
  /\bRandom\s+10\b/i,
  /\bgood morning\b/i,
  /\bmorning replies\b/i,
];

test("all 15 locale sources: GN quota keys avoid legacy daily/70 promises", () => {
  const files = fs.readdirSync(localesDir).filter((f) => f.endsWith(".json"));
  assert.equal(files.length, 15);
  for (const file of files) {
    const loc = JSON.parse(fs.readFileSync(path.join(localesDir, file), "utf8"));
    for (const key of GN_KEYS) {
      const val = String(loc[key] || "");
      if (!val) continue;
      for (const bad of BAD_QUOTA) {
        assert.ok(!bad.test(val), `${file} ${key}: ${val}`);
      }
    }
  }
});

test("all 15 locale sources: GN copy avoids GM/morning terminology in user-facing keys", () => {
  const files = fs.readdirSync(localesDir).filter((f) => f.endsWith(".json"));
  for (const file of files) {
    const loc = JSON.parse(fs.readFileSync(path.join(localesDir, file), "utf8"));
    for (const key of ["gn_desc", "gnRand1", "gnRand10", "gn_right_desc"]) {
      const val = String(loc[key] || "");
      if (!val) continue;
      for (const bad of BAD_GN_TERM) {
        assert.ok(!bad.test(val), `${file} ${key}: ${val}`);
      }
    }
    if (loc.gn_desc) assert.match(String(loc.gn_desc), /Quick 1|Quick|quick|クイック|Быстр|tap|pulsa|tippen|dokunun|naciśnij/i, `${file} gn_desc missing Quick 1 hint`);
  }
});
