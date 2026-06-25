import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { SEO_TAB_KEYS, seoKeysForTab, seoOgImageUrl } from "../tools/lib/seo-meta-core.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("app.html includes og:image and twitter card", () => {
  const html = fs.readFileSync(path.join(root, "public", "app.html"), "utf8");
  assert.match(html, /property="og:image"/);
  assert.match(html, /assets\/og\/gmx-share\.svg/);
  assert.match(html, /name="twitter:card"/);
});

test("arcade.html includes unique meta description and og tags", () => {
  const html = fs.readFileSync(path.join(root, "public", "arcade.html"), "utf8");
  assert.match(html, /name="description"/);
  assert.match(html, /property="og:description"/);
  assert.match(html, /property="og:image"/);
});

test("seo meta module updates title and description per tab", () => {
  const src = fs.readFileSync(path.join(root, "public", "app.seometa.js"), "utf8");
  assert.match(src, /applySeoMeta/);
  assert.match(src, /seo_wallet_title/);
  assert.match(src, /twitter:image/);
});

test("siteboot and nav wire seo meta", () => {
  assert.match(fs.readFileSync(path.join(root, "public", "app.siteboot.js"), "utf8"), /__GMXSeoMetaFactory/);
  assert.match(fs.readFileSync(path.join(root, "public", "app.bootstrapuiwire.js"), "utf8"), /__GMXSeoMetaFactory/);
});

test("og share asset exists", () => {
  assert.ok(fs.existsSync(path.join(root, "public", "assets", "og", "gmx-share.svg")));
});

test("seo meta core maps home and wallet tabs", () => {
  assert.equal(seoKeysForTab("wallet").title, SEO_TAB_KEYS.wallet.title);
  assert.match(seoOgImageUrl("https://www.gmxreply.com"), /gmx-share\.svg$/);
});

test("en locale defines seo copy keys", () => {
  const en = JSON.parse(fs.readFileSync(path.join(root, "shared", "i18n", "locales", "en.json"), "utf8"));
  for (const key of [
    "seo_home_title",
    "seo_home_description",
    "seo_wallet_title",
    "seo_wallet_description",
    "seo_arcade_title",
    "seo_arcade_description",
  ]) {
    assert.ok(en[key], key);
  }
});

test("bootstrap chunk includes seo meta module", () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(root, "tools", "app-chunk-manifest.json"), "utf8"));
  const boot = manifest.chunks.find((c) => c.out === "chunks/app.shell.bootstrap.js");
  assert.ok(boot?.files?.includes("app.seometa.js"));
});
