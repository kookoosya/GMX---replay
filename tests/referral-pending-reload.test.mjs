/**
 * Referral pending reload / navigation persistence.
 */
import test from "node:test";
import assert from "node:assert/strict";
import {
  REF_PENDING_TTL_MS,
  createPendingRecord,
  parsePendingRecord,
  resolvePendingCapture,
  resolveRefForInit,
  serializePending,
} from "../tools/lib/referral-pending-core.mjs";
import { createMockPendingStorage, createPendingAdapter } from "./lib/referral-pending-test-helpers.mjs";

test("referral reload: pending survives empty query", () => {
  const now = 1_700_000_000_000;
  const storage = createMockPendingStorage();
  const adapter = createPendingAdapter(storage);
  const first = resolvePendingCapture(null, "abc123def456", now);
  adapter.writePending(first.record);
  const reload = resolvePendingCapture(adapter.readPending(now), "", now);
  assert.equal(reload.action, "keep");
  const ref = resolveRefForInit(adapter.readPending(now), "", now);
  assert.equal(ref, "abc123def456");
});

test("referral reload: internal navigation keeps pending (no query)", () => {
  const now = Date.now();
  const storage = createMockPendingStorage({
    gmx_ref_pending_v1: serializePending(createPendingRecord("fedcba987654", { now })),
  });
  const adapter = createPendingAdapter(storage);
  assert.equal(resolveRefForInit(adapter.readPending(now), "", now), "fedcba987654");
});

test("referral reload: does not extend TTL on same code revisit", () => {
  const captured = 1_700_000_000_000;
  const existing = createPendingRecord("abc123def456", { now: captured });
  const later = captured + 3 * 24 * 60 * 60 * 1000;
  const decision = resolvePendingCapture(existing, "abc123def456", later);
  assert.equal(decision.action, "keep");
  assert.equal(decision.record.expiresAt, captured + REF_PENDING_TTL_MS);
});

test("referral reload: expired pending is not applied", () => {
  const captured = 1_000_000_000_000;
  const expired = captured + REF_PENDING_TTL_MS + 1;
  const raw = serializePending(createPendingRecord("abc123def456", { now: captured }));
  assert.equal(parsePendingRecord(raw, expired), null);
  assert.equal(resolveRefForInit(null, "", expired), "");
});

test("referral reload: expired record clears on read via adapter purge", () => {
  const captured = 1_000_000_000_000;
  const storage = createMockPendingStorage({
    gmx_ref_pending_v1: serializePending(createPendingRecord("abc123def456", { now: captured })),
  });
  const adapter = createPendingAdapter(storage);
  const expiredAt = captured + REF_PENDING_TTL_MS + 1;
  assert.equal(adapter.readPending(expiredAt), null);
  adapter.purgeExpired = (now) => {
    const p = parsePendingRecord(storage.lsGet("gmx_ref_pending_v1", ""), now);
    if (!p) storage.lsRemove("gmx_ref_pending_v1");
    return p;
  };
  adapter.purgeExpired(expiredAt);
  assert.equal(storage.lsGet("gmx_ref_pending_v1", ""), "");
});
