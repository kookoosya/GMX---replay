(function (window) {
  if (window.__GMXThemeApplyFactory) return;

  window.__GMXThemeApplyFactory = function createGMXThemeApply(ctx) {
    const pickAccentOn =
      typeof ctx.pickAccentOn === "function" ? ctx.pickAccentOn : () => "#0A0D15";
    const getThemes = typeof ctx.getThemes === "function" ? ctx.getThemes : () => [];
    const getCurrentTab = typeof ctx.getCurrentTab === "function" ? ctx.getCurrentTab : () => "home";
    const setBg = typeof ctx.setBg === "function" ? ctx.setBg : () => {};
    const themeStorageKey = String(ctx.themeStorageKey || "gmx_theme");

    function applyTheme(id) {
      const themes = getThemes();
      const th = themes.find((x) => x.id === id) || themes[0];
      try {
        localStorage.setItem(themeStorageKey, String(th?.id || id));
      } catch (_e) {}
      const a = th?.a || "rgba(124,92,255,1)";
      const b = th?.b || "rgba(0,229,255,1)";
      const root = document.documentElement;
      root.style.setProperty("--accentA", a);
      root.style.setProperty("--accentB", b);
      root.style.setProperty("--accentOn", pickAccentOn(a, b));
      root.classList.add("theme-applied");
      root.dataset.themeId = String(th?.id || id);
      const isLight = root.classList.contains("mode-light");
      const glassBase = isLight ? "rgba(255,255,255,.88)" : "rgba(10,14,24,.72)";
      const glass2Base = isLight ? "rgba(255,255,255,.94)" : "rgba(8,12,22,.82)";
      root.style.setProperty("--glass", `color-mix(in srgb, ${glassBase} 84%, ${a} 16%)`);
      root.style.setProperty("--glass2", `color-mix(in srgb, ${glass2Base} 82%, ${b} 18%)`);
      root.style.setProperty(
        "--stroke",
        `color-mix(in srgb, ${a} 30%, ${isLight ? "rgba(0,0,0,.10)" : "rgba(148,180,255,.14)"})`
      );
      root.style.setProperty(
        "--stroke2",
        `color-mix(in srgb, ${b} 34%, ${isLight ? "rgba(0,0,0,.14)" : "rgba(148,180,255,.22)"})`
      );
      try {
        setBg(getCurrentTab());
      } catch (_e) {}
    }

    return { applyTheme };
  };
})(window);
