/**
 * Referral anti-abuse: self-referral, one inviter, fraud boundaries.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { freePort, spawnTestServer, freshSmokeHandle } from "../tools/tests/_helpers.mjs";
import { initSession, inviteRowCount } from "./lib/referral-test-helpers.mjs";

test("self-referral: same handle with own code creates no invite", async () => {
  const port = await freePort();
  const { child, base, dbPath } = await spawnTestServer(port);
  try {
    const inviter = freshSmokeHandle("ss");
    const inv = await initSession(base, inviter);
    assert.equal(inv.status, 200);
    const self = await initSession(base, inviter, inv.body.refCode, {
      Authorization: `Bearer ${inv.body.token}`,
    });
    assert.equal(self.status, 200);
    assert.equal(inviteRowCount(dbPath, inviter, inviter), 0);
  } finally {
    child.kill("SIGTERM");
  }
});

test("self-referral: case variation of same handle blocked", async () => {
  const port = await freePort();
  const { child, base, dbPath } = await spawnTestServer(port);
  try {
    const baseHandle = freshSmokeHandle("sc").replace(/^@/, "");
    const inviter = `@${baseHandle}`;
    const variant = `@${baseHandle.toUpperCase()}`;
    const inv = await initSession(base, inviter);
    const self = await initSession(base, variant, inv.body.refCode);
    assert.equal(self.status, 200);
    assert.equal(inviteRowCount(dbPath, inviter, variant), 0);
  } finally {
    child.kill("SIGTERM");
  }
});

test("anti-abuse: one invited account has at most one inviter", async () => {
  const port = await freePort();
  const { child, base, dbPath } = await spawnTestServer(port);
  try {
    const inviterA = freshSmokeHandle("s1");
    const inviterB = freshSmokeHandle("s2");
    const invitee = freshSmokeHandle("sv");
    const a = await initSession(base, inviterA);
    const b = await initSession(base, inviterB);
    await initSession(base, invitee, a.body.refCode);
    await initSession(base, invitee, b.body.refCode);
    const db = (await import("better-sqlite3")).default;
    const sqlite = new db(dbPath, { readonly: true });
    const rows = sqlite
      .prepare("SELECT inviter_handle FROM referral_invites WHERE invited_handle=?")
      .all(invitee);
    sqlite.close();
    assert.equal(rows.length, 1);
    assert.equal(rows[0].inviter_handle, inviterA);
  } finally {
    child.kill("SIGTERM");
  }
});
