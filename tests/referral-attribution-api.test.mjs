/**
 * Referral attribution: init with ref, idempotency, inviter immutability.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { freePort, spawnTestServer, freshSmokeHandle } from "../tools/tests/_helpers.mjs";
import {
  initSession,
  authGet,
  inviteRowCount,
} from "./lib/referral-test-helpers.mjs";

test("referral attribution: valid ref on init creates confirmed invite", async () => {
  const port = await freePort();
  const { child, base, dbPath } = await spawnTestServer(port);
  try {
    const inviter = freshSmokeHandle("ri");
    const invitee = freshSmokeHandle("rv");
    const inv = await initSession(base, inviter);
    assert.equal(inv.status, 200);
    const refCode = inv.body.refCode;
    assert.ok(refCode);

    const join = await initSession(base, invitee, refCode);
    assert.equal(join.status, 200);

    assert.equal(inviteRowCount(dbPath, inviter, invitee), 1);

    const stats = await authGet(base, "/api/referral/stats", inv.body.token);
    assert.equal(stats.status, 200);
    assert.equal(stats.body.confirmedRefs, 1);
    assert.ok(String(stats.body.refLink || "").includes(`ref=${refCode}`));
    assert.ok(stats.body.refLink.startsWith("http"));
  } finally {
    child.kill("SIGTERM");
  }
});

test("referral attribution: duplicate init with same ref is idempotent", async () => {
  const port = await freePort();
  const { child, base, dbPath } = await spawnTestServer(port);
  try {
    const inviter = freshSmokeHandle("rd");
    const invitee = freshSmokeHandle("rx");
    const inv = await initSession(base, inviter);
    const refCode = inv.body.refCode;

    const first = await initSession(base, invitee, refCode);
    assert.equal(first.status, 200);
    const second = await initSession(base, invitee, refCode, {
      Authorization: `Bearer ${first.body.token}`,
    });
    assert.equal(second.status, 200);
    assert.equal(inviteRowCount(dbPath, inviter, invitee), 1);
  } finally {
    child.kill("SIGTERM");
  }
});

test("referral attribution: second code does not replace confirmed inviter", async () => {
  const port = await freePort();
  const { child, base, dbPath } = await spawnTestServer(port);
  try {
    const inviterA = freshSmokeHandle("ra");
    const inviterB = freshSmokeHandle("rb");
    const invitee = freshSmokeHandle("ry");
    const a = await initSession(base, inviterA);
    const b = await initSession(base, inviterB);
    const joinA = await initSession(base, invitee, a.body.refCode);
    assert.equal(joinA.status, 200);
    const joinB = await initSession(base, invitee, b.body.refCode, {
      Authorization: `Bearer ${joinA.body.token}`,
    });
    assert.equal(joinB.status, 200);
    assert.equal(inviteRowCount(dbPath, inviterA, invitee), 1);
    assert.equal(inviteRowCount(dbPath, inviterB, invitee), 0);
  } finally {
    child.kill("SIGTERM");
  }
});

test("referral attribution: invalid ref code does not break init", async () => {
  const port = await freePort();
  const { child, base } = await spawnTestServer(port);
  try {
    const invitee = freshSmokeHandle("rz");
    const join = await initSession(base, invitee, "not_a_real_code_zzz");
    assert.equal(join.status, 200);
    assert.equal(join.body.ok, true);
  } finally {
    child.kill("SIGTERM");
  }
});

test("referral attribution: concurrent new-user apply keeps one invite row", async () => {
  const port = await freePort();
  const { child, base, dbPath } = await spawnTestServer(port);
  try {
    const inviter = freshSmokeHandle("rc");
    const invitee = freshSmokeHandle("rw");
    const inv = await initSession(base, inviter);
    const refCode = inv.body.refCode;
    const results = await Promise.allSettled([
      initSession(base, invitee, refCode),
      initSession(base, invitee, refCode),
    ]);
    const ok = results.filter((r) => r.status === "fulfilled" && r.value.status === 200);
    assert.ok(ok.length >= 1, "at least one init should succeed");
    assert.equal(inviteRowCount(dbPath, inviter, invitee), 1);
  } finally {
    child.kill("SIGTERM");
  }
});
