(function (window) {
  if (window.__GMXAuthWireFactory) return;

  window.__GMXAuthWireFactory = function createGMXAuthWire(ctx) {
    const buildAuthConfig =
      typeof ctx.buildAuthConfig === "function" ? ctx.buildAuthConfig : () => ({});

    let instance = null;

    function getAuth() {
      if (instance) return instance;
      if (!window.__GMXAuthFactory) throw new Error("GMX auth factory missing");
      instance = window.__GMXAuthFactory(buildAuthConfig());
      return instance;
    }

    function normalizeHandle(input) {
      return getAuth().normalizeHandle(input);
    }

    function getHandle() {
      return getAuth().getHandle();
    }

    function getToken() {
      return getAuth().getToken();
    }

    function isConnected() {
      return getAuth().isConnected();
    }

    function requireConnected(target) {
      return getAuth().requireConnected(target);
    }

    function isPublicApi(path) {
      return getAuth().isPublicApi(path);
    }

    async function initSession(force = false) {
      return getAuth().initSession(force);
    }

    function invalidatePendingSessionInit() {
      return getAuth().invalidatePendingSessionInit();
    }

    async function api(path, method = "GET", body, opts = {}) {
      return getAuth().api(path, method, body, opts);
    }

    return {
      getAuth,
      normalizeHandle,
      getHandle,
      getToken,
      isConnected,
      requireConnected,
      isPublicApi,
      initSession,
      invalidatePendingSessionInit,
      api,
    };
  };
})(window);
