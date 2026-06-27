import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  loadChunkManifest,
  syncAllChunkOutputs,
} from "../tools/sync-site-public.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

test("sync-site-public copies app-chunk-manifest outputs to frontend/public", () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "gmx-sync-chunks-"));
  try {
    const manifestPath = path.join(tmp, "tools", "app-chunk-manifest.json");
    fs.mkdirSync(path.dirname(manifestPath), { recursive: true });
    fs.writeFileSync(
      manifestPath,
      JSON.stringify({
        chunks: [{ out: "chunks/test.chunk.js", files: ["app.usage.js"], markers: [] }],
      })
    );

    const chunkBody = "/* fixture chunk */\nconsole.log('sync-contract');\n";
    fs.mkdirSync(path.join(tmp, "public", "chunks"), { recursive: true });
    fs.writeFileSync(path.join(tmp, "public", "chunks", "test.chunk.js"), chunkBody);
    fs.mkdirSync(path.join(tmp, "frontend", "public", "chunks"), { recursive: true });
    fs.writeFileSync(path.join(tmp, "frontend", "public", "chunks", "test.chunk.js"), "stale");

    syncAllChunkOutputs(tmp, manifestPath);

    const dest = fs.readFileSync(path.join(tmp, "frontend", "public", "chunks", "test.chunk.js"), "utf8");
    assert.equal(dest, chunkBody);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test("app-chunk-manifest chunk outputs are in sync-site-public scope", () => {
  const manifestPath = path.join(root, "tools", "app-chunk-manifest.json");
  const outs = loadChunkManifest(manifestPath).map((chunk) => chunk.out);
  assert.ok(outs.length >= 2, "expected shell chunk outputs in manifest");
  for (const out of outs) {
    assert.match(out, /^chunks\/[^/]+\.js$/, `unexpected chunk out path: ${out}`);
  }
  assert.deepEqual(
    outs,
    [
      "chunks/app.shell.deps.js",
      "chunks/app.shell.features.js",
      "chunks/app.shell.bootstrap.js",
      "chunks/app.shell.boot.js",
    ]
  );
});

test("public and frontend/public synced shell files stay byte-identical", () => {
  const result = spawnSync("node", ["tools/verify-public-frontend-parity.mjs"], {
    cwd: root,
    encoding: "utf8",
  });

  const output = `${result.stdout ?? ""}\n${result.stderr ?? ""}`.trim();
  assert.equal(result.status, 0, output || "parity script failed");
});
