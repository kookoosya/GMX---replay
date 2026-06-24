(function (global) {
  if (global.GMXSiteSyncCore) return;

  function normalizeText(raw) {
    return String(raw || "").trim();
  }

  function normalizeHandle(raw) {
    const value = normalizeText(raw).replace(/^@+/, "");
    if (!value) return "";
    return /^[A-Za-z0-9_]{1,15}$/.test(value) ? value : "";
  }

  /**
   * Site tab is source of truth for active login; extension-only auth is kept
   * only when the open site tab has no session (manual connect fallback).
   */
  function resolveSyncedSession({
    siteHandle = "",
    siteToken = "",
    forceLogout = false,
    prevHandle = "",
    prevToken = "",
  } = {}) {
    const handle = normalizeHandle(siteHandle);
    const token = normalizeText(siteToken);

    if (forceLogout) {
      return { handle: "", token: "", hasSiteSession: false };
    }
    if (handle && token) {
      return { handle, token, hasSiteSession: true };
    }
    return {
      handle: normalizeText(prevHandle),
      token: normalizeText(prevToken),
      hasSiteSession: false,
    };
  }

  global.GMXSiteSyncCore = {
    normalizeHandle,
    resolveSyncedSession,
  };
})(typeof globalThis !== "undefined" ? globalThis : window);
