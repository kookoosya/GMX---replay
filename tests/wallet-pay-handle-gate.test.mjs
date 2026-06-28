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
  const els = { w_msg: { innerHTML: "" }, sf_pay: { disabled: false } };
  let navigatedHome = false;
  const ui = create({
    $: (id) => els[id] || null,
    escapeHtml: (s) => String(s || ""),
    siteTr: (_key, fallback) => String(fallback || ""),
    getHandle: () => "",
    getToken: () => "",
    requireConnected: () => false,
    onNavigateHome: () => {
      navigatedHome = true;
    },
    api: async () => {
      throw new Error("billing intent should not run without handle session");
    },
    getWallet: () => ({ connected: true, publicKey: "AbCdEfGh1234567890123456789012345678" }),
    getSelectedPlan: () => ({ key: "m1", days: 30, label: "Monthly" }),
    getSelectedCurrency: () => "SOL",
    abVariant: () => "A",
    trackEvent: () => {},
    setPayState: () => {},
    openPaySuccess: () => {},
    getBilling: () => ({ plans: [] }),
    ...overrides,
  });
  return { ui, els, getNavigatedHome: () => navigatedHome };
}

test("walletui: payNow blocks checkout without connected handle session", async () => {
  const { ui, els, getNavigatedHome } = makeWalletUi();
  await ui.payNow();
  assert.match(els.w_msg.innerHTML, /Connect your @handle on Home first/i);
  assert.equal(getNavigatedHome(), true);
});

test("walletui: payNow proceeds when handle session is present", async () => {
  let intentCalled = false;
  const { ui } = makeWalletUi({
    getHandle: () => "@demo_user",
    getToken: () => "tok_demo",
    bindWalletToIntent: async () => ({}),
    buildPaymentTx: async () => ({ tx: {}, connection: {} }),
    walletSendTransaction: async () => "sig_demo",
    verifyIntentWithRetry: async () => ({ sub: { active: true } }),
    api: async (path, method) => {
      if (path === "/api/billing/intent" && method === "POST") {
        intentCalled = true;
        return { id: "intent_demo", bindMessage: "bind" };
      }
      return {};
    },
    refreshUsage: async () => {},
    loadBillingProof: async () => {},
    loadActivity: async () => {},
  });
  await ui.payNow();
  assert.equal(intentCalled, true);
});

test("en locale defines wallet pay handle gate copy", () => {
  const en = JSON.parse(readFileSync(path.join(root, "shared", "i18n", "locales", "en.json"), "utf8"));
  assert.ok(en.wallet_pay_connect_handle_first);
  assert.match(en.wallet_pay_connect_handle_first, /@handle/i);
});
