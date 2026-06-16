import { readFileSync } from "fs";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";
import test from "node:test";
import assert from "node:assert/strict";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

function loadFactory(file, exportName) {
  const code = readFileSync(path.join(root, "public", file), "utf8");
  const fn = new Function("window", `${code}; return window.${exportName};`);
  const win = {};
  return fn(win);
}

function loadUnlock(ctx) {
  const factory = loadFactory("app.unlock.js", "__GMXUnlockFactory");
  return factory(ctx);
}

test("unlock: free tier refs unlock progression", () => {
  const unlock = loadUnlock({ isPro: () => false, getRefCount: () => 9 });
  assert.equal(unlock.reqRefsForUnlockIndex(7, 8), 0);
  assert.equal(unlock.reqRefsForUnlockIndex(8, 8), 3);
  assert.equal(unlock.unlockedCountByRefs(20, 8), 11);
  assert.equal(unlock.formatUnlockMeter(11, 20), "11/20");
});

test("unlock: pro bypasses referral gates", () => {
  const unlock = loadUnlock({ isPro: () => true, getRefCount: () => 0 });
  assert.equal(unlock.unlockedCountByRefs(60, 8), 60);
  assert.equal(unlock.formatUnlockMeter(3, 60), "All");
});

test("wallpapers: catalog and url helpers", () => {
  const factory = loadFactory("app.wallpapers.js", "__GMXWallpapersFactory");
  const wp = factory({
    getAssetRev: () => "rev1",
    getSiteCustomUpload: () => "",
    getExtCustomUpload: () => "",
  });
  const site = wp.buildSiteWallpapers();
  assert.equal(site.length, 58);
  assert.equal(site[0].id, "v2_001");
  assert.equal(wp.normalizeWallpaperId("w12", site), "v2_001");
  assert.match(wp.wallpaperFullUrl("v2_001", site), /\/assets\/wallpapers\/v2_001\.webp\?v=rev1$/);
  const ext = wp.buildExtWallpapers();
  assert.equal(ext[0].id, "extv3_01");
  assert.equal(wp.normalizeExtWallpaperIdLocal("ext_3", ext), "extv3_03");
});

test("themes: catalog exports", () => {
  const themes = loadFactory("app.themes.js", "__GMXThemesFactory")();
  assert.equal(themes.THEMES.length, 60);
  assert.equal(themes.STYLES.length, 12);
  assert.equal(themes.GM_PACKS.length, 7);
  assert.equal(themes.packsForKind("gn").length, 7);
  assert.equal(themes.pickAccentOn("rgba(255,255,255,1)", "rgba(255,255,255,1)"), "#0A0D15");
});

test("generate: mergeAppendUnique dedupes lines", () => {
  const gen = loadFactory("app.generate.js", "__GMXGenerateFactory")();
  const merged = gen.mergeAppendUnique(["Hello", "World"], ["world", "Again"]);
  assert.deepEqual(merged, ["Hello", "World", "Again"]);
});

test("generate: repeatKey and bulk collect", () => {
  const gen = loadFactory("app.generate.js", "__GMXGenerateFactory")();
  const rk = gen.repeatKey("GM legend bro", 2);
  assert.ok(rk.includes("gm"));
  const bulk = gen.collectBulkUniqueLines(["Hello"], ["hello", "Fresh line"], 5);
  assert.deepEqual(bulk, ["Fresh line"]);
  assert.equal(gen.isLineAlreadySaved(["GM vibes"], "gm vibes", 1), true);
});

test("ui: factory exports perf helpers", () => {
  const ui = loadFactory("app.ui.js", "__GMXUiFactory")();
  assert.equal(typeof ui.chunkedRender, "function");
  assert.equal(typeof ui.yieldToUiFrame, "function");
  assert.equal(typeof ui.prefetchImage, "function");
});

