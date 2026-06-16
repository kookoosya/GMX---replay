(function (window) {
  if (window.__GMXLogsFactory) return;

  window.__GMXLogsFactory = function createGMXLogs() {
    const LOGS = [];

    function logEvent(type, data) {
      try {
        LOGS.push({ ts: Date.now(), type, data: data || null });
        if (LOGS.length > 200) LOGS.shift();
      } catch {}
    }

    function getLogs() {
      return LOGS.slice();
    }

    return { logEvent, getLogs };
  };
})(window);
