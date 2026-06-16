(function (global) {
  if (global.__GMXStorageFactory) return;

  global.__GMXStorageFactory = function createGMXStorage() {
    const keys = Object.freeze({
      REF_ELIGIBLE_CACHE: "gmx_ref_eligible_v1",
      HANDLE: "gmx_handle",
      TOKEN: "gmx_token",
      IS_ADMIN: "gmx_is_admin",
      ADMIN_CLAIMABLE: "gmx_admin_claimable",
      SITE_LANG: "gmx_site_lang",
      SITE_MODE: "gmx_site_mode",
      LAST_TAB: "gmx_last_tab",
      REF_PROMO_OPEN: "gmx_ref_promo_open",
      GM_REPLY_LANG: "gmx_gm_reply_lang",
      GN_REPLY_LANG: "gmx_gn_reply_lang",
      BEST_ENABLED: "gmx_best_enabled",
      FORCE_LOGOUT: "gmx_ext_force_logout",
      FORCE_LOGOUT_V2: "gmx_ext_force_logout_v2",
      TOGGLES_BOOTSTRAP_V2: "gmx_toggles_bootstrap_v2",
      GM_GLOBAL: "gmx_gm_global",
      GN_GLOBAL: "gmx_gn_global",
      GM_LANGS: "gmx_gm_langs",
      GN_LANGS: "gmx_gn_langs",
      CUSTOM_BG: "gmx_custom_bg",
      CUSTOM_BG_GLOBAL: "gmx_custom_bg_global",
      CUSTOM_BG_TAB_PREFIX: "gmx_custom_bg_tab_",
      GM_PACK: "gmx_gm_pack",
      GN_PACK: "gmx_gn_pack",
      GM_STYLE: "gmx_gm_style_v2",
      GN_STYLE: "gmx_gn_style_v2",
      GM_ANTI: "gmx_gm_anti",
      GN_ANTI: "gmx_gn_anti",
      GM_CLEAN_FILL: "gmx_gm_clean_fill",
      GN_CLEAN_FILL: "gmx_gn_clean_fill",
      CLEAN_FILL_BOOTSTRAP: "gmx_clean_fill_bootstrap_v5",
      GM_RECENT: "gmx_gm_recent",
      GN_RECENT: "gmx_gn_recent",
      WP_GLOBAL: "gmx_wp_all",
      WP_TAB_PREFIX: "gmx_wp_tab_",
      WALLPAPER_REFRESH_MIGRATION: "gmx_wallpaper_pexels_v2",
      THEMEWALL_VIEW: "gmx_themewall_view",
      EXT_VIEW: "gmx_ext_view",
      EXT_WP: "gmx_ext_wp",
      EXT_CUSTOM_BG_GLOBAL: "gmx_ext_custom_bg_global",
      EXT_CUSTOM_BG_TAB_PREFIX: "gmx_ext_custom_bg_tab_",
      EXT_CUSTOM_BG_TARGET: "gmx_ext_custom_bg_target",
      EXT_CUSTOM_BG_LEGACY: "gmx_ext_custom_bg",
      EXT_WP_TARGET: "gmx_ext_wp_target",
      EXT_WP_VIEW_PREFIX: "gmx_ext_wp_view_",
      WALLET_CHOICE: "gmx_wallet_choice_v2",
      DRAFT_GM_NEW: "gmx_draft_gm_new",
      DRAFT_GN_NEW: "gmx_draft_gn_new",
      DRAFT_GM_PASTE: "gmx_draft_gm_paste",
      DRAFT_GN_PASTE: "gmx_draft_gn_paste",
    });

    const SS_ADMIN_TOKEN = "gmx_admin_token";

    const EXT_LS_V2 = Object.freeze({
      gmx_ext_theme: "gmx_ext_theme_v2",
      gmx_ext_wp: "gmx_ext_wp_v2",
      gmx_ext_view: "gmx_ext_view_v2",
      gmx_ext_custom_bg_global: "gmx_ext_custom_bg_global_v2",
      gmx_ext_wp_view_popup: "gmx_ext_wp_v2_popup",
      gmx_ext_wp_view_quick: "gmx_ext_wp_v2_quick",
    });

    function lsGet(key, fallback = "") {
      try {
        const v = localStorage.getItem(key);
        return v === null || v === undefined ? fallback : v;
      } catch {
        return fallback;
      }
    }

    function lsSet(key, value) {
      try {
        if (value === undefined || value === null || value === "") {
          localStorage.removeItem(key);
        } else {
          localStorage.setItem(key, String(value));
        }
      } catch {}
    }

    function lsRemove(key) {
      try {
        localStorage.removeItem(key);
      } catch {}
    }

    function lsGetBool(key, fallback = false) {
      return lsGet(key, fallback ? "1" : "0") === "1";
    }

    function lsSetBool(key, on) {
      lsSet(key, on ? "1" : "0");
    }

    function ssGet(key, fallback = "") {
      try {
        const v = sessionStorage.getItem(key);
        return v === null || v === undefined ? fallback : v;
      } catch {
        return fallback;
      }
    }

    function ssSet(key, value) {
      try {
        if (value === undefined || value === null || value === "") {
          sessionStorage.removeItem(key);
        } else {
          sessionStorage.setItem(key, String(value));
        }
      } catch {}
    }

    function ssRemove(key) {
      try {
        sessionStorage.removeItem(key);
      } catch {}
    }

    function getAdminToken() {
      return String(ssGet(SS_ADMIN_TOKEN, "")).trim();
    }

    function setAdminToken(t) {
      const v = String(t || "").trim();
      if (v) ssSet(SS_ADMIN_TOKEN, v);
      else ssRemove(SS_ADMIN_TOKEN);
    }

    function isAdminSignedIn() {
      return !!getAdminToken();
    }

    function extLsSet(key, value) {
      try {
        const v2 = EXT_LS_V2[key];
        if (value === undefined || value === null || value === "") {
          localStorage.removeItem(key);
          if (v2) localStorage.removeItem(v2);
          return;
        }
        const text = String(value);
        localStorage.setItem(key, text);
        if (v2) localStorage.setItem(v2, text);
      } catch {}
    }

    function lsKeyCleanFill(kind) {
      return kind === "gn" ? keys.GN_CLEAN_FILL : keys.GM_CLEAN_FILL;
    }

    function lsKeyPack(kind) {
      return kind === "gn" ? keys.GN_PACK : keys.GM_PACK;
    }

    function lsKeyStyle(kind) {
      return kind === "gn" ? keys.GN_STYLE : keys.GM_STYLE;
    }

    function lsKeyAnti(kind) {
      return kind === "gn" ? keys.GN_ANTI : keys.GM_ANTI;
    }

    function lsKeyRecent(kind) {
      return kind === "gn" ? keys.GN_RECENT : keys.GM_RECENT;
    }

    function bootstrapCleanFillDefaults() {
      if (lsGet(keys.CLEAN_FILL_BOOTSTRAP) === "1") return;
      lsSet(keys.GM_CLEAN_FILL, "0");
      lsSet(keys.GN_CLEAN_FILL, "0");
      lsSet(keys.CLEAN_FILL_BOOTSTRAP, "1");
    }

    function getCleanFillEnabled(kind) {
      return lsGet(lsKeyCleanFill(kind)) === "1";
    }

    function setCleanFillEnabledRaw(kind, on) {
      lsSet(lsKeyCleanFill(kind), on ? "1" : "0");
    }

    return {
      keys,
      EXT_LS_V2,
      lsGet,
      lsSet,
      lsRemove,
      lsGetBool,
      lsSetBool,
      ssGet,
      ssSet,
      ssRemove,
      getAdminToken,
      setAdminToken,
      isAdminSignedIn,
      extLsSet,
      lsKeyCleanFill,
      lsKeyPack,
      lsKeyStyle,
      lsKeyAnti,
      lsKeyRecent,
      bootstrapCleanFillDefaults,
      getCleanFillEnabled,
      setCleanFillEnabledRaw,
    };
  };
})(window);
