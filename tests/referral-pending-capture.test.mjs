/**
 * Referral pending capture: URL read, format validation, first record creation.
 */
import test from "node:test";
import assert from "node:assert/strict";
import {
  REF_PENDING_TTL_MS,
  normalizeReferralCode,
  createPendingRecord,
  parsePendingRecord,
  resolvePendingCapture,
  serializePending,
  pendingRecordHasSecrets,
} from "../tools/lib/referral-pending-core.mjs";
import { createMockPendingStorage, createPendingAdapter } from "./lib/referral-pending-test-helpers.mjs";

test("referral pending capture: ?ref=valid creates pending record", () => {
  const now = 1_700_000_000_000;
  const code = "a1b2c3d4e5f6";
  const decision = resolvePendingCapture(null, code, now);
  assert.equal(decision.action, "create");
  assert.ok(decision.record);
  assert.equal(decision.record.code, code);
  assert.equal(decision.record.expiresAt, now + REF_PENDING_TTL_MS);
  assert.equal(decision.sendClick, true);
});

test("referral pending capture: invalid format is not stored", () => {
  const now = Date.now();
  for (const bad of ["abc", "zzzzzz", "<script>", "a".repeat(40), "has space"]) {
    const decision = resolvePendingCapture(null, bad, now);
    assert.equal(decision.action, "reject_invalid", `expected reject for ${JSON.stringify(bad)}`);
    assert.equal(decision.record, null);
  }
  assert.equal(resolvePendingCapture(null, "", now).action, "noop");
});

test("referral pending capture: URL-encoded hex normalizes", () => {
  assert.equal(normalizeReferralCode("A1B2C3D4E5F6"), "a1b2c3d4e5f6");
  assert.equal(normalizeReferralCode("%41%42%43%44%45%46"), "abcdef");
});

test("referral pending capture: record has no auth secrets", () => {
  const record = createPendingRecord("abcdef123456", { now: Date.now() });
  assert.equal(pendingRecordHasSecrets(record), false);
  assert.equal("token" in record, false);
  assert.equal("handle" in record, false);
});

test("referral pending capture: adapter persists to mock storage", () => {
  const storage = createMockPendingStorage();
  const adapter = createPendingAdapter(storage);
  const now = 1_700_000_000_000;
  const decision = resolvePendingCapture(null, "abc123def456", now);
  adapter.writePending(decision.record);
  const parsed = adapter.readPending(now);
  assert.equal(parsed.code, "abc123def456");
});

test("referral pending capture: click fires only on create", () => {
  const now = Date.now();
  const existing = createPendingRecord("abc123def456", { now: now - 1000 });
  const again = resolvePendingCapture(existing, "abc123def456", now);
  assert.equal(again.sendClick, false);
  assert.equal(again.action, "keep");
});
