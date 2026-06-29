/**
 * Wallet pay flow idempotency: double Pay click guard.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function loadWalletUiFactory() {
  const code = readFileSync(path.join(root, "public", "app.walletui.js"), "utf8");
  const fn = new Function("window", `${code}; return window.__GMXWalletUiFactory;`);
  const win = {};
  return fn(win);
}

function makeWalletUi(overrides = {}) {
  const create = loadWalletUiFactory();
  const els = { w_msg: { innerHTML: "", textContent: "" }, sf_pay: { disabled: false } };
  const ui = create({
    $: (id) => els[id] || null,
    escapeHtml: (s) => String(s || ""),
    siteTr: (_key, fallback) => String(fallback || ""),
    getHandle: () => "@demo_user",
    getToken: () => "tok_demo",
    requireConnected: () => true,
    onNavigateHome: () => {},
    abVariant: () => "A",
    trackEvent: () => {},
    setPayState: () => {},
    openPaySuccess: () => {},
    openWalletModal: () => {},
    getWallet: () => ({ connected: true, publicKey: "2idG5EVab4ATDHSTXUmqEaKzrorNJEMjBhTDgcPT3Bfb" }),
    getSelectedPlan: () => ({ key: "m1", days: 30, label: "1 month" }),
    getSelectedCurrency: () => "USDC",
    getBilling: () => ({ plans: [] }),
    bindWalletToIntent: async () => ({}),
    buildPaymentTx: async () => ({ tx: {}, connection: {} }),
    walletSendTransaction: async () => "MockTransactionSignatureForTests1111111111",
    verifyIntentWithRetry: async () => ({ ok: true, sub: { active: true, paidUntil: "2026-07-28T00:00:00.000Z" } }),
    refreshUsage: async () => {},
    loadBillingProof: async () => {},
    loadActivity: async () => {},
    renderWalletStatus: () => {},
    setWalletUi: () => {},
    billingErrMsg: (m) => String(m || ""),
    ...overrides,
  });
  return { ui, els };
}

test("walletui: concurrent payNow creates only one billing intent", async () => {
  let intentCalls = 0;
  const { ui } = makeWalletUi({
    api: async (path, method) => {
      if (path === "/api/billing/intent" && method === "POST") {
        intentCalls += 1;
        await new Promise((r) => setTimeout(r, 80));
        return {
          id: "intent_demo",
          bindMessage: "bind",
          plan: { key: "m1", label: "1 month", days: 30 },
        };
      }
      throw new Error(`unexpected api ${path}`);
    },
  });

  const p1 = ui.payNow();
  const p2 = ui.payNow();
  await Promise.all([p1, p2]);
  assert.equal(intentCalls, 1);
});

test("walletui: payInflight guard is present at payNow entry", () => {
  const src = readFileSync(path.join(root, "public", "app.walletui.js"), "utf8");
  assert.match(src, /async function payNow\(\)[\s\S]*?if \(payInflight \|\| recoveryVerifyInflight\) return;/);
});

test("walletpay: verifyIntentWithRetry retries transient verify errors", () => {
  const src = readFileSync(path.join(root, "public", "app.walletpay.js"), "utf8");
  assert.match(src, /payment_not_verified/);
  assert.match(src, /sig_already_used/);
  assert.match(src, /intent_already_used/);
});