test("banks: read/write saved lines", () => {
  const mem = new Map();
  const storage = {
    keys: {},
    lsGet(key, fallback = "") {
      return mem.has(key) ? mem.get(key) : fallback;
    },
    lsSet(key, value) {
      if (value === undefined || value === null || value === "") mem.delete(key);
      else mem.set(key, String(value));
    },
    lsRemove(key) {
      mem.delete(key);
    },
  };
  const gen = loadFactory("app.generate.js", "__GMXGenerateFactory")();
  const banks = loadFactory("app.banks.js", "__GMXBanksFactory")({
    storage,
    dedupeLines: gen.dedupeLines,
    EMPTY: "__EMPTY__",
  });
  const key = "test_bank_key";
  storage.lsSet(key, "Line one\nLine two");
  assert.deepEqual(banks.readKey(key), ["Line one", "Line two"]);
  banks.writeKey(key, ["A", "B"]);
  assert.equal(storage.lsGet(key), "A\nB");
});

test("antirepeat: window map and ban filtering", () => {
  const mem = new Map();
  const storage = {
    lsKeyRecent(kind) {
      return kind === "gn" ? "gmx_gn_recent" : "gmx_gm_recent";
    },
    lsGet(key, fallback = "") {
      return mem.has(key) ? mem.get(key) : fallback;
    },
    lsSet(key, value) {
      if (value === undefined || value === null || value === "") mem.delete(key);
      else mem.set(key, String(value));
    },
  };
  const gen = loadFactory("app.generate.js", "__GMXGenerateFactory")();
  const anti = loadFactory("app.antirepeat.js", "__GMXAntiRepeatFactory")({
    storage,
    repeatKey: gen.repeatKey,
    readKey: () => ["GM legend"],
    filterLinesByBan: gen.filterLinesByBan,
  });
  assert.equal(anti.antiWindow(2), 20);
  assert.equal(anti.antiWindow(9), 50);
  anti.pushRecent("gm", ["shape_a", "shape_b"]);
  assert.deepEqual(anti.getRecent("gm"), ["shape_a", "shape_b"]);
  const ban = anti.buildBanSet("gm", "gmx_gm_bank", 2);
  assert.ok(ban.size >= 2);
  const kept = anti.filterLines("gm", "gmx_gm_bank", ["GM legend", "Fresh morning"], 2);
  assert.deepEqual(kept, ["Fresh morning"]);
});

test("format: escapeHtml and friendly errors", () => {
  const fmt = loadFactory("app.format.js", "__GMXFormatFactory")();
  assert.equal(fmt.escapeHtml(`a & b <c>`), "a &amp; b &lt;c&gt;");
  assert.equal(fmt.friendlyUiErrorMessage("timeout", { scope: "generate" }), "Generation timed out. Try again.");
  assert.equal(fmt.friendlyUiErrorMessage("not_connected"), "Connect first.");
  assert.equal(fmt.isNetworkishErrorMessage("request_failed"), true);
});

test("chrome: exports dom helpers", () => {
  const chrome = loadFactory("app.chrome.js", "__GMXChromeFactory")();
  assert.equal(typeof chrome.$, "function");
  assert.equal(typeof chrome.toast, "function");
  assert.equal(typeof chrome.setDegraded, "function");
  assert.equal(typeof chrome.setBusy, "function");
});

test("cleanfill: toggle persisted in storage", () => {
  const mem = new Map();
  const storage = {
    bootstrapCleanFillDefaults() {},
    getCleanFillEnabled(kind) {
      return mem.get(kind === "gn" ? "gn_cf" : "gm_cf") === "1";
    },
    setCleanFillEnabledRaw(kind, on) {
      mem.set(kind === "gn" ? "gn_cf" : "gm_cf", on ? "1" : "0");
    },
  };
  const cf = loadFactory("app.cleanfill.js", "__GMXCleanFillFactory")({
    storage,
    $: () => null,
    siteLang: () => "en",
  });
  assert.equal(cf.CLEAN_FILL_STRENGTH, 2);
  assert.equal(cf.getEnabled("gm"), false);
  cf.setEnabled("gm", true, true);
  assert.equal(cf.getEnabled("gm"), true);
  const copy = cf.copyForKind("gm");
  assert.equal(copy.button, "Best pass: on");
});

