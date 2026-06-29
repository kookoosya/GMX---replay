/**
 * GM quota semantic contract across all 15 locale sources.
 */
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const localesDir = path.join(path.resolve(path.dirname(fileURLToPath(import.meta.url)), ".."), "shared", "i18n", "locales");

const GM_KEYS = [
  "gm_desc",
  "gm_pro_1",
  "gm_daily_label",
  "gen_daily_limit_reached",
  "limit_modal_daily_a",
  "limit_modal_daily_b",
  "gmRand1",
  "gmRand10",
  "gmRand70",
  "plan_cmp_val_free_daily",
  "plan_modal_cmp_val_free_daily",
];

const BAD = [
  /\b70\b/,
  /\b70\s*\/\s*day\b/i,
  /\b50\s*\/\s*day\b/i,
  /\b50\/day\b/i,
  /\b50\s+per\s+day\b/i,
  /\b50\s+each\b/i,
  /\bdaily\s+reset\b/i,
  /\bevery\s+day\b/i,
  /\bper\s+day\b/i,
  /\bRandom\s+70\b/i,
  /\bdaily\s+generation\s+limit\b/i,
  /\btoday'?s\s+free\s+generation\b/i,
];

test("all 15 locale sources: GM quota keys avoid legacy daily/70 promises", () => {
  const files = fs.readdirSync(localesDir).filter((f) => f.endsWith(".json"));
  assert.equal(files.length, 15);
  for (const file of files) {
    const loc = JSON.parse(fs.readFileSync(path.join(localesDir, file), "utf8"));
    for (const key of GM_KEYS) {
      const val = String(loc[key] || "");
      if (!val) continue;
      for (const bad of BAD) {
        assert.ok(!bad.test(val), `${file} ${key}: ${val}`);
      }
    }
  }
});
