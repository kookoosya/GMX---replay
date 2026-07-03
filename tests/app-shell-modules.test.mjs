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
  const packCount = wp.SITE_PACK_COUNT;
  assert.equal(site.length, packCount);
  assert.equal(site[0].id, "v2_001");
  assert.equal(wp.normalizeWallpaperId("w12", site), "v2_001");
  assert.match(wp.wallpaperFullUrl("v2_001", site), /\/assets\/wallpapers\/sitev4_001\.webp\?v=rev1$/);
  assert.match(wp.wallpaperThumbUrl("v2_001", site), /\/assets\/wallpapers\/thumbs\/sitev4_001\.webp\?v=rev1$/);
  const ext = wp.buildExtWallpapers();
  assert.equal(ext.length, wp.EXT_PACK_COUNT);
  assert.equal(ext[0].id, "extskin_001");
  assert.equal(wp.normalizeExtWallpaperIdLocal("ext_3", ext), "extskin_003");
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
  assert.equal(typeof ui.tableSkeletonHtml, "function");
  assert.ok(ui.tableSkeletonHtml(2, 3).includes("skeleton-row"));
  assert.equal(typeof ui.mountLineListSkeleton, "function");
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

test("sitei18nui: applyLang skips when language unchanged", () => {
  let patchCalls = 0;
  const ui = loadFactory("app.sitei18nui.js", "__GMXSiteI18nUiFactory")({
    getSiteLang: () => "en",
    getI18n: () => ({ en: { hello: "Hello" } }),
    sanitizeI18nValue: (_l, v) => v,
    onPatchDynamicCopy: () => {
      patchCalls += 1;
    },
  });
  assert.equal(ui.applyLang(), true);
  assert.equal(patchCalls, 1);
  assert.equal(ui.applyLang(), false);
  assert.equal(patchCalls, 1);
  assert.equal(ui.applyLang({ force: true }), true);
  assert.equal(patchCalls, 2);
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
  store.setExtWallpaperForView("popup", "extskin_001");
  assert.equal(store.getExtWallpaperForView("popup"), "extskin_001");
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
        return [{
          dataset: { tab: "home" },
          classList: { toggle(c, on) { if (c === "active") flags.set("home", on); } },
          setAttribute() {},
        }];
      }
      return [];
    },
    getElementById: (id) => {
      if (id === "tab-home") {
        return {
          classList: { toggle(_c, on) { flags.set("pane", !on); } },
          removeAttribute() {},
          setAttribute() {},
        };
      }
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

test("genparams: normalizeStyle and dropdown style wins over pack", () => {
  const mem = new Map();
  const storage = {
    keys: { GM_PACK: "gmx_gm_pack", GN_PACK: "gmx_gn_pack", GM_STYLE: "gmx_gm_style_v2" },
    lsKeyAnti: (kind) => (kind === "gn" ? "gmx_gn_anti" : "gmx_gm_anti"),
    lsKeyStyle: (kind) => (kind === "gn" ? "gmx_gn_style_v2" : "gmx_gm_style_v2"),
    lsGet: (k, fb = "") => (mem.has(k) ? mem.get(k) : fb),
    lsSet: (k, v) => mem.set(k, String(v)),
  };
  const themes = loadFactory("app.themes.js", "__GMXThemesFactory")();
  const gp = loadFactory("app.genparams.js", "__GMXGenParamsFactory")({
    $: (id) => {
      if (id === "gmStyle") return { value: "degen" };
      if (id === "gmMode") return { value: "mid" };
      if (id === "gmPack") return { value: "classic" };
      return null;
    },
    storage,
    packsForKind: (kind) => themes.packsForKind(kind),
    antiWindow: () => 0,
    getCurrentLang: () => "en",
    isPro: () => true,
    reqRefsForUnlockIndex: () => 3,
    unlockedCountByRefs: (total) => total,
    freeVisiblePacks: 8,
    t: (key) => key,
    syncModePanelCopy: () => {},
  });
  assert.equal(gp.normalizeStyle("INVALID"), "classic");
  assert.equal(gp.normalizeStyle("alpha"), "alpha");
  const params = gp.readGenParams("gm");
  assert.equal(params.style, "degen");
  gp.persistStyle("gm", "meme");
  assert.equal(mem.get("gmx_gm_style_v2"), "meme");
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
  assert.equal(usage.normLimitForUI(50), 50);
  assert.equal(usage.normLimitForUI(999999), Infinity);
  assert.equal(usage.normLimitForUI("x"), Infinity);
  usage.setMeter(null, null, 3, 10);
});

test("help: factory exports modal helpers", () => {
  const help = loadFactory("app.help.js", "__GMXHelpFactory")({
    $: () => null,
    isPro: () => false,
    getSaveCapFree: () => 50,
    getLastUsage: () => ({ gm: { used: 1, limit: 50 }, gn: { used: 2, limit: 50 } }),
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
  const mount = {
    prepend() {},
    querySelector: () => null,
  };
  const body = { prepend() {}, querySelector: () => null };
  globalThis.document = {
    querySelector: (sel) => (sel === ".bg" ? mount : null),
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
  const mem = new Map();
  const storage = {
    keys: { GM_STYLE: "gmx_gm_style_v2", GN_STYLE: "gmx_gn_style_v2" },
    lsKeyStyle: (kind) => (kind === "gn" ? "gmx_gn_style_v2" : "gmx_gm_style_v2"),
    lsGet: (k, fb = "") => (mem.has(k) ? mem.get(k) : fb),
    lsSet: (k, v) => mem.set(k, String(v)),
  };
  const ui = loadFactory("app.styles.js", "__GMXStylesFactory")({
    $: () => null,
    storage,
    getStyles: () => styles.STYLES,
    isPro: () => false,
    reqRefsForUnlockIndex: () => 3,
    unlockedCountByRefs: (total, free) => Math.min(total, free),
    freeVisibleStyles: 8,
    t: (k) => k,
    normalizeStyle: (s) => String(s || "classic").toLowerCase(),
  });
  assert.equal(ui.unlockedStylesCount(), 8);
});

test("procontrols: export/import and pack wiring", () => {
  const mem = new Map();
  const storage = {
    keys: { GM_PACK: "gmx_gm_pack", GN_PACK: "gmx_gn_pack" },
    lsKeyPack: (kind) => (kind === "gn" ? "gmx_gn_pack" : "gmx_gm_pack"),
    lsGet: (k, fb = "") => (mem.has(k) ? mem.get(k) : fb),
    lsSet: (k, v) => mem.set(k, String(v)),
    lsRemove: (k) => mem.delete(k),
  };
  const banks = { gm: ["Gm!"], gn: ["Gn!"] };
  let imported = false;
  const pc = loadFactory("app.procontrols.js", "__GMXProControlsFactory")({
    $: () => null,
    isPro: () => true,
    escapeHtml: (s) => s,
    storage,
    packsForKind: () => [{ id: "classic", name: "Classic", style: "classic" }],
    unlockedPacksCountFor: () => 8,
    applyPackDefaultsToUi: () => {},
    logEvent: () => {},
    getProToolsNote: () => "Pro only",
    readKey: (k) => (k === "bank_gn" ? banks.gn : banks.gm),
    writeKey: (k, v) => {
      if (k === "bank_gn") banks.gn = v;
      else banks.gm = v;
    },
    getBankKey: (kind) => `bank_${kind}`,
    allKeysForKind: (kind) => [`bank_${kind}`],
    allLegacyKeysForKind: () => [],
    getHandle: () => "@test",
    dedupeLines: (lines) => lines,
    normalizeLine: (s) => String(s || "").trim(),
    cleanupKeyLines: (lines) => lines,
    setLangIndex: () => {},
    getBankMigrationKey: (kind) => `mig_${kind}`,
    trimKindToCap: () => {},
    onAfterImport: () => {
      imported = true;
    },
  });
  const json = pc.exportData();
  assert.match(json, /"@test"/);
  pc.importData(json);
  assert.equal(imported, true);
  assert.equal(pc.cleanupKind("gm"), 0);
});

test("sitemode: apply and toggle labels", () => {
  const mem = new Map();
  const doc = {
    documentElement: { classList: { toggle() {}, contains: () => false } },
  };
  const btn = { textContent: "" };
  const mode = loadFactory("app.sitemode.js", "__GMXSiteModeFactory")({
    $: (id) => (id === "btnMode" ? btn : null),
    siteModeKey: "gmx_site_mode",
    lsGet: (k, fb = "") => (mem.has(k) ? mem.get(k) : fb),
    lsSet: (k, v) => mem.set(k, String(v)),
    document: doc,
  });
  assert.equal(mode.applySiteMode("light", true), "light");
  assert.equal(mem.get("gmx_site_mode"), "light");
  assert.equal(btn.textContent, "Dark");
});

test("cleanfillrun: cleanupKeyLines delegates to shape dedupe", () => {
  const run = loadFactory("app.cleanfillrun.js", "__GMXCleanFillRunFactory")({
    getCleanFillStrength: () => 2,
    dedupeLinesByShape: (lines, strength) => (strength === 2 ? ["a"] : lines),
  });
  assert.deepEqual(run.cleanupKeyLines(["a", "b"]), ["a"]);
});

test("recover: classifies network errors", () => {
  const rec = loadFactory("app.recover.js", "__GMXRecoverFactory")({
    toast: () => {},
    setDegraded: () => {},
    lsGet: () => "{}",
    lsSet: () => {},
  });
  assert.equal(rec.isNetworkMessage("Failed to fetch"), true);
  assert.equal(rec.isNetworkMessage("boom"), false);
});

test("sitesync: cross-frame best mode sync", () => {
  let best = false;
  const listeners = [];
  const fakeWin = {
    addEventListener: (type, fn) => {
      if (type === "message") listeners.push(fn);
    },
  };
  const sync = loadFactory("app.sitesync.js", "__GMXSiteSyncFactory")({
    setBestMode: (v) => {
      best = !!v;
    },
    setCleanFillEnabled: () => {},
    window: fakeWin,
  });
  sync.wireCrossFrameSync();
  listeners[0]({ data: { type: "GMX_BEST_MODE_SYNC", value: true } });
  assert.equal(best, true);
});

function makeUsageCtx(overrides = {}) {
  return {
    $: () => null,
    getToken: () => "tok",
    getHandle: () => "@demo",
    api: async () => ({}),
    isPro: () => false,
    getSaveCapFree: () => 50,
    setSaveCapFree: () => {},
    setAuthOk: () => {},
    applyAdminVisibility: () => {},
    setLastUsage: () => {},
    getLastUsage: () => ({}),
    setSub: () => {},
    renderWalletStatus: () => {},
    applyRefCountEligible: () => false,
    getLastUsageCosmeticSig: () => "",
    setLastUsageCosmeticSig: () => {},
    onCosmeticRefresh: () => {},
    scheduleRefStatsRefresh: () => {},
    getCurrentTab: () => "home",
    renderHelpIfOpen: () => {},
    ...overrides,
  };
}

test("auth: cached token stays unverified until server confirmation", async () => {
  const store = new Map([
    ["gmx_handle", "@demo"],
    ["gmx_token", "stale-token"],
  ]);
  globalThis.localStorage = {
    getItem(k) {
      return store.has(k) ? store.get(k) : null;
    },
    setItem(k, v) {
      store.set(k, v);
    },
  };
  globalThis.location = { search: "" };
  let fetchCalled = false;
  globalThis.fetch = async () => {
    fetchCalled = true;
    return { ok: true, json: async () => ({}) };
  };

  const authOkCalls = [];
  let adminVis = 0;
  const auth = loadFactory("app.auth.js", "__GMXAuthFactory")({
    API: "http://127.0.0.1:10000",
    LS_HANDLE: "gmx_handle",
    LS_TOKEN: "gmx_token",
    LS_IS_ADMIN: "gmx_is_admin",
    LS_ADMIN_CLAIMABLE: "gmx_admin_claimable",
    isLocalDevHost: () => true,
    getAdminToken: () => "",
    setAuthOk: (v) => {
      authOkCalls.push(!!v);
    },
    $: () => null,
    t: (k) => k,
    toast: () => {},
    escapeHtml: (s) => s,
    applyAdminVisibility: () => {
      adminVis++;
    },
    ping: () => {},
    setDegraded: () => {},
  });

  const tok = await auth.initSession(false);
  assert.equal(tok, "stale-token");
  assert.equal(fetchCalled, false);
  assert.ok(!authOkCalls.includes(true), "setAuthOk(true) should not be called");
  assert.equal(authOkCalls.at(-1), false);
  assert.ok(adminVis >= 1);
});

test("usage: authenticated false clears auth without applying guest usage", async () => {
  const authOkCalls = [];
  let adminVis = 0;
  let lastUsageCalled = false;
  let subCalled = false;
  const usage = loadFactory("app.usage.js", "__GMXUsageFactory")(
    makeUsageCtx({
      api: async () => ({
        ok: true,
        authenticated: false,
        gm: { used: 5, limit: 50 },
        gn: { used: 3, limit: 50 },
        resetAt: "2026-06-26T00:00:00.000Z",
        sub: { active: false },
        limits: { freeDaily: 50, saveCapFree: 50, referralUnlocks: { eligible: 0 } },
      }),
      setAuthOk: (v) => {
        authOkCalls.push(!!v);
      },
      applyAdminVisibility: () => {
        adminVis++;
      },
      setLastUsage: () => {
        lastUsageCalled = true;
      },
      setSub: () => {
        subCalled = true;
      },
    })
  );

  await usage.refreshUsage();
  assert.ok(authOkCalls.includes(false));
  assert.ok(!authOkCalls.includes(true));
  assert.ok(adminVis >= 1);
  assert.equal(lastUsageCalled, false);
  assert.equal(subCalled, false);
});

test("usage: authenticated true keeps usage refresh flow", async () => {
  const authOkCalls = [];
  let lastUsagePayload = null;
  const usage = loadFactory("app.usage.js", "__GMXUsageFactory")(
    makeUsageCtx({
      api: async () => ({
        ok: true,
        authenticated: true,
        gm: { used: 12, limit: 50 },
        gn: { used: 8, limit: 50 },
        resetAt: "2026-06-26T00:00:00.000Z",
        sub: { active: true, tier: "pro" },
        limits: { freeDaily: 50, saveCapFree: 50, referralUnlocks: { eligible: 2 } },
      }),
      setAuthOk: (v) => {
        authOkCalls.push(!!v);
      },
      setLastUsage: (payload) => {
        lastUsagePayload = payload;
      },
    })
  );

  await usage.refreshUsage();
  assert.ok(authOkCalls.includes(true));
  assert.deepEqual(lastUsagePayload?.gm, { used: 12, limit: 50 });
  assert.deepEqual(lastUsagePayload?.gn, { used: 8, limit: 50 });
});

test("siteboot: restores handle pill and marks init done", () => {
  const els = {
    handlePill: { textContent: "" },
    xHandle: { value: "" },
  };
  let authOk = false;
  let initDone = false;
  const boot = loadFactory("app.siteboot.js", "__GMXSiteBootFactory")({
    $: (id) => els[id] || null,
    getHandle: () => "@demo",
    getToken: () => "tok",
    setAuthOk: (v) => {
      authOk = !!v;
    },
    setInitDone: (v) => {
      initDone = !!v;
    },
    applyAdminVisibility: () => {},
    initModeToggle: () => {},
    applyLang: () => {},
    normalizeTopLevelTab: (v) => v || "home",
    tab: () => {},
    setCurrentTab: () => {},
    setBg: () => {},
    ping: () => {},
    loadBuild: () => {},
    renderList: () => {},
    lsGet: (_k, fb) => fb,
  });
  boot.run();
  assert.equal(authOk, false);
  assert.equal(initDone, true);
  assert.equal(els.handlePill.textContent, "@demo");
  assert.equal(els.xHandle.value, "@demo");
});

test("auth: logout invalidates pending initSession response", async () => {
  const origLocalStorage = globalThis.localStorage;
  const origFetch = globalThis.fetch;
  const origLocation = globalThis.location;

  const store = new Map([["gmx_handle", "@demo"]]);
  globalThis.localStorage = {
    getItem(k) {
      return store.has(k) ? store.get(k) : null;
    },
    setItem(k, v) {
      store.set(k, v);
    },
    removeItem(k) {
      store.delete(k);
    },
  };
  globalThis.location = { search: "" };

  let fetchStarted = false;
  let resolveFetch;
  const fetchDone = new Promise((resolve) => {
    resolveFetch = resolve;
  });
  globalThis.fetch = async () => {
    fetchStarted = true;
    await fetchDone;
    return {
      ok: true,
      json: async () => ({
        ok: true,
        token: "late-token",
        handle: "@demo",
        isAdmin: true,
        adminClaimable: true,
      }),
    };
  };

  const authOkCalls = [];
  let adminVis = 0;
  let pingCount = 0;
  const auth = loadFactory("app.auth.js", "__GMXAuthFactory")({
    API: "http://127.0.0.1:10000",
    LS_HANDLE: "gmx_handle",
    LS_TOKEN: "gmx_token",
    LS_IS_ADMIN: "gmx_is_admin",
    LS_ADMIN_CLAIMABLE: "gmx_admin_claimable",
    isLocalDevHost: () => false,
    getAdminToken: () => "",
    setAuthOk: (v) => {
      authOkCalls.push(!!v);
    },
    $: (id) => (id === "handlePill" ? { textContent: "" } : null),
    t: (k) => k,
    toast: () => {},
    escapeHtml: (s) => s,
    applyAdminVisibility: () => {
      adminVis++;
    },
    ping: () => {
      pingCount++;
    },
    setDegraded: () => {},
  });

  const els = {
    btnReset: { onclick: null },
    handlePill: { textContent: "@demo" },
    xHandle: { value: "@demo" },
    connectMsg: { textContent: "", innerHTML: "" },
  };
  const connect = loadFactory("app.connect.js", "__GMXConnectFactory")({
    $: (id) => els[id] || null,
    api: async () => ({}),
    escapeHtml: (s) => s,
    friendlyUiErrorMessage: (m) => m,
    normalizeHandle: (v) => v,
    tr: (k) => k,
    setAuthOk: (v) => {
      authOkCalls.push(!!v);
    },
    applyAdminVisibility: () => {
      adminVis++;
    },
    refreshUsage: async () => {},
    loadPlans: async () => {},
    ping: () => {
      pingCount++;
    },
    invalidatePendingSessionInit: auth.invalidatePendingSessionInit,
    keys: {
      handle: "gmx_handle",
      token: "gmx_token",
      isAdmin: "gmx_is_admin",
      adminClaimable: "gmx_admin_claimable",
      forceLogout: "gmx_force_logout",
      forceLogoutV2: "gmx_force_logout_v2",
    },
  });
  connect.bindConnect();

  try {
    const pending = auth.initSession(true);
    await Promise.resolve();
    assert.equal(fetchStarted, true, "initSession(true) should start fetch");

    await els.btnReset.onclick();
    assert.equal(store.has("gmx_handle"), false);
    assert.equal(store.has("gmx_token"), false);
    assert.equal(store.has("gmx_is_admin"), false);
    assert.equal(store.has("gmx_admin_claimable"), false);
    assert.ok(authOkCalls.includes(false), "reset should set AUTH_OK false");
    assert.ok(store.has("gmx_force_logout"));
    assert.ok(store.has("gmx_force_logout_v2"));

    const adminVisAfterReset = adminVis;
    const pingCountAfterReset = pingCount;

    resolveFetch();
    const tok = await pending;
    assert.equal(tok, null);
    assert.equal(store.has("gmx_handle"), false);
    assert.equal(store.has("gmx_token"), false);
    assert.equal(store.has("gmx_is_admin"), false);
    assert.equal(store.has("gmx_admin_claimable"), false);
    assert.ok(!authOkCalls.includes(true), "late response must not restore AUTH_OK true");
    assert.equal(adminVis, adminVisAfterReset, "late response must not call applyAdminVisibility");
    assert.equal(pingCount, pingCountAfterReset, "late response must not call ping");
    assert.ok(store.has("gmx_force_logout"));
    assert.ok(store.has("gmx_force_logout_v2"));
  } finally {
    globalThis.localStorage = origLocalStorage;
    globalThis.fetch = origFetch;
    globalThis.location = origLocation;
  }
});

test("wallethelpers: base58 and fmtSol", () => {
  const wh = loadFactory("app.wallethelpers.js", "__GMXWalletHelpersFactory")();
  assert.equal(wh.b58encode(new Uint8Array([0, 1, 2])), "15T");
  assert.equal(wh.fmtSol(0.005), "0.0050");
  assert.equal(wh.planPricePrimary({ usd: 9, solApprox: 0.05 }, "SOL"), "0.050 SOL");
});

test("wallethelpers: shortPk truncates long keys", () => {
  const wh = loadFactory("app.wallethelpers.js", "__GMXWalletHelpersFactory")();
  const pk = "AbCdEfGhIjKlMnOpQrStUvWxYz";
  assert.equal(wh.shortPk(pk), "AbCd...WxYz");
});

test("walletui: billingErrMsg maps known codes", () => {
  const ui = loadFactory("app.walletui.js", "__GMXWalletUiFactory")({});
  assert.equal(ui.billingErrMsg("insufficient_sol_funds").includes("SOL"), true);
  assert.equal(ui.billingErrMsg("invalid_plan"), "Invalid plan.");
});

test("walletui: renderWalletStatus shows Pro active", () => {
  const els = { w_status_desc: { innerHTML: "" } };
  const ui = loadFactory("app.walletui.js", "__GMXWalletUiFactory")({
    $: (id) => els[id] || null,
  });
  ui.renderWalletStatus({ active: true, paidUntil: "2026-12-01" });
  assert.match(els.w_status_desc.innerHTML, /Pro active/);
});

test("walletpay: verifyIntentWithRetry retries transient errors", async () => {
  let calls = 0;
  const pay = loadFactory("app.walletpay.js", "__GMXWalletPayFactory")({
    api: async () => {
      calls++;
      if (calls < 2) throw new Error("payment_not_verified");
      return { ok: true, sub: { active: true } };
    },
  });
  const j = await pay.verifyIntentWithRetry("intent1", "sig", "payer");
  assert.equal(calls, 2);
  assert.equal(j.ok, true);
});

test("walletpay: buildPaymentTx rejects missing wallet", async () => {
  const code = readFileSync(path.join(root, "public", "app.walletpay.js"), "utf8");
  const fn = new Function("window", `${code}; return window.__GMXWalletPayFactory;`);
  const win = { solanaWeb3: { Transaction: function () {}, SystemProgram: {} } };
  const pay = fn(win)({ getWallet: () => ({ publicKey: null }) });
  await assert.rejects(
    () => pay.buildPaymentTx({ amountBase: "1000", currency: "SOL" }),
    /wallet_not_connected/
  );
});

test("refstats: revealReferralLinkUi unhides link row", () => {
  const els = {
    refTopRow: { classList: { remove: (c) => { els.refTopRow._removed = c; } }, _removed: "" },
    refLinkCol: { classList: { remove: (c) => { els.refLinkCol._removed = c; } }, _removed: "" },
  };
  const stats = loadFactory("app.refstats.js", "__GMXRefStatsFactory")({
    $: (id) => els[id] || null,
    getHandle: () => "",
  });
  stats.revealReferralLinkUi();
  assert.equal(els.refTopRow._removed, "link-hidden");
  assert.equal(els.refLinkCol._removed, "is-hidden");
});

test("generateflow: blocks generate without session token", async () => {
  const msg = { innerHTML: "" };
  const flow = loadFactory("app.generateflow.js", "__GMXGenerateFlowFactory")({
    $: (id) => (id === "gmMsg" ? msg : null),
    getToken: () => "",
    getHandle: () => "@demo",
    siteTr: (_k, fb) => fb,
    escapeHtml: (s) => s,
  });
  await flow.generate("gm", 1);
  assert.match(msg.innerHTML, /Session expired/);
});

test("admin: syncAdminUi reflects signed-out state", () => {
  const els = {
    adminHandle: { value: "" },
    adminAuthState: { textContent: "" },
  };
  const admin = loadFactory("app.admin.js", "__GMXAdminFactory")({
    $: (id) => els[id] || null,
    getHandle: () => "@demo",
    isAdminSignedIn: () => false,
    adminHandle: "@Kristofer_Sol_",
  });
  admin.syncAdminUi();
  assert.equal(els.adminHandle.value, "@demo");
  assert.equal(els.adminAuthState.textContent, "signed out");
});

test("admin: requireAdminSignedIn blocks when unsigned", () => {
  const els = { adminMsg: { innerHTML: "" } };
  const admin = loadFactory("app.admin.js", "__GMXAdminFactory")({
    $: (id) => els[id] || null,
    isAdminSignedIn: () => false,
  });
  assert.equal(admin.requireAdminSignedIn(), false);
  assert.match(els.adminMsg.innerHTML, /Sign in first/);
});

test("bankui: remainingSlots respects free cap", () => {
  const storage = { data: { gmx_gm_bank: "a\nb\nc" } };
  const bankui = loadFactory("app.bankui.js", "__GMXBankUiFactory")({
    saveCap: () => 50,
    saveCapFree: 50,
    getBankKey: (kind) => (kind === "gm" ? "gmx_gm_bank" : "gmx_gn_bank"),
    readKey: (key) =>
      String(storage.data[key] || "")
        .split(/\r?\n/)
        .map((x) => x.trim())
        .filter(Boolean),
    writeKey: () => {},
  });
  assert.equal(bankui.totalSaved("gm"), 3);
  assert.equal(bankui.remainingSlots("gm"), 47);
});

test("bankui: renderList shows connect CTA when disconnected", () => {
  const prevDoc = globalThis.document;
  globalThis.document = {
    createElement(tag) {
      const el = {
        tagName: tag.toUpperCase(),
        textContent: "",
        children: [],
        classList: {
          _s: new Set(),
          add(x) {
            this._s.add(x);
          },
          remove(x) {
            this._s.delete(x);
          },
          toggle(c, v) {
            if (v) this._s.add(c);
            else this._s.delete(c);
          },
          contains(c) {
            return this._s.has(c);
          },
        },
        get className() {
          return [...this.classList._s].join(" ");
        },
        set className(v) {
          this.classList._s = new Set(String(v || "").split(/\s+/).filter(Boolean));
        },
        appendChild(c) {
          this.children.push(c);
          return c;
        },
        addEventListener() {},
        matches(s) {
          return s.startsWith(".") && this.classList.contains(s.slice(1));
        },
        setAttribute() {},
        getAttribute() {
          return null;
        },
      };
      if (tag === "button") el.click = () => {};
      return el;
    },
  };
  const gmList = {
    innerHTML: "",
    appendChild(n) {
      this.last = n;
    },
    querySelector(sel) {
      const walk = (node) => {
        if (!node) return null;
        if (node.matches?.(sel)) return node;
        for (const c of node.children || []) {
          const h = walk(c);
          if (h) return h;
        }
        return null;
      };
      return walk(this.last);
    },
  };
  const els = {
    gmList,
    gmCount: { textContent: "" },
    gmMsg: { innerHTML: "" },
    gmTotal: { textContent: "" },
    gmCap: { textContent: "" },
    gmSavedVal: { textContent: "" },
    gmSavedFill: { style: { width: "" } },
    gm_edit_hint: { className: "editHint", classList: { toggle() {} } },
  };
  try {
    const bankui = loadFactory("app.bankui.js", "__GMXBankUiFactory")({
      $: (id) => els[id] || null,
      getHandle: () => "",
      getBankKey: () => "gmx_gm_bank",
      readKey: () => [],
      writeKey: () => {},
      dedupeLines: (lines) => lines,
      normalizeLine: (s) => String(s || "").trim(),
      lastSaved: { gm: 0, gn: 0 },
      saveCapFree: 50,
      isPro: () => false,
      t: (_k, fb) => fb,
    });
    bankui.renderList("gm");
    const cta = gmList.querySelector(".bankEmptyCta");
    assert.ok(cta);
    assert.match(cta.textContent, /Connect handle/i);
  } finally {
    globalThis.document = prevDoc;
  }
});

test("bankui: renderList uses mountLineListSkeleton for large lists", () => {
  const els = {
    gmList: { innerHTML: "", id: "gmList" },
    gmCount: { textContent: "" },
    gmMsg: { innerHTML: "" },
    gmTotal: { textContent: "" },
    gmCap: { textContent: "" },
    gmSavedVal: { textContent: "" },
    gmSavedFill: { style: { width: "" } },
  };
  let skeletonCalls = 0;
  const lines = Array.from({ length: 24 }, (_, i) => `line ${i + 1}`);
  const bankui = loadFactory("app.bankui.js", "__GMXBankUiFactory")({
    $: (id) => els[id] || null,
    getHandle: () => "@user",
    getBankKey: () => "gmx_gm_bank",
    readKey: () => lines,
    writeKey: () => {},
    dedupeLines: (lines) => lines,
    normalizeLine: (s) => String(s || "").trim(),
    lastSaved: { gm: 0, gn: 0 },
    saveCapFree: 50,
    isPro: () => false,
    mountLineListSkeleton: (container) => {
      skeletonCalls += 1;
      container.innerHTML = '<div class="skeleton-lineRow"></div>';
    },
    chunkedRender: (grid, items, _renderItem, opts) => {
      if (typeof opts?.mountSkeleton === "function") opts.mountSkeleton(grid, items.length);
    },
  });
  bankui.renderList("gm");
  assert.equal(skeletonCalls, 1);
});

test("leaderboard: bindLeaderboardUI is idempotent", () => {
  const lb = loadFactory("app.leaderboard.js", "__GMXLeaderboardFactory")({ $: () => null });
  lb.bindLeaderboardUI();
  lb.bindLeaderboardUI();
  assert.equal(lb.bindLeaderboardUI._done, true);
});

test("leaderboard: getLbDays defaults to 7", () => {
  const lb = loadFactory("app.leaderboard.js", "__GMXLeaderboardFactory")({});
  assert.equal(lb.getLbDays(), 7);
});

test("referrals: loadRefInvited renders empty state", async () => {
  const els = { refInvitedBody: { innerHTML: "" } };
  const refs = loadFactory("app.referrals.js", "__GMXReferralsFactory")({
    $: (id) => els[id] || null,
    api: async () => ({ ok: true, list: [] }),
    t: (_k, fb) => fb,
  });
  await refs.loadRefInvited(30);
  assert.match(els.refInvitedBody.innerHTML, /No invited users yet/);
});

test("redeem: bindRedeem warns on empty code", () => {
  const els = {
    btnRedeem: { onclick: null },
    redeemCode: { value: "" },
    connectMsg: { innerHTML: "" },
  };
  const redeem = loadFactory("app.redeem.js", "__GMXRedeemFactory")({
    $: (id) => els[id] || null,
    requireConnected: () => true,
    getHandle: () => "@demo",
  });
  redeem.bindRedeem();
  els.btnRedeem.onclick();
  assert.match(els.connectMsg.innerHTML, /Paste a code first/);
});

test("prediction: syncPredictionFilterCopy builds bias options", () => {
  const els = {
    pm_bias: { value: "all", innerHTML: "" },
    pm_conf: { value: "0", innerHTML: "" },
  };
  const pm = loadFactory("app.prediction.js", "__GMXPredictionFactory")({
    $: (id) => els[id] || null,
    escapeHtml: (s) => s,
    t: (_k, fb) => fb,
  });
  pm.syncPredictionFilterCopy();
  assert.match(els.pm_bias.innerHTML, /bullish/);
  assert.match(els.pm_conf.innerHTML, /70%/);
});

test("prediction: loadPredictionSignals shows sign-in guidance without session", async () => {
  const els = {
    pmList: { innerHTML: "", classList: { add: () => {}, remove: () => {} } },
    pm_status: { textContent: "" },
    pm_locked_note: { textContent: "" },
    pm_asset: { value: "all", innerHTML: "" },
  };
  const pm = loadFactory("app.prediction.js", "__GMXPredictionFactory")({
    $: (id) => els[id] || null,
    escapeHtml: (s) => s,
    t: (_k, fb) => fb,
    getHandle: () => "",
    getToken: () => "",
  });
  await pm.loadPredictionSignals({ force: true });
  assert.doesNotMatch(els.pmList.innerHTML, /Polymarket Direction Signal/);
  assert.match(els.pmList.innerHTML, /Sign in with your @handle/);
  assert.match(els.pm_status.textContent, /Connect your @handle/);
});

test("prediction: bindPredictionMarketUI is idempotent", () => {
  const pm = loadFactory("app.prediction.js", "__GMXPredictionFactory")({ $: () => null });
  pm.bindPredictionMarketUI();
  pm.bindPredictionMarketUI();
  assert.equal(pm.bindPredictionMarketUI._done, true);
});

test("connect: bindConnect warns on invalid handle", async () => {
  const els = {
    btnConnect: { onclick: null },
    connectMsg: { textContent: "x", innerHTML: "" },
    xHandle: { value: "!!!" },
  };
  const connect = loadFactory("app.connect.js", "__GMXConnectFactory")({
    $: (id) => els[id] || null,
    normalizeHandle: () => "",
  });
  connect.bindConnect();
  await els.btnConnect.onclick();
  assert.match(els.connectMsg.innerHTML, /valid @handle/);
});

test("auth: /api/user/logout is public", () => {
  const auth = loadFactory("app.auth.js", "__GMXAuthFactory")({
    API: "http://127.0.0.1:10000",
    LS_HANDLE: "gmx_handle",
    LS_TOKEN: "gmx_token",
    LS_IS_ADMIN: "gmx_is_admin",
    LS_ADMIN_CLAIMABLE: "gmx_admin_claimable",
    isLocalDevHost: () => false,
    getAdminToken: () => "",
    setAuthOk: () => {},
    $: () => null,
    t: (k) => k,
    toast: () => {},
    escapeHtml: (s) => s,
    applyAdminVisibility: () => {},
    ping: () => {},
    setDegraded: () => {},
  });
  assert.equal(auth.isPublicApi("/api/user/logout"), true);
});

test("connect: reset requests browser logout", async () => {
  const store = new Map([
    ["gmx_handle", "@demo"],
    ["gmx_token", "tok"],
    ["gmx_is_admin", "1"],
    ["gmx_admin_claimable", "1"],
  ]);
  globalThis.localStorage = {
    getItem(k) {
      return store.has(k) ? store.get(k) : null;
    },
    setItem(k, v) {
      store.set(k, v);
    },
    removeItem(k) {
      store.delete(k);
    },
  };

  const ops = [];
  let invalidateCalls = 0;
  const apiCalls = [];
  const els = {
    btnReset: { onclick: null },
    handlePill: { textContent: "@demo" },
    xHandle: { value: "@demo", focus: () => {} },
    connectMsg: { textContent: "", innerHTML: "" },
  };
  const connect = loadFactory("app.connect.js", "__GMXConnectFactory")({
    $: (id) => els[id] || null,
    api: async (path, method) => {
      apiCalls.push({ path, method });
      ops.push(["api", path, method]);
      return { ok: true };
    },
    escapeHtml: (s) => s,
    friendlyUiErrorMessage: (m) => m,
    normalizeHandle: (v) => v,
    tr: (k) => k,
    setAuthOk: (v) => {
      ops.push(["setAuthOk", v]);
    },
    applyAdminVisibility: () => {
      ops.push(["applyAdminVisibility"]);
    },
    refreshUsage: async () => {
      ops.push(["refreshUsage"]);
    },
    loadPlans: async () => {
      ops.push(["loadPlans"]);
    },
    ping: () => {
      ops.push(["ping"]);
    },
    invalidatePendingSessionInit: () => {
      invalidateCalls++;
      ops.push(["invalidatePendingSessionInit"]);
    },
    keys: {
      handle: "gmx_handle",
      token: "gmx_token",
      isAdmin: "gmx_is_admin",
      adminClaimable: "gmx_admin_claimable",
      forceLogout: "gmx_force_logout",
      forceLogoutV2: "gmx_force_logout_v2",
    },
  });
  connect.bindConnect();
  await els.btnReset.onclick();

  assert.equal(invalidateCalls, 1);
  assert.equal(store.has("gmx_handle"), false);
  assert.equal(store.has("gmx_token"), false);
  assert.equal(store.has("gmx_is_admin"), false);
  assert.equal(store.has("gmx_admin_claimable"), false);
  assert.ok(store.has("gmx_force_logout"));
  assert.ok(store.has("gmx_force_logout_v2"));
  assert.deepEqual(apiCalls, [{ path: "/api/user/logout", method: "POST" }]);
  assert.equal(ops[0][0], "invalidatePendingSessionInit");
  const logoutIdx = ops.findIndex((op) => op[0] === "setAuthOk" && op[1] === false);
  assert.ok(logoutIdx >= 0, "setAuthOk(false) should run during reset");
  const apiOpIdx = ops.findIndex((op) => op[0] === "api");
  assert.ok(apiOpIdx > logoutIdx, "logout API should run after client state clear");
  assert.ok(apiCalls.length === 1);
});

test("connect: reset remains local-safe when logout request fails", async () => {
  const store = new Map([
    ["gmx_handle", "@demo"],
    ["gmx_token", "tok"],
    ["gmx_is_admin", "1"],
    ["gmx_admin_claimable", "1"],
  ]);
  globalThis.localStorage = {
    getItem(k) {
      return store.has(k) ? store.get(k) : null;
    },
    setItem(k, v) {
      store.set(k, v);
    },
    removeItem(k) {
      store.delete(k);
    },
  };

  let authOk = true;
  const els = {
    btnReset: { onclick: null },
    handlePill: { textContent: "@demo" },
    xHandle: { value: "@demo", focus: () => {} },
    connectMsg: { textContent: "", innerHTML: "" },
  };
  const connect = loadFactory("app.connect.js", "__GMXConnectFactory")({
    $: (id) => els[id] || null,
    api: async () => {
      throw new Error("network_failed");
    },
    escapeHtml: (s) => s,
    friendlyUiErrorMessage: (m) => m,
    normalizeHandle: (v) => v,
    tr: (k) => k,
    setAuthOk: (v) => {
      authOk = !!v;
    },
    applyAdminVisibility: () => {},
    refreshUsage: async () => {},
    loadPlans: async () => {},
    ping: () => {},
    invalidatePendingSessionInit: () => {},
    keys: {
      handle: "gmx_handle",
      token: "gmx_token",
      isAdmin: "gmx_is_admin",
      adminClaimable: "gmx_admin_claimable",
      forceLogout: "gmx_force_logout",
      forceLogoutV2: "gmx_force_logout_v2",
    },
  });
  connect.bindConnect();
  await els.btnReset.onclick();

  assert.equal(authOk, false);
  assert.equal(store.has("gmx_handle"), false);
  assert.equal(store.has("gmx_token"), false);
  assert.equal(store.has("gmx_is_admin"), false);
  assert.equal(store.has("gmx_admin_claimable"), false);
  assert.ok(store.has("gmx_force_logout"));
  assert.ok(store.has("gmx_force_logout_v2"));
});

function makeConnectGenerationHarness({ store, api, els, ops = null }) {
  const authOkCalls = [];
  const auth = loadFactory("app.auth.js", "__GMXAuthFactory")({
    API: "http://127.0.0.1:10000",
    LS_HANDLE: "gmx_handle",
    LS_TOKEN: "gmx_token",
    LS_IS_ADMIN: "gmx_is_admin",
    LS_ADMIN_CLAIMABLE: "gmx_admin_claimable",
    isLocalDevHost: () => false,
    getAdminToken: () => "",
    setAuthOk: (v) => {
      authOkCalls.push(!!v);
      if (ops) ops.push(["setAuthOk", v]);
    },
    $: (id) => els[id] || null,
    t: (k) => k,
    toast: () => {},
    escapeHtml: (s) => s,
    applyAdminVisibility: () => {
      if (ops) ops.push(["applyAdminVisibility"]);
    },
    ping: () => {
      if (ops) ops.push(["ping"]);
    },
    setDegraded: () => {},
  });
  const connect = loadFactory("app.connect.js", "__GMXConnectFactory")({
    $: (id) => els[id] || null,
    api,
    escapeHtml: (s) => s,
    friendlyUiErrorMessage: (m) => m,
    normalizeHandle: (v) => v,
    tr: (k) => k,
    setAuthOk: (v) => {
      authOkCalls.push(!!v);
      if (ops) ops.push(["setAuthOk", v]);
    },
    applyAdminVisibility: () => {
      if (ops) ops.push(["applyAdminVisibility"]);
    },
    refreshUsage: async () => {
      if (ops) ops.push(["refreshUsage"]);
    },
    loadPlans: async () => {
      if (ops) ops.push(["loadPlans"]);
    },
    ping: () => {
      if (ops) ops.push(["ping"]);
    },
    invalidatePendingSessionInit: auth.invalidatePendingSessionInit,
    beginSessionGeneration: auth.beginSessionGeneration,
    isSessionGenerationCurrent: auth.isSessionGenerationCurrent,
    keys: {
      handle: "gmx_handle",
      token: "gmx_token",
      isAdmin: "gmx_is_admin",
      adminClaimable: "gmx_admin_claimable",
      forceLogout: "gmx_force_logout",
      forceLogoutV2: "gmx_force_logout_v2",
    },
  });
  return { auth, connect, authOkCalls };
}

test("connect: reset invalidates pending connect response", async () => {
  const origLocalStorage = globalThis.localStorage;
  const origLocation = globalThis.location;
  globalThis.location = { search: "" };
  const store = new Map([["gmx_handle", "@seed"], ["gmx_token", "seed-token"]]);
  globalThis.localStorage = {
    getItem(k) {
      return store.has(k) ? store.get(k) : null;
    },
    setItem(k, v) {
      store.set(k, v);
    },
    removeItem(k) {
      store.delete(k);
    },
  };

  let resolveConnectA;
  const connectADeferred = new Promise((resolve) => {
    resolveConnectA = resolve;
  });
  const ops = [];
  const apiCalls = [];
  const els = {
    btnConnect: { onclick: null },
    btnReset: { onclick: null },
    handlePill: { textContent: "not set" },
    refLink: { value: "" },
    xHandle: { value: "@old", focus: () => {} },
    connectMsg: { textContent: "", innerHTML: "" },
  };
  const api = async (path, method) => {
    apiCalls.push({ path, method });
    if (path === "/api/user/init") return connectADeferred;
    if (path === "/api/user/logout") return { ok: true };
    return { ok: true };
  };
  const { connect, authOkCalls } = makeConnectGenerationHarness({ store, api, els, ops });
  connect.bindConnect();

  try {
    const connectPromise = els.btnConnect.onclick();
    await Promise.resolve();
    assert.ok(apiCalls.some((c) => c.path === "/api/user/init"), "Connect A should start init");

    await els.btnReset.onclick();
    assert.equal(store.has("gmx_handle"), false);
    assert.equal(store.has("gmx_token"), false);
    assert.ok(store.has("gmx_force_logout"));
    assert.ok(store.has("gmx_force_logout_v2"));
    assert.ok(authOkCalls.includes(false));

    const pingAfterReset = ops.filter((op) => op[0] === "ping").length;
    const refreshAfterReset = ops.filter((op) => op[0] === "refreshUsage").length;
    const loadPlansAfterReset = ops.filter((op) => op[0] === "loadPlans").length;

    resolveConnectA({
      handle: "@old",
      token: "old-token",
      isAdmin: true,
      adminClaimable: true,
      refLink: "https://example/ref-old",
    });
    await connectPromise;

    assert.equal(store.has("gmx_handle"), false, "stale Connect must not restore handle");
    assert.equal(store.has("gmx_token"), false, "stale Connect must not restore token");
    assert.equal(store.has("gmx_is_admin"), false);
    assert.equal(store.has("gmx_admin_claimable"), false);
    assert.ok(!authOkCalls.includes(true), "stale Connect must not set AUTH_OK true");
    assert.ok(store.has("gmx_force_logout"));
    assert.ok(store.has("gmx_force_logout_v2"));
    assert.equal(els.handlePill.textContent, "not set");
    assert.equal(els.refLink.value, "");
    assert.equal(ops.filter((op) => op[0] === "ping").length, pingAfterReset);
    assert.equal(ops.filter((op) => op[0] === "refreshUsage").length, refreshAfterReset);
    assert.equal(ops.filter((op) => op[0] === "loadPlans").length, loadPlansAfterReset);
    assert.equal(els.connectMsg.innerHTML, '<span class="ok">Session cleared.</span>');
  } finally {
    globalThis.localStorage = origLocalStorage;
    globalThis.location = origLocation;
  }
});

test("connect: newer connect wins over older delayed response", async () => {
  const origLocalStorage = globalThis.localStorage;
  const origLocation = globalThis.location;
  globalThis.location = { search: "" };
  const store = new Map();
  globalThis.localStorage = {
    getItem(k) {
      return store.has(k) ? store.get(k) : null;
    },
    setItem(k, v) {
      store.set(k, v);
    },
    removeItem(k) {
      store.delete(k);
    },
  };

  const gates = new Map();
  function gateFor(handle) {
    if (!gates.has(handle)) {
      const entry = {};
      entry.promise = new Promise((resolve, reject) => {
        entry.resolve = resolve;
        entry.reject = reject;
      });
      gates.set(handle, entry);
    }
    return gates.get(handle);
  }

  const ops = [];
  const api = async (path, method, body) => {
    if (path === "/api/user/init") {
      const handle = body?.handle || "";
      return gateFor(handle).promise;
    }
    return { ok: true };
  };

  const els = {
    btnConnect: { onclick: null },
    handlePill: { textContent: "" },
    refLink: { value: "" },
    xHandle: { value: "@old", focus: () => {} },
    connectMsg: { textContent: "", innerHTML: "" },
  };
  const { connect, authOkCalls } = makeConnectGenerationHarness({ store, api, els, ops });
  connect.bindConnect();

  try {
    const promiseA = els.btnConnect.onclick();
    await Promise.resolve();
    els.xHandle.value = "@new";
    const promiseB = els.btnConnect.onclick();
    await Promise.resolve();

    gates.get("@new").resolve({
      handle: "@new",
      token: "new-token",
      isAdmin: false,
      adminClaimable: false,
      refLink: "https://example/ref-new",
    });
    await promiseB;

    gates.get("@old").resolve({
      handle: "@old",
      token: "old-token",
      isAdmin: true,
      adminClaimable: true,
      refLink: "https://example/ref-old",
    });
    await promiseA;

    assert.equal(store.get("gmx_handle"), "@new");
    assert.equal(store.get("gmx_token"), "new-token");
    assert.equal(store.get("gmx_is_admin"), "0");
    assert.equal(store.get("gmx_admin_claimable"), "0");
    assert.equal(authOkCalls.filter(Boolean).length, 1, "AUTH_OK true only once from Connect B");
    assert.equal(els.handlePill.textContent, "@new");
    assert.equal(els.refLink.value, "https://example/ref-new");
    assert.equal(store.has("gmx_force_logout"), false);
    assert.equal(store.has("gmx_force_logout_v2"), false);
    assert.equal(ops.filter((op) => op[0] === "refreshUsage").length, 1);
    assert.equal(ops.filter((op) => op[0] === "loadPlans").length, 1);
  } finally {
    globalThis.localStorage = origLocalStorage;
    globalThis.location = origLocation;
  }
});

test("connect: stale failure does not overwrite newer success UI", async () => {
  const origLocalStorage = globalThis.localStorage;
  const origLocation = globalThis.location;
  globalThis.location = { search: "" };
  const store = new Map();
  globalThis.localStorage = {
    getItem(k) {
      return store.has(k) ? store.get(k) : null;
    },
    setItem(k, v) {
      store.set(k, v);
    },
    removeItem(k) {
      store.delete(k);
    },
  };

  const gates = new Map();
  function gateFor(handle) {
    if (!gates.has(handle)) {
      const entry = {};
      entry.promise = new Promise((resolve, reject) => {
        entry.resolve = resolve;
        entry.reject = reject;
      });
      gates.set(handle, entry);
    }
    return gates.get(handle);
  }

  const ops = [];
  const api = async (path, method, body) => {
    if (path === "/api/user/init") {
      const handle = body?.handle || "";
      return gateFor(handle).promise;
    }
    return { ok: true };
  };

  const els = {
    btnConnect: { onclick: null },
    handlePill: { textContent: "" },
    refLink: { value: "" },
    xHandle: { value: "@old", focus: () => {} },
    connectMsg: { textContent: "", innerHTML: "" },
  };
  const { connect, authOkCalls } = makeConnectGenerationHarness({
    store,
    api,
    els,
    ops,
  });
  connect.bindConnect();

  try {
    const promiseA = els.btnConnect.onclick();
    await Promise.resolve();
    els.xHandle.value = "@new";
    const promiseB = els.btnConnect.onclick();
    await Promise.resolve();

    gates.get("@new").resolve({
      handle: "@new",
      token: "new-token",
      isAdmin: false,
      adminClaimable: false,
      refLink: "https://example/ref-new",
    });
    await promiseB;

    gates.get("@old").reject(new Error("stale_connect_failed"));
    await promiseA;

    assert.equal(store.get("gmx_handle"), "@new");
    assert.equal(store.get("gmx_token"), "new-token");
    assert.equal(els.handlePill.textContent, "@new");
    assert.equal(els.connectMsg.innerHTML, "");
    assert.ok(!els.connectMsg.innerHTML.includes("Connect error"));
    assert.equal(authOkCalls.filter(Boolean).length, 1);
  } finally {
    globalThis.localStorage = origLocalStorage;
    globalThis.location = origLocation;
  }
});

function loadAuthWithLocks(navLocks) {
  globalThis.localStorage = {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {},
  };
  const code = readFileSync(path.join(root, "public", "app.auth.js"), "utf8");
  const fn = new Function("window", `${code}; return window.__GMXAuthFactory;`);
  const win = {};
  if (navLocks !== undefined) {
    win.navigator = { locks: navLocks };
  }
  const auth = fn(win)({
    API: "http://127.0.0.1:10000",
    LS_HANDLE: "gmx_handle",
    LS_TOKEN: "gmx_token",
    LS_IS_ADMIN: "gmx_is_admin",
    LS_ADMIN_CLAIMABLE: "gmx_admin_claimable",
    isLocalDevHost: () => false,
    getAdminToken: () => "",
    setAuthOk: () => {},
    $: () => null,
    t: (k) => k,
    toast: () => {},
    escapeHtml: (s) => s,
    applyAdminVisibility: () => {},
    ping: () => {},
    setDegraded: () => {},
  });
  return auth;
}

test("auth: cookie mutation uses exclusive Web Lock", async () => {
  const calls = [];
  const auth = loadAuthWithLocks({
    request(name, opts, cb) {
      calls.push({ name, mode: opts?.mode });
      return cb();
    },
  });
  globalThis.fetch = async () => ({
    ok: true,
    headers: { get: () => "application/json" },
    json: async () => ({ ok: true }),
  });
  await auth.api("/api/user/logout", "POST");
  await auth.api("/api/user/init", "POST", { handle: "@demo" });
  assert.equal(calls.length, 2);
  assert.ok(calls.every((c) => c.name === auth.AUTH_COOKIE_MUTATION_LOCK));
  assert.ok(calls.every((c) => c.mode === "exclusive"));
});

test("auth: cookie mutation waits for held lock", async () => {
  let releaseFirst;
  let resolveSecond;
  let firstInside = false;
  let secondCbStarted = false;
  const auth = loadAuthWithLocks({
    request(_name, _opts, cb) {
      if (!firstInside) {
        firstInside = true;
        return new Promise((resolve) => {
          releaseFirst = () => resolve(cb());
        });
      }
      return new Promise((resolve) => {
        resolveSecond = () => {
          secondCbStarted = true;
          resolve(cb());
        };
      });
    },
  });
  let fetchCount = 0;
  globalThis.fetch = async () => {
    fetchCount++;
    return {
      ok: true,
      headers: { get: () => "application/json" },
      json: async () => ({ ok: true }),
    };
  };
  const p1 = auth.api("/api/user/init", "POST", { handle: "@a" });
  await Promise.resolve();
  assert.equal(fetchCount, 0);
  const p2 = auth.api("/api/user/logout", "POST");
  await Promise.resolve();
  assert.equal(secondCbStarted, false);
  assert.equal(fetchCount, 0);
  releaseFirst();
  await Promise.resolve();
  if (resolveSecond) resolveSecond();
  await Promise.all([p1, p2]);
  assert.equal(fetchCount, 2);
});

test("auth: cookie mutation fallback FIFO order", async () => {
  const auth = loadAuthWithLocks(undefined);
  const order = [];
  globalThis.fetch = async (url) => {
    order.push(String(url));
    return {
      ok: true,
      headers: { get: () => "application/json" },
      json: async () => ({ ok: true }),
    };
  };
  await Promise.all([
    auth.api("/api/user/init", "POST", { handle: "@a" }),
    auth.api("/api/user/logout", "POST"),
  ]);
  assert.equal(order.length, 2);
  assert.match(order[0], /\/api\/user\/init$/);
  assert.match(order[1], /\/api\/user\/logout$/);
});

test("auth: rejected fallback item does not poison queue", async () => {
  const auth = loadAuthWithLocks(undefined);
  let logoutFetched = false;
  globalThis.fetch = async (url) => {
    if (String(url).includes("/api/user/logout")) {
      logoutFetched = true;
      return {
        ok: true,
        headers: { get: () => "application/json" },
        json: async () => ({ ok: true }),
      };
    }
    throw new Error("first_fail");
  };
  await auth.api("/api/user/init", "POST", { handle: "@a" }).catch(() => {});
  await auth.api("/api/user/logout", "POST");
  assert.equal(logoutFetched, true);
});

test("auth: lock error never runs unlocked fetch", async () => {
  const auth = loadAuthWithLocks({
    request() {
      return Promise.reject(new Error("lock_denied"));
    },
  });
  let fetchCalled = false;
  globalThis.fetch = async () => {
    fetchCalled = true;
    return { ok: true, headers: { get: () => "application/json" }, json: async () => ({}) };
  };
  await auth.api("/api/user/logout", "POST").catch(() => {});
  assert.equal(fetchCalled, false);
});

test("auth: public cookie mutations do not call initSession preflight", async () => {
  const auth = loadAuthWithLocks({
    request(_n, _o, cb) {
      return cb();
    },
  });
  globalThis.localStorage = {
    getItem(k) {
      if (k === "gmx_handle") return "@demo";
      return null;
    },
    setItem() {},
    removeItem() {},
  };
  let initSessionCalls = 0;
  const origInit = auth.initSession;
  auth.initSession = async () => {
    initSessionCalls++;
    return null;
  };
  globalThis.fetch = async () => ({
    ok: true,
    headers: { get: () => "application/json" },
    json: async () => ({ ok: true }),
  });
  await auth.api("/api/user/logout", "POST");
  assert.equal(initSessionCalls, 0);
  auth.initSession = origInit;
});

test("connect: reset clears session message", async () => {
  const els = {
    btnReset: { onclick: null },
    connectMsg: { innerHTML: "" },
    handlePill: { textContent: "@demo" },
    xHandle: { focus: () => {} },
  };
  let authOk = true;
  const connect = loadFactory("app.connect.js", "__GMXConnectFactory")({
    $: (id) => els[id] || null,
    setAuthOk: (v) => { authOk = v; },
    keys: { handle: "gmx_handle", token: "gmx_token" },
  });
  connect.bindConnect();
  await els.btnReset.onclick();
  assert.equal(authOk, false);
  assert.match(els.connectMsg.innerHTML, /Session cleared/);
  assert.equal(els.handlePill.textContent, "not set");
});

test("shellwire: wires tab and lazy auth helpers", () => {
  let shown = "";
  const win = { addEventListener: () => {} };
  const prevDoc = globalThis.document;
  globalThis.document = { querySelectorAll: () => [] };
  try {
    new Function("window", `${readFileSync(path.join(root, "public", "app.shellerrors.js"), "utf8")};`)(win);
    new Function("window", `${readFileSync(path.join(root, "public", "app.tabwire.js"), "utf8")};`)(win);
    new Function("window", `${readFileSync(path.join(root, "public", "app.authwire.js"), "utf8")};`)(win);
    win.__GMXAuthFactory = () => ({
      getHandle: () => "@demo",
      getToken: () => "tok",
      normalizeHandle: (s) => String(s || "").trim(),
      isConnected: () => true,
      requireConnected: () => true,
      isPublicApi: () => false,
      initSession: async () => true,
      api: async () => ({}),
    });
    new Function("window", `${readFileSync(path.join(root, "public", "app.shellwire.js"), "utf8")};`)(win);
    const wire = win.__GMXShellWireFactory({
      chrome: { wireDegradedBar: () => {}, wireFatalBar: () => {}, toast: () => {}, $: () => null },
      showTab: (n) => { shown = n; },
      buildAuthConfig: () => ({}),
    });
    wire.tab("wallet");
    assert.equal(shown, "wallet");
    assert.equal(wire.getToken(), "tok");
  } finally {
    globalThis.document = prevDoc;
  }
});

test("siteinitwire: builds nested siteinit ctx and delegates run", async () => {
  const prevLs = globalThis.localStorage;
  globalThis.localStorage = {
    getItem: (k) => (k === "gmx_site_lang" ? "en" : null),
    setItem: () => {},
  };
  try {
    const win = {};
    new Function("window", `${readFileSync(path.join(root, "public", "app.siteinitwire.js"), "utf8")};`)(win);
    let captured = null;
    win.__GMXSiteInitFactory = (cfg) => {
      captured = cfg;
      return { run: async () => {} };
    };
    const wire = win.__GMXSiteInitWireFactory({
      setBestMode: () => {},
      setCleanFillEnabled: () => {},
      siteLangMenu: {
        bootstrapSiteLangUi: async () => ({ siteLangSel: null }),
        wireI18nObserver: () => {},
        wireSiteLangSelectChange: () => {},
        fillReplyLangSelects: () => ({}),
      },
      styles: { wireStyleSelectors: () => {} },
      storage: { lsGet: (_k, d) => d, lsSet: () => {}, lsKeyPack: () => "pack" },
      bankUi: { getGmView: () => "gm", getGnView: () => "gn" },
      tabState: { setCurrentTab: () => {} },
      K: { SITE_MODE: "gmx_site_mode" },
      I18N: { en: { pro_tools_note: "Pro tools" } },
      LS_SITE_LANG: "gmx_site_lang",
      applyLang: () => {},
      renderLangChips: () => {},
      getHandle: () => "@demo",
      renderList: () => {},
    });
    await wire.run();
    assert.equal(captured.getProToolsNote(), "Pro tools");
    assert.equal(captured.gmGnWireCtx.getGmView(), "gm");
  } finally {
    globalThis.localStorage = prevLs;
  }
});

test("shelldeps: exports storage keys and delegates helpers", () => {
  const deps = loadFactory("app.shelldeps.js", "__GMXShellDepsFactory")({
    K: { HANDLE: "gmx_handle", TOKEN: "gmx_token", SITE_LANG: "gmx_site_lang" },
    logs: { logEvent: (type, data) => ({ type, data }) },
    storage: {
      getAdminToken: () => "adm",
      setAdminToken: () => {},
      isAdminSignedIn: () => true,
      lsKeyPack: () => "pack",
      lsKeyAnti: () => "anti",
      lsKeyRecent: () => "recent",
      lsKeyCleanFill: () => "clean",
    },
    cleanfill: {
      CLEAN_FILL_STRENGTH: 3,
      getEnabled: () => true,
      setEnabled: () => {},
      copyForKind: () => "copy",
      syncUi: () => {},
    },
    antirepeat: { antiWindow: (s) => s * 2, getRecent: () => ["a"] },
    custombg: {
      TABS: ["home"],
      TABS_PUBLIC: ["home"],
      customBgKeyForTab: (tab) => `bg_${tab}`,
      applyUserBg: () => true,
    },
    tabtheme: { TAB_THEME: { home: "grad" } },
  });
  assert.equal(deps.LS_HANDLE, "gmx_handle");
  assert.deepEqual(deps.logEvent("ping", { ok: 1 }), { type: "ping", data: { ok: 1 } });
  assert.equal(deps.antiWindow(4), 8);
  assert.equal(deps.customBgKeyForTab("home"), "bg_home");
  assert.equal(deps.TAB_THEME.home, "grad");
});

test("shelldepswire: delegates to shelldeps factory", () => {
  const win = {};
  new Function("window", `${readFileSync(path.join(root, "public", "app.shelldeps.js"), "utf8")};`)(win);
  new Function("window", `${readFileSync(path.join(root, "public", "app.shelldepswire.js"), "utf8")};`)(win);
  const deps = win.__GMXShellDepsWireFactory({
    K: { HANDLE: "gmx_handle", TOKEN: "gmx_token" },
    logs: { logEvent: (type) => type },
    storage: { getAdminToken: () => "adm", setAdminToken: () => {}, isAdminSignedIn: () => true },
    cleanfill: { CLEAN_FILL_STRENGTH: 2, getEnabled: () => false, setEnabled: () => {}, copyForKind: () => "", syncUi: () => {} },
    antirepeat: { antiWindow: () => 0, getRecent: () => [] },
    custombg: { TABS: [], TABS_PUBLIC: [], customBgKeyForTab: (t) => t },
    tabtheme: { TAB_THEME: {} },
  });
  assert.equal(deps.LS_HANDLE, "gmx_handle");
  assert.equal(deps.logEvent("evt"), "evt");
});

test("shelldepswire grouped: flattens grouped ctx", () => {
  const win = {};
  new Function("window", `${readFileSync(path.join(root, "public", "app.shelldeps.js"), "utf8")};`)(win);
  new Function("window", `${readFileSync(path.join(root, "public", "app.shelldepswire.js"), "utf8")};`)(win);
  let captured = null;
  win.__GMXShellDepsFactory = (cfg) => {
    captured = cfg;
    return { ok: true };
  };
  const out = win.__GMXShellDepsWireFactory({
    keys: { K: { HANDLE: "gmx_handle" } },
    mod: { storage: { x: 1 }, logs: { y: 1 }, cleanfill: {}, antirepeat: {}, custombg: {}, tabtheme: {} },
  });
  assert.equal(captured.K.HANDLE, "gmx_handle");
  assert.equal(captured.storage.x, 1);
  assert.equal(captured.logs.y, 1);
  assert.equal(out.ok, true);
});

test("cleanfillrun grouped: wires cleanfillrun and gen helpers", () => {
  const win = {};
  new Function("window", `${readFileSync(path.join(root, "public", "app.cleanfillrun.js"), "utf8")};`)(win);
  const wire = win.__GMXCleanFillRunFactory({
    format: { escapeHtml: (s) => s },
    cleanfill: { CLEAN_FILL_STRENGTH: 2 },
    gen: {
      normalizeLine: (s) => String(s).trim(),
      repeatKey: (s) => `k:${s}`,
      dedupeLinesByShape: (lines) => lines.slice(0, 1),
      dedupeLines: (lines) => [...new Set(lines)],
    },
    antirepeat: {
      pushRecent: () => {},
      filterLines: (_k, _key, lines, strength) => (strength === 3 ? lines.slice(0, 1) : lines),
    },
    ui: { yieldToUiFrame: async () => {} },
    getAntiStrength: () => 3,
    readGenParams: () => ({}),
    activeKey: () => "gm",
    readKey: () => [],
    writeKey: () => {},
    remainingSlots: () => 10,
    renderList: () => {},
    getHandle: () => "@demo",
    tab: () => {},
  });
  assert.equal(wire.normalizeLine("  hi "), "hi");
  assert.equal(wire.repeatKey("x"), "k:x");
  assert.deepEqual(wire.filterAntiRepeat("gm", "k", ["a", "b"]), ["a"]);
  assert.deepEqual(wire.cleanupKeyLines(["a", "b"]), ["a"]);
});

test("themeswire: delegates theme and extension UI helpers", () => {
  const wire = loadFactory("app.themeswire.js", "__GMXThemesWireFactory")({
    extViewKey: "gmx_ext_view",
    themeApply: { applyTheme: (id) => `theme:${id}` },
    extView: { normalizeExtViewValue: (v) => v || "gmgn", bindExtTabs: () => true },
    themesUi: { renderThemes: () => 3, unlockTagText: () => "Pro" },
    extWpUi: { renderExtWallpapers: () => 5, initExtWallpaperControls: () => {} },
    unlockedCountByRefs: (total, free) => free,
    extThemesLength: 10,
    freeVisibleExtThemes: 2,
  });
  assert.equal(wire.LS_EXT_VIEW, "gmx_ext_view");
  assert.equal(wire.applyTheme("classic"), "theme:classic");
  assert.equal(wire.normalizeExtViewValue(""), "gmgn");
  assert.equal(wire.unlockedExtThemesCount(), 2);
  assert.equal(wire.renderThemes(), 3);
  assert.equal(wire.renderExtWallpapers(), 5);
  assert.equal(wire.bindExtTabs(), true);
});

test("i18nbridge: exports catalog and delegates site i18n helpers", () => {
  const prev = globalThis.GMX_SITE_I18N;
  globalThis.GMX_SITE_I18N = {
    createSiteI18nCatalog: () => ({ en: { hello: "Hello" } }),
  };
  try {
    const bridge = loadFactory("app.i18nbridge.js", "__GMXI18nBridgeFactory")({
      siteI18nUi: { siteTr: (k, fb) => (k === "hello" ? "Hi" : fb), applyLang: () => true },
      siteI18nDynamic: {
        nextReferralUnlockAt: (n) => n + 3,
        syncModePanelCopy: () => "synced",
      },
      siteLangMenu: { fillSelect: (sel, arr) => arr.length },
    });
    assert.equal(bridge.I18N.en.hello, "Hello");
    assert.equal(bridge.siteTr("hello", "x"), "Hi");
    assert.equal(bridge.applyLang(), true);
    assert.equal(bridge.nextReferralUnlockAt(5), 8);
    assert.equal(bridge.syncModePanelCopy(), "synced");
    assert.equal(bridge.fillSelect(null, [1, 2]), 2);
  } finally {
    globalThis.GMX_SITE_I18N = prev;
  }
});

test("themescatalogwire: exports theme catalogs and genparam delegates", () => {
  const prevLs = globalThis.localStorage;
  globalThis.localStorage = { getItem: () => null, setItem: () => {} };
  try {
    const wire = loadFactory("app.themescatalogwire.js", "__GMXThemesCatalogWireFactory")({
      themes: {
        THEMES: [{ id: "a" }, { id: "b" }],
        EXT_THEMES: [],
        STYLES: [],
        GM_PACKS: [],
        GN_PACKS: [],
        PACKS: {},
        packsForKind: (k) => k,
        rgbaToRgbTuple: (s) => s,
      },
      wp: { EXT_PACK_COUNT: 4, EXT_FREE_PACK_COUNT: 1, buildExtWallpapers: () => ["w1"] },
      gp: { getAntiStrength: () => 2, fillPacks: () => true },
      styles: { unlockedStylesCount: () => 5 },
      unlockedCountByRefs: (total, free) => free,
      freeVisibleThemes: 1,
    });
    assert.equal(wire.THEMES.length, 2);
    assert.equal(wire.EXT_WALLPAPERS[0], "w1");
    assert.equal(wire.packsForKind("gm"), "gm");
    assert.equal(wire.unlockedThemesCount(), 1);
    assert.equal(wire.unlockedStylesCount(), 5);
    assert.equal(wire.getAntiStrength("gm"), 2);
    assert.equal(wire.fillPacks(), true);
    wire.migrateLegacyExtWallpaperSelectionOnce();
  } finally {
    globalThis.localStorage = prevLs;
  }
});

test("uiwire: delegates performance helpers to ui module", () => {
  let yielded = false;
  const wire = loadFactory("app.uiwire.js", "__GMXUiWireFactory")({
    ui: {
      chunkedRender: (grid, items, renderItem, opts) => ({ grid, n: items.length, opts }),
      yieldToUiFrame: async () => { yielded = true; },
      prefetchImage: (url) => url,
      observeLazyBg: (el) => el,
      postEvent: async (type, meta) => ({ type, meta }),
    },
  });
  assert.deepEqual(wire.chunkedRender("g", [1, 2], null, { chunk: 1 }), { grid: "g", n: 2, opts: { chunk: 1 } });
  return wire.yieldToUiFrame().then(() => {
    assert.equal(yielded, true);
    assert.equal(wire.prefetchImage("/x.png"), "/x.png");
    assert.equal(wire.observeLazyBg("el"), "el");
    return wire.postEvent("click", { a: 1 }).then((r) => assert.deepEqual(r, { type: "click", meta: { a: 1 } }));
  });
});

test("wallpaperswire: exports wallpaper catalog delegates and runs normalize hooks", () => {
  let normalized = false;
  let extNormalized = false;
  const wire = loadFactory("app.wallpaperswire.js", "__GMXWallpapersWireFactory")({
    keys: { WP_GLOBAL: "gmx_wp_global", WP_TAB_PREFIX: "gmx_wp_tab_" },
    wp: {
      SITE_FREE_PACK_COUNT: 10,
      CUSTOM_WP_FREE_COUNT: 5,
      CUSTOM_UPLOAD_ID: "custom",
      CUSTOM_WP_RE: /^custom_/,
      buildSiteWallpapers: () => [{ id: "w1" }],
      setWallpaperLayerImage: (layer, url) => ({ layer, url }),
    },
    wpStore: {
      SITE_WALLPAPER_TABS: ["gm", "gn"],
      normalizeAllWallpapers: () => { normalized = true; },
      wallpaperKeyForTab: (tab) => `k:${tab}`,
      getWallpaperForTab: (tab) => tab,
      setWallpaperForTab: (tab, id) => ({ tab, id }),
      migrateLegacyWallpaperSelectionOnce: () => true,
    },
    customWp: { loadCustomWallpapers: async () => [], getEffectiveCustomWallpapersSite: () => [] },
    wpHelpers: {
      normalizeWallpaperId: (id) => id,
      wallpaperUrl: (id) => `/w/${id}`,
      wallpaperUnlocked: () => true,
    },
    extWpStore: { normalizeStoredExtWallpaperSelections: () => { extNormalized = true; } },
    tabState: { normalizeTopLevelTab: (t) => t, getCurrentTab: () => "gm" },
    wpApply: { applyWallpaper: (tab) => tab },
    i18nUi: { t: (k) => k, tr: (k) => k, prettyError: (c) => c },
    wpUi: { renderWallpaperUI: () => true, initWallpapers: () => true },
    langUi: { flagEmoji: (c) => c, updateLangFlags: () => {}, renderLangChips: () => {} },
  });
  assert.equal(normalized, true);
  assert.equal(extNormalized, true);
  assert.equal(wire.LS_WP_GLOBAL, "gmx_wp_global");
  assert.equal(wire.WALLPAPERS[0].id, "w1");
  assert.equal(wire.wallpaperKeyForTab("gm"), "k:gm");
  assert.deepEqual(wire.setWallpaperLayerImage("layer", "/x.webp"), { layer: "layer", url: "/x.webp" });
  assert.equal(wire.currentTabName(), "gm");
});

test("wallpaperswire grouped: flattens grouped ctx", () => {
  const win = {};
  new Function("window", `${readFileSync(path.join(root, "public", "app.wallpaperswire.js"), "utf8")};`)(win);
  const wire = win.__GMXWallpapersWireFactory({
    keys: { K: { WP_GLOBAL: "gmx_wp_global", WP_TAB_PREFIX: "gmx_wp_tab_" } },
    mod: {
      wp: { SITE_FREE_PACK_COUNT: 2, CUSTOM_WP_FREE_COUNT: 0, CUSTOM_UPLOAD_ID: "custom", CUSTOM_WP_RE: /^custom_/, buildSiteWallpapers: () => [] },
      wpStore: { SITE_WALLPAPER_TABS: ["home"], normalizeAllWallpapers: () => {}, getWallpaperForTab: () => null },
      customWp: { loadCustomWallpapers: async () => [] },
      wpHelpers: { normalizeWallpaperId: (id) => id },
      extWpStore: {},
      tabState: { getCurrentTab: () => "home" },
      wpApply: {},
      i18nUi: { siteTr: (k) => k },
      wpUi: {},
      langUi: {},
    },
  });
  assert.equal(typeof wire.currentTabName, "function");
  assert.equal(wire.WALLPAPERS.length, 0);
});

test("bankswire: delegates bank storage helpers", () => {
  const wire = loadFactory("app.bankswire.js", "__GMXBanksWireFactory")({
    banks: {
      linesFromText: (t) => String(t || "").split("\n").filter(Boolean),
      getBankKey: (kind) => `bank:${kind}`,
      readKey: (key) => [key],
      writeKey: (key, lines) => ({ key, lines }),
      migrateLegacyBank: (kind) => kind === "gm",
    },
  });
  assert.deepEqual(wire.linesFromText("a\nb"), ["a", "b"]);
  assert.equal(wire.getBankKey("gm"), "bank:gm");
  assert.deepEqual(wire.readKey("k"), ["k"]);
  assert.deepEqual(wire.writeKey("k", ["x"]), { key: "k", lines: ["x"] });
  assert.equal(wire.migrateLegacyBank("gm"), true);
});

test("chromewire: wires chrome shell helpers and shellwire auth", () => {
  const prevDoc = globalThis.document;
  globalThis.document = {
    getElementById: () => null,
    querySelectorAll: () => [],
    addEventListener: () => {},
  };
  const win = { addEventListener: () => {} };
  try {
    new Function("window", `${readFileSync(path.join(root, "public", "app.shellerrors.js"), "utf8")};`)(win);
    new Function("window", `${readFileSync(path.join(root, "public", "app.tabwire.js"), "utf8")};`)(win);
    new Function("window", `${readFileSync(path.join(root, "public", "app.authwire.js"), "utf8")};`)(win);
    win.__GMXAuthFactory = () => ({
      getHandle: () => "@demo",
      getToken: () => "tok",
      normalizeHandle: (s) => String(s || "").trim(),
      isConnected: () => true,
      requireConnected: () => true,
      isPublicApi: () => false,
      initSession: async () => true,
      api: async () => ({}),
    });
    new Function("window", `${readFileSync(path.join(root, "public", "app.shellwire.js"), "utf8")};`)(win);
    new Function("window", `${readFileSync(path.join(root, "public", "app.chromewire.js"), "utf8")};`)(win);
    const wire = win.__GMXChromeWireFactory({
      chrome: {
        $: (id) => ({ id }),
        toast: (type, html) => ({ type, html }),
        setDegraded: () => {},
        showFatal: () => {},
        hideFatal: () => {},
        setBusy: () => {},
        wireDegradedBar: () => {},
        wireFatalBar: () => {},
      },
      fmt: { escapeHtml: (s) => `e:${s}` },
      styles: { fillStyles: () => true },
      nav: { showTab: (n) => n, ensurePredictionTabVisible: () => {} },
      setBg: { setBg: (tab) => tab },
      modals: { showInfoModal: (t, h) => ({ t, h }) },
      toggles: { getBestMode: () => "on", setBestMode: () => {}, syncBestModeUi: () => {} },
      paywall: { abVariant: () => "a", openLimitModal: () => {}, closeLimitModal: () => {}, bindLimitModal: () => {}, setPayState: () => {}, openPaySuccess: () => {}, closePaySuccess: () => {}, bindPaySuccess: () => {} },
      health: { setApiPillState: () => {}, ping: async () => "ok", loadBuild: async () => ({}), watchBuildUpdates: () => {} },
      usage: { normLimitForUI: (n) => n, setMeter: () => {}, usageCosmeticSignature: () => "", refreshUsage: async () => {} },
      help: { renderHelpModal: () => {}, openHelpModal: () => {}, closeHelpModal: () => {}, bindHelpModal: () => {} },
      account: { applyRefCountEligible: (e) => e, applyAdminVisibility: () => {} },
      getInitDone: () => false,
      normalizeTopLevelTab: (n) => n,
      LS_SITE_LANG: "gmx_site_lang",
      API: "http://test",
      LS_HANDLE: "h",
      LS_TOKEN: "t",
      LS_IS_ADMIN: "a",
      LS_ADMIN_CLAIMABLE: "c",
      isLocalDevHost: () => true,
      getAdminToken: () => "admin",
      setAuthOk: () => {},
      t: (k) => k,
    });
    assert.equal(wire.fillStyles(), true);
    assert.equal(wire.$("x").id, "x");
    assert.equal(wire.esc("<b>"), "e:<b>");
    wire.tab("home");
    assert.equal(wire.getToken(), "tok");
    assert.equal(wire.applyRefCountEligible(3), 3);
    assert.equal(wire.siteLang(), "en");
  } finally {
    globalThis.document = prevDoc;
  }
});

test("bankuiwire: wires bankui and bestpick modules", () => {
  const prevLs = globalThis.localStorage;
  globalThis.localStorage = { getItem: () => null, setItem: () => {} };
  const win = {};
  try {
  new Function("window", `${readFileSync(path.join(root, "public", "app.bankui.js"), "utf8")};`)(win);
  new Function("window", `${readFileSync(path.join(root, "public", "app.bestpick.js"), "utf8")};`)(win);
  new Function("window", `${readFileSync(path.join(root, "public", "app.bankuiwire.js"), "utf8")};`)(win);
  const wireCtx = {
    $: () => ({ value: "en" }),
    fmt: { escapeHtml: (s) => `e:${s}` },
    gen: { dedupeLines: (x) => x, normalizeLine: (s) => s, pickBestLine: () => "best" },
    keys: { DRAFT_GM_NEW: "d1", DRAFT_GN_NEW: "d2", DRAFT_GM_PASTE: "d3", DRAFT_GN_PASTE: "d4" },
    getBankKey: () => "gmx_gm_bank",
    readKey: () => ["line"],
    writeKey: () => {},
    saveCap: () => 50,
    saveCapFree: 50,
    lastSaved: { gm: 0, gn: 0 },
    dedupeLines: (x) => x,
    linesFromText: (t) => [t],
    requireConnected: () => true,
    getHandle: () => "@x",
    isPro: () => false,
    api: async () => ({}),
    toast: () => {},
    t: (k) => k,
    setBusy: () => {},
    refreshUsage: async () => {},
    readGenParams: () => ({ mode: "min", lang: "en", style: "warm", antiN: 1 }),
    getAntiStrength: () => 1,
  };
  const wire = win.__GMXBankUiWireFactory(wireCtx);
  assert.equal(wire.bankUi.totalSaved("gm"), 1);
  assert.equal(wire.bestPick.pickBestLine("gm", ["a", "b"]), "best");
  assert.equal(wire.escapeHtml("<b>"), "e:<b>");
  assert.equal(wire.remainingSlots("gm"), 49);
  } finally {
    globalThis.localStorage = prevLs;
  }
});

test("generatewire: wires refstats and generateflow delegates", async () => {
  const win = {};
  new Function("global", `${readFileSync(path.join(root, "public", "lib", "gmgn-gen-history-core.js"), "utf8")};`)(win);
  new Function("window", `${readFileSync(path.join(root, "public", "app.refstats.js"), "utf8")};`)(win);
  new Function("window", `${readFileSync(path.join(root, "public", "app.generateflow.js"), "utf8")};`)(win);
  new Function("window", `${readFileSync(path.join(root, "public", "app.genhistoryui.js"), "utf8")};`)(win);
  new Function("window", `${readFileSync(path.join(root, "public", "app.generatewire.js"), "utf8")};`)(win);
  const msg = { innerHTML: "" };
  const wire = win.__GMXGenerateWireFactory({
    $: (id) => (id === "refLinkRow" ? { classList: { remove: () => {} }, style: {} } : id === "gmMsg" ? msg : null),
    api: async () => ({}),
    gen: { mergeAppendUnique: (a, b) => [...a, ...b] },
    bankUi: { getGmView: () => "gm", getGnView: () => "gn" },
    inflight: { gm: false, gn: false },
    abort: { gm: null, gn: null },
    siteLangKey: "gmx_site_lang",
    refPromoOpenKey: "gmx_ref_promo",
    getHandle: () => "@demo",
    renderReferralRightCopy: () => {},
    renderGuideRightCopy: () => {},
    applyRefCountEligible: () => {},
    nextReferralUnlockAt: () => 0,
    renderThemes: () => {},
    renderExtThemes: () => {},
    fillStyles: () => {},
    fillPacks: () => {},
    requireConnected: () => true,
    getToken: () => "",
    initSession: async () => true,
    readGenParams: () => ({ mode: "min", lang: "en", style: "warm", antiN: 1 }),
    getAntiStrength: () => 1,
    getCleanFillEnabled: () => false,
    getBestMode: () => false,
    ensureIndexed: () => {},
    activeKey: () => "k",
    getGlobalKey: () => "g",
    readKey: () => [],
    writeKey: () => {},
    remainingSlots: () => 1,
    saveCap: () => 50,
    renderList: () => {},
    postEvent: async () => {},
    setBusy: () => {},
    filterAntiRepeat: (_k, _key, lines) => lines,
    pushRecent: () => {},
    repeatKey: () => "",
    oneClickCleanup: async () => {},
    refreshUsage: async () => {},
    logEvent: () => {},
    escapeHtml: (s) => s,
    siteTr: (_k, fb) => fb,
    t: (k) => k,
    friendlyUiErrorMessage: (m) => m,
    toast: () => {},
    yieldToUiFrame: async () => {},
    cleanFillStrength: 2,
  });
  assert.deepEqual(wire.mergeAppendUnique(["a"], ["b"]), ["a", "b"]);
  wire.revealReferralLinkUi();
  await wire.generate("gm", 1);
  assert.match(msg.innerHTML, /Session expired/);
});

test("walletwire: wires wallet helpers, pay, and ui delegates", () => {
  const win = {};
  new Function("window", `${readFileSync(path.join(root, "public", "app.wallethelpers.js"), "utf8")};`)(win);
  new Function("window", `${readFileSync(path.join(root, "public", "app.walletpay.js"), "utf8")};`)(win);
  new Function("window", `${readFileSync(path.join(root, "public", "app.walletui.js"), "utf8")};`)(win);
  new Function("window", `${readFileSync(path.join(root, "public", "app.walletwire.js"), "utf8")};`)(win);
  const els = { w_status_desc: { innerHTML: "" } };
  const wire = win.__GMXWalletWireFactory({
    $: (id) => els[id] || null,
    api: async () => ({}),
    K: { WALLET_CHOICE: "gmx_wallet_choice" },
    modals: {},
    escapeHtml: (s) => s,
    toast: () => {},
    trackEvent: () => {},
    abVariant: () => "a",
    friendlyUiErrorMessage: (m) => m,
    setPayState: () => {},
    openPaySuccess: () => {},
    getHandle: () => "@demo",
    refreshUsage: async () => {},
  });
  wire.renderWalletStatus({ active: true, paidUntil: "2026-12-01" });
  assert.match(els.w_status_desc.innerHTML, /Pro active/);
  assert.equal(typeof wire.loadPlans, "function");
  assert.equal(typeof wire.bindWalletTab, "function");
});

test("referralswire: wires referrals factory delegates", async () => {
  const win = {};
  new Function("window", `${readFileSync(path.join(root, "public", "app.referrals.js"), "utf8")};`)(win);
  new Function("window", `${readFileSync(path.join(root, "public", "app.referralswire.js"), "utf8")};`)(win);
  const els = { refInvitedBody: { innerHTML: "" } };
  const wire = win.__GMXReferralsWireFactory({
    $: (id) => els[id] || null,
    api: async () => ({ ok: true, list: [] }),
    t: (_k, fb) => fb,
    requireConnected: () => true,
    getReferralUiCopy: () => ({}),
    siteLangKey: "gmx_site_lang",
    refreshRefStats: async () => null,
    revealReferralLinkUi: () => {},
    applyRefCountEligible: () => {},
    renderThemes: () => {},
    renderExtThemes: () => {},
    initWallpapers: () => {},
    renderExtWallpapers: () => {},
    fillStyles: () => {},
    fillPacks: () => {},
    refreshUsage: async () => {},
    initReferralPromoDetailsState: () => {},
  });
  await wire.loadRefInvited(30);
  assert.match(els.refInvitedBody.innerHTML, /No invited users yet/);
  assert.equal(typeof wire.loadRefLeaderboard, "function");
});

test("leaderboardwire: wires leaderboard factory delegates", () => {
  const win = {};
  new Function("window", `${readFileSync(path.join(root, "public", "app.leaderboard.js"), "utf8")};`)(win);
  new Function("window", `${readFileSync(path.join(root, "public", "app.leaderboardwire.js"), "utf8")};`)(win);
  let lbDays = 7;
  const wire = win.__GMXLeaderboardWireFactory({
    $: () => null,
    setLbDays: (v) => { lbDays = v; },
  });
  wire.bindLeaderboardUI();
  wire.bindLeaderboardUI();
  assert.equal(wire.getLbDays(), 7);
  assert.equal(lbDays, 7);
});

test("predictionwire: wires prediction factory delegates", async () => {
  const win = {};
  new Function("window", `${readFileSync(path.join(root, "public", "app.prediction.js"), "utf8")};`)(win);
  new Function("window", `${readFileSync(path.join(root, "public", "app.predictionwire.js"), "utf8")};`)(win);
  const sel = (value = "all") => ({
    value,
    innerHTML: "",
    addEventListener: () => {},
  });
  const els = {
    pmList: { innerHTML: "", classList: { add: () => {}, remove: () => {} } },
    pm_status: { textContent: "" },
    pm_locked_note: { textContent: "" },
    pm_asset: sel(),
    pm_bias: sel(),
    pm_conf: sel("0"),
    pm_refresh: { onclick: null },
  };
  const wire = win.__GMXPredictionWireFactory({
    $: (id) => els[id] || null,
    escapeHtml: (s) => s,
    t: (_k, fb) => fb,
    getHandle: () => "",
    getToken: () => "",
    tabState: { getCurrentTab: () => "prediction" },
  });
  wire.syncPredictionFilterCopy();
  assert.match(els.pm_bias.innerHTML, /bullish/);
  await wire.loadPredictionSignals({ force: true });
  assert.match(els.pmList.innerHTML, /Sign in with your @handle/);
});

test("adminwire: wires admin factory delegates", () => {
  const win = {};
  new Function("window", `${readFileSync(path.join(root, "public", "app.admin.js"), "utf8")};`)(win);
  new Function("window", `${readFileSync(path.join(root, "public", "app.adminwire.js"), "utf8")};`)(win);
  const els = {
    adminHandle: { value: "" },
    adminAuthState: { textContent: "" },
  };
  const wire = win.__GMXAdminWireFactory({
    $: (id) => els[id] || null,
    escapeHtml: (s) => s,
    api: async () => ({}),
    getHandle: () => "@demo",
    requireConnected: () => true,
    setAdminToken: () => {},
    isAdminSignedIn: () => false,
    adminHandle: "@Kristofer_Sol_",
  });
  wire.syncAdminUi();
  assert.equal(els.adminHandle.value, "@demo");
  assert.equal(els.adminAuthState.textContent, "signed out");
  assert.equal(typeof wire.pruneLegacyAdminPanels, "function");
});

test("redeemwire: wires redeem factory and binds UI", async () => {
  const win = {};
  new Function("window", `${readFileSync(path.join(root, "public", "app.redeem.js"), "utf8")};`)(win);
  new Function("window", `${readFileSync(path.join(root, "public", "app.redeemwire.js"), "utf8")};`)(win);
  const els = {
    btnRedeem: { onclick: null },
    redeemCode: { value: "" },
    connectMsg: { innerHTML: "" },
  };
  const wire = win.__GMXRedeemWireFactory({
    $: (id) => els[id] || null,
    requireConnected: () => true,
    getHandle: () => "@demo",
    api: async () => ({}),
    tab: () => {},
    renderWalletStatus: () => {},
    refreshUsage: async () => {},
  });
  assert.equal(typeof wire.bindRedeem, "function");
  await els.btnRedeem.onclick?.();
  assert.match(els.connectMsg.innerHTML, /Paste a code first/);
});

test("connectwire: wires connect factory and binds UI", async () => {
  const win = {};
  new Function("window", `${readFileSync(path.join(root, "public", "app.connect.js"), "utf8")};`)(win);
  new Function("window", `${readFileSync(path.join(root, "public", "app.connectwire.js"), "utf8")};`)(win);
  const els = {
    btnConnect: { onclick: null },
    connectMsg: { textContent: "x", innerHTML: "" },
    xHandle: { value: "!!!" },
  };
  const wire = win.__GMXConnectWireFactory({
    $: (id) => els[id] || null,
    normalizeHandle: () => "",
  });
  assert.equal(typeof wire.bindConnect, "function");
  await els.btnConnect.onclick?.();
  assert.match(els.connectMsg.innerHTML, /valid @handle/);
});

test("connectwire grouped: flattens grouped ctx", () => {
  const win = {};
  new Function("window", `${readFileSync(path.join(root, "public", "app.connect.js"), "utf8")};`)(win);
  new Function("window", `${readFileSync(path.join(root, "public", "app.connectwire.js"), "utf8")};`)(win);
  let captured = null;
  win.__GMXConnectFactory = (cfg) => {
    captured = cfg;
    return { bindConnect: () => {} };
  };
  win.__GMXConnectWireFactory({
    core: { $: () => null, api: async () => ({}), escapeHtml: (s) => s, friendlyUiErrorMessage: (m) => m, normalizeHandle: (h) => h },
    auth: { setAuthOk: () => {}, applyAdminVisibility: () => {} },
    session: { refreshUsage: async () => {}, loadPlans: async () => {}, ping: async () => {} },
    keys: { handle: "h", token: "t", isAdmin: "a", adminClaimable: "c", forceLogout: "f", forceLogoutV2: "f2" },
  });
  assert.equal(captured.keys.token, "t");
  assert.equal(typeof captured.ping, "function");
});

test("bootstrapunlockwire: wires unlock catalog and storage delegates", () => {
  const win = {};
  const scripts = [
    "app.unlock.js",
    "app.wallpapers.js",
    "app.customwallpapers.js",
    "app.themes.js",
    "app.generate.js",
    "app.banks.js",
    "app.antirepeat.js",
    "app.ui.js",
    "app.wallpaperstore.js",
    "app.extwallpaperstore.js",
    "app.wallpaperhelpers.js",
    "app.bootstrapunlockwire.js",
  ];
  for (const file of scripts) {
    new Function("window", `${readFileSync(path.join(root, "public", file), "utf8")};`)(win);
  }
  const wire = win.__GMXBootstrapUnlockWireFactory({
    getAssetRev: () => "rev1",
    storage: {
      lsGet: () => "",
      lsSet: () => {},
      extLsSet: () => {},
    },
    keys: {
      CUSTOM_BG_GLOBAL: "gmx_custom_bg_global",
      EXT_CUSTOM_BG_GLOBAL: "gmx_ext_custom_bg_global",
      WP_GLOBAL: "gmx_wp_global",
      WP_TAB_PREFIX: "gmx_wp_tab_",
      WALLPAPER_REFRESH_MIGRATION: "gmx_wp_refresh_mig",
      EXT_WP: "gmx_ext_wp",
      EXT_WP_TARGET: "gmx_ext_wp_target",
      EXT_WP_VIEW_PREFIX: "gmx_ext_wp_view_",
      TOKEN: "gmx_token",
    },
    api: "http://127.0.0.1:10000",
    empty: "__EMPTY__",
    isPro: () => false,
    getRefCount: () => 0,
    getToken: () => "",
    normalizeWallpaperId: (id) => id,
    getWallpaperTabs: () => ["home"],
    normalizeExtWallpaperIdLocal: (id) => id,
    getWallpapers: () => [],
    getExtWallpapers: () => [],
  });
  assert.equal(wire.FREE_VISIBLE_THEMES > 0, true);
  assert.equal(typeof wire.unlockedCountByRefs, "function");
  assert.equal(typeof wire.__gmxBanks.readKey, "function");
  assert.equal(typeof wire.__gmxUi.observeLazyBg, "function");
});

test("bootstrapgenwire: wires genparams styles toggles and custombg delegates", () => {
  const win = {
    document: { body: { classList: { contains: () => false } } },
    localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} },
  };
  const scripts = [
    "app.genparams.js",
    "app.cleanfill.js",
    "app.styles.js",
    "app.toggles.js",
    "app.custombg.js",
    "app.tabtheme.js",
    "app.logs.js",
    "app.bootstrapgenwire.js",
  ];
  for (const file of scripts) {
    new Function("window", `${readFileSync(path.join(root, "public", file), "utf8")};`)(win);
  }
  const wire = win.__GMXBootstrapGenWireFactory({
    storage: {
      lsGet: () => "",
      lsSet: () => {},
    },
    keys: {},
    chrome: { $: () => null },
    themes: { STYLES: ["classic"], packsForKind: () => [] },
    anti: { antiWindow: () => new Map() },
    isPro: () => false,
    reqRefsForUnlockIndex: () => 0,
    unlockedCountByRefs: () => 0,
    freeVisiblePacks: 2,
    freeVisibleStyles: 2,
    t: (k) => k,
    syncModePanelCopy: () => {},
    siteLang: () => "en",
    syncCleanFillUi: () => {},
    getCurrentLang: () => "en",
    getCurrentTab: () => "home",
    hasActiveUnlockedWallpaper: () => false,
  });
  assert.equal(typeof wire.__gmxGp.readGenParams, "function");
  assert.equal(typeof wire.__gmxStyles.fillStyles, "function");
  assert.equal(typeof wire.__gmxToggles.syncBestModeUi, "function");
  assert.equal(typeof wire.__gmxCbg.applyUserBg, "function");
  assert.equal(typeof wire.__gmxTabTheme.getTabBg, "function");
  assert.equal(typeof wire.__gmxLogs.logEvent, "function");
});

test("bootstrapusagewire: wires paywall usage help and health delegates", () => {
  const win = {
    document: { body: { classList: { contains: () => false, add: () => {}, remove: () => {} } } },
    localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} },
    addEventListener: () => {},
  };
  const scripts = [
    "app.paywall.js",
    "app.help.js",
    "app.usage.js",
    "app.wallpaperapply.js",
    "app.health.js",
    "app.bootstrapusagewire.js",
  ];
  for (const file of scripts) {
    new Function("window", `${readFileSync(path.join(root, "public", file), "utf8")};`)(win);
  }
  const wire = win.__GMXBootstrapUsageWireFactory({
    storage: { lsGet: () => "", lsSet: () => {} },
    chrome: { $: () => null, toast: () => {}, setDegraded: () => {} },
    modals: { initModalsShell: () => {} },
    tabState: { getCurrentTab: () => "home" },
    wp: { ensureWallpaperLayer: () => null, setWallpaperLayerImage: () => {} },
    wpStore: { getWallpaperForTab: () => "" },
    customWp: { getEffectiveCustomWallpapersSite: () => [] },
    isPro: () => false,
    getSaveCapFree: () => 50,
    getLastUsage: () => ({ gm: { used: 0, limit: 0 }, gn: { used: 0, limit: 0 }, resetAt: null }),
    getLastSaved: () => ({ gm: 0, gn: 0 }),
    getAuthOk: () => false,
    getToken: () => "",
    getHandle: () => "",
    api: async () => ({}),
    getWallpapers: () => [],
    wallpaperUnlocked: () => true,
    wallpaperFullUrl: (id) => id,
    getCurrentTab: () => "home",
  });
  assert.equal(typeof wire.__gmxPaywall.abVariant, "function");
  assert.equal(typeof wire.__gmxUsage.normLimitForUI, "function");
  assert.equal(typeof wire.__gmxHelp.renderHelpIfOpen, "function");
  assert.equal(typeof wire.__gmxWpApply.applyWallpaper, "function");
  assert.equal(typeof wire.__gmxHealth.ping, "function");
});

