#!/usr/bin/env node
/**
 * Live API contract tests (spawns local server on a free port).
 */
import { readFileSync } from "node:fs";
import { fail, ok, freshSmokeHandle, freePort, spawnTestServer } from "./_helpers.mjs";

const VALID_STYLES = [
  "classic", "classy", "emoji", "noemoji", "minimal", "meme",
  "degen", "alpha", "cheer", "calm", "builder", "focus",
];

const genRoute = readFileSync("server/routes/generate.mjs", "utf8");
for (const style of VALID_STYLES) {
  if (!genRoute.includes(`"${style}"`)) fail(`generate.mjs missing style "${style}"`);
}
ok("generate.mjs lists all 12 styles");

const port = Number(process.env.SMOKE_PORT || 0) || await freePort();
const { child, base } = await spawnTestServer(port);

try {
  const handle = freshSmokeHandle();
  const init = await fetch(`${base}/api/user/init`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ handle }),
  });
  const j = await init.json();
  if (!j.ok || !j.token) fail(`init failed: ${JSON.stringify(j)}`);
  const auth = { Authorization: `Bearer ${j.token}` };
  ok(`user/init (${handle})`);

  const usageViaCookie = await fetch(`${base}/api/usage`, {
    headers: { Cookie: `gmx_token=${encodeURIComponent(j.token)}` },
  });
  const usageViaCookieBody = await usageViaCookie.json();
  if (!usageViaCookie.ok || usageViaCookieBody.authenticated !== true) {
    fail(`usage cookie auth => ${usageViaCookie.status} ${JSON.stringify(usageViaCookieBody)}`);
  }
  ok("usage cookie auth fallback");

  function getSetCookies(res) {
    if (typeof res.headers.getSetCookie === "function") {
      return res.headers.getSetCookie();
    }
    const raw = res.headers.get("set-cookie");
    return raw ? [raw] : [];
  }

  const AUTH_COOKIE_NAMES = [
    "gmx_token",
    "gmx_session",
    "gmxToken",
    "gmxSession",
    "access_token",
    "token",
  ];

  function assertLogoutTombstones(setCookies) {
    if (!setCookies.length) fail("logout response missing Set-Cookie tombstones");
    for (const name of AUTH_COOKIE_NAMES) {
      const hit = setCookies.some((c) => c.startsWith(`${name}=`) || c.includes(`${name}=;`));
      if (!hit) fail(`logout tombstone missing cookie name ${name}`);
    }
    for (const c of setCookies) {
      if (!c.includes("Max-Age=0")) fail(`logout tombstone missing Max-Age=0: ${c}`);
      if (!/Expires=Thu, 01 Jan 1970/i.test(c)) fail(`logout tombstone missing past Expires: ${c}`);
      if (!c.includes("HttpOnly")) fail(`logout tombstone missing HttpOnly: ${c}`);
      if (!c.includes("SameSite=Lax")) fail(`logout tombstone missing SameSite=Lax: ${c}`);
      if (!c.includes("Path=/")) fail(`logout tombstone missing Path=/: ${c}`);
    }
  }

  async function expectLogoutOk(res) {
    const body = await res.json();
    if (!res.ok || body.ok !== true) fail(`logout failed: ${res.status} ${JSON.stringify(body)}`);
    assertLogoutTombstones(getSetCookies(res));
  }

  const logoutWithCookie = await fetch(`${base}/api/user/logout`, {
    method: "POST",
    headers: { Cookie: `gmx_token=${encodeURIComponent(j.token)}` },
  });
  await expectLogoutOk(logoutWithCookie);
  ok("user/logout with cookie");

  const logoutNoCookie = await fetch(`${base}/api/user/logout`, { method: "POST" });
  await expectLogoutOk(logoutNoCookie);
  ok("user/logout without cookie");

  const logoutBadCookie = await fetch(`${base}/api/user/logout`, {
    method: "POST",
    headers: { Cookie: "gmx_token=invalid-token-value" },
  });
  await expectLogoutOk(logoutBadCookie);
  ok("user/logout with invalid cookie");

  for (const style of VALID_STYLES) {
    const q = `kind=gm&mode=mid&lang=en&style=${style}`;
    const r = await fetch(`${base}/api/generate?${q}`, { headers: auth });
    const body = await r.json();
    if (!body.ok || !String(body.reply || "").trim()) {
      fail(`/api/generate?${q} => ${JSON.stringify(body)}`);
    }
  }
  ok(`generate all ${VALID_STYLES.length} styles`);

  for (const mode of ["min", "mid", "max"]) {
    const q = `kind=gn&mode=${mode}&lang=en&style=calm`;
    const r = await fetch(`${base}/api/generate?${q}`, { headers: auth });
    const body = await r.json();
    if (!body.ok || !String(body.reply || "").trim()) {
      fail(`/api/generate gn mode=${mode} => ${JSON.stringify(body)}`);
    }
  }
  ok("generate gn modes min/mid/max");

  const bulk = await fetch(
    `${base}/api/generate-bulk?kind=gm&mode=mid&lang=en&style=classic&count=3&anti_last_n=5`,
    { headers: auth }
  );
  const bulkBody = await bulk.json();
  if (!bulkBody.ok || !Array.isArray(bulkBody.list) || bulkBody.list.length < 1) {
    fail(`generate-bulk => ${JSON.stringify(bulkBody)}`);
  }
  ok("generate-bulk");

  const tx = await fetch(`${base}/api/billing/tx-context`, { headers: auth });
  if (tx.status === 404) fail("/api/billing/tx-context returned 404");
  const txBody = await tx.json();
  if (!txBody.ok || !txBody.blockhash) {
    fail(`/api/billing/tx-context => ${JSON.stringify(txBody)}`);
  }
  ok("billing/tx-context");

  const nf = await fetch(`${base}/api/not-a-real-route`);
  if (nf.status !== 404) fail(`unknown route status ${nf.status}`);
  ok("api 404 for unknown route");

  console.log("API_CONTRACT_OK");
} catch (e) {
  fail(e?.message || String(e));
} finally {
  child.kill("SIGTERM");
  setTimeout(() => child.kill("SIGKILL"), 500).unref();
}
