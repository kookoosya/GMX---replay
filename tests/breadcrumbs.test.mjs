import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  BREADCRUMB_TAB_LABEL_KEYS,
  breadcrumbSectionKey,
  shouldShowBreadcrumb,
} from "../tools/lib/breadcrumb-core.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("app shell exposes breadcrumb nav", () => {
  const html = fs.readFileSync(path.join(root, "public", "app.html"), "utf8");
  for (const id of ["app_breadcrumbs", "app_breadcrumb_home", "app_breadcrumb_current"]) {
    assert.match(html, new RegExp(`id="${id}"`));
  }
  assert.match(html, /appBreadcrumbList/);
});

test("breadcrumbs module applies labels and home navigation", () => {
  const src = fs.readFileSync(path.join(root, "public", "app.breadcrumbs.js"), "utf8");
  assert.match(src, /applyBreadcrumbs/);
  assert.match(src, /bindBreadcrumbs/);
  assert.match(src, /switchTab\("home"\)/);
  assert.match(src, /t_home/);
});

test("siteboot and nav wire breadcrumbs", () => {
  assert.match(fs.readFileSync(path.join(root, "public", "app.siteboot.js"), "utf8"), /__GMXBreadcrumbsFactory/);
  assert.match(fs.readFileSync(path.join(root, "public", "app.bootstrapuiwire.js"), "utf8"), /__GMXBreadcrumbsFactory/);
});

test("breadcrumb css", () => {
  const css = fs.readFileSync(path.join(root, "public", "app.css"), "utf8");
  assert.match(css, /\.appBreadcrumbs/);
  assert.match(css, /\.appBreadcrumbCurrent/);
});

test("breadcrumb core maps tabs to label keys", () => {
  assert.equal(breadcrumbSectionKey("gm"), BREADCRUMB_TAB_LABEL_KEYS.gm);
  assert.equal(shouldShowBreadcrumb("home"), false);
  assert.equal(shouldShowBreadcrumb("wallet"), true);
});

test("bootstrap chunk includes breadcrumbs module", () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(root, "tools", "app-chunk-manifest.json"), "utf8"));
  const boot = manifest.chunks.find((c) => c.out === "chunks/app.shell.bootstrap.js");
  assert.ok(boot?.files?.includes("app.breadcrumbs.js"));
});

test("en locale defines breadcrumb aria label", () => {
  const en = JSON.parse(fs.readFileSync(path.join(root, "shared", "i18n", "locales", "en.json"), "utf8"));
  assert.ok(en.ui_breadcrumb_nav_label);
});
