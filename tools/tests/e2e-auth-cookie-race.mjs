#!/usr/bin/env node
/**
 * Browser auth-cookie mutation race tests (Chromium, isolated test server).
 */
import crypto from "node:crypto";
import { chromium } from "playwright";
import { fail, ok, freePort, spawnTestServer, freshSmokeHandle } from "./_helpers.mjs";

const COOKIE_NAME = "gmx_token";

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

async function establishAppSession(page, handle) {
  await page.fill("#xHandle", handle);
  await page.click("#btnConnect");
  await page.waitForFunction(
    () => Boolean(localStorage.getItem("gmx_token") && localStorage.getItem("gmx_handle")),
    undefined,
    { timeout: 15000 }
  );
}

async function establishBridgeSession(page, handle) {
  const input = page.locator('input.input[placeholder*="handle"], input.input').first();
  await input.fill(handle);
  await page.getByRole("button", { name: /connect/i }).click();
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

let base = String(process.env.E2E_BASE || "").replace(/\/$/, "");
let child = null;
if (!base) {
  const port = Number(process.env.SMOKE_PORT || 0) || await freePort();
  ({ child, base } = await spawnTestServer(port));
}

let browser;
try {
  browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();

  // Test A — same-tab init then Reset
  {
    const page = await context.newPage();
    await resetAuthStorage(page);
    const handle = freshSmokeHandle("ra");
    const gate = createGate();
    let holdInit = false;
    await page.route("**/api/user/init", async (route, request) => {
      const body = JSON.parse(request.postData() || "{}");
      if (body.handle !== handle || !holdInit) return route.continue();
      const response = await route.fetch();
      await gate.wait;
      await route.fulfill({ response });
    });

    await page.goto(`${base}/app`, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForSelector("#btnConnect", { timeout: 15000 });
    await establishAppSession(page, handle);
    holdInit = true;
    const tracker = trackMutationRequests(page, base);

    await page.fill("#xHandle", handle);
    const connectP = page.click("#btnConnect");
    await page.waitForTimeout(300);
    const resetP = page.click("#btnReset");
    await page.waitForTimeout(300);
    const logoutStarted = tracker.events.some((e) => e.kind === "logout");
    if (logoutStarted) {
      fail("race A: logout request started before delayed init was released");
    }
    gate.release();
    await Promise.all([connectP, resetP]);
    await page.waitForTimeout(500);
    const snap = await cookieSnap(context, base);
    tracker.detach();
    if (snap.present) fail(`race A: final cookie present hash=${snap.hash}`);
    ok("race A same-tab init then Reset final cookie absent");
    await page.close();
  }

  // Test B — cross-tab init then logout
  {
    await context.clearCookies();
    const pageA = await context.newPage();
    const pageB = await context.newPage();
    await resetAuthStorage(pageA);
    const handle = freshSmokeHandle("rb");
    const gate = createGate();
    let holdInit = false;
    for (const p of [pageA, pageB]) {
      await p.route("**/api/user/init", async (route, request) => {
        const body = JSON.parse(request.postData() || "{}");
        if (body.handle !== handle || !holdInit) return route.continue();
        const response = await route.fetch();
        await gate.wait;
        await route.fulfill({ response });
      });
    }

    await pageA.goto(`${base}/app`, { waitUntil: "domcontentloaded", timeout: 30000 });
    await pageA.waitForSelector("#btnConnect", { timeout: 15000 });
    await establishAppSession(pageA, handle);
    holdInit = true;
    const trackerB = trackMutationRequests(pageB, base);

    await pageA.fill("#xHandle", handle);
    const initP = pageA.click("#btnConnect");
    await pageA.waitForTimeout(300);
    await pageB.goto(`${base}/app`, { waitUntil: "domcontentloaded", timeout: 30000 });
    const logoutP = pageB.click("#btnReset");
    await pageB.waitForTimeout(300);
    if (trackerB.events.some((e) => e.kind === "logout_done")) {
      fail("race B: logout completed before delayed init was released");
    }
    gate.release();
    await Promise.all([initP, logoutP]);
    await pageB.waitForTimeout(500);
    const snap = await cookieSnap(context, base);
    if (snap.present) fail(`race B: final cookie present hash=${snap.hash}`);
    ok("race B cross-tab init then logout final cookie absent");
    trackerB.detach();
    await pageA.close();
    await pageB.close();
  }

  // Test C — cross-tab old A then new fresh B
  {
    await context.clearCookies();
    const pageA = await context.newPage();
    const pageB = await context.newPage();
    await resetAuthStorage(pageA);
    const handleA = freshSmokeHandle("rca");
    const handleB = freshSmokeHandle("rcb");
    const gate = createGate();
    let holdA = false;

    await pageA.route("**/api/user/init", async (route, request) => {
      const body = JSON.parse(request.postData() || "{}");
      if (body.handle !== handleA || !holdA) return route.continue();
      const response = await route.fetch();
      await gate.wait;
      await route.fulfill({ response });
    });

    await pageA.goto(`${base}/app`, { waitUntil: "domcontentloaded", timeout: 30000 });
    await establishAppSession(pageA, handleA);
    holdA = true;
    const tracker = trackMutationRequests(pageB, base);

    await pageA.fill("#xHandle", handleA);
    const initAP = pageA.click("#btnConnect");
    await pageA.waitForTimeout(250);
    await pageB.goto(`${base}/app`, { waitUntil: "domcontentloaded", timeout: 30000 });
    await pageB.click("#btnReset");
    await pageB.waitForTimeout(300);
    await establishAppSession(pageB, handleB);
    const tokenBHash = sha(String(await pageB.evaluate(() => localStorage.getItem("gmx_token") || "")));

    gate.release();
    await initAP;
    await pageB.waitForTimeout(500);
    const snap = await cookieSnap(context, base);
    if (!snap.present) fail("race C: expected cookie for new session B");
    if (snap.hash !== tokenBHash) fail(`race C: final cookie hash ${snap.hash} != token B ${tokenBHash}`);
    const order = tracker.events.map((e) => e.kind);
    ok(`race C cross-tab old A then new B cookie is B (${order.join(",")})`);
    tracker.detach();
    await pageA.close();
    await pageB.close();
  }

  // Test D — bridge participates in same lock
  {
    await context.clearCookies();
    const pageA = await context.newPage();
    const pageB = await context.newPage();
    await resetAuthStorage(pageA);
    const handle = freshSmokeHandle("rd");
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
      fail("race D: bridge logout completed before main init released");
    }
    gate.release();
    await Promise.all([initP, disconnectP]);
    await pageB.waitForResponse(
      (resp) => resp.url().includes("/api/user/logout") && resp.request().method() === "POST",
      { timeout: 15000 }
    ).catch(() => {});
    const snap = await cookieSnap(context, base);
    if (snap.present) fail(`race D: final cookie present hash=${snap.hash}`);
    ok("race D bridge logout waits for main init release");
    trackerB.detach();
    await pageA.close();
    await pageB.close();
  }

  // Test E — bridge init ordered after main logout
  {
    await context.clearCookies();
    const pageMain = await context.newPage();
    const pageBridge = await context.newPage();
    await resetAuthStorage(pageMain);
    const handleB = freshSmokeHandle("re");

    await pageMain.goto(`${base}/app`, { waitUntil: "domcontentloaded", timeout: 30000 });
    await establishAppSession(pageMain, freshSmokeHandle("rea"));
    await pageMain.click("#btnReset");
    await pageMain.waitForTimeout(400);

    await pageBridge.goto(`${base}/bridge`, { waitUntil: "domcontentloaded", timeout: 30000 });
    await establishBridgeSession(pageBridge, handleB);
    const tokenBHash = sha(String(await pageBridge.evaluate(() => localStorage.getItem("gmx_token") || "")));
    await pageBridge.waitForTimeout(300);
    const snap = await cookieSnap(context, base);
    if (!snap.present) fail("race E: expected cookie after bridge init");
    if (snap.hash !== tokenBHash) fail(`race E: cookie hash ${snap.hash} != token B ${tokenBHash}`);
    ok("race E bridge init after main logout cookie is B");
    await pageMain.close();
    await pageBridge.close();
  }

  console.log("E2E_AUTH_COOKIE_RACE_OK");
} catch (e) {
  fail(e?.message || String(e));
} finally {
  if (browser) await browser.close();
  if (child) {
    child.kill("SIGTERM");
    setTimeout(() => child.kill("SIGKILL"), 500).unref();
  }
}
