import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { CONFIG } from "../server/config.mjs";
import { registerGenerateRoutes } from "../server/routes/generate.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function loadFactory(file, exportName) {
  const code = fs.readFileSync(path.join(root, "public", file), "utf8");
  const fn = new Function("window", `${code}; return window.${exportName};`);
  const win = {};
  return fn(win);
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

test("server config: FREE_DAILY_BASE defaults to 50", () => {
  assert.equal(CONFIG.FREE_DAILY_BASE, 50);
  assert.equal(CONFIG.SAVE_CAP_FREE, 50);
});

test("landing and app shell do not promise 70 free generations", () => {
  const html = fs.readFileSync(path.join(root, "public", "app.html"), "utf8");
  assert.doesNotMatch(html, /0\/70/);
  assert.match(html, /0\/50/);
  const en = JSON.parse(fs.readFileSync(path.join(root, "shared/i18n/locales/en.json"), "utf8"));
  assert.match(en.plan_cmp_val_free_daily, /50/);
  assert.doesNotMatch(en.h_guide.join(" "), /\b70\b/);
  assert.doesNotMatch(en.gm_right_list.join(" "), /70\/70/);
});

test("usage refresh uses server freeDaily fallback of 50", async () => {
  const els = {
    gmDailyVal: { textContent: "" },
    gnDailyVal: { textContent: "" },
    gmDailyFill: { style: { width: "" } },
    gnDailyFill: { style: { width: "" } },
    usedPill: { textContent: "" },
  };
  let lastUsage = null;
  const usage = loadFactory("app.usage.js", "__GMXUsageFactory")({
    $: (id) => els[id] || null,
    getToken: () => "tok",
    getHandle: () => "@user",
    api: async () => ({
      authenticated: true,
      gm: { used: 2, limit: 50 },
      gn: { used: 1, limit: 50 },
      limits: { freeDaily: 50, saveCapFree: 50, referralUnlocks: { eligible: 0 } },
      sub: { active: false },
      resetAt: "2026-06-18T00:00:00.000Z",
    }),
    isPro: () => false,
    getSaveCapFree: () => 50,
    setSaveCapFree: () => {},
    setAuthOk: () => {},
    applyAdminVisibility: () => {},
    setLastUsage: (u) => {
      lastUsage = u;
    },
    getLastUsage: () => lastUsage || {},
    setSub: () => {},
    renderWalletStatus: () => {},
    applyRefCountEligible: () => false,
    getLastUsageCosmeticSig: () => "",
    setLastUsageCosmeticSig: () => {},
    onCosmeticRefresh: () => {},
    scheduleRefStatsRefresh: () => {},
    getCurrentTab: () => "gm",
    renderHelpIfOpen: () => {},
  });
  await usage.refreshUsage();
  assert.equal(els.gmDailyVal.textContent, "2/50");
  assert.equal(els.gnDailyVal.textContent, "1/50");
  assert.match(els.usedPill.textContent, /GM 2\/50/);
  assert.deepEqual(lastUsage?.gm, { used: 2, limit: 50 });
});

