import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

if (typeof globalThis.document === "undefined") {
  globalThis.document = {
    createElement: () => ({
      type: "button",
      className: "",
      classList: { toggle: () => {}, add: () => {}, remove: () => {} },
      dataset: {},
      innerHTML: "",
      onclick: null,
      appendChild: () => {},
    }),
  };
}

function loadWalletUiFactory() {
  const code = readFileSync(path.join(root, "public", "app.walletui.js"), "utf8");
  const fn = new Function("window", `${code}; return window.__GMXWalletUiFactory;`);
  return fn({});
}

function makeUi(overrides = {}) {
  const els = {
    sf_addr: { textContent: "" },
    sf_label: { textContent: "" },
    sf_connect: { classList: { toggle: () => {} } },
    sf_disconnect: { classList: { toggle: () => {} } },
    sf_pay: { disabled: false },
    sf_hint: { innerHTML: "" },
    walletActions: { classList: { remove: () => {}, add: () => {} } },
    planGrid: { innerHTML: "", appendChild: () => {} },
    w_status_desc: { innerHTML: "" },
    w_msg: { innerHTML: "", textContent: "" },
    w_token_availability: { classList: { add: () => {}, remove: () => {} }, textContent: "" },
    token_SOL: { disabled: false, classList: { toggle: () => {}, remove: () => {}, add: () => {} }, setAttribute: () => {} },
    token_USDC: { disabled: false, classList: { toggle: () => {}, remove: () => {}, add: () => {} }, setAttribute: () => {} },
    token_USDT: { disabled: false, classList: { toggle: () => {}, remove: () => {}, add: () => {} }, setAttribute: () => {} },
    ...(overrides.els || {}),
  };
  let billing = { receiver: "Recv1111111111111111111111111111111111111111", plans: [], solUsd: 100 };
  const ui = loadWalletUiFactory()({
    $: (id) => els[id] || null,
    escapeHtml: (s) => String(s ?? ""),
    siteTr: (k, fb) => fb || k,
    getBilling: () => billing,
    setBilling: (v) => {
      billing = v;
    },
    getSelectedCurrency: () => "SOL",
    getSelectedPlanKey: () => "",
    getSelectedPlan: () => null,
    setSelectedPlanKey: () => {},
    setSelectedPlan: () => {},
    getWallet: () => ({ connected: false, publicKey: null }),
    isTokenAvailable: () => true,
    firstAvailableToken: () => "USDC",
    planPricePrimary: () => "$10",
    planPriceSecondary: () => "",
    api: overrides.api || (async () => ({ ok: true, plans: [{ key: "m1", days: 30, label: "Monthly", usd: 10 }] })),
    friendlyUiErrorMessage: (m) => m,
    loadPaymentRecovery: () => null,
    clearPaymentRecovery: () => {},
    acquireVerifyLock: () => true,
    releaseVerifyLock: () => {},
    ...overrides,
  });
  return { ui, els, getBilling: () => billing };
}

test("navigation: wallet tab entry exists", () => {
  const html = fs.readFileSync(path.join(root, "public", "app.html"), "utf8");
  assert.match(html, /data-tab="wallet"[^>]*id="t_wallet"/);
  assert.match(html, /id="tab-wallet"/);
  assert.match(html, /id="mnav_wallet"/);
});

test("loadPlans reveals wallet actions when plans load", async () => {
  const { ui, els } = makeUi();
  let removed = false;
  els.walletActions.classList.remove = () => {
    removed = true;
  };
  await ui.loadPlans();
  assert.equal(removed, true);
});

test("loadPlans shows error when billing API fails", async () => {
  const { ui, els } = makeUi({
    api: async () => {
      throw new Error("billing_failed");
    },
  });
  await ui.loadPlans();
  assert.match(els.w_msg.innerHTML, /Could not load plans|billing_failed/);
});

test("setWalletUi uses i18n for disconnected address", () => {
  const { ui, els } = makeUi();
  ui.setWalletUi();
  assert.equal(els.sf_addr.textContent, "not connected");
});

