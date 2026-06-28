(function (window) {
  if (window.__GMXChromeWireFactory) return;

  window.__GMXChromeWireFactory = function createGMXChromeWire(ctx) {
    ctx = ctx || {};
    if (ctx.mod) {
      const mod = ctx.mod || {};
    const keys = ctx.keys || {};
    const hooks = ctx.hooks || {};
    const session = ctx.session || {};

    ctx = {
        chrome: mod.chrome,
        fmt: mod.fmt,
        styles: mod.styles,
        nav: mod.nav,
        setBg: mod.setBg,
        modals: mod.modals,
        toggles: mod.toggles,
        paywall: mod.paywall,
        health: mod.health,
        usage: mod.usage,
        help: mod.help,
        account: mod.account,
        getInitDone: session.getInitDone,
        normalizeTopLevelTab: hooks.normalizeTopLevelTab,
        LS_SITE_LANG: keys.LS_SITE_LANG,
        API: keys.API,
        LS_HANDLE: keys.LS_HANDLE,
        LS_TOKEN: keys.LS_TOKEN,
        LS_IS_ADMIN: keys.LS_IS_ADMIN,
        LS_ADMIN_CLAIMABLE: keys.LS_ADMIN_CLAIMABLE,
        isLocalDevHost: hooks.isLocalDevHost,
        getAdminToken: hooks.getAdminToken,
        setAuthOk: session.setAuthOk,
        t: hooks.t,
      };
    }
    const chrome = ctx.chrome || {};
    const fmt = ctx.fmt || {};
    const styles = ctx.styles || {};
    const nav = ctx.nav || {};
    const setBgMod = ctx.setBg || {};
    const modals = ctx.modals || {};
    const toggles = ctx.toggles || {};
    const paywall = ctx.paywall || {};
    const health = ctx.health || {};
    const usage = ctx.usage || {};
    const help = ctx.help || {};
    const account = ctx.account || {};
    const getInitDone = typeof ctx.getInitDone === "function" ? ctx.getInitDone : () => false;
    const normalizeTopLevelTab =
      typeof ctx.normalizeTopLevelTab === "function" ? ctx.normalizeTopLevelTab : (n) => n;
    const setAuthOk = typeof ctx.setAuthOk === "function" ? ctx.setAuthOk : () => {};
    const t = typeof ctx.t === "function" ? ctx.t : (k) => k;

    const $ = chrome.$;
    function toast(type, html, ms = 4500) {
      return chrome.toast?.(type, html, ms);
    }
    function setDegraded(on, msg) {
      return chrome.setDegraded?.(on, msg);
    }
    function showFatal(msg) {
      return chrome.showFatal?.(msg);
    }
    function hideFatal() {
      return chrome.hideFatal?.();
    }
    function setBusy(kind, on, label) {
      return chrome.setBusy?.(kind, on, label);
    }
    const esc = (s) => fmt.escapeHtml?.(s);

    function fillStyles() {
      return styles.fillStyles?.();
    }
    function setBg(tab) {
      return setBgMod.setBg?.(tab);
    }
    function ensurePredictionTabVisible() {
      return nav.ensurePredictionTabVisible?.();
    }
    function showTab(name) {
      return nav.showTab?.(name);
    }
    function showInfoModal(title, html) {
      return modals.showInfoModal?.(title, html);
    }
    function siteLang() {
      try {
        return String(localStorage.getItem(ctx.LS_SITE_LANG) || "en").toLowerCase();
      } catch (_e) {
        return "en";
      }
    }
    function getBestMode() {
      return toggles.getBestMode?.();
    }
    function setBestMode(next, silent) {
      return toggles.setBestMode?.(next, silent);
    }
    function syncBestModeUi() {
      return toggles.syncBestModeUi?.();
    }
    function abVariant() {
      return paywall.abVariant?.();
    }
    function openLimitModal(payload) {
      return paywall.openLimitModal?.(payload);
    }
    function closeLimitModal() {
      return paywall.closeLimitModal?.();
    }
    function bindLimitModal() {
      return paywall.bindLimitModal?.();
    }
    function setPayState(state, hint) {
      return paywall.setPayState?.(state, hint);
    }
    function openPaySuccess(payload) {
      return paywall.openPaySuccess?.(payload);
    }
    function closePaySuccess() {
      return paywall.closePaySuccess?.();
    }
    function bindPaySuccess() {
      return paywall.bindPaySuccess?.();
    }
    function setApiPillState(state) {
      return health.setApiPillState?.(state);
    }
    async function ping() {
      return health.ping?.();
    }
    async function loadBuild() {
      return health.loadBuild?.();
    }
    function watchBuildUpdates() {
      return health.watchBuildUpdates?.();
    }
    function normLimitForUI(limit) {
      return usage.normLimitForUI?.(limit);
    }
    function setMeter(valId, fillId, used, limit) {
      return usage.setMeter?.(valId, fillId, used, limit);
    }
    function renderHelpModal() {
      return help.renderHelpModal?.();
    }
    function openHelpModal() {
      return help.openHelpModal?.();
    }
    function closeHelpModal() {
      return help.closeHelpModal?.();
    }
    function bindHelpModal() {
      return help.bindHelpModal?.();
    }
    function applyRefCountEligible(eligible, opts) {
      return account.applyRefCountEligible?.(eligible, opts);
    }
    function usageCosmeticSignature(j) {
      return usage.usageCosmeticSignature?.(j);
    }
    async function refreshUsage() {
      return usage.refreshUsage?.();
    }
    function applyAdminVisibility() {
      return account.applyAdminVisibility?.();
    }

    if (!window.__GMXShellWireFactory) throw new Error("GMX shellwire factory missing");
    const shellWire = window.__GMXShellWireFactory({
      chrome,
      $,
      toast,
      setDegraded,
      showFatal,
      hideFatal,
      escapeHtml: esc,
      isInitDone: getInitDone,
      normalizeTopLevelTab,
      showTab: (n) => nav.showTab?.(n),
      ensurePredictionTabVisible: () => nav.ensurePredictionTabVisible?.(),
      buildAuthConfig: () => ({
        API: ctx.API,
        LS_HANDLE: ctx.LS_HANDLE,
        LS_TOKEN: ctx.LS_TOKEN,
        LS_IS_ADMIN: ctx.LS_IS_ADMIN,
        LS_ADMIN_CLAIMABLE: ctx.LS_ADMIN_CLAIMABLE,
        isLocalDevHost: ctx.isLocalDevHost,
        getAdminToken: ctx.getAdminToken,
        setAuthOk,
        $,
        t,
        toast,
        escapeHtml: esc,
        applyAdminVisibility,
        ping,
        setDegraded,
      }),
    });

    function tab(name) {
      return shellWire.tab?.(name);
    }
    function __getGMXAuth() {
      return shellWire.getAuth?.();
    }
    function normalizeHandle(input) {
      return shellWire.normalizeHandle?.(input);
    }
    function getHandle() {
      return shellWire.getHandle?.();
    }
    async function trackEvent(type, meta) {
      return shellWire.trackEvent?.(type, meta);
    }
    function getToken() {
      return shellWire.getToken?.();
    }
    function isConnected() {
      return shellWire.isConnected?.();
    }
    function requireConnected(target) {
      return shellWire.requireConnected?.(target);
    }
    function isPublicApi(path) {
      return shellWire.isPublicApi?.(path);
    }
    async function initSession(force = false) {
      return await shellWire.initSession?.(force);
    }
    async function api(path, method = "GET", body, opts = {}) {
      return await shellWire.api?.(path, method, body, opts);
    }

    return {
      $,
      toast,
      setDegraded,
      showFatal,
      hideFatal,
      setBusy,
      esc,
      fillStyles,
      setBg,
      ensurePredictionTabVisible,
      showTab,
      showInfoModal,
      tab,
      __getGMXAuth,
      normalizeHandle,
      getHandle,
      siteLang,
      getBestMode,
      setBestMode,
      syncBestModeUi,
      abVariant,
      trackEvent,
      openLimitModal,
      closeLimitModal,
      bindLimitModal,
      setPayState,
      openPaySuccess,
      closePaySuccess,
      bindPaySuccess,
      getToken,
      isConnected,
      requireConnected,
      isPublicApi,
      initSession,
      api,
      setApiPillState,
      ping,
      loadBuild,
      watchBuildUpdates,
      normLimitForUI,
      setMeter,
      renderHelpModal,
      openHelpModal,
      closeHelpModal,
      bindHelpModal,
      applyRefCountEligible,
      usageCosmeticSignature,
      refreshUsage,
      applyAdminVisibility,
    };
  };
})(window);
