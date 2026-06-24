/**
 * Parse Arcade quick-insert input: CrazyGames URL, embed iframe, GameDistribution hash, or HTTPS URL.
 */
const CRAZY_EMBED = /^https:\/\/www\.crazygames\.com\/embed\/[^/?#]+$/i;

function slugifyId(value) {
  return (
    String(value || "custom")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 48) || "custom-game"
  );
}

function titleFromSlug(slug) {
  return String(slug || "Custom game")
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function makeQuickGame({ id, name, embedUrl, sourceLabel, provider }) {
  const embed = String(embedUrl || "").trim();
  if (!CRAZY_EMBED.test(embed) && !/^https:\/\//i.test(embed)) {
    return { error: "bad_embed" };
  }
  return {
    game: {
      id,
      name: String(name || titleFromSlug(id)).trim() || "Custom game",
      icon: "🎮",
      access: "free",
      imageUrl: "",
      embedUrl: embed,
      launchUrl: embed,
      sourceLabel: sourceLabel || "Custom",
      shortNote: "",
      category: "Arcade",
      provider: provider || "custom",
      badge: null,
      quick: true,
    },
  };
}

export function parseQuickInsertInput(raw) {
  const text = String(raw || "").trim();
  if (!text) return { error: "empty" };

  const iframeSrc = text.match(/<iframe[^>]+src=["']([^"']+)["']/i)?.[1];
  const candidate = String(iframeSrc || text).trim();

  if (/^[a-f0-9]{32}$/i.test(candidate)) {
    const embedUrl = `https://html5.gamedistribution.com/${candidate}/`;
    return makeQuickGame({
      id: `quick-${candidate.slice(0, 8)}`,
      name: "Custom embed",
      embedUrl,
      sourceLabel: "GameDistribution",
      provider: "custom",
    });
  }

  try {
    const url = new URL(candidate);
    if (!/^https:$/i.test(url.protocol)) return { error: "http_only_https" };
    const host = url.hostname.toLowerCase();

    if (host.endsWith("crazygames.com")) {
      const embedMatch = url.pathname.match(/^\/embed\/([^/?#]+)/i);
      if (embedMatch) {
        const slug = embedMatch[1];
        const embedUrl = `https://www.crazygames.com/embed/${slug}`;
        return makeQuickGame({
          id: `quick-${slugifyId(slug)}`,
          name: titleFromSlug(slug),
          embedUrl,
          sourceLabel: "CrazyGames",
          provider: "crazygames",
        });
      }
      const gameMatch = url.pathname.match(/^\/game\/([^/?#]+)/i);
      if (gameMatch) {
        const slug = gameMatch[1];
        return makeQuickGame({
          id: `quick-${slugifyId(slug)}`,
          name: titleFromSlug(slug),
          embedUrl: `https://www.crazygames.com/embed/${slug}`,
          sourceLabel: "CrazyGames",
          provider: "crazygames",
        });
      }
      return { error: "crazygames_path" };
    }

    if (host.includes("gamedistribution.com") || host.includes("gamemonetize.com")) {
      const tail = url.pathname.split("/").filter(Boolean).pop() || host;
      return makeQuickGame({
        id: `quick-${slugifyId(tail)}`,
        name: "Custom embed",
        embedUrl: url.toString(),
        sourceLabel: "Embed",
        provider: "custom",
      });
    }

    return makeQuickGame({
      id: `quick-${slugifyId(host + url.pathname)}`,
      name: "Custom embed",
      embedUrl: url.toString(),
      sourceLabel: "Embed",
      provider: "custom",
    });
  } catch {
    return { error: "unrecognized" };
  }
}

export function normalizeQuickGames(list) {
  const out = [];
  const seen = new Set();
  for (const item of list || []) {
    if (!item || typeof item !== "object") continue;
    const id = String(item.id || "").trim();
    const embedUrl = String(item.embedUrl || item.launchUrl || "").trim();
    if (!id || !embedUrl) continue;
    if (seen.has(id)) continue;
    seen.add(id);
    const built = makeQuickGame({
      id,
      name: item.name,
      embedUrl,
      sourceLabel: item.sourceLabel,
      provider: item.provider,
    });
    if (built.game) out.push(built.game);
  }
  return out.slice(0, 12);
}
