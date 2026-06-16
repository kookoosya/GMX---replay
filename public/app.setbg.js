(function (window) {
  if (window.__GMXSetBgFactory) return;

  window.__GMXSetBgFactory = function createGMXSetBg(ctx) {
    const getTabBg = typeof ctx.getTabBg === "function" ? ctx.getTabBg : () => "";
    const applyWallpaper =
      typeof ctx.applyWallpaper === "function" ? ctx.applyWallpaper : () => {};
    const applyUserBg = typeof ctx.applyUserBg === "function" ? ctx.applyUserBg : () => {};

    function setBg(tab) {
      const safeTab = String(tab || "home");
      const hasWall = document.body.classList.contains("hasWallBg");
      if (hasWall) {
        document.documentElement.style.setProperty(
          "--bg",
          "linear-gradient(180deg, rgba(5,7,15,.12) 0%, rgba(5,7,15,.32) 100%)"
        );
      } else {
        document.documentElement.style.setProperty("--bg", getTabBg(safeTab));
      }
      applyWallpaper(safeTab);
      applyUserBg(safeTab);
    }

    return { setBg };
  };
})(window);
