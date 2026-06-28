/**
 * Behavioral reliability: GET /api/generate and /api/generate-bulk.
 */
import test from "node:test";
import assert from "node:assert/strict";
import Database from "better-sqlite3";
import { freePort, spawnTestServer, freshSmokeHandle } from "../tools/tests/_helpers.mjs";
import { CONFIG } from "../server/config.mjs";
import { getFreeGenState, consumeFreeGenAtomic } from "../server/free-gen-quota.mjs";

function assertJsonSerializable(payload) {
  const text = JSON.stringify(payload);
  assert.ok(!/\bundefined\b/.test(text));
  assert.doesNotThrow(() => JSON.parse(text));
}

function assertGenerateContract(body, { kind, quick = true } = {}) {
  assert.equal(body.ok, true);
  assert.equal(body.kind, kind);
  if (quick) {
    assert.ok(typeof body.reply === "string" && body.reply.trim());
    assert.ok(!/\[object Object\]|undefined|null/i.test(body.reply));
  } else {
    assert.ok(Array.isArray(body.list) && body.list.length > 0);
    for (const line of body.list) {
      assert.ok(typeof line === "string" && line.trim());
      assert.ok(!/\[object Object\]|undefined|null/i.test(line));
    }
  }
  assert.ok(body.usage && typeof body.usage.used === "number");
  assert.equal(body.usage.resetAt, null);
  assert.equal(body.usage.shared, true);
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

async function callGenerate(base, token, query = {}, { cookie = false } = {}) {
  const qs = new URLSearchParams(query).toString();
  const headers = {};
  if (token && cookie) headers.Cookie = `gmx_token=${token}`;
  else if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${base}/api/generate?${qs}`, { headers });
  const body = await res.json().catch(() => ({}));
  return { status: res.status, body };
}

async function callBulk(base, token, query = {}) {
  const qs = new URLSearchParams(query).toString();
  const res = await fetch(`${base}/api/generate-bulk?${qs}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const body = await res.json().catch(() => ({}));
  return { status: res.status, body };
}

function setRemaining(dbPath, handle, used, total = 50) {
  const db = new Database(dbPath);
  try {
    db.prepare(
      "UPDATE users SET free_gen_used=?, free_gen_migrated=1 WHERE handle=?"
    ).run(Math.max(0, used), handle);
  } finally {
    db.close();
  }
  return total - used;
}

function setPro(dbPath, handle, active) {
  const db = new Database(dbPath);
  try {
    if (active) {
      const until = new Date(Date.now() + 30 * 86400000).toISOString();
      db.prepare("UPDATE users SET tier='paid', paid_until=? WHERE handle=?").run(until, handle);
    }
  } finally {
    db.close();
  }
}

test("fail-before: provider throw yields 500 and does not consume credits", async () => {
  const { registerGenerateRoutes } = await import("../server/routes/generate.mjs");
  const db = new Database(":memory:");
  db.exec(`
    CREATE TABLE users (
      handle TEXT PRIMARY KEY, created_at TEXT,
      free_gen_used INTEGER NOT NULL DEFAULT 0,
      free_gen_gm_used INTEGER NOT NULL DEFAULT 0,
      free_gen_gn_used INTEGER NOT NULL DEFAULT 0,
      free_gen_migrated INTEGER NOT NULL DEFAULT 0
    );
    CREATE TABLE usage_daily (
      handle TEXT NOT NULL, day TEXT NOT NULL, kind TEXT NOT NULL,
      used INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (handle, day, kind)
    );
  `);
  db.prepare("INSERT INTO users(handle, created_at) VALUES(?,?)").run("@u", new Date().toISOString());
  const safeDb = (fn) => fn();
  const routes = [];
  registerGenerateRoutes({
    app: { get(p, ...h) { routes.push({ path: p, handler: h[h.length - 1] }); } },
    requireAuth: (_r, _s, n) => n(),
    sendError: (res, code, err) => { res.status(code); res.json({ ok: false, error_code: err }); },
    ERROR_CODES: { SERVER_ERROR: "server_error" },
    parseAntiLastN: () => 5,
    normLang: (l) => l || "en",
    generateUnique: () => { throw new Error("provider_fail"); },
    generateRankedCandidates: () => ["a"],
    saveRecent: () => {},
    userByHandle: () => ({ handle: "@u" }),
    subscriptionInfo: () => ({ active: false }),
    getReferralPromoterSummary: async () => ({ dailyBonus: 0 }),
    awardReferralBonus: () => {},
    maybeAwardStarterReward: () => {},
    safeDb,
    db,
    CONFIG,
    logActivity: () => {},
    sbSumLegacyGenUsed: async () => 0,
  });
  const handler = routes.find((r) => r.path === "/api/generate").handler;
  let status = 0;
  let body = null;
  const res = {
    status(c) { status = c; return this; },
    json(p) { if (!status) status = 200; body = p; return this; },
  };
  await handler({ user: { handle: "@u" }, query: { kind: "gm", mode: "mid", lang: "en", style: "classic" } }, res);
  assert.equal(status, 500);
  assert.equal(getFreeGenState(safeDb, db, "@u", 50).used, 0);
  db.close();
});

let serverCtx;

test.before(async () => {
  serverCtx = await spawnTestServer(await freePort());
  await initSession(serverCtx.base, freshSmokeHandle("z"));
});

test.after(async () => {
  if (serverCtx?.child) {
    serverCtx.child.kill("SIGTERM");
    await new Promise((r) => setTimeout(r, 300));
    try { serverCtx.child.kill("SIGKILL"); } catch {}
  }
  if (serverCtx?.dbPath) {
    try {
      const { unlinkSync } = await import("node:fs");
      unlinkSync(serverCtx.dbPath);
    } catch {}
  }
});

test("valid Free GM Quick 1 → 200", async () => {
  const init = await initSession(serverCtx.base, freshSmokeHandle("g"));
  const { status, body } = await callGenerate(serverCtx.base, init.token, {
    kind: "gm", mode: "mid", lang: "en", style: "classic",
  });
  assert.equal(status, 200);
  assertGenerateContract(body, { kind: "gm", quick: true });
});

test("valid Free GN Quick 1 → 200", async () => {
  const init = await initSession(serverCtx.base, freshSmokeHandle("n"));
  const { status, body } = await callGenerate(serverCtx.base, init.token, {
    kind: "gn", mode: "mid", lang: "en", style: "classic",
  });
  assert.equal(status, 200);
  assertGenerateContract(body, { kind: "gn", quick: true });
});

test("valid Pro GM/GN → 200 with unlimited usage", async () => {
  const handle = freshSmokeHandle("p");
  const init = await initSession(serverCtx.base, handle);
  setPro(serverCtx.dbPath, init.handle, true);
  const gm = await callGenerate(serverCtx.base, init.token, { kind: "gm", mode: "mid", lang: "en", style: "classic" });
  assert.equal(gm.status, 200);
  assert.equal(gm.body.usage.limit, null);
  const gn = await callGenerate(serverCtx.base, init.token, { kind: "gn", mode: "min", lang: "en", style: "classic" });
  assert.equal(gn.status, 200);
});

test("cookie auth → 200", async () => {
  const init = await initSession(serverCtx.base, freshSmokeHandle("c"));
  const { status, body } = await callGenerate(
    serverCtx.base,
    init.token,
    { kind: "gm", mode: "mid", lang: "en", style: "classic" },
    { cookie: true }
  );
  assert.equal(status, 200);
  assert.equal(body.ok, true);
});

test("Bearer auth → 200", async () => {
  const init = await initSession(serverCtx.base, freshSmokeHandle("b"));
  const { status } = await callGenerate(serverCtx.base, init.token, {
    kind: "gm", mode: "mid", lang: "en", style: "classic",
  });
  assert.equal(status, 200);
});

test("legacy migrated user → 200", async () => {
  const init = await initSession(serverCtx.base, freshSmokeHandle("l"));
  const db = new Database(serverCtx.dbPath);
  db.prepare("UPDATE users SET free_gen_migrated=0, free_gen_used=0 WHERE handle=?").run(init.handle);
  db.close();
  const { status, body } = await callGenerate(serverCtx.base, init.token, {
    kind: "gm", mode: "mid", lang: "en", style: "classic",
  });
  assert.equal(status, 200);
  assert.equal(body.ok, true);
});

test("missing kind → 400", async () => {
  const init = await initSession(serverCtx.base, freshSmokeHandle("k"));
  const { status } = await callGenerate(serverCtx.base, init.token, { mode: "mid", lang: "en", style: "classic" });
  assert.equal(status, 400);
});

test("invalid kind → 400", async () => {
  const init = await initSession(serverCtx.base, freshSmokeHandle("i"));
  const { status, body } = await callGenerate(serverCtx.base, init.token, {
    kind: "xx", mode: "mid", lang: "en", style: "classic",
  });
  assert.equal(status, 400);
  assert.equal(body.ok, false);
});

test("invalid mode → 400", async () => {
  const init = await initSession(serverCtx.base, freshSmokeHandle("m"));
  const { status } = await callGenerate(serverCtx.base, init.token, {
    kind: "gm", mode: "bad", lang: "en", style: "classic",
  });
  assert.equal(status, 400);
});

test("invalid auth → 401", async () => {
  const { status, body } = await callGenerate(serverCtx.base, "deadbeefdeadbeefdeadbeef", {
    kind: "gm", mode: "mid", lang: "en", style: "classic",
  });
  assert.equal(status, 401);
  assert.equal(body.ok, false);
});

test("unauthenticated → 401", async () => {
  const res = await fetch(`${serverCtx.base}/api/generate?kind=gm&mode=mid&lang=en&style=classic`);
  const body = await res.json();
  assert.equal(res.status, 401);
  assert.equal(body.ok, false);
});

test("remaining=0 → 429 limit_reached not 500", async () => {
  const init = await initSession(serverCtx.base, freshSmokeHandle("0"));
  setRemaining(serverCtx.dbPath, init.handle, 50);
  const { status, body } = await callGenerate(serverCtx.base, init.token, {
    kind: "gm", mode: "mid", lang: "en", style: "classic",
  });
  assert.equal(status, 429);
  assert.equal(body.error, "limit_reached");
});

test("remaining=1 Quick 1 → 200", async () => {
  const init = await initSession(serverCtx.base, freshSmokeHandle("1"));
  setRemaining(serverCtx.dbPath, init.handle, 49);
  const { status, body } = await callGenerate(serverCtx.base, init.token, {
    kind: "gm", mode: "mid", lang: "en", style: "classic",
  });
  assert.equal(status, 200);
  assert.equal(body.ok, true);
});

test("remaining=1 Batch 10 → 429 before provider", async () => {
  const init = await initSession(serverCtx.base, freshSmokeHandle("r"));
  setRemaining(serverCtx.dbPath, init.handle, 49);
  const { status, body } = await callBulk(serverCtx.base, init.token, {
    kind: "gm", mode: "mid", lang: "en", style: "classic", count: "10",
  });
  assert.equal(status, 429);
  assert.equal(body.error, "limit_reached");
  const db = new Database(serverCtx.dbPath);
  const used = db.prepare("SELECT free_gen_used FROM users WHERE handle=?").get(init.handle)?.free_gen_used;
  db.close();
  assert.equal(used, 49);
});

test("valid Batch → 200 and charges actual lines", async () => {
  const init = await initSession(serverCtx.base, freshSmokeHandle("q"));
  const { status, body } = await callBulk(serverCtx.base, init.token, {
    kind: "gn", mode: "mid", lang: "en", style: "classic", count: "4",
  });
  assert.equal(status, 200);
  assertGenerateContract(body, { kind: "gn", quick: false });
  assert.ok(body.count >= 1);
});

test("GM response kind cannot be GN", async () => {
  const init = await initSession(serverCtx.base, freshSmokeHandle("a"));
  const { body } = await callGenerate(serverCtx.base, init.token, {
    kind: "gm", mode: "mid", lang: "en", style: "classic",
  });
  assert.equal(body.kind, "gm");
});

test("GN response kind cannot be GM", async () => {
  const init = await initSession(serverCtx.base, freshSmokeHandle("d"));
  const { body } = await callGenerate(serverCtx.base, init.token, {
    kind: "gn", mode: "mid", lang: "en", style: "classic",
  });
  assert.equal(body.kind, "gn");
});

test("error response does not leak stack", async () => {
  const init = await initSession(serverCtx.base, freshSmokeHandle("e"));
  const { body } = await callGenerate(serverCtx.base, init.token, { kind: "xx", mode: "mid" });
  const text = JSON.stringify(body);
  assert.ok(!/at Object\.|node_modules|\.mjs:\d+/i.test(text));
});

test("concurrent remaining=1 allows at most one successful charge", async () => {
  const init = await initSession(serverCtx.base, freshSmokeHandle("x"));
  setRemaining(serverCtx.dbPath, init.handle, 49);
  const q = { kind: "gm", mode: "mid", lang: "en", style: "classic" };
  const results = await Promise.all([
    callGenerate(serverCtx.base, init.token, q),
    callGenerate(serverCtx.base, init.token, q),
    callGenerate(serverCtx.base, init.token, q),
  ]);
  const okCount = results.filter((r) => r.status === 200 && r.body.ok).length;
  const limitCount = results.filter((r) => r.status === 429).length;
  assert.ok(okCount <= 1);
  assert.ok(okCount + limitCount >= 1);
  const db = new Database(serverCtx.dbPath);
  const used = db.prepare("SELECT free_gen_used FROM users WHERE handle=?").get(init.handle)?.free_gen_used;
  db.close();
  assert.ok(used <= 50);
});
