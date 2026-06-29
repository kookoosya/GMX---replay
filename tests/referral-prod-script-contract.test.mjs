/**
 * Production referrals script contract.
 */
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const scriptPath = path.join(root, "tools", "tests", "prod-referrals.mjs");
const pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));

test("prod referrals script exists and is wired in package.json", () => {
  assert.ok(fs.existsSync(scriptPath));
  assert.equal(pkg.scripts["test:prod:referrals"], "node tools/tests/prod-referrals.mjs");
});

test("prod referrals script avoids token logging and caps accounts", () => {
  const src = fs.readFileSync(scriptPath, "utf8");
  assert.doesNotMatch(src, /console\.log\([^)]*token/i);
  assert.doesNotMatch(src, /console\.log\([^)]*cookie/i);
  assert.match(src, /freshSmokeHandle/);
  assert.match(src, /PASS|FAIL/);
  assert.doesNotMatch(src, /for\s*\([^)]*20[^)]*\)/);
});
