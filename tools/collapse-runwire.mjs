#!/usr/bin/env node
/**
 * Merge app.*runwire.js grouped-ctx adapters into wire modules.
 * Run: node tools/collapse-runwire.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PUBLIC = path.join(ROOT, "public");
const SITE_SRC = path.join(ROOT, "site-src");

/** @type {[string, string, string, string, string][]} */
const PAIRS = [
  ["app.connectwire.js", "app.connectrunwire.js", "__GMXConnectWireFactory", "__GMXConnectRunWireFactory", "ctx.core"],
  ["app.redeemwire.js", "app.redeemrunwire.js", "__GMXRedeemWireFactory", "__GMXRedeemRunWireFactory", "ctx.core"],
  ["app.adminwire.js", "app.adminrunwire.js", "__GMXAdminWireFactory", "__GMXAdminRunWireFactory", "ctx.core"],
  ["app.leaderboardwire.js", "app.leaderboardrunwire.js", "__GMXLeaderboardWireFactory", "__GMXLeaderboardRunWireFactory", "ctx.core"],
  ["app.predictionwire.js", "app.predictionrunwire.js", "__GMXPredictionWireFactory", "__GMXPredictionRunWireFactory", "ctx.core"],
  ["app.referralswire.js", "app.referralsrunwire.js", "__GMXReferralsWireFactory", "__GMXReferralsRunWireFactory", "ctx.core"],
  ["app.walletwire.js", "app.walletrunwire.js", "__GMXWalletWireFactory", "__GMXWalletRunWireFactory", "ctx.core"],
  ["app.themeswire.js", "app.themesrunwire.js", "__GMXThemesWireFactory", "__GMXThemesRunWireFactory", "ctx.core"],
  ["app.wallpaperswire.js", "app.wallpapersrunwire.js", "__GMXWallpapersWireFactory", "__GMXWallpapersRunWireFactory", "ctx.keys"],
  ["app.shelldepswire.js", "app.shelldepsrunwire.js", "__GMXShellDepsWireFactory", "__GMXShellDepsRunWireFactory", "ctx.mod"],
  ["app.bankuiwire.js", "app.bankuirunwire.js", "__GMXBankUiWireFactory", "__GMXBankUiRunWireFactory", "ctx.core"],
  ["app.generatewire.js", "app.generaterunwire.js", "__GMXGenerateWireFactory", "__GMXGenerateRunWireFactory", "ctx.core"],
  ["app.chromewire.js", "app.chromerunwire.js", "__GMXChromeWireFactory", "__GMXChromeRunWireFactory", "ctx.mod"],
  ["app.siteinitwire.js", "app.siteinitrunwire.js", "__GMXSiteInitWireFactory", "__GMXSiteInitRunWireFactory", "ctx.mod"],
];

