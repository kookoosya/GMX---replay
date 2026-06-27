import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const indexPath = path.join(root, "public", "index.html");
const staticPath = path.join(root, "server", "routes", "static.mjs");

const FORBIDDEN = [
  "Install ID",
  "Language mode (placeholder)",
  "Debug",
  "UI placeholder",
  'id="redeemCode"',
  'data-tab="admin"',
  "Connect once, no logout",
];

test("public/index.html exists as canonical landing source", () => {
  assert.ok(fs.existsSync(indexPath), "public/index.html missing");
});

test("static route serves landing at / instead of redirect-only", () => {
  const src = fs.readFileSync(staticPath, "utf8");
  assert.match(src, /INDEX_HTML/);
  assert.match(src, /sendFile\(INDEX_HTML\)/);
  assert.match(src, /app\.get\("\/",/);
});

test("index.html has SEO, single h1, and primary CTA to /app", () => {
  const html = fs.readFileSync(indexPath, "utf8");
  assert.match(html, /<h1[^>]*>/);
  assert.equal((html.match(/<h1/g) || []).length, 1);
  assert.match(html, /name="description"/);
  assert.match(html, /rel="canonical"/);
  assert.match(html, /property="og:title"/);
  assert.match(html, /property="og:description"/);
  assert.match(html, /property="og:image"/);
  assert.match(html, /assets\/og\/gmx-share\.svg/);
  assert.match(html, /id="home_cta_primary"[^>]*href="\/app"/);
  assert.match(html, /<header/);
  assert.match(html, /<main/);
  assert.match(html, /<footer/);
});

test("index.html excludes legacy debug/admin/test blocks", () => {
  const html = fs.readFileSync(indexPath, "utf8");
  for (const needle of FORBIDDEN) {
    assert.doesNotMatch(html, new RegExp(needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"));
  }
  assert.doesNotMatch(html, /\/app\.js/);
  assert.doesNotMatch(html, /id="tab-home"/);
});

test("home.css and home.js are linked from index.html", () => {
  const html = fs.readFileSync(indexPath, "utf8");
  assert.match(html, /href="\/home\.css"/);
  assert.match(html, /src="\/home\.js"/);
  assert.ok(fs.existsSync(path.join(root, "public", "home.css")));
  assert.ok(fs.existsSync(path.join(root, "public", "home.js")));
});
