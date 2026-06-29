(() => {
  if (window.__GMX_SAFE_SITE_SYNC__) return;
  window.__GMX_SAFE_SITE_SYNC__ = true;

  const syncCore = globalThis.GMXSiteSyncCore || {};
  const normalizeHandle =
    typeof syncCore.normalizeHandle === "function"
      ? syncCore.normalizeHandle
      : (raw) => {
          const value = String(raw || "").trim().replace(/^@+/, "");
          if (!value) return "";
          return /^[A-Za-z0-9_]{1,15}$/.test(value) ? value : "";
        };
  const resolveSyncedSession =
    typeof syncCore.resolveSyncedSession === "function"
      ? syncCore.resolveSyncedSession
      : () => ({ handle: "", token: "", hasSiteSession: false });

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
  const LS_SITE_LANG = "gmx_site_lang";
  const V2_SITE_LANG = "gmx_site_lang_v1";

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

  function isAllowedOrigin() {
    try {
      const host = String(location.hostname || "").toLowerCase();
      return host === "gmxreply.com" || host === "www.gmxreply.com" || host === "localhost" || host === "127.0.0.1";
    } catch {
      return false;
    }
  }

  function normalizeText(raw) {
    return String(raw || "").trim();
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
    const siteExtTheme = normalizeText(localStorage.getItem(LS_EXT_THEME) || localStorage.getItem(LS_EXT_THEME_LEGACY));
    const siteTheme = normalizeText(localStorage.getItem(LS_SITE_THEME));
    const siteExtWallpaper = normalizeText(localStorage.getItem(LS_EXT_WP) || localStorage.getItem(LS_EXT_WP_LEGACY));
    const siteExtWallpaperPopup = normalizeText(localStorage.getItem(LS_EXT_WP_VIEW_POPUP) || localStorage.getItem("gmx_ext_wp_v2_popup"));
    const siteExtWallpaperQuick = normalizeText(localStorage.getItem(LS_EXT_WP_VIEW_QUICK) || localStorage.getItem("gmx_ext_wp_v2_quick"));
    const siteExtView = normalizeText(localStorage.getItem(LS_EXT_VIEW) || localStorage.getItem(LS_EXT_VIEW_LEGACY));
    const siteExtCustomBg = normalizeText(localStorage.getItem(LS_EXT_CUSTOM_BG) || localStorage.getItem(LS_EXT_CUSTOM_BG_LEGACY));
    const siteLang = (() => {
      try {
        const v = String(localStorage.getItem(LS_SITE_LANG) || "en").trim().toLowerCase();
        return /^[a-z]{2}$/.test(v) ? v : "en";
      } catch {
        return "en";
      }
    })();

    const bankCore = globalThis.GMXBankSyncCore || {};
    const SITE_GM_BANK = bankCore.SITE_GM_BANK_KEY || "gmx_gm_bank";
    const SITE_GN_BANK = bankCore.SITE_GN_BANK_KEY || "gmx_gn_bank";
    const EXT_BANK_GM = bankCore.EXT_BANK_GM_KEY || "gmx_ext_bank_gm_v1";
    const EXT_BANK_GN = bankCore.EXT_BANK_GN_KEY || "gmx_ext_bank_gn_v1";
    const EXT_BANK_SYNCED_AT = bankCore.EXT_BANK_SYNCED_AT_KEY || "gmx_ext_bank_synced_at_v1";
    const parseBank =
      typeof bankCore.parseBankPayload === "function"
        ? bankCore.parseBankPayload
        : (raw) => ({ lines: [] });
    const gmBank = parseBank(localStorage.getItem(SITE_GM_BANK) || "");
    const gnBank = parseBank(localStorage.getItem(SITE_GN_BANK) || "");
    const gmJson = JSON.stringify(gmBank.lines || []);
    const gnJson = JSON.stringify(gnBank.lines || []);

    const prev = await safeGet([
      V2_BASE, V2_HANDLE, V2_TOKEN,
      LEGACY_BASE, LEGACY_HANDLE, LEGACY_TOKEN,
      EXT_THEME_KEY, SITE_THEME_KEY, EXT_WP_KEY, EXT_WP_POPUP_KEY, EXT_WP_QUICK_KEY, EXT_VIEW_KEY, EXT_CUSTOM_BG_KEY,
      LS_EXT_THEME_LEGACY, LS_EXT_WP_LEGACY, LS_EXT_VIEW_LEGACY, LS_EXT_CUSTOM_BG_LEGACY,
      V2_SITE_LANG,
      EXT_BANK_GM, EXT_BANK_GN, EXT_BANK_SYNCED_AT,
    ]);

    const prevHandle = normalizeText(prev[V2_HANDLE] || prev[LEGACY_HANDLE]);
    const prevToken = normalizeText(prev[V2_TOKEN] || prev[LEGACY_TOKEN]);
    const session = resolveSyncedSession({
      siteHandle,
      siteToken,
      forceLogout: Boolean(forceLogout),
      prevHandle,
      prevToken,
    });
    const nextHandle = session.handle;
    const nextToken = session.token;
    const hasSiteSession = Boolean(session.hasSiteSession);

    if (forceLogout) {
      try { localStorage.removeItem(LS_FORCE_LOGOUT); } catch {}
      try { localStorage.removeItem(LS_FORCE_LOGOUT_LEGACY); } catch {}
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
    if (!isSame(prev[V2_SITE_LANG], siteLang)) payload[V2_SITE_LANG] = siteLang;
    if (!isSame(prev[EXT_BANK_GM], gmJson)) payload[EXT_BANK_GM] = gmJson;
    if (!isSame(prev[EXT_BANK_GN], gnJson)) payload[EXT_BANK_GN] = gnJson;
    if (payload[EXT_BANK_GM] !== undefined || payload[EXT_BANK_GN] !== undefined) {
      payload[EXT_BANK_SYNCED_AT] = Date.now();
    }

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
      hasSiteSession,
      base: apiBase,
      extTheme: siteExtTheme,
      siteTheme,
      extWallpaper: siteExtWallpaper,
      extWallpaperPopup: siteExtWallpaperPopup,
      extWallpaperQuick: siteExtWallpaperQuick,
      extView: siteExtView,
      extCustomBg: siteExtCustomBg,
      hasCustomBg: Boolean(siteExtCustomBg),
      bankGmCount: (gmBank.lines || []).length,
      bankGnCount: (gnBank.lines || []).length,
    };
  }

  let syncRunning = false;
  let syncPending = false;

  async function runSyncOnce() {
    if (syncRunning) {
      syncPending = true;
      return { ok: false, reason: "pending" };
    }
    syncRunning = true;
    let lastResult = { ok: false };
    try {
      do {
        syncPending = false;
        lastResult = await syncOnce();
      } while (syncPending);
      return lastResult;
    } finally {
      syncRunning = false;
    }
  }

  function scheduleSync() {
    void runSyncOnce();
  }

  window.addEventListener("message", (event) => {
    try {
      if (!event || !event.data || event.data.type !== "GMX_SYNC_NOW") return;
      const origin = String(event.origin || "");
      if (origin && origin !== String(location.origin || "")) return;
      scheduleSync();
    } catch {}
  }, { passive: true });

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (!message || message.type !== "GMX_FORCE_SITE_SYNC") return undefined;
    try {
      const senderUrl = String(sender?.url || "");
      if (senderUrl && !/^chrome-extension:\/\//i.test(senderUrl)) {
        sendResponse({ ok: false, error: "forbidden_sender" });
        return false;
      }
    } catch {}
    (async () => {
      const result = await runSyncOnce().catch((error) => ({ ok: false, error: String(error && error.message || error || 'sync_failed') }));
      try {
        sendResponse(result || { ok: false, error: 'sync_failed' });
      } catch {}
    })();
    return true;
  });

  function pushExtToSite(changes) {
    if (!isAllowedOrigin()) return;
    try {
      let updated = false;
      if (changes[EXT_THEME_KEY]) {
        const v = String(changes[EXT_THEME_KEY].newValue || "").trim();
        if (v) {
          localStorage.setItem(LS_EXT_THEME, v);
          localStorage.setItem(LS_EXT_THEME_LEGACY, v);
          localStorage.setItem(LS_SITE_THEME, v);
          updated = true;
        }
      }
      if (changes[SITE_THEME_KEY]) {
        const v = String(changes[SITE_THEME_KEY].newValue || "").trim();
        if (v) {
          localStorage.setItem(LS_SITE_THEME, v);
          localStorage.setItem(LS_EXT_THEME, v);
          localStorage.setItem(LS_EXT_THEME_LEGACY, v);
          updated = true;
        }
      }
      if (changes[EXT_WP_KEY]) {
        const v = String(changes[EXT_WP_KEY].newValue || "").trim();
        localStorage.setItem(LS_EXT_WP, v);
        localStorage.setItem(LS_EXT_WP_LEGACY, v);
        updated = true;
      }
      if (changes[EXT_WP_POPUP_KEY]) {
        const v = String(changes[EXT_WP_POPUP_KEY].newValue || "").trim();
        localStorage.setItem(LS_EXT_WP_VIEW_POPUP, v);
        localStorage.setItem("gmx_ext_wp_v2_popup", v);
        updated = true;
      }
      if (changes[EXT_WP_QUICK_KEY]) {
        const v = String(changes[EXT_WP_QUICK_KEY].newValue || "").trim();
        localStorage.setItem(LS_EXT_WP_VIEW_QUICK, v);
        localStorage.setItem("gmx_ext_wp_v2_quick", v);
        updated = true;
      }
      if (changes[EXT_VIEW_KEY]) {
        const v = String(changes[EXT_VIEW_KEY].newValue || "").trim();
        if (v) localStorage.setItem(LS_EXT_VIEW, v);
        localStorage.setItem(LS_EXT_VIEW_LEGACY, v);
        updated = true;
      }
      if (changes[EXT_CUSTOM_BG_KEY]) {
        const v = String(changes[EXT_CUSTOM_BG_KEY].newValue || "").trim();
        localStorage.setItem(LS_EXT_CUSTOM_BG, v);
        localStorage.setItem(LS_EXT_CUSTOM_BG_LEGACY, v);
        updated = true;
      }
      if (updated) {
        window.postMessage({ type: "GMX_APPLY_THEME_FROM_EXTENSION" }, "*");
      }
    } catch (_e) {}
  }

  chrome.storage.onChanged.addListener((changes, areaName) => {
    try {
      if (areaName !== "local") return;
      const keys = [EXT_THEME_KEY, SITE_THEME_KEY, EXT_WP_KEY, EXT_WP_POPUP_KEY, EXT_WP_QUICK_KEY, EXT_VIEW_KEY, EXT_CUSTOM_BG_KEY];
      if (keys.some((k) => changes[k])) pushExtToSite(changes);
    } catch (_e) {}
  });

  void runSyncOnce();
  window.addEventListener("focus", scheduleSync, { passive: true });
  window.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") scheduleSync();
  }, { passive: true });
  window.addEventListener("storage", (event) => {
    try {
      const key = String(event && event.key || "");
      if (!key || [LS_HANDLE, LS_TOKEN, LS_FORCE_LOGOUT, LS_FORCE_LOGOUT_LEGACY, LS_EXT_THEME, LS_EXT_THEME_LEGACY, LS_SITE_THEME, LS_EXT_WP, LS_EXT_WP_LEGACY, LS_EXT_WP_VIEW_POPUP, LS_EXT_WP_VIEW_QUICK, LS_EXT_VIEW, LS_EXT_VIEW_LEGACY, LS_EXT_CUSTOM_BG, LS_EXT_CUSTOM_BG_LEGACY, LS_SITE_LANG, "gmx_gm_bank", "gmx_gn_bank"].includes(key)) {
        scheduleSync();
      }
    } catch {
      scheduleSync();
    }
  }, { passive: true });
  setInterval(scheduleSync, 4000);
})();
