/**
 * Referral i18n contract: no daily/70 promises in referral keys.
 */
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const localesDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "shared", "i18n", "locales");

const REF_KEYS = [
  "ref_daily_limit_title",
  "ref_bonus_rule",
  "ref_k_gen_total",
  "ref_status_confirmed",
  "ref_status_active",
  "ref_lb_rules_summary",
  "ref_fraud_device",
  "ref_fraud_burst",
  "r_li2c",
];

const BANNED = [
  /\bdaily generation\b/i,
  /\bper day\b/i,
  /\b70\b/,
  /\bgiornalier/i,
  /\btäglich/i,
  /\bquotidien/i,
  /\bdiari[ao]\b/i,
  /\bdagelijkse\b/i,
  /\bgünlük\b/i,
  /\bdzienny\b/i,
  /\bharian\b/i,
  /\bдневн/i,
  /\bщоденн/i,
  /\bदैनिक\b/,
  /\b每日\b/,
];

test("referral locale keys exist in all locales", () => {
  const en = JSON.parse(fs.readFileSync(path.join(localesDir, "en.json"), "utf8"));
  for (const key of REF_KEYS) assert.ok(key in en, `en missing ${key}`);
  const files = fs.readdirSync(localesDir).filter((f) => f.endsWith(".json"));
  for (const file of files) {
    const j = JSON.parse(fs.readFileSync(path.join(localesDir, file), "utf8"));
    for (const key of REF_KEYS) {
      assert.ok(key in j, `${file} missing ${key}`);
      assert.ok(String(j[key] || "").trim(), `${file}.${key} empty`);
    }
  }
});

test("referral en copy avoids daily quota promises", () => {
  const en = JSON.parse(fs.readFileSync(path.join(localesDir, "en.json"), "utf8"));
  const blob = REF_KEYS.map((k) => String(en[k] || "")).join("\n");
  for (const re of BANNED) {
    assert.match(blob, /./);
    assert.doesNotMatch(blob, re, `en referral copy matches banned ${re}`);
  }
  assert.match(String(en.ref_bonus_rule), /lifetime/i);
  assert.match(String(en.ref_daily_limit_title), /shared/i);
});