test("generate flow blocks at daily limit without calling API", async () => {
  const apiCalls = [];
  const events = [];
  const els = { gmMsg: { innerHTML: "" } };
  let inflight = { gm: false, gn: false };
  const flow = loadFactory("app.generateflow.js", "__GMXGenerateFlowFactory")({
    $: (id) => els[id] || null,
    api: async (...args) => {
      apiCalls.push(args);
      return { reply: "gm line" };
    },
    requireConnected: () => true,
    getToken: () => "tok",
    getHandle: () => "@user",
    initSession: async () => {},
    readGenParams: () => ({ mode: "mid", lang: "en", style: "classic", antiN: 5 }),
    getAntiStrength: () => 1,
    getCleanFillEnabled: () => false,
    getBestMode: () => false,
    getGmView: () => "saved",
    getGnView: () => "saved",
    ensureIndexed: () => {},
    activeKey: () => "gmx_gm_global",
    getGlobalKey: () => "gmx_gm_global",
    readKey: () => [],
    writeKey: () => {},
    remainingSlots: () => 10,
    saveCap: () => 50,
    renderList: () => {},
    postEvent: (_n, p) => events.push(p),
    setBusy: () => {},
    inflight,
    abort: { gm: null, gn: null },
    filterAntiRepeat: (_k, _key, lines) => lines,
    pushRecent: () => {},
    repeatKey: (s) => s,
    oneClickCleanup: async () => ({}),
    refreshUsage: async () => {},
    logEvent: () => {},
    escapeHtml: (s) => String(s || ""),
    siteTr: (_k, fb) => fb,
    t: (k) => k,
    friendlyUiErrorMessage: (m) => m,
    toast: () => {},
    yieldToUiFrame: async () => {},
    cleanFillStrength: 2,
    gen: {
      isLineAlreadySaved: () => false,
      mergeAppendUnique: (_a, b) => b,
      collectBulkUniqueLines: (_cur, arr) => arr,
      selectBestByShape: (_k, arr) => arr,
    },
    isPro: () => false,
    getLastUsage: () => ({
      gm: { used: 50, limit: 50 },
      gn: { used: 0, limit: 50 },
      resetAt: "2026-06-18T00:00:00.000Z",
    }),
    openLimitModal: (p) => events.push({ modal: p }),
    normLimitForUI: (n) => Number(n),
  });

  await flow.generate("gm", 1);
  assert.equal(apiCalls.length, 0);
  assert.ok(events.some((e) => e.where === "daily"));
  assert.ok(events.some((e) => e.modal?.reason === "daily"));
});

test("generate flow allows one generation when daily remaining is 1", async () => {
  const apiCalls = [];
  let inflight = { gm: false, gn: false };
  const flow = loadFactory("app.generateflow.js", "__GMXGenerateFlowFactory")({
    $: (id) => (id === "gmMsg" ? { innerHTML: "" } : id === "gmPack" ? { value: "classic" } : null),
    api: async (...args) => {
      apiCalls.push(args);
      return { reply: "Good morning!" };
    },
    requireConnected: () => true,
    getToken: () => "tok",
    getHandle: () => "@user",
    initSession: async () => {},
    readGenParams: () => ({ mode: "mid", lang: "en", style: "classic", antiN: 5 }),
    getAntiStrength: () => 1,
    getCleanFillEnabled: () => false,
    getBestMode: () => false,
    getGmView: () => "saved",
    getGnView: () => "saved",
    ensureIndexed: () => {},
    activeKey: () => "gmx_gm_global",
    getGlobalKey: () => "gmx_gm_global",
    readKey: () => [],
    writeKey: () => {},
    remainingSlots: () => 10,
    saveCap: () => 50,
    renderList: () => {},
    postEvent: () => {},
    setBusy: () => {},
    inflight,
    abort: { gm: null, gn: null },
    filterAntiRepeat: (_k, _key, lines) => lines,
    pushRecent: () => {},
    repeatKey: (s) => s,
    oneClickCleanup: async () => ({}),
    refreshUsage: async () => {},
    logEvent: () => {},
    escapeHtml: (s) => String(s || ""),
    siteTr: (_k, fb) => fb,
    t: (k) => k,
    friendlyUiErrorMessage: (m) => m,
    toast: () => {},
    yieldToUiFrame: async () => {},
    cleanFillStrength: 2,
    gen: {
      isLineAlreadySaved: () => false,
      mergeAppendUnique: (_a, b) => b,
      collectBulkUniqueLines: (_cur, arr) => arr,
      selectBestByShape: (_k, arr) => arr,
    },
    isPro: () => false,
    getLastUsage: () => ({ gm: { used: 49, limit: 50 }, gn: { used: 0, limit: 50 } }),
    openLimitModal: () => {},
    normLimitForUI: (n) => Number(n),
  });

  await flow.generate("gm", 1);
  assert.equal(apiCalls.length, 1);
  assert.match(String(apiCalls[0][0]), /kind=gm/);
});

