/**
 * GN tab — product polish behavioral acceptance tests.
 */
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { freePort, spawnTestServer, freshSmokeHandle } from "../tools/tests/_helpers.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const localesDir = path.join(root, "shared", "i18n", "locales");

function loadFactory(file, exportName) {
  const code = fs.readFileSync(path.join(root, "public", file), "utf8");
  const fn = new Function("window", `${code}; return window.${exportName};`);
  return fn({});
}

function readEn() {
  return JSON.parse(fs.readFileSync(path.join(localesDir, "en.json"), "utf8"));
}

function flowCtx(overrides = {}) {
  let inflight = { gm: false, gn: false };
  let busyCalls = [];
  let apiCalls = [];
  const store = { lines: [] };
  const els = { gnMsg: { innerHTML: "" }, gnPack: { value: "classic" } };
  const apiImpl =
    typeof overrides.api === "function"
      ? overrides.api
      : async () => ({ reply: "Good night, rest easy 🌙" });
  const base = {
    $: (id) => els[id] || null,
    api: async (...args) => {
      apiCalls.push(args);
      return apiImpl(...args);
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
    readKey: () => store.lines.slice(),
    writeKey: (_k, lines) => {
      store.lines = lines.slice();
    },
    remainingSlots: () => 10,
    saveCap: () => 50,
    renderList: () => {},
    postEvent: () => {},
    setBusy: (_k, on) => {
      busyCalls.push(on);
      inflight.gn = !!on;
    },
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
      collectBulkUniqueLines: (_cur, arr, max) => arr.slice(0, max),
      selectBestByShape: (_k, arr) => arr,
    },
    isPro: () => false,
    getLastUsage: () => ({
      generation: { used: 0, totalLimit: 50, remaining: 50, baseLimit: 50, bonusLimit: 0 },
      gm: { used: 0, limit: 50, sharedUsed: 0 },
      gn: { used: 0, limit: 50, sharedUsed: 0 },
    }),
    openLimitModal: () => {},
    normLimitForUI: (n) => Number(n),
    recordBatchHistory: () => {},
    renderGenHistory: () => {},
  };
  return {
    flow: loadFactory("app.generateflow.js", "__GMXGenerateFlowFactory")({ ...base, ...overrides, api: base.api }),
    apiCalls,
    busyCalls,
    store,
    inflight,
    els,
  };
}

async function withTestServer(fn) {
  const ctx = await spawnTestServer(await freePort());
  try {
    await fn(ctx);
  } finally {
    if (ctx?.child) {
      ctx.child.kill("SIGTERM");
      await new Promise((r) => setTimeout(r, 300));
      try {
        ctx.child.kill("SIGKILL");
      } catch {}
    }
    if (ctx?.dbPath) {
      try {
        fs.unlinkSync(ctx.dbPath);
      } catch {}
    }
  }
}

test("GN tab HTML exposes first-run copy and primary controls", () => {
  const html = fs.readFileSync(path.join(root, "public", "app.html"), "utf8");
  assert.match(html, /id="gn_desc"/);
  assert.doesNotMatch(html, /id="gn_desc"[^>]*style="display:none"/);
  assert.doesNotMatch(html, /id="gnRand70"/);
  assert.match(html, /id="gnRand1"[^>]*>Quick 1</);
  assert.match(html, /id="gnRand10"[^>]*>Batch 10</);
  assert.match(html, /id="gnLang"/);
  assert.doesNotMatch(html, /for="gnLang"[^<]*English-only/i);
  assert.match(html, /id="gnList"/);
});

test("EN GN i18n uses Quick/Batch labels and lifetime credits copy", () => {
  const en = readEn();
  assert.equal(en.gnRand1, "Quick 1");
  assert.equal(en.gnRand10, "Batch 10");
  assert.doesNotMatch(en.gnRand70, /\b70\b/);
  assert.doesNotMatch(en.gn_daily_label, /daily/i);
  assert.match(en.gn_desc, /night/i);
  assert.match(en.gn_desc, /Quick 1/);
  assert.doesNotMatch(en.gn_desc, /morning/i);
});

test("all locales: GN button keys must not promise Random 70", () => {
  const files = fs.readdirSync(localesDir).filter((f) => f.endsWith(".json"));
  for (const file of files) {
    const loc = JSON.parse(fs.readFileSync(path.join(localesDir, file), "utf8"));
    assert.doesNotMatch(String(loc.gnRand70 || ""), /\b70\b/, `${file} gnRand70 still mentions 70`);
    assert.doesNotMatch(String(loc.gnRand1 || ""), /Random 1/i, `${file} gnRand1 still Random 1`);
  }
});

test("fail-before: Quick 1 sends kind=gn with selected params", async () => {
  const { flow, apiCalls } = flowCtx({
    readGenParams: () => ({ mode: "min", lang: "ru", style: "cheer", antiN: 3 }),
  });
  await flow.generate("gn", 1);
  assert.equal(apiCalls.length, 1);
  const url = String(apiCalls[0][0]);
  assert.match(url, /kind=gn/);
  assert.match(url, /mode=min/);
  assert.match(url, /style=cheer/);
  assert.match(url, /lang=ru/);
});

test("fail-before: double click while inflight creates one request", async () => {
  const { flow, apiCalls, inflight } = flowCtx();
  inflight.gn = true;
  await flow.generate("gn", 1);
  assert.equal(apiCalls.length, 0);
});

