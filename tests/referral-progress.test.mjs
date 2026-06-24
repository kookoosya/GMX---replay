import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  REF_UNLOCK_LADDER,
  nextReferralUnlockAt,
  previousReferralUnlockAt,
  neededForNextUnlock,
  referralProgressPct,
  referralProgressState,
} from "../tools/lib/referral-progress-core.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("unlock ladder matches product tiers", () => {
  assert.deepEqual(REF_UNLOCK_LADDER, [1, 3, 7, 15, 30, 50, 100]);
});

test("next unlock step advances with eligible count", () => {
  assert.equal(nextReferralUnlockAt(0), 1);
  assert.equal(nextReferralUnlockAt(1), 3);
  assert.equal(nextReferralUnlockAt(2), 3);
  assert.equal(nextReferralUnlockAt(7), 15);
  assert.equal(nextReferralUnlockAt(100), 0);
});

test("progress uses span between previous and next unlock", () => {
  assert.equal(previousReferralUnlockAt(3), 1);
  assert.equal(previousReferralUnlockAt(1), 0);
  assert.equal(referralProgressPct(0, 1, 0), 0);
  assert.equal(referralProgressPct(1, 3, 1), 0);
  assert.equal(referralProgressPct(2, 3, 1), 50);
  assert.equal(neededForNextUnlock(2, 3), 1);
});

test("referrals tab exposes progress bar shell", () => {
  const html = fs.readFileSync(path.join(root, "public", "app.html"), "utf8");
  for (const id of ["refProgressWrap", "refProgressLabel", "refProgressFill", "refProgressPct", "refProgressNeed"]) {
    assert.match(html, new RegExp(`id="${id}"`));
  }
  assert.match(html, /referral-progress-core\.js/);
});

test("sitei18n dynamic sync uses progress core", () => {
  const src = fs.readFileSync(path.join(root, "public", "app.sitei18ndynamic.js"), "utf8");
  assert.match(src, /syncRefProgressMeter/);
  assert.match(src, /refProgressNeed/);
  assert.match(src, /GMXReferralProgressCore/);
});

test("en locale defines progress need copy", () => {
  const en = JSON.parse(fs.readFileSync(path.join(root, "shared", "i18n", "locales", "en.json"), "utf8"));
  assert.ok(en.ref_progress_meter_html);
  assert.ok(en.ref_progress_need_html);
});

test("referral progress state bundles pct and need", () => {
  const s = referralProgressState(2);
  assert.equal(s.nextStep, 3);
  assert.equal(s.prevStep, 1);
  assert.equal(s.needed, 1);
  assert.equal(s.pct, 50);
});
