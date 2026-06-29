/**
 * Wallet payment recovery after signature: persistence, reload verify, idempotency.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SIG = "MockTransactionSignatureForTests1111111111";
const PAYER = "2idG5EVab4ATDHSTXUmqEaKzrorNJEMjBhTDgcPT3Bfb";

function withStorage(run) {
  const mem = new Map();
  globalThis.localStorage = {
    getItem: (k) => (mem.has(k) ? mem.get(k) : null),
    setItem: (k, v) => mem.set(k, String(v)),
    removeItem: (k) => mem.delete(k),
  };
  return run(mem);
}

function loadHelpers() {
  const code = readFileSync(path.join(root, "public", "app.wallethelpers.js"), "utf8");
  const fn = new Function("window", `${code}; return window.__GMXWalletHelpersFactory();`);
  return fn({});
}

function loadWalletUi(overrides = {}) {
  const helpers = loadHelpers();
  const code = readFileSync(path.join(root, "public", "app.walletui.js"), "utf8");
  const fn = new Function("window", `${code}; return window.__GMXWalletUiFactory;`);
  const create = fn({});
  const els = {
    w_recovery_box: { className: "hidden", classList: { toggle() {}, add() {}, remove() {} } },
    w_recovery_title: { textContent: "" },
    w_recovery_msg: { textContent: "" },
    w_recovery_check: { className: "", classList: { toggle() {}, add() {}, remove() {} }, disabled: false },
    w_recovery_dismiss: { className: "", classList: { toggle() {}, add() {}, remove() {} } },
    w_msg: { innerHTML: "", textContent: "" },
    sf_pay: { disabled: false },
    token_SOL: { disabled: false, classList: { toggle() {}, remove() {}, add() {} } },
    token_USDC: { disabled: false, classList: { toggle() {}, remove() {}, add() {} } },
    token_USDT: { disabled: false, classList: { toggle() {}, remove() {}, add() {} } },
    w_token_availability: { textContent: "", className: "hidden", classList: { remove() {}, add() {} } },
  };
  let billing = { plans: [], tokenAvailability: { SOL: { available: true }, USDC: { available: true }, USDT: { available: true } }, solAvailable: true };
  const ui = create({
    $: (id) => els[id] || null,
    escapeHtml: (s) => String(s || ""),
    siteTr: (_k, fb) => String(fb || ""),
    getHandle: () => "@demo_user",
    getToken: () => "tok",
    getBilling: () => billing,
    setBilling: (v) => { billing = v; },
    getSelectedCurrency: () => "USDC",
    setSelectedCurrency: () => {},
    getSelectedPlan: () => ({ key: "m1", days: 30, label: "1 month" }),
    getSelectedPlanKey: () => "m1",
    setSelectedPlanKey: () => {},
    setSelectedPlan: () => {},
    getWallet: () => ({ connected: true, publicKey: PAYER }),
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
    openPaySuccess: () => {},
    refreshUsage: async () => {},
    loadBillingProof: async () => {},
    loadActivity: async () => {},
    renderWalletStatus: () => {},
    bindWalletToIntent: async () => ({}),
    buildPaymentTx: async () => ({ tx: {}, connection: {} }),
    walletSendTransaction: async () => SIG,
    ...overrides,
  });
  return { ui, els, helpers };
}

test("helpers: save/load/clear payment recovery roundtrip", () => {
  withStorage(() => {
    const h = loadHelpers();
    const ok = h.savePaymentRecovery({
      intentId: "intent_1",
      sig: SIG,
      payer: PAYER,
      handle: "@demo_user",
      token: "USDC",
      planKey: "m1",
      planLabel: "1 month",
      expiresAt: new Date(Date.now() + 600000).toISOString(),
    });
    assert.equal(ok, true);
    const rec = h.loadPaymentRecovery();
    assert.equal(rec.intentId, "intent_1");
    assert.equal(rec.sig, SIG);
    h.clearPaymentRecovery();
    assert.equal(h.loadPaymentRecovery(), null);
  });
});

test("helpers: corrupted recovery JSON does not throw", () => {
  withStorage((mem) => {
    mem.set("gmx_pay_recovery_v1", "{not-json");
    const h = loadHelpers();
    assert.equal(h.loadPaymentRecovery(), null);
  });
});

test("helpers: verify lock prevents concurrent verify loops", () => {
  withStorage(() => {
    const h = loadHelpers();
    assert.equal(h.acquireVerifyLock(), true);
    assert.equal(h.acquireVerifyLock(), false);
    h.releaseVerifyLock();
    assert.equal(h.acquireVerifyLock(), true);
  });
});

test("walletui: payNow stores signature before verify", async () => {
  withStorage(() => {
    return (async () => {
      let verifyCalls = 0;
      const helpers = loadHelpers();
      const { ui } = loadWalletUi({
        verifyIntentWithRetry: async () => {
          verifyCalls += 1;
          const rec = helpers.loadPaymentRecovery();
          assert.ok(rec);
          assert.equal(rec.sig, SIG);
          throw new Error("payment_not_verified");
        },
        api: async (path, method) => {
          if (path === "/api/billing/intent" && method === "POST") {
            return { id: "intent_1", bindMessage: "bind", plan: { key: "m1", label: "1 month", days: 30 }, expiresAt: new Date(Date.now() + 600000).toISOString() };
          }
          throw new Error(`unexpected ${path}`);
        },
      });
      await ui.payNow();
      assert.equal(verifyCalls, 1);
      const rec = helpers.loadPaymentRecovery();
      assert.ok(rec);
      assert.equal(rec.sig, SIG);
    })();
  });
});

test("walletui: reload recovery verifies without sending another transaction", async () => {
  await withStorage(async () => {
    let sendCalls = 0;
    let verifyCalls = 0;
    const helpers = loadHelpers();
    helpers.savePaymentRecovery({
      intentId: "intent_reload",
      sig: SIG,
      payer: PAYER,
      handle: "@demo_user",
      token: "USDC",
      planKey: "m1",
      planLabel: "1 month",
      expiresAt: new Date(Date.now() + 600000).toISOString(),
    });
    const { ui } = loadWalletUi({
      walletSendTransaction: async () => {
        sendCalls += 1;
        return SIG;
      },
      verifyIntentWithRetry: async () => {
        verifyCalls += 1;
        return { ok: true, sub: { active: true, paidUntil: "2026-08-01T00:00:00.000Z" } };
      },
    });
    await ui.tryResumePaymentRecovery({ autoVerify: true });
    assert.equal(sendCalls, 0);
    assert.equal(verifyCalls, 1);
    assert.equal(helpers.loadPaymentRecovery(), null);
  });
});

test("walletui: recovery refuses different handle", async () => {
  await withStorage(async () => {
    const helpers = loadHelpers();
    helpers.savePaymentRecovery({
      intentId: "intent_x",
      sig: SIG,
      payer: PAYER,
      handle: "@other_user",
      token: "USDC",
      expiresAt: new Date(Date.now() + 600000).toISOString(),
    });
    const { ui, els } = loadWalletUi();
    await ui.tryResumePaymentRecovery({ autoVerify: false });
    assert.match(els.w_recovery_msg.textContent, /different @handle/i);
  });
});

test("walletui: recovery success modal only once per signature", async () => {
  await withStorage(async () => {
    let successCalls = 0;
    const helpers = loadHelpers();
    helpers.savePaymentRecovery({
      intentId: "intent_ok",
      sig: SIG,
      payer: PAYER,
      handle: "@demo_user",
      token: "USDC",
      planKey: "m1",
      planLabel: "1 month",
      expiresAt: new Date(Date.now() + 600000).toISOString(),
    });
    const { ui } = loadWalletUi({
      verifyIntentWithRetry: async () => ({ ok: true, sub: { active: true, paidUntil: "2026-08-01T00:00:00.000Z" } }),
      openPaySuccess: () => { successCalls += 1; },
    });
    await ui.tryResumePaymentRecovery({ autoVerify: true });
    assert.equal(successCalls, 1);
    helpers.savePaymentRecovery({
      intentId: "intent_ok2",
      sig: SIG,
      payer: PAYER,
      handle: "@demo_user",
      token: "USDC",
      planKey: "m1",
      planLabel: "1 month",
      expiresAt: new Date(Date.now() + 600000).toISOString(),
    });
    await ui.tryResumePaymentRecovery({ autoVerify: true });
    assert.equal(successCalls, 1);
  });
});

test("wallet html exposes recovery controls", () => {
  const html = readFileSync(path.join(root, "public", "app.html"), "utf8");
  for (const id of ["w_recovery_box", "w_recovery_check", "w_recovery_dismiss", "w_token_availability"]) {
    assert.match(html, new RegExp(`id="${id}"`));
  }
});
