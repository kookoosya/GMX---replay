import { buildArcadeCoverCss } from "./arcadeCovers";
import { buildGameMonetizeEmbedUrl, buildGameMonetizeExternalGames, buildGameMonetizeThumbUrl, extractGameMonetizeId } from "./gameMonetizePack";

export type PortalAccess = "free" | "pro";
export type PortalBadge = "showcase" | "top_pro";
export type PortalProvider = "crazygames" | "gamemonetize" | "direct" | "custom";

export type ExternalPortalGame = {
  id: string;
  name: string;
  icon: string;
  access: PortalAccess;
  cover: string;
  imageUrl?: string;
  embedUrl: string;
  launchUrl: string;
  sourceLabel: string;
  shortNote: string;
  category?: string;
  provider?: PortalProvider;
  badge?: PortalBadge;
  custom?: boolean;
};

type PersistedExternalGame = {
  id?: string;
  name?: string;
  icon?: string;
  access?: PortalAccess;
  cover?: string;
  imageUrl?: string;
  embedUrl?: string;
  launchUrl?: string;
  sourceLabel?: string;
  shortNote?: string;
  category?: string;
  provider?: PortalProvider;
  badge?: PortalBadge;
};

const LS_EXTERNAL_GAMES = "gmx_arcade_external_links_v2";

function normalizeCategory(input: string): string {
  const raw = String(input || "").trim().toLowerCase();
  if (!raw) return "Arcade";
  if (raw.includes("shoot")) return "Shooter";
  if (raw.includes("race") || raw.includes("гонк")) return "Racing";
  if (raw.includes("action") || raw.includes("экшен")) return "Action";
  if (raw.includes("platform") || raw.includes("платформ")) return "Platformer";
  if (raw.includes("sim") || raw.includes("симуля")) return "Simulation";
  if (raw.includes("спорт") || raw.includes("sport")) return "Sports";
  if (raw.includes("puzzle") || raw.includes("казу") || raw.includes("аркад")) return raw.includes("казу") ? "Casual" : "Arcade";
  if (raw.includes("idle")) return "Idle";
  if (raw === "rpg") return "RPG";
  if (raw.includes("surviv")) return "Survivor";
  if (raw.includes("strateg")) return "Strategy";
  return input || "Arcade";
}

function createGame(data: {
  id: string;
  name: string;
  icon: string;
  access: PortalAccess;
  imageUrl?: string;
  embedUrl: string;
  launchUrl?: string;
  sourceLabel: string;
  shortNote: string;
  category: string;
  provider: PortalProvider;
  badge?: PortalBadge;
}): ExternalPortalGame {
  const category = normalizeCategory(data.category);
  return {
    id: data.id,
    name: data.name,
    icon: data.icon,
    access: data.access,
    cover: buildArcadeCoverCss(category),
    imageUrl: data.imageUrl,
    embedUrl: data.embedUrl,
    launchUrl: data.launchUrl || data.embedUrl,
    sourceLabel: data.sourceLabel,
    shortNote: data.shortNote,
    category,
    provider: data.provider,
    badge: data.badge,
  };
}

