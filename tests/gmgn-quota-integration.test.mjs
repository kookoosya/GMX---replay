import test from "node:test";
import assert from "node:assert/strict";
import Database from "better-sqlite3";
import { CONFIG } from "../server/config.mjs";
import {
  ensureFreeGenSchema,
  migrateFreeGenFromLegacy,
  getFreeGenState,
  consumeFreeGenAtomic,
  freeGenLimitsFromPromo,
  buildUsageGenerationPayload,
} from "../server/free-gen-quota.mjs";
import { registerGenerateRoutes } from "../server/routes/generate.mjs";

function makeDb() {
  const db = new Database(":memory:");
  db.exec(`
    CREATE TABLE users (
      handle TEXT PRIMARY KEY,
      created_at TEXT,
      free_gen_used INTEGER NOT NULL DEFAULT 0,
      free_gen_gm_used INTEGER NOT NULL DEFAULT 0,
      free_gen_gn_used INTEGER NOT NULL DEFAULT 0,
      free_gen_migrated INTEGER NOT NULL DEFAULT 0
    );
    CREATE TABLE usage_daily (
      handle TEXT NOT NULL,
      day TEXT NOT NULL,
      kind TEXT NOT NULL,
      used INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (handle, day, kind)
    );
  `);
  db.prepare("INSERT INTO users(handle, created_at) VALUES(?,?)").run("@u", new Date().toISOString());
  const safeDb = (fn) => fn();
  return { db, safeDb };
}

function mockExpressApp() {
  const routes = [];
  return {
    routes,
    get(path, ...handlers) {
      routes.push({ method: "GET", path, handlers });
    },
  };
}

function installGenerateRoute(deps) {
  const app = mockExpressApp();
  registerGenerateRoutes({
    app,
    requireAuth: (_req, _res, next) => next(),
    sendError: (res, code, err) => {
      res.status(code);
      res.json({ ok: false, error: err });
    },
    ERROR_CODES: { SERVER_ERROR: "server_error" },
    parseAntiLastN: () => 5,
    normLang: (l) => l || "en",
    generateUnique: deps.generateUnique || (() => "generated line"),
    generateRankedCandidates: deps.generateRankedCandidates || (() => ["a", "b"]),
    saveRecent: () => {},
    userByHandle: () => ({ handle: "@u" }),
    subscriptionInfo: deps.subscriptionInfo || (() => ({ active: false })),
    getReferralPromoterSummary: async () => deps.promo || { dailyBonus: 0 },
    awardReferralBonus: () => {},
    maybeAwardStarterReward: () => {},
    safeDb: deps.safeDb,
    db: deps.db,
    CONFIG,
    logActivity: () => {},
    sbSumLegacyGenUsed: async () => 0,
  });
  return app;
}

async function callGenerate(app, query = {}) {
  const route = app.routes.find((r) => r.path === "/api/generate");
  const handler = route.handlers[route.handlers.length - 1];
  const req = {
    user: { handle: "@u" },
    query: { kind: "gm", mode: "mid", lang: "en", style: "classic", ...query },
  };
  let status = 0;
  let body = null;
  const res = {
    status(code) {
      status = code;
      return this;
    },
    json(payload) {
      if (!status) status = 200;
      body = payload;
      return this;
    },
  };
  await handler(req, res);
  return { status, body };
}

async function callBulk(app, query = {}) {
  const route = app.routes.find((r) => r.path === "/api/generate-bulk");
  const handler = route.handlers[route.handlers.length - 1];
  const req = {
    user: { handle: "@u" },
    query: { kind: "gm", mode: "mid", lang: "en", style: "classic", count: 10, ...query },
  };
  let status = 0;
  let body = null;
  const res = {
    status(code) {
      status = code;
      return this;
    },
    json(payload) {
      if (!status) status = 200;
      body = payload;
      return this;
    },
  };
  await handler(req, res);
  return { status, body };
}

test("new free user starts with 50 shared base credits", () => {
  const { db, safeDb } = makeDb();
  const limits = freeGenLimitsFromPromo(CONFIG, { dailyBonus: 0 });
  const state = getFreeGenState(safeDb, db, "@u", limits.total);
  const payload = buildUsageGenerationPayload(state, limits, false);
  assert.equal(limits.base, 50);
  assert.equal(limits.total, 50);
  assert.equal(state.used, 0);
  assert.equal(payload.remaining, 50);
  assert.equal(payload.resetAt, null);
  assert.equal(payload.shared, true);
});

test("25 GM + 25 GN exhaust shared 50 credit pool", () => {
  const { db, safeDb } = makeDb();
  const limits = freeGenLimitsFromPromo(CONFIG, { dailyBonus: 0 });
  for (let i = 0; i < 25; i++) {
    const r = consumeFreeGenAtomic(safeDb, db, "@u", 1, limits.total, "gm");
    assert.equal(r.ok, true, `gm consume ${i + 1}`);
  }
  for (let i = 0; i < 25; i++) {
    const r = consumeFreeGenAtomic(safeDb, db, "@u", 1, limits.total, "gn");
    assert.equal(r.ok, true, `gn consume ${i + 1}`);
  }
  const state = getFreeGenState(safeDb, db, "@u", limits.total);
  assert.equal(state.used, 50);
  assert.equal(state.gmUsed, 25);
  assert.equal(state.gnUsed, 25);
  assert.equal(state.remaining, 0);
});

