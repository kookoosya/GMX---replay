#!/usr/bin/env node
/**
 * Browser smoke: public landing at / (not app shell redirect).
 */
import { chromium } from "playwright";
import { fail, ok, freePort, spawnTestServer } from "./_helpers.mjs";

const FORBIDDEN = [
  /Install ID/i,
  /Language mode \(placeholder\)/i,
  /\bDebug\b/,
  /UI placeholder/i,
  /Activate code/i,
  /Redeem code/i,
  /id="redeemCode"/,
  /data-tab="admin"/,
  /\bdaily limits?\b/i,
  /\b70\s*credits?\b/i,
];

let base = String(process.env.E2E_BASE || "").replace(/\/$/, "");
let child = null;
if (!base) {
  const port = Number(process.env.SMOKE_PORT || 0) || (await freePort());
  ({ child, base } = await spawnTestServer(port));
}

let browser;
try {
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const consoleErrors = [];
  const failedRequests = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });
  page.on("pageerror", (err) => consoleErrors.push(String(err.message || err)));
  page.on("requestfailed", (req) => {
    const url = req.url();
    if (url.startsWith(base)) failedRequests.push(url);
  });

  const resp = await page.goto(`${base}/`, { waitUntil: "domcontentloaded", timeout: 30000 });
  if (!resp || resp.status() !== 200) fail(`/ status ${resp?.status()}`);
  ok("/ returns 200");

  const finalPath = new URL(page.url()).pathname;
  if (finalPath !== "/") fail(`expected pathname / got ${finalPath}`);
  ok("/ does not redirect to /app");

  const bodyText = await page.evaluate(() => document.body?.innerText || "");
  for (const rx of FORBIDDEN) {
    if (rx.test(bodyText)) fail(`forbidden content on /: ${rx}`);
  }
  ok("no placeholder/debug/admin content");

  const h1Count = await page.evaluate(() => document.querySelectorAll("h1").length);
  if (h1Count !== 1) fail(`expected 1 h1, got ${h1Count}`);
  ok("single h1");

  const cta = await page.$("#home_cta_primary");
  if (!cta) fail("missing #home_cta_primary");
  const href = await cta.getAttribute("href");
  if (href !== "/app") fail(`primary CTA href=${href}`);
  ok("primary CTA points to /app");

  const meta = await page.evaluate(() => ({
    title: document.title,
    description: document.querySelector('meta[name="description"]')?.content || "",
  }));
  if (!meta.title) fail("missing title");
  if (!meta.description) fail("missing meta description");
  ok("title and meta description present");

  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.waitForTimeout(300);
  let overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
  if (overflow) fail("horizontal overflow on desktop");
  ok("desktop layout no horizontal overflow");

  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(300);
  overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
  if (overflow) fail("horizontal overflow on mobile");
  ok("mobile layout no horizontal overflow");

  const menuBtn = await page.$("#home_nav_toggle");
  if (menuBtn) {
    const visible = await menuBtn.isVisible();
    if (visible) {
      await menuBtn.click();
      await page.waitForFunction(
        () => document.getElementById("home_nav")?.classList.contains("is-open"),
        null,
        { timeout: 3000 }
      );
      const expanded = await menuBtn.getAttribute("aria-expanded");
      if (expanded !== "true") fail("mobile nav toggle aria-expanded not true after click");
      ok("mobile navigation toggles");
    } else {
      ok("mobile navigation skipped (desktop nav visible)");
    }
  }

  await page.locator("#home_cta_primary").focus();
  const ctaFocused = await page.evaluate(() => document.activeElement?.id === "home_cta_primary");
  if (!ctaFocused) fail("keyboard cannot focus primary CTA");
  ok("keyboard can focus primary CTA");

  if (consoleErrors.length) fail(`console errors: ${consoleErrors.slice(0, 5).join("; ")}`);
  ok("no console errors");

  if (failedRequests.length) fail(`failed same-origin requests: ${failedRequests.join(", ")}`);
  ok("no failed same-origin asset requests");

  console.log("E2E_HOMEPAGE_OK");
} catch (e) {
  fail(e?.message || String(e));
} finally {
  if (browser) await browser.close();
  if (child) {
    child.kill("SIGTERM");
    setTimeout(() => child.kill("SIGKILL"), 500).unref();
  }
}
