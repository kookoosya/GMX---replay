import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  ARCADE_PRELOAD_LINK_IDS,
  ARCADE_PRELOAD_PATHS,
  arcadePreloadUrls,
  shouldSkipArcadePreload,
} from "../tools/lib/arcade-preload-core.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("app shell exposes arcade navigation links", () => {
  const html = fs.readFileSync(path.join(root, "public", "app.html"), "utf8");
  for (const id of ARCADE_PRELOAD_LINK_IDS) {
    assert.match(html, new RegExp(`id="${id}"`));
    assert.match(html, /href="\/arcade\.html"/);
  }
});

test("arcade preload module prefetches page and script on hover", () => {
  const src = fs.readFileSync(path.join(root, "public", "app.arcadepreload.js"), "utf8");
  assert.match(src, /bindArcadePreload/);
  assert.match(src, /pointerenter/);
  assert.match(src, /rel = "prefetch"/);
  assert.match(src, /\/arcade\.html/);
  assert.match(src, /\/arcade\.js/);
  assert.match(src, /saveData/);
});

test("siteboot wires arcade preload", () => {
  assert.match(
    fs.readFileSync(path.join(root, "public", "app.siteboot.js"), "utf8"),
    /__GMXArcadePreloadFactory/
  );
});

test("boot chunk includes arcade preload module", () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(root, "tools", "app-chunk-manifest.json"), "utf8"));
  const boot = manifest.chunks.find((c) => c.out === "chunks/app.shell.boot.js");
  assert.ok(boot?.files?.includes("app.arcadepreload.js"));
});

test("arcade preload core skips save-data and arcade routes", () => {
  assert.equal(shouldSkipArcadePreload({ saveData: true }), true);
  assert.equal(shouldSkipArcadePreload({ pathname: "/arcade.html" }), true);
  assert.equal(shouldSkipArcadePreload({ pathname: "/app" }), false);
  assert.deepEqual(arcadePreloadUrls(), [ARCADE_PRELOAD_PATHS.page, ARCADE_PRELOAD_PATHS.script]);
});

test("arcade player lazy-loads iframe until launch click", () => {
  const src = fs.readFileSync(path.join(root, "public", "arcade.js"), "utf8");
  assert.match(src, /iframeReady/);
  assert.match(src, /loadGameIframe/);
  assert.match(src, /state\.iframeReady = true/);
});