test("51st generation of any kind is blocked server-side", () => {
  const { db, safeDb } = makeDb();
  const limits = freeGenLimitsFromPromo(CONFIG, { dailyBonus: 0 });
  consumeFreeGenAtomic(safeDb, db, "@u", 50, limits.total, "gm");
  const blockedGm = consumeFreeGenAtomic(safeDb, db, "@u", 1, limits.total, "gm");
  const blockedGn = consumeFreeGenAtomic(safeDb, db, "@u", 1, limits.total, "gn");
  assert.equal(blockedGm.ok, false);
  assert.equal(blockedGn.ok, false);
});

test("batch 10 blocked when remaining is 1", async () => {
  const { db, safeDb } = makeDb();
  consumeFreeGenAtomic(safeDb, db, "@u", 49, 50, "gm");
  const app = installGenerateRoute({ db, safeDb, generateRankedCandidates: () => Array.from({ length: 10 }, (_, i) => `line${i}`) });
  const { status, body } = await callBulk(app, { count: 10 });
  assert.equal(status, 429);
  assert.equal(body.error, "limit_reached");
  assert.equal(getFreeGenState(safeDb, db, "@u", 50).used, 49);
});

test("quick 1 allowed when remaining is 1", async () => {
  const { db, safeDb } = makeDb();
  consumeFreeGenAtomic(safeDb, db, "@u", 49, 50, "gm");
  const app = installGenerateRoute({ db, safeDb });
  const { status, body } = await callGenerate(app);
  assert.equal(status, 200);
  assert.equal(body.ok, true);
  assert.equal(getFreeGenState(safeDb, db, "@u", 50).used, 50);
});

test("empty provider response does not consume credits", async () => {
  const { db, safeDb } = makeDb();
  const app = installGenerateRoute({ db, safeDb, generateUnique: () => "" });
  const { status } = await callGenerate(app);
  assert.equal(status, 502);
  assert.equal(getFreeGenState(safeDb, db, "@u", 50).used, 0);
});

test("provider error does not consume credits", async () => {
  const { db, safeDb } = makeDb();
  const app = installGenerateRoute({
    db,
    safeDb,
    generateUnique: () => {
      throw new Error("provider_fail");
    },
  });
  const { status } = await callGenerate(app);
  assert.equal(status, 500);
  assert.equal(getFreeGenState(safeDb, db, "@u", 50).used, 0);
});

test("pro bypass does not enforce free cap", async () => {
  const { db, safeDb } = makeDb();
  consumeFreeGenAtomic(safeDb, db, "@u", 50, 50, "gm");
  const app = installGenerateRoute({ db, safeDb, subscriptionInfo: () => ({ active: true }) });
  const { status, body } = await callGenerate(app);
  assert.equal(status, 200);
  assert.equal(body.ok, true);
  assert.equal(body.usage.limit, null);
  assert.equal(getFreeGenState(safeDb, db, "@u", 50).used, 50);
});

test("referral bonus is separate from base 50 in limits payload", () => {
  const limits = freeGenLimitsFromPromo(CONFIG, { dailyBonus: 10 });
  assert.equal(limits.base, 50);
  assert.equal(limits.bonus, 10);
  assert.equal(limits.total, 60);
});

test("legacy daily usage migrates into lifetime counter idempotently", () => {
  const { db, safeDb } = makeDb();
  db.prepare("INSERT INTO usage_daily(handle, day, kind, used) VALUES(?,?,?,?)").run("@u", "2026-01-01", "gm", 30);
  db.prepare("INSERT INTO usage_daily(handle, day, kind, used) VALUES(?,?,?,?)").run("@u", "2026-01-02", "gn", 15);
  migrateFreeGenFromLegacy(safeDb, db, "@u", 50);
  migrateFreeGenFromLegacy(safeDb, db, "@u", 50);
  const state = getFreeGenState(safeDb, db, "@u", 50);
  assert.equal(state.used, 45);
  const row = db.prepare("SELECT free_gen_migrated FROM users WHERE handle=?").get("@u");
  assert.equal(row.free_gen_migrated, 1);
});

test("concurrent consume cannot exceed remaining balance", () => {
  const { db, safeDb } = makeDb();
  ensureFreeGenSchema(safeDb, db);
  consumeFreeGenAtomic(safeDb, db, "@u", 48, 50, "gm");
  const results = [];
  for (let i = 0; i < 5; i++) {
    results.push(consumeFreeGenAtomic(safeDb, db, "@u", 1, 50, "gm"));
  }
  const okCount = results.filter((r) => r.ok).length;
  assert.ok(okCount <= 2);
  assert.equal(getFreeGenState(safeDb, db, "@u", 50).used, 50);
});
