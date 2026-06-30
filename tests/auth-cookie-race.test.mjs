import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

function loadAuthWithLocks(navLocks) {
  globalThis.localStorage = {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {},
  };
  const code = readFileSync(join(root, "public", "app.auth.js"), "utf8");
  const fn = new Function("window", `${code}; return window.__GMXAuthFactory;`);
  const win = {};
  if (navLocks !== undefined) {
    win.navigator = { locks: navLocks };
  }
  return fn(win)({
    API: "http://127.0.0.1:10000",
    LS_HANDLE: "gmx_handle",
    LS_TOKEN: "gmx_token",
    LS_IS_ADMIN: "gmx_is_admin",
    LS_ADMIN_CLAIMABLE: "gmx_admin_claimable",
    isLocalDevHost: () => false,
    getAdminToken: () => "",
    setAuthOk: () => {},
    $: () => null,
    t: (k) => k,
    toast: () => {},
    escapeHtml: (s) => s,
    applyAdminVisibility: () => {},
    ping: () => {},
    setDegraded: () => {},
  });
}

test("fail-before: cookie lock must be held before cross-tab logout may finish", async () => {
  let releaseFirst;
  let resolveSecond;
  let firstInside = false;
  let secondCbStarted = false;
  let logoutFetched = false;
  const auth = loadAuthWithLocks({
    request(_name, _opts, cb) {
      if (!firstInside) {
        firstInside = true;
        return new Promise((resolve) => {
          releaseFirst = () => resolve(cb());
        });
      }
      return new Promise((resolve) => {
        resolveSecond = () => {
          secondCbStarted = true;
          resolve(cb());
        };
      });
    },
  });
  globalThis.fetch = async (url) => {
    const path = String(url);
    if (path.includes("/api/user/logout")) {
      logoutFetched = true;
    }
    return {
      ok: true,
      headers: { get: () => "application/json" },
      json: async () => ({ ok: true, token: "tok", handle: "@demo" }),
    };
  };
  const initP = auth.api("/api/user/init", "POST", { handle: "@demo" });
  await Promise.resolve();
  const logoutP = auth.api("/api/user/logout", "POST");
  await Promise.resolve();
  assert.equal(secondCbStarted, false);
  assert.equal(logoutFetched, false, "logout must wait while init holds cookie lock");
  releaseFirst();
  await Promise.resolve();
  resolveSecond();
  await Promise.all([initP, logoutP]);
  assert.equal(logoutFetched, true);
});

test("auth force_logout guard rejects stale init restore", () => {
  const authSrc = readFileSync(join(root, "public", "app.auth.js"), "utf8");
  const connectSrc = readFileSync(join(root, "public", "app.connect.js"), "utf8");
  const bridgeApiSrc = readFileSync(join(root, "frontend", "src", "api.ts"), "utf8");
  assert.match(authSrc, /sessionApplyBlocked/);
  assert.match(authSrc, /clearStaleAuthCookie/);
  assert.match(authSrc, /forceLogoutAfter/);
  assert.match(connectSrc, /forceLogoutAfter/);
  assert.match(bridgeApiSrc, /gmx_ext_force_logout_v2/);
});

test("delayed init after logout does not restore token in storage", async () => {
  const store = new Map();
  globalThis.localStorage = {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, v),
    removeItem: (k) => store.delete(k),
  };
  const auth = loadAuthWithLocks({
    request(_n, _o, cb) {
      return cb();
    },
  });
  globalThis.fetch = async (url) => {
    const path = String(url);
    if (path.includes("/api/user/logout")) {
      return { ok: true, headers: { get: () => "application/json" }, json: async () => ({ ok: true }) };
    }
    return {
      ok: true,
      headers: { get: () => "application/json" },
      json: async () => ({ ok: true, token: "stale-token", handle: "@demo" }),
    };
  };
  store.set("gmx_handle", "@demo");
  const pending = auth.initSession(true);
  auth.invalidatePendingSessionInit();
  store.delete("gmx_token");
  const tok = await pending;
  assert.equal(tok, null);
  assert.equal(store.has("gmx_token"), false);
});

test("concurrent init and logout serialize through cookie mutation lock", async () => {
  const auth = loadAuthWithLocks(undefined);
  const order = [];
  globalThis.fetch = async (url) => {
    order.push(String(url));
    return {
      ok: true,
      headers: { get: () => "application/json" },
      json: async () => ({ ok: true, token: "tok", handle: "@demo" }),
    };
  };
  await Promise.all([
    auth.api("/api/user/init", "POST", { handle: "@demo" }),
    auth.api("/api/user/logout", "POST"),
  ]);
  assert.equal(order.length, 2);
  assert.match(order[0], /\/api\/user\/init$/);
  assert.match(order[1], /\/api\/user\/logout$/);
});

test("harness race D waits for initHeld before bridge logout", () => {
  const src = readFileSync(join(root, "tools/tests/e2e-auth-cookie-race.mjs"), "utf8");
  assert.match(src, /const initHeld = createGate\(\)/);
  assert.match(src, /await initHeld\.wait/);
  assert.match(src, /await pageB\.goto\(`\$\{base\}\/bridge`/);
  assert.doesNotMatch(
    src,
    /await initHeld\.wait[\s\S]*await pageB\.goto\(`\$\{base\}\/bridge`/
  );
});

test("logout and init share one exclusive cookie mutation lock name", () => {
  const authSrc = readFileSync(join(root, "public", "app.auth.js"), "utf8");
  const bridgeApiSrc = readFileSync(join(root, "frontend", "src", "api.ts"), "utf8");
  assert.match(authSrc, /gmx-auth-cookie-mutation/);
  assert.match(bridgeApiSrc, /gmx-auth-cookie-mutation/);
});

test("existing_session_required contract preserved on init route", () => {
  const userRoute = readFileSync(join(root, "server", "routes", "user.mjs"), "utf8");
  assert.match(userRoute, /existing_session_required/);
});

test("admin auth routes remain separate from user cookie mutation", () => {
  const adminRoute = readFileSync(join(root, "server", "routes", "admin-auth.mjs"), "utf8");
  const authSrc = readFileSync(join(root, "public", "app.auth.js"), "utf8");
  assert.match(adminRoute, /\/api\/admin\/logout/);
  assert.doesNotMatch(authSrc, /\/api\/admin\/logout/);
});
