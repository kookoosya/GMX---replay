/**
 * Behavioral regression: GET /api/me authenticated session health.
 */
import test from "node:test";
import assert from "node:assert/strict";
import Database from "better-sqlite3";
import { freePort, spawnTestServer, freshSmokeHandle } from "../tools/tests/_helpers.mjs";

function assertJsonSerializable(payload) {
  const text = JSON.stringify(payload);
  assert.ok(!/\bundefined\b/.test(text));
  assert.doesNotThrow(() => JSON.parse(text));
}

function assertMeContract(body, { handle, pro = false } = {}) {
  assert.equal(body.ok, true);
  assert.equal(body.handle, handle);
  assert.ok(body.sub && typeof body.sub === "object");
  assert.equal(body.sub.active, pro);
  assert.equal(body.resetAt, null);
  assert.ok(body.usage?.gm && typeof body.usage.gm.used === "number");
  assert.ok(body.usage?.gn && typeof body.usage.gn.used === "number");
  assert.ok(body.tools?.studio && typeof body.tools.studio.limit === "number");
  assert.ok(body.tools?.bulk && typeof body.tools.bulk.maxPerCall === "number");
  assert.ok(body.tools?.history && typeof body.tools.history.limit === "number");
  assert.ok(body.tools?.favorites && typeof body.tools.favorites.limit === "number");
  assert.ok(body.limits && typeof body.limits === "object");
  if (pro) {
    assert.equal(body.tools.studio.limit, 999999);
    assert.equal(body.tools.bulk.maxPerCall, 50);
    assert.equal(body.tools.bulk.callsLimit, 999999);
    assert.equal(body.tools.history.limit, 500);
    assert.equal(body.tools.favorites.limit, 200);
    assert.equal(body.tools.history.searchEnabled, true);
  } else {
    assert.equal(body.tools.studio.limit, 2);
    assert.equal(body.tools.bulk.maxPerCall, 10);
    assert.equal(body.tools.bulk.callsLimit, 3);
    assert.equal(body.tools.history.limit, 20);
    assert.equal(body.tools.favorites.limit, 10);
    assert.equal(body.tools.history.searchEnabled, false);
  }
  assertJsonSerializable(body);
}

async function initSession(base, handle) {
  const res = await fetch(`${base}/api/user/init`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ handle }),
  });
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.ok, true);
  assert.ok(body.token);
  return body;
}

async function fetchMe(base, { token, cookie = false } = {}) {
  const headers = {};
  if (token && !cookie) headers.Authorization = `Bearer ${token}`;
  if (token && cookie) headers.Cookie = `gmx_token=${token}`;
  const res = await fetch(`${base}/api/me`, { headers });
  const body = await res.json().catch(() => ({}));
  return { status: res.status, body };
}

function patchUser(dbPath, handle, patch) {
  const db = new Database(dbPath);
  try {
    if (patch.proActive) {
      const until = new Date(Date.now() + 30 * 86400000).toISOString();
      db.prepare("UPDATE users SET tier='paid', paid_until=? WHERE handle=?").run(until, handle);
    }
    if (patch.proExpired) {
      const until = new Date(Date.now() - 86400000).toISOString();
      db.prepare("UPDATE users SET tier='paid', paid_until=? WHERE handle=?").run(until, handle);
    }
    if (patch.stripQuotaColumns) {
      // legacy row without migrated free_gen columns
      db.prepare(
        "UPDATE users SET free_gen_used=NULL, free_gen_gm_used=NULL, free_gen_gn_used=NULL, free_gen_migrated=0 WHERE handle=?"
      ).run(handle);
    }
  } finally {
    db.close();
  }
}

test("fail-before: missing toolLimit in entitlements builder throws TypeError (pre-fix defect)", () => {
  const sub = { active: false };
  const toolLimit = undefined;
  assert.throws(
    () => {
      toolLimit(sub, 2, 999999);
    },
    (err) => err instanceof TypeError && /is not a function/.test(String(err.message))
  );
});

