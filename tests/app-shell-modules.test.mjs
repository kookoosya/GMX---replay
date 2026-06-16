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
  assert.equal(typeof ui.observeLazyBg, "function");
  assert.equal(typeof ui.postEvent, "function");
});

test("modals: open close stack and info", () => {
  const els = {};
  const bodyClasses = new Set();
  globalThis.document = {
    body: {
      classList: {
        add(c) { bodyClasses.add(c); },
        remove(c) { bodyClasses.delete(c); },
      },
    },
    getElementById(id) { return els[id] || null; },
    querySelectorAll(sel) {
      if (sel === "#gmx-modals .modalBack") {
        return Object.values(els).filter((e) => e._isModalBack);
      }
      return [];
    },
  };
  function makeModal(id) {
    const el = {
      id,
      _isModalBack: true,
      className: "modalBack hidden",
      classList: {
        contains(c) { return el.className.split(/\s+/).includes(c); },
        add(c) { if (!el.classList.contains(c)) el.className += (el.className ? " " : "") + c; },
        remove(c) { el.className = el.className.split(/\s+/).filter((x) => x !== c).join(" "); },
      },
      setAttribute() {},
      querySelector() {
        return { focus() {}, setAttribute() {}, hasAttribute: () => false };
      },
      _gmxModalBound: false,
      addEventListener() {},
    };
    els[id] = el;
    return el;
  }
  makeModal("limit_modal");
  makeModal("gmx_info_modal");
  els.gmx_info_title = { textContent: "" };
  els.gmx_info_body = { innerHTML: "" };
  els.gmx_info_close = { _gmxBound: false, onclick: null };
  const code = readFileSync(path.join(root, "public", "app.modals.js"), "utf8");
  const win = { addEventListener() {} };
  const factory = new Function("window", `${code}; return window.__GMXModalsFactory;`)(win);
  const modals = factory({
    $: (id) => els[id] || null,
  });
  modals.initModalsShell();
  modals.openModal("limit_modal");
  assert.ok(!els.limit_modal.classList.contains("hidden"));
  assert.ok(bodyClasses.has("gmx-modal-open"));
  modals.closeModal("limit_modal");
  assert.ok(els.limit_modal.classList.contains("hidden"));
  modals.showInfoModal("Title", "<b>ok</b>");
  assert.equal(els.gmx_info_title.textContent, "Title");
  assert.ok(!els.gmx_info_modal.classList.contains("hidden"));
});

test("gmgnwire: factory exports panel wiring", () => {
  const els = {};
  globalThis.document = {
    getElementById(id) { return els[id] || null; },
    querySelectorAll() { return []; },
    addEventListener() {},
  };
  const wire = loadFactory("app.gmgnwire.js", "__GMXGmGnWireFactory")({
    $: (id) => els[id] || null,
    lsGet: (_k, d) => d,
    lsSet: () => {},
    getReplyLangs: () => [["en", "English"]],
  });
  assert.equal(typeof wire.wireGmGnPanels, "function");
  assert.equal(typeof wire.wireReplyLangSelects, "function");
  wire.wireGmGnPanels();
  wire.wireReplyLangSelects({ gmLangSel: { value: "en", addEventListener() {} }, gnLangSel: null });
});

test("i18nui: tr and prettyError", () => {
  const i18n = loadFactory("app.i18nui.js", "__GMXI18nUiFactory")({
    getSiteLang: () => "en",
    getI18n: () => ({
      en: { hello: "Hello", err_unknown: "Unknown error" },
    }),
  });
  assert.equal(i18n.t("hello"), "Hello");
  assert.equal(i18n.prettyError(""), "Unknown error");
  assert.equal(i18n.sanitizeI18nValue("en", "Привет", "Hello"), "Hello");
});

test("customwallpapers: effective site list", () => {
  const mod = loadFactory("app.customwallpapers.js", "__GMXCustomWallpapersFactory")({
    customUploadId: "custom_upload",
    getSiteCustomUpload: () => "data:image/jpeg;base64,abc",
    getExtCustomUpload: () => "",
  });
  assert.equal(mod.getEffectiveCustomWallpapersSite().length, 1);
  assert.equal(mod.getEffectiveCustomWallpapersSite()[0].id, "custom_upload");
});

test("langui: flagEmoji helper", () => {
  const lang = loadFactory("app.langui.js", "__GMXLangUiFactory")({ $: () => null });
  assert.equal(lang.flagEmoji("us"), "US");
  assert.equal(lang.flagEmoji(""), "GLB");
});

