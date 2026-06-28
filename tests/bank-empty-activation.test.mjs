import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function setupMinDom() {
  if (globalThis.document?.createElement?._gmxMin) return;

  function walk(node, sel) {
    if (!node) return null;
    if (node.matches?.(sel)) return node;
    for (const child of node.children || []) {
      const hit = walk(child, sel);
      if (hit) return hit;
    }
    return null;
  }

  function walkAll(node, sel, out) {
    if (!node) return;
    if (node.matches?.(sel)) out.push(node);
    for (const child of node.children || []) walkAll(child, sel, out);
  }

  function makeEl(tag) {
    const classSet = new Set();
    const el = {
      tagName: String(tag || "div").toUpperCase(),
      textContent: "",
      value: "",
      style: { display: "" },
      children: [],
      attributes: {},
      classList: {
        add(...xs) {
          xs.forEach((x) => classSet.add(x));
        },
        remove(...xs) {
          xs.forEach((x) => classSet.delete(x));
        },
        toggle(c, v) {
          if (v) classSet.add(c);
          else classSet.delete(c);
        },
        contains(c) {
          return classSet.has(c);
        },
      },
      get className() {
        return [...classSet].join(" ");
      },
      set className(v) {
        classSet.clear();
        for (const part of String(v || "").split(/\s+/)) {
          if (part) classSet.add(part);
        }
      },
      setAttribute(k, v) {
        this.attributes[k] = v;
      },
      getAttribute(k) {
        return this.attributes[k];
      },
      appendChild(child) {
        this.children.push(child);
        child.parentElement = this;
        return child;
      },
      addEventListener(type, fn) {
        this._listeners = this._listeners || {};
        (this._listeners[type] = this._listeners[type] || []).push(fn);
      },
      dispatchEvent(evt) {
        const type = evt?.type || "click";
        for (const fn of this._listeners?.[type] || []) {
          fn({ target: this, stopPropagation() {}, preventDefault() {} });
        }
      },
      querySelector(sel) {
        return walk(this, sel);
      },
      querySelectorAll(sel) {
        const out = [];
        walkAll(this, sel, out);
        return out;
      },
      matches(sel) {
        if (sel.startsWith(".")) return this.classList.contains(sel.slice(1));
        return false;
      },
      focus() {},
      select() {},
      scrollIntoView() {},
    };

    Object.defineProperty(el, "innerHTML", {
      configurable: true,
      set(html) {
        el.children.length = 0;
        const parts = String(html || "").match(/<[^>]+>/g) || [];
        for (const part of parts) {
          const tagMatch = part.match(/^<(\w+)/);
          const classMatch = part.match(/class="([^"]+)"/);
          if (!tagMatch) continue;
          const child = makeEl(tagMatch[1].toLowerCase());
          if (classMatch) child.className = classMatch[1];
          if (part.includes("</button>") || part.endsWith("/>")) {
            /* keep */
          }
          if (tagMatch[1].toLowerCase() === "input") {
            const valueMatch = part.match(/value="([^"]*)"/);
            if (valueMatch) child.value = valueMatch[1];
          }
          el.appendChild(child);
        }
      },
      get() {
        return el.textContent;
      },
    });

    if (tag === "button") {
      el.click = () => el.dispatchEvent({ type: "click" });
    }

    return el;
  }

  const createElement = (tag) => makeEl(tag);
  createElement._gmxMin = true;
  globalThis.document = { createElement };
}

setupMinDom();

function loadBankUiFactory() {
  const code = readFileSync(path.join(root, "public", "app.bankui.js"), "utf8");
  const fn = new Function("window", `${code}; return window.__GMXBankUiFactory;`);
  const win = {};
  return fn(win);
}

function makeListEl() {
  const nodes = [];
  return {
    innerHTML: "",
    appendChild(node) {
      nodes.push(node);
    },
    querySelector(sel) {
      const walk = (node) => {
        if (!node) return null;
        if (node.matches?.(sel)) return node;
        for (const child of node.children || []) {
          const hit = walk(child);
          if (hit) return hit;
        }
        return null;
      };
      for (const node of nodes) {
        const hit = walk(node);
        if (hit) return hit;
      }
      return null;
    },
    querySelectorAll(sel) {
      const out = [];
      const walk = (node) => {
        if (!node) return;
        if (node.matches?.(sel)) out.push(node);
        for (const child of node.children || []) walk(child);
      };
      for (const node of nodes) walk(node);
      return out;
    },
    set innerHTML(_v) {
      nodes.length = 0;
    },
    get childNodes() {
      return nodes;
    },
  };
}

function makeBankUi(overrides = {}) {
  const create = loadBankUiFactory();
  const gmList = makeListEl();
  const gnList = makeListEl();
  const els = {
    gmList,
    gnList,
    gmCount: { textContent: "" },
    gnCount: { textContent: "" },
    gmMsg: { innerHTML: "", textContent: "" },
    gnMsg: { innerHTML: "", textContent: "" },
    gmTotal: { textContent: "" },
    gnTotal: { textContent: "" },
    gmCap: { textContent: "" },
    gnCap: { textContent: "" },
    gmSavedVal: { textContent: "" },
    gnSavedVal: { textContent: "" },
    gmSavedFill: { style: { width: "" } },
    gnSavedFill: { style: { width: "" } },
    gmSavedBreakdown: { textContent: "" },
    gnSavedBreakdown: { textContent: "" },
    gm_edit_hint: { className: "editHint", classList: { add() {}, remove() {}, toggle(_c, v) { this.hidden = !v; } }, hidden: false },
    gn_edit_hint: { className: "editHint", classList: { add() {}, remove() {}, toggle(_c, v) { this.hidden = !v; } }, hidden: false },
    gmFilter: { value: "" },
    gnFilter: { value: "" },
  };

  const storage = { key: "gmx_gm_bank", lines: [] };
  const bankui = create({
    $: (id) => els[id] || null,
    escapeHtml: (s) => String(s || ""),
    getHandle: () => "@demo_user",
    getBankKey: () => storage.key,
    readKey: () => storage.lines.slice(),
    writeKey: (_key, lines) => {
      storage.lines = lines.slice();
    },
    dedupeLines: (lines) => lines,
    normalizeLine: (s) => String(s || "").trim(),
    lastSaved: { gm: 0, gn: 0 },
    saveCapFree: 50,
    saveCap: () => 50,
    isPro: () => false,
    chunkedRender: (grid, items, renderItem) => {
      for (let i = 0; i < items.length; i++) {
        const row = renderItem(items[i], i);
        if (row) grid.appendChild(row);
      }
    },
    mountLineListSkeleton: () => {},
    t: (_key, fb) => String(fb || ""),
    ...overrides,
  });

  return { bankui, els, storage };
}

