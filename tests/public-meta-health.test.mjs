/**
 * Public meta/ops endpoints — contract, secrets, cache semantics.
 */
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { freePort, spawnTestServer, freshSmokeHandle } from "../tools/tests/_helpers.mjs";
import { initSession } from "./lib/referral-test-helpers.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const FORBIDDEN_PUBLIC_PATTERNS = [
  /ADMIN_PASSWORD/i,
  /ADMIN_SECRET/i,
  /SUPABASE_SERVICE_ROLE/i,
  /gmx_token=/i,
  /BEGIN STACK/i,
  /node_modules/i,
  /\.sqlite/i,
];

function assertNoSecrets(text) {
  for (const pattern of FORBIDDEN_PUBLIC_PATTERNS) {
    assert.doesNotMatch(text, pattern);
  }
}

test("public meta: health version config and status respond without secrets", async () => {
  const port = await freePort();
  const { child, base } = await spawnTestServer(port);
  try {
    const health = await fetch(`${base}/api/health`);
    const healthBody = await health.json();
    assert.equal(health.status, 200);
    assert.equal(healthBody.ok, true);
    assert.ok(healthBody.build);
    assertNoSecrets(JSON.stringify(healthBody));

    const version = await fetch(`${base}/api/version`);
    const versionBody = await version.json();
    assert.equal(version.status, 200);
    assert.equal(versionBody.ok, true);
    assert.equal(versionBody.build, healthBody.build);
    assertNoSecrets(JSON.stringify(versionBody));

    const config = await fetch(`${base}/api/config`);
    const configBody = await config.json();
    assert.equal(config.status, 200);
    assert.equal(configBody.ok, true);
    assert.ok(configBody.plans);
    assert.ok(configBody.billing?.tokens);
    assertNoSecrets(JSON.stringify(configBody));

    const status = await fetch(`${base}/status`, { headers: { Accept: "application/json" } });
    const statusBody = await status.json();
    assert.equal(status.status, 200);
    assert.equal(statusBody.ok, true);
    assert.equal(statusBody.build, healthBody.build);
    assertNoSecrets(JSON.stringify(statusBody));
  } finally {
    child.kill("SIGTERM");
  }
});

test("public meta: status supports html contract", async () => {
  const port = await freePort();
  const { child, base } = await spawnTestServer(port);
  try {
    const res = await fetch(`${base}/status`, { headers: { Accept: "text/html" } });
    const text = await res.text();
    assert.equal(res.status, 200);
    assert.match(text, /GMXReply status/i);
    assert.match(text, /Build:/i);
    assertNoSecrets(text);
  } finally {
    child.kill("SIGTERM");
  }
});

test("public meta: features route is admin-only internal contract", async () => {
  const port = await freePort();
  const { child, base } = await spawnTestServer(port);
  try {
    await initSession(base, freshSmokeHandle("z"));
    const user = await initSession(base, freshSmokeHandle("fm"));
    const anon = await fetch(`${base}/api/features`);
    assert.equal(anon.status, 401);

    const userRes = await fetch(`${base}/api/features`, {
      headers: { Authorization: `Bearer ${user.body.token}` },
    });
    const userBody = await userRes.json();
    assert.equal(userRes.status, 403);
    assert.equal(userBody.error, "forbidden");
  } finally {
    child.kill("SIGTERM");
  }
});

test("public meta route map is registered in static audit", () => {
  const src = fs.readFileSync(path.join(root, "tools", "tests", "routes-static.mjs"), "utf8");
  assert.match(src, /meta\.mjs/);
  assert.match(src, /\/api\/health/);
  assert.match(src, /\/api\/version/);
  assert.match(src, /\/api\/config/);
});
