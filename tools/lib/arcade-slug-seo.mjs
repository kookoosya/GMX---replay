/** SEO landing HTML for /arcade/:slug routes. */

export const ARCADE_SLUG_OG_FALLBACK = "https://www.gmxreply.com/assets/og/gmx-share.svg";

export function escapeHtml(s) {
  return String(s ?? "").replace(/[&<>"]/g, (m) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
  })[m]);
}

export function normalizeArcadeSlug(slug) {
  return String(slug || "").trim().toLowerCase();
}

export function findCatalogGameBySlug(slug, games) {
  const key = normalizeArcadeSlug(slug);
  if (!key) return null;
  if (!Array.isArray(games)) return null;
  return games.find((g) => normalizeArcadeSlug(g.id) === key) || null;
}

export function arcadeSlugPlayUrl(game) {
  const id = String(game?.id || "").trim();
  return id ? `/arcade.html?game=${encodeURIComponent(id)}` : "/arcade.html";
}

export function arcadeSlugCanonicalUrl(origin, game) {
  const base = String(origin || "https://www.gmxreply.com").replace(/\/$/, "");
  const id = String(game?.id || "").trim();
  return id ? `${base}/arcade/${encodeURIComponent(id)}` : `${base}/arcade.html`;
}

export function arcadeSlugOgImage(game) {
  const url = String(game?.imageUrl || "").trim();
  if (/^https:\/\//i.test(url)) return url;
  return ARCADE_SLUG_OG_FALLBACK;
}

export function arcadeSlugDescription(game) {
  const name = String(game?.name || game?.id || "Arcade game");
  const category = String(game?.category || "browser").trim();
  const source = String(game?.sourceLabel || game?.provider || "CrazyGames").trim();
  const access =
    String(game?.access || "").toLowerCase() === "pro"
      ? "Pro unlock in GMXReply Arcade."
      : "Free to play in GMXReply Arcade.";
  return `Play ${name} online — ${category} game from ${source}. ${access} No download required.`;
}

export function arcadeSlugTitle(game) {
  const name = String(game?.name || game?.id || "Arcade game");
  return `${name} · Play in GMXReply Arcade`;
}

export function renderArcadeSlugPage(game, opts = {}) {
  if (!game || !game.id) return "";
  const origin = opts.origin || "https://www.gmxreply.com";
  const title = arcadeSlugTitle(game);
  const description = arcadeSlugDescription(game);
  const canonical = arcadeSlugCanonicalUrl(origin, game);
  const playUrl = arcadeSlugPlayUrl(game);
  const ogImage = arcadeSlugOgImage(game);
  const name = escapeHtml(game.name || game.id);
  const category = escapeHtml(game.category || "Arcade");
  const source = escapeHtml(game.sourceLabel || game.provider || "CrazyGames");
  const access = String(game.access || "free").toLowerCase() === "pro" ? "Pro" : "Free";
  const cover = arcadeSlugOgImage(game);
  const coverIsRemote = /^https:\/\//i.test(String(game.imageUrl || ""));

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <link rel="icon" href="/icons/gmx-icon.svg" type="image/svg+xml" />
  <meta name="theme-color" content="#9945ff" />
  <meta name="description" content="${escapeHtml(description)}" />
  <meta property="og:title" content="${escapeHtml(title)}" />
  <meta property="og:description" content="${escapeHtml(description)}" />
  <meta property="og:type" content="website" />
  <meta property="og:image" content="${escapeHtml(ogImage)}" />
  <meta property="og:url" content="${escapeHtml(canonical)}" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:image" content="${escapeHtml(ogImage)}" />
  <link rel="canonical" href="${escapeHtml(canonical)}" />
  <title>${name} · GMXReply Arcade</title>
  <link rel="stylesheet" href="/arcade/slug.css" />
</head>
<body>
  <div class="shell">
    <article class="panel">
      <div class="topNav">
        <a class="ghostBtn" href="/arcade.html">← Arcade catalog</a>
        <a class="ghostBtn" href="/app">GMXReply app</a>
      </div>
      <div class="eyebrow">${category} · ${escapeHtml(access)}</div>
      <h1>${name}</h1>
      <p class="meta">${escapeHtml(description)}</p>
      ${
        coverIsRemote
          ? `<img class="slugCover" src="${escapeHtml(cover)}" alt="${name}" width="640" height="360" loading="eager" decoding="async" referrerpolicy="no-referrer" />`
          : ""
      }
      <p>Launch <strong>${name}</strong> inside GMXReply Arcade — curated browser games with a safe player shell and one-click return to your GM/GN workflow. Source: <strong>${source}</strong>.</p>
      <div class="ctaRow">
        <a class="primaryBtn" href="${escapeHtml(playUrl)}">Play ${name}</a>
        <a class="ghostBtn" href="/arcade.html">Browse all games</a>
      </div>
    </article>
  </div>
</body>
</html>`;
}