test("tabstate: normalizeTopLevelTab aliases", () => {
  const tab = loadFactory("app.tabstate.js", "__GMXTabStateFactory")();
  assert.equal(tab.normalizeTopLevelTab("upgrade"), "wallet");
  assert.equal(tab.normalizeTopLevelTab("extension-themes"), "extthemes");
  assert.equal(tab.normalizeTopLevelTab("bogus"), "home");
  tab.setCurrentTab("gm");
  assert.equal(tab.getCurrentTab(), "gm");
});

test("wallpaperhelpers: wallpaperUnlocked free tier", () => {
  const wpMod = loadFactory("app.wallpapers.js", "__GMXWallpapersFactory")({
    getAssetRev: () => "test",
    getSiteCustomUpload: () => "",
    getExtCustomUpload: () => "",
  });
  const helpers = loadFactory("app.wallpaperhelpers.js", "__GMXWallpaperHelpersFactory")({
    wp: wpMod,
    getWallpapers: () => [{ id: "a", tier: "pack" }, { id: "b", tier: "pack" }],
    getExtWallpapers: () => [],
    isPro: () => false,
    unlockedCountByRefs: (total, free) => free,
    freeVisibleWallpapers: 1,
    customWpFreeCount: 2,
  });
  assert.equal(helpers.wallpaperUnlocked({ tier: "pack" }, 0, 0), true);
  assert.equal(helpers.wallpaperUnlocked({ tier: "pack" }, 1, 0), false);
  assert.equal(helpers.wallpaperUnlocked({ tier: "custom" }, 1, 0), true);
});

test("sitei18nui: siteTr fallback", () => {
  const ui = loadFactory("app.sitei18nui.js", "__GMXSiteI18nUiFactory")({
    getSiteLang: () => "en",
    getI18n: () => ({ en: { hello: "Hello" } }),
    sanitizeI18nValue: (_l, v) => v,
  });
  assert.equal(ui.siteTr("hello"), "Hello");
  assert.equal(ui.siteTr("missing", "Fallback"), "Fallback");
});

test("sitei18ndynamic: nextReferralUnlockAt steps", () => {
  const dyn = loadFactory("app.sitei18ndynamic.js", "__GMXSiteI18nDynamicFactory")({
    t: (k) => k,
    siteTr: (k, fb) => fb || k,
    $: () => null,
  });
  assert.equal(dyn.nextReferralUnlockAt(0), 1);
  assert.equal(dyn.nextReferralUnlockAt(3), 7);
  assert.equal(dyn.nextReferralUnlockAt(100), 0);
  const copy = dyn.getReferralUiCopy("en");
  assert.equal(copy.title, "r_how");
});

test("sitelangmenu: fillSelect builds options", () => {
  globalThis.document = {
    createElement() {
      return { value: "", textContent: "" };
    },
  };
  const sel = { innerHTML: "", options: [], appendChild(o) { this.options.push(o); } };
  const menu = loadFactory("app.sitelangmenu.js", "__GMXSiteLangMenuFactory")({
    getSiteLangs: () => [["en", "English"]],
    getReplyLangs: () => [["en", "English"]],
    getSiteLang: () => "en",
    setSiteLang: () => {},
  });
  menu.fillSelect(sel, [["en", "English"], ["de", "German"]]);
  assert.equal(sel.options.length, 2);
  assert.equal(sel.options[0].value, "en");
});

test("shellerrors: isNetworkMessage detects fetch failures", () => {
  const err = loadFactory("app.shellerrors.js", "__GMXShellErrorsFactory")({});
  assert.equal(err.isNetworkMessage("Failed to fetch"), true);
  assert.equal(err.isNetworkMessage("Syntax error"), false);
});

test("tabwire: normalizeTopLevelTab via tab helper", () => {
  let shown = "";
  const wire = loadFactory("app.tabwire.js", "__GMXTabWireFactory")({
    normalizeTopLevelTab: (n) => (n === "upgrade" ? "wallet" : n),
    showTab: (n) => { shown = n; },
    trackEvent: () => {},
    ensurePredictionTabVisible: () => {},
  });
  wire.tab("upgrade");
  assert.equal(shown, "wallet");
});

