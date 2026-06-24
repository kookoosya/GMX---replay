#!/usr/bin/env node
/**
 * Offline embed URL audit for Arcade catalog (+ optional network spot-check).
 * Run: node tools/audit-arcade-embeds.mjs [--network]
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadArcadeCatalogGames } from "./lib/load-arcade-catalog.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const network = process.argv.includes("--network");
const CRAZY_EMBED = /^https:\/\/www\.crazygames\.com\/embed\/[^/?#]+$/i;

const games = loadArcadeCatalogGames();
let issues = 0;

function fail(msg) {
  issues++;
  console.error(msg);
}

for (const g of games) {
  const embed = String(g.embedUrl || "").trim();
  const launch = String(g.launchUrl || "").trim();
  if (!CRAZY_EMBED.test(embed)) fail(`${g.id}: bad embedUrl`);
  if (!CRAZY_EMBED.test(launch)) fail(`${g.id}: bad launchUrl`);
  if (embed !== launch) fail(`${g.id}: embedUrl !== launchUrl`);
  const slug = embed.match(/\/embed\/([^/?#]+)/i)?.[1] || "";
  if (!slug) fail(`${g.id}: missing embed slug`);
  if (g.provider !== "crazygames") fail(`${g.id}: catalog provider must be crazygames`);
}

async function headOk(url) {
  try {
    const res = await fetch(url, {
      method: "HEAD",
      redirect: "follow",
      headers: { "User-Agent": "GMXReply/arcade-embed-audit" },
      signal: AbortSignal.timeout(12000),
    });
    return res.status >= 200 && res.status < 400;
  } catch {
    return false;
  }
}

if (network) {
  const sample = games.filter((_, i) => i % 7 === 0).slice(0, 12);
  for (const g of sample) {
    process.stderr.write(`HEAD ${g.id}... `);
    const ok = await headOk(g.embedUrl);
    process.stderr.write(ok ? "OK\n" : "FAIL\n");
    if (!ok) fail(`${g.id}: network HEAD failed for embed`);
    await new Promise((r) => setTimeout(r, 250));
  }
}

if (issues) {
  console.error(`\naudit-arcade-embeds: ${issues} issue(s)`);
  process.exit(1);
}

console.log(`arcade embeds OK (${games.length} games${network ? ", network sample checked" : ", offline only"})`);
