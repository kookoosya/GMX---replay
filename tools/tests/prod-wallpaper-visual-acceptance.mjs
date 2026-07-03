#!/usr/bin/env node
/** Production wallpaper visual acceptance — bytes, contact sheets, browser contexts. */
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import {
  siteLandscapeFilename,
  siteThumbFilename,
  extPortraitFilename,
} from "../lib/wallpaper-core.mjs";

const BASE = process.env.PROD_BASE || "https://www.gmxreply.com";
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const OUT = path.join(ROOT, "tools", ".wallpaper-review", "prod-acceptance");
const BASELINE = "c6c9fa6";
const HEAD = execSync("git rev-parse HEAD", { cwd: ROOT, encoding: "utf8" }).trim().slice(0, 8);
const ASSET_REV =
  fs.readFileSync(path.join(ROOT, "public", "app.js"), "utf8").match(/ASSET_REV = "([^"]+)"/)?.[1] || "";

function sha(buf) {
  return crypto.createHash("sha256").update(buf).digest("hex");
}

function gitBytes(rev, rel) {
  try {
    return execSync(`git show ${rev}:${rel}`, { cwd: ROOT, encoding: "buffer", maxBuffer: 20 * 1024 * 1024 });
  } catch {
    return null;
  }
}

async function fetchBytes(urlPath, retries = 5) {
  const url = urlPath.startsWith("http") ? urlPath : `${BASE}${urlPath}`;
  let lastErr = null;
  for (let i = 1; i <= retries; i++) {
    try {
      const r = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(90000) });
      const bytes = Buffer.from(await r.arrayBuffer());
      return { status: r.status, bytes, ct: r.headers.get("content-type") || "", url };
    } catch (err) {
      lastErr = err;
      if (i < retries) await new Promise((r) => setTimeout(r, 3000 * i));
    }
  }
  throw lastErr || new Error(`fetch failed: ${url}`);
}

function isPhoto(bytes, oldGrad) {
  if (!bytes?.length) return false;
  if (bytes.length < 1000) return false;
  if (oldGrad && sha(bytes) === sha(oldGrad)) return false;
  return true;
}

fs.mkdirSync(OUT, { recursive: true });
fs.mkdirSync(path.join(OUT, "screenshots"), { recursive: true });
fs.mkdirSync(path.join(OUT, "prod-bytes"), { recursive: true });

// --- 1. Production bytes (first 20) ---
const byteRows = [];
for (let i = 1; i <= 20; i++) {
  const id = `v2_${String(i).padStart(3, "0")}`;
  const thumbFile = siteThumbFilename(i);
  const landFile = siteLandscapeFilename(i);
  const portFile = extPortraitFilename(i);
  const thumbRel = `assets/wallpapers/thumbs/${thumbFile}`;
  const landRel = `assets/wallpapers/${landFile}`;
  const portRel = `assets/extbg/${portFile}`;
  const legacyThumbRel = `assets/wallpapers/thumbs/${id}.webp`;

  const gitThumb = gitBytes("HEAD", thumbRel);
  const gitLand = gitBytes("HEAD", landRel);
  const gitPort = gitBytes("HEAD", portRel);
  const oldThumb = gitBytes(BASELINE, legacyThumbRel);

  const prodThumb = await fetchBytes(`/assets/wallpapers/thumbs/${thumbFile}`);
  const prodLand = await fetchBytes(`/assets/wallpapers/${landFile}`);
  const prodPort = await fetchBytes(`/assets/extbg/${portFile}`);

  fs.writeFileSync(path.join(OUT, "prod-bytes", `${id}-thumb.webp`), prodThumb.bytes);
  fs.writeFileSync(path.join(OUT, "prod-bytes", `${id}-land.webp`), prodLand.bytes);
  fs.writeFileSync(path.join(OUT, "prod-bytes", `${id}-port.webp`), prodPort.bytes);

  const prodThumbSha = sha(prodThumb.bytes);
  const gitThumbSha = gitThumb ? sha(gitThumb) : "";
  const match = prodThumbSha === gitThumbSha && prodThumb.status === 200;
  const photo = isPhoto(prodThumb.bytes, oldThumb);
  const oldGrad = oldThumb && prodThumbSha === sha(oldThumb);

  byteRows.push({
    id,
    thumbFile,
    prodThumbSha,
    gitThumbSha,
    match,
    photograph: photo,
    oldGradient: oldGrad,
    thumbCt: prodThumb.ct,
    thumbSize: prodThumb.bytes.length,
    landMatch: sha(prodLand.bytes) === (gitLand ? sha(gitLand) : ""),
    portMatch: sha(prodPort.bytes) === (gitPort ? sha(gitPort) : ""),
    landSize: prodLand.bytes.length,
    portSize: prodPort.bytes.length,
  });
}

