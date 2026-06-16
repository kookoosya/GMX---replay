(function (window) {
  if (window.__GMXTabThemeFactory) return;

  window.__GMXTabThemeFactory = function createGMXTabTheme() {
    function createTabThemes() {
      const base = "linear-gradient(180deg, rgba(10,12,18,1) 0%, rgba(8,10,14,1) 100%)";
      const readVar = (name, fallback) =>
        getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
      const parseRGB = (s) => {
        const m = String(s || "").match(/rgba?\((\s*\d+\s*),\s*(\d+)\s*,\s*(\d+)/i);
        if (m) return { r: +m[1], g: +m[2], b: +m[3] };
        return { r: 124, g: 92, b: 255 };
      };
      const tint = (s, a) => {
        const c = parseRGB(s);
        return `rgba(${c.r},${c.g},${c.b},${a})`;
      };
      const A = (a) => tint(readVar("--accentA", "rgba(124,92,255,1)"), a);
      const B = (a) => tint(readVar("--accentB", "rgba(0,229,255,1)"), a);

      function mk(aX, aY, bX, bY, extra = "") {
        const layers = [
          `radial-gradient(1200px 620px at ${aX}% ${aY}%, ${A(0.22)}, transparent 60%)`,
          `radial-gradient(900px 520px at ${bX}% ${bY}%, ${B(0.18)}, transparent 58%)`,
          `radial-gradient(760px 440px at 60% 100%, ${A(0.1)}, transparent 62%)`,
          `radial-gradient(720px 420px at 10% 92%, ${B(0.08)}, transparent 65%)`,
          base,
        ];
        if (extra) layers.unshift(extra);
        return layers.join(", ");
      }

      const stripe135 = "repeating-linear-gradient(135deg, rgba(255,255,255,.04) 0 2px, transparent 2px 10px)";
      const stripe90 = "repeating-linear-gradient(90deg, rgba(255,255,255,.035) 0 2px, transparent 2px 12px)";
      const sheen45 = "linear-gradient(135deg, rgba(255,255,255,.04), transparent 55%)";
      const sheen225 = "linear-gradient(225deg, rgba(255,255,255,.04), transparent 60%)";
      const sheenA = () => `linear-gradient(135deg, ${A(0.1)}, transparent 55%)`;
      const sheenB = () => `linear-gradient(135deg, ${B(0.1)}, transparent 60%)`;
      const conicGM = () =>
        `conic-gradient(from 210deg at 18% 22%, ${A(0.12)}, transparent 35%, ${B(0.1)}, transparent 70%)`;
      const conicGN = () =>
        `conic-gradient(from 180deg at 80% 20%, ${B(0.12)}, transparent 40%, ${A(0.1)}, transparent 75%)`;
      const conicPay =
        "conic-gradient(from 230deg at 50% 10%, rgba(255,255,255,.05), transparent 25%, rgba(255,255,255,.04), transparent 60%)";
      const topSoft = "linear-gradient(0deg, rgba(255,255,255,.03), transparent 45%)";
      const topSoft2 = "linear-gradient(180deg, rgba(255,255,255,.03), transparent 60%)";

      return {
        home: () => mk(20, 10, 80, 20),
        gm: () => mk(22, 12, 76, 18, conicGM()),
        gn: () => mk(18, 18, 82, 14, conicGN()),
        studio: () => mk(18, 12, 82, 24, sheenA()),
        packs: () => mk(24, 14, 78, 26, sheenB()),
        bulk: () => mk(20, 16, 86, 18, stripe135),
        history: () => mk(16, 16, 84, 22, topSoft),
        favorites: () => mk(24, 10, 78, 20, topSoft2),
        referrals: () => mk(20, 14, 86, 22, stripe90),
        prediction: () => mk(18, 12, 82, 22, conicPay),
        themes: () => mk(18, 10, 84, 20, sheen45),
        extthemes: () => mk(18, 12, 82, 22, sheen225),
        wallet: () => mk(22, 12, 76, 22, conicPay),
      };
    }

    const TAB_THEME = createTabThemes();

    function getTabBg(tab) {
      const safeTab = String(tab || "home");
      const theme = TAB_THEME[safeTab] || TAB_THEME.home;
      return typeof theme === "function" ? theme() : theme;
    }

    return { TAB_THEME, getTabBg };
  };
})(window);
