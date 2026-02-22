import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function fail(msg){
  console.error("SMOKE_FAIL:", msg);
  process.exit(1);
}

const pub = path.join(__dirname, "public");
const appHtml = path.join(pub, "app.html");
const appJs = path.join(pub, "app.js");
if (!fs.existsSync(appHtml)) fail("public/app.html missing");
if (!fs.existsSync(appJs)) fail("public/app.js missing");

const html = fs.readFileSync(appHtml, "utf8");

// Basic sanity: required elements exist
const mustIds = [
  "tab-home","tab-gm","tab-gn","tab-referrals","tab-themes","tab-wallet",
  "gmRand1","gmRand10","gmRand70","gnRand1","gnRand10","gnRand70",
  "siteLang","xHandle","btnConnect",
  // referrals UI
  "refLink","refCopy","refLoad","refCountInline","refCountRight"
];
for (const id of mustIds){
  if (!html.includes(`id="${id}"`)) fail(`missing id="${id}"`);
}

// JS syntax check: parse public/app.js (the app code lives there)
const script = fs.readFileSync(appJs, "utf8");
try{
  new Function(script);
}catch(e){
  fail("app.js parse failed: " + (e?.message || e));
}

// STRICT: should not pass handle via querystring for protected endpoints
const badHandleUsage = [
  /\/api\/usage\?[^\s"']*handle=/i,
  /\/api\/referral\/stats\?[^\s"']*handle=/i,
  /\/api\/billing\/[a-z0-9_]+\?[^\s"']*handle=/i,
  /\/api\/generate[^\s"']*\?[^\s"']*handle=/i,
];
for (const re of badHandleUsage){
  if (re.test(script) || re.test(html)) fail(`found forbidden handle query usage: ${re}`);
}

// DOM safety: no direct $("id").onclick / .onchange / .oninput / .addEventListener patterns
const unsafeBind = /\$\("[^\"]+"\)\.(onclick|onchange|oninput|addEventListener)\b/;
if (unsafeBind.test(script)) fail("found unsafe DOM binding: $(\"id\").on*");

console.log("SMOKE_OK");
process.exit(0);
