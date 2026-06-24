import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const extDir = path.join(root, "extension");

function loadSiteSyncCore() {
  const code = fs.readFileSync(path.join(extDir, "lib", "site-sync-core.js"), "utf8");
  const fn = new Function("globalThis", `${code}; return globalThis.GMXSiteSyncCore;`);
  return fn({});
}

test("site-sync-core: active site session wins", () => {
  const core = loadSiteSyncCore();
  const out = core.resolveSyncedSession({
    siteHandle: "alice",
    siteToken: "tok_site",
    prevHandle: "bob",
    prevToken: "tok_ext",
  });
  assert.equal(out.handle, "alice");
  assert.equal(out.token, "tok_site");
  assert.equal(out.hasSiteSession, true);
});

test("site-sync-core: force logout clears session", () => {
  const core = loadSiteSyncCore();
  const out = core.resolveSyncedSession({
    siteHandle: "alice",
    siteToken: "tok_site",
    forceLogout: true,
    prevHandle: "bob",
    prevToken: "tok_ext",
  });
  assert.equal(out.handle, "");
  assert.equal(out.token, "");
  assert.equal(out.hasSiteSession, false);
});

test("site-sync-core: empty site keeps extension-only auth", () => {
  const core = loadSiteSyncCore();
  const out = core.resolveSyncedSession({
    siteHandle: "",
    siteToken: "",
    prevHandle: "bob",
    prevToken: "tok_ext",
  });
  assert.equal(out.handle, "bob");
  assert.equal(out.token, "tok_ext");
  assert.equal(out.hasSiteSession, false);
});

test("site-sync-core: normalizes @handle", () => {
  const core = loadSiteSyncCore();
  const out = core.resolveSyncedSession({
    siteHandle: "@alice",
    siteToken: "tok",
    prevHandle: "",
    prevToken: "",
  });
  assert.equal(out.handle, "alice");
  assert.equal(out.hasSiteSession, true);
});

test("extension site_sync exposes hasSiteSession and uses sync core", () => {
  const siteSync = fs.readFileSync(path.join(extDir, "site_sync.js"), "utf8");
  assert.match(siteSync, /hasSiteSession/);
  assert.match(siteSync, /resolveSyncedSession/);
  assert.match(siteSync, /GMX_FORCE_SITE_SYNC/);
  assert.match(siteSync, /gmx_ext_wp_v2_popup/);
  assert.match(siteSync, /runSyncOnce/);
});

test("extension popup prefers logged-in site tab for session sync", () => {
  const popup = fs.readFileSync(path.join(extDir, "popup.js"), "utf8");
  assert.match(popup, /hasSiteSession/);
  assert.match(popup, /foundSiteSession/);
  assert.match(popup, /applySyncResponse/);
});

test("extension manifest loads site-sync-core before site_sync", () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(extDir, "manifest.json"), "utf8"));
  const scripts = manifest.content_scripts?.[0]?.js || [];
  const coreIdx = scripts.indexOf("lib/site-sync-core.js");
  const syncIdx = scripts.indexOf("site_sync.js");
  assert.ok(coreIdx >= 0, "manifest must include lib/site-sync-core.js");
  assert.ok(syncIdx >= 0, "manifest must include site_sync.js");
  assert.ok(coreIdx < syncIdx, "site-sync-core must load before site_sync.js");
});

test("site and extension force-logout keys align", () => {
  const storage = fs.readFileSync(path.join(root, "public", "app.storage.js"), "utf8");
  const siteSync = fs.readFileSync(path.join(extDir, "site_sync.js"), "utf8");
  assert.match(storage, /FORCE_LOGOUT:\s*"gmx_ext_force_logout"/);
  assert.match(storage, /FORCE_LOGOUT_V2:\s*"gmx_ext_force_logout_v2"/);
  assert.match(siteSync, /gmx_ext_force_logout_v2/);
  assert.match(siteSync, /gmx_ext_force_logout/);
});