// --- 2. Contact sheets from production (100 thumbs, 4 segments) ---
async function buildContactSheet(from, to, label) {
  const cells = [];
  for (let i = from; i <= to; i++) {
    const thumbFile = siteThumbFilename(i);
    const { bytes, status } = await fetchBytes(`/assets/wallpapers/thumbs/${thumbFile}`);
    const ok = status === 200 && bytes.length > 500;
    const b64 = ok ? bytes.toString("base64") : "";
    cells.push(
      ok
        ? `<div class="cell"><img src="data:image/webp;base64,${b64}" alt="${thumbFile}"/><span>${thumbFile}</span></div>`
        : `<div class="cell bad"><span>${thumbFile}</span><small>FAIL ${status}</small></div>`
    );
  }
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>Prod ${label}</title>
<style>body{font-family:system-ui;background:#111;color:#eee;margin:12px}.grid{display:grid;grid-template-columns:repeat(5,1fr);gap:8px}.cell{background:#222;border-radius:8px;padding:6px;text-align:center}.cell img{width:100%;aspect-ratio:16/10;object-fit:cover;border-radius:4px}.cell span{font-size:10px;opacity:.8}.bad{outline:2px solid #c33}</style>
</head><body><h1>Production thumbnails ${from}–${to}</h1><p>${BASE} no-store fetch</p><div class="grid">${cells.join("")}</div></body></html>`;
  const file = path.join(OUT, `contact-sheet-${from}-${to}.html`);
  fs.writeFileSync(file, html, "utf8");
  return file;
}

const sheets = [];
for (const [a, b] of [
  [1, 25],
  [26, 50],
  [51, 75],
  [76, 100],
]) {
  sheets.push(await buildContactSheet(a, b, `${a}-${b}`));
}

// --- 3. Browser: cold, warm, legacy SW profile ---
async function browserAudit(contextLabel, userDataDir, opts = {}) {
  const browser = await chromium.launchPersistentContext(userDataDir, {
    headless: true,
    serviceWorkers: "allow",
    viewport: opts.mobile ? { width: 390, height: 844 } : { width: 1280, height: 900 },
    isMobile: !!opts.mobile,
  });
  const page = browser.pages()[0] || (await browser.newPage());

  if (opts.seedLegacyCache) {
    await page.goto(`${BASE}/app`, { waitUntil: "domcontentloaded", timeout: 90000 });
    await page.evaluate(async () => {
      const gradUrl = "/assets/wallpapers/thumbs/v2_001.webp";
      try {
        const cache = await caches.open("gmx-shell-v2");
        const r = await fetch(gradUrl);
        if (r.ok) await cache.put(gradUrl, r.clone());
      } catch {}
    });
  }

  await page.goto(`${BASE}/app?tab=themes`, { waitUntil: "domcontentloaded", timeout: 90000 });
  await page.click("#tabWall");
  await page.waitForSelector("#wpGrid .wpCard", { timeout: 45000 });
  await page.waitForTimeout(4000);

  const dom = await page.evaluate(() => {
    const cards = [...document.querySelectorAll("#wpGrid .wpCard")];
    const builtin = cards.filter((c) => /^v2_/.test(c.getAttribute("data-wp-id") || "")).length;
    const custom = cards.length - builtin;
    const first20 = cards
      .filter((c) => /^v2_/.test(c.getAttribute("data-wp-id") || ""))
      .slice(0, 20)
      .map((el) => ({
        id: el.getAttribute("data-wp-id"),
        name: el.querySelector(".wpName")?.textContent?.trim() || "",
        dataBg: el.querySelector(".wpThumb")?.getAttribute("data-bg") || "",
        bgImage: getComputedStyle(el.querySelector(".wpThumb") || el).backgroundImage,
      }));
    const legacyUrls = first20.filter((c) => /\/thumbs\/v2_\d+\.webp/.test(c.dataBg || c.bgImage)).length;
    const versionedUrls = first20.filter((c) => /pexels100_\d+\.webp/.test(c.dataBg || c.bgImage)).length;
    const gradNames = cards.some((c) => /Rainy Skyline|Cyber Alley|Liquid Gradient/.test(c.textContent || ""));
    const extBuiltin = document.querySelectorAll('#extWpGrid .wpCard[data-wp-id^="extv3_"]').length;
    return { builtin, custom, first20, legacyUrls, versionedUrls, gradNames, extBuiltin, total: cards.length };
  });

  const pixels = [];
  for (const c of dom.first20.slice(0, 5)) {
    const url = c.dataBg || (c.bgImage.match(/url\("([^"]+)"\)/) || [])[1] || "";
    if (!url) continue;
    const abs = url.startsWith("http") ? url : `${BASE}${url}`;
    const res = await page.request.get(abs);
    const buf = Buffer.from(await res.body());
    pixels.push({ id: c.id, url, status: res.status(), size: buf.length, hash: sha(buf).slice(0, 16) });
  }

  const shotName = opts.mobile ? "mobile-themes" : contextLabel.replace(/[^a-z0-9]+/gi, "-");
  await page.screenshot({ path: path.join(OUT, "screenshots", `${shotName}-top.png`), fullPage: false });

  await page.evaluate(() => {
    const grid = document.querySelector("#wpGrid");
    if (grid) grid.scrollTop = Math.floor(grid.scrollHeight / 2);
  });
  await page.waitForTimeout(500);
  if (!opts.mobile) {
    await page.screenshot({ path: path.join(OUT, "screenshots", `${shotName}-mid.png`), fullPage: false });
    await page.evaluate(() => {
      const grid = document.querySelector("#wpGrid");
      if (grid) grid.scrollTop = grid.scrollHeight;
    });
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(OUT, "screenshots", `${shotName}-end.png`), fullPage: false });
  }

  let applyOk = false;
  let appliedBg = "";
  try {
    const firstCard = page.locator('#wpGrid .wpCard[data-wp-id="v2_001"]');
    await firstCard.click();
    await page.waitForTimeout(1500);
    appliedBg = await page.evaluate(() => {
      const layer = document.querySelector("#gmxWallLayer img");
      return layer?.src || document.querySelector("#gmxWallLayer")?.getAttribute("data-wall-url") || "";
    });
    applyOk = /pexels100_001\.webp/.test(appliedBg);
    if (applyOk && !opts.mobile) {
      await page.screenshot({ path: path.join(OUT, "screenshots", `${shotName}-applied.png`), fullPage: false });
    }
  } catch {}

  const consoleErrors = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });

  const fatalConsole = consoleErrors.filter((t) => /fatal|uncaught|failed to fetch/i.test(t)).length;

  await browser.close();
  return { contextLabel, dom, pixels, applyOk, appliedBg, fatalConsole };
}

const coldDir = fs.mkdtempSync(path.join(os.tmpdir(), "gmx-wp-cold-"));
const warmDir = fs.mkdtempSync(path.join(os.tmpdir(), "gmx-wp-warm-"));
const legacyDir = fs.mkdtempSync(path.join(os.tmpdir(), "gmx-wp-legacy-"));
const mobileDir = fs.mkdtempSync(path.join(os.tmpdir(), "gmx-wp-mobile-"));

const cold = await browserAudit("cold", coldDir);
const warm1 = await browserAudit("warm", warmDir);
await new Promise((r) => setTimeout(r, 1000));
const warm2 = await browserAudit("warm-reopen", warmDir);
const legacy = await browserAudit("legacy-sw-v2-seed", legacyDir, { seedLegacyCache: true });
const mobile = await browserAudit("mobile", mobileDir, { mobile: true });

// Extension portrait bytes sample
const extRows = [];
for (let i = 1; i <= 5; i++) {
  const portFile = extPortraitFilename(i);
  const portRel = `assets/extbg/${portFile}`;
  const gitPort = gitBytes("HEAD", portRel);
  const prod = await fetchBytes(`/assets/extbg/${portFile}`);
  extRows.push({
    id: `extv3_${String(i).padStart(3, "0")}`,
    portFile,
    match: sha(prod.bytes) === (gitPort ? sha(gitPort) : ""),
    size: prod.bytes.length,
    ct: prod.ct,
  });
}

const report = {
  at: new Date().toISOString(),
  head: HEAD,
  assetRev: ASSET_REV,
  byteRows,
  extRows,
  contactSheets: sheets,
  cold,
  warm: warm1,
  warmReopen: warm2,
  legacy,
  mobile,
  summary: {
    byteMatch: byteRows.filter((r) => r.match).length,
    bytePhoto: byteRows.filter((r) => r.photograph).length,
    byteOldGrad: byteRows.filter((r) => r.oldGradient).length,
    coldVersioned: cold.dom.versionedUrls,
    legacyVersioned: legacy.dom.versionedUrls,
    extMatch: extRows.filter((r) => r.match).length,
  },
};

fs.writeFileSync(path.join(OUT, "report.json"), JSON.stringify(report, null, 2));

const pass =
  byteRows.every((r) => r.match && r.photograph && !r.oldGradient) &&
  byteRows.every((r) => r.landMatch && r.portMatch) &&
  cold.dom.builtin === 100 &&
  cold.dom.versionedUrls >= 20 &&
  cold.dom.legacyUrls === 0 &&
  legacy.dom.versionedUrls >= 20 &&
  legacy.dom.legacyUrls === 0 &&
  cold.applyOk &&
  warm2.dom.versionedUrls >= 20 &&
  extRows.every((r) => r.match && r.size > 1000);

console.log("PROD_WALLPAPER_ACCEPTANCE", pass ? "PASS" : "FAIL");
console.log("SUMMARY", JSON.stringify(report.summary));
if (!pass) process.exit(1);
