(function (global) {
  if (global.GMXExtCosmeticsGate) return;

  function unlockCore() {
    return global.GMXUnlockCore || {};
  }

  function usageIsPro(usage) {
    const sub = usage && usage.sub;
    if (!sub) return false;
    return !!(sub.active || sub.isUnlimited || sub.tier === "unlimited");
  }

  function refEligibleFromStats(refStats) {
    return Math.max(
      0,
      Number((refStats && (refStats.eligibleRefs ?? refStats.referrals ?? refStats.count)) ?? 0) || 0
    );
  }

  function themeIndex(themeId, themes) {
    return (themes || []).findIndex(
      (item) => String(item && item.id || "").trim() === String(themeId || "").trim()
    );
  }

  function wallpaperIndex(wallpaperId, options) {
    const id = String(wallpaperId || "").trim().toLowerCase();
    if (!id) return -1;
    return (options || []).findIndex(
      (item) => String(item && item.id || "").trim().toLowerCase() === id
    );
  }

  function isExtThemeUnlocked(themeId, themes, { isPro = false, refCount = 0 } = {}) {
    const core = unlockCore();
    if (isPro) return true;
    const idx = themeIndex(themeId, themes);
    if (idx < 0) return true;
    const allowed = core.unlockedCountByRefs(
      themes.length,
      core.FREE_VISIBLE_EXT_THEMES,
      refCount,
      isPro
    );
    return idx < allowed;
  }

  function isCatalogWallpaperUnlocked(wallpaperId, options, { isPro = false, refCount = 0 } = {}) {
    const core = unlockCore();
    if (isPro) return true;
    const idx = wallpaperIndex(wallpaperId, options);
    if (idx < 0) return false;
    const allowed = core.unlockedCountByRefs(
      options.length,
      core.FREE_VISIBLE_EXT_WALLPAPERS,
      refCount,
      isPro
    );
    return idx < allowed;
  }

  function isServerCustomWallpaperId(id) {
    return /^custom_/i.test(String(id || "").trim());
  }

  function isCustomUploadId(id) {
    return String(id || "").trim().toLowerCase() === "custom_upload";
  }

  function isExtWallpaperUnlocked(wallpaperId, options, entitlements) {
    const id = String(wallpaperId || "").trim();
    if (!id) return true;
    if (isCustomUploadId(id)) return true;
    if (isServerCustomWallpaperId(id)) return !!entitlements.isPro;
    return isCatalogWallpaperUnlocked(id, options, entitlements);
  }

  function firstUnlockedThemeId(themes, entitlements) {
    const list = themes && themes.length ? themes : [{ id: "classic" }];
    for (const item of list) {
      if (isExtThemeUnlocked(item.id, list, entitlements)) return item.id;
    }
    return list[0].id;
  }

  function clampExtCosmetics(cosmetics, ctx) {
    const themes = ctx.themes || [];
    const options = ctx.wallpaperOptions || [];
    const ent = {
      isPro: !!ctx.isPro,
      refCount: Math.max(0, Number(ctx.refCount) || 0),
    };

    let extTheme = String(cosmetics && cosmetics.extTheme || "").trim();
    let extView = String(cosmetics && cosmetics.extView || "theme").trim().toLowerCase();
    let extWallpaper = String(cosmetics && cosmetics.extWallpaper || "").trim();
    const extCustomBg = String(cosmetics && cosmetics.extCustomBg || "").trim();
    let changed = false;

    if (!isExtThemeUnlocked(extTheme, themes, ent)) {
      extTheme = firstUnlockedThemeId(themes, ent);
      changed = true;
    }

    if (extView === "wall" && extWallpaper && !isExtWallpaperUnlocked(extWallpaper, options, ent)) {
      extView = "theme";
      extWallpaper = "";
      changed = true;
    }

    if (extView === "custom" && extCustomBg && !ent.isPro) {
      // Site allows global custom bg for free; keep synced uploads visible.
    }

    if (isServerCustomWallpaperId(extWallpaper) && !ent.isPro) {
      extView = "theme";
      extWallpaper = "";
      changed = true;
    }

    return { extTheme, extView, extWallpaper, extCustomBg, changed };
  }

  global.GMXExtCosmeticsGate = {
    usageIsPro,
    refEligibleFromStats,
    isExtThemeUnlocked,
    isExtWallpaperUnlocked,
    clampExtCosmetics,
    firstUnlockedThemeId,
  };
})(typeof globalThis !== "undefined" ? globalThis : window);
