#!/usr/bin/env node
/** Production acceptance gate for Themes V5 — sitev5 + extskin_v5 byte parity. */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const BASE = process.env.GMX_PROD_BASE || "https://gmxreply.com";
const REV = fs.readFileSync(path.join(ROOT, "public", "app.js"), "utf8").match(/ASSET_REV = "([^"]+)"/)?.[1] || "";

const report = { runtime: {}, site: [], ext: [], ok: false };

async function get(urlPath, bytes = false) {
  const res = await fetch(`${BASE}${urlPath}`, { cache: "no-store", redirect: "follow" });
  if (!bytes) return { status: res.status, text: await res.text() };
  return { status: res.status, buf: Buffer.from(await res.arrayBuffer()) };
}

function sha(buf) {
  return crypto.createHash("sha256").update(buf).digest("hex");
}

const wpJs = await get("/app.wallpapers.js");
const appJs = await get("/app.js");
const swJs = await get("/sw.js");

report.runtime.sitev5Paths = wpJs.text.includes("sitev5_");
report.runtime.extskinPaths = wpJs.text.includes("extskin_v5_");
report.runtime.noV4 =
  !wpJs.text.includes("sitev4_") && !wpJs.text.includes("extskin_v4_");
report.runtime.assetRev = appJs.text.match(/ASSET_REV = "([^"]+)"/)?.[1] || "";
report.runtime.swCache = swJs.text.match(/const CACHE = "([^"]+)"/)?.[1] || "";

const siteSlots = [
  ...Array.from({ length: 12 }, (_, i) => i + 1),
  ...Array.from({ length: 8 }, (_, i) => 13 + i),
  ...Array.from({ length: 12 }, (_, i) => 25 + i),
];
const extSlots = [
  ...Array.from({ length: 10 }, (_, i) => i + 1),
  ...Array.from({ length: 10 }, (_, i) => 16 + i),
  ...Array.from({ length: 12 }, (_, i) => 31 + i),
];

for (const n of siteSlots.slice(0, 20)) {
  const pad = String(n).padStart(3, "0");
  const rel = `assets/wallpapers/thumbs/sitev5_${pad}.webp`;
  const local = path.join(ROOT, rel);
  const got = await get(`/assets/wallpapers/thumbs/sitev5_${pad}.webp?v=${REV}`, true);
  const localHash = fs.existsSync(local) ? sha(fs.readFileSync(local)) : "";
  const prodHash = got.status === 200 ? sha(got.buf) : "";
  report.site.push({ n, status: got.status, match: localHash && prodHash === localHash });
}

for (const n of extSlots.slice(0, 20)) {
  const pad = String(n).padStart(3, "0");
  const rel = `assets/extskins/thumbs/extskin_v5_${pad}.webp`;
  const local = path.join(ROOT, rel);
  const got = await get(`/assets/extskins/thumbs/extskin_v5_${pad}.webp?v=${REV}`, true);
  const localHash = fs.existsSync(local) ? sha(fs.readFileSync(local)) : "";
  const prodHash = got.status === 200 ? sha(got.buf) : "";
  report.ext.push({ n, status: got.status, match: localHash && prodHash === localHash });
}

const siteMatch = report.site.filter((r) => r.match).length;
const extMatch = report.ext.filter((r) => r.match).length;

report.ok =
  report.runtime.sitev5Paths &&
  report.runtime.extskinPaths &&
  report.runtime.noV4 &&
  report.runtime.assetRev === REV &&
  report.runtime.swCache === "gmx-shell-v5";

console.log(JSON.stringify({ ...report, siteMatch, extMatch }, null, 2));
if (!report.ok) process.exit(1);
