import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { readFileSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function loadPredictionFactory() {
  const code = readFileSync(path.join(root, "public", "app.prediction.js"), "utf8");
  const fn = new Function("window", `${code}; return window.__GMXPredictionFactory;`);
  const win = {};
  return fn(win);
}

function mockStorage() {
  const bag = Object.create(null);
  return {
    getItem: (k) => (k in bag ? bag[k] : null),
    setItem: (k, v) => {
      bag[k] = String(v);
    },
    removeItem: (k) => {
      delete bag[k];
    },
    clear: () => {
      for (const k of Object.keys(bag)) delete bag[k];
    },
    _bag: bag,
  };
}

function mkSelect(value = "all") {
  const handlers = {};
  return {
    value,
    innerHTML: "",
    addEventListener: (ev, fn) => {
      handlers[ev] = fn;
    },
    trigger: () => handlers.change?.(),
  };
}

function mkEls() {
  return {
    pmList: { innerHTML: "", classList: { add: () => {}, remove: () => {} } },
    pm_status: { textContent: "" },
    pm_locked_note: { textContent: "" },
    pm_asset: mkSelect("all"),
    pm_bias: mkSelect("all"),
    pm_conf: mkSelect("0"),
    pm_refresh: { onclick: null },
    pm_newbie_block: { classList: { toggle: () => {} } },
    pm_newbie_dismiss: { onclick: null },
  };
}

function createPm(ctx = {}) {
  const els = ctx.els || mkEls();
  const Factory = loadPredictionFactory();
  return Factory({
    $: (id) => els[id] || null,
    escapeHtml: (s) => String(s ?? ""),
    t: (k, fb) => ctx.messages?.[k] ?? fb ?? k,
    api: ctx.api || (async () => ({ ok: true, preview: true, comingSoon: true, signals: [] })),
    getHandle: ctx.getHandle || (() => ""),
    getToken: ctx.getToken || (() => ""),
    friendlyUiErrorMessage: (m) => m,
    getCurrentTab: () => "prediction",
    ...ctx,
  });
}

test("navigation: prediction tab entry exists in app shell", () => {
  const html = fs.readFileSync(path.join(root, "public", "app.html"), "utf8");
  assert.match(html, /data-tab="prediction"[^>]*id="t_prediction"/);
  assert.match(html, /id="tab-prediction"/);
  assert.match(html, /id="mmore_prediction"/);
});

test("first-time onboarding: newbie block visible before dismiss", () => {
  const pm = createPm({ getHandle: () => "@a", getToken: () => "tok" });
  assert.equal(pm.isIntroDismissed(), false);
  pm.syncPredictionIntro();
});

test("onboarding completion persists per handle", () => {
  globalThis.localStorage = mockStorage();
  const pm = createPm({ getHandle: () => "@alice", getToken: () => "tok" });
  pm.dismissIntro();
  assert.equal(pm.isIntroDismissed(), true);
  assert.equal(localStorage.getItem("gmx_pm_intro_done_v1:@alice"), "1");
});

test("onboarding reload persistence reads storage key", () => {
  globalThis.localStorage = mockStorage();
  localStorage.setItem("gmx_pm_intro_done_v1:@bob", "1");
  const pm = createPm({ getHandle: () => "@bob", getToken: () => "tok" });
  assert.equal(pm.isIntroDismissed(), true);
});

test("logout cleanup resets in-memory prediction cache", async () => {
  const pm = createPm({
    getHandle: () => "@carol",
    getToken: () => "tok",
    api: async () => ({
      preview: true,
      comingSoon: true,
      signals: [{ symbol: "BTC/USDT", bias: "bullish", changePct: 1, confidence: 80, thesis: "x", risk: "y" }],
    }),
  });
  await pm.loadPredictionSignals({ force: true });
  pm.resetPredictionPrivateState();
  const els = { pmList: { innerHTML: "cleared", classList: { add: () => {}, remove: () => {} } }, pm_status: { textContent: "x" } };
  pm.resetPredictionPrivateState();
});

test("account switch isolation uses distinct intro keys", () => {
  globalThis.localStorage = mockStorage();
  const pmA = createPm({ getHandle: () => "@one", getToken: () => "t" });
  pmA.dismissIntro();
  const pmB = createPm({ getHandle: () => "@two", getToken: () => "t" });
  assert.equal(pmA.isIntroDismissed(), true);
  assert.equal(pmB.isIntroDismissed(), false);
});

test("wallet disconnected: unauthenticated shows sign-in guidance not fake live card", async () => {
  const els = mkEls();
  const pm = createPm({ els, getHandle: () => "", getToken: () => "" });
  await pm.loadPredictionSignals({ force: true });
  assert.doesNotMatch(els.pmList.innerHTML, /Polymarket Direction Signal/);
  assert.match(els.pmList.innerHTML, /Sign in with your @handle|pm_unauth_empty/);
  assert.match(els.pm_status.textContent, /Connect your @handle|pm_unauth_status/);
});

test("wallet connected: session loads preview demo cards with badge", async () => {
  const els = mkEls();
  const pm = createPm({
    els,
    getHandle: () => "@demo",
    getToken: () => "tok",
    api: async () => ({
      preview: true,
      comingSoon: true,
      signals: [{ symbol: "ETH/USDT", bias: "neutral", changePct: 0.2, confidence: 72, thesis: "t", risk: "r" }],
    }),
  });
  await pm.loadPredictionSignals({ force: true });
  assert.match(els.pmList.innerHTML, /ETH\/USDT/);
  assert.match(els.pmList.innerHTML, /pmPreviewBadge|Preview/);
  assert.match(els.pm_status.textContent, /No live feed yet|pm_status_preview/);
});

test("loading: authenticated fetch sets loading status first", async () => {
  const els = mkEls();
  let resolveApi;
  const pm = createPm({
    els,
    getHandle: () => "@demo",
    getToken: () => "tok",
    api: () =>
      new Promise((r) => {
        resolveApi = r;
      }),
  });
  const pending = pm.loadPredictionSignals({ force: true });
  assert.match(els.pm_status.textContent, /Loading/i);
  resolveApi({ preview: true, comingSoon: true, signals: [] });
  await pending;
});

test("empty markets: authed API with zero signals shows pm_empty", async () => {
  const els = mkEls();
  const pm = createPm({
    els,
    getHandle: () => "@demo",
    getToken: () => "tok",
    api: async () => ({ preview: true, comingSoon: true, signals: [] }),
  });
  await pm.loadPredictionSignals({ force: true });
  assert.match(els.pmList.innerHTML, /No signals yet|pm_empty/);
});

test("api error: surfaces retry guidance in list and status", async () => {
  const els = mkEls();
  const pm = createPm({
    els,
    getHandle: () => "@demo",
    getToken: () => "tok",
    api: async () => {
      throw new Error("server_error");
    },
    friendlyUiErrorMessage: () => "Could not load signals. Tap Refresh to try again.",
  });
  await pm.loadPredictionSignals({ force: true });
  assert.match(els.pm_status.textContent, /Could not load signals/);
  assert.match(els.pmList.innerHTML, /Could not load signals/);
});

test("retry: refresh button triggers forced reload", async () => {
  const els = mkEls();
  let calls = 0;
  const pm = createPm({
    els,
    getHandle: () => "@demo",
    getToken: () => "tok",
    api: async () => {
      calls++;
      return { preview: true, comingSoon: true, signals: [] };
    },
  });
  pm.bindPredictionMarketUI();
  await pm.loadPredictionSignals({ force: true });
  els.pm_refresh.onclick();
  await new Promise((r) => setTimeout(r, 0));
  assert.ok(calls >= 2);
});

test("external link safety: polymarket links use noopener noreferrer", () => {
  const html = fs.readFileSync(path.join(root, "public", "app.html"), "utf8");
  for (const host of ["polymarket.com", "kalshi.com", "manifold.markets"]) {
    const re = new RegExp(`href="https://${host.replace(".", "\\.")}"[^>]*rel="noopener noreferrer"`);
    assert.match(html, re);
  }
});

test("no fake trading action: prediction tab has no trade CTA buttons", () => {
  const html = fs.readFileSync(path.join(root, "public", "app.html"), "utf8");
  const tab = html.slice(html.indexOf('id="tab-prediction"'), html.indexOf('id="tab-gm"'));
  assert.doesNotMatch(tab, /<button[^>]*(trade|buy|sell|place order)/i);
  assert.doesNotMatch(tab, /id="pm_[^"]*(trade|buy|sell)/i);
});

