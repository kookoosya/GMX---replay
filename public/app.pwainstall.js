(function (window) {
  if (window.__GMXPwaInstallFactory) return;

  window.__GMXPwaInstallFactory = function createGMXPwaInstall(ctx) {
    ctx = ctx || {};
    const $ = typeof ctx.$ === "function" ? ctx.$ : (id) => document.getElementById(id);
    const siteTr = typeof ctx.siteTr === "function" ? ctx.siteTr : (_k, fb) => fb || "";
    const lsGet =
      typeof ctx.lsGet === "function"
        ? ctx.lsGet
        : (k, fb = "") => {
            try {
              const v = localStorage.getItem(k);
              return v === null || v === undefined ? fb : v;
            } catch {
              return fb;
            }
          };
    const lsSet =
      typeof ctx.lsSet === "function"
        ? ctx.lsSet
        : (k, v) => {
            try {
              localStorage.setItem(k, v);
            } catch {}
          };
    const dismissKey = ctx.dismissKey || "gmx_pwa_install_dismiss";

    let deferredPrompt = null;

    function isStandalone() {
      try {
        return (
          window.matchMedia("(display-mode: standalone)").matches ||
          window.navigator.standalone === true
        );
      } catch {
        return false;
      }
    }

    function isIos() {
      try {
        return /iphone|ipad|ipod/i.test(String(navigator.userAgent || ""));
      } catch {
        return false;
      }
    }

    function shouldShowInstall() {
      if (isStandalone()) return false;
      if (lsGet(dismissKey, "") === "1") return false;
      return true;
    }

    function revealInstallButton() {
      const btn = $("pwa_install");
      if (!btn || !shouldShowInstall()) return;
      btn.classList.remove("hidden");
      btn.title = siteTr("pwa_install_hint", "Add GMXReply to your home screen");
    }

    function hideInstallButton() {
      const btn = $("pwa_install");
      if (btn) btn.classList.add("hidden");
    }

    function registerServiceWorker() {
      if (!("serviceWorker" in navigator)) return;
      try {
        navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {});
      } catch {}
    }

    function bindPwaInstall() {
      registerServiceWorker();
      const btn = $("pwa_install");
      if (!btn) return;

      if (!shouldShowInstall()) {
        hideInstallButton();
        return;
      }

      window.addEventListener("beforeinstallprompt", (event) => {
        event.preventDefault();
        deferredPrompt = event;
        revealInstallButton();
      });

      window.addEventListener("appinstalled", () => {
        deferredPrompt = null;
        hideInstallButton();
      });

      if (isIos() && shouldShowInstall()) {
        revealInstallButton();
      }

      btn.addEventListener("click", async () => {
        if (deferredPrompt) {
          try {
            deferredPrompt.prompt();
            await deferredPrompt.userChoice;
          } catch {}
          deferredPrompt = null;
          hideInstallButton();
          return;
        }
        if (isIos()) {
          const msg = siteTr(
            "pwa_install_ios",
            "Tap Share, then Add to Home Screen."
          );
          try {
            window.alert(msg);
          } catch {}
        }
      });

      btn.addEventListener("contextmenu", (event) => {
        event.preventDefault();
        lsSet(dismissKey, "1");
        hideInstallButton();
      });
    }

    return { bindPwaInstall, registerServiceWorker, isStandalone };
  };
})(window);
