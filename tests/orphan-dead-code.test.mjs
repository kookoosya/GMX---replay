/**
 * Orphan/dead code contract — classify candidates without deleting.
 */
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function read(rel) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

test("orphan: admin middleware duplicate has no runtime consumer", () => {
  const middleware = read("server/admin/middleware.mjs");
  assert.match(middleware, /createRequireAdmin/);
  const index = read("index.js");
  const adminRoutes = read("server/routes/admin.mjs");
  assert.doesNotMatch(index, /admin\/middleware/);
  assert.doesNotMatch(adminRoutes, /admin\/middleware/);
  assert.match(adminRoutes, /function requireAdmin\(/);
});

test("orphan: /api/features is active admin-internal contract", () => {
  const engagement = read("server/routes/engagement.mjs");
  assert.match(engagement, /app\.get\("\/api\/features"/);
  assert.match(engagement, /isAdminHandle/);
});

test("orphan: prediction coming soon shim remains compatibility-only", () => {
  const nav = read("public/app.nav.js");
  assert.match(nav, /ensurePredictionTabVisible/);
  assert.match(nav, /Coming soon/i);
  const html = read("public/app.html");
  assert.match(html, /id="tab-prediction"/);
});

test("orphan: cloud lists and tools preview routes are internal active APIs", () => {
  assert.match(read("server/routes/cloud.mjs"), /\/api\/cloud\/lists/);
  assert.match(read("server/routes/tools.mjs"), /\/api\/tools\/preview/);
  assert.doesNotMatch(read("public/app.js"), /\/api\/cloud\/lists/);
  assert.doesNotMatch(read("extension/sidepanel.js"), /\/api\/tools\/preview/);
});
