import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  REF_BADGE_TIERS,
  PRO_BADGE_FLOOR_ID,
  earnedReferralBadgeTier,
  effectiveReferralBadgeTier,
  nextReferralBadgeTier,
  referralBadgeState,
  badgeTierRank,
  referralBadgePillHtml,
} from "../tools/lib/referral-badge-core.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("referral badge tiers match product ladder", () => {
  assert.deepEqual(
    REF_BADGE_TIERS.map((t) => t.minEligible),
    [3, 10, 30, 50]
  );
  assert.equal(PRO_BADGE_FLOOR_ID, "gold");
});

test("earned tier advances with eligible referrals", () => {
  assert.equal(earnedReferralBadgeTier(2), null);
  assert.equal(earnedReferralBadgeTier(3)?.id, "bronze");
  assert.equal(earnedReferralBadgeTier(10)?.id, "silver");
  assert.equal(earnedReferralBadgeTier(30)?.id, "gold");
  assert.equal(earnedReferralBadgeTier(50)?.id, "diamond");
});

test("pro floor shows gold when below gold threshold", () => {
  assert.equal(effectiveReferralBadgeTier(5, { isPro: true })?.id, "gold");
  assert.equal(effectiveReferralBadgeTier(30, { isPro: true })?.id, "gold");
  assert.equal(effectiveReferralBadgeTier(50, { isPro: true })?.id, "diamond");
});

test("next badge tier and state bundle need", () => {
  assert.equal(nextReferralBadgeTier(0)?.id, "bronze");
  assert.equal(nextReferralBadgeTier(50), null);
  const s = referralBadgeState(7);
  assert.equal(s.current?.id, "bronze");
  assert.equal(s.next?.id, "silver");
  assert.equal(s.needed, 3);
});

test("badge tier rank compares progression", () => {
  assert.ok(badgeTierRank("silver") > badgeTierRank("bronze"));
  assert.ok(badgeTierRank("diamond") > badgeTierRank("gold"));
});

test("badge pill html includes tier class", () => {
  const html = referralBadgePillHtml(REF_BADGE_TIERS[0], { label: "Bronze" });
  assert.match(html, /refBadgeBronze/);
  assert.match(html, /🥉/);
});

test("referrals tab exposes badge shelf shell", () => {
  const html = fs.readFileSync(path.join(root, "public", "app.html"), "utf8");
  for (const id of ["refBadgeShelf", "refBadgeRow", "homeRefBadge", "headerRefBadge"]) {
    assert.match(html, new RegExp(`id="${id}"`));
  }
  assert.match(html, /referral-badge-core\.js/);
});

test("sitei18n dynamic sync uses badge core", () => {
  const src = fs.readFileSync(path.join(root, "public", "app.sitei18ndynamic.js"), "utf8");
  assert.match(src, /syncRefBadgeUi/);
  assert.match(src, /GMXReferralBadgeCore/);
});

test("en locale defines referral badge copy", () => {
  const en = JSON.parse(fs.readFileSync(path.join(root, "shared", "i18n", "locales", "en.json"), "utf8"));
  assert.ok(en.ref_badge_bronze);
  assert.ok(en.ref_badge_toast_html);
});
