import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("home tab exposes hero motion block", () => {
  const html = fs.readFileSync(path.join(root, "public", "app.html"), "utf8");
  for (const id of ["homeHero", "homeHeroVideo", "homeHeroAnim", "hero_video_title", "hero_video_caption", "hero_try_demo"]) {
    assert.match(html, new RegExp(`id="${id}"`));
  }
  assert.match(html, /gmx-hero-loop\.svg/);
});

test("home hero module binds CTA and mp4 fallback", () => {
  const src = fs.readFileSync(path.join(root, "public", "app.homehero.js"), "utf8");
  const html = fs.readFileSync(path.join(root, "public", "app.html"), "utf8");
  assert.match(src, /bindHomeHero/);
  assert.match(src, /prefers-reduced-motion/);
  assert.match(src, /homeTryGm/);
  assert.match(html, /gmx-hero\.mp4/);
});

test("siteboot wires home hero on init", () => {
  const src = fs.readFileSync(path.join(root, "public", "app.siteboot.js"), "utf8");
  assert.match(src, /__GMXHomeHeroFactory/);
  assert.match(src, /bindHomeHero/);
});

test("hero loop asset exists", () => {
  const svg = fs.readFileSync(path.join(root, "public", "assets", "hero", "gmx-hero-loop.svg"), "utf8");
  assert.match(svg, /GM \/ GN replies/);
  assert.match(svg, /Play Arcade games/);
});

test("boot chunk manifest includes home hero module", () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(root, "tools", "app-chunk-manifest.json"), "utf8"));
  const boot = manifest.chunks.find((c) => c.out === "chunks/app.shell.boot.js");
  assert.ok(boot?.files?.includes("app.homehero.js"));
});

test("en locale defines hero copy keys", () => {
  const en = JSON.parse(fs.readFileSync(path.join(root, "shared", "i18n", "locales", "en.json"), "utf8"));
  for (const key of ["hero_video_title", "hero_video_caption", "hero_try_demo"]) {
    assert.ok(en[key], `missing ${key}`);
  }
});