test("genparams: anti strength and readGenParams", () => {
  const mem = new Map();
  const storage = {
    keys: { GM_PACK: "gmx_gm_pack", GN_PACK: "gmx_gn_pack" },
    lsKeyAnti: (kind) => (kind === "gn" ? "gmx_gn_anti" : "gmx_gm_anti"),
    lsGet: (k, fb = "") => (mem.has(k) ? mem.get(k) : fb),
    lsSet: (k, v) => mem.set(k, String(v)),
  };
  const themes = loadFactory("app.themes.js", "__GMXThemesFactory")();
  const gen = loadFactory("app.generate.js", "__GMXGenerateFactory")();
  const anti = loadFactory("app.antirepeat.js", "__GMXAntiRepeatFactory")({
    storage,
    repeatKey: gen.repeatKey,
    readKey: () => [],
    filterLinesByBan: gen.filterLinesByBan,
  });
  const gp = loadFactory("app.genparams.js", "__GMXGenParamsFactory")({
    $: () => null,
    storage,
    packsForKind: (kind) => themes.packsForKind(kind),
    antiWindow: (s) => anti.antiWindow(s),
    getCurrentLang: () => "en",
    isPro: () => false,
    reqRefsForUnlockIndex: () => 3,
    unlockedCountByRefs: (total) => total,
    freeVisiblePacks: 8,
    t: (key) => key,
    syncModePanelCopy: () => {},
  });
  storage.lsSet("gmx_gm_anti", "4");
  assert.equal(gp.getAntiStrength("gm"), 4);
  const params = gp.readGenParams("gm");
  assert.equal(params.mode, "mid");
  assert.equal(params.lang, "en");
  assert.equal(params.antiN, 40);
});

test("toggles: best mode storage", () => {
  const mem = new Map();
  const storage = {
    keys: {
      BEST_ENABLED: "gmx_best_enabled",
      TOGGLES_BOOTSTRAP_V2: "gmx_toggles_bootstrap_v2",
      GM_CLEAN_FILL: "gmx_gm_clean_fill",
      GN_CLEAN_FILL: "gmx_gn_clean_fill",
    },
    lsGet(k, fb = "") { return mem.has(k) ? mem.get(k) : fb; },
    lsSet(k, v) { mem.set(k, String(v)); },
  };
  const toggles = loadFactory("app.toggles.js", "__GMXTogglesFactory")({
    storage,
    $: () => null,
  });
  toggles.bootstrap();
  assert.equal(toggles.getBestMode(), false);
  toggles.setBestMode(true, true);
  assert.equal(toggles.getBestMode(), true);
});

test("custombg: tab unlock helpers", () => {
  const mem = new Map();
  const storage = {
    keys: {
      CUSTOM_BG: "gmx_custom_bg",
      CUSTOM_BG_GLOBAL: "gmx_custom_bg_global",
      CUSTOM_BG_TAB_PREFIX: "gmx_custom_bg_tab_",
    },
    lsGet(k, fb = "") { return mem.has(k) ? mem.get(k) : fb; },
    lsSet(k, v) { mem.set(k, String(v)); },
    lsRemove(k) { mem.delete(k); },
  };
  const cbg = loadFactory("app.custombg.js", "__GMXCustomBgFactory")({
    storage,
    isPro: () => false,
    unlockedCountByRefs: (total) => total,
    reqRefsForUnlockIndex: () => 0,
  });
  assert.equal(cbg.TABS.length, 10);
  assert.equal(cbg.canSetCustomBgOnTab("all"), true);
  assert.equal(cbg.requiredRefsForCustomBgTab("gm"), 0);
});

