#!/usr/bin/env node
/**
 * Post-deploy verification against production (or PROD_BASE URL).
 * Run: npm run verify:prod
 */
import { execSync } from "node:child_process";
import { fail, ok, freshSmokeHandle } from "./tests/_helpers.mjs";

const BASE = String(process.env.PROD_BASE || "https://www.gmxreply.com").replace(/\/$/, "");

async function get(path, opts = {}) {
  const r = await fetch(`${BASE}${path}`, opts);
  const text = await r.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {}
  return { status: r.status, text, json };
}

console.log(`Prod verify: ${BASE}\n`);

const health = await get("/api/health");
if (!health.json?.ok) fail(`health: ${health.text.slice(0, 200)}`);
const prodBuild = String(health.json.build || "");
ok(`health build=${prodBuild.slice(0, 8)}`);

try {
  const localHead = execSync("git rev-parse HEAD", {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
  }).trim();
  const localShort = localHead.slice(0, 8);
  const prodShort = prodBuild.slice(0, 8);
  if (localShort && prodShort && localShort !== prodShort) {
    fail(
      `Render prod build ${prodShort} != local HEAD ${localShort} — wait for Render deploy or push main`
    );
  }
  if (localShort) ok(`prod commit matches local ${localShort}`);
} catch {
  ok("prod commit check skipped (not a git checkout)");
}

const appJs = await get("/app.js");
if (appJs.status !== 200) fail(`app.js status ${appJs.status}`);
const js = appJs.text;
for (const needle of [
  "__GMXBootstrapCoreWireFactory",
  "__GMXBootstrapUnlockWireFactory",
  "__GMXBootstrapGenWireFactory",
  "__GMXBootstrapUsageWireFactory",
  "__GMXBootstrapUiWireFactory",
  "setWallpaperLayerImage",
  "readGenParams",
]) {
  if (!js.includes(needle)) fail(`app.js missing ${needle}`);
}
ok("app.js client invariants");

const genParamsJs = await get("/app.genparams.js");
if (genParamsJs.status !== 200) fail(`app.genparams.js status ${genParamsJs.status}`);
if (!genParamsJs.text.includes("antiWindow(strength)")) {
  fail("app.genparams.js missing antiWindow(strength)");
}
ok("app.genparams anti-window invariant");

const css = await get("/app.css");
if (!css.text.includes("gmxWallLayer") || !css.text.includes("object-fit:cover")) {
  fail("app.css missing wallpaper cover layer");
}
ok("app.css wallpapers");

const handle = freshSmokeHandle("p");
const init = await get("/api/user/init", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ handle }),
});
if (!init.json?.ok || !init.json?.token) fail(`init: ${init.text.slice(0, 200)}`);
const auth = { Authorization: `Bearer ${init.json.token}` };
ok(`api init ${handle}`);

const styles = ["classic", "minimal", "degen", "calm", "builder", "focus"];
for (const style of styles) {
  const gen = await get(`/api/generate?kind=gm&mode=mid&lang=en&style=${style}`, { headers: auth });
  if (!gen.json?.ok || !String(gen.json.reply || "").trim()) {
    fail(`generate style=${style}: ${gen.text.slice(0, 120)}`);
  }
}
ok(`generate ${styles.length} styles`);

const tx = await get("/api/billing/tx-context", { headers: auth });
if (tx.status === 404 || !tx.json?.blockhash) fail(`tx-context: ${tx.text.slice(0, 120)}`);
ok("billing tx-context");

const nf = await get("/api/not-a-real-route");
if (nf.status !== 404) fail(`expected 404, got ${nf.status}`);
ok("api 404");

const appPage = await get("/app");
if (appPage.status !== 200 || !appPage.text.includes("gmRand1")) {
  fail("/app shell missing gmRand1");
}
ok("/app HTML shell");

console.log("\nPROD_VERIFY_OK");
