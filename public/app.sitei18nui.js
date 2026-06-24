(function (window) {
  if (window.__GMXSiteI18nUiFactory) return;

  window.__GMXSiteI18nUiFactory = function createGMXSiteI18nUi(ctx) {
    const getSiteLang =
      typeof ctx.getSiteLang === "function" ? ctx.getSiteLang : () => "en";
    const getI18n = typeof ctx.getI18n === "function" ? ctx.getI18n : () => ({ en: {} });
    const sanitizeI18nValue =
      typeof ctx.sanitizeI18nValue === "function" ? ctx.sanitizeI18nValue : (_l, v) => v;
    const onPatchDynamicCopy =
      typeof ctx.onPatchDynamicCopy === "function" ? ctx.onPatchDynamicCopy : () => {};
    const forceEnKeys =
      ctx.forceEnKeys instanceof Set ? ctx.forceEnKeys : new Set([]);

    function sanitizeMiniHTML(input) {
      const tpl = document.createElement("template");
      tpl.innerHTML = String(input ?? "");
      const ALLOWED = new Set(["B", "STRONG", "EM", "BR", "SPAN", "KBD", "CODE"]);
      const nodes = tpl.content.querySelectorAll("*");
      nodes.forEach((node) => {
        if (!ALLOWED.has(node.tagName)) {
          node.replaceWith(document.createTextNode(node.textContent || ""));
          return;
        }
        [...node.attributes].forEach((a) => node.removeAttribute(a.name));
      });
      tpl.content
        .querySelectorAll("script,style,iframe,object,embed,link,meta")
        .forEach((n) => n.remove());
      return tpl.innerHTML;
    }

    function setText(id, val) {
      const el = document.getElementById(id);
      if (!el || val === undefined || val === null) return;

      if (Array.isArray(val) && el.tagName === "UL") {
        el.innerHTML = val.map((x) => `<li>${sanitizeMiniHTML(x)}</li>`).join("");
        return;
      }

      const raw = String(val);
      if (raw.startsWith("HTML:")) {
        el.innerHTML = sanitizeMiniHTML(raw.slice(5));
        return;
      }
      if (/<\/?[a-z][^>]*>/i.test(raw)) {
        el.innerHTML = sanitizeMiniHTML(raw);
        return;
      }
      el.textContent = raw;
    }

    function setPh(id, key, merged) {
      try {
        const el = document.getElementById(id);
        if (!el) return;
        const v = merged[key];
        if (v !== undefined && v !== null) el.placeholder = String(v);
      } catch (_e) {}
    }

    function siteTr(key, fallback = "") {
      const lang = getSiteLang();
      const base = getI18n().en || {};
      const dict = getI18n()[lang] || {};
      const v = sanitizeI18nValue(lang, dict[key], base[key]);
      const resolved = v ?? base[key];
      if (
        resolved !== undefined &&
        resolved !== null &&
        String(resolved).trim() &&
        String(resolved) !== key
      ) {
        return String(resolved);
      }
      return fallback || String(key);
    }

    let lastAppliedLang = null;

    function applyLang(opts) {
      const force = opts && opts.force === true;
      const lang = getSiteLang();
      if (!force && lastAppliedLang === lang) return false;

      const base = getI18n().en || {};
      const d = getI18n()[lang] || {};

      const merged = Object.assign({}, base);
      for (const [k, v] of Object.entries(d)) {
        const safe = sanitizeI18nValue(lang, v, base[k]);
        if (safe === "" || safe === null || safe === undefined) continue;
        merged[k] = safe;
      }

      if (merged.gm_size_label) merged.gm_size = merged.gm_size_label;
      if (merged.gn_size_label) merged.gn_size = merged.gn_size_label;

      for (const k of Object.keys(merged)) {
        const v = lang !== "en" && forceEnKeys.has(k) ? (base[k] ?? merged[k]) : merged[k];
        setText(k, v);
      }

      setPh("xHandle", "xHandle_ph", merged);
      setPh("redeemCode", "redeemCode_ph", merged);
      setPh("gmNewLine", "gmNewLine_ph", merged);
      setPh("gmFilter", "gmFilter_ph", merged);
      setPh("gmPaste", "gmPaste_ph", merged);
      setPh("gnNewLine", "gnNewLine_ph", merged);
      setPh("gnFilter", "gnFilter_ph", merged);
      setPh("gnPaste", "gnPaste_ph", merged);
      setPh("w_wallet", "w_wallet_ph", merged);
      setPh("w_sig", "w_sig_ph", merged);
      setPh("w_payer", "w_payer_ph", merged);
      setPh("adminSecret", "adminSecret_ph", merged);
      setPh("adminOut", "adminOut_ph", merged);

      try {
        const rl = document.getElementById("refLink");
        if (rl) rl.placeholder = merged.connectFirst || "";
        if (rl && merged.ref_link_tap_to_copy) rl.title = String(merged.ref_link_tap_to_copy);
      } catch (_e) {}
      try {
        onPatchDynamicCopy(lang, merged);
      } catch (_e) {}

      lastAppliedLang = lang;
      return true;
    }

    return { siteTr, applyLang, setText, setPh, sanitizeMiniHTML };
  };
})(window);
