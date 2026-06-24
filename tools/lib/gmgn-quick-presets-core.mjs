/**
 * GM/GN one-click tone presets (Casual / Professional / Fun).
 */

export const QUICK_PRESET_IDS = ["casual", "professional", "fun"];

export const QUICK_PRESETS = {
  casual: { mode: "mid", style: "classic", pack: "classic" },
  professional: { mode: "mid", style: "alpha", pack: "king" },
  fun: { mode: "min", style: "cheer", pack: "classic" },
};

export function getQuickPreset(id) {
  const key = String(id || "").toLowerCase().trim();
  return QUICK_PRESETS[key] || null;
}

/** @deprecated use professional */
export function legacyPresetId(id) {
  return id === "pro" ? "professional" : id;
}
