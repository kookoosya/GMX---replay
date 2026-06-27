#!/usr/bin/env node
import { chromium } from "playwright";
import { fail, ok, freePort, spawnTestServer } from "./_helpers.mjs";

const VIEWPORTS = [
  { name: "desktop", width: 1440, height: 1000 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "mobile", width: 390, height: 844 },
  { name: "narrow", width: 360, height: 800 },
];

let base = String(process.env.E2E_BASE || "").replace(/\/$/, "");
let child = null;
if (!base) {
  const port = Number(process.env.SMOKE_PORT || 0) || (await freePort());
  ({ child, base } = await spawnTestServer(port));
}

const TAB_IDS = ["t_home", "t_gm", "t_gn", "t_prediction", "t_wallet", "t_ref", "t_lb", "t_themes", "t_extthemes"];

let browser;
try {
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const consoleErrors = [];
  page.on("console", (m) => {
    if (m.type() !== "error") return;
    const t = m.text();
    if (/Failed to load resource.*404/i.test(t)) return;
    consoleErrors.push(t);
  });
  page.on("pageerror", (e) => consoleErrors.push(String(e.message || e)));

  await page.goto(`${base}/app`, { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForTimeout(2000);

  // Test A — desktop navigation
  await page.setViewportSize({ width: 1440, height: 1000 });
  const navLandmark = await page.$('nav.tabs[aria-label], nav.appShellNav');
  if (!navLandmark) fail("desktop nav landmark missing");
  ok("desktop nav landmark present");

  for (const id of TAB_IDS) {
    const btn = await page.$(`#${id}`);
    if (!btn || !(await btn.isVisible())) continue;
    await btn.click();
    await page.waitForTimeout(200);
    const tab = await btn.getAttribute("data-tab");
    const active = await btn.evaluate((el) => el.classList.contains("active"));
    if (!active) fail(`tab ${id} not active after click`);
    const panel = await page.$(`#tab-${tab}`);
    if (!panel) fail(`panel #tab-${tab} missing`);
    const hidden = await panel.evaluate((el) => el.classList.contains("hidden"));
    if (hidden) fail(`panel #tab-${tab} still hidden`);
    const othersHidden = await page.evaluate((activeTab) => {
      return [...document.querySelectorAll('[id^="tab-"]')].every((el) => {
        const id = el.id.replace("tab-", "");
        if (id === activeTab) return !el.classList.contains("hidden");
        return el.classList.contains("hidden");
      });
    }, tab);
    if (!othersHidden) fail(`multiple panels visible after switching to ${tab}`);
  }
  ok("desktop tab switching shows single panel");

  // Test B — mobile drawer (more sheet)
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(400);
  const bottomNav = await page.$("#mobileBottomNav");
  if (!bottomNav || !(await bottomNav.isVisible())) fail("mobile bottom nav not visible");
  ok("mobile bottom nav visible");

  const moreBtn = await page.$("#mnav_more");
  if (!moreBtn) fail("missing #mnav_more");
  await moreBtn.click();
  await page.waitForTimeout(200);
  const sheet = await page.$("#mobileMoreSheet");
  const sheetHidden = await sheet.evaluate((el) => el.classList.contains("hidden"));
  if (sheetHidden) fail("more sheet did not open");
  const expanded = await moreBtn.getAttribute("aria-expanded");
  if (expanded !== "true") fail("mnav_more aria-expanded not true when open");
  ok("mobile more sheet opens with aria-expanded");

  const bodyLocked = await page.evaluate(() => document.body.classList.contains("appShellScrollLock"));
  if (!bodyLocked) fail("body scroll not locked when more sheet open");
  ok("body scroll locked when drawer open");

  await page.keyboard.press("Escape");
  await page.waitForTimeout(200);
  const closed = await sheet.evaluate((el) => el.classList.contains("hidden"));
  if (!closed) fail("Escape did not close more sheet");
  const expandedAfter = await moreBtn.getAttribute("aria-expanded");
  if (expandedAfter !== "false") fail("aria-expanded not false after Escape");
  ok("Escape closes drawer and restores aria-expanded");

  await moreBtn.click();
  await page.waitForTimeout(150);
  await page.locator("#mmore_themes").click();
  await page.waitForTimeout(250);
  const sheetClosedAfterPick = await sheet.evaluate((el) => el.classList.contains("hidden"));
  if (!sheetClosedAfterPick) fail("drawer stayed open after tab pick");
  const themesActive = await page.evaluate(() => document.getElementById("t_themes")?.classList.contains("active"));
  if (!themesActive) fail("themes tab not active after pick from drawer");
  ok("drawer closes after tab selection");

  // Test C — overflow
  for (const vp of VIEWPORTS) {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.waitForTimeout(250);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
    if (overflow) fail(`horizontal overflow at ${vp.name} ${vp.width}x${vp.height}`);
  }
  ok("no horizontal overflow on key viewports");

  // Test D — keyboard can reach navigation
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.locator("#t_gm").focus();
  const focusedGm = await page.evaluate(() => document.activeElement?.id === "t_gm");
  if (!focusedGm) fail("keyboard cannot focus desktop tab");
  ok("keyboard can focus navigation");

  // Test E — reload preserves last tab contract (localStorage)
  await page.locator("#t_gn").click();
  await page.waitForTimeout(200);
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2000);
  const gnActiveAfterReload = await page.evaluate(() => document.getElementById("t_gn")?.classList.contains("active"));
  if (!gnActiveAfterReload) fail("reload did not restore last tab (expected gn)");
  ok("reload restores last tab from storage");

  // Test G — regression
  const hero = await page.$("#homeHero");
  if (!hero) fail("home hero missing");
  await page.locator("#t_home").click();
  await page.waitForTimeout(200);
  const connect = await page.$("#btnConnect");
  const reset = await page.$("#btnReset");
  if (!connect || !reset) fail("Connect/Reset missing on home");
  ok("Connect/Reset present; home hero intact");

  if (consoleErrors.length) fail(`console errors: ${consoleErrors.slice(0, 5).join("; ")}`);
  ok("no console errors");

  console.log("E2E_APP_SHELL_OK");
} catch (e) {
  fail(e?.message || String(e));
} finally {
  if (browser) await browser.close();
  if (child) {
    child.kill("SIGTERM");
    setTimeout(() => child.kill("SIGKILL"), 500).unref();
  }
}
