#!/usr/bin/env node
/**
 * Real Chrome extension runtime smoke (Load unpacked via Playwright persistent context).
 * Run: npm run test:extension:chrome
 */
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { chromium } from "playwright";
import { fileURLToPath } from "node:url";
import { fail, ok, freshSmokeHandle } from "./_helpers.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..", "..");
const extDir = path.join(root, "extension");
const manifest = JSON.parse(fs.readFileSync(path.join(extDir, "manifest.json"), "utf8"));
const BASE = String(process.env.EXT_RUNTIME_BASE || "https://www.gmxreply.com").replace(/\/$/, "");

const GM_LINES = [
  "gm runtime English ☀️",
  "доброе утро — GM sync test",
];
const GN_LINES = [
  "gn runtime night 🌙",
  "おやすみ — GN sync test",
];

function assertNoErrors(errors, label) {
  if (errors.length) fail(`${label}: ${errors.join(" | ")}`);
}

async function getExtensionId(context) {
  const page = await context.newPage();
  await page.goto("about:blank");
  let sw = context.serviceWorkers().find((w) => w.url().startsWith("chrome-extension://"));
  if (!sw) {
    try {
      sw = await context.waitForEvent("serviceworker", { timeout: 45000 });
    } catch {
      await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded", timeout: 30000 }).catch(() => {});
      sw = context.serviceWorkers().find((w) => w.url().startsWith("chrome-extension://"));
    }
  }
  if (!sw) fail("extension service worker did not register");
  const url = sw.url();
  const m = url.match(/^chrome-extension:\/\/([^/]+)\//);
  if (!m) fail(`could not parse extension id from ${url}`);
  await page.close().catch(() => {});
  return m[1];
}

async function main() {
  console.log(`Extension Chrome runtime smoke (v${manifest.version}, no tabs permission)`);
  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), "gmx-ext-runtime-"));
  const errors = [];

  const context = await chromium.launchPersistentContext(userDataDir, {
    headless: false,
    args: [
      `--disable-extensions-except=${extDir}`,
      `--load-extension=${extDir}`,
    ],
  });

  try {
    const extId = await getExtensionId(context);
    ok(`extension loaded id=${extId.slice(0, 8)}… version=${manifest.version}`);

    const sidePage = await context.newPage();
    sidePage.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
    sidePage.on("console", (msg) => {
      if (msg.type() === "error") errors.push(`console: ${msg.text()}`);
    });

    await sidePage.goto(`chrome-extension://${extId}/sidepanel.html`);
    await sidePage.waitForSelector("body[data-view='sidepanel']");
    await sidePage.waitForSelector("#btnRefresh");
    const versionText = await sidePage.locator("#versionLabel").textContent();
    if (!String(versionText || "").includes(manifest.version)) {
      fail(`sidepanel version mismatch: ${versionText}`);
    }
    ok("sidepanel.html loads without manifest errors");

    const sitePage = await context.newPage();
    const handle = freshSmokeHandle("extrt").replace(/^@+/, "");
    const initRes = await fetch(`${BASE}/api/user/init`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ handle }),
    });
    const initJson = await initRes.json();
    if (!initRes.ok || !initJson?.token) fail(`api init failed: ${initRes.status}`);

    await sitePage.goto(`${BASE}/app`);
    await sitePage.evaluate(
      ({ handle, token, gm, gn }) => {
        localStorage.setItem("gmx_handle", handle);
        localStorage.setItem("gmx_token", token);
        localStorage.setItem("gmx_gm_bank", gm.join("\n"));
        localStorage.setItem("gmx_gn_bank", gn.join("\n"));
      },
      { handle, token: initJson.token, gm: GM_LINES, gn: GN_LINES }
    );
    ok(`site session seeded @${handle}`);

    const syncViaSide = await sidePage.evaluate(async () => {
      if (typeof chrome?.tabs?.query !== "function") return { ok: false, error: "no_tabs_api" };
      const tabs = await chrome.tabs.query({ url: ["https://www.gmxreply.com/*", "https://gmxreply.com/*"] });
      if (!tabs.length) return { ok: false, error: "no_site_tab" };
      try {
        return await chrome.tabs.sendMessage(tabs[0].id, { type: "GMX_FORCE_SITE_SYNC" });
      } catch (e) {
        return { ok: false, error: String(e.message || e) };
      }
    });

    if (!syncViaSide?.ok) fail(`site sync via tabs API failed: ${JSON.stringify(syncViaSide)}`);
    ok("GMX_FORCE_SITE_SYNC works without tabs permission (host_permissions)");

    await sidePage.waitForTimeout(800);
    await sidePage.click("#btnRefresh");
    await sidePage.waitForTimeout(1200);

    const expectedHandle = String(initJson.handle || handle).replace(/^@+/, "");

    const storage = await sidePage.evaluate(async () => {
      const data = await chrome.storage.local.get([
        "gmx_ext_bank_gm_v1",
        "gmx_ext_bank_gn_v1",
        "gmx_ext_handle_v2",
        "gmx_ext_token_v2",
      ]);
      return data;
    });

    const gmBank = JSON.parse(storage.gmx_ext_bank_gm_v1 || "[]");
    const gnBank = JSON.parse(storage.gmx_ext_bank_gn_v1 || "[]");
    if (!gmBank.includes(GM_LINES[0]) || !gmBank.includes(GM_LINES[1])) {
      fail(`GM bank missing runtime lines: ${JSON.stringify(gmBank)}`);
    }
    if (!gnBank.includes(GN_LINES[0]) || !gnBank.includes(GN_LINES[1])) {
      fail(`GN bank missing runtime lines: ${JSON.stringify(gnBank)}`);
    }
    if (String(storage.gmx_ext_handle_v2 || "").replace(/^@+/, "") !== expectedHandle) {
      fail(`handle not synced (got=${storage.gmx_ext_handle_v2} expected=${expectedHandle})`);
    }
    if (!storage.gmx_ext_token_v2) fail("token not synced");
    ok("GM/GN banks and session synced with Unicode preserved");

    await sidePage.click("#tabGn");
    await sidePage.waitForTimeout(200);
    const gnTexts = await sidePage.locator(".spCardText").allTextContents();
    if (!gnTexts.includes(GN_LINES[0]) || !gnTexts.includes(GN_LINES[1])) {
      fail(`GN tab wrong content: ${JSON.stringify(gnTexts)}`);
    }
    ok("GM/GN tabs remain separate");

    const copied = await sidePage.evaluate(async () => {
      let captured = "";
      navigator.clipboard.writeText = async (text) => {
        captured = text;
      };
      const btn = document.querySelector(".spCard .primary.compact");
      btn?.click();
      await new Promise((r) => setTimeout(r, 400));
      return captured;
    });
    if (copied !== GN_LINES[0]) fail(`clipboard mismatch: ${JSON.stringify(copied)}`);
    ok("Copy preserves exact Unicode string");

    await sidePage.click("summary");
    await sidePage.click("#disconnectBtn");
    await sidePage.waitForTimeout(300);
    const afterLogout = await sidePage.evaluate(async () => chrome.storage.local.get([
      "gmx_ext_token_v2",
      "gmx_ext_bank_gm_v1",
      "gmx_ext_bank_gn_v1",
    ]));
    if (afterLogout.gmx_ext_token_v2 || afterLogout.gmx_ext_bank_gm_v1) {
      fail("logout did not clear private cache");
    }
    ok("logout clears token and bank cache");

    assertNoErrors(errors, "sidepanel console");
    console.log("EXTENSION_CHROME_RUNTIME_OK");
  } finally {
    await context.close();
    try {
      fs.rmSync(userDataDir, { recursive: true, force: true });
    } catch {}
  }
}

main().catch((err) => {
  console.error(err?.stack || err);
  process.exit(1);
});
