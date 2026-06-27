#!/usr/bin/env node
/**
 * Bridge React auth-state race tests (Chromium, isolated test server).
 */
import crypto from "node:crypto";
import { chromium } from "playwright";
import { fail, ok, freePort, spawnTestServer, freshSmokeHandle } from "./_helpers.mjs";

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

async function lsSnap(page) {
  return page.evaluate(() => ({
    handle: localStorage.getItem("gmx_handle") || "",
    token: localStorage.getItem("gmx_token") || "",
  }));
}

async function uiSnap(page) {
  return page.evaluate(() => {
    const disconnectVisible = [...document.querySelectorAll("button")].some((b) =>
      /disconnect/i.test(b.textContent || "")
    );
    const connectBtn = [...document.querySelectorAll("button")].find((b) =>
      /^connect$/i.test((b.textContent || "").trim())
    );
    return {
      disconnectVisible,
      connectDisabled: connectBtn?.disabled ?? null,
      errText: document.querySelector(".err")?.textContent?.trim() || "",
      usageGuest: /guest/i.test(document.body.innerText || ""),
      usageAuthed: /authenticated/i.test(document.body.innerText || ""),
    };
  });
}

async function createSession(base, handle) {
  const r = await fetch(`${base}/api/user/init`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ handle }),
  });
  const j = await r.json();
  if (!j.ok || !j.token) fail(`createSession failed for ${handle}`);
  return { handle: j.handle || handle, token: j.token };
}

async function bridgeConnect(page, handle) {
  const input = page.locator('input.input[placeholder*="handle"], input.input').first();
  await input.fill(handle);
  await page.getByRole("button", { name: /^connect$/i }).click();
}

let base = String(process.env.E2E_BASE || "").replace(/\/$/, "");
let child = null;
if (!base) {
  const port = Number(process.env.SMOKE_PORT || 0) || await freePort();
  ({ child, base } = await spawnTestServer(port));
}

const onlyTest = String(process.env.E2E_BRIDGE_TEST || "").trim().toUpperCase();

