#!/usr/bin/env node
/**
 * Fetch og:image for specific arcade game slugs (CrazyGames /game/{slug}).
 * Usage: node tools/arcade-fetch-covers-slots.mjs marble-shooter bullet-force ...
 */
import https from "node:https";

const slots = process.argv.slice(2);
if (!slots.length) {
  console.error("Usage: node tools/arcade-fetch-covers-slots.mjs <slug> [slug...]");
  process.exit(1);
}

function fetchHtml(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, { headers: { "User-Agent": "Mozilla/5.0 (compatible; GMXReply/1.0)" } }, (res) => {
        let data = "";
        res.on("data", (chunk) => {
          data += chunk;
        });
        res.on("end", () => resolve({ status: res.statusCode || 0, data }));
      })
      .on("error", reject);
  });
}

function parseOgImage(html) {
  const m =
    html.match(/property="og:image"\s+content="([^"]+)"/) ||
    html.match(/content="([^"]+)"\s+property="og:image"/) ||
    html.match(/content="([^"]*imgs[^"]+)"[^>]*property="og:image"/i);
  return m ? m[1].replace(/&amp;/g, "&") : "";
}

const suffix = "?metadata=none&quality=100&width=1200&height=630&fit=crop";
const results = {};

for (const slug of slots) {
  const url = `https://www.crazygames.com/game/${slug}`;
  try {
    const { status, data } = await fetchHtml(url);
    const cover = parseOgImage(data);
    if (cover) {
      const normalized = cover.includes("?") ? cover : `${cover}${suffix}`;
      results[slug] = normalized;
      console.log(`OK ${slug} (${status}): ${normalized}`);
    } else {
      console.log(`FAIL ${slug} (${status}): no og:image`);
    }
  } catch (e) {
    console.log(`FAIL ${slug}: ${e.message}`);
  }
  await new Promise((r) => setTimeout(r, 400));
}

console.log(JSON.stringify(results, null, 2));
