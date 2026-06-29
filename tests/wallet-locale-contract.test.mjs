/**
 * Wallet / Pro i18n contract across 15 locales.
 */
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const localesDir = path.join(path.resolve(path.dirname(fileURLToPath(import.meta.url)), ".."), "shared", "i18n", "locales");

const WALLET_KEYS = [
  "wallet_desc",
  "wallet_pay_connect_handle_first",
  "wallet_plan_compare_title",
  "plan_cmp_feat_daily",
  "plan_cmp_val_free_daily",
  "pay_success_title",
  "pay_success_ready",
  "pay_success_plan_pro",
  "pay_success_until_label",
  "w_pay_desc",
  "pay_connect_wallet_continue",
  "wallet_hint_connect_pay",
  "wallet_opening",
  "wallet_connected_ok",
  "wallet_pro_active",
  "ui_err_wallet_bind",
];

const BAD_QUOTA = [
  /\b70\b/,
  /\b70\s*\/\s*day\b/i,
  /\b50\s*\/\s*day\b/i,
  /\b50\/day\b/i,
  /\b50\s+per\s+day\b/i,
  /\bdaily\s+reset\b/i,
  /\bRandom\s+70\b/i,
];

const BAD_DAILY_PROMISE = [
  /\bunlimited\s+daily\b/i,
  /\bdaily\s+GM\/GN\b/i,
  /\bGM\/GN\s+daily\b/i,
  /\bquotidien/i,
  /\btäglich/i,
  /\bdiarias?\b/i,
  /\bgiornalier/i,
  /\bharian\b/i,
  /\bдневн/i,
  /\bденн/i,
  /\b每日\b/,
  /\b日次\b/,
  /\b1日無制限\b/,
];

test("all 15 locales define wallet checkout keys", () => {
  const files = fs.readdirSync(localesDir).filter((f) => f.endsWith(".json"));
  assert.equal(files.length, 15);
  for (const file of files) {
    const loc = JSON.parse(fs.readFileSync(path.join(localesDir, file), "utf8"));
    for (const key of WALLET_KEYS) {
      assert.ok(String(loc[key] || "").trim(), `${file} missing ${key}`);
    }
  }
});

test("wallet_desc and plan_cmp avoid legacy daily/70 quota promises", () => {
  const files = fs.readdirSync(localesDir).filter((f) => f.endsWith(".json"));
  for (const file of files) {
    const loc = JSON.parse(fs.readFileSync(path.join(localesDir, file), "utf8"));
    for (const key of ["wallet_desc", "seo_wallet_description", "plan_cmp_val_free_daily", "plan_cmp_feat_daily"]) {
      const val = String(loc[key] || "");
      if (!val) continue;
      for (const bad of BAD_QUOTA) {
        assert.ok(!bad.test(val), `${file} ${key}: ${val}`);
      }
    }
    const desc = String(loc.wallet_desc || "");
    for (const bad of BAD_DAILY_PROMISE) {
      assert.ok(!bad.test(desc), `${file} wallet_desc daily promise: ${desc}`);
    }
  }
});

test("en wallet copy uses generation credits framing", () => {
  const en = JSON.parse(fs.readFileSync(path.join(localesDir, "en.json"), "utf8"));
  assert.equal(en.plan_cmp_feat_daily, "Generation credits");
  assert.match(en.plan_cmp_val_free_daily, /50 total.*GM\+GN shared/i);
  assert.match(en.wallet_desc, /generation credits/i);
  assert.match(en.wallet_desc, /SOL.*USDC.*USDT/i);
});
