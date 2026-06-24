#!/usr/bin/env node
/**
 * Verify public/chunks/*.js match tools/app-chunk-manifest.json sources.
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import esbuild from "esbuild";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const publicDir = path.join(root, "public");
const manifestPath = path.join(root, "tools", "app-chunk-manifest.json");
const { chunks } = JSON.parse(fs.readFileSync(manifestPath, "utf8"));

for (const chunk of chunks) {
  const outPath = path.join(publicDir, chunk.out);
  if (!fs.existsSync(outPath)) {
    console.error(`verify-app-chunks FAIL: missing ${chunk.out}`);
    process.exit(1);
  }

  const body = chunk.files
    .map((rel) => fs.readFileSync(path.join(publicDir, rel), "utf8"))
    .join("\n;\n");
  const expected = `/* gmx-chunk ${path.basename(chunk.out)} sources=${chunk.files.length} */\n${
    (await esbuild.transform(body, { minify: true, legalComments: "none", target: "es2020" })).code
  }`;
  const onDisk = fs.readFileSync(outPath, "utf8");

  if (onDisk !== expected) {
    const diskHash = crypto.createHash("sha1").update(onDisk).digest("hex").slice(0, 8);
    const expHash = crypto.createHash("sha1").update(expected).digest("hex").slice(0, 8);
    console.error(`verify-app-chunks FAIL: ${chunk.out} drift (disk=${diskHash} expected=${expHash})`);
    console.error("Run: node tools/build-app-chunks.mjs");
    process.exit(1);
  }

  for (const marker of chunk.markers || []) {
    if (!onDisk.includes(marker)) {
      console.error(`verify-app-chunks FAIL: ${chunk.out} missing ${marker}`);
      process.exit(1);
    }
  }
}

console.log(`verify-app-chunks OK (${chunks.length} chunks)`);
