import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { getScriptOrder, loadClientManifest } from "../tools/lib/client-manifest.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const publicDir = path.join(root, "public");
const frontendPublic = path.join(root, "frontend", "public");

const BASELINE = 12;

test("app.html defer script count matches baseline", () => {
  const order = getScriptOrder();
  assert.equal(order.length, BASELINE);
  assert.equal(order.at(-1), "app.js");
  assert.equal(order[0], "i18n/siteI18n.js");
  assert.equal(order[1], "lib/referral-progress-core.js");
  assert.equal(order[2], "lib/theme-group-core.js");
  assert.equal(order[3], "lib/wallpaper-core.js");
  assert.equal(order[4], "lib/gmgn-gen-history-core.js");
  assert.equal(order[5], "lib/mobile-nav-core.js");
  assert.equal(order[6], "lib/skeleton-core.js");
  assert.equal(order[7], "chunks/app.shell.deps.js");
});

test("client-manifest scriptOrder matches app.html", () => {
  const html = fs.readFileSync(path.join(publicDir, "app.html"), "utf8");
  const fromHtml = [];
  for (const m of html.matchAll(/<script\s+defer\s+src="\/([^"?]+)(?:\?[^"]*)?"/g)) {
    fromHtml.push(m[1]);
  }
  assert.deepEqual(fromHtml, getScriptOrder());
});

test("public has no collapsed runwire shells", () => {
  const runwires = fs.readdirSync(publicDir).filter((n) => /runwire\.js$/i.test(n));
  assert.deepEqual(runwires, []);
});

test("frontend/public has no stale runwire mirrors", () => {
  if (!fs.existsSync(frontendPublic)) return;
  const runwires = fs.readdirSync(frontendPublic).filter((n) => /runwire\.js$/i.test(n));
  assert.deepEqual(runwires, []);
});

test("audit-app-boot passes", () => {
  const r = spawnSync(process.execPath, ["tools/audit-app-boot.mjs"], {
    cwd: root,
    encoding: "utf8",
  });
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.match(r.stdout, /APP_BOOT_AUDIT_OK/);
});

test("boot inventory categories are stable", () => {
  const { categories } = JSON.parse(
    spawnSync(process.execPath, ["tools/audit-app-boot.mjs", "--json"], {
      cwd: root,
      encoding: "utf8",
    }).stdout
  );
  assert.equal(categories.chunk, 4);
  assert.equal(categories.entry, 1);
  assert.equal(categories.i18n, 1);
});

test("verify-app-chunks passes", () => {
  const r = spawnSync(process.execPath, ["tools/verify-app-chunks.mjs"], {
    cwd: root,
    encoding: "utf8",
  });
  assert.equal(r.status, 0, r.stdout + r.stderr);
});
