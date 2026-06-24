(function (global) {
  if (global.GMXUnlockCore) return;

  const FREE_VISIBLE_EXT_THEMES = 4;
  const FREE_VISIBLE_EXT_WALLPAPERS = 6;
  const CUSTOM_WP_FREE_COUNT = 5;

  function unlockedCountByRefs(total, freeCount, refCount, isPro) {
    if (isPro) return total;
    const r = Math.max(0, Number(refCount) || 0);
    const t = Math.max(0, Number(total) || 0);
    const free = Math.max(0, Number(freeCount) || 0);
    if (t <= free) return t;
    const extraFast = Math.min(8, Math.floor(r / 3));
    const extraSlow = r > 24 ? Math.floor((r - 24) / 4) : 0;
    return Math.min(t, free + extraFast + extraSlow);
  }

  global.GMXUnlockCore = {
    FREE_VISIBLE_EXT_THEMES,
    FREE_VISIBLE_EXT_WALLPAPERS,
    CUSTOM_WP_FREE_COUNT,
    unlockedCountByRefs,
  };
})(typeof globalThis !== "undefined" ? globalThis : window);
