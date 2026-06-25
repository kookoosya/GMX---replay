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
    const core = window.GMXLeaderboardCore || {};
    const badgeCore = window.GMXReferralBadgeCore || {};
    const medalFor =
      typeof core.leaderboardMedal === "function" ? core.leaderboardMedal : () => ({ emoji: "", cls: "", rowCls: "" });
    const rankCellHtml =
      typeof core.leaderboardRankCellHtml === "function"
        ? core.leaderboardRankCellHtml
        : (rank) => String(rank);
    const resolveMeRank =
      typeof core.resolveMeRank === "function" ? core.resolveMeRank : (top, me) => {
        if (!me?.handle || !Array.isArray(top)) return 0;
        const idx = top.findIndex((r) => String(r?.handle || "") === String(me.handle || ""));
        return idx >= 0 ? idx + 1 : Number(me.rank) || 0;
      };
    const formatLbRank =
      typeof core.formatLbRank === "function"
        ? core.formatLbRank
        : (rank) => {
            const n = Number(rank);
            return Number.isFinite(n) && n > 0 ? `#${n}` : "—";
          };

    let lbDays = 7;

    function escHtml(s) {
      return String(s || "").replace(/[&<>"']/g, (c) =>
        ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]
      );
    }

    function refBadgeHtml(eligible) {
      const tier =
        typeof badgeCore.earnedReferralBadgeTier === "function"
          ? badgeCore.earnedReferralBadgeTier(eligible)
          : null;
      if (!tier || typeof badgeCore.referralBadgePillHtml !== "function") return "";
      const label = t(`ref_badge_${tier.id}`) || tier.id;
      return " " + badgeCore.referralBadgePillHtml(tier, { label, compact: true });
    }

    function renderYourRank(top, me) {
      const wrap = $("lb_you");
      const numEl = $("lb_your_rank_num");
      const metaEl = $("lb_your_rank_meta");
      const labelEl = $("lb_your_rank_label");
      if (!wrap) return;

      if (labelEl) labelEl.textContent = t("lb_your_rank") || "Your rank";

      if (!getHandle()) {
        wrap.classList.add("hidden");
        if (metaEl) metaEl.textContent = t("connectFirst") || "Connect first.";
        return;
      }

      wrap.classList.remove("hidden");

      if (!me || !me.handle) {
        if (numEl) numEl.textContent = formatLbRank(0, { unranked: t("lb_unranked") || "Not ranked yet" });
        if (metaEl) metaEl.textContent = t("connectFirst") || "Connect first.";
        return;
      }

      const rank = resolveMeRank(top, me);
      const eligible = Number(me.eligible || 0) || 0;
      const unranked = t("lb_unranked") || "Not ranked yet";
      if (numEl) numEl.textContent = formatLbRank(rank, { unranked });
      if (metaEl) {
        const h = escHtml(String(me.handle || ""));
        const badge = refBadgeHtml(eligible);
        metaEl.innerHTML = `@${h}${badge} · ${escapeHtml(t("lb_eligible") || "Eligible")}: <b>${eligible}</b>`;
      }
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
                const rank = idx + 1;
                const medal = medalFor(rank);
                const rowCls = medal.rowCls || "";
                const h = escHtml(String(row.handle || ""));
                const eligible = Number(row.eligible || 0) || 0;
                const active = Number(row.active || 0) || 0;
                const badge = refBadgeHtml(eligible);
                return `<tr class="${rowCls}"><td>${rankCellHtml(rank)}</td><td>@${h}${badge}</td><td>${eligible}</td><td>${active}</td></tr>`;
              })
              .join("");
          }
        }

        renderYourRank(top, j.me);

        if (st) st.textContent = `${lbDays}d`;
        return j;
      } catch (e) {
        const st = $("lb_status");
        if (st) st.textContent = (t("error") || "Error") + ": " + String(e?.message || e || "failed");
        const body = $("lb_body");
        if (body) {
          body.innerHTML = `<tr><td colspan="4" class="muted">${escapeHtml(t("lb_failed") || "Could not load leaderboard.")}</td></tr>`;
        }
        renderYourRank([], null);
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
