import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

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
if (!appJs.includes("function readGenParams(")) fail("readGenParams missing in app.js");
if (!appJs.includes("function setWallpaperLayerImage(")) fail("setWallpaperLayerImage missing in app.js");
const packFns = (appJs.match(/function packsForKind\(/g) || []).length;
if (packFns !== 1) fail(`expected 1 packsForKind(), found ${packFns}`);
if (/if \(!packLocked && pack && pack\.style\) style = pack\.style/.test(appJs)) {
  fail("generate still overrides style from pack");
}

const check = spawnSync(process.execPath, ["--check", publicJs], { encoding: "utf8" });
if (check.status !== 0) fail(`app.js syntax: ${check.stderr || check.stdout}`);

console.log("SMOKE_OK");
