/**
 * Billing API contract: plans, intent validation, verify idempotency.
 */
import test from "node:test";
import assert from "node:assert/strict";
import Database from "better-sqlite3";
import { BILLING_PLANS, BILLING_TOKENS, SOL_RECEIVER } from "../server/config.mjs";
import { freePort, spawnTestServer, freshSmokeHandle } from "../tools/tests/_helpers.mjs";

async function initSession(base, handle) {
  const res = await fetch(`${base}/api/user/init`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ handle }),
  });
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.ok, true);
  return body;
}

async function postIntent(base, token, body) {
  return fetch(`${base}/api/billing/intent`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

async function postVerify(base, token, body) {
  return fetch(`${base}/api/billing/verify`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

test("GET /api/billing/plans exposes server config plans and tokens", async () => {
  const port = await freePort();
  const { child, base } = await spawnTestServer(port);
  try {
    const res = await fetch(`${base}/api/billing/plans`);
    assert.equal(res.status, 200);
    const j = await res.json();
    assert.equal(j.ok, true);
    assert.equal(j.plans.length, BILLING_PLANS.length);
    assert.equal(j.tokens.length, BILLING_TOKENS.length);
    assert.equal(j.receiver, SOL_RECEIVER);
    for (const plan of BILLING_PLANS) {
      const row = j.plans.find((p) => p.key === plan.key);
      assert.ok(row, `missing plan ${plan.key}`);
      assert.equal(row.usd, plan.usd);
      assert.equal(row.days, plan.days);
      assert.equal(row.label, plan.label);
    }
    for (const token of BILLING_TOKENS) {
      assert.ok(j.tokens.some((t) => t.key === token.key), `missing token ${token.key}`);
    }
  } finally {
    child.kill("SIGTERM");
  }
});

test("POST /api/billing/intent requires auth", async () => {
  const port = await freePort();
  const { child, base } = await spawnTestServer(port);
  try {
    const res = await postIntent(base, "", { planKey: "m1", currency: "USDC" });
    assert.equal(res.status, 401);
    const j = await res.json();
    assert.equal(j.ok, false);
    assert.equal(j.error, "unauthorized");
  } finally {
    child.kill("SIGTERM");
  }
});

test("POST /api/billing/intent rejects invalid plan and currency with 4xx", async () => {
  const port = await freePort();
  const { child, base } = await spawnTestServer(port);
  try {
    const handle = freshSmokeHandle("wb");
    const { token } = await initSession(base, handle);

    const badPlan = await postIntent(base, token, { planKey: "bad_plan", currency: "USDC" });
    assert.equal(badPlan.status, 400);
    assert.equal((await badPlan.json()).error, "invalid_plan");

    const badCur = await postIntent(base, token, { planKey: "m1", currency: "BTC" });
    assert.equal(badCur.status, 400);
    assert.equal((await badCur.json()).error, "invalid_currency");
  } finally {
    child.kill("SIGTERM");
  }
});

test("POST /api/billing/intent USDC amount is server-derived from plan USD", async () => {
  const port = await freePort();
  const { child, base } = await spawnTestServer(port);
  try {
    const handle = freshSmokeHandle("wi");
    const { token } = await initSession(base, handle);
    const plan = BILLING_PLANS.find((p) => p.key === "m1");
    const res = await postIntent(base, token, { planKey: "m1", currency: "USDC" });
    assert.equal(res.status, 200);
    const j = await res.json();
    assert.equal(j.ok, true);
    assert.equal(j.plan.key, "m1");
    assert.equal(j.currency, "USDC");
    assert.equal(j.amountBase, String(BigInt(Math.round(plan.usd * 1e6))));
    assert.equal(j.amountUi, String(plan.usd));
    assert.equal(j.receiver, SOL_RECEIVER);
    assert.ok(j.expiresAt);
    assert.ok(j.bindMessage);
  } finally {
    child.kill("SIGTERM");
  }
});

test("POST /api/billing/verify is idempotent when signature already redeemed", async () => {
  const port = await freePort();
  const { child, base, dbPath } = await spawnTestServer(port);
  const sig = "MockTransactionSignatureForTests1111111111";
  const payer = SOL_RECEIVER;
  try {
    const handle = freshSmokeHandle("wv");
    const { token } = await initSession(base, handle);
    const until = new Date(Date.now() + 30 * 86400000).toISOString();
    const db = new Database(dbPath);
    try {
      db.prepare(
        "INSERT INTO payments(sig, handle, plan, currency, mint, amount, amount_base, payer, created_at) VALUES(?,?,?,?,?,?,?,?,?)"
      ).run(sig, handle, "m1", "USDC", null, 10, "10000000", payer, until);
      db.prepare("UPDATE users SET tier='paid', paid_until=? WHERE handle=?").run(until, handle);
    } finally {
      db.close();
    }

    const res = await postVerify(base, token, {
      intentId: "unused_intent_id",
      sig,
      payer,
    });
    assert.equal(res.status, 200);
    const j = await res.json();
    assert.equal(j.ok, true);
    assert.equal(j.sub.active, true);
    assert.ok(j.paid?.idempotent);
  } finally {
    child.kill("SIGTERM");
  }
});

test("POST /api/billing/verify rejects signature owned by another handle", async () => {
  const port = await freePort();
  const { child, base, dbPath } = await spawnTestServer(port);
  const sig = "AnotherMockTransactionSignatureForTests99999";
  try {
    const owner = freshSmokeHandle("wo");
    const other = freshSmokeHandle("wx");
    await initSession(base, owner);
    const { token: otherToken } = await initSession(base, other);
    const db = new Database(dbPath);
    try {
      db.prepare(
        "INSERT INTO payments(sig, handle, plan, currency, mint, amount, amount_base, payer, created_at) VALUES(?,?,?,?,?,?,?,?,?)"
      ).run(sig, owner, "m1", "USDC", null, 10, "10000000", SOL_RECEIVER, new Date().toISOString());
    } finally {
      db.close();
    }

    const res = await postVerify(base, otherToken, {
      intentId: "intent_x",
      sig,
      payer: SOL_RECEIVER,
    });
    assert.equal(res.status, 403);
    assert.equal((await res.json()).error, "sig_handle_mismatch");
  } finally {
    child.kill("SIGTERM");
  }
});
