#!/usr/bin/env node
/** Production extension package verification (copy-only Side Panel). */
import fs from "node:fs";
import path from "node:path";
import { fail, ok } from "./tests/_helpers.mjs";

const extDir = path.resolve("extension");
const manifest = JSON.parse(fs.readFileSync(path.join(extDir, "manifest.json"), "utf8"));

function read(rel) {
  return fs.readFileSync(path.join(extDir, rel), "utf8");
}

function walk(dir, out = []) {
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const st = fs.statSync(full);
    if (st.isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}

if (manifest.manifest_version !== 3) fail("manifest must be MV3");
if (!manifest.side_panel?.default_path) fail("manifest must declare side_panel.default_path");
if (manifest.action?.default_popup) fail("manifest must not use default_popup");
if (manifest.minimum_chrome_version !== "114") fail("manifest must require Chrome 114+");

const bg = read("background.js");
if (!bg.includes("openPanelOnActionClick")) fail("background must open side panel on action click");
if (bg.includes("maybeShowGotdToast")) fail("background must not schedule GOTD toasts");

const sidepanel = read("sidepanel.js");
for (const needle of ["/api/generate", "/api/random-bulk", "insertText", "execCommand", "contentScript"]) {
  if (sidepanel.includes(needle)) fail(`sidepanel.js must not contain ${needle}`);
}
if (!sidepanel.includes("navigator.clipboard.writeText")) fail("sidepanel must copy via Clipboard API on user click");

const perms = manifest.permissions || [];
for (const banned of ["scripting", "activeTab", "webNavigation", "cookies", "clipboardRead", "history", "notifications", "alarms"]) {
  if (perms.includes(banned)) fail(`unnecessary permission: ${banned}`);
}
for (const required of ["storage", "sidePanel"]) {
  if (!perms.includes(required)) fail(`missing permission: ${required}`);
}

const hosts = (manifest.host_permissions || []).join(" ");
if (/x\.com|twitter\.com|all_urls|localhost|127\.0\.0\.1/i.test(hosts)) {
  fail("host_permissions must be production GMXReply only");
}

for (const cs of manifest.content_scripts || []) {
  const matches = (cs.matches || []).join(" ");
  if (/x\.com|twitter\.com/i.test(matches)) fail("no X content scripts allowed");
}

const allText = walk(extDir)
  .filter((f) => /\.(js|json|html|css)$/i.test(f))
  .map((f) => fs.readFileSync(f, "utf8"))
  .join("\n");
if (/x\.com|twitter\.com/i.test(allText) && /host_permissions|content_scripts|matches/i.test(allText)) {
  // allow mentions in i18n copy strings only — scan manifest + js excluding bundle
}
const prodJs = ["background.js", "sidepanel.js", "site_sync.js", "manifest.json"]
  .map((f) => read(f))
  .join("\n");
if (/querySelector|MutationObserver|insertAdjacent|innerHTML\s*=/.test(prodJs) && /x\.com|twitter/i.test(prodJs)) {
  fail("production extension scripts must not target X DOM");
}

const version = manifest.version;
const cfg = read("lib/ext-config.js");
if (!cfg.includes(`EXT_VERSION: "${version}"`)) fail("ext-config EXT_VERSION must match manifest");
if (!read("sidepanel.html").includes(`v${version}`)) fail("sidepanel.html version label must match manifest");

const required = [
  "manifest.json",
  "background.js",
  "sidepanel.html",
  "sidepanel.js",
  "sidepanel.css",
  "site_sync.js",
  "i18n-bundle.js",
  "lib/ext-config.js",
  "lib/ext-i18n.js",
  "lib/site-sync-core.js",
  "lib/bank-sync-core.js",
];
for (const rel of required) {
  if (!fs.existsSync(path.join(extDir, rel))) fail(`missing required file: ${rel}`);
}

const bannedFiles = ["popup.js", "popup.html", "quick.html"];
for (const rel of bannedFiles) {
  if (fs.existsSync(path.join(extDir, rel))) fail(`production package must not include ${rel}`);
}

const files = walk(extDir);
for (const full of files) {
  const rel = path.relative(extDir, full).replace(/\\/g, "/");
  if (/\.(test|spec)\./i.test(rel)) fail(`tests must not ship in package: ${rel}`);
  if (rel === ".env" || rel.endsWith(".log")) fail(`dev artifact in package: ${rel}`);
  const text = fs.readFileSync(full, "utf8");
  if (/sk_live_|SUPABASE_SERVICE_ROLE|BEGIN PRIVATE KEY/i.test(text)) fail(`possible secret in ${rel}`);
  if (/localhost:10000|127\.0\.0\.1:5173/i.test(text) && !rel.includes("i18n-bundle")) {
    fail(`dev origin in ${rel}`);
  }
}

ok(`extension package v${version} copy-only side panel OK`);
console.log("VERIFY_EXTENSION_PACKAGE_OK");
