#!/usr/bin/env node
/**
 * Verify admin password rotation (old rejected, new accepted). Never logs passwords.
 *
 * Env:
 *   GMX_ADMIN_NEW_PASSWORD — required
 *   GMX_ADMIN_OLD_PASSWORD — optional (skips old-credential check if unset)
 *   PROD_BASE — default https://www.gmxreply.com
 *   ADMIN_HANDLE — default @Kristofer_Sol_
 */
import { freshSmokeHandle } from "./tests/_helpers.mjs";

const BASE = String(process.env.PROD_BASE || "https://www.gmxreply.com").replace(/\/$/, "");
const ADMIN_HANDLE = String(process.env.ADMIN_HANDLE || "@Kristofer_Sol_").trim();
const NEW_PW = String(process.env.GMX_ADMIN_NEW_PASSWORD || "").trim();
const OLD_PW = String(process.env.GMX_ADMIN_OLD_PASSWORD || "").trim();

function fail(msg) {
  console.error(`VERIFY_FAIL: ${msg}`);
  process.exit(1);
}

function ok(msg) {
  console.log(`  ok ${msg}`);
}

function leakCheck(text, secrets) {
  for (const s of secrets) {
    if (s && text.includes(s)) fail("password appeared in response body");
  }
}

async function initAdminToken(base) {
  const res = await fetch(`${base}/api/user/init`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ handle: ADMIN_HANDLE }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok || !body?.token) fail(`init admin handle failed: ${res.status}`);
  return body.token;
}

async function tryLogin(base, userToken, password) {
  const res = await fetch(`${base}/api/admin/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${userToken}`,
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

async function main() {
  if (!NEW_PW) fail("GMX_ADMIN_NEW_PASSWORD is not set");

  console.log(`Admin rotation verify: ${BASE}\n`);
  const userToken = await initAdminToken(BASE);
  ok(`admin handle session @${ADMIN_HANDLE.replace(/^@+/, "")}`);

  if (OLD_PW) {
    const oldTry = await tryLogin(BASE, userToken, OLD_PW);
    leakCheck(oldTry.text, [OLD_PW, NEW_PW]);
    if (oldTry.status === 200) fail("old password still accepted");
    ok(`old credential rejected (${oldTry.status})`);
  } else {
    console.log("  skip old credential check (GMX_ADMIN_OLD_PASSWORD not set)");
  }

  const wrong = await tryLogin(BASE, userToken, `wrong-${freshSmokeHandle("x").slice(1)}`);
  leakCheck(wrong.text, [OLD_PW, NEW_PW]);
  if (wrong.status !== 401) fail(`wrong password expected 401 got ${wrong.status}`);
  ok("wrong password returns 401");

  const neu = await tryLogin(BASE, userToken, NEW_PW);
  leakCheck(neu.text, [OLD_PW, NEW_PW]);
  if (neu.status !== 200 || !neu.body?.adminToken) {
    fail(`new password not accepted (status ${neu.status})`);
  }
  ok("new credential accepted");

  const nonAdmin = await fetch(`${BASE}/api/user/init`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ handle: freshSmokeHandle("na") }),
  }).then((r) => r.json());
  const forbidden = await tryLogin(BASE, nonAdmin.token, NEW_PW);
  if (forbidden.status !== 403) fail(`non-admin expected 403 got ${forbidden.status}`);
  ok("non-admin handle forbidden");

  console.log("\nADMIN_ROTATION_VERIFY_OK");
}

main().catch((e) => fail(e?.message || String(e)));
