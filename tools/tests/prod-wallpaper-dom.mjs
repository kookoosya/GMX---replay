#!/usr/bin/env node
import { chromium } from "playwright";

const BASE = process.env.PROD_BASE || "https://www.gmxreply.com";
const EXPECT = Number(process.env.WALLPAPER_EXPECT || 0);

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext();
const page = await context.newPage();
await page.goto(`${BASE}/app?tab=themes`, { waitUntil: "domcontentloaded", timeout: 60000 });
await page.click("#tabWall");
await page.waitForTimeout(5000);

const data = await page.evaluate(() => {
  const siteBuiltin = document.querySelectorAll('#wpGrid .wpCard[data-wp-id^="v2_"]').length;
  const siteCustom = document.querySelectorAll('#wpGrid .wpCard:not([data-wp-id^="v2_"])').length;
  const extBuiltin = document.querySelectorAll('#extWpGrid .wpCard[data-wp-id^="extv3_"]').length;
  const grad = [...document.querySelectorAll("#wpGrid .wpCard")].some((c) =>
    /Rainy Skyline|Cyber Alley|Liquid Gradient/.test(c.textContent || "")
  );
  const pexels = [...document.querySelectorAll("#wpGrid .wpCard")].some((c) =>
    /Geometric Scene|Neon Scene|Forest Scene/.test(c.textContent || "")
  );
  return { siteBuiltin, siteCustom, extBuiltin, grad, pexels };
});

console.log("PROD_WALLPAPER_DOM", JSON.stringify(data));
if (EXPECT && data.siteBuiltin !== EXPECT) {
  console.error(`expected ${EXPECT} built-in, got ${data.siteBuiltin}`);
  process.exit(1);
}
console.log("PROD_WALLPAPER_DOM_OK");
await browser.close();
