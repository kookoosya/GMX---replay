import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  PLAN_COMPARE_COLUMN_KEYS,
  PLAN_COMPARE_FEATURE_KEYS,
} from "../tools/lib/plan-compare-core.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("wallet tab exposes the Free vs Pro compare table", () => {
  const html = fs.readFileSync(path.join(root, "public", "app.html"), "utf8");
  for (const id of [
    "wallet_plan_compare",
    "wallet_plan_compare_title",
    "wallet_plan_compare_table",
  ]) {
    assert.match(html, new RegExp(`id="${id}"`));
  }
  assert.equal(PLAN_COMPARE_FEATURE_KEYS.length, 8);
  for (const key of PLAN_COMPARE_FEATURE_KEYS) {
    assert.match(html, new RegExp(`id="${key}"`));
  }
  assert.match(html, /class="planCmpCell yes"/);
  assert.match(html, /class="planCmpCell no"/);
});

test("plan modal table uses checkmark cells and i18n ids", () => {
  const html = fs.readFileSync(path.join(root, "public", "app.html"), "utf8");
  const modal = html.slice(html.indexOf('id="plan_modal_table"'));
  assert.match(modal, /plan_modal_cmp_col_feature/);
  assert.match(modal, /plan_modal_cmp_feat_sync/);
  assert.match(modal, /class="planCmpCell yes"/);
  assert.match(modal, /aria-hidden="true">✓</);
});

test("wallet plan compare css", () => {
  const css = fs.readFileSync(path.join(root, "public", "app.css"), "utf8");
  assert.match(css, /\.walletPlanCompare/);
  assert.match(css, /\.planCompareTable/);
  assert.match(css, /\.planCmpCell\.yes/);
});

test("en locale defines plan compare copy", () => {
  const en = JSON.parse(fs.readFileSync(path.join(root, "shared", "i18n", "locales", "en.json"), "utf8"));
  assert.ok(en.wallet_plan_compare_title);
  for (const key of [...PLAN_COMPARE_COLUMN_KEYS, ...PLAN_COMPARE_FEATURE_KEYS]) {
    assert.ok(en[key], key);
  }
  for (const key of ["plan_cmp_unlimited", "plan_cmp_all_arcade", "plan_modal_cmp_feat_sync"]) {
    assert.ok(en[key], key);
  }
});
