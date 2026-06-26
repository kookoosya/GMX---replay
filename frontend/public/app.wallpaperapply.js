(function (window) {
  if (window.__GMXWallpaperApplyFactory) return;

  window.__GMXWallpaperApplyFactory = function createGMXWallpaperApply(ctx) {
    const getCurrentTab =
      typeof ctx.getCurrentTab === "function" ? ctx.getCurrentTab : () => "home";
    const getWallpaperForTab =
      typeof ctx.getWallpaperForTab === "function" ? ctx.getWallpaperForTab : () => "";
    const getEffectiveCustomWallpapers =
      typeof ctx.getEffectiveCustomWallpapers === "function"
        ? ctx.getEffectiveCustomWallpapers
        : () => [];
    const getWallpapers =
      typeof ctx.getWallpapers === "function" ? ctx.getWallpapers : () => [];
    const wallpaperUnlocked =
      typeof ctx.wallpaperUnlocked === "function" ? ctx.wallpaperUnlocked : () => false;
    const wallpaperFullUrl =
      typeof ctx.wallpaperFullUrl === "function" ? ctx.wallpaperFullUrl : () => "";
    const ensureWallpaperLayer =
      typeof ctx.ensureWallpaperLayer === "function" ? ctx.ensureWallpaperLayer : () => null;
    const setWallpaperLayerImage =
      typeof ctx.setWallpaperLayerImage === "function" ? ctx.setWallpaperLayerImage : () => {};

    let lastApplyKey = "";

    function applyWallpaper(tab) {
      const safeTab = String(tab || getCurrentTab() || "home");
      const id = getWallpaperForTab(safeTab);
      const effectiveCustom = getEffectiveCustomWallpapers();
      const wallpapers = getWallpapers();
      const allWps = [...effectiveCustom, ...wallpapers];
      const wp =
        effectiveCustom.find((x) => x.id === id) || wallpapers.find((x) => x.id === id) || null;
      let idx = -1;
      try {
        idx = wp ? allWps.findIndex((x) => x.id === id) : -1;
      } catch {}
      const ok = !id || !wp || wallpaperUnlocked(wp, idx, effectiveCustom.length);

      const full = id && ok ? wallpaperFullUrl(id) : "";
      const on = !!(id && ok && full);
      const applyKey = safeTab + "|" + (on ? full : "");
      if (applyKey === lastApplyKey) return;
      lastApplyKey = applyKey;

      const layer = ensureWallpaperLayer();
      setWallpaperLayerImage(layer, on ? full : "");
      document.documentElement.style.setProperty("--bg_wall", "none");
      document.body.classList.toggle("hasWallBg", on);
      document.body.classList.toggle("has-wallpaper", on);
    }

    return { applyWallpaper };
  };
})(window);
