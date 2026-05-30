import fs from "node:fs";
import path from "node:path";

function fail(msg) {
  console.error(`SMOKE_FAIL: ${msg}`);
  process.exit(1);
}

function readIfExists(file) {
  try {
    return fs.existsSync(file) ? fs.readFileSync(file, "utf8") : "";
  } catch {
    return "";
  }
}

function listFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...listFiles(full));
    else out.push(full);
  }
  return out;
}

const root = process.cwd();

const publicHtml = path.join(root, "public", "app.html");
const publicJs = path.join(root, "public", "app.js");
const bridgeAssetsDir = path.join(root, "public", "bridge", "assets");

const bridgeShellFiles = listFiles(bridgeAssetsDir).filter((f) =>
  /legacy-shell-.*\.js$/i.test(path.basename(f))
);

const corpusFiles = [publicHtml, publicJs, ...bridgeShellFiles].filter((f) => fs.existsSync(f));

if (!corpusFiles.length) {
  fail("no app shell files found");
}

const corpus = corpusFiles.map((f) => readIfExists(f)).join("\n");

function mustHaveId(id) {
  const rx = new RegExp(`id=["']${id}["']`);
  if (!rx.test(corpus)) {
    fail(`missing id="${id}"`);
  }
}

mustHaveId("gmRand1");
mustHaveId("gmRand10");
mustHaveId("gnRand1");
mustHaveId("gnRand10");

const appJs = readIfExists(publicJs);
if (!appJs) fail("missing public/app.js");
if (!appJs.includes("SITE_WALLPAPER_PACK_COUNT = 58")) fail("wallpaper pack count not 58");
if (!appJs.includes("const antiN = antiWindow(strength);")) fail("generate anti-repeat disabled");
if (appJs.includes("const antiN = 0;")) fail("generate antiN hardcoded to 0");
if (appJs.includes("supportBundle")) fail("support bundle still in app.js");
if (appJs.includes('setPh("supportOut"')) fail("supportOut placeholder still wired");
if (appJs.includes("sitePackWallpaperDataUri(norm, false)")) fail("site wallpapers still use data-uri generator");

const extPopup = readIfExists(path.join(root, "extension", "popup.js"));
if (!extPopup) fail("missing extension/popup.js");
if (!extPopup.includes("async function removeState")) fail("extension removeState missing");
if (extPopup.includes("extPackWallpaperDataUri(id, false)")) fail("extension resolve still uses data-uri wallpapers");

console.log("SMOKE_OK");
