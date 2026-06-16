(function (window) {
  if (window.__GMXWallpaperUploadFactory) return;

  window.__GMXWallpaperUploadFactory = function createGMXWallpaperUpload(ctx) {
    ctx = ctx || {};
    const $ = typeof ctx.$ === "function" ? ctx.$ : (id) => document.getElementById(id);
    const requireConnected =
      typeof ctx.requireConnected === "function" ? ctx.requireConnected : () => true;
    const compressImageToJpegDataURL =
      typeof ctx.compressImageToJpegDataURL === "function"
        ? ctx.compressImageToJpegDataURL
        : async () => "";
    const customUploadId = ctx.customUploadId || "custom_upload";
    const lsSet =
      typeof ctx.lsSet === "function"
        ? ctx.lsSet
        : (k, v) => {
            try {
              localStorage.setItem(k, String(v));
            } catch {}
          };
    const customBgGlobalKey = ctx.customBgGlobalKey || "gmx_custom_bg_global";
    const wpGlobalKey = ctx.wpGlobalKey || "gmx_wp_all";
    const setWallpaperForTab =
      typeof ctx.setWallpaperForTab === "function" ? ctx.setWallpaperForTab : () => {};
    const renderWallpaperUI =
      typeof ctx.renderWallpaperUI === "function" ? ctx.renderWallpaperUI : () => {};
    const currentTabName =
      typeof ctx.currentTabName === "function" ? ctx.currentTabName : () => "home";
    const applyWallpaper = typeof ctx.applyWallpaper === "function" ? ctx.applyWallpaper : () => {};
    const applyUserBg = typeof ctx.applyUserBg === "function" ? ctx.applyUserBg : () => {};
    const toast = typeof ctx.toast === "function" ? ctx.toast : () => {};
    const t = typeof ctx.t === "function" ? ctx.t : (key) => key;

    function wire() {
      const wpAddCustom = $("wpAddCustom");
      const wpAddFile = $("wpAddFile");
      if (wpAddCustom && wpAddFile) {
        wpAddCustom.onclick = () => {
          if (requireConnected("Themes")) wpAddFile.click();
        };
      }
      if (!wpAddFile) return;
      wpAddFile.addEventListener("change", async () => {
        try {
          if (!requireConnected("Themes")) {
            wpAddFile.value = "";
            return;
          }
          const f = wpAddFile.files && wpAddFile.files[0];
          if (!f) return;
          const data = await compressImageToJpegDataURL(f, { profile: "site" });
          lsSet(customBgGlobalKey, data);
          const targetTab = $("wpTab")?.value || "all";
          if (targetTab === "all") lsSet(wpGlobalKey, customUploadId);
          else setWallpaperForTab(targetTab, customUploadId);
          try {
            renderWallpaperUI();
          } catch {}
          const previewTab = targetTab === "all" ? currentTabName() : targetTab;
          applyWallpaper(previewTab);
          applyUserBg(previewTab);
          toast("ok", t("toast_custom_bg_saved") || "Custom wallpaper saved.");
        } catch {
          toast("warn", t("err_custom_wp_save") || "Could not save image (too large or blocked).");
        } finally {
          wpAddFile.value = "";
        }
      });
    }

    return { wire };
  };
})(window);