function extractAdapterBlock(runwireSrc) {
  const marker = "ctx = ctx || {};";
  const start = runwireSrc.indexOf(marker);
  if (start < 0) throw new Error("runwire missing ctx marker");
  const bodyStart = start + marker.length;
  const runMatch = runwireSrc.slice(bodyStart).search(/\n\s*(async )?function run\(\)/);
  if (runMatch < 0) throw new Error("runwire missing run()");
  let block = runwireSrc.slice(bodyStart, bodyStart + runMatch).trim();

  if (/function (buildWireCtx|flattenCtx)\(\)/.test(block)) {
    block = block
      .replace(/function buildWireCtx\(\)\s*\{\s*return\s*/s, "ctx = ")
      .replace(/function flattenCtx\(\)\s*\{\s*return\s*/s, "ctx = ")
      .replace(/;\s*\}\s*$/s, ";");
  } else if (block.includes("ShellDepsWireFactory")) {
    const obj = block.match(/ShellDepsWireFactory\(\{([\s\S]*?)\}\)/);
    if (!obj) throw new Error("shelldeps object not found");
    block = `const keys = ctx.keys || {};\n      const mod = ctx.mod || {};\n      ctx = {${obj[1]}};`;
  }
  return block;
}

function mergePair(wireName, runwireName, guardExpr) {
  const wirePath = path.join(PUBLIC, wireName);
  const runwirePath = path.join(PUBLIC, runwireName);
  const runwireSrc = fs.readFileSync(runwirePath, "utf8");
  let wireSrc = fs.readFileSync(wirePath, "utf8");
  const block = extractAdapterBlock(runwireSrc);
  const adapter = `
    if (${guardExpr}) {
      ${block}
    }`;

  if (wireName === "app.shelldepswire.js") {
    const marker = "function createGMXShellDepsWire(ctx) {";
    if (!wireSrc.includes(marker)) throw new Error("shelldeps marker missing");
    wireSrc = wireSrc.replace(marker, `${marker}\n    ctx = ctx || {};${adapter}`);
  } else {
    const marker = "ctx = ctx || {};";
    if (!wireSrc.includes(marker)) throw new Error(`${wireName}: missing ctx marker`);
    if (wireSrc.includes("if (ctx.core)") || wireSrc.includes("if (ctx.mod)")) {
      console.log(`skip ${wireName}`);
      return;
    }
    wireSrc = wireSrc.replace(marker, `${marker}${adapter}`);
  }

  fs.writeFileSync(wirePath, wireSrc);
  fs.unlinkSync(runwirePath);
  console.log(`merged ${runwireName} -> ${wireName}`);
}

// cleanfill: runwire wraps cleanfillrun — rename export on runwire file into cleanfillrun
function mergeCleanFill() {
  const runPath = path.join(PUBLIC, "app.cleanfillrunwire.js");
  const targetPath = path.join(PUBLIC, "app.cleanfillrun.js");
  const runwireSrc = fs.readFileSync(runPath, "utf8");
  let target = fs.readFileSync(targetPath, "utf8");
  if (target.includes("__GMXCleanFillRunFromGrouped")) {
    console.log("skip cleanfill (merged)");
    fs.unlinkSync(runPath);
    return;
  }

  const groupedFactory = runwireSrc
    .replace("__GMXCleanFillRunWireFactory", "__GMXCleanFillRunFromGrouped")
    .replace("createGMXCleanFillRunWire", "createGMXCleanFillRunFromGrouped");

  const marker = "})(window);\n";
  target = target.replace(
    marker,
    `

  ${groupedFactory.replace(/^\(function \(window\) \{[\s\S]*?if \(window\.__GMXCleanFillRunFromGrouped\) return;\s*/m, "").replace(/\}\)\(window\);\s*$/, "")}
${marker}`
  );

  // Simpler: append alias at end
  const alias = `
(function (window) {
  if (window.__GMXCleanFillRunGroupedFactory) return;
  const runwire = ${runwireSrc.match(/window\.__GMXCleanFillRunWireFactory = function[\s\S]+/)?.[0]?.replace("__GMXCleanFillRunWireFactory", "__GMXCleanFillRunGroupedFactory") || "null"};
  window.__GMXCleanFillRunFactory = function createGMXCleanFillRun(ctx) {
    ctx = ctx || {};
    if (ctx.format || ctx.cleanfill || ctx.gen) {
      return window.__GMXCleanFillRunGroupedFactory(ctx);
    }
    return window.__GMXCleanFillRunCoreFactory(ctx);
  };
})(window);
`;
  // Too messy - inline at site-src level instead

  fs.writeFileSync(targetPath, target);
  fs.unlinkSync(runPath);
  console.log("merged app.cleanfillrunwire.js (manual alias needed)");
}

const htmlPath = path.join(PUBLIC, "app.html");
let html = fs.readFileSync(htmlPath, "utf8");
const siteFiles = fs.readdirSync(SITE_SRC).filter((f) => f.endsWith(".js"));

for (const [wireName, runwireName, wireFactory, runwireFactory, guardExpr] of PAIRS) {
  mergePair(wireName, runwireName, guardExpr);
  html = html.replaceAll(`<script defer src="/${runwireName}?v=SAFE17"></script>\n`, "");
  html = html.replaceAll(`<script defer src="/${runwireName}?v=SAFE17"></script>`, "");

  for (const sf of siteFiles) {
    const p = path.join(SITE_SRC, sf);
    let s = fs.readFileSync(p, "utf8");
    const before = s;
    s = s.replaceAll(runwireFactory, wireFactory);
    if (wireName !== "app.siteinitwire.js") {
      s = s.replace(
        new RegExp(`(${wireFactory.replace(/\$/g, "\\$")}\\([\\s\\S]*?\\))\\.run\\(\\)`, "g"),
        "$1"
      );
    }
    if (s !== before) fs.writeFileSync(p, s);
  }
}

// cleanfill: keep runwire logic, merge into same file as cleanfillrun by renaming factory
{
  const runwirePath = path.join(PUBLIC, "app.cleanfillrunwire.js");
  const targetPath = path.join(PUBLIC, "app.cleanfillrun.js");
  const runwireSrc = fs.readFileSync(runwirePath, "utf8");
  let target = fs.readFileSync(targetPath, "utf8");
  target = target.replace(
    "window.__GMXCleanFillRunFactory = function createGMXCleanFillRun(ctx)",
    "window.__GMXCleanFillRunCoreFactory = function createGMXCleanFillRunCore(ctx)"
  );
  const grouped = runwireSrc.replace(
    /window\.__GMXCleanFillRunWireFactory = function createGMXCleanFillRunWire\(ctx\) \{([\s\S]*)\};\s*\}\)\(window\);/,
    "window.__GMXCleanFillRunFactory = function createGMXCleanFillRun(ctx) {$1};"
  );
  target = target.replace(/\}\)\(window\);\s*$/, "");
  target += `\n${grouped}\n`;
  fs.writeFileSync(targetPath, target);
  fs.unlinkSync(runwirePath);
  html = html.replaceAll(`<script defer src="/app.cleanfillrunwire.js?v=SAFE17"></script>\n`, "");
  html = html.replaceAll(`<script defer src="/app.cleanfillrunwire.js?v=SAFE17"></script>`, "");
  for (const sf of siteFiles) {
    const p = path.join(SITE_SRC, sf);
    let s = fs.readFileSync(p, "utf8");
    s = s.replaceAll("__GMXCleanFillRunWireFactory", "__GMXCleanFillRunFactory");
    fs.writeFileSync(p, s);
  }
  console.log("merged app.cleanfillrunwire.js -> app.cleanfillrun.js");
}

fs.writeFileSync(htmlPath, html);

for (const rel of ["tools/logic-audit.mjs", "tools/sync-site-public.mjs"]) {
  const p = path.join(ROOT, rel);
  let s = fs.readFileSync(p, "utf8");
  for (const [, runwireName] of [...PAIRS, ["", "app.cleanfillrunwire.js"]]) {
    if (!runwireName) continue;
    s = s.replace(new RegExp(`\\s*"${runwireName.replace(".", "\\.")}",\\n`, "g"), "\n");
    s = s.replace(new RegExp(`\\s*mustMatch\\(rel, /${runwireName.replace(".", "\\.")}/[^\\n]+\\n`, "g"), "");
  }
  fs.writeFileSync(p, s);
}

console.log("\nDone. Run: npm run build:site && node tools/generate-client-manifest.mjs && node tools/sync-app-and-assets.mjs");
