#!/usr/bin/env node
/** Compare production wallpaper bytes vs git HEAD vs pre-pexels baseline. */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import {
  siteLandscapeFilename,
  siteThumbFilename,
  extPortraitFilename,
} from "../lib/wallpaper-core.mjs";

const BASE = process.env.PROD_BASE || "https://www.gmxreply.com";
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const BASELINE = "c6c9fa6";
const COUNT = Number(process.env.AUDIT_COUNT || 20);
const OUT = path.join(ROOT, "tools", ".wallpaper-review", "pixel-audit");
const ASSET_REV = fs.readFileSync(path.join(ROOT, "public", "app.js"), "utf8").match(/ASSET_REV = "([^"]+)"/)?.[1] || "";

function sha(buf) {
  return crypto.createHash("sha256").update(buf).digest("hex");
}

function gitBytes(rev, rel) {
  try {
    return execSync(`git show ${rev}:${rel}`, { cwd: ROOT, encoding: "buffer", maxBuffer: 15 * 1024 * 1024 });
  } catch {
    return null;
  }
}

async function fetchMeta(url, cacheMode = "no-store") {
  const r = await fetch(url, { cache: cacheMode, signal: AbortSignal.timeout(90000) });
  const bytes = Buffer.from(await r.arrayBuffer());
  return {
    ok: r.ok,
    status: r.status,
    bytes,
    ct: r.headers.get("content-type") || "",
    cc: r.headers.get("cache-control") || "",
    etag: r.headers.get("etag") || "",
    lm: r.headers.get("last-modified") || "",
  };
}

fs.mkdirSync(OUT, { recursive: true });

const rows = [];

for (let i = 1; i <= COUNT; i++) {
  const id = `v2_${String(i).padStart(3, "0")}`;
  const thumbFile = siteThumbFilename(i);
  const landFile = siteLandscapeFilename(i);
  const portFile = extPortraitFilename(i);
  const thumbRel = `assets/wallpapers/thumbs/${thumbFile}`;
  const landRel = `assets/wallpapers/${landFile}`;
  const portRel = `assets/extbg/${portFile}`;
  const legacyThumbRel = `assets/wallpapers/thumbs/${id}.webp`;

  const gitThumb = gitBytes("HEAD", thumbRel);
  const gitLand = gitBytes("HEAD", landRel);
  const oldThumb = gitBytes(BASELINE, legacyThumbRel);
  const oldLand = gitBytes(BASELINE, `assets/wallpapers/${id}.webp`);

  const thumbUrl = `${BASE}/assets/wallpapers/thumbs/${thumbFile}`;
  const landUrl = `${BASE}/assets/wallpapers/${landFile}`;
  const thumbVUrl = ASSET_REV ? `${thumbUrl}?v=${ASSET_REV}` : thumbUrl;
  const prodThumb = await fetchMeta(thumbUrl);
  const prodThumbV = await fetchMeta(thumbVUrl);
  const prodLand = await fetchMeta(landUrl);

  const classify = (prod, git, old) => {
    if (!prod?.bytes?.length) return "FETCH_FAIL";
    const ph = sha(prod.bytes);
    if (git && ph === sha(git)) return "MATCH_GIT";
    if (old && ph === sha(old)) return "STALE_GRADIENT";
    return "OTHER";
  };

  const thumbVerdict = classify(prodThumb, gitThumb, oldThumb);
  const thumbVVerdict = classify(prodThumbV, gitThumb, oldThumb);
  const landVerdict = classify(prodLand, gitLand, oldLand);

  fs.writeFileSync(path.join(OUT, `${id}-prod-thumb.webp`), prodThumb.bytes);

  rows.push({
    id,
    thumbFile,
    prodThumbHash: sha(prodThumb.bytes).slice(0, 16),
    gitThumbHash: gitThumb ? sha(gitThumb).slice(0, 16) : "MISSING",
    oldThumbHash: oldThumb ? sha(oldThumb).slice(0, 16) : "MISSING",
    thumbVerdict,
    thumbVVerdict,
    prodLandHash: sha(prodLand.bytes).slice(0, 16),
    gitLandHash: gitLand ? sha(gitLand).slice(0, 16) : "MISSING",
    oldLandHash: oldLand ? sha(oldLand).slice(0, 16) : "MISSING",
    landVerdict,
    thumbSize: prodThumb.bytes.length,
    cc: prodThumb.cc,
    etag: prodThumb.etag,
  });
}

const summary = {
  matchGitThumb: rows.filter((r) => r.thumbVerdict === "MATCH_GIT").length,
  staleGradientThumb: rows.filter((r) => r.thumbVerdict === "STALE_GRADIENT").length,
  thumbVStale: rows.filter((r) => r.thumbVVerdict === "STALE_GRADIENT").length,
  matchGitLand: rows.filter((r) => r.landVerdict === "MATCH_GIT").length,
  staleGradientLand: rows.filter((r) => r.landVerdict === "STALE_GRADIENT").length,
};

fs.writeFileSync(path.join(OUT, "report.json"), JSON.stringify({ summary, rows }, null, 2));
console.log("PIXEL_AUDIT_SUMMARY", JSON.stringify(summary));
for (const r of rows.slice(0, 8)) {
  console.log(
    r.id,
    "thumb",
    r.thumbVerdict,
    "v=",
    r.thumbVVerdict,
    "land",
    r.landVerdict,
    r.prodThumbHash,
    "git",
    r.gitThumbHash,
    "old",
    r.oldThumbHash
  );
}
