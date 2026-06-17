#!/usr/bin/env node
/**
 * Browser smoke: /app loads, Random controls exist, no raw i18n keys in GM panel.
 */
import { chromium } from "playwright";
import { fail, ok } from "./_helpers.mjs";

const BASE = (process.env.E2E_BASE || "http://127.0.0.1:10000").replace(/\/$/, "");

let browser;
try {
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto(`${BASE}/app`, { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForTimeout(1500);

  for (const id of ["gmRand1", "gmRand10", "gnRand1", "gnStyle", "gmStyle"]) {
    const el = await page.$(`#${id}`);
    if (!el) fail(`missing #${id} on /app`);
  }
  ok("Random + style controls in DOM");

  const bodyText = await page.evaluate(() => document.body?.innerText || "");
  if (/\bgm_size_label\b|\bgm_mode_min\b/.test(bodyText)) {
    fail("raw i18n keys visible on page");
  }
  ok("no raw gm_* i18n keys in body");

  const hasWallCss = await page.evaluate(() => {
    return Boolean(document.querySelector(".gmxWallLayer") || document.getElementById("gmxWallLayer"));
  });
  if (!hasWallCss) {
    // layer may be created after wallpaper init — check function exists
    const fn = await page.evaluate(() => typeof window.setWallpaperLayerImage === "function");
    if (!fn) fail("setWallpaperLayerImage not available");
    ok("wallpaper API present (layer lazy)");
  } else {
    ok("wallpaper layer in DOM");
  }

  console.log("E2E_APP_OK");
} catch (e) {
  fail(e?.message || String(e));
} finally {
  if (browser) await browser.close();
}
