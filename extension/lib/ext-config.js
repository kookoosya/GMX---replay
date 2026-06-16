(function (global) {
  if (global.GMXExtConfig) return;

  const EXT_WP_NAMES = [
    "Solana Circuit",
    "DEGEN Terminal",
    "CT Warroom",
    "X Bull Feed",
    "Onchain Prism",
    "Mempool Riot",
    "WAGMI Signal",
    "Alpha Drift",
    "Neon Vault",
    "Solana Flux",
    "Degen Node",
    "Bullish X",
  ];

  const EXT_WALLPAPER_OPTIONS = (() => {
    const out = [
      { id: "ext_free_01", name: "X Bull Mempool" },
      { id: "ext_free_02", name: "Solana Neon" },
    ];
    for (let i = 1; i <= 58; i++) {
      const n = String(i).padStart(2, "0");
      const base = EXT_WP_NAMES[(i - 1) % EXT_WP_NAMES.length] || "Wall";
      out.push({ id: `w${n}`, name: `${base} #${i}` });
    }
    return out;
  })();

  global.GMXExtConfig = {
    DEFAULT_BASE: "https://www.gmxreply.com",
    STORAGE_KEYS: {
      base: "gmx_ext_api_base_v2",
      handle: "gmx_ext_handle_v2",
      token: "gmx_ext_token_v2",
      mode: "gmx_ext_mode_v2",
      lastText: "gmx_ext_last_text_v2",
    },
    ALERT_KEYS: {
      enabled: "gmx_market_alerts_enabled_v1",
      interval: "gmx_market_alerts_interval_v1",
    },
    ASSET_REV: "20260616c",
    WALLPAPER_REFRESH_KEY: "gmx_ext_wp_refresh_20260323",
    LEGACY_KEYS: {
      base: "apiBase",
      handle: "handle",
      token: "token",
    },
    THEME_KEYS: {
      extTheme: "gmx_ext_theme_v2",
      siteTheme: "gmx_theme",
      extView: "gmx_ext_view_v2",
      extWallpaper: "gmx_ext_wp_v2",
      extWallpaperPopup: "gmx_ext_wp_v2_popup",
      extWallpaperQuick: "gmx_ext_wp_v2_quick",
      extCustomBg: "gmx_ext_custom_bg_global_v2",
    },
    LEGACY_THEME_KEYS: {
      extTheme: "gmx_ext_theme",
      extView: "gmx_ext_view",
      extWallpaper: "gmx_ext_wp",
      extWallpaperPopup: "gmx_ext_wp_view_popup",
      extWallpaperQuick: "gmx_ext_wp_view_quick",
      extCustomBg: "gmx_ext_custom_bg_global",
    },
    EXT_WP_NAMES,
    EXT_WALLPAPER_OPTIONS,
    DEFAULT_THEME: {
      id: "classic",
      a: "rgba(110,231,255,1)",
      b: "rgba(79,70,229,1)",
    },
    FALLBACK_LINES: {
      gm: [
        "gm, hope your day starts easy",
        "good morning, nice read here",
        "gm, strong post and a clean start",
        "gm, hope the morning treats you well",
        "good morning, this was a solid read",
        "gm, wishing you a smooth day ahead",
      ],
      gn: [
        "gn, hope you get a calm reset tonight",
        "good night, soft close here",
        "gn, rest well after this one",
        "good night, hope you get an easy reset",
        "gn, calm post to end the day on",
        "good night, sleep well tonight",
      ],
    },
  };
})(typeof globalThis !== "undefined" ? globalThis : window);
