/**
 * Retired blog routes — deterministic redirects, no loops.
 */
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { freePort, spawnTestServer } from "../tools/tests/_helpers.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("blog routes redirect to /app with 301", async () => {
  const port = await freePort();
  const { child, base } = await spawnTestServer(port);
  try {
    for (const route of ["/blog", "/blog/old-post", "/blog.html"]) {
      const res = await fetch(`${base}${route}`, { redirect: "manual" });
      assert.equal(res.status, 301, route);
      assert.match(String(res.headers.get("location") || ""), /\/app$/);
    }
  } finally {
    child.kill("SIGTERM");
  }
});

test("blog slug redirect does not loop", async () => {
  const port = await freePort();
  const { child, base } = await spawnTestServer(port);
  try {
    const res = await fetch(`${base}/blog/%2e%2e%2fetc%2fpasswd`, { redirect: "manual" });
    assert.equal(res.status, 301);
    const loc = String(res.headers.get("location") || "");
    assert.match(loc, /\/app$/);
    assert.doesNotMatch(loc, /\/blog/);
  } finally {
    child.kill("SIGTERM");
  }
});

test("admin faq retired endpoint returns deterministic 410", () => {
  const src = fs.readFileSync(path.join(root, "server", "routes", "admin.mjs"), "utf8");
  assert.match(src, /app\.get\("\/api\/admin\/faq"/);
  assert.match(src, /status\(410\)/);
  assert.match(src, /admin_faq_retired/);
});

test("landing and app shell do not expose blog teaser routes", () => {
  const index = fs.readFileSync(path.join(root, "public", "index.html"), "utf8");
  const app = fs.readFileSync(path.join(root, "public", "app.html"), "utf8");
  assert.doesNotMatch(index, /href="\/blog/);
  assert.doesNotMatch(app, /blog_home_teaser/);
});
