import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  pushBatchHistory,
  readBatchHistory,
  GEN_BATCH_HISTORY_MAX,
} from "../tools/lib/gmgn-gen-history-core.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("batch history keeps last five runs per kind", () => {
  const store = {};
  const lsGet = (k, d) => (k in store ? store[k] : d);
  const lsSet = (k, v) => {
    store[k] = v;
  };
  for (let i = 1; i <= 7; i++) {
    pushBatchHistory("gm", { lines: [`line ${i}`], count: 10 }, lsGet, lsSet);
  }
  const hist = readBatchHistory("gm", lsGet);
  assert.equal(hist.length, GEN_BATCH_HISTORY_MAX);
  assert.match(hist[0].lines[0], /line 7/);
});

test("gm/gn tabs expose batch history and edit hint", () => {
  const html = fs.readFileSync(path.join(root, "public", "app.html"), "utf8");
  for (const id of ["gmGenHistory", "gnGenHistory", "gm_edit_hint", "gn_edit_hint"]) {
    assert.match(html, new RegExp(`id="${id}"`));
  }
});

test("generateflow records batch history after bulk runs", () => {
  const src = fs.readFileSync(path.join(root, "public", "app.generateflow.js"), "utf8");
  assert.match(src, /recordBatchHistory/);
  assert.match(src, /renderGenHistory/);
});

test("gmgnwire triggers batch on active tab ctrl+enter", () => {
  const src = fs.readFileSync(path.join(root, "public", "app.gmgnwire.js"), "utf8");
  assert.match(src, /wireCtrlEnterBatch/);
  assert.match(src, /ctrl_enter/);
  assert.doesNotMatch(src, /target\.closest\("#tab-gm"\)/);
});

test("en locale defines gen history and edit hint copy", () => {
  const en = JSON.parse(fs.readFileSync(path.join(root, "shared", "i18n", "locales", "en.json"), "utf8"));
  for (const key of [
    "gen_history_label",
    "gen_history_copy",
    "gm_edit_hint",
    "gn_edit_hint",
    "gm_gen_history_label",
  ]) {
    assert.ok(en[key], `missing ${key}`);
  }
});