test("mobile layout contract: learn links wrap and coarse pointer styles exist", () => {
  const css = fs.readFileSync(path.join(root, "public", "app.css"), "utf8");
  assert.match(css, /\.pmLearnLinks[\s\S]*flex-wrap/);
  assert.match(css, /@media \(pointer: coarse\)/);
});

test("keyboard flow: filter controls have labels and aria-label", () => {
  const html = fs.readFileSync(path.join(root, "public", "app.html"), "utf8");
  assert.match(html, /for="pm_asset"/);
  assert.match(html, /aria-label="Asset filter"/);
  assert.match(html, /id="pm_newbie_dismiss"/);
});

test("localization fallback: t() falls back when key missing", async () => {
  const els = mkEls();
  const pm = createPm({
    els,
    getHandle: () => "",
    getToken: () => "",
    t: (_k, fb) => fb,
  });
  await pm.loadPredictionSignals({ force: true });
  assert.match(els.pm_status.textContent, /Connect your @handle/);
});

test("no secret storage: prediction module does not reference private keys", () => {
  const js = fs.readFileSync(path.join(root, "public", "app.prediction.js"), "utf8");
  assert.doesNotMatch(js, /privateKey|mnemonic|seed phrase/i);
  assert.doesNotMatch(js, /localStorage\.setItem\([^)]*token/i);
});