test("custombg: applyUserBg toggles hasUserBg", () => {
  const mem = new Map();
  const storage = {
    keys: { CUSTOM_BG_GLOBAL: "gmx_custom_bg_global", CUSTOM_BG_TAB_PREFIX: "gmx_custom_bg_tab_" },
    lsGet(k, fb = "") { return mem.has(k) ? mem.get(k) : fb; },
    lsSet(k, v) { mem.set(k, String(v)); },
    lsRemove(k) { mem.delete(k); },
  };
  const flags = new Set();
  const prevDoc = globalThis.document;
  globalThis.document = {
    documentElement: { style: { setProperty() {} } },
    body: {
      classList: {
        contains: (c) => flags.has(c),
        toggle(c, on) { if (on) flags.add(c); else flags.delete(c); },
        remove(c) { flags.delete(c); },
      },
    },
  };
  try {
    const cbg = loadFactory("app.custombg.js", "__GMXCustomBgFactory")({
      storage,
      isPro: () => false,
      unlockedCountByRefs: (t) => t,
      reqRefsForUnlockIndex: () => 0,
      getCurrentTab: () => "home",
      hasWallBg: () => false,
      hasActiveUnlockedWallpaper: () => false,
    });
    storage.lsSet("gmx_custom_bg_global", "data:image/jpeg;base64,abc");
    cbg.applyUserBg("home");
    assert.equal(flags.has("hasUserBg"), true);
  } finally {
    globalThis.document = prevDoc;
  }
});

test("wallpaperapply: applyWallpaper toggles hasWallBg", () => {
  const prevDoc = globalThis.document;
  const flags = new Set();
  const layer = {
    style: { display: "" },
    replaceChildren() {},
    setAttribute() {},
    getAttribute: () => "",
    querySelector: () => null,
    appendChild() {},
  };
  globalThis.document = {
    documentElement: { style: { setProperty() {} } },
    body: {
      classList: {
        toggle(c, on) { if (on) flags.add(c); else flags.delete(c); },
      },
      prepend() {},
    },
    getElementById: () => null,
    createElement: () => layer,
  };
  try {
    const wpApply = loadFactory("app.wallpaperapply.js", "__GMXWallpaperApplyFactory")({
      getCurrentTab: () => "home",
      getWallpaperForTab: () => "v2_001",
      getEffectiveCustomWallpapers: () => [],
      getWallpapers: () => [{ id: "v2_001", tier: "free" }],
      wallpaperUnlocked: () => true,
      wallpaperFullUrl: () => "/assets/wallpapers/v2_001.webp",
      ensureWallpaperLayer: () => layer,
      setWallpaperLayerImage: (l, url) => {
        layer.style.display = url ? "block" : "none";
      },
    });
    wpApply.applyWallpaper("home");
    assert.equal(flags.has("hasWallBg"), true);
  } finally {
    globalThis.document = prevDoc;
  }
});

test("health: ping inactive without session", async () => {
  const health = loadFactory("app.health.js", "__GMXHealthFactory")({
    $: () => null,
    api: async () => ({ ok: true }),
    getHandle: () => "",
    getToken: () => "",
    getAuthOk: () => false,
  });
  await health.ping();
  assert.equal(typeof health.setApiPillState, "function");
});

test("tabtheme: getTabBg returns gradient string", () => {
  const prevGcs = globalThis.getComputedStyle;
  const prevDoc = globalThis.document;
  globalThis.document = { documentElement: {} };
  globalThis.getComputedStyle = () => ({
    getPropertyValue: (name) =>
      name === "--accentB" ? "rgba(0,229,255,1)" : "rgba(124,92,255,1)",
  });
  try {
    const tabTheme = loadFactory("app.tabtheme.js", "__GMXTabThemeFactory")();
    const bg = tabTheme.getTabBg("home");
    assert.match(bg, /linear-gradient/);
    assert.equal(typeof tabTheme.TAB_THEME.home, "function");
  } finally {
    globalThis.getComputedStyle = prevGcs;
    globalThis.document = prevDoc;
  }
});

