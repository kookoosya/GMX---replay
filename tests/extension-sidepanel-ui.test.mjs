import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const extDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "extension");

test("side panel has GM/GN navigation and empty state open site CTA", () => {
  const html = fs.readFileSync(path.join(extDir, "sidepanel.html"), "utf8");
  assert.match(html, /id="tabGm"/);
  assert.match(html, /id="tabGn"/);
  assert.match(html, /id="btnEmptyOpenSite"/);
  assert.match(html, /ext_sidepanel_open_site/);
});

test("no Generate or Insert controls in side panel HTML", () => {
  const html = fs.readFileSync(path.join(extDir, "sidepanel.html"), "utf8").toLowerCase();
  assert.doesNotMatch(html, /id="btngenerate"|quick 1|batch 10|daily.*70/);
});

test("sidepanel css avoids horizontal overflow", () => {
  const css = fs.readFileSync(path.join(extDir, "sidepanel.css"), "utf8");
  assert.match(css, /max-width:\s*100%/);
  assert.match(css, /word-break:\s*break-word|overflow-wrap/i);
});

test("status regions are accessible", () => {
  const html = fs.readFileSync(path.join(extDir, "sidepanel.html"), "utf8");
  assert.match(html, /role="status"/);
  assert.match(html, /aria-label="Reply type"/);
});

test("copy buttons are keyboard-focusable", () => {
  const src = fs.readFileSync(path.join(extDir, "sidepanel.js"), "utf8");
  assert.match(src, /copyBtn\.type = "button"/);
});