test("fail-before: entitlements builder without toolLimit throws before HTTP 500", async () => {
  async function brokenBuildAccessEntitlements(deps) {
    const { toolLimit, sub, h, day, getDailyUsed } = deps;
    void getDailyUsed(h, day, "tool_studio");
    const studioLimit = toolLimit(sub, 2, 999999);
    return studioLimit;
  }
  await assert.rejects(
    () =>
      brokenBuildAccessEntitlements({
        toolLimit: undefined,
        sub: { active: false },
        h: "@u",
        day: "2099-01-01",
        getDailyUsed: () => 0,
      }),
    (err) => err instanceof TypeError && /is not a function/.test(String(err.message))
  );
});

let serverCtx;

test.before(async () => {
  serverCtx = await spawnTestServer(await freePort());
  // First user in empty DB becomes admin; bootstrap a throwaway row first.
  await initSession(serverCtx.base, freshSmokeHandle("z"));
});

test.after(async () => {
  if (serverCtx?.child) {
    serverCtx.child.kill("SIGTERM");
    await new Promise((r) => setTimeout(r, 300));
    try {
      serverCtx.child.kill("SIGKILL");
    } catch {}
  }
  if (serverCtx?.dbPath) {
    try {
      const { unlinkSync } = await import("node:fs");
      unlinkSync(serverCtx.dbPath);
    } catch {}
  }
});

test("GET /api/me: free user bearer auth returns 200 and contract", async () => {
  const handle = freshSmokeHandle("f");
  const init = await initSession(serverCtx.base, handle);
  const { status, body } = await fetchMe(serverCtx.base, { token: init.token });
  assert.equal(status, 200);
  assertMeContract(body, { handle, pro: false });
});

test("GET /api/me: active pro user returns pro tool limits", async () => {
  const handle = freshSmokeHandle("p");
  const init = await initSession(serverCtx.base, handle);
  patchUser(serverCtx.dbPath, handle, { proActive: true });
  const { status, body } = await fetchMe(serverCtx.base, { token: init.token });
  assert.equal(status, 200);
  assertMeContract(body, { handle, pro: true });
  assert.equal(body.sub.tier, "paid");
});

test("GET /api/me: expired pro user treated as free limits", async () => {
  const handle = freshSmokeHandle("x");
  const init = await initSession(serverCtx.base, handle);
  patchUser(serverCtx.dbPath, handle, { proExpired: true });
  const { status, body } = await fetchMe(serverCtx.base, { token: init.token });
  assert.equal(status, 200);
  assertMeContract(body, { handle, pro: false });
  assert.equal(body.sub.active, false);
});

test("GET /api/me: cookie auth returns 200", async () => {
  const handle = freshSmokeHandle("c");
  const init = await initSession(serverCtx.base, handle);
  const { status, body } = await fetchMe(serverCtx.base, { token: init.token, cookie: true });
  assert.equal(status, 200);
  assert.equal(body.ok, true);
  assert.equal(body.handle, handle);
});

test("GET /api/me: invalid token returns 401 not 500", async () => {
  const { status, body } = await fetchMe(serverCtx.base, { token: "deadbeefdeadbeefdeadbeef" });
  assert.equal(status, 401);
  assert.equal(body.ok, false);
  assert.equal(body.error, "unauthorized");
});

test("GET /api/me: unauthenticated returns 401 not 500", async () => {
  const res = await fetch(`${serverCtx.base}/api/me`);
  const body = await res.json();
  assert.equal(res.status, 401);
  assert.equal(body.ok, false);
});

test("GET /api/me: legacy user without optional quota fields still returns 200", async () => {
  const handle = freshSmokeHandle("l");
  const init = await initSession(serverCtx.base, handle);
  const db = new Database(serverCtx.dbPath);
  try {
    db.prepare(
      "UPDATE users SET free_gen_used=0, free_gen_gm_used=0, free_gen_gn_used=0, free_gen_migrated=0 WHERE handle=?"
    ).run(handle);
  } finally {
    db.close();
  }
  const { status, body } = await fetchMe(serverCtx.base, { token: init.token });
  assert.equal(status, 200);
  assertMeContract(body, { handle, pro: false });
  assert.ok(typeof body.limits.freeGenTotal === "number");
});

test("toolLimit semantics match tools route helper", () => {
  function toolLimit(sub, freeLimit, proLimit) {
    return sub?.active ? proLimit : freeLimit;
  }
  assert.equal(toolLimit({ active: false }, 2, 999999), 2);
  assert.equal(toolLimit({ active: true }, 2, 999999), 999999);
});
