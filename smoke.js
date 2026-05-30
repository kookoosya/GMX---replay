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
const arcadeJs = path.join(root, "public", "arcade.js");
const bridgeAssetsDir = path.join(root, "public", "bridge", "assets");
const bridgeIndex = path.join(root, "public", "bridge", "index.html");

const bridgeShellFiles = listFiles(bridgeAssetsDir).filter((f) =>
  /app-shell-.*\.js$/i.test(path.basename(f))
);

const corpusFiles = [publicHtml, publicJs, arcadeJs, bridgeIndex, ...bridgeShellFiles].filter((f) =>
  fs.existsSync(f)
);

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

if (!fs.existsSync(arcadeJs)) {
  fail("missing public/arcade.js");
}
if (!/RAW_GAMES/.test(readIfExists(arcadeJs))) {
  fail("arcade.js missing RAW_GAMES catalog");
}

if (!bridgeShellFiles.length) {
  fail("no app-shell-*.js bundle in public/bridge/assets (run npm run build)");
}

// Optional: health check when server is already running (local/CI with service)
const healthUrl = process.env.SMOKE_HEALTH_URL || "";
if (healthUrl) {
  const probe = spawnSync("node", ["-e", `fetch(${JSON.stringify(healthUrl)}).then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))`], {
    stdio: "inherit",
    timeout: 15000,
  });
  if (probe.status !== 0) {
    fail(`health check failed: ${healthUrl}`);
  }
}

console.log("SMOKE_OK");