export const DEFAULT_EXTERNAL_PORTAL_GAMES: ExternalPortalGame[] = [
  createGame({
    id: "kour",
    name: "Kour.io",
    icon: "🔫",
    access: "free",
    badge: "showcase",
    imageUrl: "https://images.crazygames.com/games/kour-io/cover-1709565575515.png?auto=format,compress&q=75&cs=strip",
    embedUrl: "https://www.crazygames.com/embed/kour-io",
    launchUrl: "https://www.crazygames.com/game/kour-io",
    sourceLabel: "CrazyGames embed",
    shortNote: "Fast browser FPS with a real session loop.",
    category: "Shooter",
    provider: "crazygames",
  }),
  createGame({
    id: "hazmob",
    name: "Hazmob FPS",
    icon: "🎯",
    access: "free",
    imageUrl: "https://images.crazygames.com/games/hazmob-fps-online-shooter/cover-1698224520779.png?auto=format,compress&q=75&cs=strip",
    embedUrl: "https://www.crazygames.com/embed/hazmob-fps-online-shooter",
    launchUrl: "https://www.crazygames.com/game/hazmob-fps-online-shooter",
    sourceLabel: "CrazyGames embed",
    shortNote: "Arena shooter that already feels like a finished product.",
    category: "Shooter",
    provider: "crazygames",
  }),
  createGame({
    id: "smash-karts",
    name: "Smash Karts",
    icon: "🏎️",
    access: "free",
    imageUrl: "https://images.crazygames.com/games/smash-karts/cover-1583232508892.png?auto=format,compress&q=75&cs=strip",
    embedUrl: "https://www.crazygames.com/embed/smash-karts",
    launchUrl: "https://www.crazygames.com/game/smash-karts",
    sourceLabel: "CrazyGames embed",
    shortNote: "Fast kart chaos with strong casual replay value.",
    category: "Racing",
    provider: "crazygames",
  }),
  createGame({
    id: "trial-mania",
    name: "Trial Mania",
    icon: "🏁",
    access: "free",
    imageUrl: "https://images.crazygames.com/games/trial-mania/cover-1681289191024.png?auto=format,compress&q=75&cs=strip",
    embedUrl: "https://www.crazygames.com/embed/trial-mania",
    launchUrl: "https://www.crazygames.com/game/trial-mania",
    sourceLabel: "CrazyGames embed",
    shortNote: "Clean bike trial loop with quick restart energy.",
    category: "Racing",
    provider: "crazygames",
  }),
  createGame({
    id: "rally-racer-dirt",
    name: "Rally Racer Dirt",
    icon: "🚗",
    access: "free",
    imageUrl: "https://images.crazygames.com/games/rally-racer-dirt/cover-1634653554425.png?auto=format,compress&q=75&cs=strip",
    embedUrl: "https://www.crazygames.com/embed/rally-racer-dirt",
    launchUrl: "https://www.crazygames.com/game/rally-racer-dirt",
    sourceLabel: "CrazyGames embed",
    shortNote: "Simple rally slot with a strong visual payoff.",
    category: "Racing",
    provider: "crazygames",
  }),
  createGame({
    id: "zombie-derby",
    name: "Zombie Derby Pixel",
    icon: "🧟",
    access: "free",
    imageUrl: "https://images.crazygames.com/games/zombie-derby-pixel-survival/cover-1616491795797.png?auto=format,compress&q=75&cs=strip",
    embedUrl: "https://www.crazygames.com/embed/zombie-derby-pixel-survival",
    launchUrl: "https://www.crazygames.com/game/zombie-derby-pixel-survival",
    sourceLabel: "CrazyGames embed",
    shortNote: "Side-drive survival loop with better progression than a placeholder arcade card.",
    category: "Action",
    provider: "crazygames",
  }),
  createGame({
    id: "path-of-survivor",
    name: "Path of Survivor",
    icon: "🏃",
    access: "free",
    imageUrl: "https://images.crazygames.com/games/path-of-survivor/cover-1688640103681.png?auto=format,compress&q=75&cs=strip",
    embedUrl: "https://www.crazygames.com/embed/path-of-survivor",
    launchUrl: "https://www.crazygames.com/game/path-of-survivor",
    sourceLabel: "CrazyGames embed",
    shortNote: "Top-down survival slot that fills the action lane properly.",
    category: "Survivor",
    provider: "crazygames",
  }),
  createGame({
    id: "super-bowling",
    name: "Super Bowling Mania",
    icon: "🎳",
    access: "free",
    imageUrl: "https://images.crazygames.com/games/super-bowling-mania/cover-1698658826435.png?auto=format,compress&q=75&cs=strip",
    embedUrl: "https://www.crazygames.com/embed/super-bowling-mania",
    launchUrl: "https://www.crazygames.com/game/super-bowling-mania",
    sourceLabel: "CrazyGames embed",
    shortNote: "Quick sports slot for variety without extra weight in the archive.",
    category: "Sports",
    provider: "crazygames",
  }),
  createGame({
    id: "solitaire-home-story",
    name: "Solitaire Home Story",
    icon: "🃏",
    access: "free",
    imageUrl: "https://images.crazygames.com/games/solitaire-home-story/cover-1678280650993.png?auto=format,compress&q=75&cs=strip",
    embedUrl: "https://www.crazygames.com/embed/solitaire-home-story",
    launchUrl: "https://www.crazygames.com/game/solitaire-home-story",
    sourceLabel: "CrazyGames embed",
    shortNote: "Casual slot with a softer pace for the portal.",
    category: "Casual",
    provider: "crazygames",
  }),
  createGame({
    id: "zumba-quest",
    name: "Zumba Quest",
    icon: "🟣",
    access: "free",
    imageUrl: "https://images.crazygames.com/games/zumba-quest/cover-1698236774640.png?auto=format,compress&q=75&cs=strip",
    embedUrl: "https://www.crazygames.com/embed/zumba-quest",
    launchUrl: "https://www.crazygames.com/game/zumba-quest",
    sourceLabel: "CrazyGames embed",
    shortNote: "Match arcade lane with clean session length.",
    category: "Arcade",
    provider: "crazygames",
  }),
  createGame({
    id: "goat-escape",
    name: "Goat Escape",
    icon: "🐐",
    access: "free",
    imageUrl: "https://images.crazygames.com/games/goat-escape/cover-1699539328570.png?auto=format,compress&q=75&cs=strip",
    embedUrl: "https://www.crazygames.com/embed/goat-escape",
    launchUrl: "https://www.crazygames.com/game/goat-escape",
    sourceLabel: "CrazyGames embed",
    shortNote: "Arcade filler that is light and easy to launch.",
    category: "Arcade",
    provider: "crazygames",
  }),
  createGame({
    id: "shell-shockers",
    name: "Shell Shockers",
    icon: "🥚",
    access: "pro",
    badge: "top_pro",
    imageUrl: "https://images.crazygames.com/games/shellshockersio/cover-1593593332463.png?auto=format,compress&q=75&cs=strip",
    embedUrl: "https://www.crazygames.com/embed/shellshockersio",
    launchUrl: "https://www.crazygames.com/game/shellshockersio",
    sourceLabel: "CrazyGames embed",
    shortNote: "Strong recognisable FPS hook for the Pro shelf.",
    category: "Shooter",
    provider: "crazygames",
  }),
  createGame({
    id: "bullet-force",
    name: "Bullet Force",
    icon: "💥",
    access: "pro",
    badge: "top_pro",
    imageUrl: "https://images.crazygames.com/games/bullet-force-multiplayer/cover-1583232386348.png?auto=format,compress&q=75&cs=strip",
    embedUrl: "https://www.crazygames.com/embed/bullet-force-multiplayer",
    launchUrl: "https://www.crazygames.com/game/bullet-force-multiplayer",
    sourceLabel: "CrazyGames embed",
    shortNote: "Heavier shooter slot that makes a better Pro gate than placeholder copy.",
    category: "Shooter",
    provider: "crazygames",
  }),
  createGame({
    id: "sniper-fury",
    name: "Sniper Fury",
    icon: "🎯",
    access: "pro",
    badge: "top_pro",
    imageUrl: "https://images.crazygames.com/sniper-fury_16x9/20231110091811/sniper-fury_16x9-cover?auto=format,compress&q=75&cs=strip",
    embedUrl: "https://www.crazygames.com/embed/sniper-fury",
    launchUrl: "https://www.crazygames.com/game/sniper-fury",
    sourceLabel: "CrazyGames embed",
    shortNote: "Big-brand looking shooter slot for the paid lane.",
    category: "Shooter",
    provider: "crazygames",
  }),
  createGame({
    id: "onevone-lol",
    name: "1v1.LOL",
    icon: "🏗️",
    access: "pro",
    badge: "top_pro",
    imageUrl: "https://images.crazygames.com/games/1v1-lol/cover-1604505040608.png?auto=format,compress&q=75&cs=strip",
    embedUrl: "https://www.crazygames.com/embed/1v1-lol",
    launchUrl: "https://www.crazygames.com/game/1v1-lol",
    sourceLabel: "CrazyGames embed",
    shortNote: "Recognisable PvP slot that helps the Pro shelf feel real.",
    category: "Action",
    provider: "crazygames",
  }),
  createGame({
    id: "mx-offroad-master",
    name: "MX Offroad Master",
    icon: "🏍️",
    access: "pro",
    badge: "top_pro",
    imageUrl: "https://images.crazygames.com/games/mx-offroad-master/cover-1640081308369.png?auto=format,compress&q=75&cs=strip",
    embedUrl: "https://www.crazygames.com/embed/mx-offroad-master",
    launchUrl: "https://www.crazygames.com/game/mx-offroad-master",
    sourceLabel: "CrazyGames embed",
    shortNote: "Clean 3D rider slot with stronger premium feel.",
    category: "Racing",
    provider: "crazygames",
  }),
  createGame({
    id: "firestone-idle-rpg",
    name: "Firestone Idle RPG",
    icon: "⚔️",
    access: "pro",
    badge: "top_pro",
    imageUrl: "https://images.crazygames.com/games/firestone-idle-rpg/cover-1628151811566.png?auto=format,compress&q=75&cs=strip",
    embedUrl: "https://www.crazygames.com/embed/firestone-idle-rpg",
    launchUrl: "https://www.crazygames.com/game/firestone-idle-rpg",
    sourceLabel: "CrazyGames embed",
    shortNote: "Idle RPG lane with obvious value for longer sessions.",
    category: "RPG",
    provider: "crazygames",
  }),
  createGame({
    id: "venge-io",
    name: "Venge.io",
    icon: "💣",
    access: "pro",
    imageUrl: "",
    embedUrl: "https://venge.io/",
    launchUrl: "https://venge.io/",
    sourceLabel: "Direct site",
    shortNote: "Direct launch fallback. Some browsers may prefer opening the original tab.",
    category: "Shooter",
    provider: "direct",
  }),
  createGame({
    id: "call-of-war",
    name: "Call of War",
    icon: "🌍",
    access: "pro",
    imageUrl: "",
    embedUrl: "https://www.callofwar.com/",
    launchUrl: "https://www.callofwar.com/",
    sourceLabel: "Direct site",
    shortNote: "Strategy slot for the premium lane. Opens best in a dedicated tab.",
    category: "Strategy",
    provider: "direct",
  }),
];

