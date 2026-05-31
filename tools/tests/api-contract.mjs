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
