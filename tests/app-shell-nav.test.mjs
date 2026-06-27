import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("app shell uses nav landmark for desktop tabs", () => {
  const html = fs.readFileSync(path.join(root, "public", "app.html"), "utf8");
  assert.match(html, /<nav class="tabs appShellNav"/);
  assert.match(html, /id="app_shell_nav"/);
  assert.match(html, /aria-label="App sections"/);
});

test("mobile more sheet exposes aria contract", () => {
  const html = fs.readFileSync(path.join(root, "public", "app.html"), "utf8");
  assert.match(html, /id="mnav_more"[^>]*aria-expanded="false"/);
  assert.match(html, /aria-controls="mobileMoreSheet"/);
  assert.match(html, /id="mobileMoreSheet"[^>]*aria-hidden="true"/);
});

test("mobilenav handles scroll lock and Escape", () => {
  const src = fs.readFileSync(path.join(root, "public", "app.mobilenav.js"), "utf8");
  assert.match(src, /appShellScrollLock/);
  assert.match(src, /ev\.key !== "Escape"/);
  assert.match(src, /setMoreExpanded/);
});

test("nav showTab sets inert on hidden panels", () => {
  const src = fs.readFileSync(path.join(root, "public", "app.nav.js"), "utf8");
  assert.match(src, /setAttribute\("inert"/);
  assert.match(src, /aria-current/);
});

test("app css defines desktop sidebar grid and scroll lock", () => {
  const css = fs.readFileSync(path.join(root, "public", "app.css"), "utf8");
  assert.match(css, /body\.appShellScrollLock/);
  assert.match(css, /grid-template-columns: minmax\(204px, 236px\)/);
  assert.match(css, /\.appShellNav/);
});
