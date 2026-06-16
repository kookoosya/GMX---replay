(function (window) {
  if (window.__GMXChromeFactory) return;

  window.__GMXChromeFactory = function createGMXChrome() {
    function $(id) {
      return document.getElementById(id);
    }

    function toast(type, html, ms = 4500) {
      const el = $("toast");
      if (!el) return;
      el.className = `toast ${type || ""}`;
      el.innerHTML = `<div class="ticon">${type === "ok" ? "OK" : type === "warn" ? "!" : "!"}</div><div class="tmsg">${html}</div>`;
      el.classList.remove("hidden");
      if (ms > 0) {
        clearTimeout(el.__t);
        el.__t = setTimeout(() => {
          el.classList.add("hidden");
        }, ms);
      }
    }

    return { $, toast };
  };
})(window);
