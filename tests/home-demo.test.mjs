import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("home tab exposes guest demo controls", () => {
  const html = fs.readFileSync(path.join(root, "public", "app.html"), "utf8");
  for (const id of ["h_try_title", "h_try_note", "homeTryGm", "homeTryGn", "homeTryOut", "home_try_copy"]) {
    assert.match(html, new RegExp(`id="${id}"`));
  }
});

test("connect module calls public random-bulk for guest demo", () => {
  const src = fs.readFileSync(path.join(root, "public", "app.connect.js"), "utf8");
  assert.match(src, /\/api\/public\/random-bulk/);
  assert.match(src, /runHomeTry/);
  assert.match(src, /homeTryGm/);
});

test("auth allows public demo endpoints without handle", () => {
  const src = fs.readFileSync(path.join(root, "public", "app.auth.js"), "utf8");
  assert.match(src, /\/api\/public\//);
});
