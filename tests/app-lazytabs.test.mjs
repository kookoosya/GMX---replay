import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getScriptOrder } from "../tools/lib/client-manifest.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const publicDir = path.join(root, "public");

const LAZY_SCRIPTS = [
  "app.admin.js",
  "app.adminwire.js",
  "app.prediction.js",
  "app.predictionwire.js",
  "app.walletpay.js",
  "app.walletui.js",
  "app.wallethelpers.js",
  "app.walletwire.js",
  "app.leaderboard.js",
  "app.leaderboardwire.js",
  "app.referrals.js",
  "app.referralswire.js",
  "app.redeem.js",
  "app.redeemwire.js",
];

test("app.lazytabs.js defines six tab packs covering 14 scripts", () => {
  const src = fs.readFileSync(path.join(publicDir, "app.lazytabs.js"), "utf8");
  assert.match(src, /__gmxEnsureTabPack/);
  assert.match(src, /leaderboard:/);
  assert.match(src, /wallet:/);
  for (const name of LAZY_SCRIPTS) {
    assert.match(src, new RegExp(name.replace(".", "\\.")));
  }
});

test("lazy tab scripts are not eager in app.html defer list", () => {
  const order = getScriptOrder();
  for (const name of LAZY_SCRIPTS) {
    assert.equal(order.includes(name), false, `${name} should load lazily`);
  }
});

test("lazytabs loader ships inside boot chunk", () => {
  const bootChunk = fs.readFileSync(path.join(publicDir, "chunks/app.shell.boot.js"), "utf8");
  assert.match(bootChunk, /__gmxEnsureTabPack/);
});

test("lazy tab script files still exist in public/", () => {
  for (const name of LAZY_SCRIPTS) {
    assert.ok(fs.existsSync(path.join(publicDir, name)), `${name} missing`);
  }
});
