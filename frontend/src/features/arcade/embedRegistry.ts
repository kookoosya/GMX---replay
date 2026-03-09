export type ArcadeGame = {
  id: string;
  title: string;
  url: string;
  aspect?: "16:9" | "4:3" | "1:1" | "auto";
  note?: string;
};

// Keep this list STRICTLY to embeds that work for everyone.
// We'll fill it with the verified set you provide.
export const ARCADE_GAMES: ArcadeGame[] = [];
