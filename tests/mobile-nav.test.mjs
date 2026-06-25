import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  MOBILE_NAV_PRIMARY,
  MOBILE_NAV_MORE,
  resolveGmGnSwipeTarget,
  primaryNavActiveTab,
  isGmGnTab,
} from "../tools/lib/mobile-nav-core.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("mobile nav primary items cover home gm gn wallet more", () => {
  const tabs = MOBILE_NAV_PRIMARY.map((i) => i.tab);
  assert.deepEqual(tabs, ["home", "gm", "gn", "wallet", "more"]);
});

test("resolveGmGnSwipeTarget maps horizontal swipes", () => {
  assert.equal(resolveGmGnSwipeTarget("gm", -80), "gn");
  assert.equal(resolveGmGnSwipeTarget("gn", 80), "gm");
  assert.equal(resolveGmGnSwipeTarget("gm", 20), null);
  assert.equal(resolveGmGnSwipeTarget("home", -80), null);
});

test("primaryNavActiveTab highlights more for secondary tabs", () => {
  assert.equal(primaryNavActiveTab("referrals"), "more");
  assert.equal(primaryNavActiveTab("gm"), "gm");
  assert.equal(isGmGnTab("gn"), true);
});

test("app shell exposes mobile bottom nav and swipe hint", () => {
  const html = fs.readFileSync(path.join(root, "public", "app.html"), "utf8");
  for (const id of ["mobileBottomNav", "mobileMoreSheet", "gmgnSwipeHint", "mnav_gm"]) {
    assert.match(html, new RegExp(`id="${id}"`));
  }
  assert.match(html, /lib\/mobile-nav-core\.js/);
});

test("mobilenav module binds swipe and bottom nav", () => {
  const src = fs.readFileSync(path.join(root, "public", "app.mobilenav.js"), "utf8");
  assert.match(src, /bindMobileNav/);
  assert.match(src, /bindSwipePane/);
  assert.match(src, /GMXMobileNavCore/);
});

test("siteboot wires mobile nav helper", () => {
  const src = fs.readFileSync(path.join(root, "public", "app.siteboot.js"), "utf8");
  assert.match(src, /__GMXMobileNavFactory/);
});

test("nav showTab notifies mobile nav sync hook", () => {
  const src = fs.readFileSync(path.join(root, "public", "app.nav.js"), "utf8");
  assert.match(src, /onTabShown/);
  const boot = fs.readFileSync(path.join(root, "public", "app.bootstrapuiwire.js"), "utf8");
  assert.match(boot, /__gmxMobileNavSync/);
});

test("mobile nav css hides top tabs on small screens", () => {
  const css = fs.readFileSync(path.join(root, "public", "app.css"), "utf8");
  assert.match(css, /\.mobileBottomNav/);
  assert.match(css, /body\.mobileNavOn \.tabs/);
  assert.match(css, /\.gmgnSwipeHint/);
});

test("en locale defines mobile nav and swipe copy", () => {
  const en = JSON.parse(fs.readFileSync(path.join(root, "shared", "i18n", "locales", "en.json"), "utf8"));
  for (const key of ["mobile_nav_more", "mobile_nav_arcade", "gm_swipe_hint"]) {
    assert.ok(en[key], key);
  }
});
