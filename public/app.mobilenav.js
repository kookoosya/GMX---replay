(function (window) {
  if (window.__GMXMobileNavFactory) return;

  window.__GMXMobileNavFactory = function createGMXMobileNav(ctx) {
    ctx = ctx || {};
    const $ = typeof ctx.$ === "function" ? ctx.$ : (id) => document.getElementById(id);
    const switchTab = typeof ctx.switchTab === "function" ? ctx.switchTab : () => {};
    const getCurrentTab =
      typeof ctx.getCurrentTab === "function" ? ctx.getCurrentTab : () => "home";
    const siteTr = typeof ctx.siteTr === "function" ? ctx.siteTr : (_k, fb) => fb || "";

    const core = window.GMXMobileNavCore || {};
    const SWIPE_MAX_VERTICAL_RATIO = core.SWIPE_MAX_VERTICAL_RATIO ?? 1.35;

    let mq = null;
    let touchStart = null;
    let bound = false;

    function isMobileNavViewport() {
      try {
        return window.matchMedia(`(max-width: ${core.MOBILE_NAV_BREAKPOINT_PX ?? 720}px)`).matches;
      } catch {
        return false;
      }
    }

    function setBodyMobileNav(on) {
      try {
        document.body.classList.toggle("mobileNavOn", !!on);
      } catch {}
    }

    function refreshLabels() {
      const nav = $("mobileBottomNav");
      if (!nav) return;
      for (const btn of nav.querySelectorAll("[data-label-key]")) {
        const key = btn.getAttribute("data-label-key") || "";
        const fb = btn.getAttribute("data-label-fb") || "";
        const label = btn.querySelector(".mobileNavLabel");
        if (label) label.textContent = siteTr(key, fb);
      }
      const sheet = $("mobileMoreSheet");
      if (sheet) {
        for (const btn of sheet.querySelectorAll("[data-label-key]")) {
          const key = btn.getAttribute("data-label-key") || "";
          const fb = btn.getAttribute("data-label-fb") || "";
          const label = btn.querySelector(".mobileMoreLabel");
          if (label) label.textContent = siteTr(key, fb);
        }
      }
      const hint = $("gmgnSwipeHint");
      if (hint) {
        hint.textContent = siteTr(
          "gm_swipe_hint",
          "Swipe left or right to switch between GM and GN"
        );
      }
      const moreTitle = $("mobileMoreTitle");
      if (moreTitle) moreTitle.textContent = siteTr("mobile_nav_more", "More");
    }

    function syncActive(tabName) {
      const tab = String(tabName || getCurrentTab() || "home").trim().toLowerCase();
      const primary = core.primaryNavActiveTab?.(tab) || tab;
      const nav = $("mobileBottomNav");
      if (nav) {
        nav.querySelectorAll(".mobileNavBtn").forEach((btn) => {
          const key = btn.dataset.tab || "";
          btn.classList.toggle("active", key === primary);
          btn.setAttribute("aria-current", key === primary ? "page" : "false");
        });
      }
      const sheet = $("mobileMoreSheet");
      if (sheet) {
        sheet.querySelectorAll("[data-tab]").forEach((btn) => {
          if (!btn.dataset.tab) return;
          btn.classList.toggle("active", btn.dataset.tab === tab);
        });
      }
      const hint = $("gmgnSwipeHint");
      if (hint) {
        hint.classList.toggle("hidden", !core.isGmGnTab?.(tab));
      }
    }

    function closeMoreSheet() {
      const sheet = $("mobileMoreSheet");
      if (sheet) sheet.classList.add("hidden");
    }

    function openMoreSheet() {
      const sheet = $("mobileMoreSheet");
      if (sheet) sheet.classList.remove("hidden");
    }

    function onPrimaryNavClick(tab) {
      if (tab === "more") {
        openMoreSheet();
        syncActive(getCurrentTab());
        return;
      }
      closeMoreSheet();
      switchTab(tab);
    }

    function shouldIgnoreSwipeTarget(el) {
      if (!el || !(el instanceof Element)) return true;
      const tag = String(el.tagName || "").toLowerCase();
      if (tag === "input" || tag === "textarea" || tag === "select" || tag === "button") return true;
      if (el.closest("button, a, input, textarea, select, label, .modal, .genHistoryItem")) return true;
      return false;
    }

    function bindSwipePane(paneId) {
      const pane = $(paneId);
      if (!pane || pane.dataset.gmxSwipeBound === "1") return;
      pane.dataset.gmxSwipeBound = "1";

      pane.addEventListener(
        "touchstart",
        (ev) => {
          if (!isMobileNavViewport()) return;
          const t = ev.changedTouches?.[0] || ev.touches?.[0];
          if (!t || shouldIgnoreSwipeTarget(ev.target)) {
            touchStart = null;
            return;
          }
          touchStart = { x: t.clientX, y: t.clientY, tab: paneId === "tab-gm" ? "gm" : "gn" };
        },
        { passive: true }
      );

      pane.addEventListener(
        "touchend",
        (ev) => {
          if (!touchStart || !isMobileNavViewport()) return;
          const start = touchStart;
          touchStart = null;
          const t = ev.changedTouches?.[0];
          if (!t) return;
          const dx = t.clientX - start.x;
          const dy = t.clientY - start.y;
          if (Math.abs(dy) * SWIPE_MAX_VERTICAL_RATIO > Math.abs(dx)) return;
          const current = getCurrentTab();
          const resolved = core.resolveGmGnSwipeTarget?.(start.tab || current, dx);
          if (resolved && resolved !== current) {
            closeMoreSheet();
            switchTab(resolved);
          }
        },
        { passive: true }
      );
    }

    function bindViewport() {
      const apply = () => {
        const on = isMobileNavViewport();
        setBodyMobileNav(on);
        const nav = $("mobileBottomNav");
        if (nav) nav.classList.toggle("hidden", !on);
        if (!on) closeMoreSheet();
      };
      try {
        mq = window.matchMedia(`(max-width: ${core.MOBILE_NAV_BREAKPOINT_PX ?? 720}px)`);
        mq.addEventListener("change", apply);
      } catch {}
      apply();
    }

    function bindMobileNav() {
      if (bound) return;
      bound = true;

      refreshLabels();
      bindViewport();
      bindSwipePane("tab-gm");
      bindSwipePane("tab-gn");

      const nav = $("mobileBottomNav");
      if (nav) {
        nav.querySelectorAll(".mobileNavBtn").forEach((btn) => {
          btn.addEventListener("click", () => onPrimaryNavClick(btn.dataset.tab || ""));
        });
      }

      const sheet = $("mobileMoreSheet");
      if (sheet) {
        sheet.querySelectorAll("[data-tab]").forEach((btn) => {
          btn.addEventListener("click", () => {
            const tab = btn.dataset.tab || "";
            if (!tab) return;
            closeMoreSheet();
            switchTab(tab);
          });
        });
        const backdrop = $("mobileMoreBackdrop");
        if (backdrop) backdrop.addEventListener("click", closeMoreSheet);
        const closeBtn = $("mobileMoreClose");
        if (closeBtn) closeBtn.addEventListener("click", closeMoreSheet);
      }

      try {
        window.__gmxMobileNavSync = syncActive;
      } catch {}

      syncActive(getCurrentTab());
    }

    return { bindMobileNav, syncActive, refreshLabels };
  };
})(window);
