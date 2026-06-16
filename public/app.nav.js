(function (window) {
  if (window.__GMXNavFactory) return;

  window.__GMXNavFactory = function createGMXNav(ctx) {
    const normalizeTopLevelTab =
      typeof ctx.normalizeTopLevelTab === "function" ? ctx.normalizeTopLevelTab : (n) => n;
    const setCurrentTab =
      typeof ctx.setCurrentTab === "function" ? ctx.setCurrentTab : () => {};
    const getTopLevelTabs =
      typeof ctx.getTopLevelTabs === "function" ? ctx.getTopLevelTabs : () => [];
    const setBg = typeof ctx.setBg === "function" ? ctx.setBg : () => {};
    const persistLastTab =
      typeof ctx.persistLastTab === "function" ? ctx.persistLastTab : () => {};
    const onTabActivated =
      typeof ctx.onTabActivated === "function" ? ctx.onTabActivated : () => {};

    function ensurePredictionTabVisible() {
      try {
        const tabs = document.querySelector(".tabs");
        if (!tabs) return;
        let btn = document.getElementById("t_prediction");
        if (!btn) {
          btn = document.createElement("button");
          btn.className = "tab";
          btn.id = "t_prediction";
          btn.dataset.tab = "prediction";
          btn.textContent = "Prediction Market";
          const before = document.getElementById("t_wallet");
          if (before && before.parentNode === tabs) tabs.insertBefore(btn, before);
          else tabs.appendChild(btn);
        }
        btn.classList.remove("hidden");
        let pane = document.getElementById("tab-prediction");
        if (!pane) {
          pane = document.createElement("div");
          pane.id = "tab-prediction";
          pane.className = "hidden";
          pane.innerHTML =
            '<div class="card"><div class="title">Prediction Market</div><div class="note">Coming soon.</div></div>';
          tabs.insertAdjacentElement("afterend", pane);
        }
        pane.classList.add("hidden");
      } catch {}
    }

    function showTab(name) {
      const safe = normalizeTopLevelTab(name);
      setCurrentTab(safe);
      document.querySelectorAll(".tab").forEach((b) => {
        b.classList.toggle("active", b.dataset.tab === safe);
      });
      const topTabs = getTopLevelTabs();
      topTabs.forEach((k) => {
        const el = document.getElementById("tab-" + k);
        if (el) el.classList.toggle("hidden", k !== safe);
      });
      setBg(safe);
      try {
        persistLastTab(safe);
      } catch {}
      try {
        onTabActivated(safe);
      } catch {}
    }

    return { ensurePredictionTabVisible, showTab };
  };
})(window);
