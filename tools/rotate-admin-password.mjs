#!/usr/bin/env node
/**
 * Full admin password rotation: local .env + Render API + production verify.
 * Never logs plaintext passwords.
 *
 * Required: GMX_ADMIN_NEW_PASSWORD
 * Optional: GMX_ADMIN_OLD_PASSWORD (auto-read from .env ADMIN_PASSWORD before rotate)
 * Optional: RENDER_API_KEY, RENDER_SERVICE_ID (from .env or env; enables Render update)
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const envPath = path.join(root, ".env");
const PROD_BASE = String(process.env.PROD_BASE || "https://www.gmxreply.com").replace(/\/$/, "");
const SERVICE_NAME = String(process.env.RENDER_SERVICE_NAME || "gmxreply").trim();
const ADMIN_HANDLE = String(process.env.ADMIN_HANDLE || "@Kristofer_Sol_").trim();

dotenv.config({ path: envPath });

function fail(msg, code = 1) {
  console.error(`ROTATE_FAIL: ${msg}`);
  process.exit(code);
}

function ok(msg) {
  console.log(`  ok ${msg}`);
}

function escapeEnvValue(value) {
  const s = String(value);
  if (/^[A-Za-z0-9._-]+$/.test(s)) return s;
  return `"${s.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

function readEnvValue(key) {
  if (process.env[key]) return String(process.env[key]).trim();
  if (!fs.existsSync(envPath)) return "";
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (!m || m[1] !== key) continue;
    let v = m[2].trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    return v;
  }
  return "";
}

const newPassword = String(process.env.GMX_ADMIN_NEW_PASSWORD || "").trim();
if (!newPassword) fail("GMX_ADMIN_NEW_PASSWORD is not set");
if (newPassword.length < 8) fail("GMX_ADMIN_NEW_PASSWORD must be at least 8 characters");

const oldPassword = String(process.env.GMX_ADMIN_OLD_PASSWORD || readEnvValue("ADMIN_PASSWORD") || "").trim();

let content = fs.existsSync(envPath) ? fs.readFileSync(envPath, "utf8") : "# GMXReply local env (never commit)\n";
const line = `ADMIN_PASSWORD=${escapeEnvValue(newPassword)}`;
content = /^ADMIN_PASSWORD=/m.test(content)
  ? content.replace(/^ADMIN_PASSWORD=.*$/m, line)
  : `${content.trimEnd()}\n${line}\n`;
fs.writeFileSync(envPath, content, { encoding: "utf8", mode: 0o600 });
ok("local .env ADMIN_PASSWORD updated");

async function renderFetch(apiKey, pathname, opts = {}) {
  const res = await fetch(`https://api.render.com/v1${pathname}`, {
    ...opts,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      ...(opts.headers || {}),
    },
  });
  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {}
  return { status: res.status, json, text };
}

async function resolveServiceId(apiKey) {
  const fromEnv = String(process.env.RENDER_SERVICE_ID || readEnvValue("RENDER_SERVICE_ID") || "").trim();
  if (fromEnv) return fromEnv;

  let cursor = "";
  for (let page = 0; page < 10; page++) {
    const q = cursor ? `?limit=100&cursor=${encodeURIComponent(cursor)}` : "?limit=100";
    const { status, json } = await renderFetch(apiKey, `/services${q}`);
    if (status !== 200 || !Array.isArray(json)) fail(`Render list services failed (${status})`);

    for (const row of json) {
      const svc = row?.service || row;
      const name = String(svc?.name || svc?.slug || "").trim();
      const id = String(svc?.id || row?.id || "").trim();
      if (name.toLowerCase() === SERVICE_NAME.toLowerCase() && id) return id;
    }

    const next = json[json.length - 1]?.cursor;
    if (!next) break;
    cursor = next;
  }
  fail(`Render service '${SERVICE_NAME}' not found`);
}

async function updateRenderPassword(apiKey, serviceId) {
  const { status, text } = await renderFetch(apiKey, `/services/${serviceId}/env-vars/ADMIN_PASSWORD`, {
    method: "PUT",
    body: JSON.stringify({ value: newPassword }),
  });
  if (status !== 200 && status !== 201) fail(`Render ADMIN_PASSWORD update failed (${status})`);
  ok("Render ADMIN_PASSWORD updated via API");
  return text;
}

async function waitForProdReady(beforeBuild) {
  const deadline = Date.now() + 10 * 60 * 1000;
  while (Date.now() < deadline) {
    try {
      const r = await fetch(`${PROD_BASE}/api/health`, { signal: AbortSignal.timeout(20000) });
      const j = await r.json();
      if (j?.ok) {
        const build = String(j.build || "");
        if (!beforeBuild || build !== beforeBuild || Date.now() > deadline - 8 * 60 * 1000) {
          ok(`production health ok build=${build.slice(0, 8)}`);
          return build;
        }
      }
    } catch {}
    await new Promise((r) => setTimeout(r, 8000));
  }
  fail("production did not become ready in time");
}

async function tryLogin(password) {
  const init = await fetch(`${PROD_BASE}/api/user/init`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ handle: ADMIN_HANDLE }),
  });
  const initBody = await init.json().catch(() => ({}));
  if (!init.ok || !initBody?.token) fail(`prod init failed (${init.status})`);

  const res = await fetch(`${PROD_BASE}/api/admin/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${initBody.token}`,
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

async function verifyProduction() {
  if (oldPassword) {
    const oldTry = await tryLogin(oldPassword);
    if (oldTry.text.includes(oldPassword) || oldTry.text.includes(newPassword)) fail("password leaked in response");
    if (oldTry.status === 200) fail("old credential still accepted on production");
    ok(`old credential rejected (${oldTry.status})`);
  }

  const wrong = await tryLogin(`wrong-${Date.now()}`);
  if (wrong.status !== 401) fail(`wrong password expected 401 got ${wrong.status}`);
  ok("wrong password returns 401");

  const neu = await tryLogin(newPassword);
  if (neu.text.includes(newPassword)) fail("password leaked in response");
  if (neu.status !== 200 || !neu.body?.adminToken) fail(`new credential not accepted (${neu.status})`);
  ok("new credential accepted on production");
}

async function main() {
  let beforeBuild = "";
  try {
    const h = await fetch(`${PROD_BASE}/api/health`);
    beforeBuild = String((await h.json())?.build || "");
  } catch {}

  const apiKey = String(process.env.RENDER_API_KEY || readEnvValue("RENDER_API_KEY") || "").trim();
  if (apiKey) {
    const serviceId = await resolveServiceId(apiKey);
    ok(`Render service id=${serviceId.slice(0, 6)}…`);
    await updateRenderPassword(apiKey, serviceId);
    console.log("RENDER: waiting for service restart after env change…");
    await waitForProdReady(beforeBuild);
  } else {
    console.log("RENDER: RENDER_API_KEY not configured — skipping API update (git auto-deploy only).");
    console.log("RENDER: set RENDER_API_KEY in .env to enable automatic secret rotation.");
  }

  await verifyProduction();
  console.log("\nADMIN_PASSWORD_ROTATED");
}

main().catch((e) => fail(e?.message || String(e)));
