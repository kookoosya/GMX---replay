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
if (appJs) {
  if (!/SITE_WALLPAPER_PACK_COUNT = 58/.test(appJs)) fail("SITE_WALLPAPER_PACK_COUNT must be 58");
  if (/function supportBundle\(/.test(appJs)) fail("supportBundle must be removed");
  if (/initWpLazyLoad/.test(appJs)) fail("initWpLazyLoad must be removed");
  if (!/applyRefCountEligible/.test(appJs)) fail("applyRefCountEligible helper missing");
  if (/source\.unsplash\.com/.test(appJs)) fail("unsplash wallpaper URLs forbidden");
}

const appHtml = readIfExists(publicHtml);
if (appHtml && /id="supportOut"/.test(appHtml)) fail('supportOut must be removed from app.html');

console.log("SMOKE_OK");
