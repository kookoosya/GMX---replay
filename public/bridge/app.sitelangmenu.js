(function (window) {
  if (window.__GMXSiteLangMenuFactory) return;

  window.__GMXSiteLangMenuFactory = function createGMXSiteLangMenu(ctx) {
    const $ = typeof ctx.$ === "function" ? ctx.$ : (id) => document.getElementById(id);
    const escapeHtml =
      typeof ctx.escapeHtml === "function" ? ctx.escapeHtml : (s) => String(s ?? "");
    const getSiteLang =
      typeof ctx.getSiteLang === "function" ? ctx.getSiteLang : () => "en";
    const setSiteLang =
      typeof ctx.setSiteLang === "function" ? ctx.setSiteLang : () => {};
    const getSiteLangs =
      typeof ctx.getSiteLangs === "function" ? ctx.getSiteLangs : () => [["en", "English"]];
    const setSiteLangs =
      typeof ctx.setSiteLangs === "function" ? ctx.setSiteLangs : () => {};
    const getReplyLangs =
      typeof ctx.getReplyLangs === "function" ? ctx.getReplyLangs : () => [["en", "English"]];
    const setReplyLangs =
      typeof ctx.setReplyLangs === "function" ? ctx.setReplyLangs : () => {};
    const applyLang = typeof ctx.applyLang === "function" ? ctx.applyLang : () => {};
    const onSiteLangChanged =
      typeof ctx.onSiteLangChanged === "function" ? ctx.onSiteLangChanged : () => {};
    const onI18nKick =
      typeof ctx.onI18nKick === "function"
        ? ctx.onI18nKick
        : () => {
            applyLang();
          };

    function fillSelect(sel, arr) {
      if (!sel) return;
      sel.innerHTML = "";
      for (const [v, label] of arr) {
        const o = document.createElement("option");
        o.value = v;
        o.textContent = label;
        sel.appendChild(o);
      }
    }

    async function loadLocalConfig() {
      try {
        const r = await fetch("/extension-config.json", { cache: "no-store" });
        if (!r.ok) return;
        const cfg = await r.json().catch(() => null);
        if (!cfg || typeof cfg !== "object") return;
        if (cfg.languages && Array.isArray(cfg.languages.site)) {
          setSiteLangs(cfg.languages.site);
        }
        if (cfg.languages && Array.isArray(cfg.languages.reply)) {
          const onlyEnglish = cfg.languages.reply.filter(
            (item) => Array.isArray(item) && String(item[0] || "").toLowerCase() === "en"
          );
          setReplyLangs(onlyEnglish.length ? onlyEnglish : [["en", "English"]]);
        } else {
          setReplyLangs([["en", "English"]]);
        }
      } catch (_e) {}
    }

    function langFlagSrc(code) {
      const c = String(code || "")
        .trim()
        .toLowerCase();
      return "/assets/flags/" + c + ".svg";
    }

    function renderSiteLangMenu(siteLangSel) {
      const btn = $("siteLangBtn");
      const menu = $("siteLangMenu");
      const flag = $("siteLangFlag");
      const label = $("siteLangLabel");
      if (!btn || !menu || !flag || !label) return;

      const siteLangs = getSiteLangs();
      const cur = getSiteLang();
      const curRow = siteLangs.find((x) => x[0] === cur) || siteLangs[0] || ["en", "English"];
      flag.src = langFlagSrc(curRow[0]);
      flag.alt = curRow[1];
      label.textContent = curRow[1];

      menu.innerHTML = "";
      for (const [v, lab] of siteLangs) {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "langItem" + (v === cur ? " active" : "");
        b.setAttribute("role", "option");
        b.setAttribute("aria-selected", v === cur ? "true" : "false");
        b.innerHTML = `<img class="flagImg" src="${langFlagSrc(v)}" alt="" /><span>${escapeHtml(lab)}</span>`;
        b.addEventListener("click", () => {
          setSiteLang(v);
          if (siteLangSel) siteLangSel.value = v;
          try {
            applyLang();
          } catch (_e) {}
          renderSiteLangMenu(siteLangSel);
          closeLangMenu();
        });
        menu.appendChild(b);
      }
    }

    function ensureLangMenuPortal() {
      const pick = $("siteLangPick");
      const menu = $("siteLangMenu");
      const btn = $("siteLangBtn");
      if (!pick || !menu || !btn) return;
      if (menu._portal) return;
      try {
        document.body.appendChild(menu);
        menu._portal = true;
        menu.style.right = "auto";
        menu.style.top = "0px";
        menu.style.left = "0px";
      } catch (_e) {}
    }

    function positionLangMenu() {
      const btn = $("siteLangBtn");
      const menu = $("siteLangMenu");
      if (!btn || !menu) return;
      const r = btn.getBoundingClientRect();
      const w = Math.max(240, Math.min(340, r.width + 140));
      const left = Math.min(window.innerWidth - w - 12, Math.max(12, r.right - w));
      const top = Math.min(window.innerHeight - 12, r.bottom + 8);
      menu.style.width = w + "px";
      menu.style.left = left + "px";
      menu.style.top = top + "px";
    }

    function openLangMenu() {
      const btn = $("siteLangBtn");
      const menu = $("siteLangMenu");
      if (!btn || !menu) return;
      ensureLangMenuPortal();
      positionLangMenu();
      menu.classList.remove("hidden");
      btn.setAttribute("aria-expanded", "true");
    }

    function closeLangMenu() {
      const btn = $("siteLangBtn");
      const menu = $("siteLangMenu");
      if (!btn || !menu) return;
      menu.classList.add("hidden");
      btn.setAttribute("aria-expanded", "false");
    }

    function wireSiteLangDropdown(siteLangSel) {
      try {
        renderSiteLangMenu(siteLangSel);
        const btn = $("siteLangBtn");
        if (btn && !btn._bound) {
          btn._bound = true;
          btn.addEventListener("click", (e) => {
            e.preventDefault();
            const menu = $("siteLangMenu");
            if (!menu) return;
            const open = !menu.classList.contains("hidden");
            if (open) closeLangMenu();
            else openLangMenu();
          });
          document.addEventListener("click", (e) => {
            const pick = $("siteLangPick");
            const menu = $("siteLangMenu");
            if (!pick || !menu) return;
            if (menu.classList.contains("hidden")) return;
            if (!pick.contains(e.target) && !menu.contains(e.target)) closeLangMenu();
          });
          document.addEventListener("keydown", (e) => {
            if (e.key === "Escape") closeLangMenu();
          });
        }
      } catch (_e) {}
    }

    function wireSiteLangSelectChange(siteLangSel) {
      if (!siteLangSel) return;
      siteLangSel.addEventListener("change", () => {
        setSiteLang(siteLangSel.value);
        applyLang();
        onSiteLangChanged();
      });
    }

    function wireI18nObserver() {
      let timer = null;
      function kick() {
        if (window.__i18nPause) return;
        if (timer) clearTimeout(timer);
        timer = setTimeout(() => {
          if (window.__i18nPause) return;
          try {
            onI18nKick();
          } catch (_e) {}
        }, 120);
      }
      try {
        const obs = new MutationObserver(() => kick());
        obs.observe(document.body, { subtree: true, childList: true, characterData: true });
        window.__i18nObserver = obs;
      } catch (_e) {}
    }

    async function bootstrapSiteLangUi() {
      await loadLocalConfig();
      const siteLangSel = $("siteLang");
      if (siteLangSel) fillSelect(siteLangSel, getSiteLangs());

      const storedUiLang = getSiteLang();
      const validUiLang = getSiteLangs().some(([v]) => v === storedUiLang) ? storedUiLang : "en";
      setSiteLang(validUiLang);
      if (siteLangSel) siteLangSel.value = validUiLang;

      wireSiteLangDropdown(siteLangSel);
      return { siteLangSel };
    }

    function fillReplyLangSelects() {
      const gmLangSel = $("gmLang");
      const gnLangSel = $("gnLang");
      const replyLangs = getReplyLangs();
      if (gmLangSel) fillSelect(gmLangSel, replyLangs);
      if (gnLangSel) fillSelect(gnLangSel, replyLangs);
      return { gmLangSel, gnLangSel };
    }

    return {
      fillSelect,
      loadLocalConfig,
      renderSiteLangMenu,
      openLangMenu,
      closeLangMenu,
      wireSiteLangDropdown,
      wireSiteLangSelectChange,
      wireI18nObserver,
      bootstrapSiteLangUi,
      fillReplyLangSelects,
    };
  };
})(window);
