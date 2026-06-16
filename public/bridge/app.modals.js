(function (window) {
  if (window.__GMXModalsFactory) return;

  window.__GMXModalsFactory = function createGMXModals(ctx) {
    ctx = ctx || {};
    const $ = typeof ctx.$ === "function" ? ctx.$ : (id) => document.getElementById(id);
    const escapeHtml = typeof ctx.escapeHtml === "function" ? ctx.escapeHtml : (s) => String(s || "");
    const onBeforeOpen = typeof ctx.onBeforeOpen === "function" ? ctx.onBeforeOpen : () => {};
    const onEscape = typeof ctx.onEscape === "function" ? ctx.onEscape : null;

    const stack = [];
    let escapeWired = false;

    function isOpen(id) {
      const el = typeof id === "string" ? $(id) : id;
      return !!(el && !el.classList.contains("hidden"));
    }

    function topId() {
      return stack.length ? stack[stack.length - 1] : null;
    }

    function syncBodyLock() {
      if (stack.length) document.body.classList.add("gmx-modal-open");
      else document.body.classList.remove("gmx-modal-open");
    }

    function setAria(el, open) {
      if (!el) return;
      el.setAttribute("aria-hidden", open ? "false" : "true");
    }

    function focusCard(el) {
      const card = el?.querySelector?.(".modalCard");
      if (!card) return;
      try {
        if (!card.hasAttribute("tabindex")) card.setAttribute("tabindex", "-1");
        card.focus({ preventScroll: true });
      } catch (_e) {}
    }

    function openModal(id, opts) {
      opts = opts || {};
      const el = $(id);
      if (!el) return false;
      try {
        onBeforeOpen(id, el);
      } catch (_e) {}
      el.classList.remove("hidden");
      setAria(el, true);
      if (!stack.includes(id)) stack.push(id);
      syncBodyLock();
      if (typeof opts.onOpen === "function") {
        try {
          opts.onOpen(el);
        } catch (_e) {}
      }
      focusCard(el);
      return true;
    }

    function closeModal(id) {
      const el = typeof id === "string" ? $(id) : id;
      if (!el) return;
      const mid = el.id || id;
      el.classList.add("hidden");
      setAria(el, false);
      const idx = stack.lastIndexOf(mid);
      if (idx >= 0) stack.splice(idx, 1);
      syncBodyLock();
    }

    function closeTopModal() {
      const id = topId();
      if (id) closeModal(id);
      return id;
    }

    function bindBackdrop(id, closeFn) {
      const el = $(id);
      if (!el || el._gmxModalBound) return;
      el._gmxModalBound = true;
      setAria(el, el.classList.contains("hidden") ? false : true);
      el.addEventListener("click", (e) => {
        if (e.target === el) {
          if (typeof closeFn === "function") closeFn();
          else closeModal(id);
        }
      });
    }

    function wireEscape() {
      if (escapeWired) return;
      escapeWired = true;
      window.addEventListener("keydown", (e) => {
        if (e.key !== "Escape") return;
        const id = topId();
        if (!id) return;
        if (onEscape) {
          try {
            if (onEscape(id, e) === false) return;
          } catch (_e) {}
        }
        closeModal(id);
      });
    }

    function showInfoModal(title, html) {
      const titleEl = $("gmx_info_title");
      const bodyEl = $("gmx_info_body");
      const closeBtn = $("gmx_info_close");
      if (titleEl) titleEl.textContent = title || "Info";
      if (bodyEl) bodyEl.innerHTML = html || "";
      if (closeBtn && !closeBtn._gmxBound) {
        closeBtn._gmxBound = true;
        closeBtn.onclick = () => closeModal("gmx_info_modal");
      }
      return openModal("gmx_info_modal");
    }

    function initModalsShell() {
      wireEscape();
      try {
        document.querySelectorAll("#gmx-modals .modalBack").forEach((el) => {
          setAria(el, !el.classList.contains("hidden"));
        });
      } catch (_e) {}
    }

    return {
      $,
      escapeHtml,
      isOpen,
      topId,
      openModal,
      closeModal,
      closeTopModal,
      bindBackdrop,
      wireEscape,
      showInfoModal,
      initModalsShell,
    };
  };
})(window);
