/**
 * SOL payment availability: server plans contract + wallet UI behavior.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { freePort, spawnTestServer, freshSmokeHandle } from "../tools/tests/_helpers.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

async function initSession(base, handle) {
  const res = await fetch(`${base}/api/user/init`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ handle }),
  });
  assert.equal(res.status, 200);
  const body = await res.json();
  return body;
}

function loadHelpers() {
  const mem = new Map();
  globalThis.localStorage = {
    getItem: (k) => (mem.has(k) ? mem.get(k) : null),
    setItem: (k, v) => mem.set(k, String(v)),
    removeItem: (k) => mem.delete(k),
  };
  const code = readFileSync(path.join(root, "public", "app.wallethelpers.js"), "utf8");
  const fn = new Function("window", `${code}; return window.__GMXWalletHelpersFactory();`);
  return fn({});
}

function loadWalletUi(overrides = {}) {
  const helpers = loadHelpers();
  const code = readFileSync(path.join(root, "public", "app.walletui.js"), "utf8");
  const fn = new Function("window", `${code}; return window.__GMXWalletUiFactory;`);
  const win = {};
  const create = fn(win);
  const els = {
    token_SOL: { disabled: false, className: "tokenBtn active", classList: { toggle() {}, remove() {}, add() {} }, setAttribute() {} },
    token_USDC: { disabled: false, className: "tokenBtn", classList: { toggle() {}, remove() {}, add() {} }, setAttribute() {} },
    token_USDT: { disabled: false, className: "tokenBtn", classList: { toggle() {}, remove() {}, add() {} }, setAttribute() {} },
    w_token_availability: { textContent: "", className: "hidden", classList: { remove() {}, add() {} } },
    sf_pay: { disabled: false },
    w_msg: { innerHTML: "", textContent: "" },
  };
  let billing = { plans: [{ key: "m1", usd: 10, days: 30, label: "1 month", solApprox: 0 }], tokenAvailability: { SOL: { available: false, reason: "price_unavailable" }, USDC: { available: true }, USDT: { available: true } }, solAvailable: false, solUsd: 0 };
  let currency = "SOL";
  const ui = create({
    $: (id) => els[id] || null,
    escapeHtml: (s) => String(s || ""),
    siteTr: (_k, fb) => String(fb || ""),
    getHandle: () => "@demo",
    getToken: () => "tok",
    api: async () => billing,
    getBilling: () => billing,
    setBilling: (v) => { billing = v; },
    getSelectedCurrency: () => currency,
    setSelectedCurrency: (v) => { currency = v; },
    getSelectedPlan: () => ({ key: "m1", days: 30, label: "1 month" }),
    getSelectedPlanKey: () => "m1",
    setSelectedPlanKey: () => {},
    setSelectedPlan: () => {},
    getWallet: () => ({ connected: true, publicKey: "2idG5EVab4ATDHSTXUmqEaKzrorNJEMjBhTDgcPT3Bfb" }),
    planPricePrimary: helpers.planPricePrimary,
    planPriceSecondary: helpers.planPriceSecondary,
    isTokenAvailable: helpers.isTokenAvailable,
    firstAvailableToken: helpers.firstAvailableToken,
    savePaymentRecovery: helpers.savePaymentRecovery,
    loadPaymentRecovery: helpers.loadPaymentRecovery,
    clearPaymentRecovery: helpers.clearPaymentRecovery,
    wasRecoverySuccessShown: helpers.wasRecoverySuccessShown,
    markRecoverySuccessShown: helpers.markRecoverySuccessShown,
    acquireVerifyLock: helpers.acquireVerifyLock,
    releaseVerifyLock: helpers.releaseVerifyLock,
    isRecoveryExpired: helpers.isRecoveryExpired,
    normPayHandle: helpers.normPayHandle,
    setPayState: () => {},
    ...overrides,
  });
  return { ui, els, helpers, getCurrency: () => currency };
}

test("GET /api/billing/plans marks SOL unavailable when oracle mock is 0", async () => {
  const prev = process.env.GMX_SOL_USD_MOCK;
  process.env.GMX_SOL_USD_MOCK = "0";
  const port = await freePort();
  const { child, base } = await spawnTestServer(port);
  try {
    const res = await fetch(`${base}/api/billing/plans`);
    const j = await res.json();
    assert.equal(j.ok, true);
    assert.equal(j.solAvailable, false);
    assert.equal(j.tokenAvailability.SOL.available, false);
    assert.equal(j.tokenAvailability.USDC.available, true);
    assert.equal(j.tokenAvailability.USDT.available, true);
    const sol = j.tokens.find((t) => t.key === "SOL");
    assert.equal(sol.available, false);
    assert.equal(sol.unavailableReason, "price_unavailable");
  } finally {
    child.kill("SIGTERM");
    process.env.GMX_SOL_USD_MOCK = prev;
  }
});

test("GET /api/billing/plans marks SOL available when oracle mock is healthy", async () => {
  const prev = process.env.GMX_SOL_USD_MOCK;
  process.env.GMX_SOL_USD_MOCK = "150";
  const port = await freePort();
  const { child, base } = await spawnTestServer(port);
  try {
    const res = await fetch(`${base}/api/billing/plans`);
    const j = await res.json();
    assert.equal(j.solAvailable, true);
    assert.equal(j.tokenAvailability.SOL.available, true);
    assert.ok(j.plans[0].solApprox > 0);
  } finally {
    child.kill("SIGTERM");
    process.env.GMX_SOL_USD_MOCK = prev;
  }
});

test("POST /api/billing/intent SOL returns price_unavailable when oracle mock is 0", async () => {
  const prev = process.env.GMX_SOL_USD_MOCK;
  process.env.GMX_SOL_USD_MOCK = "0";
  const port = await freePort();
  const { child, base } = await spawnTestServer(port);
  try {
    const handle = freshSmokeHandle("sa");
    const { token } = await initSession(base, handle);
    const res = await fetch(`${base}/api/billing/intent`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ planKey: "m1", currency: "SOL" }),
    });
    assert.equal(res.status, 503);
    assert.equal((await res.json()).error, "price_unavailable");
  } finally {
    child.kill("SIGTERM");
    process.env.GMX_SOL_USD_MOCK = prev;
  }
});

test("POST /api/billing/intent USDC still works when SOL oracle mock is 0", async () => {
  const prev = process.env.GMX_SOL_USD_MOCK;
  process.env.GMX_SOL_USD_MOCK = "0";
  const port = await freePort();
  const { child, base } = await spawnTestServer(port);
  try {
    const handle = freshSmokeHandle("su");
    const { token } = await initSession(base, handle);
    const res = await fetch(`${base}/api/billing/intent`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ planKey: "m1", currency: "USDC" }),
    });
    assert.equal(res.status, 200);
    const j = await res.json();
    assert.equal(j.currency, "USDC");
    assert.equal(j.amountBase, "10000000");
  } finally {
    child.kill("SIGTERM");
    process.env.GMX_SOL_USD_MOCK = prev;
  }
});

test("walletui: applyTokenAvailability disables SOL and switches to USDC", async () => {
  const { ui, els, getCurrency } = loadWalletUi();
  ui.applyTokenAvailability();
  assert.equal(els.token_SOL.disabled, true);
  assert.equal(els.token_USDC.disabled, false);
  assert.equal(getCurrency(), "USDC");
  assert.match(els.w_token_availability.textContent, /USDC or USDT/i);
});

test("walletui: payNow blocks SOL intent when SOL unavailable", async () => {
  let intentCalls = 0;
  const { ui } = loadWalletUi({
    api: async (path, method) => {
      if (path === "/api/billing/intent" && method === "POST") {
        intentCalls += 1;
        throw new Error("should not reach");
      }
      return { plans: [], tokenAvailability: { SOL: { available: false }, USDC: { available: true }, USDT: { available: true } }, solAvailable: false };
    },
    getSelectedCurrency: () => "SOL",
    isTokenAvailable: (_b, cur) => cur !== "SOL",
    firstAvailableToken: () => "USDC",
  });
  await ui.payNow();
  assert.equal(intentCalls, 0);
});

test("helpers: isTokenAvailable reads tokenAvailability from billing payload", () => {
  const helpers = loadHelpers();
  const billing = {
    tokenAvailability: { SOL: { available: false, reason: "price_unavailable" }, USDC: { available: true }, USDT: { available: true } },
    solUsd: 0,
  };
  assert.equal(helpers.isTokenAvailable(billing, "SOL"), false);
  assert.equal(helpers.isTokenAvailable(billing, "USDC"), true);
  assert.equal(helpers.firstAvailableToken(billing), "USDC");
});
