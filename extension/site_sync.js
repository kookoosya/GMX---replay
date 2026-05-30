(() => {
  if (window.__GMX_SAFE_SITE_SYNC__) return;
  window.__GMX_SAFE_SITE_SYNC__ = true;

  const LS_HANDLE = "gmx_handle";
  const LS_TOKEN = "gmx_token";
  const LS_FORCE_LOGOUT = "gmx_ext_force_logout_v2";
  const LS_FORCE_LOGOUT_LEGACY = "gmx_ext_force_logout";
  const LS_EXT_THEME = "gmx_ext_theme_v2";
  const LS_EXT_THEME_LEGACY = "gmx_ext_theme";
  const LS_SITE_THEME = "gmx_theme";
  const LS_EXT_WP = "gmx_ext_wp_v2";
  const LS_EXT_WP_LEGACY = "gmx_ext_wp";
  const LS_EXT_WP_VIEW_POPUP = "gmx_ext_wp_view_popup";
  const LS_EXT_WP_VIEW_QUICK = "gmx_ext_wp_view_quick";
  const LS_EXT_VIEW = "gmx_ext_view_v2";
  const LS_EXT_VIEW_LEGACY = "gmx_ext_view";
  const LS_EXT_CUSTOM_BG = "gmx_ext_custom_bg_global_v2";
  const LS_EXT_CUSTOM_BG_LEGACY = "gmx_ext_custom_bg_global";

  const V2_BASE = "gmx_ext_api_base_v2";
  const V2_HANDLE = "gmx_ext_handle_v2";
  const V2_TOKEN = "gmx_ext_token_v2";
  const LEGACY_BASE = "apiBase";
  const LEGACY_HANDLE = "handle";
  const LEGACY_TOKEN = "token";
  const EXT_THEME_KEY = "gmx_ext_theme_v2";
  const SITE_THEME_KEY = "gmx_theme";
  const EXT_WP_KEY = "gmx_ext_wp_v2";
  const EXT_WP_POPUP_KEY = "gmx_ext_wp_v2_popup";
  const EXT_WP_QUICK_KEY = "gmx_ext_wp_v2_quick";
  const EXT_VIEW_KEY = "gmx_ext_view_v2";
  const EXT_CUSTOM_BG_KEY = "gmx_ext_custom_bg_global_v2";

  const SYNC_LS_KEYS = [
    LS_HANDLE, LS_TOKEN, LS_FORCE_LOGOUT, LS_FORCE_LOGOUT_LEGACY,
    LS_EXT_THEME, LS_EXT_THEME_LEGACY, LS_SITE_THEME,
    LS_EXT_WP, LS_EXT_WP_LEGACY, LS_EXT_WP_VIEW_POPUP, LS_EXT_WP_VIEW_QUICK,
    LS_EXT_VIEW, LS_EXT_VIEW_LEGACY, LS_EXT_CUSTOM_BG, LS_EXT_CUSTOM_BG_LEGACY,
    EXT_WP_POPUP_KEY, EXT_WP_QUICK_KEY,
  ];

  function isAllowedOrigin() {
    try {
      const host = String(location.hostname || "").toLowerCase();
      return host === "gmxreply.com" || host === "www.gmxreply.com" || host === "localhost" || host === "127.0.0.1";
    } catch {
      return false;
    }
  }

  function normalizeHandle(raw) {
    const value = String(raw || "").trim().replace(/^@+/, "");
    if (!value) return "";
    return /^[A-Za-z0-9_]{1,15}$/.test(value) ? value : "";
  }

  function normalizeText(raw) {
    return String(raw || "").trim();
  }

  function readLs(primary, legacy) {
    return normalizeText(localStorage.getItem(primary) || localStorage.getItem(legacy) || "");
  }

  function getApiBase() {
    try {
      const hinted = String(window.__GMX_API_ORIGIN || "").trim();
      if (hinted) return hinted.replace(/\/$/, "");
    } catch {}
    return String(location.origin || "").trim().replace(/\/$/, "");
  }

  async function safeGet(keys) {
    try {
      return await chrome.storage.local.get(keys);
    } catch {
      return {};
    }
  }

  async function safeSet(payload) {
    try {
      await chrome.storage.local.set(payload);
      return true;
    } catch {
      return false;
    }
  }

  async function safeRemove(keys) {
    try {
      await chrome.storage.local.remove(keys);
      return true;
    } catch {
      return false;
    }
  }

  function isSame(prev, next) {
    return normalizeText(prev) === normalizeText(next);
  }

  async function syncOnce() {
    if (!isAllowedOrigin()) return { ok: false, reason: "not_allowed" };

    const siteHandle = normalizeHandle(localStorage.getItem(LS_HANDLE));
    const siteToken = normalizeText(localStorage.getItem(LS_TOKEN));
    const forceLogout = normalizeText(localStorage.getItem(LS_FORCE_LOGOUT) || localStorage.getItem(LS_FORCE_LOGOUT_LEGACY));
    const siteExtTheme = readLs(LS_EXT_THEME, LS_EXT_THEME_LEGACY);
    const siteTheme = normalizeText(localStorage.getItem(LS_SITE_THEME));
    const siteExtWallpaper = readLs(LS_EXT_WP, LS_EXT_WP_LEGACY);
    const siteExtWallpaperPopup = readLs(LS_EXT_WP_VIEW_POPUP, EXT_WP_POPUP_KEY);
    const siteExtWallpaperQuick = readLs(LS_EXT_WP_VIEW_QUICK, EXT_WP_QUICK_KEY);
    const siteExtView = readLs(LS_EXT_VIEW, LS_EXT_VIEW_LEGACY);
    const siteExtCustomBg = readLs(LS_EXT_CUSTOM_BG, LS_EXT_CUSTOM_BG_LEGACY);

    const prev = await safeGet([
      V2_BASE, V2_HANDLE, V2_TOKEN,
      LEGACY_BASE, LEGACY_HANDLE, LEGACY_TOKEN,
      EXT_THEME_KEY, SITE_THEME_KEY, EXT_WP_KEY, EXT_WP_POPUP_KEY, EXT_WP_QUICK_KEY,
      EXT_VIEW_KEY, EXT_CUSTOM_BG_KEY,
      LS_EXT_THEME_LEGACY, LS_EXT_WP_LEGACY, LS_EXT_VIEW_LEGACY, LS_EXT_CUSTOM_BG_LEGACY,
    ]);

    let nextHandle = "";
    let nextToken = "";

    if (forceLogout) {
      try { localStorage.removeItem(LS_FORCE_LOGOUT); } catch {}
      try { localStorage.removeItem(LS_FORCE_LOGOUT_LEGACY); } catch {}
    } else if (siteHandle && siteToken) {
      nextHandle = siteHandle;
      nextToken = siteToken;
    } else {
      nextHandle = normalizeText(prev[V2_HANDLE] || prev[LEGACY_HANDLE]);
      nextToken = normalizeText(prev[V2_TOKEN] || prev[LEGACY_TOKEN]);
    }

    const apiBase = getApiBase();
    const payload = {};

    if (!isSame(prev[V2_BASE], apiBase)) payload[V2_BASE] = apiBase;
    if (!isSame(prev[V2_HANDLE], nextHandle)) payload[V2_HANDLE] = nextHandle;
    if (!isSame(prev[V2_TOKEN], nextToken)) payload[V2_TOKEN] = nextToken;
    if (!isSame(prev[EXT_THEME_KEY], siteExtTheme)) payload[EXT_THEME_KEY] = siteExtTheme;
    if (!isSame(prev[SITE_THEME_KEY], siteTheme)) payload[SITE_THEME_KEY] = siteTheme;
    if (!isSame(prev[EXT_WP_KEY], siteExtWallpaper)) payload[EXT_WP_KEY] = siteExtWallpaper;
    if (!isSame(prev[EXT_WP_POPUP_KEY], siteExtWallpaperPopup)) payload[EXT_WP_POPUP_KEY] = siteExtWallpaperPopup;
    if (!isSame(prev[EXT_WP_QUICK_KEY], siteExtWallpaperQuick)) payload[EXT_WP_QUICK_KEY] = siteExtWallpaperQuick;
    if (!isSame(prev[EXT_VIEW_KEY], siteExtView)) payload[EXT_VIEW_KEY] = siteExtView;
    if (!isSame(prev[EXT_CUSTOM_BG_KEY], siteExtCustomBg)) payload[EXT_CUSTOM_BG_KEY] = siteExtCustomBg;

    const hadLegacyKeys = [LEGACY_BASE, LEGACY_HANDLE, LEGACY_TOKEN, LS_EXT_THEME_LEGACY, LS_EXT_WP_LEGACY, LS_EXT_VIEW_LEGACY, LS_EXT_CUSTOM_BG_LEGACY].some((key) => normalizeText(prev[key]));
    const changed = Object.keys(payload).length > 0;
    if (changed) {
      payload.sessionUpdatedAt = Date.now();
      await safeSet(payload);
    }
    if (hadLegacyKeys) {
      await safeRemove([LEGACY_BASE, LEGACY_HANDLE, LEGACY_TOKEN, LS_EXT_THEME_LEGACY, LS_EXT_WP_LEGACY, LS_EXT_VIEW_LEGACY, LS_EXT_CUSTOM_BG_LEGACY]);
    }

    return {
      ok: true,
      changed,
      handle: nextHandle,
      token: nextToken,
      hasToken: Boolean(nextToken),
      base: apiBase,
      extTheme: siteExtTheme,
      siteTheme,
      extWallpaper: siteExtWallpaper,
      extWallpaperPopup: siteExtWallpaperPopup,
      extWallpaperQuick: siteExtWallpaperQuick,
      extView: siteExtView,
      extCustomBg: siteExtCustomBg,
      hasCustomBg: Boolean(siteExtCustomBg),
    };
  }

  function scheduleSync() {
    void syncOnce();
  }

  window.addEventListener("message", (event) => {
    try {
      if (!event || !event.data || event.data.type !== "GMX_SYNC_NOW") return;
      scheduleSync();
    } catch {}
  }, { passive: true });

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (!message || message.type !== "GMX_FORCE_SITE_SYNC") return undefined;
    (async () => {
      const result = await syncOnce().catch((error) => ({ ok: false, error: String(error && error.message || error || "sync_failed") }));
      try {
        sendResponse(result || { ok: false, error: "sync_failed" });
      } catch {}
    })();
    return true;
  });

  void syncOnce();
  window.addEventListener("focus", scheduleSync, { passive: true });
  window.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") scheduleSync();
  }, { passive: true });
  window.addEventListener("storage", (event) => {
    try {
      const key = String(event && event.key || "");
      if (!key || SYNC_LS_KEYS.includes(key)) scheduleSync();
    } catch {
      scheduleSync();
    }
  }, { passive: true });
  setInterval(scheduleSync, 4000);
})();
