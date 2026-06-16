(function (window) {
  if (window.__GMXShellWireFactory) return;

  window.__GMXShellWireFactory = function createGMXShellWire(ctx) {
    ctx = ctx || {};
    const chrome = ctx.chrome || {};
    const $ = typeof ctx.$ === "function" ? ctx.$ : typeof chrome.$ === "function" ? chrome.$ : (id) => document.getElementById(id);
    const toast = typeof ctx.toast === "function" ? ctx.toast : typeof chrome.toast === "function" ? chrome.toast : () => {};
    const setDegraded =
      typeof ctx.setDegraded === "function" ? ctx.setDegraded : typeof chrome.setDegraded === "function" ? chrome.setDegraded : () => {};
    const showFatal =
      typeof ctx.showFatal === "function" ? ctx.showFatal : typeof chrome.showFatal === "function" ? chrome.showFatal : () => {};
    const hideFatal =
      typeof ctx.hideFatal === "function" ? ctx.hideFatal : typeof chrome.hideFatal === "function" ? chrome.hideFatal : () => {};
    const escapeHtml = typeof ctx.escapeHtml === "function" ? ctx.escapeHtml : (s) => String(s || "");
    const isInitDone = typeof ctx.isInitDone === "function" ? ctx.isInitDone : () => false;
    const normalizeTopLevelTab =
      typeof ctx.normalizeTopLevelTab === "function" ? ctx.normalizeTopLevelTab : (n) => n;
    const showTab = typeof ctx.showTab === "function" ? ctx.showTab : () => {};
    const ensurePredictionTabVisible =
      typeof ctx.ensurePredictionTabVisible === "function" ? ctx.ensurePredictionTabVisible : () => {};
    const buildAuthConfig =
      typeof ctx.buildAuthConfig === "function" ? ctx.buildAuthConfig : () => ({});

    if (!window.__GMXShellErrorsFactory) throw new Error("GMX shellerrors factory missing");
    const shellErrors = window.__GMXShellErrorsFactory({
      toast,
      setDegraded,
      showFatal,
      escapeHtml,
      isInitDone,
    });
    shellErrors.wireGlobalErrors();

    if (typeof chrome.wireDegradedBar === "function") chrome.wireDegradedBar();

    let trackEventImpl = async () => {};

    if (!window.__GMXTabWireFactory) throw new Error("GMX tabwire factory missing");
    const tabWire = window.__GMXTabWireFactory({
      normalizeTopLevelTab,
      showTab,
      trackEvent: (type, meta) => {
        try {
          trackEventImpl(type, meta);
        } catch (_e) {}
      },
      ensurePredictionTabVisible,
    });

    if (typeof chrome.wireFatalBar === "function") {
      chrome.wireFatalBar({
        onGoHome: () => {
          try {
            hideFatal();
            tabWire.tab("home");
          } catch (_e) {
            location.href = "/";
          }
        },
      });
    }

    if (!window.__GMXAuthWireFactory) throw new Error("GMX authwire factory missing");
    const authWire = window.__GMXAuthWireFactory({ buildAuthConfig });

    trackEventImpl = async function trackEvent(type, meta) {
      if (!authWire.getToken()) return;
      try {
        if (!authWire.getHandle()) return;
        await authWire.api("/api/event", "POST", { type, meta: meta || {} });
      } catch (_e) {}
    };

    tabWire.wireTabButtons();

    return {
      tab: (name) => tabWire.tab(name),
      wireTabButtons: () => tabWire.wireTabButtons(),
      getAuth: () => authWire.getAuth(),
      normalizeHandle: (input) => authWire.normalizeHandle(input),
      getHandle: () => authWire.getHandle(),
      getToken: () => authWire.getToken(),
      isConnected: () => authWire.isConnected(),
      requireConnected: (target) => authWire.requireConnected(target),
      isPublicApi: (path) => authWire.isPublicApi(path),
      initSession: (force) => authWire.initSession(force),
      api: (path, method, body, opts) => authWire.api(path, method, body, opts),
      trackEvent: (type, meta) => trackEventImpl(type, meta),
    };
  };
})(window);
