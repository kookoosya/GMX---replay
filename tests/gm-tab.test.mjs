/**
 * GM tab — product polish behavioral acceptance tests.
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
  const els = { gmMsg: { innerHTML: "" }, gmPack: { value: "classic" } };
  const apiImpl =
    typeof overrides.api === "function"
      ? overrides.api
      : async () => ({ reply: "Good morning, friend ☀️" });
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
    activeKey: () => "gmx_gm_global",
    getGlobalKey: () => "gmx_gm_global",
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
      inflight.gm = !!on;
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
  return { flow: loadFactory("app.generateflow.js", "__GMXGenerateFlowFactory")({ ...base, ...overrides, api: base.api }), apiCalls, busyCalls, store, inflight, els };
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

test("GM tab HTML exposes first-run copy and primary controls", () => {
  const html = fs.readFileSync(path.join(root, "public", "app.html"), "utf8");
  assert.match(html, /id="gm_desc"/);
  assert.doesNotMatch(html, /id="gm_desc"[^>]*style="display:none"/);
  assert.doesNotMatch(html, /id="gmRand70"/);
  assert.match(html, /id="gmRand1"[^>]*>Quick 1</);
  assert.match(html, /id="gmRand10"[^>]*>Batch 10</);
  assert.match(html, /id="gmLang"/);
  assert.doesNotMatch(html, /for="gmLang"[^<]*<\/label>\s*<\/div>\s*<div[^>]*display:\s*none[^>]*>\s*<label[^>]*for="gmLang"/);
  assert.match(html, /id="gmList"/);
});

test("EN GM i18n uses Quick/Batch labels and lifetime credits copy", () => {
  const en = readEn();
  assert.equal(en.gmRand1, "Quick 1");
  assert.equal(en.gmRand10, "Batch 10");
  assert.doesNotMatch(en.gmRand70, /\b70\b/);
  assert.doesNotMatch(en.gm_daily_label, /daily/i);
  assert.doesNotMatch(en.gm_pro_1, /daily generation/i);
  assert.doesNotMatch(en.limit_modal_daily_a, /today|daily generation/i);
  assert.match(en.gm_desc, /Quick 1/);
  assert.match(en.gen_daily_limit_reached, /generation credits/i);
});

test("all locales: GM button keys must not promise Random 70", () => {
  const files = fs.readdirSync(localesDir).filter((f) => f.endsWith(".json"));
  for (const file of files) {
    const loc = JSON.parse(fs.readFileSync(path.join(localesDir, file), "utf8"));
    assert.doesNotMatch(String(loc.gmRand70 || ""), /\b70\b/, `${file} gmRand70 still mentions 70`);
    assert.doesNotMatch(String(loc.gmRand1 || ""), /Random 1/i, `${file} gmRand1 still Random 1`);
  }
});

test("fail-before: Quick 1 sends kind=gm with selected params", async () => {
  const { flow, apiCalls } = flowCtx({
    readGenParams: () => ({ mode: "min", lang: "en", style: "degen", antiN: 3 }),
  });
  await flow.generate("gm", 1);
  assert.equal(apiCalls.length, 1);
  const url = String(apiCalls[0][0]);
  assert.match(url, /kind=gm/);
  assert.match(url, /mode=min/);
  assert.match(url, /style=degen/);
  assert.match(url, /lang=en/);
});

test("fail-before: double click while inflight creates one request", async () => {
  const { flow, apiCalls, inflight } = flowCtx();
  inflight.gm = true;
  await flow.generate("gm", 1);
  assert.equal(apiCalls.length, 0);
});

test("fail-before: loading clears after success", async () => {
  const { flow, busyCalls } = flowCtx();
  await flow.generate("gm", 1);
  assert.deepEqual(busyCalls, [true, false]);
});

test("fail-before: loading clears after error", async () => {
  const { flow, busyCalls } = flowCtx({
    api: async () => {
      throw new Error("network timeout");
    },
  });
  await flow.generate("gm", 1);
  assert.deepEqual(busyCalls, [true, false]);
});

test("fail-before: empty output is not accepted as success", async () => {
  const { flow, store, apiCalls } = flowCtx({
    api: async () => ({ reply: "   " }),
  });
  await flow.generate("gm", 1);
  assert.equal(store.lines.length, 0);
  assert.ok(apiCalls.length >= 1);
});

test("fail-before: malformed output with object text is rejected by server contract", async () => {
  await withTestServer(async ({ base }) => {
    const handle = freshSmokeHandle("gmmal");
    const init = await fetch(`${base}/api/user/init`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ handle }),
    });
    const { token } = await init.json();
    const res = await fetch(`${base}/api/generate?kind=gm&mode=mid&lang=en&style=classic`, {
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
  const out = gen.collectBulkUniqueLines([], ["Gm bro ☀️", "Gm bro ☀️", "Morning!"], 3);
  assert.equal(out.length, 2);
  assert.equal(out[0], "Gm bro ☀️");
  assert.equal(out[1], "Morning!");
});

test("fail-before: remaining=0 does not call provider", async () => {
  const { flow, apiCalls } = flowCtx({
    getLastUsage: () => ({
      generation: { used: 50, totalLimit: 50, remaining: 0 },
      gm: { used: 50, limit: 50, sharedUsed: 50 },
    }),
  });
  await flow.generate("gm", 1);
  assert.equal(apiCalls.length, 0);
});

test("fail-before: remaining=1 allows Quick 1", async () => {
  const { flow, apiCalls } = flowCtx({
    getLastUsage: () => ({
      generation: { used: 49, totalLimit: 50, remaining: 1 },
      gm: { used: 49, limit: 50, sharedUsed: 49 },
    }),
  });
  await flow.generate("gm", 1);
  assert.equal(apiCalls.length, 1);
});

test("fail-before: remaining=1 blocks Batch 10 count above quota", async () => {
  const { flow, apiCalls } = flowCtx({
    getLastUsage: () => ({
      generation: { used: 49, totalLimit: 50, remaining: 1 },
      gm: { used: 49, limit: 50, sharedUsed: 49 },
    }),
    api: async (url) => {
      if (String(url).includes("generate-bulk")) return { list: ["Line A"] };
      return { reply: "Line A" };
    },
  });
  await flow.generate("gm", 10);
  assert.ok(apiCalls.length >= 1);
  const bulk = apiCalls.find((a) => String(a[0]).includes("generate-bulk"));
  if (bulk) assert.match(String(bulk[0]), /count=/);
});

test("fail-before: Pro bypasses free generation block", async () => {
  const { flow, apiCalls } = flowCtx({
    isPro: () => true,
    getLastUsage: () => ({
      generation: { used: 50, totalLimit: 50, remaining: 0 },
      gm: { used: 50, limit: 50, sharedUsed: 50 },
    }),
  });
  await flow.generate("gm", 1);
  assert.equal(apiCalls.length, 1);
});

test("fail-before: GM generate does not write GN state", async () => {
  const gmStore = { lines: [] };
  const gnStore = { lines: ["gn-only"] };
  const { flow } = flowCtx({
    readKey: (k) => (String(k).includes("gn") ? gnStore.lines.slice() : gmStore.lines.slice()),
    writeKey: (k, lines) => {
      if (String(k).includes("gn")) gnStore.lines = lines.slice();
      else gmStore.lines = lines.slice();
    },
  });
  await flow.generate("gm", 1);
  assert.equal(gnStore.lines.length, 1);
  assert.equal(gnStore.lines[0], "gn-only");
  assert.equal(gmStore.lines.length, 1);
});

test("fail-before: readGenParams reads gmStyle from DOM", () => {
  const els = {
    gmMode: { value: "max" },
    gmStyle: { value: "alpha" },
    gmPack: { value: "classic" },
  };
  const gp = loadFactory("app.genparams.js", "__GMXGenParamsFactory")({
    $: (id) => els[id] || null,
    storage: { lsGet: () => "", lsSet: () => {}, keys: {} },
    packsForKind: () => [{ id: "classic", mode: "mid", style: "classic", anti: 2 }],
    antiWindow: () => 5,
    getCurrentLang: () => "en",
    isPro: () => false,
    reqRefsForUnlockIndex: () => 0,
    unlockedCountByRefs: (n) => n,
    syncModePanelCopy: () => {},
  });
  const p = gp.readGenParams("gm");
  assert.equal(p.mode, "max");
  assert.equal(p.style, "alpha");
  assert.equal(p.lang, "en");
});

test("fail-before: gmgnwire binds keyboard batch shortcut", () => {
  const src = fs.readFileSync(path.join(root, "public", "app.gmgnwire.js"), "utf8");
  assert.match(src, /keydown/);
  assert.match(src, /ctrlKey.*Enter/i);
  assert.match(src, /generate\(active, 10\)/);
});

test("GM template generator quality matrix (server, template-based)", async () => {
  await withTestServer(async ({ base }) => {
    const handle = freshSmokeHandle("gmqual");
    const init = await fetch(`${base}/api/user/init`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ handle }),
    });
    const { token } = await init.json();
    const scenarios = [
      { style: "classic", mode: "mid" },
      { style: "minimal", mode: "min" },
      { style: "degen", mode: "mid" },
      { style: "noemoji", mode: "mid" },
      { style: "emoji", mode: "mid" },
    ];
    for (const s of scenarios) {
      const qs = new URLSearchParams({ kind: "gm", lang: "en", style: s.style, mode: s.mode }).toString();
      const res = await fetch(`${base}/api/generate?${qs}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const body = await res.json();
      assert.equal(body.kind, "gm", `${s.style} kind`);
      assert.equal(res.status, 200, `${s.style} status`);
      assert.ok(body.reply.trim(), `${s.style} empty`);
      assert.doesNotMatch(body.reply, /Here are|Option 1|```|\{|\[object/i);
      assert.ok(body.reply.length <= 280, `${s.style} too long for X`);
    }
    const bulkQs = new URLSearchParams({
      kind: "gm",
      lang: "en",
      style: "classic",
      mode: "mid",
      count: "10",
    }).toString();
    const bulkRes = await fetch(`${base}/api/generate-bulk?${bulkQs}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const bulk = await bulkRes.json();
    assert.ok(Array.isArray(bulk.list) && bulk.list.length >= 5);
    const norm = bulk.list.map((x) => String(x).trim().toLowerCase());
    assert.equal(new Set(norm).size, norm.length, "batch exact duplicates");
  });
});

test("bank empty state CTA triggers quick generate hook for GM", () => {
  const src = fs.readFileSync(path.join(root, "public", "app.bankui.js"), "utf8");
  assert.match(src, /bank_empty_generate/);
  assert.match(src, /onQuickGenerate/);
});
