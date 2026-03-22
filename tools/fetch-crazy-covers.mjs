#!/usr/bin/env node
/**
 * Fetch CrazyGames cover image URLs by scraping game pages for og:image
 * Usage: node tools/fetch-crazy-covers.mjs
 */
import https from "https";

const CRAZY_SLUGS = [
  "worms-zone", "moto-x3m", "basketball-stars-2019", "tennis-masters",
  "soccer-legends-2021", "madalin-stunt-cars-2", "city-car-driving-simulator-stunt-master",
  "top-speed-racing-3d", "night-city-racing", "flyordieio", "skribblio",
  "mahjongg-solitaire", "words-of-wonders", "pixel-gun-apocalypse-3",
  "forward-assault-remix", "combat-online", "paper-io-2", "hole-io",
  "shellshockersio", "1v1-lol", "drift-hunters", "bloxdhop-io", "merc-zone",
  "crazy-roll-3d", "slitherio", "dead-zed", "buildnow-gg",   "vortex-9", "holey-io-battle-royale", "smash-karts", "polytrack"
];

function fetch(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers: { "User-Agent": "Mozilla/5.0" } }, (res) => {
      let data = "";
      res.on("data", (c) => (data += c));
      res.on("end", () => resolve({ ok: res.statusCode === 200, data }));
    });
    req.on("error", reject);
  });
}

async function getCover(slug) {
  const url = `https://www.crazygames.com/game/${slug}`;
  const { ok, data } = await fetch(url);
  if (!ok) return null;
  const m = data.match(/property="og:image"\s+content="([^"]+)"/) || data.match(/content="([^"]*images\.crazygames\.com[^"]+cover[^"]*)"\s+property="og:image"/);
  if (m) return m[1].replace(/&amp;/g, "&");
  const m2 = data.match(/https:\/\/images\.crazygames\.com\/games\/[^"'\s]+cover[^"'\s]*\.png[^"'\s]*/);
  return m2 ? m2[0] : null;
}

async function main() {
  const out = {};
  for (const slug of CRAZY_SLUGS) {
    process.stderr.write(`Fetching ${slug}... `);
    const cover = await getCover(slug);
    out[slug] = cover || "NOT_FOUND";
    process.stderr.write(cover ? "OK\n" : "FAIL\n");
    await new Promise((r) => setTimeout(r, 500));
  }
  console.log(JSON.stringify(out, null, 2));
}

main().catch(console.error);
