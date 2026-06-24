#!/usr/bin/env node
/**
 * Post-deploy verification against production (or PROD_BASE URL).
 * Run: npm run verify:prod
 */
import { execSync } from "node:child_process";
import { fail, ok, freshSmokeHandle } from "./tests/_helpers.mjs";

const BASE = String(process.env.PROD_BASE || "https://www.gmxreply.com").replace(/\/$/, "");

async function get(path, opts = {}) {
  const url = `${BASE}${path}`;
  const retries = Math.max(1, Number(process.env.PROD_VERIFY_RETRIES || 6));
  const timeoutMs = Math.max(5000, Number(process.env.PROD_VERIFY_TIMEOUT_MS || 30000));
  let lastErr = null;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const r = await fetch(url, { ...opts, signal: AbortSignal.timeout(timeoutMs) });
      const text = await r.text();
      let json = null;
      try {
        json = JSON.parse(text);
      } catch {}
      return { status: r.status, text, json };
    } catch (err) {
      lastErr = err;
      if (attempt < retries) {
        const waitMs = Math.min(20000, 4000 * attempt);
        console.log(`  retry ${attempt}/${retries - 1} in ${waitMs}ms (${path})`);
        await new Promise((resolve) => setTimeout(resolve, waitMs));
      }
    }
  }

  throw lastErr || new Error(`fetch failed: ${path}`);
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

const shellDeps = await get("/chunks/app.shell.deps.js");
if (shellDeps.status !== 200) fail(`chunks/app.shell.deps.js status ${shellDeps.status}`);
if (!shellDeps.text.includes("__GMXStorageFactory")) {
  fail("app.shell.deps chunk missing __GMXStorageFactory");
}
ok("shell deps chunk");

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

const arcadeCategoryCover = await get("/assets/arcade/covers/categories/action.webp");
if (arcadeCategoryCover.status !== 200) {
  fail(`arcade category cover status ${arcadeCategoryCover.status}`);
}
ok("arcade category covers");

const slugRes = await fetch(`${BASE}/arcade/agario`, { redirect: "manual" });
const slugLoc = String(slugRes.headers.get("location") || "");
if (slugRes.status !== 302 || !slugLoc.includes("/arcade.html?game=agario")) {
  fail(`arcade slug redirect: status=${slugRes.status} location=${slugLoc.slice(0, 120)}`);
}
ok("arcade slug redirect /arcade/agario");

const siteI18n = await get("/i18n/siteI18n.js");
if (siteI18n.status !== 200) fail(`siteI18n.js status ${siteI18n.status}`);
if (!siteI18n.text.includes("all Arcade games")) {
  fail("siteI18n.js wallet copy missing Arcade Pro mention");
}
ok("wallet i18n Arcade Pro copy");

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

const homeDemo = await get("/api/public/random-bulk?kind=gm&mode=mid&count=3");
if (homeDemo.status !== 200 || !homeDemo.json?.ok || !Array.isArray(homeDemo.json.list) || !homeDemo.json.list.length) {
  fail(`home demo public bulk: ${homeDemo.text.slice(0, 160)}`);
}
ok("home guest demo API");

const heroLoop = await get("/assets/hero/gmx-hero-loop.svg");
if (heroLoop.status !== 200 || !heroLoop.text.includes("GM / GN replies")) {
  fail(`home hero loop asset: ${heroLoop.status}`);
}
ok("home hero loop asset");

if (!appPage.text.includes('id="homeHero"')) {
  fail("/app shell missing homeHero");
}
ok("home hero UI");

const billingPlans = await get("/api/billing/plans");
const y1 = (billingPlans.json?.plans || []).find((p) => p.key === "y1");
if (!y1 || Number(y1.usd) !== 80 || Number(y1.days) !== 365) {
  fail(`billing yearly plan y1: ${billingPlans.text.slice(0, 160)}`);
}
ok("billing yearly plan y1");

if (!appPage.text.includes('id="w_yearly_save"')) {
  fail("/app shell missing w_yearly_save yearly note");
}
ok("wallet yearly savings UI");

const achCore = await get("/lib/arcade-achievements-core.js");
if (achCore.status !== 200 || !achCore.text.includes("GMXArcadeAchievementsCore")) {
  fail(`arcade achievements core: ${achCore.status}`);
}
ok("arcade achievements core");

const arcadeHtml = await get("/arcade.html");
if (arcadeHtml.status !== 200 || !arcadeHtml.text.includes("arcade-achievements-core")) {
  fail("arcade.html missing achievements core script");
}
ok("arcade.html achievements script");

const arcadeJs = await get("/arcade.js");
if (arcadeJs.status !== 200 || !arcadeJs.text.includes("achievementsPanel")) {
  fail("arcade.js missing achievements panel");
}
ok("arcade achievements UI");

if (!appPage.text.includes('id="gm_preset_professional"')) {
  fail("/app shell missing gm_preset_professional quick preset");
}
ok("gm/gn quick presets UI");

console.log("\nPROD_VERIFY_OK");
