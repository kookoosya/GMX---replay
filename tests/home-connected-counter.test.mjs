import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  dayStartUtcIso,
  formatConnectedTodayCopy,
  shouldShowConnectedToday,
} from "../tools/lib/home-stats-core.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("home tab exposes connected-today counter shell", () => {
  const html = fs.readFileSync(path.join(root, "public", "app.html"), "utf8");
  for (const id of ["home_connected_wrap", "home_connected_counter"]) {
    assert.match(html, new RegExp(`id="${id}"`));
  }
});

test("public stats route counts users seen today", () => {
  const src = fs.readFileSync(path.join(root, "server", "routes", "public.mjs"), "utf8");
  assert.match(src, /\/api\/public\/stats/);
  assert.match(src, /connectedToday/);
  assert.match(src, /countConnectedToday/);
});

test("home stats module fetches public stats endpoint", () => {
  const src = fs.readFileSync(path.join(root, "public", "app.homestats.js"), "utf8");
  assert.match(src, /\/api\/public\/stats/);
  assert.match(src, /h_connected_today/);
  assert.match(src, /bindHomeStats/);
});

test("siteboot wires home stats on init", () => {
  const src = fs.readFileSync(path.join(root, "public", "app.siteboot.js"), "utf8");
  assert.match(src, /__GMXHomeStatsFactory/);
  assert.match(src, /bindHomeStats/);
});

test("home connected counter css", () => {
  const css = fs.readFileSync(path.join(root, "public", "app.css"), "utf8");
  assert.match(css, /\.homeConnectedToday/);
  assert.match(css, /\.homeConnectedDot/);
});

test("home stats core helpers", () => {
  assert.equal(dayStartUtcIso("2026-06-17"), "2026-06-17T00:00:00.000Z");
  assert.equal(
    formatConnectedTodayCopy("{n} people connected today", 42),
    "42 people connected today"
  );
  assert.equal(shouldShowConnectedToday({ ok: true, connectedToday: 3 }), true);
  assert.equal(shouldShowConnectedToday({ ok: true, connectedToday: 0 }), false);
});

test("en locale defines connected-today copy", () => {
  const en = JSON.parse(fs.readFileSync(path.join(root, "shared", "i18n", "locales", "en.json"), "utf8"));
  assert.match(en.h_connected_today, /\{n\}/);
});

test("boot chunk manifest includes home stats module", () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(root, "tools", "app-chunk-manifest.json"), "utf8"));
  const boot = manifest.chunks.find((c) => c.out === "chunks/app.shell.boot.js");
  assert.ok(boot?.files?.includes("app.homestats.js"));
});
