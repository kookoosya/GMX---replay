/** Official Pexels API client — never logs the API key. */
import { loadEnv } from "./load-env.mjs";

loadEnv();

const BASE = "https://api.pexels.com/v1";

export function getPexelsKey() {
  const key = process.env.PEXELS_API_KEY;
  if (!key) throw new Error("PEXELS_API_KEY missing from environment");
  return key;
}

export async function pexelsSearch(query, page = 1, perPage = 80) {
  const url = new URL(`${BASE}/search`);
  url.searchParams.set("query", query);
  url.searchParams.set("per_page", String(perPage));
  url.searchParams.set("page", String(page));
  url.searchParams.set("orientation", "landscape");

  const res = await fetch(url, {
    headers: {
      Authorization: getPexelsKey(),
      "User-Agent": "GMXReply-Wallpaper-Campaign/1.0 (+https://www.gmxreply.com)",
    },
    signal: AbortSignal.timeout(60000),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Pexels search failed HTTP ${res.status}: ${text.slice(0, 120)}`);
  }
  return res.json();
}

export async function downloadUrl(url, retries = 5) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, {
        headers: {
          "User-Agent": "GMXReply-Wallpaper-Campaign/1.0",
          Referer: "https://www.pexels.com/",
        },
        signal: AbortSignal.timeout(180000),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return Buffer.from(await res.arrayBuffer());
    } catch (e) {
      if (i === retries - 1) throw e;
      await new Promise((r) => setTimeout(r, 1500 * (i + 1)));
    }
  }
}

export function photoPageUrl(id) {
  return `https://www.pexels.com/photo/${id}/`;
}
