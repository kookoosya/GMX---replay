/**
 * Referral bonus integrates with lifetime quota: base 50 + separate bonus.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { CONFIG } from "../server/config.mjs";
import { freePort, spawnTestServer, freshSmokeHandle } from "../tools/tests/_helpers.mjs";
import {
  initSession,
  authGet,
  recordUsage,
  assertUsageBonus,
} from "./lib/referral-test-helpers.mjs";

async function makeEligibleReferral(base, dbPath, refCode, fp) {
  const invitee = freshSmokeHandle("qb");
  const join = await initSession(base, invitee, refCode, {}, { fp, method: "GET" });
  assert.equal(join.status, 200);
  recordUsage(dbPath, invitee, "gm", 1);
  return { invitee, join };
}

test("referral quota: base stays 50 without eligible referrals", async () => {
  const port = await freePort();
  const { child, base } = await spawnTestServer(port);
  try {
    const handle = freshSmokeHandle("q0");
    const sess = await initSession(base, handle);
    const me = await authGet(base, "/api/me", sess.body.token);
    const usage = await authGet(base, "/api/usage", sess.body.token);
    assert.equal(me.status, 200);
    assert.equal(usage.status, 200);
    assertUsageBonus(me.body, 0);
    assertUsageBonus({ limits: usage.body.limits }, 0);
  } finally {
    child.kill("SIGTERM");
  }
});

test("referral quota: 20 eligible referrals add +10 bonus once", async () => {
  const port = await freePort();
  const { child, base, dbPath } = await spawnTestServer(port);
  try {
    const inviter = freshSmokeHandle("q1");
    const inv = await initSession(base, inviter);
    const refCode = inv.body.refCode;
    for (let i = 0; i < 20; i++) {
      await makeEligibleReferral(base, dbPath, refCode, `fp_test_${i}`);
    }
    const usage = await authGet(base, "/api/usage", inv.body.token);
    assert.equal(usage.status, 200);
    const me = await authGet(base, "/api/me", inv.body.token);
    assertUsageBonus(me.body, 10);
    assertUsageBonus({ limits: usage.body.limits }, 10);
    const stats = await authGet(base, "/api/referral/stats", inv.body.token);
    assert.equal(stats.body.dailyBonus, 10);
    assert.equal(stats.body.freeDaily, CONFIG.FREE_DAILY_BASE);
  } finally {
    child.kill("SIGTERM");
  }
});

test("referral quota: duplicate qualification does not stack bonus", async () => {
  const port = await freePort();
  const { child, base, dbPath } = await spawnTestServer(port);
  try {
    const inviter = freshSmokeHandle("q2");
    const inv = await initSession(base, inviter);
    const refCode = inv.body.refCode;
    const { invitee } = await makeEligibleReferral(base, dbPath, refCode, "fp_dup_one");
    recordUsage(dbPath, invitee, "gn", 3);
    const usage1 = await authGet(base, "/api/usage", inv.body.token);
    const me1 = await authGet(base, "/api/me", inv.body.token);
    const usage2 = await authGet(base, "/api/usage", inv.body.token);
    assertUsageBonus(me1.body, 0);
    assertUsageBonus({ limits: usage1.body.limits }, 0);
    assert.equal(usage1.body.limits?.freeGenBonus, usage2.body.limits?.freeGenBonus);
  } finally {
    child.kill("SIGTERM");
  }
});
