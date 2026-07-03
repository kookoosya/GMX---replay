#!/usr/bin/env node
/** Cold vs warm production wallpaper thumbnail URL + pixel check. */
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { chromium } from "playwright";

const BASE = process.env.PROD_BASE || "https://www.gmxreply.com";
const OUT = path.join(process.cwd(), "tools", ".wallpaper-review", "browser-audit");

async function thumbProbe(contextLabel, userDataDir) {
  const browser = await chromium.launchPersistentContext(userDataDir, {
    headless: true,
    serviceWorkers: "allow",
  });
  const page = browser.pages()[0] || (await browser.newPage());
  await page.goto(`${BASE}/app?tab=themes`, { waitUntil: "domcontentloaded", timeout: 90000 });
  await page.click("#tabWall");
  await page.waitForSelector("#wpGrid .wpCard", { timeout: 30000 });
  await page.waitForTimeout(3000);
  const cards = await page.evaluate(() =>
    [...document.querySelectorAll("#wpGrid .wpCard[data-wp-id^='v2_']")]
      .slice(0, 5)
      .map((el) => ({
        id: el.getAttribute("data-wp-id"),
        name: el.querySelector(".wpName")?.textContent?.trim() || "",
        dataBg: el.querySelector(".wpThumb")?.getAttribute("data-bg") || "",
        bgImage: getComputedStyle(el.querySelector(".wpThumb") || el).backgroundImage,
      }))
  );
  const pixels = [];
  for (const c of cards) {
    const url = c.dataBg || (c.bgImage.match(/url\("([^"]+)"\)/) || [])[1] || "";
    if (!url) continue;
    const abs = url.startsWith("http") ? url : `${BASE}${url}`;
    const res = await page.request.get(abs);
    const buf = Buffer.from(await res.body());
    pixels.push({
      id: c.id,
      url,
      status: res.status(),
      size: buf.length,
      hash: crypto.createHash("sha256").update(buf).digest("hex").slice(0, 16),
    });
  }
  if (contextLabel === "warm") {
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);
  }
  await browser.close();
  return { contextLabel, cards, pixels };
}

fs.mkdirSync(OUT, { recursive: true });
const coldDir = fs.mkdtempSync(path.join(os.tmpdir(), "gmx-wp-cold-"));
const warmDir = fs.mkdtempSync(path.join(os.tmpdir(), "gmx-wp-warm-"));

const cold = await thumbProbe("cold", coldDir);
const warm1 = await thumbProbe("warm", warmDir);
const warm2 = await thumbProbe("warm-reload", warmDir);

const report = { cold, warm: warm1, warmReload: warm2, at: new Date().toISOString() };
fs.writeFileSync(path.join(OUT, "cold-warm.json"), JSON.stringify(report, null, 2));
console.log("BROWSER_AUDIT", JSON.stringify({ cold: cold.pixels, warm: warm1.pixels }, null, 2));