test("logs: ring buffer", () => {
  const logs = loadFactory("app.logs.js", "__GMXLogsFactory")();
  logs.logEvent("test", { a: 1 });
  const out = logs.getLogs();
  assert.equal(out.length, 1);
  assert.equal(out[0].type, "test");
});

test("paywall: stable abVariant", () => {
  const mem = new Map();
  const storage = {
    lsGet(k, fb = "") { return mem.has(k) ? mem.get(k) : fb; },
    lsSet(k, v) { mem.set(k, String(v)); },
  };
  const paywall = loadFactory("app.paywall.js", "__GMXPaywallFactory")({
    $: () => null,
    storage,
    getHandle: () => "user123",
    trackEvent: async () => {},
    onNavigateWallet: () => {},
  });
  const a = paywall.abVariant();
  const b = paywall.abVariant();
  assert.ok(a === "A" || a === "B");
  assert.equal(a, b);
});

test("usage: normLimitForUI and setMeter", () => {
  const usage = loadFactory("app.usage.js", "__GMXUsageFactory")({
    $: () => null,
    getToken: () => "",
    getSaveCapFree: () => 50,
  });
  assert.equal(usage.normLimitForUI(70), 70);
  assert.equal(usage.normLimitForUI(999999), Infinity);
  assert.equal(usage.normLimitForUI("x"), Infinity);
  usage.setMeter(null, null, 3, 10);
});

test("help: factory exports modal helpers", () => {
  const help = loadFactory("app.help.js", "__GMXHelpFactory")({
    $: () => null,
    isPro: () => false,
    getSaveCapFree: () => 50,
    getLastUsage: () => ({ gm: { used: 1, limit: 70 }, gn: { used: 2, limit: 70 } }),
    getLastSaved: () => ({ gm: 0, gn: 0 }),
    normLimitForUI: (n) => n,
  });
  assert.equal(typeof help.renderHelpModal, "function");
  assert.equal(typeof help.bindHelpModal, "function");
  assert.equal(help.isOpen(), false);
});

test("wallpapers: layer DOM helpers", () => {
  const prevDoc = globalThis.document;
  function mockLayer() {
    const children = [];
    return {
      id: "",
      className: "",
      style: { display: "" },
      _attrs: {},
      setAttribute(k, v) { this._attrs[k] = v; },
      getAttribute(k) { return this._attrs[k] ?? null; },
      removeAttribute(k) { delete this._attrs[k]; },
      replaceChildren() { children.length = 0; },
      appendChild(el) { children.push(el); },
      querySelector() { return children[0] || null; },
    };
  }
  const body = { prepend() {} };
  globalThis.document = {
    getElementById: () => null,
    createElement: () => mockLayer(),
    body,
  };
  try {
    const factory = loadFactory("app.wallpapers.js", "__GMXWallpapersFactory");
    const wp = factory({
      getAssetRev: () => "",
      getSiteCustomUpload: () => "",
      getExtCustomUpload: () => "",
    });
    const layer = wp.ensureWallpaperLayer();
    assert.ok(layer);
    wp.setWallpaperLayerImage(layer, "");
    wp.setWallpaperLayerImage(layer, "https://example.com/a.webp");
    assert.equal(layer.style.display, "block");
  } finally {
    globalThis.document = prevDoc;
  }
});

test("styles: unlocked count", () => {
  const styles = loadFactory("app.themes.js", "__GMXThemesFactory")();
  const ui = loadFactory("app.styles.js", "__GMXStylesFactory")({
    $: () => null,
    getStyles: () => styles.STYLES,
    isPro: () => false,
    reqRefsForUnlockIndex: () => 3,
    unlockedCountByRefs: (total, free) => Math.min(total, free),
    freeVisibleStyles: 8,
    t: (k) => k,
  });
  assert.equal(ui.unlockedStylesCount(), 8);
});
