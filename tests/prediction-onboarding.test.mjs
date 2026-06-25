import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("prediction tab exposes newbie intro block", () => {
  const html = fs.readFileSync(path.join(root, "public", "app.html"), "utf8");
  for (const id of ["pm_newbie_title", "pm_newbie_body", "pm_learn_more_label"]) {
    assert.match(html, new RegExp(`id="${id}"`));
  }
});

test("prediction tab links to external markets", () => {
  const html = fs.readFileSync(path.join(root, "public", "app.html"), "utf8");
  assert.match(html, /href="https:\/\/polymarket\.com"[^>]*id="pm_learn_polymarket"/);
  assert.match(html, /href="https:\/\/kalshi\.com"[^>]*id="pm_learn_kalshi"/);
  assert.match(html, /target="_blank"/);
  assert.match(html, /rel="noopener noreferrer"/);
});

test("prediction onboarding css styles intro and learn links", () => {
  const css = fs.readFileSync(path.join(root, "public", "app.css"), "utf8");
  assert.match(css, /\.pmNewbieIntro/);
  assert.match(css, /\.pmLearnMore/);
  assert.match(css, /\.pmLearnLinks/);
});

test("en locale defines prediction onboarding copy", () => {
  const en = JSON.parse(fs.readFileSync(path.join(root, "shared", "i18n", "locales", "en.json"), "utf8"));
  for (const key of [
    "pm_newbie_title",
    "pm_newbie_body",
    "pm_learn_more_label",
    "pm_learn_polymarket",
    "pm_learn_kalshi",
    "pm_learn_manifold",
  ]) {
    assert.ok(en[key], key);
  }
});
