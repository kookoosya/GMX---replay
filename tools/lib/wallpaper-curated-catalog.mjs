/** Curated dark UI-friendly wallpaper catalog (30 packs, 6 categories × 5). */

export const WALLPAPER_CATEGORIES = Object.freeze([
  { id: "neon-city", labelKey: "wp_cat_neon_city" },
  { id: "space", labelKey: "wp_cat_space" },
  { id: "nature", labelKey: "wp_cat_nature" },
  { id: "abstract", labelKey: "wp_cat_abstract" },
  { id: "minimal", labelKey: "wp_cat_minimal" },
]);

/** @type {{ name: string, category: string, palette: string[] }[]} */
export const CURATED_WALLPAPERS = [
  { name: "Rainy Skyline", category: "neon-city", palette: ["#020617", "#0f172a", "#1e3a5f", "#38bdf8", "#6366f1"] },
  { name: "Cyber Alley", category: "neon-city", palette: ["#030712", "#111827", "#7c3aed", "#22d3ee", "#f472b6"] },
  { name: "Glass Future City", category: "neon-city", palette: ["#0b1020", "#1e293b", "#334155", "#60a5fa", "#a78bfa"] },
  { name: "Night Rooftop", category: "neon-city", palette: ["#020617", "#172554", "#1e40af", "#f59e0b", "#94a3b8"] },
  { name: "Neon Harbor", category: "neon-city", palette: ["#041016", "#0c4a6e", "#155e75", "#06b6d4", "#e879f9"] },
  { name: "Subtle Nebula", category: "space", palette: ["#020617", "#1e1b4b", "#4c1d95", "#7c3aed", "#c4b5fd"] },
  { name: "Lunar Horizon", category: "space", palette: ["#030712", "#111827", "#374151", "#9ca3af", "#e5e7eb"] },
  { name: "Distant Planet", category: "space", palette: ["#020617", "#0f172a", "#1d4ed8", "#38bdf8", "#fca5a5"] },
  { name: "Minimal Star Field", category: "space", palette: ["#000000", "#020617", "#0f172a", "#1e293b", "#64748b"] },
  { name: "Deep Orbit", category: "space", palette: ["#030712", "#1e1b4b", "#312e81", "#6366f1", "#818cf8"] },
  { name: "Misty Mountains", category: "nature", palette: ["#0f172a", "#1e293b", "#334155", "#64748b", "#94a3b8"] },
  { name: "Dark Forest", category: "nature", palette: ["#052e16", "#14532d", "#166534", "#1e3a2f", "#4ade80"] },
  { name: "Ocean Twilight", category: "nature", palette: ["#042f2e", "#0f766e", "#115e59", "#134e4a", "#5eead4"] },
  { name: "Desert Night", category: "nature", palette: ["#1c1917", "#44403c", "#78350f", "#a16207", "#fcd34d"] },
  { name: "Northern Lights", category: "nature", palette: ["#020617", "#0c4a6e", "#0e7490", "#22d3ee", "#a7f3d0"] },
  { name: "Dark Glass", category: "abstract", palette: ["#020617", "#0f172a", "#1e293b", "#475569", "#94a3b8"] },
  { name: "Violet Waves", category: "abstract", palette: ["#1e1b4b", "#4c1d95", "#6d28d9", "#a78bfa", "#ddd6fe"] },
  { name: "Teal Depth", category: "abstract", palette: ["#042f2e", "#134e4a", "#0f766e", "#14b8a6", "#99f6e4"] },
  { name: "Graphite Geometry", category: "abstract", palette: ["#09090b", "#18181b", "#27272a", "#3f3f46", "#71717a"] },
  { name: "Liquid Gradient", category: "abstract", palette: ["#0f172a", "#312e81", "#5b21b6", "#db2777", "#fb7185"] },
  { name: "Black Texture", category: "minimal", palette: ["#000000", "#0a0a0a", "#111111", "#171717", "#262626"] },
  { name: "Dark Paper", category: "minimal", palette: ["#0c0a09", "#1c1917", "#292524", "#44403c", "#57534e"] },
  { name: "Subtle Grid", category: "minimal", palette: ["#020617", "#0f172a", "#1e293b", "#334155", "#475569"] },
  { name: "Monochrome Depth", category: "minimal", palette: ["#030712", "#111827", "#1f2937", "#374151", "#6b7280"] },
  { name: "Premium Dark Gradient", category: "minimal", palette: ["#000000", "#0f0f14", "#1a1a24", "#2a2a3a", "#3d3d52"] },
];

export const WALLPAPER_PACK_COUNT = CURATED_WALLPAPERS.length;
export const PACK_NAMES = CURATED_WALLPAPERS.map((w) => w.name);
export const PACK_CATEGORIES = CURATED_WALLPAPERS.map((w) => w.category);
