(function (window) {
  if (window.__GMXChromeFactory) return;

  const GM_BUSY_IDS = [
    "gmRand1", "gmRand10", "gmBestBtn", "gmNewAdd", "gmPasteAdd", "gmCleanup", "gmClear",
    "gmClearAll", "gmCopyAll", "gmExport", "gmViewGlobal", "gmViewLang", "gmFilter", "gmFilterClear",
  ];
  const GN_BUSY_IDS = [
    "gnRand1", "gnRand10", "gnBestBtn", "gnNewAdd", "gnPasteAdd", "gnCleanup", "gnClear",
    "gnClearAll", "gnCopyAll", "gnExport", "gnViewGlobal", "gnViewLang", "gnFilter", "gnFilterClear",
  ];

  window.__GMXChromeFactory = function createGMXChrome(ctx) {
    ctx = ctx || {};
    const inflight = ctx.inflight || { gm: false, gn: false };
    const escapeHtml = typeof ctx.escapeHtml === "function" ? ctx.escapeHtml : (s) => String(s || "");

    let apiDegraded = false;
    let degradedHidden = false;

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

    function setDegraded(on, msg) {
      apiDegraded = !!on;
      const bar = $("degradedBar");
      if (!bar) return;
      if (!apiDegraded) {
        bar.classList.add("hidden");
        degradedHidden = false;
        return;
      }
      if (degradedHidden) return;
      const title = $("degradedTitle");
      const text = $("degradedMsg");
      if (title) title.textContent = navigator.onLine === false ? "Offline (browser)" : "Offline mode";
      if (text) {
        text.textContent =
          msg || "API is unreachable. You can still edit lists locally; sync/verify will retry when back online.";
      }
      bar.classList.remove("hidden");
    }

    function showFatal(msg) {
      const ov = $("fatalOverlay");
      if (!ov) return;
      const fm = $("fatalMsg");
      if (fm) fm.textContent = msg || "Something went wrong.";
      ov.classList.remove("hidden");
    }

    function hideFatal() {
      const ov = $("fatalOverlay");
      if (!ov) return;
      ov.classList.add("hidden");
    }

    function setBusy(kind, on, label) {
      inflight[kind] = !!on;
      const ids = kind === "gm" ? GM_BUSY_IDS : GN_BUSY_IDS;
      for (const id of ids) {
        const el = $(id);
        if (!el) continue;
        el.disabled = !!on;
      }
      const msgEl = kind === "gm" ? $("gmMsg") : $("gnMsg");
      if (msgEl && on) {
        msgEl.innerHTML = `<span class="spinner"></span> <span class="muted">${escapeHtml(label || "Working...")}</span>`;
      }
    }

    function wireDegradedBar() {
      const dRetry = $("degradedRetry");
      if (dRetry) dRetry.onclick = () => { try { window.__gmxRetryNow?.(); } catch {} };
      const dHide = $("degradedHide");
      if (dHide) {
        dHide.onclick = () => {
          degradedHidden = true;
          $("degradedBar")?.classList.add("hidden");
        };
      }
      window.addEventListener("offline", () => {
        setDegraded(true, "Browser reports offline. Check your connection.");
      });
    }

    function wireFatalBar(handlers) {
      const h = handlers || {};
      const fr = $("fatalReload");
      if (fr) fr.addEventListener("click", () => location.reload());
      const fh = $("fatalGoHome");
      if (fh) {
        fh.addEventListener("click", () => {
          try {
            hideFatal();
            if (typeof h.onGoHome === "function") h.onGoHome();
          } catch {
            location.href = "/";
          }
        });
      }
    }

    function showInfoModal(title, html) {
      try {
        const old = document.getElementById("gmxInfoModal");
        if (old) old.remove();
        const wrap = document.createElement("div");
        wrap.id = "gmxInfoModal";
        wrap.style.cssText =
          "position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,.55);display:flex;align-items:center;justify-content:center;padding:16px;";
        wrap.innerHTML = `
        <div style="max-width:520px;width:100%;background:rgba(20,20,24,.98);border:1px solid rgba(255,255,255,.12);border-radius:16px;box-shadow:0 12px 40px rgba(0,0,0,.5);padding:16px 16px 12px;">
          <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:10px;">
            <div style="font-weight:800;font-size:15px;line-height:1.2;">${escapeHtml(title || "Info")}</div>
            <button id="gmxInfoClose" type="button" style="border:0;background:rgba(255,255,255,.08);color:#fff;border-radius:10px;padding:6px 10px;cursor:pointer;">OK</button>
          </div>
          <div style="font-size:13px;line-height:1.45;color:rgba(255,255,255,.88);">${html || ""}</div>
        </div>
      `;
        wrap.addEventListener("click", (e) => {
          if (e.target === wrap) wrap.remove();
        });
        document.body.appendChild(wrap);
        const btn = document.getElementById("gmxInfoClose");
        if (btn) btn.onclick = () => wrap.remove();
      } catch (_e) {}
    }

    return {
      $,
      toast,
      setDegraded,
      showFatal,
      hideFatal,
      setBusy,
      wireDegradedBar,
      wireFatalBar,
      showInfoModal,
      isDegraded: () => apiDegraded,
      inflight,
    };
  };
})(window);
