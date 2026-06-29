/**
 * Wallet plan cards must mirror server BILLING_PLANS (client is not source of truth).
 */
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { BILLING_PLANS, BILLING_TOKENS } from "../server/config.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("billing config defines four active Pro plans", () => {
  assert.equal(BILLING_PLANS.length, 4);
  const keys = BILLING_PLANS.map((p) => p.key);
  assert.deepEqual(keys, ["m1", "m3", "m6", "y1"]);
  for (const p of BILLING_PLANS) {
    assert.ok(p.usd > 0);
    assert.ok(p.days > 0);
    assert.ok(p.label);
  }
});

test("billing tokens expose SOL USDC USDT only", () => {
  assert.deepEqual(BILLING_TOKENS.map((t) => t.key), ["SOL", "USDC", "USDT"]);
});

test("wallet UI loads plans from /api/billing/plans not hardcoded prices", () => {
  const src = readFileSync(path.join(root, "public", "app.walletui.js"), "utf8");
  const helpers = readFileSync(path.join(root, "public", "app.wallethelpers.js"), "utf8");
  assert.match(src, /\/api\/billing\/plans/);
  assert.match(src, /planPricePrimary/);
  assert.match(helpers, /solApprox/);
  assert.match(helpers, /plan\.usd|p\.usd/);
});

test("wallet html exposes three supported payment tokens", () => {
  const html = readFileSync(path.join(root, "public", "app.html"), "utf8");
  for (const token of ["SOL", "USDC", "USDT"]) {
    assert.match(html, new RegExp(`id="token_${token}"`));
  }
});

test("wallet helpers format server plan USD for display", () => {
  const src = readFileSync(path.join(root, "public", "app.wallethelpers.js"), "utf8");
  assert.match(src, /planPricePrimary/);
  assert.match(src, /solApprox/);
});
