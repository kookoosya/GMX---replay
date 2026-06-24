import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("referrals tab exposes viral hook and share controls", () => {
  const html = fs.readFileSync(path.join(root, "public", "app.html"), "utf8");
  for (const id of ["ref_viral_hook_html", "refShare", "refCopy", "refLink"]) {
    assert.match(html, new RegExp(`id="${id}"`));
  }
});

test("referrals module supports tap-to-copy and share", () => {
  const src = fs.readFileSync(path.join(root, "public", "app.referrals.js"), "utf8");
  assert.match(src, /copyReferralLink/);
  assert.match(src, /refLinkCopied/);
  assert.match(src, /navigator\.share/);
  assert.match(src, /refShare/);
});

test("en locale defines referral viral hook copy", () => {
  const en = JSON.parse(fs.readFileSync(path.join(root, "shared", "i18n", "locales", "en.json"), "utf8"));
  for (const key of ["ref_viral_hook_html", "ref_link_tap_to_copy", "ref_share", "ref_share_text"]) {
    assert.ok(en[key], `missing ${key}`);
  }
  assert.match(en.ref_viral_hook_html, /7-day Pro trial/);
});

test("referrals css styles viral hook banner", () => {
  const css = fs.readFileSync(path.join(root, "public", "app.css"), "utf8");
  assert.match(css, /\.refViralHook/);
  assert.match(css, /#refLink\.refLinkCopied/);
});
