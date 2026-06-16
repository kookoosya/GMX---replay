(function (window) {
  if (window.__GMXCustomWallpapersFactory) return;

  window.__GMXCustomWallpapersFactory = function createGMXCustomWallpapers(ctx) {
    const apiPath = String(ctx.apiPath || "/api/wallpapers/custom");
    const customUploadId = String(ctx.customUploadId || "custom_upload");
    const getSiteCustomUpload =
      typeof ctx.getSiteCustomUpload === "function" ? ctx.getSiteCustomUpload : () => "";
    const getExtCustomUpload =
      typeof ctx.getExtCustomUpload === "function" ? ctx.getExtCustomUpload : () => "";

    let customWallpapersSite = [];
    let customWallpapersExt = [];
    let loaded = false;

    async function loadCustomWallpapers() {
      if (loaded) return false;
      try {
        const r = await fetch(apiPath, { cache: "no-store" });
        const j = await r.json();
        if (j?.ok) {
          loaded = true;
          customWallpapersSite = (j.site || []).map((x) => ({ ...x, tier: "custom" }));
          customWallpapersExt = (j.ext || []).map((x) => ({ ...x, tier: "custom" }));
          return customWallpapersSite.length > 0 || customWallpapersExt.length > 0;
        }
      } catch (_e) {}
      return false;
    }

    function getCustomWallpapersSite() {
      return customWallpapersSite;
    }

    function getCustomWallpapersExt() {
      return customWallpapersExt;
    }

    function getEffectiveCustomWallpapersSite() {
      const out = [...customWallpapersSite];
      try {
        if (getSiteCustomUpload()) {
          out.push({ id: customUploadId, name: "My upload", tier: "custom" });
        }
      } catch (_e) {}
      return out;
    }

    function getEffectiveExtCustomWallpapers() {
      const out = [...customWallpapersExt];
      try {
        if (getExtCustomUpload()) {
          out.push({ id: customUploadId, name: "My upload", tier: "custom" });
        }
      } catch (_e) {}
      return out;
    }

    return {
      loadCustomWallpapers,
      getCustomWallpapersSite,
      getCustomWallpapersExt,
      getEffectiveCustomWallpapersSite,
      getEffectiveExtCustomWallpapers,
      isLoaded: () => loaded,
    };
  };
})(window);
