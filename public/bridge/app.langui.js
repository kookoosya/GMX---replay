(function (window) {
  if (window.__GMXLangUiFactory) return;

  window.__GMXLangUiFactory = function createGMXLangUi(ctx) {
    const $ = typeof ctx.$ === "function" ? ctx.$ : () => null;

    function flagEmoji(code) {
      const c = String(code || "").trim().toUpperCase();
      return c || "GLB";
    }

    function updateLangFlags() {
      const site = $("siteLang")?.value || "en";
      const gm = $("gmLang")?.value || "en";
      const gn = $("gnLang")?.value || "en";
      if ($("siteLangFlag")) $("siteLangFlag").textContent = site === "en" ? "GLB" : flagEmoji(site);
      if ($("gmLangFlag")) $("gmLangFlag").textContent = flagEmoji(gm);
      if ($("gnLangFlag")) $("gnLangFlag").textContent = flagEmoji(gn);
    }

    function renderLangChips(kind) {
      const wrap = kind === "gm" ? $("gmLangChipsWrap") : $("gnLangChipsWrap");
      const box = kind === "gm" ? $("gmLangChips") : $("gnLangChips");
      if (wrap) wrap.style.display = "none";
      if (box) box.innerHTML = "";
    }

    return { flagEmoji, updateLangFlags, renderLangChips };
  };
})(window);
