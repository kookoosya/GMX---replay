import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function loadFactory(file, exportName) {
  const code = readFileSync(path.join(root, "public", file), "utf8");
  const fn = new Function("window", `${code}; return window.${exportName};`);
  const win = {};
  return fn(win);
}

function makePaywall(overrides = {}) {
  const create = loadFactory("app.paywall.js", "__GMXPaywallFactory");
  const state = { opened: null };
  const els = {
    pay_success_title: { textContent: "" },
    pay_success_handle: { textContent: "" },
    pay_success_plan_label: { textContent: "" },
    pay_success_plan: { textContent: "" },
    pay_success_plan_row: { className: "paySuccessRow hidden", classList: { add() {}, remove() {} } },
    pay_success_until_label: { textContent: "" },
    pay_success_until: { textContent: "" },
    pay_success_until_row: { className: "paySuccessRow hidden", classList: { add() {}, remove() {} } },
    pay_success_ready: { textContent: "" },
  };

  const paywall = create({
    $: (id) => els[id] || null,
    modals: {
      openModal: (id) => {
        state.opened = id;
      },
    },
    storage: { lsGet: () => "", lsSet: () => {} },
    getHandle: () => "@fallback",
    siteTr: (_key, fb) => String(fb || ""),
    getSiteLocale: () => "en",
    ...overrides,
  });

  return { paywall, els, state };
}

function loadWalletUiFactory() {
  const code = readFileSync(path.join(root, "public", "app.walletui.js"), "utf8");
  const fn = new Function("window", `${code}; return window.__GMXWalletUiFactory;`);
  const win = {};
  return fn(win);
}

test("paywall: openPaySuccess shows confirmed handle plan and paidUntil", () => {
  const { paywall, els, state } = makePaywall();
  paywall.openPaySuccess({
    handle: "demo_user",
    planLabel: "Pro 1 month",
    sub: { active: true, paidUntil: "2026-07-28T12:00:00.000Z", isUnlimited: false },
  });

  assert.equal(state.opened, "pay_success_modal");
  assert.equal(els.pay_success_handle.textContent, "@demo_user");
  assert.equal(els.pay_success_plan.textContent, "Pro 1 month");
  assert.match(els.pay_success_until.textContent, /July/);
  assert.match(els.pay_success_until.textContent, /2026/);
  assert.equal(els.pay_success_ready.textContent, "Your Pro access is ready.");
});

test("paywall: openPaySuccess refuses inactive entitlement", () => {
  const { paywall, state } = makePaywall();
  paywall.openPaySuccess({
    handle: "@demo_user",
    planLabel: "Pro 1 month",
    sub: { active: false, paidUntil: null },
  });
  assert.equal(state.opened, null);
});

test("paywall: openPaySuccess hides optional rows when data missing", () => {
  const { paywall, els, state } = makePaywall();
  paywall.openPaySuccess({
    handle: "@demo_user",
    planLabel: "",
    sub: { active: true, paidUntil: "", isUnlimited: false },
  });
  assert.equal(state.opened, "pay_success_modal");
  assert.match(els.pay_success_plan_row.className, /hidden/);
  assert.match(els.pay_success_until_row.className, /hidden/);
});

test("paywall: formatPaidUntil rejects invalid values", () => {
  const { paywall } = makePaywall();
  assert.equal(paywall.formatPaidUntil(""), "");
  assert.equal(paywall.formatPaidUntil("not-a-date"), "");
  assert.equal(paywall.formatPaidUntil(null), "");
});