test("generate flow sends GN kind for gn tab", async () => {
  const apiCalls = [];
  let inflight = { gm: false, gn: false };
  const flow = loadFactory("app.generateflow.js", "__GMXGenerateFlowFactory")({
    $: (id) => (id === "gnMsg" ? { innerHTML: "" } : id === "gnPack" ? { value: "classic" } : null),
    api: async (...args) => {
      apiCalls.push(args);
      return { reply: "Good night!" };
    },
    requireConnected: () => true,
    getToken: () => "tok",
    getHandle: () => "@user",
    initSession: async () => {},
    readGenParams: () => ({ mode: "mid", lang: "en", style: "classic", antiN: 5 }),
    getAntiStrength: () => 1,
    getCleanFillEnabled: () => false,
    getBestMode: () => false,
    getGmView: () => "saved",
    getGnView: () => "saved",
    ensureIndexed: () => {},
    activeKey: () => "gmx_gn_global",
    getGlobalKey: () => "gmx_gn_global",
    readKey: () => [],
    writeKey: () => {},
    remainingSlots: () => 10,
    saveCap: () => 50,
    renderList: () => {},
    postEvent: () => {},
    setBusy: () => {},
    inflight,
    abort: { gm: null, gn: null },
    filterAntiRepeat: (_k, _key, lines) => lines,
    pushRecent: () => {},
    repeatKey: (s) => s,
    oneClickCleanup: async () => ({}),
    refreshUsage: async () => {},
    logEvent: () => {},
    escapeHtml: (s) => String(s || ""),
    siteTr: (_k, fb) => fb,
    t: (k) => k,
    friendlyUiErrorMessage: (m) => m,
    toast: () => {},
    yieldToUiFrame: async () => {},
    cleanFillStrength: 2,
    gen: {
      isLineAlreadySaved: () => false,
      mergeAppendUnique: (_a, b) => b,
      collectBulkUniqueLines: (_cur, arr) => arr,
      selectBestByShape: (_k, arr) => arr,
    },
    isPro: () => false,
    getLastUsage: () => ({ gm: { used: 0, limit: 50 }, gn: { used: 0, limit: 50 } }),
    openLimitModal: () => {},
    normLimitForUI: (n) => Number(n),
  });

  await flow.generate("gn", 1);
  assert.match(String(apiCalls[0][0]), /kind=gn/);
});

test("generate flow ignores duplicate parallel click while inflight", async () => {
  let inflight = { gm: true, gn: false };
  const apiCalls = [];
  const flow = loadFactory("app.generateflow.js", "__GMXGenerateFlowFactory")({
    $: (id) => (id === "gmMsg" ? { innerHTML: "" } : null),
    api: async (...args) => {
      apiCalls.push(args);
      return { reply: "x" };
    },
    requireConnected: () => true,
    getToken: () => "tok",
    getHandle: () => "@user",
    initSession: async () => {},
    readGenParams: () => ({ mode: "mid", lang: "en", style: "classic", antiN: 5 }),
    getAntiStrength: () => 1,
    getCleanFillEnabled: () => false,
    getBestMode: () => false,
    getGmView: () => "saved",
    getGnView: () => "saved",
    ensureIndexed: () => {},
    activeKey: () => "k",
    getGlobalKey: () => "k",
    readKey: () => [],
    writeKey: () => {},
    remainingSlots: () => 10,
    saveCap: () => 50,
    renderList: () => {},
    postEvent: () => {},
    setBusy: () => {},
    inflight,
    abort: { gm: null, gn: null },
    filterAntiRepeat: (_k, _key, lines) => lines,
    pushRecent: () => {},
    repeatKey: (s) => s,
    oneClickCleanup: async () => ({}),
    refreshUsage: async () => {},
    logEvent: () => {},
    escapeHtml: (s) => String(s || ""),
    siteTr: (_k, fb) => fb,
    t: (k) => k,
    friendlyUiErrorMessage: (m) => m,
    toast: () => {},
    yieldToUiFrame: async () => {},
    cleanFillStrength: 2,
    gen: { isLineAlreadySaved: () => false },
    isPro: () => false,
    getLastUsage: () => ({ gm: { used: 0, limit: 50 }, gn: { used: 0, limit: 50 } }),
    openLimitModal: () => {},
    normLimitForUI: (n) => Number(n),
  });
  await flow.generate("gm", 1);
  assert.equal(apiCalls.length, 0);
});

