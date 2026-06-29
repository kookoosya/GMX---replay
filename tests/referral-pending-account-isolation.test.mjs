/**
 * Referral account isolation: cleanup, logout, init retry.
 */
import test from "node:test";
import assert from "node:assert/strict";
import {
  createPendingRecord,
  resolveRefForInit,
  serializePending,
} from "../tools/lib/referral-pending-core.mjs";
import { createMockPendingStorage, createPendingAdapter } from "./lib/referral-pending-test-helpers.mjs";
import { freePort, spawnTestServer, freshSmokeHandle } from "../tools/tests/_helpers.mjs";
import { initSession, inviteRowCount } from "./lib/referral-test-helpers.mjs";

test("referral isolation: successful init clears pending", () => {
  const now = Date.now();
  const storage = createMockPendingStorage({
    gmx_ref_pending_v1: serializePending(createPendingRecord("abc123def456", { now })),
  });
  const adapter = createPendingAdapter(storage);
  adapter.clearPending();
  assert.equal(adapter.readPending(now), null);
});

test("referral isolation: logout keeps unused pending for next account", () => {
  const now = Date.now();
  const storage = createMockPendingStorage({
    gmx_ref_pending_v1: serializePending(createPendingRecord("abc123def456", { now })),
  });
  const adapter = createPendingAdapter(storage);
  assert.ok(adapter.readPending(now));
});

test("referral isolation: recovered ref creates one invite (reload simulation)", async () => {
  const port = await freePort();
  const { child, base, dbPath } = await spawnTestServer(port);
  try {
    const inviter = freshSmokeHandle("iso");
    const invitee = freshSmokeHandle("isv");
    const inv = await initSession(base, inviter);
    const refCode = inv.body.refCode;
    const join = await initSession(base, invitee, refCode);
    assert.equal(join.status, 200);
    assert.equal(inviteRowCount(dbPath, inviter, invitee), 1);
    const dup = await initSession(base, invitee, refCode, {
      Authorization: `Bearer ${join.body.token}`,
    });
    assert.equal(dup.status, 200);
    assert.equal(inviteRowCount(dbPath, inviter, invitee), 1);
  } finally {
    child.kill("SIGTERM");
  }
});

test("referral isolation: self-referral does not create invite", async () => {
  const port = await freePort();
  const { child, base, dbPath } = await spawnTestServer(port);
  try {
    const inviter = freshSmokeHandle("slf");
    const inv = await initSession(base, inviter);
    const self = await initSession(base, inviter, inv.body.refCode, {
      Authorization: `Bearer ${inv.body.token}`,
    });
    assert.equal(self.status, 200);
    assert.equal(inviteRowCount(dbPath, inviter, inviter), 0);
  } finally {
    child.kill("SIGTERM");
  }
});

test("referral isolation: invalid code init ok without invite", async () => {
  const port = await freePort();
  const { child, base, dbPath } = await spawnTestServer(port);
  try {
    const inviter = freshSmokeHandle("inv");
    const invitee = freshSmokeHandle("ivl");
    await initSession(base, inviter);
    const join = await initSession(base, invitee, "deadbeef0000");
    assert.equal(join.status, 200);
    assert.equal(inviteRowCount(dbPath, inviter, invitee), 0);
  } finally {
    child.kill("SIGTERM");
  }
});

test("referral isolation: pending resolves without URL query", () => {
  const now = Date.now();
  const pending = createPendingRecord("abc123def456", { now });
  assert.equal(resolveRefForInit(pending, "", now), "abc123def456");
});