test("walletui: payNow opens success only after verified active sub", async () => {
  const create = loadWalletUiFactory();
  const els = { w_msg: { innerHTML: "" }, sf_pay: { disabled: false } };
  let verifyCalls = 0;
  let successPayload = null;
  let successCalls = 0;

  const ui = create({
    $: (id) => els[id] || null,
    escapeHtml: (s) => String(s || ""),
    siteTr: (_key, fb) => String(fb || ""),
    getHandle: () => "@demo_user",
    getToken: () => "tok",
    requireConnected: () => true,
    onNavigateHome: () => {},
    api: async (path, method) => {
      if (path === "/api/billing/intent" && method === "POST") {
        return {
          id: "intent_demo",
          bindMessage: "bind",
          plan: { key: "m1", label: "1 month", days: 30 },
        };
      }
      throw new Error(`unexpected api ${path}`);
    },
    abVariant: () => "A",
    trackEvent: () => {},
    setPayState: () => {},
    openPaySuccess: (payload) => {
      successCalls += 1;
      successPayload = payload;
    },
    getWallet: () => ({ connected: true, publicKey: "AbCdEfGh1234567890123456789012345678" }),
    getSelectedPlan: () => ({ key: "m1", days: 30, label: "1 month" }),
    getSelectedCurrency: () => "SOL",
    getBilling: () => ({ plans: [] }),
    bindWalletToIntent: async () => ({}),
    buildPaymentTx: async () => ({ tx: {}, connection: {} }),
    walletSendTransaction: async () => "sig_demo",
    verifyIntentWithRetry: async () => {
      verifyCalls += 1;
      return { ok: true, sub: { active: true, paidUntil: "2026-07-28T00:00:00.000Z", isUnlimited: false } };
    },
    refreshUsage: async () => {},
    loadBillingProof: async () => {},
    loadActivity: async () => {},
    renderWalletStatus: () => {},
  });

  await ui.payNow();

  assert.equal(verifyCalls, 1);
  assert.equal(successCalls, 1);
  assert.equal(successPayload.handle, "@demo_user");
  assert.equal(successPayload.planLabel, "Pro 1 month");
  assert.equal(successPayload.sub.active, true);
  assert.equal(successPayload.sub.paidUntil, "2026-07-28T00:00:00.000Z");
});

test("walletui: payNow does not open success modal on verify failure", async () => {
  const create = loadWalletUiFactory();
  const els = { w_msg: { innerHTML: "" }, sf_pay: { disabled: false } };
  let successCalls = 0;

  const ui = create({
    $: (id) => els[id] || null,
    escapeHtml: (s) => String(s || ""),
    siteTr: (_key, fb) => String(fb || ""),
    getHandle: () => "@demo_user",
    getToken: () => "tok",
    requireConnected: () => true,
    onNavigateHome: () => {},
    api: async () => ({
      id: "intent_demo",
      bindMessage: "bind",
      plan: { key: "m1", label: "1 month", days: 30 },
    }),
    abVariant: () => "A",
    trackEvent: () => {},
    setPayState: () => {},
    openPaySuccess: () => {
      successCalls += 1;
    },
    getWallet: () => ({ connected: true, publicKey: "AbCdEfGh1234567890123456789012345678" }),
    getSelectedPlan: () => ({ key: "m1", days: 30, label: "1 month" }),
    getSelectedCurrency: () => "SOL",
    getBilling: () => ({ plans: [] }),
    bindWalletToIntent: async () => ({}),
    buildPaymentTx: async () => ({ tx: {}, connection: {} }),
    walletSendTransaction: async () => "sig_demo",
    verifyIntentWithRetry: async () => ({ ok: true, sub: { active: false } }),
    refreshUsage: async () => {},
    loadBillingProof: async () => {},
    loadActivity: async () => {},
    renderWalletStatus: () => {},
  });

  await ui.payNow();
  assert.equal(successCalls, 0);
  assert.match(els.w_msg.innerHTML, /bad|payment_not_verified/i);
});

test("app html exposes pay success confirmation fields", () => {
  const html = readFileSync(path.join(root, "public", "app.html"), "utf8");
  for (const id of [
    "pay_success_handle",
    "pay_success_plan",
    "pay_success_until",
    "pay_success_ready",
  ]) {
    assert.match(html, new RegExp(`id="${id}"`));
  }
});

test("en locale defines pay success confirmation copy", () => {
  const en = JSON.parse(readFileSync(path.join(root, "shared", "i18n", "locales", "en.json"), "utf8"));
  for (const key of [
    "pay_success_title",
    "pay_success_ready",
    "pay_success_plan_pro",
    "pay_success_until_label",
  ]) {
    assert.ok(en[key], key);
  }
});