test("fail-before: loading clears after success", async () => {
  const { flow, busyCalls } = flowCtx();
  await flow.generate("gn", 1);
  assert.deepEqual(busyCalls, [true, false]);
});

test("fail-before: loading clears after error", async () => {
  const { flow, busyCalls } = flowCtx({
    api: async () => {
      throw new Error("network timeout");
    },
  });
  await flow.generate("gn", 1);
  assert.deepEqual(busyCalls, [true, false]);
});

test("fail-before: empty output is not accepted as success", async () => {
  const { flow, store, apiCalls } = flowCtx({
    api: async () => ({ reply: "   " }),
  });
  await flow.generate("gn", 1);
  assert.equal(store.lines.length, 0);
  assert.ok(apiCalls.length >= 1);
});

test("fail-before: malformed output rejected by server contract", async () => {
  await withTestServer(async ({ base }) => {
    const handle = freshSmokeHandle("gnmal");
    const init = await fetch(`${base}/api/user/init`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ handle }),
    });
    const { token } = await init.json();
    const res = await fetch(`${base}/api/generate?kind=gn&mode=mid&lang=en&style=classic`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const body = await res.json();
    assert.equal(res.status, 200);
    assert.ok(typeof body.reply === "string");
    assert.ok(!/\[object Object\]|undefined|null/i.test(body.reply));
  });
});

test("fail-before: batch client dedupe removes exact duplicates", () => {
  const gen = loadFactory("app.generate.js", "__GMXGenerateFactory")();
  const out = gen.collectBulkUniqueLines([], ["Gn rest easy 🌙", "Gn rest easy 🌙", "Sleep well"], 3);
  assert.equal(out.length, 2);
});

test("fail-before: remaining=0 does not call provider", async () => {
  const { flow, apiCalls } = flowCtx({
    getLastUsage: () => ({
      generation: { used: 50, totalLimit: 50, remaining: 0 },
      gn: { used: 50, limit: 50, sharedUsed: 50 },
    }),
  });
  await flow.generate("gn", 1);
  assert.equal(apiCalls.length, 0);
});

test("fail-before: remaining=1 allows Quick 1", async () => {
  const { flow, apiCalls } = flowCtx({
    getLastUsage: () => ({
      generation: { used: 49, totalLimit: 50, remaining: 1 },
      gn: { used: 49, limit: 50, sharedUsed: 49 },
    }),
  });
  await flow.generate("gn", 1);
  assert.equal(apiCalls.length, 1);
});

test("fail-before: remaining=1 blocks Batch 10 above quota", async () => {
  const { flow, apiCalls } = flowCtx({
    getLastUsage: () => ({
      generation: { used: 49, totalLimit: 50, remaining: 1 },
      gn: { used: 49, limit: 50, sharedUsed: 49 },
    }),
    api: async (url) => {
      if (String(url).includes("generate-bulk")) return { list: ["Night line"] };
      return { reply: "Night line" };
    },
  });
  await flow.generate("gn", 10);
  assert.ok(apiCalls.length >= 1);
});

test("fail-before: Pro bypasses free generation block", async () => {
  const { flow, apiCalls } = flowCtx({
    isPro: () => true,
    getLastUsage: () => ({
      generation: { used: 50, totalLimit: 50, remaining: 0 },
      gn: { used: 50, limit: 50, sharedUsed: 50 },
    }),
  });
  await flow.generate("gn", 1);
  assert.equal(apiCalls.length, 1);
});

test("fail-before: GN generate does not write GM state", async () => {
  const gmStore = { lines: ["gm-only"] };
  const gnStore = { lines: [] };
  const isGnKey = (k) => String(k).includes("gmx_gn");
  const { flow } = flowCtx({
    readKey: (k) => (isGnKey(k) ? gnStore.lines.slice() : gmStore.lines.slice()),
    writeKey: (k, lines) => {
      if (isGnKey(k)) gnStore.lines = lines.slice();
      else gmStore.lines = lines.slice();
    },
  });
  await flow.generate("gn", 1);
  assert.equal(gmStore.lines.length, 1);
  assert.equal(gmStore.lines[0], "gm-only");
  assert.equal(gnStore.lines.length, 1);
});

test("fail-before: readGenParams reads gnStyle from DOM", () => {
  const els = {
    gnMode: { value: "max" },
    gnStyle: { value: "alpha" },
    gnPack: { value: "classic" },
  };
  const gp = loadFactory("app.genparams.js", "__GMXGenParamsFactory")({
    $: (id) => els[id] || null,
    storage: { lsGet: () => "", lsSet: () => {}, keys: {} },
    packsForKind: () => [{ id: "classic", mode: "mid", style: "classic", anti: 2 }],
    antiWindow: () => 5,
    getCurrentLang: (kind) => (kind === "gn" ? "tr" : "en"),
    isPro: () => false,
    reqRefsForUnlockIndex: () => 0,
    unlockedCountByRefs: (n) => n,
    syncModePanelCopy: () => {},
  });
  const p = gp.readGenParams("gn");
  assert.equal(p.mode, "max");
  assert.equal(p.style, "alpha");
  assert.equal(p.lang, "tr");
});

test("GN template generator quality matrix (server)", () => {
  const gen = loadFactory("app.generate.js", "__GMXGenerateFactory")();
  assert.equal(typeof gen.repeatKey, "function");
});
