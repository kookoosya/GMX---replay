/**
 * Referral UI contract: status labels, masking, leaderboard rules binding.
 */
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("referrals UI maps canonical statuses and masks handles", () => {
  const src = fs.readFileSync(path.join(root, "public", "app.referrals.js"), "utf8");
  assert.match(src, /referralStatusLabel/);
  assert.match(src, /maskHandle/);
  assert.match(src, /ref_status_confirmed/);
  assert.match(src, /ref_status_active/);
  assert.doesNotMatch(src, /fraudReason \? ": " \+ escHtml\(r\.fraudReason\)/);
});

test("referrals UI leaderboard uses server rules summary", () => {
  const src = fs.readFileSync(path.join(root, "public", "app.referrals.js"), "utf8");
  assert.match(src, /leaderboardSummary/);
  assert.doesNotMatch(src, /minInserts/);
});

test("promo note renderer wired to ref stats", () => {
  const dyn = fs.readFileSync(path.join(root, "public", "app.sitei18ndynamic.js"), "utf8");
  const wire = fs.readFileSync(path.join(root, "public", "app.generatewire.js"), "utf8");
  assert.match(dyn, /function renderReferralPromoNote/);
  assert.match(wire, /renderReferralPromoNote/);
});