test("generate flow pro bypasses daily limit UI block", async () => {
  const apiCalls = [];
  let inflight = { gm: false, gn: false };
  const flow = loadFactory("app.generateflow.js", "__GMXGenerateFlowFactory")({
    $: (id) => (id === "gmMsg" ? { innerHTML: "" } : id === "gmPack" ? { value: "classic" } : null),
    api: async (...args) => {
      apiCalls.push(args);
      return { reply: "Pro gm" };
    },
    requireConnected: () => true,
    getToken: () => "tok",
    getHandle: () => "@user",
    initSession: async () => {},
    readGenParams: () => ({ mode: "mid", lang: "en", style: "classic", antiN: 5 }),
    getAntiStrength: () => 1,
    getCleanFillEnabled: () => false,
    getBestMode: () => false,
    getGmView: () => "saved",
    getGnView: () => "saved",
    ensureIndexed: () => {},
    activeKey: () => "k",
    getGlobalKey: () => "k",
    readKey: () => [],
    writeKey: () => {},
    remainingSlots: () => 10,
    saveCap: () => 50,
    renderList: () => {},
    postEvent: () => {},
    setBusy: () => {},
    inflight,
    abort: { gm: null, gn: null },
    filterAntiRepeat: (_k, _key, lines) => lines,
    pushRecent: () => {},
    repeatKey: (s) => s,
    oneClickCleanup: async () => ({}),
    refreshUsage: async () => {},
    logEvent: () => {},
    escapeHtml: (s) => String(s || ""),
    siteTr: (_k, fb) => fb,
    t: (k) => k,
    friendlyUiErrorMessage: (m) => m,
    toast: () => {},
    yieldToUiFrame: async () => {},
    cleanFillStrength: 2,
    gen: { isLineAlreadySaved: () => false, mergeAppendUnique: (_a, b) => b },
    isPro: () => true,
    getLastUsage: () => ({ gm: { used: 999, limit: 50 }, gn: { used: 999, limit: 50 } }),
    openLimitModal: () => assert.fail("should not open limit modal for pro"),
    normLimitForUI: (n) => Number(n),
  });
  await flow.generate("gm", 1);
  assert.equal(apiCalls.length, 1);
});

test("server generate route returns limit_reached when quota exhausted", async () => {
  const app = mockExpressApp();
  registerGenerateRoutes({
    app,
    requireAuth: (_req, _res, next) => next(),
    sendError: (_res, status, code) => ({ status, code }),
    ERROR_CODES: { SERVER_ERROR: "server_error" },
    parseAntiLastN: () => 5,
    normLang: (l) => l || "en",
    generateUnique: () => "line",
    generateRankedCandidates: () => ["a"],
    saveRecent: () => {},
    todayKeyUTC: () => "2026-06-17",
    userByHandle: () => ({ handle: "@u" }),
    subscriptionInfo: () => ({ active: false }),
    insertLimitForUser: async () => 50,
    awardReferralBonus: () => {},
    maybeAwardStarterReward: () => {},
    supabaseActive: () => false,
    sbConsumeDailyAtomic: async () => ({ ok: false }),
    consumeDailyAtomic: () => ({ ok: false, used: 50, limit: 50 }),
    nextResetUTC: () => "2026-06-18T00:00:00.000Z",
    logActivity: () => {},
  });

  const route = app.routes.find((r) => r.path === "/api/generate");
  assert.ok(route);
  const handler = route.handlers[route.handlers.length - 1];
  const req = {
    user: { handle: "@u" },
    query: { kind: "gm", mode: "mid", lang: "en", style: "classic" },
  };
  let status = 0;
  let body = null;
  const res = {
    status(code) {
      status = code;
      return this;
    },
    json(payload) {
      body = payload;
      return this;
    },
  };
  await handler(req, res);
  assert.equal(status, 429);
  assert.equal(body.error, "limit_reached");
  assert.equal(body.limit, 50);
});

test("paywall limit modal supports daily generation reason", () => {
  const els = { limit_modal: { classList: { remove() {} } }, limit_modal_desc: { textContent: "" }, limit_modal_hint: { textContent: "" } };
  const paywall = loadFactory("app.paywall.js", "__GMXPaywallFactory")({
    $: (id) => els[id] || null,
    getHandle: () => "@u",
    siteTr: (_k, fb) => fb,
    trackEvent: async () => {},
    storage: { lsGet: () => "A", lsSet: () => {} },
  });
  paywall.openLimitModal({ reason: "daily", kind: "gm", resetAt: "tomorrow" });
  assert.match(els.limit_modal_desc.textContent, /generation limit/i);
  assert.equal(els.limit_modal_hint.textContent, "Next reset: tomorrow");
});