test("authwire: factory exports lazy auth helpers", () => {
  let created = 0;
  const code = readFileSync(path.join(root, "public", "app.authwire.js"), "utf8");
  const win = {
    __GMXAuthFactory: () => {
      created++;
      return {
        getHandle: () => "@test",
        getToken: () => "tok",
        normalizeHandle: (s) => String(s || ""),
        isConnected: () => true,
        requireConnected: () => true,
        isPublicApi: () => false,
        initSession: async () => true,
        api: async () => ({}),
      };
    },
  };
  new Function("window", `${code};`)(win);
  const wire = win.__GMXAuthWireFactory({ buildAuthConfig: () => ({}) });
  assert.equal(wire.getHandle(), "@test");
  assert.equal(wire.getHandle(), "@test");
  assert.equal(created, 1);
});

test("extview: normalizeExtViewValue and bindExtTabs", () => {
  const extview = loadFactory("app.extview.js", "__GMXExtViewFactory")({
    $: () => null,
    getStoredExtView: () => "theme",
    setStoredExtView: () => {},
    renderExtThemes: () => {},
    renderExtWallpapers: () => {},
  });
  assert.equal(extview.normalizeExtViewValue("wall"), "wall");
  assert.equal(extview.normalizeExtViewValue("bogus"), "theme");
  assert.equal(typeof extview.setExtView, "function");
  assert.equal(typeof extview.bindExtTabs, "function");
  assert.equal(typeof extview.extSyncNow, "function");
});

test("extthemesui: factory exports render helper", () => {
  const mod = loadFactory("app.extthemesui.js", "__GMXExtThemesUiFactory")({
    getExtThemes: () => [],
    getExtWallpapers: () => [],
  });
  assert.equal(typeof mod.renderExtThemes, "function");
});

test("themeapply: factory exports applyTheme", () => {
  const prevDoc = globalThis.document;
  const props = new Map();
  let bgTab = "";
  globalThis.document = {
    documentElement: {
      style: { setProperty: (k, v) => props.set(k, v) },
      classList: { contains: () => false, add: () => {} },
      dataset: {},
    },
  };
  try {
    const mod = loadFactory("app.themeapply.js", "__GMXThemeApplyFactory")({
      pickAccentOn: () => "#fff",
      getThemes: () => [{ id: "classic", a: "red", b: "blue" }],
      getCurrentTab: () => "home",
      setBg: (tab) => { bgTab = tab; },
    });
    assert.equal(typeof mod.applyTheme, "function");
    mod.applyTheme("classic");
    assert.equal(bgTab, "home");
    assert.equal(props.get("--accentA"), "red");
  } finally {
    globalThis.document = prevDoc;
  }
});

test("wallpaperstore: tab key helpers", () => {
  const mem = new Map();
  const store = loadFactory("app.wallpaperstore.js", "__GMXWallpaperStoreFactory")({
    keys: { wpGlobal: "gmx_wp_global", wpTabPrefix: "gmx_wp_tab_" },
    lsGet: (k, d) => (mem.has(k) ? mem.get(k) : d),
    lsSet: (k, v) => { mem.set(k, v); },
    lsRemove: (k) => { mem.delete(k); },
    normalizeWallpaperId: (id) => id,
  });
  store.setWallpaperForTab("gm", "v2_001");
  assert.equal(store.getWallpaperForTab("gm"), "v2_001");
  assert.equal(store.wallpaperKeyForTab("gm"), "gmx_wp_tab_gm");
});

test("extwallpaperstore: view normalization", () => {
  const mem = new Map();
  const store = loadFactory("app.extwallpaperstore.js", "__GMXExtWallpaperStoreFactory")({
    keys: { extWp: "gmx_ext_wp", extWpTarget: "gmx_ext_wp_target", extWpViewPrefix: "gmx_ext_wp_view_" },
    extLsSet: (k, v) => { mem.set(k, v); },
    lsGet: (k, d) => (mem.has(k) ? mem.get(k) : d),
    lsSet: (k, v) => { mem.set(k, v); },
    lsRemove: (k) => { mem.delete(k); },
    normalizeExtWallpaperId: (id) => id,
  });
  assert.equal(store.normalizeExtWallpaperView("popup"), "popup");
  assert.equal(store.normalizeExtWallpaperView("bogus"), "all");
  store.setExtWallpaperForView("popup", "extv3_01");
  assert.equal(store.getExtWallpaperForView("popup"), "extv3_01");
});

