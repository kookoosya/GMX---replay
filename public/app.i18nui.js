(function (window) {
  if (window.__GMXI18nUiFactory) return;

  window.__GMXI18nUiFactory = function createGMXI18nUi(ctx) {
    const getSiteLang =
      typeof ctx.getSiteLang === "function" ? ctx.getSiteLang : () => "en";
    const getI18n =
      typeof ctx.getI18n === "function" ? ctx.getI18n : () => ({ en: {} });

    function sanitizeI18nValue(lang, value, fallback) {
      const allowCyr = lang === "ru" || lang === "uk";
      if (Array.isArray(value)) {
        const fb = Array.isArray(fallback) ? fallback : [];
        const out = value
          .map((item, idx) => sanitizeI18nValue(lang, item, fb[idx]))
          .filter((v) => v !== undefined && v !== null && v !== "");
        if (out.length) return out;
        return fb.length ? fb : undefined;
      }
      if (typeof value === "string") {
        const txt = value.trim();
        if (!txt) return typeof fallback === "string" && fallback.trim() ? fallback : undefined;
        if (!allowCyr && /[\u0400-\u04FF]/.test(value)) {
          return typeof fallback === "string" && fallback.trim() ? fallback : undefined;
        }
        return value;
      }
      if (value === undefined || value === null) return fallback;
      return value;
    }

    function tr(key) {
      const lang = getSiteLang();
      const base = getI18n().en || {};
      const dict = getI18n()[lang] || {};
      const v = sanitizeI18nValue(lang, dict[key], base[key]);
      return v ?? base[key] ?? key;
    }

    function t(key) {
      return tr(key);
    }

    function prettyError(code) {
      const c = String(code || "").trim();
      if (!c) return t("err_unknown") || "Unknown error";
      const m = {
        invalid_handle: t("err_invalid_handle") || "Invalid handle",
        unauthorized: t("err_unauthorized") || "Unauthorized",
        forbidden: t("err_forbidden") || "Forbidden",
        rate_limited: t("err_rate_limited") || "Too many requests",
        busy_try_again: t("err_busy") || "Server busy, try again",
        limit_reached: t("err_limit_reached") || "Daily limit reached",
        upgrade_required: t("err_upgrade_required") || "Upgrade required",
        server_error: t("err_server_error") || "Server error",
        not_found: t("err_not_found") || "Not found",
        init_failed: t("err_init_failed") || "Init failed",
      };
      return m[c] || c;
    }

    return { sanitizeI18nValue, tr, t, prettyError };
  };
})(window);
