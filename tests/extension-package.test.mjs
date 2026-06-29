import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("verify-extension-package script passes", () => {
  const r = spawnSync(process.execPath, ["tools/verify-extension-package.mjs"], {
    cwd: root,
    encoding: "utf8",
  });
  if (r.status !== 0) {
    throw new Error(r.stdout || r.stderr || "verify-extension-package failed");
  }
  assert.match(r.stdout, /VERIFY_EXTENSION_PACKAGE_OK/);
});