test("themesui: unlockTagText and renderThemes", () => {
  const mod = loadFactory("app.themesui.js", "__GMXThemesUiFactory")({
    reqRefsForUnlockIndex: (idx, free) => (idx < free ? 0 : 3),
    freeVisibleThemes: 8,
  });
  assert.equal(mod.unlockTagText(0, false, 8), "FREE");
  assert.equal(mod.unlockTagText(10, false, 8), "3 ref");
  assert.equal(typeof mod.renderThemes, "function");
});

test("extapply: factory exports apply helpers", () => {
  const mod = loadFactory("app.extapply.js", "__GMXExtApplyFactory")({
    $: () => null,
    getExtThemes: () => [{ id: "classic" }],
    unlockedExtThemesCount: () => 1,
  });
  assert.equal(typeof mod.applyExtTheme, "function");
  assert.equal(typeof mod.applyExtWallpaper, "function");
});

test("extcustombgui: factory exports render helper", () => {
  const mod = loadFactory("app.extcustombgui.js", "__GMXExtCustomBgUiFactory")({
    $: () => null,
  });
  assert.equal(typeof mod.renderExtCustomBgUI, "function");
});

test("nav: showTab toggles active tab", () => {
  const flags = new Map();
  const prevDoc = globalThis.document;
  globalThis.document = {
    querySelectorAll: (sel) => {
      if (sel === ".tab") {
        return [{ dataset: { tab: "home" }, classList: { toggle(c, on) { if (c === "active") flags.set("home", on); } } }];
      }
      return [];
    },
    getElementById: (id) => {
      if (id === "tab-home") return { classList: { toggle(_c, on) { flags.set("pane", !on); } } };
      return null;
    },
  };
  try {
    const nav = loadFactory("app.nav.js", "__GMXNavFactory")({
      normalizeTopLevelTab: (n) => n,
      setCurrentTab: () => {},
      getTopLevelTabs: () => ["home"],
      setBg: () => {},
      persistLastTab: () => {},
    });
    nav.showTab("home");
    assert.equal(flags.get("home"), true);
  } finally {
    globalThis.document = prevDoc;
  }
});

test("extwallpaperui: factory exports render helper", () => {
  const extWpUi = loadFactory("app.extwallpaperui.js", "__GMXExtWallpaperUiFactory")({
    $: () => null,
  });
  assert.equal(typeof extWpUi.renderExtWallpapers, "function");
  assert.equal(typeof extWpUi.initExtWallpaperControls, "function");
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

test("setbg: applies tab gradient and delegates wallpaper hooks", () => {
  let wpCalled = "";
  let userCalled = "";
  const prevDoc = globalThis.document;
  globalThis.document = {
    body: { classList: { contains: () => false } },
    documentElement: { style: { setProperty() {} } },
  };
  try {
    const setbg = loadFactory("app.setbg.js", "__GMXSetBgFactory")({
      getTabBg: () => "linear-gradient(red, blue)",
      applyWallpaper: (tab) => { wpCalled = tab; },
      applyUserBg: (tab) => { userCalled = tab; },
    });
    setbg.setBg("gm");
    assert.equal(wpCalled, "gm");
    assert.equal(userCalled, "gm");
  } finally {
    globalThis.document = prevDoc;
  }
});

test("accountui: applyRefCountEligible updates count", () => {
  const mem = new Map();
  let refCount = 0;
  const storage = {
    lsSet(k, v) { mem.set(k, String(v)); },
    lsGet(k, fb = "") { return mem.has(k) ? mem.get(k) : fb; },
  };
  const account = loadFactory("app.accountui.js", "__GMXAccountUiFactory")({
    $: () => null,
    storage,
    refEligibleCacheKey: "gmx_ref_eligible_cache",
    getRefCount: () => refCount,
    setRefCount: (n) => { refCount = n; },
    getAuthOk: () => false,
    getIsAdminFlag: () => false,
  });
  const changed = account.applyRefCountEligible(5);
  assert.equal(refCount, 5);
  assert.equal(changed, true);
  assert.equal(mem.get("gmx_ref_eligible_cache"), "5");
});

test("wallpaperui: factory exports grid helpers", () => {
  const wpUi = loadFactory("app.wallpaperui.js", "__GMXWallpaperUiFactory")({
    $: () => null,
    storage: { lsGet: () => "", lsSet() {}, lsRemove() {} },
  });
  assert.equal(typeof wpUi.renderWallpaperUI, "function");
  assert.equal(typeof wpUi.initWallpapers, "function");
  assert.equal(typeof wpUi.markWallpaperSelection, "function");
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
