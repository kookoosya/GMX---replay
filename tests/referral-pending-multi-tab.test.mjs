/**
 * Referral multi-tab: shared storage, single invite row.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { serializePending, createPendingRecord, resolveRefForInit } from "../tools/lib/referral-pending-core.mjs";
import { createMockPendingStorage, createPendingAdapter } from "./lib/referral-pending-test-helpers.mjs";
import { freePort, spawnTestServer, freshSmokeHandle } from "../tools/tests/_helpers.mjs";
import { initSession, inviteRowCount } from "./lib/referral-test-helpers.mjs";

test("referral multi-tab: shared storage exposes same pending code", () => {
  const now = Date.now();
  const shared = createMockPendingStorage();
  const tabA = createPendingAdapter(shared);
  const tabB = createPendingAdapter(shared);
  tabA.writePending(createPendingRecord("abc123def456", { now }));
  assert.equal(tabB.readPending(now)?.code, "abc123def456");
  assert.equal(resolveRefForInit(tabB.readPending(now), "", now), "abc123def456");
});

test("referral multi-tab: clear in one tab removes pending for other", () => {
  const now = Date.now();
  const shared = createMockPendingStorage({
    gmx_ref_pending_v1: serializePending(createPendingRecord("abc123def456", { now })),
  });
  const tabA = createPendingAdapter(shared);
  const tabB = createPendingAdapter(shared);
  tabA.clearPending();
  assert.equal(tabB.readPending(now), null);
});

test("referral multi-tab: concurrent init keeps one invite row", async () => {
  const port = await freePort();
  const { child, base, dbPath } = await spawnTestServer(port);
  try {
    const inviter = freshSmokeHandle("mt");
    const invitee = freshSmokeHandle("mv");
    const inv = await initSession(base, inviter);
    const refCode = inv.body.refCode;
    const results = await Promise.allSettled([
      initSession(base, invitee, refCode),
      initSession(base, invitee, refCode),
    ]);
    const okCount = results.filter((r) => r.status === "fulfilled" && r.value.status === 200).length;
    assert.ok(okCount >= 1);
    assert.equal(inviteRowCount(dbPath, inviter, invitee), 1);
  } finally {
    child.kill("SIGTERM");
  }
});
