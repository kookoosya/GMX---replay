(function (window) {
  if (window.__GMXFormatFactory) return;

  window.__GMXFormatFactory = function createGMXFormat() {
    function escapeHtml(s) {
      return String(s || "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
    }

    function isNetworkishErrorMessage(msg) {
      const m = String(msg || "").trim();
      if (!m) return false;
      return (
        m === "request_failed" ||
        m === "timeout" ||
        m === "not_connected" ||
        m.includes("Failed to fetch") ||
        m.includes("NetworkError") ||
        m.includes("fetch") ||
        m.includes("ECONN")
      );
    }

    function friendlyUiErrorMessage(msg, opts) {
      const m = String(msg || "").trim();
      const scope = String((opts && opts.scope) || "").trim();
      if (!m) return scope === "connect" ? "Connection failed. Try again." : "Request failed. Try again.";
      if (m === "timeout") return scope === "generate" ? "Generation timed out. Try again." : "Network timeout. Try again.";
      if (m === "unauthorized") return "Unauthorized. Re-connect your handle.";
      if (m === "request_failed") {
        if (scope === "generate") return "Generation request failed. Check the backend and try again.";
        if (scope === "connect") return "Connection failed. Check the backend/runtime and try again.";
        return "Request failed. Check the backend/runtime and try again.";
      }
      if (m === "not_connected") return "Connect first.";
      if (m === "not_found" || m.includes("not_found")) {
        if (scope === "generate") {
          return "Generation API is unavailable. Hard-refresh the page; if it persists, the server needs redeploying.";
        }
        return "API route not found. Hard-refresh and try again.";
      }
      if (m === "rpc_unavailable") return "Solana RPC is unavailable right now. Try again in a moment.";
      if (m === "wallet_bind_required") {
        return "Wallet binding is required before verify. Sign the wallet message and try again.";
      }
      if (isNetworkishErrorMessage(m)) return "Network/API error. Try again.";
      return m;
    }

    return { escapeHtml, isNetworkishErrorMessage, friendlyUiErrorMessage };
  };
})(window);
