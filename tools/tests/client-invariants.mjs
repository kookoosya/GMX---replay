#!/usr/bin/env node
/** Static client invariants (site bundle, extension, HTML). */
import fs from "node:fs";
import { fail, ok } from "./_helpers.mjs";

const appPaths = ["public/app.js", "frontend/public/app.js"];

for (const rel of appPaths) {
  if (!fs.existsSync(rel)) continue;
  const text = fs.readFileSync(rel, "utf8");
  const packFn = (text.match(/function packsForKind\(/g) || []).length;
  if (packFn !== 1) fail(`${rel}: expected 1 packsForKind(), found ${packFn}`);
  if (!text.includes("function readGenParams(")) fail(`${rel}: missing readGenParams`);
  if (!text.includes("function setWallpaperLayerImage(")) fail(`${rel}: missing setWallpaperLayerImage`);
  const genFlowPath = rel.replace(/app\.js$/, "app.generateflow.js");
  const genFlowText = fs.existsSync(genFlowPath) ? fs.readFileSync(genFlowPath, "utf8") : "";
  const readGenParamsPat = /\{ mode, lang, style, antiN \} = readGenParams\(kind\)/;
  if (!readGenParamsPat.test(text) && !readGenParamsPat.test(genFlowText)) {
    fail(`${rel}: generate() must read mode/lang/style/antiN via readGenParams`);
  }
  if (/if \(!packLocked && pack && pack\.style\) style = pack\.style/.test(text)) {
    fail(`${rel}: must not override style from pack on every generate`);
  }
  if (/anti_last_n=0&count=\$\{reqCount\}/.test(text)) {
    fail(`${rel}: bulk/refill must not hardcode anti_last_n=0`);
  }
  if (!/SITE_WALLPAPER_PACK_COUNT = (?:58|__gmxWp\.SITE_PACK_COUNT)/.test(text)) {
    fail(`${rel}: wallpaper count must be 58`);
  }
  ok(rel);
}

const billingRoute = fs.readFileSync("server/routes/billing.mjs", "utf8");
if (!billingRoute.includes("/api/billing/tx-context")) {
  fail("server/routes/billing.mjs: missing /api/billing/tx-context alias");
}

const popup = fs.readFileSync("extension/popup.js", "utf8");
if (/\/api\/generate-bulk\?/.test(popup)) {
  fail("extension/popup.js: authenticated batch must not use /api/generate-bulk");
}
if (!popup.includes("/api/random-bulk")) {
  fail("extension/popup.js: should call /api/random-bulk when authed");
}
ok("extension/popup.js");

console.log("CLIENT_INVARIANTS_OK");
