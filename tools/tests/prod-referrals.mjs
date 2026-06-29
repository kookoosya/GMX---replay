#!/usr/bin/env node
/**
 * Production-safe referral attribution verification (max 3 technical accounts).
 * Simulates reload-without-query by sending recovered ref in init body only.
 */
import { execSync } from "node:child_process";
import { fail, ok, freshSmokeHandle } from "./_helpers.mjs";
import { normalizeReferralCode } from "../lib/referral-pending-core.mjs";

const BASE = String(process.env.PROD_BASE || "https://www.gmxreply.com").replace(/\/$/, "");

async function post(path, body, headers = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(30000),
  });
  const json = await res.json().catch(() => ({}));
  return { status: res.status, json };
}

async function get(path, token) {
  const res = await fetch(`${BASE}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    signal: AbortSignal.timeout(30000),
  });
  const json = await res.json().catch(() => ({}));
  return { status: res.status, json };
}

console.log(`Prod referrals: ${BASE}\n`);

const healthRes = await fetch(`${BASE}/api/health`, { signal: AbortSignal.timeout(30000) });
const health = await healthRes.json().catch(() => ({}));
if (!health?.ok) fail(`health: ${healthRes.status}`);
const prodBuild = String(health.build || "");
ok(`health build=${prodBuild.slice(0, 8)}`);

try {
  const localHead = execSync("git rev-parse HEAD", {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
  }).trim();
  if (localHead.slice(0, 8) !== prodBuild.slice(0, 8)) {
    fail(`prod build ${prodBuild.slice(0, 8)} != local HEAD ${localHead.slice(0, 8)}`);
  }
  ok("prod SHA matches local HEAD");
} catch {
  ok("SHA check skipped");
}

const inviter = freshSmokeHandle("rinv");
const invInit = await post("/api/user/init", { handle: inviter });
if (invInit.status !== 200 || !invInit.json?.token) fail(`inviter init ${invInit.status}`);
const invToken = invInit.json.token;
const refCode = String(invInit.json.refCode || "").trim();
const refLink = String(invInit.json.refLink || "");
if (!refCode || !refLink.includes(`ref=${refCode}`)) fail("inviter ref link missing");
ok("inviter session + referral link");

const normalized = normalizeReferralCode(refCode);
if (normalized !== refCode.toLowerCase()) fail("ref code normalization mismatch");
ok("pending capture format valid");

const invitee = freshSmokeHandle("rivt");
const join = await post("/api/user/init", { handle: invitee, ref: refCode });
if (join.status !== 200 || !join.json?.token) fail(`invitee init ${join.status}`);
const inviteeToken = join.json.token;
ok("invitee init with recovered ref (no query)");

const statsBeforeDup = await get("/api/referral/stats", invToken);
const confirmed = Number(statsBeforeDup.json?.confirmedRefs ?? -1);
if (confirmed < 1) fail(`confirmedRefs expected >=1 got ${confirmed}`);
ok(`confirmedRefs=${confirmed}`);

const dup = await post(
  "/api/user/init",
  { handle: invitee, ref: refCode },
  { Authorization: `Bearer ${inviteeToken}` }
);
if (dup.status !== 200) fail(`duplicate init ${dup.status}`);
const statsAfterDup = await get("/api/referral/stats", invToken);
if (Number(statsAfterDup.json?.confirmedRefs) !== confirmed) {
  fail("duplicate init changed confirmed count");
}
ok("duplicate init idempotent");

const selfTry = await post(
  "/api/user/init",
  { handle: inviter, ref: refCode },
  { Authorization: `Bearer ${invToken}` }
);
if (selfTry.status !== 200) fail(`self init ${selfTry.status}`);
const selfStats = await get("/api/referral/stats", invToken);
if (Number(selfStats.json?.confirmedRefs) !== confirmed) fail("self-referral changed count");
ok("self-referral blocked");

const badInvitee = freshSmokeHandle("rbad");
const bad = await post("/api/user/init", { handle: badInvitee, ref: "deadbeefcafe" });
if (bad.status !== 200) fail(`invalid ref init ${bad.status}`);
ok("invalid code controlled");

const me = await get("/api/me", inviteeToken);
if (me.status !== 200 || !me.json?.ok) fail(`/api/me ${me.status}`);
const usage = await get("/api/usage", inviteeToken);
if (usage.status !== 200 || !usage.json?.ok) fail(`/api/usage ${usage.status}`);
ok("/api/me and /api/usage ok");

console.log("\nPASS prod referrals");