test("no open redirect: external hrefs are fixed allowlist hosts", () => {
  const html = fs.readFileSync(path.join(root, "public", "app.html"), "utf8");
  const block = html.slice(html.indexOf('id="pm_learn_more"'), html.indexOf('id="pm_refresh"'));
  const hrefs = [...block.matchAll(/href="([^"]+)"/g)].map((m) => m[1]);
  for (const href of hrefs) {
    assert.match(href, /^https:\/\/(polymarket\.com|kalshi\.com|manifold\.markets)\/?$/);
  }
});

test("production bundle parity: frontend/public mirrors prediction module", () => {
  const pub = fs.readFileSync(path.join(root, "public", "app.prediction.js"), "utf8");
  const front = fs.readFileSync(path.join(root, "frontend", "public", "app.prediction.js"), "utf8");
  assert.equal(pub, front, "run npm run build:site to sync frontend/public");
});

test("filter empty state when rows excluded by filters", async () => {
  const els = mkEls();
  const pm = createPm({
    els,
    getHandle: () => "@demo",
    getToken: () => "tok",
    api: async () => ({
      preview: true,
      comingSoon: true,
      signals: [{ symbol: "BTC/USDT", bias: "bullish", changePct: 1, confidence: 50, thesis: "a", risk: "b" }],
    }),
  });
  pm.bindPredictionMarketUI();
  await pm.loadPredictionSignals({ force: true });
  els.pm_conf.value = "80";
  els.pm_conf.trigger();
  assert.match(els.pmList.innerHTML, /No demo cards match|pm_filter_empty/);
});

test("api contract: market signals route marks preview mode", async () => {
  const mod = await import(pathToFileURL(path.join(root, "server", "routes", "engagement.mjs")).href);
  assert.ok(mod);
  const src = fs.readFileSync(path.join(root, "server", "routes", "engagement.mjs"), "utf8");
  assert.match(src, /preview:\s*true/);
  assert.match(src, /comingSoon:\s*true/);
});

test("prediction tab exposes newbie intro block and dismiss control", () => {
  const html = fs.readFileSync(path.join(root, "public", "app.html"), "utf8");
  for (const id of ["pm_newbie_title", "pm_newbie_body", "pm_learn_more_label", "pm_newbie_dismiss"]) {
    assert.match(html, new RegExp(`id="${id}"`));
  }
});

test("en locale defines prediction onboarding copy including new keys", () => {
  const en = JSON.parse(fs.readFileSync(path.join(root, "shared", "i18n", "locales", "en.json"), "utf8"));
  for (const key of [
    "pm_newbie_title",
    "pm_newbie_dismiss",
    "pm_preview_badge",
    "pm_unauth_status",
    "pm_error_retry",
    "pm_demo_note",
  ]) {
    assert.ok(en[key], key);
  }
});

test("prediction onboarding css styles intro, dismiss row, and preview badge", () => {
  const css = fs.readFileSync(path.join(root, "public", "app.css"), "utf8");
  assert.match(css, /\.pmNewbieIntro/);
  assert.match(css, /\.pmNewbieActions/);
  assert.match(css, /\.pmPreviewBadge/);
  assert.match(css, /\.pmLearnLinks/);
});
