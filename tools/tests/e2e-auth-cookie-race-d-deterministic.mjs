#!/usr/bin/env node
/**
 * Deterministic Race D regression (Chromium, isolated test server).
 * Run: node tools/tests/e2e-auth-cookie-race-d-deterministic.mjs
 * Loop: RACE_D_RUNS=30 node tools/tests/e2e-auth-cookie-race-d-deterministic.mjs
 */
import crypto from "node:crypto";
import { chromium } from "playwright";
import { fail, ok, freePort, spawnTestServer, freshSmokeHandle } from "./_helpers.mjs";

const COOKIE_NAME = "gmx_token";
const RUNS = Math.max(1, Number(process.env.RACE_D_RUNS || 1));

function sha(value) {
  return crypto.createHash("sha256").update(String(value)).digest("hex").slice(0, 16);
}

function createGate() {
  let releaseFn;
  const promise = new Promise((resolve) => {
    releaseFn = resolve;
  });
  return { wait: promise, release: () => releaseFn() };
}

async function cookieSnap(context, baseUrl) {
  const cookies = await context.cookies(baseUrl);
  const hit = cookies.find((c) => c.name === COOKIE_NAME);
  return { present: Boolean(hit), hash: hit?.value ? sha(hit.value) : null };
}

async function establishAppSession(page, handle) {
  await page.fill("#xHandle", handle);
  await page.click("#btnConnect");
  await page.waitForFunction(
    () => Boolean(localStorage.getItem("gmx_token") && localStorage.getItem("gmx_handle")),
    undefined,
    { timeout: 15000 }
  );
}

function trackMutationRequests(page, base) {
  const events = [];
  const onReq = (req) => {
    const url = req.url();
    if (!url.startsWith(base)) return;
    if (url.includes("/api/user/init")) events.push({ kind: "init", at: Date.now() });
    if (url.includes("/api/user/logout")) events.push({ kind: "logout", at: Date.now() });
  };
  const onResp = (resp) => {
    const url = resp.url();
    if (!url.startsWith(base)) return;
    if (url.includes("/api/user/init")) events.push({ kind: "init_done", at: Date.now() });
    if (url.includes("/api/user/logout")) events.push({ kind: "logout_done", at: Date.now() });
  };
  page.on("request", onReq);
  page.on("response", onResp);
  return {
    events,
    detach() {
      page.off("request", onReq);
      page.off("response", onResp);
    },
  };
}

async function resetAuthStorage(page) {
  await page.goto(`${base}/app`, { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.evaluate(() => {
    try {
      localStorage.clear();
    } catch (_e) {}
    try {
      sessionStorage.clear();
    } catch (_e) {}
  });
}

async function runRaceD(base) {
  const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext();
    await context.clearCookies();
    const pageA = await context.newPage();
    const pageB = await context.newPage();
    await resetAuthStorage(pageA);
    const handle = freshSmokeHandle("rdd");
    const gate = createGate();
    const initHeld = createGate();
    let holdInit = false;

    await pageA.route("**/api/user/init", async (route, request) => {
      const body = JSON.parse(request.postData() || "{}");
      if (body.handle !== handle || !holdInit) return route.continue();
      const response = await route.fetch();
      initHeld.release();
      await gate.wait;
      await route.fulfill({ response });
    });

    await pageA.goto(`${base}/app`, { waitUntil: "domcontentloaded", timeout: 30000 });
    await establishAppSession(pageA, handle);
    await pageB.goto(`${base}/bridge`, { waitUntil: "domcontentloaded", timeout: 30000 });
    await pageB.waitForFunction(
      () => [...document.querySelectorAll("button")].some((b) => /disconnect/i.test(b.textContent || "")),
      undefined,
      { timeout: 15000 }
    );
    holdInit = true;
    const trackerB = trackMutationRequests(pageB, base);

    await pageA.fill("#xHandle", handle);
    const initP = pageA.click("#btnConnect");
    await initHeld.wait;
    const disconnectStarted = createGate();
    const disconnectP = (async () => {
      await pageB.waitForFunction(() => {
        const btn = [...document.querySelectorAll("button")].find((b) => /disconnect/i.test(b.textContent || ""));
        return btn && !btn.disabled;
      }, { timeout: 15000 });
      const btn = pageB.getByRole("button", { name: /disconnect/i });
      await btn.click();
      await pageB.waitForFunction(
        () =>
          Boolean(
            localStorage.getItem("gmx_ext_force_logout") || localStorage.getItem("gmx_ext_force_logout_v2")
          ),
        { timeout: 15000 }
      );
      disconnectStarted.release();
    })();
    await disconnectStarted.wait;
    if (trackerB.events.some((e) => e.kind === "logout_done")) {
      fail("race D deterministic: bridge logout completed before main init released");
    }
    gate.release();
    await Promise.all([initP, disconnectP]);
    await Promise.all([
      pageA.waitForResponse(
        (resp) => resp.url().includes("/api/user/logout") && resp.request().method() === "POST",
        { timeout: 15000 }
      ).catch(() => null),
      pageB.waitForResponse(
        (resp) => resp.url().includes("/api/user/logout") && resp.request().method() === "POST",
        { timeout: 15000 }
      ).catch(() => null),
    ]);

    const snap = await cookieSnap(context, base);
    const ls = await pageA.evaluate(() => ({
      token: localStorage.getItem("gmx_token") || "",
      handle: localStorage.getItem("gmx_handle") || "",
    }));
    const lsB = await pageB.evaluate(() => ({
      token: localStorage.getItem("gmx_token") || "",
      handle: localStorage.getItem("gmx_handle") || "",
    }));

    if (snap.present) fail(`race D deterministic: final cookie present hash=${snap.hash}`);
    if (ls.token || ls.handle) fail("race D deterministic: main storage still has session");
    if (lsB.token || lsB.handle) fail("race D deterministic: bridge storage still has session");

    trackerB.detach();
    await pageA.close();
    await pageB.close();
  } finally {
    await browser.close();
  }
}

let base = String(process.env.E2E_BASE || "").replace(/\/$/, "");
let child = null;
if (!base) {
  const port = Number(process.env.SMOKE_PORT || 0) || (await freePort());
  ({ child, base } = await spawnTestServer(port));
}

try {
  for (let i = 1; i <= RUNS; i++) {
    await runRaceD(base);
    if (RUNS > 1) console.log(`race D deterministic run ${i}/${RUNS} PASS`);
  }
  ok(RUNS > 1 ? `race D deterministic ${RUNS}/${RUNS} PASS` : "race D deterministic PASS");
  console.log("E2E_AUTH_COOKIE_RACE_D_DETERMINISTIC_OK");
} catch (e) {
  fail(e?.message || String(e));
} finally {
  if (child) {
    child.kill("SIGTERM");
    setTimeout(() => child.kill("SIGKILL"), 500).unref();
  }
}
