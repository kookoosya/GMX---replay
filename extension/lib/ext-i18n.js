(function (global) {
  if (global.GMXExtI18n) return;

  const EXT_UI_LANG_KEY = "gmx_site_lang_v1";
  let uiLang = "en";

  function extI18nCatalog() {
    try {
      return global.GMX_SITE_I18N && global.GMX_SITE_I18N.SITE_I18N
        ? global.GMX_SITE_I18N.SITE_I18N
        : null;
    } catch {
      return null;
    }
  }

  function getUiLang() {
    return uiLang;
  }

  function setUiLang(code) {
    uiLang = /^[a-z]{2}$/.test(String(code || "").toLowerCase())
      ? String(code).toLowerCase()
      : "en";
  }

  function extT(key, vars) {
    const catalog = extI18nCatalog();
    if (!catalog) return key;
    const lang = String(uiLang || "en").toLowerCase();
    const base = catalog.en || {};
    const row = catalog[lang] || {};
    let s = row[key];
    if (s === undefined || s === null || String(s).trim() === "") s = base[key];
    if (s === undefined || s === null) return key;
    let out = String(s);
    if (vars && typeof vars === "object") {
      for (const [vk, vv] of Object.entries(vars)) {
        out = out.split(`{${vk}}`).join(String(vv));
      }
    }
    return out;
  }

  async function refreshUiLangFromStorage() {
    try {
      const d = await chrome.storage.local.get(EXT_UI_LANG_KEY);
      const v = String((d && d[EXT_UI_LANG_KEY]) || "en").trim().toLowerCase();
      setUiLang(v);
    } catch {
      setUiLang("en");
    }
  }

  function applyStaticExtI18n() {
    try {
      document.documentElement.lang = uiLang;
    } catch {}
    document.querySelectorAll("[data-i18n]").forEach((node) => {
      const key = node.getAttribute("data-i18n");
      if (!key) return;
      const v = extT(key);
      if (node.hasAttribute("data-i18n-html")) node.innerHTML = v;
      else node.textContent = v;
    });
    document.querySelectorAll("[data-i18n-ph]").forEach((node) => {
      const key = node.getAttribute("data-i18n-ph");
      if (key && "placeholder" in node) node.placeholder = extT(key);
    });
    document.querySelectorAll("option[data-i18n]").forEach((node) => {
      const key = node.getAttribute("data-i18n");
      if (key) node.textContent = extT(key);
    });
    const alertSel = document.getElementById("alertsInterval");
    if (alertSel) {
      Array.from(alertSel.querySelectorAll("option")).forEach((opt) => {
        const n = opt.value;
        opt.textContent = extT("ext_alerts_min", { n });
      });
    }
  }

  global.GMXExtI18n = {
    EXT_UI_LANG_KEY,
    getUiLang,
    setUiLang,
    extI18nCatalog,
    extT,
    refreshUiLangFromStorage,
    applyStaticExtI18n,
  };
})(typeof globalThis !== "undefined" ? globalThis : window);
