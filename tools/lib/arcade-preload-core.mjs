/** Arcade navigation preload targets (app shell → /arcade.html). */

export const ARCADE_PRELOAD_LINK_IDS = ["t_arcade", "btnArcade", "mmore_arcade"];

export const ARCADE_PRELOAD_PATHS = Object.freeze({
  page: "/arcade.html",
  script: "/arcade.js?v=SAFE16",
});

export function shouldSkipArcadePreload(env = {}) {
  if (env.saveData) return true;
  try {
    const path = String(env.pathname || "");
    if (path.endsWith("/arcade.html") || path.includes("/arcade/")) return true;
  } catch {}
  return false;
}

export function arcadePreloadUrls(paths = ARCADE_PRELOAD_PATHS) {
  return [paths.page, paths.script];
}