test("bootstrapuiwire: wires setbg themesui nav and extension UI delegates", () => {
  const win = {
    document: {
      body: { classList: { contains: () => false, add: () => {}, remove: () => {} } },
      querySelectorAll: () => [],
      getElementById: () => null,
    },
    localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} },
  };
  const scripts = [
    "app.setbg.js",
    "app.themeapply.js",
    "app.accountui.js",
    "app.wallpaperui.js",
    "app.themesui.js",
    "app.extview.js",
    "app.extapply.js",
    "app.extcustombgui.js",
    "app.extthemesui.js",
    "app.nav.js",
    "app.extwallpaperui.js",
    "app.bootstrapuiwire.js",
  ];
  for (const file of scripts) {
    new Function("window", `${readFileSync(path.join(root, "public", file), "utf8")};`)(win);
  }
  const wire = win.__GMXBootstrapUiWireFactory({
    storage: { lsGet: () => "", lsSet: () => {}, extLsSet: () => {} },
    keys: {
      REF_ELIGIBLE_CACHE: "gmx_ref_eligible",
      IS_ADMIN: "gmx_is_admin",
      WP_GLOBAL: "gmx_wp_global",
      THEMEWALL_VIEW: "gmx_themewall_view",
      EXT_VIEW: "gmx_ext_view",
      LAST_TAB: "gmx_last_tab",
      EXT_CUSTOM_BG_GLOBAL: "gmx_ext_custom_bg_global",
      EXT_CUSTOM_BG_TAB_PREFIX: "gmx_ext_custom_bg_tab_",
      EXT_CUSTOM_BG_TARGET: "gmx_ext_custom_bg_target",
      EXT_CUSTOM_BG_LEGACY: "gmx_ext_custom_bg_legacy",
      EXT_WP_TARGET: "gmx_ext_wp_target",
    },
    chrome: { $: () => null, toast: () => {} },
    fmt: { escapeHtml: (s) => s },
    tabState: { normalizeTopLevelTab: (n) => n, setCurrentTab: () => {}, TOP_LEVEL_TABS: ["home"] },
    themes: { pickAccentOn: () => "#000" },
    wp: { CUSTOM_UPLOAD_ID: "custom" },
    wpStore: { wallpaperKeyForTab: () => "", setWallpaperForTab: () => {} },
    customWp: {
      getEffectiveCustomWallpapersSite: () => [],
      loadCustomWallpapers: async () => {},
      getEffectiveExtCustomWallpapers: () => [],
    },
    extWpStore: {
      normalizeExtWallpaperView: (v) => v,
      currentExtWallpaperTarget: () => "popup",
      setExtWallpaperForView: () => {},
      syncExtWallpaperTargetUI: () => {},
      getExtWallpaperForView: () => "",
      extWallpaperLabel: () => "",
    },
    ui: { chunkedRender: () => {}, observeLazyBg: () => {}, prefetchImage: () => {} },
    tabTheme: { getTabBg: () => "linear-gradient(#000,#111)" },
    cbg: { applyUserBg: () => {} },
    wpApply: { applyWallpaper: () => {} },
    isPro: () => false,
    unlockedCountByRefs: () => 0,
    reqRefsForUnlockIndex: () => 0,
    formatUnlockMeter: () => "",
    freeVisibleThemes: 2,
    freeVisibleWallpapers: 2,
    freeVisibleExtThemes: 2,
    freeVisibleExtWallpapers: 2,
    t: (k) => k,
    trWp: (k) => k,
    getRefCount: () => 0,
    setRefCount: () => {},
    getAuthOk: () => false,
    getThemes: () => [{ id: "classic", name: "Classic" }],
    getWallpapers: () => [],
    getExtThemes: () => [{ id: "classic", name: "Classic" }],
    getExtWallpapers: () => [],
    getWallpaperTabs: () => ["home"],
    getCurrentTab: () => "home",
    wallpaperUnlocked: () => true,
    wallpaperThumbUrl: (id) => id,
    wallpaperFullUrl: (id) => id,
    extWallpaperThumbUrl: (id) => id,
    extWallpaperFullUrl: (id) => id,
    normalizeExtWallpaperId: (id) => id,
    unlockedThemesCount: () => 1,
    requireConnected: () => true,
    onTabActivated: () => {},
    onUnlockUiRefresh: () => {},
  });
  assert.equal(typeof wire.__gmxSetBg.setBg, "function");
  assert.equal(typeof wire.__gmxThemeApply.applyTheme, "function");
  assert.equal(typeof wire.__gmxThemesUi.renderThemes, "function");
  assert.equal(typeof wire.__gmxNav.showTab, "function");
  assert.equal(typeof wire.__gmxExtWpUi.renderExtWallpapers, "function");
});

