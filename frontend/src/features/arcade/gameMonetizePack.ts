import type { ExternalPortalGame, PortalAccess } from "./externalPortalCatalog";
import { buildArcadeCoverCss } from "./arcadeCovers";

export type GameMonetizePackItem = {
  key: string;
  title: string;
  category: string;
  access: PortalAccess;
  icon: string;
  note: string;
  gmId: string;
};

// Only keep verified GameMonetize slots in the default catalog.
// Anything else can still be added later through Quick insert by link / raw ID.
export const GAME_MONETIZE_PACK: GameMonetizePackItem[] = [
  {
    key: "army-truck-sim-2024",
    title: "Army Truck Simulator 2024",
    category: "Simulation",
    access: "free",
    icon: "🚚",
    note: "Verified GameMonetize embed with live thumbnail.",
    gmId: "3p0c5gp13e1cmlw7dew2pvjulv2akyxu",
  },
  {
    key: "zombie-mission-5",
    title: "Zombie Mission 5",
    category: "Shooter",
    access: "free",
    icon: "🧟",
    note: "Verified GameMonetize embed with live thumbnail.",
    gmId: "90ekif5pjvedca2t2ati7jv6s91f5ffe",
  },
];

export function buildGameMonetizeEmbedUrl(gmId: string): string {
  const id = String(gmId || "").trim();
  if (!id) return "";
  return `https://html5.gamemonetize.co/${id}/`;
}

export function buildGameMonetizeThumbUrl(gmId: string): string {
  const id = String(gmId || "").trim();
  if (!id) return "";
  return `https://img.gamemonetize.com/${id}/512x384.jpg`;
}

// Accepts: raw ID, full URL, or an iframe snippet.
export function extractGameMonetizeId(input: string): string {
  const raw = String(input || "").trim();
  if (!raw) return "";

  const iframeMatch = raw.match(/html5\.gamemonetize\.co\/([a-z0-9_-]{8,})\//i);
  if (iframeMatch?.[1]) return iframeMatch[1];

  const uncachedMatch = raw.match(/uncached\.gamemonetize\.co\/([a-z0-9_-]{8,})\//i);
  if (uncachedMatch?.[1]) return uncachedMatch[1];

  if (/^[a-z0-9_-]{12,}$/i.test(raw)) return raw;
  return "";
}

export function buildGameMonetizeExternalGames(): ExternalPortalGame[] {
  return GAME_MONETIZE_PACK.map((item) => {
    const embedUrl = buildGameMonetizeEmbedUrl(item.gmId);
    return {
      id: `gm-${item.key}`,
      name: item.title,
      icon: item.icon,
      access: item.access,
      cover: buildArcadeCoverCss(item.category),
      imageUrl: buildGameMonetizeThumbUrl(item.gmId),
      embedUrl,
      launchUrl: embedUrl,
      sourceLabel: "GameMonetize embed",
      shortNote: item.note,
      category: item.category,
      provider: "gamemonetize",
    };
  });
}
