#!/usr/bin/env node
/**
 * Build esbuild-minified shell chunks from public/app.*.js sources.
 * Run: node tools/build-app-chunks.mjs
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
if (!Array.isArray(chunks) || !chunks.length) {
  throw new Error("app-chunk-manifest.json: chunks is empty");
}

const built = [];

for (const chunk of chunks) {
  const { out, files, markers = [] } = chunk;
  if (!out || !Array.isArray(files) || !files.length) {
    throw new Error(`invalid chunk entry: ${JSON.stringify(chunk)}`);
  }

  const body = files
    .map((rel) => {
      const filePath = path.join(publicDir, rel);
      if (!fs.existsSync(filePath)) throw new Error(`chunk source missing: ${rel}`);
      return fs.readFileSync(filePath, "utf8");
    })
    .join("\n;\n");

  const outPath = path.join(publicDir, out);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });

  const result = await esbuild.transform(body, {
    minify: true,
    legalComments: "none",
    target: "es2020",
    sourcefile: path.basename(out),
  });

  const banner = `/* gmx-chunk ${path.basename(out)} sources=${files.length} */\n`;
  const next = banner + result.code;
  const prev = fs.existsSync(outPath) ? fs.readFileSync(outPath, "utf8") : "";
  if (prev !== next) {
    fs.writeFileSync(outPath, next);
  }

  for (const marker of markers) {
    if (!next.includes(marker)) throw new Error(`${out} missing marker ${marker}`);
  }

  const sha1 = crypto.createHash("sha1").update(next).digest("hex").slice(0, 8);
  built.push({ out, files: files.length, bytes: Buffer.byteLength(next), sha1 });
  console.log(`built ${out} (${files.length} sources, ${(Buffer.byteLength(next) / 1024).toFixed(1)} KiB, sha1=${sha1})`);
}

const totalSources = chunks.reduce((n, c) => n + c.files.length, 0);
console.log(`app-chunks OK: ${chunks.length} chunks, ${totalSources} source files`);