test("bootstrapcorewire: wires storage chrome i18n and lang menu delegates", () => {
  const win = {
    localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} },
    document: { querySelectorAll: () => [], getElementById: () => null },
    addEventListener: () => {},
  };
  const scripts = [
    "app.storage.js",
    "app.format.js",
    "app.i18nui.js",
    "app.tabstate.js",
    "app.sitei18nui.js",
    "app.sitei18ndynamic.js",
    "app.chrome.js",
    "app.modals.js",
    "app.sitelangmenu.js",
    "app.langui.js",
    "app.bootstrapcorewire.js",
  ];
  for (const file of scripts) {
    new Function("window", `${readFileSync(path.join(root, "public", file), "utf8")};`)(win);
  }
  const wire = win.__GMXBootstrapCoreWireFactory({
    getSiteLangs: () => ["en"],
    setSiteLangs: () => {},
    getReplyLangs: () => ["en"],
    setReplyLangs: () => {},
    applyLang: () => {},
    syncBestModeUi: () => {},
    syncCleanFillUi: () => {},
    updateLangFlags: () => {},
    renderWallpaperUI: () => {},
    syncPredictionFilterCopy: () => {},
    syncReferralCardCopy: () => {},
    initReferralPromoDetailsState: () => {},
    getHandle: () => "",
    scheduleRefStatsRefresh: () => {},
  });
  assert.equal(wire.ADMIN_HANDLE, "@Kristofer_Sol_");
  assert.equal(typeof wire.__gmxSt.lsGet, "function");
  assert.equal(typeof wire.__gmxChrome.$, "function");
  assert.equal(typeof wire.__gmxI18nUi.t, "function");
  assert.equal(typeof wire.__gmxTabState.getCurrentTab, "function");
  assert.equal(typeof wire.__gmxSiteLangMenu.closeLangMenu, "function");
  assert.equal(typeof wire.__gmxLangUi.updateLangFlags, "function");
  assert.equal(wire.INFLIGHT.gm, false);
});