test("bankui: connected empty bank shows guided generate CTA", () => {
  const { bankui, els } = makeBankUi();
  bankui.renderList("gm");
  const state = els.gmList.querySelector(".bankEmptyState");
  assert.ok(state, "expected empty state panel");
  const cta = els.gmList.querySelector(".bankEmptyCta");
  assert.ok(cta, "expected generate CTA");
  assert.match(cta.textContent, /Generate one/i);
  assert.match(els.gmList.querySelector(".bankEmptyTitle").textContent, /No saved GM lines yet/i);
});

test("bankui: generate CTA invokes existing quick-generate callback", () => {
  const calls = [];
  const { bankui, els } = makeBankUi({
    onQuickGenerate: (kind) => calls.push(kind),
  });
  bankui.renderList("gm");
  els.gmList.querySelector(".bankEmptyCta").click();
  assert.deepEqual(calls, ["gm"]);
});

test("bankui: renderList does not trigger generation callback", () => {
  let calls = 0;
  const { bankui } = makeBankUi({
    onQuickGenerate: () => {
      calls += 1;
    },
  });
  bankui.renderList("gm");
  bankui.renderList("gn");
  assert.equal(calls, 0);
});

test("bankui: disconnected user sees connect CTA not generate CTA", () => {
  const { bankui, els } = makeBankUi({
    getHandle: () => "",
    onNavigateConnect: () => {},
    onQuickGenerate: () => assert.fail("generate should not be wired for disconnected"),
  });
  bankui.renderList("gm");
  const cta = els.gmList.querySelector(".bankEmptyCta");
  assert.ok(cta);
  assert.match(cta.textContent, /Connect handle/i);
  assert.doesNotMatch(cta.textContent, /Generate one/i);
});

test("bankui: connect CTA uses existing home/connect navigation callback", () => {
  const nav = [];
  const { bankui, els } = makeBankUi({
    getHandle: () => "",
    onNavigateConnect: (kind) => nav.push(kind),
  });
  bankui.renderList("gn");
  els.gnList.querySelector(".bankEmptyCta").click();
  assert.deepEqual(nav, ["gn"]);
});

test("bankui: non-empty bank hides empty activation CTA", () => {
  const { bankui, els, storage } = makeBankUi({
    chunkedRender: (grid, items) => {
      for (const _item of items) {
        const row = globalThis.document.createElement("div");
        row.className = "lineRow";
        grid.appendChild(row);
      }
    },
  });
  storage.lines = ["Saved morning line"];
  bankui.renderList("gm");
  assert.equal(els.gmList.querySelector(".bankEmptyState"), null);
  assert.equal(els.gmList.querySelectorAll(".lineRow").length, 1);
});

test("bankui: bank load error is not shown as normal empty state", () => {
  const { bankui, els } = makeBankUi({
    getBankListError: () => "sync_failed",
    onQuickGenerate: () => assert.fail("generate CTA must not appear on load error"),
  });
  bankui.renderList("gm");
  assert.ok(els.gmList.querySelector(".bankEmptyState"));
  assert.equal(els.gmList.querySelector(".bankEmptyCta"), null);
  assert.match(els.gmMsg.innerHTML, /sync_failed/);
  assert.match(els.gmList.querySelector(".bankEmptyTitle").textContent, /Could not load saved lines/i);
});

test("bankui: delete still works when bank has saved lines", () => {
  let deleted = false;
  const { bankui, els, storage } = makeBankUi({
    chunkedRender: (grid, items, renderItem) => {
      for (let i = 0; i < items.length; i++) {
        const row = globalThis.document.createElement("div");
        row.className = "lineRow";
        const del = globalThis.document.createElement("button");
        del.className = "delBtn";
        del.addEventListener("click", (e) => {
          e.stopPropagation();
          storage.lines.splice(i, 1);
          deleted = true;
          bankui.renderList("gm");
        });
        row.appendChild(del);
        grid.appendChild(row);
      }
    },
  });
  storage.lines = ["Line A", "Line B"];
  bankui.renderList("gm");
  assert.equal(els.gmList.querySelectorAll(".lineRow").length, 2);
  els.gmList.querySelector(".delBtn").click();
  assert.equal(deleted, true);
  assert.equal(storage.lines.length, 1);
});

test("bankui: double click on generate CTA calls callback twice not on render", () => {
  const calls = [];
  const { bankui, els } = makeBankUi({
    onQuickGenerate: () => calls.push(1),
  });
  bankui.renderList("gm");
  const btn = els.gmList.querySelector(".bankEmptyCta");
  btn.click();
  btn.click();
  assert.equal(calls.length, 2);
});
