#!/usr/bin/env node
/** Production acceptance gate for Themes V4 — sitev4 + extskin_v4 byte parity. */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "../..");
const PROD = String(process.env.PROD_BASE || "https://www.gmxreply.com").replace(/\/$/, "");
const SAMPLE = 20;
const REV = fs.readFileSync(path.join(ROOT, "public", "app.js"), "utf8").match(/ASSET_REV = "([^"]+)"/)?.[1] || "";

async function get(path, binary = false) {
  const url = `${PROD}${path}`;
  const retries = Math.max(1, Number(process.env.PROD_VERIFY_RETRIES || 6));
  const timeoutMs = Math.max(5000, Number(process.env.PROD_VERIFY_TIMEOUT_MS || 30000));
  let lastErr = null;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const r = await fetch(url, { cache: "no-store", redirect: "follow", signal: AbortSignal.timeout(timeoutMs) });
      if (binary) {
        const buf = Buffer.from(await r.arrayBuffer());
        return { status: r.status, buf };
      }
      return { status: r.status, text: await r.text() };
    } catch (err) {
      lastErr = err;
      if (attempt < retries) {
        const waitMs = Math.min(20000, 4000 * attempt);
        console.log(`  retry ${attempt}/${retries - 1} in ${waitMs}ms (${path})`);
        await new Promise((resolve) => setTimeout(resolve, waitMs));
      }
    }
  }
  throw lastErr || new Error(`fetch failed: ${path}`);
}

const report = {
  commit: "",
  assetRev: REV,
  site: { match: 0, mismatch: 0, missing: 0 },
  ext: { match: 0, mismatch: 0, missing: 0 },
  runtime: {},
  verdict: "",
};

const health = await get("/api/health").then((r) => JSON.parse(r.text));
report.commit = health?.build || "";

const wpJs = await get("/app.wallpapers.js");
report.runtime.sitev4Paths = wpJs.text.includes("sitev4_");
report.runtime.extskinPaths = wpJs.text.includes("extskin_v4_");
report.runtime.extCount60 = /EXT_PACK_COUNT = 60/.test(wpJs.text);

const appJs = await get("/app.js");
report.runtime.assetRev = appJs.text.match(/ASSET_REV = "([^"]+)"/)?.[1] || "";

const sw = await get("/sw.js");
report.runtime.swCache = sw.text.match(/const CACHE = "([^"]+)"/)?.[1] || "";
report.runtime.extskinsInSw = sw.text.includes("/assets/extskins/");

function sha256(buf) {
  return crypto.createHash("sha256").update(buf).digest("hex");
}

for (let i = 1; i <= SAMPLE; i++) {
  const n = String(i).padStart(3, "0");
  const rel = `assets/wallpapers/thumbs/sitev4_${n}.webp`;
  const gitHash = sha256(fs.readFileSync(path.join(ROOT, rel)));
  const got = await get(`/assets/wallpapers/thumbs/sitev4_${n}.webp?v=${REV}`, true);
  if (got.status !== 200) report.site.missing++;
  else if (sha256(got.buf) === gitHash) report.site.match++;
  else report.site.mismatch++;
}

for (let i = 1; i <= SAMPLE; i++) {
  const n = String(i).padStart(3, "0");
  const rel = `assets/extskins/thumbs/extskin_v4_${n}.webp`;
  const gitHash = sha256(fs.readFileSync(path.join(ROOT, rel)));
  const got = await get(`/assets/extskins/thumbs/extskin_v4_${n}.webp?v=${REV}`, true);
  if (got.status !== 200) report.ext.missing++;
  else if (sha256(got.buf) === gitHash) report.ext.match++;
  else report.ext.mismatch++;
}

const sitePass = report.site.match === SAMPLE && report.site.mismatch === 0 && report.site.missing === 0;
const extPass = report.ext.match === SAMPLE && report.ext.mismatch === 0 && report.ext.missing === 0;
const runtimePass =
  report.runtime.sitev4Paths &&
  report.runtime.extskinPaths &&
  report.runtime.extCount60 &&
  report.runtime.assetRev === REV &&
  report.runtime.swCache === "gmx-shell-v4";

if (sitePass && extPass && runtimePass) {
  report.verdict = "THEMES_V2_FULLY_ACCEPTED";
  console.log("SITE_WALLPAPERS_V2_FULLY_ACCEPTED");
  console.log("EXTENSION_SKINS_V2_FULLY_ACCEPTED");
  console.log("THEMES_V2_FULLY_ACCEPTED");
} else if (sitePass && runtimePass) {
  report.verdict = "SITE_WALLPAPERS_V2_FULLY_ACCEPTED";
} else if (extPass && runtimePass) {
  report.verdict = "EXTENSION_SKINS_V2_FULLY_ACCEPTED";
} else {
  report.verdict = "THEMES_V2_PRODUCTION_PENDING";
}

console.log(JSON.stringify(report, null, 2));
if (!sitePass || !extPass || !runtimePass) process.exit(1);
