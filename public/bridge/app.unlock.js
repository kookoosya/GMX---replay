(function (global) {
  if (global.__GMXUnlockFactory) return;

  global.__GMXUnlockFactory = function createGMXUnlock(ctx) {
    const isPro = () => !!(ctx && typeof ctx.isPro === "function" && ctx.isPro());
    const refCount = () => Math.max(0, Number(ctx && typeof ctx.getRefCount === "function" ? ctx.getRefCount() : 0) || 0);

    const FREE_VISIBLE_THEMES = 8;
    const FREE_VISIBLE_STYLES = 5;
    const FREE_VISIBLE_PACKS = 2;
    const FREE_VISIBLE_WALLPAPERS = 8;
    const FREE_VISIBLE_EXT_THEMES = 4;
    const FREE_VISIBLE_EXT_WALLPAPERS = 6;

    function reqRefsForUnlockIndex(idx, freeCount = FREE_VISIBLE_THEMES) {
      if (idx < freeCount) return 0;
      const k = (idx - freeCount) + 1;
      if (k <= 8) return k * 3;
      return 24 + (k - 8) * 4;
    }

    function formatUnlockMeter(cur, total) {
      const c = Math.max(0, Number(cur) || 0);
      const t = Math.max(0, Number(total) || 0);
      if (isPro() || (t > 0 && c >= t)) return "All";
      if (!t) return "0";
      return `${Math.min(c, t)}/${t}`;
    }

    function unlockedCountByRefs(total, freeCount = FREE_VISIBLE_THEMES) {
      if (isPro()) return total;
      const r = refCount();
      if (total <= freeCount) return total;
      const extraFast = Math.min(8, Math.floor(r / 3));
      const extraSlow = (r > 24) ? Math.floor((r - 24) / 4) : 0;
      const extra = extraFast + extraSlow;
      return Math.min(total, freeCount + extra);
    }

    return {
      FREE_VISIBLE_THEMES,
      FREE_VISIBLE_STYLES,
      FREE_VISIBLE_PACKS,
      FREE_VISIBLE_WALLPAPERS,
      FREE_VISIBLE_EXT_THEMES,
      FREE_VISIBLE_EXT_WALLPAPERS,
      reqRefsForUnlockIndex,
      formatUnlockMeter,
      unlockedCountByRefs,
    };
  };
})(window);
