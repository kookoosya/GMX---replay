#!/usr/bin/env node
/**
 * Audit arcade games: verify embed URLs and fetch cover images from CrazyGames.
 * Games without valid covers are removed; top games are added.
 */
import https from "https";

const GAMES_TO_VERIFY = [
  { slug: "agario", id: "agario", name: "Agar.io" },
  { slug: "diepio", id: "diep-io", name: "Diep.io" },
  { slug: "geometry-dash-online", id: "geometry-dash", name: "Geometry Dash" },
  { slug: "snake-io", id: "snake-io", name: "Snake.io" },
  { slug: "voxiom-io", id: "voxiom-io", name: "Voxiom" },
  { slug: "zombsroyaleio", id: "zombs-royale", name: "Zombs Royale" },
  { slug: "lolbeans-io", id: "lol-beans", name: "LOL Beans" },
  { slug: "drift-hunters", id: "drift-hunters", name: "Drift Hunters" },
  { slug: "doodle-jump", id: "doodle-jump", name: "Doodle Jump" },
  { slug: "bubble-shooter-classic", id: "bubble-shooter", name: "Bubble Shooter" },
  { slug: "2048", id: "2048", name: "2048" },
  { slug: "basketball-legends-2020", id: "basketball-legends", name: "Basketball Legends" },
  { slug: "run-3", id: "run-3", name: "Run 3" },
];

function fetch(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers: { "User-Agent": "Mozilla/5.0" } }, (res) => {
      let data = "";
      res.on("data", (c) => (data += c));
      res.on("end", () => resolve({ ok: res.statusCode === 200, status: res.statusCode, data }));
    });
    req.on("error", reject);
  });
}

async function getCover(slug) {
  const url = `https://www.crazygames.com/game/${slug}`;
  const { ok, status, data } = await fetch(url);
  if (!ok) return { cover: null, status };
  const m = data.match(/property="og:image"\s+content="([^"]+)"/) || data.match(/content="([^"]*imgs?\.crazygames[^"]+)"[^>]*og:image/);
  const cover = m ? m[1].replace(/&amp;/g, "&") : null;
  return { cover, status };
}

async function main() {
  const results = [];
  for (const g of GAMES_TO_VERIFY) {
    process.stderr.write(`Checking ${g.slug}... `);
    const { cover, status } = await getCover(g.slug);
    results.push({ ...g, cover, status });
    process.stderr.write(cover ? "OK\n" : `FAIL (${status})\n`);
    await new Promise((r) => setTimeout(r, 400));
  }
  console.log(JSON.stringify(results, null, 2));
}

main().catch(console.error);
