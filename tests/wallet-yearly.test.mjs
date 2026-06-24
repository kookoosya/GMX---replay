import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("wallet tab exposes yearly savings note", () => {
  const html = fs.readFileSync(path.join(root, "public", "app.html"), "utf8");
  assert.match(html, /id="w_yearly_save"/);
  assert.match(html, /2 months|Yearly Pro saves/i);
});

test("wallet UI highlights yearly plan with i18n badge", () => {
  const src = fs.readFileSync(path.join(root, "public", "app.walletui.js"), "utf8");
  assert.match(src, /planFeatured/);
  assert.match(src, /plan_badge_2mo_free/);
  assert.match(src, /siteTr/);
});

test("wallet helpers show per-month quote for yearly", () => {
  const src = fs.readFileSync(path.join(root, "public", "app.wallethelpers.js"), "utf8");
  assert.match(src, /planPerMonthUsd/);
  assert.match(src, /\/mo/);
});

test("billing config includes yearly plan at discount", () => {
  const src = fs.readFileSync(path.join(root, "server", "config.mjs"), "utf8");
  assert.match(src, /key:\s*"y1"/);
  assert.match(src, /usd:\s*80/);
  assert.match(src, /days:\s*365/);
});

test("en locale defines yearly wallet copy", () => {
  const en = JSON.parse(fs.readFileSync(path.join(root, "shared", "i18n", "locales", "en.json"), "utf8"));
  for (const key of ["w_yearly_save", "plan_badge_2mo_free", "plan_badge_popular"]) {
    assert.ok(en[key], `missing ${key}`);
  }
  assert.match(en.plan_modal_desc, /Yearly|yearly/i);
});