export function getDefaultExternalPortalGames(): ExternalPortalGame[] {
  return [...buildGameMonetizeExternalGames(), ...DEFAULT_EXTERNAL_PORTAL_GAMES];
}

function safeParse(raw: string): PersistedExternalGame[] {
  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as PersistedExternalGame[]) : [];
  } catch {
    return [];
  }
}

export function normalizeExternalGameUrl(input: string): string {
  const trimmed = String(input || "").trim();
  if (!trimmed) return "";
  const gmId = extractGameMonetizeId(trimmed);
  if (gmId) return buildGameMonetizeEmbedUrl(gmId);
  const candidate = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const url = new URL(candidate);
    if (url.protocol !== "http:" && url.protocol !== "https:") return "";
    return url.toString();
  } catch {
    return "";
  }
}

function deriveName(name: string, url: string): string {
  const cleanName = String(name || "").trim();
  if (cleanName) return cleanName.slice(0, 48);
  try {
    const host = new URL(url).hostname.replace(/^www\./i, "");
    return host.slice(0, 48);
  } catch {
    return "Custom game";
  }
}

export function buildCustomExternalPortalGame(name: string, inputUrl: string): ExternalPortalGame | null {
  const gmId = extractGameMonetizeId(inputUrl);
  const url = gmId ? buildGameMonetizeEmbedUrl(gmId) : normalizeExternalGameUrl(inputUrl);
  if (!url) return null;
  const finalName = deriveName(name, url);
  const id = `custom-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const provider: PortalProvider = /gamemonetize\./i.test(url) ? "gamemonetize" : "custom";
  return {
    id,
    name: finalName,
    icon: provider === "gamemonetize" ? "🕹️" : "↗",
    access: "free",
    cover: buildArcadeCoverCss(provider === "gamemonetize" ? "Arcade" : "Generic"),
    imageUrl: provider === "gamemonetize" ? buildGameMonetizeThumbUrl(gmId) : "",
    embedUrl: url,
    launchUrl: url,
    sourceLabel: provider === "gamemonetize" ? "GameMonetize embed" : "Custom direct link",
    shortNote: provider === "gamemonetize" ? "Added from GameMonetize ID / URL." : "Added from direct URL. Use embeddable links for iframe-safe launch.",
    category: provider === "gamemonetize" ? "Arcade" : "Custom",
    provider,
    custom: true,
  };
}

function hydratePersistedGame(item: PersistedExternalGame): ExternalPortalGame | null {
  const url = normalizeExternalGameUrl(item.embedUrl || item.launchUrl || "");
  if (!url) return null;
  const name = deriveName(item.name || "", url);
  const category = normalizeCategory(String(item.category || "Custom"));
  return {
    id: String(item.id || `custom-${Math.random().toString(36).slice(2, 8)}`),
    name,
    icon: String(item.icon || "↗").slice(0, 2),
    access: item.access === "pro" ? "pro" : "free",
    cover: String(item.cover || "").includes("/assets/arcade/covers/") ? String(item.cover) : buildArcadeCoverCss(category),
    imageUrl: String(item.imageUrl || ""),
    embedUrl: url,
    launchUrl: normalizeExternalGameUrl(item.launchUrl || url) || url,
    sourceLabel: String(item.sourceLabel || "Custom direct link").slice(0, 48),
    shortNote: String(item.shortNote || "Added from direct URL.").slice(0, 140),
    category,
    provider: item.provider,
    badge: item.badge,
    custom: true,
  };
}

export function readCustomExternalPortalGames(): ExternalPortalGame[] {
  try {
    const raw = localStorage.getItem(LS_EXTERNAL_GAMES) || "[]";
    return safeParse(raw)
      .map(hydratePersistedGame)
      .filter((item): item is ExternalPortalGame => Boolean(item));
  } catch {
    return [];
  }
}

export function writeCustomExternalPortalGames(games: ExternalPortalGame[]): void {
  const payload: PersistedExternalGame[] = games.slice(0, 30).map((game) => ({
    id: game.id,
    name: game.name,
    icon: game.icon,
    access: game.access,
    cover: game.cover,
    imageUrl: game.imageUrl,
    embedUrl: game.embedUrl,
    launchUrl: game.launchUrl,
    sourceLabel: game.sourceLabel,
    shortNote: game.shortNote,
    category: game.category,
    provider: game.provider,
    badge: game.badge,
  }));
  try {
    localStorage.setItem(LS_EXTERNAL_GAMES, JSON.stringify(payload));
  } catch {
    // ignore quota errors
  }
}

export function removeCustomExternalPortalGame(id: string): ExternalPortalGame[] {
  const next = readCustomExternalPortalGames().filter((game) => game.id !== id);
  writeCustomExternalPortalGames(next);
  return next;
}
