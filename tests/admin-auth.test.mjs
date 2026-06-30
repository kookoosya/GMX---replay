/**
 * Admin password login — behavioral contract (no real secrets in source).
 */
import test from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import { freePort, spawnTestServer, freshSmokeHandle } from "../tools/tests/_helpers.mjs";
import { initSession } from "./lib/referral-test-helpers.mjs";

const ADMIN_HANDLE = "@Kristofer_Sol_";
const OLD_PW = `old-${crypto.randomBytes(8).toString("hex")}`;
const NEW_PW = `new-${crypto.randomBytes(8).toString("hex")}`;

async function adminLogin(base, token, password) {
  const res = await fetch(`${base}/api/admin/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ password }),
  });
  const text = await res.text();
  let body = {};
  try {
    body = JSON.parse(text);
  } catch {}
  return { status: res.status, body, text };
}

async function spawnAdminServer(port, adminPassword) {
  const prev = process.env.ADMIN_PASSWORD;
  process.env.ADMIN_PASSWORD = adminPassword;
  try {
    return await spawnTestServer(port);
  } finally {
    if (prev === undefined) delete process.env.ADMIN_PASSWORD;
    else process.env.ADMIN_PASSWORD = prev;
  }
}

test("admin login: correct password returns session token without leaking password", async () => {
  const port = await freePort();
  const { child, base } = await spawnAdminServer(port, OLD_PW);
  try {
    const sess = await initSession(base, ADMIN_HANDLE);
    assert.equal(sess.status, 200);
    const login = await adminLogin(base, sess.body.token, OLD_PW);
    assert.equal(login.status, 200);
    assert.ok(login.body.adminToken);
    assert.ok(login.body.expiresAt);
    assert.equal(login.body.ok, true);
    assert.ok(!login.text.includes(OLD_PW));
    assert.ok(!JSON.stringify(login.body).includes(OLD_PW));
  } finally {
    child.kill("SIGTERM");
  }
});

test("admin login: wrong password returns 401 without leaking expected password", async () => {
  const port = await freePort();
  const { child, base } = await spawnAdminServer(port, OLD_PW);
  try {
    const sess = await initSession(base, ADMIN_HANDLE);
    const login = await adminLogin(base, sess.body.token, "definitely-wrong-password");
    assert.equal(login.status, 401);
    assert.equal(login.body.error, "unauthorized");
    assert.ok(!login.text.includes(OLD_PW));
  } finally {
    child.kill("SIGTERM");
  }
});

test("admin login: non-admin handle returns 403", async () => {
  const port = await freePort();
  const { child, base } = await spawnAdminServer(port, OLD_PW);
  try {
    await initSession(base, ADMIN_HANDLE);
    const sess = await initSession(base, freshSmokeHandle("na"));
    const login = await adminLogin(base, sess.body.token, OLD_PW);
    assert.equal(login.status, 403);
    assert.equal(login.body.error, "forbidden");
  } finally {
    child.kill("SIGTERM");
  }
});

test("admin login: missing ADMIN_PASSWORD in production returns 500", async () => {
  const port = await freePort();
  const { child, base } = await spawnTestServer(port, {
    ADMIN_PASSWORD: "",
    NODE_ENV: "production",
    RENDER: "1",
  });
  try {
    const sess = await initSession(base, ADMIN_HANDLE);
    const login = await adminLogin(base, sess.body.token, "any-password");
    assert.equal(login.status, 500);
    assert.equal(login.body.hint, "admin_password_not_configured");
  } finally {
    child.kill("SIGTERM");
  }
});

test("admin login: old password rejected after rotation env change", async () => {
  const port = await freePort();
  const { child, base } = await spawnAdminServer(port, NEW_PW);
  try {
    const sess = await initSession(base, ADMIN_HANDLE);
    const oldAttempt = await adminLogin(base, sess.body.token, OLD_PW);
    assert.equal(oldAttempt.status, 401);
    const newAttempt = await adminLogin(base, sess.body.token, NEW_PW);
    assert.equal(newAttempt.status, 200);
    assert.ok(newAttempt.body.adminToken);
  } finally {
    child.kill("SIGTERM");
  }
});

test("admin login: rate limiter is configured on route", async () => {
  const src = await import("node:fs/promises").then((fs) =>
    fs.readFile(new URL("../server/routes/admin-auth.mjs", import.meta.url), "utf8")
  );
  assert.match(src, /adminLoginLimiter/);
  assert.match(src, /max:\s*10/);
});