let browser;
try {
  browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();

  // Test A — stale refresh must not clear newer session
  if (!onlyTest || onlyTest === "A") {
    const handleB = freshSmokeHandle("ba");
    const sessionB = await createSession(base, handleB);
    const tokenBHash = sha(sessionB.token);

    const pageBridge = await context.newPage();
    const pageWriter = await context.newPage();
    const r1Gate = createGate();
    let r1Seen = false;
    let r1Released = false;

    await pageBridge.route("**/api/usage**", async (route, request) => {
      const auth = String(request.headers()["authorization"] || "");
      if (auth.includes("Bearer invalid-old-token") && !r1Released) {
        r1Seen = true;
        await r1Gate.wait;
        r1Released = true;
        await route.fulfill({
          status: 401,
          contentType: "application/json",
          body: JSON.stringify({ error: "unauthorized", authenticated: false }),
        });
        return;
      }
      return route.continue();
    });

    await pageBridge.addInitScript(() => {
      localStorage.setItem("gmx_handle", "@old");
      localStorage.setItem("gmx_token", "invalid-old-token");
    });

    await pageBridge.goto(`${base}/bridge`, { waitUntil: "domcontentloaded", timeout: 30000 });
    await pageBridge.waitForSelector("input.input", { timeout: 15000 });

    await pageBridge.waitForFunction(() => {
      return performance.getEntriesByType("resource").some((e) => String(e.name).includes("/api/usage"));
    }, undefined, { timeout: 15000 }).catch(() => {});

    for (let i = 0; i < 50 && !r1Seen; i++) {
      await pageBridge.waitForTimeout(100);
    }
    if (!r1Seen) fail("race A: expected held R1 usage request with invalid-old-token");

    await pageWriter.goto(`${base}/app`, { waitUntil: "domcontentloaded", timeout: 30000 });
    await pageWriter.evaluate(
      ({ handle, token }) => {
        localStorage.setItem("gmx_handle", handle);
        localStorage.setItem("gmx_token", token);
      },
      { handle: sessionB.handle, token: sessionB.token }
    );

    await pageBridge.getByRole("button", { name: /disconnect/i }).waitFor({ timeout: 25000 });
    const lsBeforeRelease = await lsSnap(pageBridge);
    const uiBeforeRelease = await uiSnap(pageBridge);
    if (!lsBeforeRelease.token) fail("race A: session B not established before R1 release");
    if (sha(lsBeforeRelease.token) !== tokenBHash) {
      fail(`race A: expected token B hash ${tokenBHash}, got ${sha(lsBeforeRelease.token)}`);
    }

    r1Gate.release();
    await pageBridge.waitForTimeout(1200);

    const lsFinal = await lsSnap(pageBridge);
    const uiFinal = await uiSnap(pageBridge);
    if (!lsFinal.token || !lsFinal.handle) {
      fail(`race A fail-before: stale R1 cleared session B (ls empty, ui disconnect=${uiFinal.disconnectVisible})`);
    }
    if (sha(lsFinal.token) !== tokenBHash) {
      fail(`race A fail-before: token changed from B (${tokenBHash}) to ${sha(lsFinal.token)}`);
    }
    if (!uiFinal.disconnectVisible) {
      fail("race A fail-before: bridge UI lost connected session B after stale 401");
    }
    if (uiFinal.errText) {
      fail(`race A fail-before: stale R1 surfaced error: ${uiFinal.errText}`);
    }
    ok(`race A stale refresh preserves session B (beforeRelease authed=${uiBeforeRelease.usageAuthed})`);
    await pageBridge.close();
    await pageWriter.close();
  }

  // Test B — stale Connect must not restore after auth storage invalidation
  if (!onlyTest || onlyTest === "B") {
    await context.clearCookies();
    const handleA = freshSmokeHandle("bb");
    const pageBridge = await context.newPage();
    const pageWriter = await context.newPage();
    const connectGate = createGate();
    let holdConnect = false;

    await pageBridge.route("**/api/user/init", async (route, request) => {
      const body = JSON.parse(request.postData() || "{}");
      if (body.handle === handleA && holdConnect) {
        const response = await route.fetch();
        await connectGate.wait;
        await route.fulfill({ response });
        return;
      }
      return route.continue();
    });

    await pageBridge.goto(`${base}/bridge`, { waitUntil: "domcontentloaded", timeout: 30000 });
    await pageBridge.waitForSelector("input.input", { timeout: 15000 });
    await pageBridge.waitForTimeout(500);

    holdConnect = true;
    const connectP = bridgeConnect(pageBridge, handleA);
    await pageBridge.waitForTimeout(400);

    await pageWriter.goto(`${base}/app`, { waitUntil: "domcontentloaded", timeout: 30000 });
    await pageWriter.evaluate(() => {
      localStorage.removeItem("gmx_handle");
      localStorage.removeItem("gmx_token");
    });
    await pageBridge.waitForFunction(
      () => !localStorage.getItem("gmx_token") && !localStorage.getItem("gmx_handle"),
      undefined,
      { timeout: 5000 }
    );
    await pageBridge.waitForResponse(
      (resp) => resp.url().includes("/api/usage"),
      { timeout: 15000 }
    );
    await pageBridge.waitForTimeout(300);

    connectGate.release();
    await connectP;
    await pageBridge.waitForTimeout(1000);

    const lsFinal = await lsSnap(pageBridge);
    const uiFinal = await uiSnap(pageBridge);
    if (lsFinal.token || lsFinal.handle) {
      fail(`race B fail-before: stale Connect restored session A handle=${lsFinal.handle}`);
    }
    if (uiFinal.disconnectVisible) {
      fail("race B fail-before: bridge UI shows connected after storage invalidation");
    }
    if (uiFinal.errText) {
      fail(`race B fail-before: stale Connect surfaced error: ${uiFinal.errText}`);
    }
    if (uiFinal.connectDisabled) {
      fail("race B fail-before: busy stuck true after stale Connect");
    }
    ok("race B stale Connect does not restore after storage invalidation");
    await pageBridge.close();
    await pageWriter.close();
  }

  console.log("E2E_BRIDGE_STATE_RACE_OK");
} catch (e) {
  fail(e?.message || String(e));
} finally {
  if (browser) await browser.close();
  if (child) {
    child.kill("SIGTERM");
    setTimeout(() => child.kill("SIGKILL"), 500).unref();
  }
}
