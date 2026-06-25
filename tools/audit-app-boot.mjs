#!/usr/bin/env node
/**
 * Boot bundle inventory — deferred scripts in public/app.html.
 * Run: node tools/audit-app-boot.mjs [--json]
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getScriptOrder, loadClientManifest } from "./lib/client-manifest.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const publicDir = path.join(root, "public");
const frontendPublic = path.join(root, "frontend", "public");
const chunkManifestPath = path.join(root, "tools", "app-chunk-manifest.json");

const BASELINE_DEFER_COUNT = 9;
const jsonOut = process.argv.includes("--json");

const chunkManifest = JSON.parse(fs.readFileSync(chunkManifestPath, "utf8"));
const chunkSourceFiles = new Set(
  (chunkManifest.chunks || []).flatMap((chunk) => chunk.files.map((f) => path.basename(f)))
);
const chunkOutputs = (chunkManifest.chunks || []).map((c) => c.out);

function categorizeScript(rel) {
  const base = path.basename(rel);
  if (base === "app.js") return "entry";
  if (rel.startsWith("chunks/")) return "chunk";
  if (rel.startsWith("i18n/")) return "i18n";
  if (/^app\.bootstrap\w+wire\.js$/.test(base)) return "bootstrap-wire";
  if (/wire\.js$/.test(base)) return "feature-wire";
  if (/^app\.sitei18n/.test(base) || base === "app.i18nui.js" || base === "app.i18nbridge.js") {
    return "i18n-runtime";
  }
  return "module";
}

function fileSize(rel) {
  const p = path.join(publicDir, rel);
  if (!fs.existsSync(p)) return 0;
  return fs.statSync(p).size;
}

const manifest = loadClientManifest();
const scriptOrder = getScriptOrder();

const issues = [];
if (scriptOrder.length !== BASELINE_DEFER_COUNT) {
  issues.push(`defer script count ${scriptOrder.length} != baseline ${BASELINE_DEFER_COUNT}`);
}

for (const out of chunkOutputs) {
  if (!fs.existsSync(path.join(publicDir, out))) {
    issues.push(`missing built chunk: ${out} (run: node tools/build-app-chunks.mjs)`);
  }
}

const categories = {};
let totalBytes = 0;
const rows = [];
for (const rel of scriptOrder) {
  const cat = categorizeScript(rel);
  categories[cat] = (categories[cat] || 0) + 1;
  const bytes = fileSize(rel);
  totalBytes += bytes;
  rows.push({ rel, cat, bytes });
}

const publicAppJs = fs
  .readdirSync(publicDir)
  .filter((name) => name.startsWith("app.") && name.endsWith(".js") && name !== "app.js");

const lazyTabCandidates = [
  "app.admin.js",
  "app.adminwire.js",
  "app.prediction.js",
  "app.predictionwire.js",
  "app.walletpay.js",
  "app.walletui.js",
  "app.wallethelpers.js",
  "app.walletwire.js",
  "app.leaderboard.js",
  "app.leaderboardwire.js",
  "app.referrals.js",
  "app.referralswire.js",
  "app.redeem.js",
  "app.redeemwire.js",
];

const loadedBases = new Set(scriptOrder.map((s) => path.basename(s)));
const lazyBases = new Set(lazyTabCandidates);
const orphanPublic = publicAppJs.filter(
  (name) => !loadedBases.has(name) && !lazyBases.has(name) && !chunkSourceFiles.has(name)
);
if (orphanPublic.length) {
  issues.push(`orphan public app scripts not in app.html: ${orphanPublic.join(", ")}`);
}

const staleRunwire = [];
if (fs.existsSync(frontendPublic)) {
  for (const name of fs.readdirSync(frontendPublic)) {
    if (/runwire\.js$/i.test(name)) staleRunwire.push(name);
  }
}
if (staleRunwire.length) {
  issues.push(`stale frontend/public *runwire.js (${staleRunwire.length}): ${staleRunwire.join(", ")}`);
}

if (fs.readdirSync(publicDir).some((name) => /runwire\.js$/i.test(name))) {
  issues.push("public/ must not contain *runwire.js (collapsed into *wire.js)");
}

const report = {
  baselineDeferCount: BASELINE_DEFER_COUNT,
  deferCount: scriptOrder.length,
  categories,
  totalBytes,
  chunkCount: chunkOutputs.length,
  chunkSourceCount: chunkSourceFiles.size,
  orphanPublic,
  staleRunwire,
  lazyTabCandidates: lazyTabCandidates.filter((s) => lazyBases.has(s)),
  lazyTabDeferred: lazyTabCandidates.filter((s) => !loadedBases.has(s)),
  bundlePhases: [
    "Phase 5a (done): collapse 15 *runwire.js into *wire.js",
    "Phase 5b (done): prune stale mirrors; audit:boot in CI",
    "Phase 5c (done): lazy tab packs via app.lazytabs.js (~14 scripts on tab activate)",
    "Phase 5d (done): esbuild shell chunks (4 chunks + i18n + app.js = 6 defer requests)",
  ],
  issues,
};

if (jsonOut) {
  console.log(JSON.stringify(report, null, 2));
} else {
  console.log("APP_BOOT_INVENTORY");
  console.log(`  defer scripts: ${report.deferCount} (baseline ${BASELINE_DEFER_COUNT})`);
  console.log(`  esbuild chunks: ${report.chunkCount} (${report.chunkSourceCount} source files)`);
  console.log(`  payload (eager defer): ${(totalBytes / 1024).toFixed(1)} KiB`);
  console.log("  categories:");
  for (const [cat, n] of Object.entries(categories).sort()) {
    console.log(`    ${cat}: ${n}`);
  }
  console.log(`  lazy-tab scripts: ${report.lazyTabDeferred.length}`);
  if (orphanPublic.length) console.log(`  orphan public: ${orphanPublic.join(", ")}`);
  if (staleRunwire.length) console.log(`  stale runwire mirrors: ${staleRunwire.length}`);
  console.log("  recommended phases:");
  for (const line of report.bundlePhases) console.log(`    - ${line}`);
}

if (issues.length) {
  console.error("\nAPP_BOOT_AUDIT_FAIL");
  for (const msg of issues) console.error(`  - ${msg}`);
  process.exit(1);
}

if (!jsonOut) console.log("\nAPP_BOOT_AUDIT_OK");
