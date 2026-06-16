import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

test("public and frontend/public synced shell files stay byte-identical", () => {
  const result = spawnSync("node", ["tools/verify-public-frontend-parity.mjs"], {
    cwd: root,
    encoding: "utf8",
  });

  const output = `${result.stdout ?? ""}\n${result.stderr ?? ""}`.trim();
  assert.equal(result.status, 0, output || "parity script failed");
});
