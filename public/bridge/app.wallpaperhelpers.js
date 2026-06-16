(function (window) {
  if (window.__GMXWallpaperHelpersFactory) return;

  window.__GMXWallpaperHelpersFactory = function createGMXWallpaperHelpers(ctx) {
    const wp = ctx.wp || {};
    const getWallpapers = typeof ctx.getWallpapers === "function" ? ctx.getWallpapers : () => [];
    const getExtWallpapers =
      typeof ctx.getExtWallpapers === "function" ? ctx.getExtWallpapers : () => [];
    const isPro = typeof ctx.isPro === "function" ? ctx.isPro : () => false;
    const unlockedCountByRefs =
      typeof ctx.unlockedCountByRefs === "function" ? ctx.unlockedCountByRefs : (n) => n;
    const freeVisibleWallpapers = Number(ctx.freeVisibleWallpapers) || 8;
    const customWpFreeCount = Number(ctx.customWpFreeCount) || 5;

    function normalizeWallpaperId(id) {
      return wp.normalizeWallpaperId(id, getWallpapers());
    }

    function normalizeExtWallpaperIdLocal(id) {
      return wp.normalizeExtWallpaperIdLocal(id, getExtWallpapers());
    }

    function wallpaperAssetPath(id) {
      return wp.wallpaperAssetPath(id);
    }

    function wallpaperFullUrl(id) {
      return wp.wallpaperFullUrl(id, getWallpapers());
    }

    function wallpaperThumbUrl(id) {
      return wp.wallpaperThumbUrl(id, getWallpapers());
    }

    function wallpaperUrl(id) {
      return wp.wallpaperUrl(id, getWallpapers());
    }

    function extWallpaperAssetPath(id) {
      return wp.extWallpaperAssetPath(id, getExtWallpapers());
    }

    function extWallpaperFullUrl(id) {
      return wp.extWallpaperFullUrl(id, getExtWallpapers());
    }

    function extWallpaperThumbUrl(id) {
      return wp.extWallpaperThumbUrl(id, getExtWallpapers());
    }

    function wallpaperUnlocked(wpItem, idx, effectiveCustomLen) {
      if (!wpItem) return false;
      if (wpItem.tier === "custom") {
        return isPro() || idx < customWpFreeCount;
      }
      const mainIdx = idx - (effectiveCustomLen || 0);
      return (
        isPro() ||
        mainIdx < unlockedCountByRefs(getWallpapers().length, freeVisibleWallpapers)
      );
    }

    return {
      normalizeWallpaperId,
      normalizeExtWallpaperIdLocal,
      wallpaperAssetPath,
      wallpaperFullUrl,
      wallpaperThumbUrl,
      wallpaperUrl,
      extWallpaperAssetPath,
      extWallpaperFullUrl,
      extWallpaperThumbUrl,
      wallpaperUnlocked,
    };
  };
})(window);