test("setWalletUi prompts plan selection before connect hint", () => {
  const { ui, els } = makeUi({
    getSelectedPlan: () => null,
  });
  ui.setWalletUi();
  assert.match(els.sf_hint.innerHTML, /Select a plan above/);
});

test("renderWalletStatus shows Pro active", () => {
  const { ui, els } = makeUi();
  ui.renderWalletStatus({ active: true, paidUntil: "2026-12-01" });
  assert.match(els.w_status_desc.innerHTML, /Pro active/);
});

test("renderWalletStatus shows Free tier", () => {
  const { ui, els } = makeUi();
  ui.renderWalletStatus({ active: false });
  assert.match(els.w_status_desc.innerHTML, /Free/);
});

test("trust list mentions no seed phrase", () => {
  const html = fs.readFileSync(path.join(root, "public", "app.html"), "utf8");
  const tab = html.slice(html.indexOf('id="tab-wallet"'), html.indexOf('id="tab-admin"'));
  assert.match(tab, /No seed phrase/i);
});

test("recovery UI has check and dismiss controls", () => {
  const html = fs.readFileSync(path.join(root, "public", "app.html"), "utf8");
  assert.match(html, /id="w_recovery_check"/);
  assert.match(html, /id="w_recovery_dismiss"/);
});

test("token row exposes SOL USDC USDT", () => {
  const html = fs.readFileSync(path.join(root, "public", "app.html"), "utf8");
  for (const id of ["token_SOL", "token_USDC", "token_USDT"]) {
    assert.match(html, new RegExp(`id="${id}"`));
  }
});

test("plan compare table present", () => {
  const html = fs.readFileSync(path.join(root, "public", "app.html"), "utf8");
  assert.match(html, /id="wallet_plan_compare_table"/);
  assert.match(html, /id="plan_cmp_feat_arcade"/);
});

test("wallet module never references private keys", () => {
  const js = fs.readFileSync(path.join(root, "public", "app.walletui.js"), "utf8");
  const pay = fs.readFileSync(path.join(root, "public", "app.walletpay.js"), "utf8");
  assert.doesNotMatch(js + pay, /seed phrase|privateKey|mnemonic/i);
});

test("billing API requires auth for intent", () => {
  const src = fs.readFileSync(path.join(root, "server", "routes", "billing.mjs"), "utf8");
  assert.match(src, /app\.post\("\/api\/billing\/intent", requireAuth/);
  assert.match(src, /payment_intent_mismatch/);
});

test("en locale defines wallet flow keys", () => {
  const en = JSON.parse(fs.readFileSync(path.join(root, "shared", "i18n", "locales", "en.json"), "utf8"));
  for (const key of [
    "wallet_pay_connect_handle_first",
    "wallet_plan_unlock_days",
    "wallet_plans_load_failed",
    "pay_creating_payment",
    "pay_paid_verified",
    "w_trust_list",
  ]) {
    assert.ok(en[key], key);
  }
});

test("html wallet_desc matches honest generation-credit copy", () => {
  const html = fs.readFileSync(path.join(root, "public", "app.html"), "utf8");
  const en = JSON.parse(fs.readFileSync(path.join(root, "shared", "i18n", "locales", "en.json"), "utf8"));
  assert.match(html, new RegExp(en.wallet_desc.slice(0, 40).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
});

test("mobile wallet nav entry exists", () => {
  const html = fs.readFileSync(path.join(root, "public", "app.html"), "utf8");
  assert.match(html, /id="mnav_wallet"/);
});

test("token availability banner is aria-live", () => {
  const html = fs.readFileSync(path.join(root, "public", "app.html"), "utf8");
  assert.match(html, /id="w_token_availability"[^>]*aria-live="polite"/);
});

test("production bundle parity for wallet ui module", () => {
  const pub = fs.readFileSync(path.join(root, "public", "app.walletui.js"), "utf8");
  const front = fs.readFileSync(path.join(root, "frontend", "public", "app.walletui.js"), "utf8");
  assert.equal(pub, front, "run npm run build:site / sync-app-and-assets");
});
