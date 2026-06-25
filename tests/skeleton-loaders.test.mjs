import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  LINE_LIST_SKELETON_MIN_ITEMS,
  arcadeGotdSkeletonHtml,
  arcadeTileSkeletonCount,
  arcadeTileSkeletonHtml,
  lineListShouldUseSkeleton,
} from "../tools/lib/skeleton-core.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("skeleton core thresholds", () => {
  assert.equal(lineListShouldUseSkeleton(2), false);
  assert.equal(lineListShouldUseSkeleton(LINE_LIST_SKELETON_MIN_ITEMS), true);
  assert.equal(arcadeTileSkeletonCount(0), 8);
  assert.equal(arcadeTileSkeletonCount(6), 6);
});

test("arcade tile skeleton html", () => {
  const html = arcadeTileSkeletonHtml(6);
  assert.match(html, /tileSkeleton/);
  assert.match(html, /skeleton-tile-cover/);
  assert.equal((html.match(/class="tile tileSkeleton"/g) || []).length, 6);
  assert.match(arcadeGotdSkeletonHtml(), /tileGotd/);
});

test("app shell loads skeleton core lib", () => {
  const html = fs.readFileSync(path.join(root, "public", "app.html"), "utf8");
  assert.match(html, /lib\/skeleton-core\.js/);
  assert.ok(fs.existsSync(path.join(root, "public", "lib", "skeleton-core.js")));
});

test("arcade page loads skeleton core and styles", () => {
  const html = fs.readFileSync(path.join(root, "public", "arcade.html"), "utf8");
  assert.match(html, /lib\/skeleton-core\.js/);
  assert.match(html, /\.tileSkeleton/);
  assert.match(html, /skeleton-shimmer/);
});

test("bankui uses skeleton for short lists via GMXSkeletonCore", () => {
  const src = fs.readFileSync(path.join(root, "public", "app.bankui.js"), "utf8");
  assert.match(src, /GMXSkeletonCore/);
  assert.match(src, /lineListShouldUseSkeleton/);
  assert.doesNotMatch(src, /items\.length > 20/);
});

test("arcade grid shows skeleton while plan loads", () => {
  const src = fs.readFileSync(path.join(root, "public", "arcade.js"), "utf8");
  assert.match(src, /state\.plan === "loading"/);
  assert.match(src, /arcadeTileSkeletonHtml/);
  assert.match(src, /arcadeGotdSkeletonHtml/);
});

test("app css defines line list skeleton styles", () => {
  const css = fs.readFileSync(path.join(root, "public", "app.css"), "utf8");
  assert.match(css, /\.skeleton-lineRow/);
  assert.match(css, /skeleton-shimmer/);
});
