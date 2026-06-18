(function (window) {
  if (window.__GMXLeaderboardFactory) return;

  window.__GMXLeaderboardFactory = function createGMXLeaderboard(ctx) {
    ctx = ctx || {};
    const $ = typeof ctx.$ === "function" ? ctx.$ : (id) => document.getElementById(id);
    const escapeHtml = typeof ctx.escapeHtml === "function" ? ctx.escapeHtml : (s) => String(s || "");
    const t = typeof ctx.t === "function" ? ctx.t : (_k, fb) => fb;
    const getToken = typeof ctx.getToken === "function" ? ctx.getToken : () => "";
    const getHandle = typeof ctx.getHandle === "function" ? ctx.getHandle : () => "";
    const tableSkeletonHtml =
      typeof ctx.tableSkeletonHtml === "function"
        ? ctx.tableSkeletonHtml
        : (rows, cols) => {
            try {
              return window.__GMXUiFactory({ api: "", getToken: () => "" }).tableSkeletonHtml(rows, cols);
            } catch {
              return `<tr><td colspan="${cols || 4}" class="muted">…</td></tr>`;
            }
          };

    let lbDays = 7;

    function escHtml(s) {
      return String(s || "").replace(/[&<>"']/g, (c) =>
        ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]
      );
    }

    async function loadLeaderboard(days) {
      try {
        lbDays = Number(days || lbDays || 7) || 7;
        const st = $("lb_status");

        if (st) st.textContent = "";
        const body = $("lb_body");
        if (body) {
          body.innerHTML = tableSkeletonHtml(6, 4);
        }

        const opts = {};
        const token = getToken();
        if (token) opts.headers = { Authorization: "Bearer " + token };
        const r = await fetch(`/api/leaderboard/referrals?days=${encodeURIComponent(lbDays)}`, {
          cache: "no-store",
          ...opts,
        });
        const j = await r.json().catch(() => null);
        if (!r.ok || !j || !j.ok) throw new Error(j?.error || `http_${r.status}`);

        const top = Array.isArray(j.top) ? j.top : [];
        if (body) {
          if (!top.length) {
            body.innerHTML = `<tr><td colspan="4" class="muted">${escapeHtml(t("lb_empty") || "No data yet.")}</td></tr>`;
          } else {
            body.innerHTML = top
              .map((row, idx) => {
                const h = escHtml(String(row.handle || ""));
                const eligible = Number(row.eligible || 0) || 0;
                const active = Number(row.active || 0) || 0;
                return `<tr><td>${idx + 1}</td><td>@${h}</td><td>${eligible}</td><td>${active}</td></tr>`;
              })
              .join("");
          }
        }

        const you = $("lb_you");
        if (you) {
          const me = j.me;
          if (me && me.handle) {
            const h = escHtml(String(me.handle || ""));
            const eligible = Number(me.eligible || 0) || 0;
            const idx = top.findIndex((r) => String(r.handle || "") === String(me.handle || ""));
            const rank = idx >= 0 ? String(idx + 1) : ">50";
            you.innerHTML = `${escapeHtml(t("lb_you") || "You")}: <b>#${rank}</b> @${h} · ${escapeHtml(t("lb_eligible") || "Eligible")}: <b>${eligible}</b>`;
          } else {
            you.textContent = getHandle() ? "" : t("connectFirst") || "Connect first.";
          }
        }

        if (st) st.textContent = `${lbDays}d`;
        return j;
      } catch (e) {
        const st = $("lb_status");
        if (st) st.textContent = (t("error") || "Error") + ": " + String(e?.message || e || "failed");
        const body = $("lb_body");
        if (body) {
          body.innerHTML = `<tr><td colspan="4" class="muted">${escapeHtml(t("lb_failed") || "Could not load leaderboard.")}</td></tr>`;
        }
        return null;
      }
    }

    function bindLeaderboardUI() {
      if (bindLeaderboardUI._done) return;
      bindLeaderboardUI._done = true;
      const b7 = $("lb_7d");
      const b30 = $("lb_30d");
      const set = (d) => {
        if (b7) b7.classList.toggle("active", d === 7);
        if (b30) b30.classList.toggle("active", d === 30);
        loadLeaderboard(d);
      };
      if (b7) b7.addEventListener("click", () => set(7));
      if (b30) b30.addEventListener("click", () => set(30));
    }

    return {
      loadLeaderboard,
      bindLeaderboardUI,
      getLbDays: () => lbDays,
    };
  };
})(window);
