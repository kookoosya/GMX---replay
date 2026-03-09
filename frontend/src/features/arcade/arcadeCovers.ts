/**
 * Arcade cover images: lightweight category posters used for game tiles.
 * Lives under /assets/arcade/covers/<key>.webp (served by backend).
 */
export type ArcadeCoverKey =
  | "shooter"
  | "racing"
  | "platformer"
  | "action"
  | "simulation"
  | "puzzle"
  | "strategy"
  | "idle"
  | "survivor"
  | "sports"
  | "arcade"
  | "crypto"
  | "generic";

function norm(input?: string): string {
  return String(input || "").trim().toLowerCase();
}

export function pickArcadeCoverKey(category?: string): ArcadeCoverKey {
  const raw = norm(category);
  if (!raw) return "generic";
  if (raw.includes("shoot")) return "shooter";
  if (raw.includes("race") || raw.includes("driv")) return "racing";
  if (raw.includes("platform")) return "platformer";
  if (raw.includes("action") || raw.includes("fight") || raw.includes("brawl")) return "action";
  if (raw.includes("sim") || raw.includes("farm")) return "simulation";
  if (raw.includes("puzz") || raw.includes("match")) return "puzzle";
  if (raw.includes("strateg") || raw.includes("war")) return "strategy";
  if (raw.includes("idle")) return "idle";
  if (raw.includes("surviv")) return "survivor";
  if (raw.includes("sport") || raw.includes("bowling")) return "sports";
  if (raw.includes("arcade")) return "arcade";
  if (raw.includes("crypto") || raw.includes("bitcoin") || raw.includes("sol")) return "crypto";
  if (raw.includes("custom")) return "generic";
  return "generic";
}

export function buildArcadeCoverCss(category?: string): string {
  const key = pickArcadeCoverKey(category);
  const url = `/assets/arcade/covers/${key}.webp`;
  // Gradient overlay keeps labels readable across any cover.
  return `linear-gradient(180deg, rgba(0,0,0,.08) 0%, rgba(0,0,0,.78) 100%), url("${url}") center/cover no-repeat`;
}
