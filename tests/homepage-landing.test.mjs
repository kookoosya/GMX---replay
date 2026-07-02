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

const QUOTA_FORBIDDEN = [
  /\bdaily limits?\b/i,
  /\b70\s*credits?\b/i,
  /\b50\s*credits?\s*(?:per\s*)?day\b/i,
  /\b50\s*GM\s*\+\s*50\s*GN\b/i,
  /\bdaily reset\b/i,
];

test("landing forbids misleading generation quota copy", () => {
  const html = fs.readFileSync(indexPath, "utf8");
  for (const rx of QUOTA_FORBIDDEN) {
    assert.doesNotMatch(html, rx, `forbidden quota copy: ${rx}`);
  }
});

test("landing states honest lifetime shared generation credits", () => {
  const html = fs.readFileSync(indexPath, "utf8");
  assert.match(html, /lifetime generation credits/i);
  assert.match(html, /GM.{0,24}GN.{0,24}share/i);
});

test("landing CTAs and footer links use live routes only", () => {
  const html = fs.readFileSync(indexPath, "utf8");
  const hrefs = [...html.matchAll(/<a\b[^>]*\bhref="([^"#][^"]*)"/gi)].map((m) => m[1]);
  const allowedPrefix = ["/app", "/get-extension", "/arcade.html", "https://www.gmxreply.com/"];
  const allowedExact = new Set(["/"]);
  for (const href of hrefs) {
    const ok =
      allowedExact.has(href) ||
      allowedPrefix.some((p) => href === p || href.startsWith(p));
    assert.ok(ok, `unexpected landing href: ${href}`);
  }
  assert.ok(hrefs.filter((h) => h === "/app").length >= 2, "expected multiple /app CTAs");
});
