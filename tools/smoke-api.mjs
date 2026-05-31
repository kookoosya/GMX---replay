#!/usr/bin/env node
/** Quick API smoke: init user + generate with multiple styles. */
import { spawn } from "node:child_process";

const PORT = Number(process.env.SMOKE_PORT || 10099);
const BASE = `http://127.0.0.1:${PORT}`;

function fail(msg) {
  console.error(`SMOKE_API_FAIL: ${msg}`);
  process.exit(1);
}

async function waitHealth(ms = 12000) {
  const start = Date.now();
  while (Date.now() - start < ms) {
    try {
      const r = await fetch(`${BASE}/api/health`);
      if (r.ok) return;
    } catch {}
    await new Promise((r) => setTimeout(r, 200));
  }
  fail("server did not become healthy");
}

const child = spawn(process.execPath, ["index.js"], {
  cwd: process.cwd(),
  env: { ...process.env, PORT: String(PORT) },
  stdio: ["ignore", "pipe", "pipe"],
});

let stderr = "";
child.stderr.on("data", (d) => {
  stderr += String(d);
});

try {
  await waitHealth();
  const handle = `@smoke_api_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const init = await fetch(`${BASE}/api/user/init`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ handle }),
  });
  const j = await init.json();
  if (!j.ok || !j.token) fail(`init failed: ${JSON.stringify(j)}`);
  const auth = { Authorization: `Bearer ${j.token}` };

  for (const q of [
    "kind=gm&mode=mid&lang=en&style=classic",
    "kind=gm&mode=min&lang=en&style=minimal",
    "kind=gm&mode=mid&lang=en&style=degen",
    "kind=gn&mode=max&lang=en&style=calm",
  ]) {
    const r = await fetch(`${BASE}/api/generate?${q}`, { headers: auth });
    const body = await r.json();
    if (!body.ok || !String(body.reply || "").trim()) {
      fail(`/api/generate?${q} => ${JSON.stringify(body)}`);
    }
  }

  const nf = await fetch(`${BASE}/api/not-a-real-route`);
  if (nf.status !== 404) fail(`expected 404 for unknown route, got ${nf.status}`);

  const gen404 = await fetch(`${BASE}/api/generate?kind=gm`, { headers: auth });
  if (!gen404.ok && gen404.status === 404) fail("generate returned 404");

  console.log("SMOKE_API_OK");
} catch (e) {
  fail(e?.message || String(e));
} finally {
  child.kill("SIGTERM");
  setTimeout(() => child.kill("SIGKILL"), 500).unref();
  if (stderr.includes("Error")) {
    // non-fatal unless exit code bad
  }
}
