/**
 * Referral first-touch policy before server confirmation.
 */
import test from "node:test";
import assert from "node:assert/strict";
import {
  createPendingRecord,
  resolvePendingCapture,
  resolveRefForInit,
} from "../tools/lib/referral-pending-core.mjs";

test("referral first-touch: second code does not overwrite pending", () => {
  const now = 1_700_000_000_000;
  const first = createPendingRecord("aaa111bbb222", { now });
  const second = resolvePendingCapture(first, "ccc333ddd444", now + 1000);
  assert.equal(second.action, "keep");
  assert.equal(second.record.code, "aaa111bbb222");
});

test("referral first-touch: URL ref wins at init over different pending", () => {
  const now = Date.now();
  const pending = createPendingRecord("aaa111bbb222", { now });
  const ref = resolveRefForInit(pending, "ccc333ddd444", now);
  assert.equal(ref, "ccc333ddd444");
});

test("referral first-touch: confirmed inviter policy is server-side (second init ignored)", async () => {
  const { freePort, spawnTestServer, freshSmokeHandle } = await import("../tools/tests/_helpers.mjs");
  const { initSession, inviteRowCount } = await import("./lib/referral-test-helpers.mjs");
  const port = await freePort();
  const { child, base, dbPath } = await spawnTestServer(port);
  try {
    const inviterA = freshSmokeHandle("fta");
    const inviterB = freshSmokeHandle("ftb");
    const invitee = freshSmokeHandle("fty");
    const a = await initSession(base, inviterA);
    const b = await initSession(base, inviterB);
    const join = await initSession(base, invitee, a.body.refCode);
    assert.equal(join.status, 200);
    const retry = await initSession(base, invitee, b.body.refCode, {
      Authorization: `Bearer ${join.body.token}`,
    });
    assert.equal(retry.status, 200);
    assert.equal(inviteRowCount(dbPath, inviterA, invitee), 1);
    assert.equal(inviteRowCount(dbPath, inviterB, invitee), 0);
  } finally {
    child.kill("SIGTERM");
  }
});
