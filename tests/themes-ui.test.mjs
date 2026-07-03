import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { readFileSync } from "fs";
import { fileURLToPath } from "node:url";
import { themeGroup, groupThemeItems, THEME_GROUP_ORDER } from "../tools/lib/theme-group-core.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function loadFactory(file, exportName, win = {}) {
  const code = readFileSync(path.join(root, "public", file), "utf8");
  const fn = new Function("window", `${code}; return window.${exportName};`);
  return fn(win);
}

function loadThemesUi(ctx = {}) {
  const win = {
    GMXThemeGroupCore: { themeGroup, groupThemeItems, THEME_GROUP_ORDER },
  };
  const themes = [
    { id: "classic", name: "Classic", a: "rgba(124,92,255,1)", b: "rgba(0,229,255,1)" },
    { id: "midnight", name: "Midnight", a: "rgba(5,7,14,1)", b: "rgba(15,23,42,1)" },
  ];
  let clearCount = 0;
  let appendCount = 0;
  const grid = {
    classList: { add() {} },
    appendChild() {
      appendCount++;
    },
  };
  Object.defineProperty(grid, "innerHTML", {
    set(v) {
      if (v === "") clearCount++;
    },
    get: () => "",
  });
  const els = { themeGrid: grid };
  const factory = loadFactory("app.themesui.js", "__GMXThemesUiFactory", win);
  const mod = factory({
    $: (id) => els[id] || null,
    t: (_k, fb) => fb,
    getThemes: () => themes,
    getWallpapers: () => [],
    getChosenTheme: () => "classic",
    unlockedThemesCount: () => 2,
    unlockedCountByRefs: (n) => n,
    freeVisibleThemes: 8,
    freeVisibleWallpapers: 8,
    isPro: () => false,
    chunkedRender: (parent, items, build) => {
      for (const item of items) parent.appendChild(build(item));
    },
    ...ctx,
  });
  return { mod, grid, metrics: () => ({ clearCount, appendCount }) };
}

function withDocumentMock(run) {
  const prevDoc = globalThis.document;
  globalThis.document = {
    createElement(tag) {
      const el = {
        tagName: tag.toUpperCase(),
        className: "",
        textContent: "",
        style: {},
        dataset: {},
        classList: {
          _c: new Set(),
          add(c) {
            this._c.add(c);
          },
          remove(c) {
            this._c.delete(c);
          },
        },
        appendChild(child) {
          this.children = this.children || [];
          this.children.push(child);
        },
        addEventListener() {},
        children: [],
      };
      return el;
    },
  };
  try {
    return run();
  } finally {
    if (prevDoc === undefined) delete globalThis.document;
    else globalThis.document = prevDoc;
  }
}

test("themeGroup classifies dark light and colorful palettes", () => {
  assert.equal(themeGroup({ a: "rgba(5,7,14,1)", b: "rgba(15,23,42,1)" }), "dark");
  assert.equal(themeGroup({ a: "rgba(250,250,250,1)", b: "rgba(220,220,225,1)" }), "light");
  assert.equal(themeGroup({ a: "rgba(124,92,255,1)", b: "rgba(0,229,255,1)" }), "colorful");
});

test("groupThemeItems preserves order dark light colorful", () => {
  const items = [
    { th: { id: "c", a: "rgba(124,92,255,1)", b: "rgba(0,229,255,1)" }, idx: 0 },
    { th: { id: "d", a: "rgba(5,7,14,1)", b: "rgba(15,23,42,1)" }, idx: 1 },
    { th: { id: "l", a: "rgba(250,250,250,1)", b: "rgba(220,220,225,1)" }, idx: 2 },
  ];
  const groups = groupThemeItems(items);
  assert.deepEqual(
    groups.map((g) => g.id),
    THEME_GROUP_ORDER.filter((id) => groups.some((g) => g.id === id))
  );
});

test("themes ui supports hover preview and grouping", () => {
  const src = fs.readFileSync(path.join(root, "public", "app.themesui.js"), "utf8");
  assert.match(src, /GMXThemeGroupCore/);
  assert.match(src, /previewRestoreId/);
  assert.match(src, /themeProHint/);
  assert.match(src, /themeGroupSection/);
});

test("themes css styles groups preview and pro hint", () => {
  const css = fs.readFileSync(path.join(root, "public", "app.css"), "utf8");
  assert.match(css, /\.themeGroupSection/);
  assert.match(css, /\.themeCard\.previewing/);
  assert.match(css, /\.themeProHint/);
});

test("themes tab exposes grouped grid root", () => {
  const html = fs.readFileSync(path.join(root, "public", "app.html"), "utf8");
  assert.match(html, /id="themeGrid"/);
  assert.match(html, /lib\/theme-group-core\.js/);
});

test("en locale defines theme group and pro unlock copy", () => {
  const en = JSON.parse(fs.readFileSync(path.join(root, "shared", "i18n", "locales", "en.json"), "utf8"));
  for (const key of [
    "themes_group_dark",
    "themes_group_light",
    "themes_group_colorful",
    "themes_pro_unlocks_all",
    "themes_hover_preview",
  ]) {
    assert.ok(en[key], `missing ${key}`);
  }
});

test("themes desc matches curated wallpaper pack count", () => {
  const en = JSON.parse(fs.readFileSync(path.join(root, "shared", "i18n", "locales", "en.json"), "utf8"));
  const ru = JSON.parse(fs.readFileSync(path.join(root, "shared", "i18n", "locales", "ru.json"), "utf8"));
  assert.match(en.themes_desc, /25 curated site wallpapers/i);
  assert.doesNotMatch(en.themes_desc, /100 premium/i);
  assert.match(ru.themes_desc, /25 курируемых обоев/i);
  assert.doesNotMatch(ru.themes_desc, /100 премиум/i);
});

test("renderThemes keeps grid when signature unchanged", () => {
  withDocumentMock(() => {
    const { mod, metrics } = loadThemesUi();
    mod.renderThemes();
    const afterFirst = metrics();
    assert.ok(afterFirst.appendCount > 0);
    mod.renderThemes();
    const afterSecond = metrics();
    assert.equal(afterSecond.clearCount, 1);
    assert.equal(afterSecond.appendCount, afterFirst.appendCount);
  });
});

test("renderThemes rebuilds grid when chosen theme changes", () => {
  withDocumentMock(() => {
    let chosen = "classic";
    const { mod, metrics } = loadThemesUi({
      getChosenTheme: () => chosen,
      applyTheme: (id) => {
        chosen = id;
      },
    });
    mod.renderThemes();
    chosen = "midnight";
    mod.renderThemes();
    assert.equal(metrics().clearCount, 2);
  });
});
