(function (window) {
  if (window.__GMXReferralsFactory) return;

  window.__GMXReferralsFactory = function createGMXReferrals(ctx) {
    ctx = ctx || {};
    const $ = typeof ctx.$ === "function" ? ctx.$ : (id) => document.getElementById(id);
    const escapeHtml = typeof ctx.escapeHtml === "function" ? ctx.escapeHtml : (s) => String(s || "");
    const api = typeof ctx.api === "function" ? ctx.api : async () => ({});
    const t = typeof ctx.t === "function" ? ctx.t : (_k, fb) => fb;
    const requireConnected =
      typeof ctx.requireConnected === "function" ? ctx.requireConnected : () => true;
    const getReferralUiCopy =
      typeof ctx.getReferralUiCopy === "function" ? ctx.getReferralUiCopy : () => ({});
    const siteLangKey = ctx.siteLangKey || "gmx_site_lang";
    const refreshRefStats =
      typeof ctx.refreshRefStats === "function" ? ctx.refreshRefStats : async () => null;
    const revealReferralLinkUi =
      typeof ctx.revealReferralLinkUi === "function" ? ctx.revealReferralLinkUi : () => {};
    const applyRefCountEligible =
      typeof ctx.applyRefCountEligible === "function" ? ctx.applyRefCountEligible : () => {};
    const renderThemes = typeof ctx.renderThemes === "function" ? ctx.renderThemes : () => {};
    const renderExtThemes = typeof ctx.renderExtThemes === "function" ? ctx.renderExtThemes : () => {};
    const initWallpapers = typeof ctx.initWallpapers === "function" ? ctx.initWallpapers : () => {};
    const renderExtWallpapers =
      typeof ctx.renderExtWallpapers === "function" ? ctx.renderExtWallpapers : () => {};
    const fillStyles = typeof ctx.fillStyles === "function" ? ctx.fillStyles : () => {};
    const fillPacks = typeof ctx.fillPacks === "function" ? ctx.fillPacks : () => {};
    const refreshUsage = typeof ctx.refreshUsage === "function" ? ctx.refreshUsage : async () => {};
    const initReferralPromoDetailsState =
      typeof ctx.initReferralPromoDetailsState === "function"
        ? ctx.initReferralPromoDetailsState
        : () => {};
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

    function escHtml(s) {
      return String(s || "").replace(/[&<>"']/g, (c) =>
        ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]
      );
    }

    async function loadRefInvited(days = 30) {
      const body = $("refInvitedBody");
      if (!body) return;
      body.innerHTML = tableSkeletonHtml(5, 4);
      const j = await api("/api/referral/list?days=" + encodeURIComponent(String(days)));
      if (!j || !j.ok) throw new Error("ref_list_failed");
      const list = Array.isArray(j.list) ? j.list : [];
      if (!list.length) {
        body.innerHTML = `<tr><td colspan="4" class="muted">${t("r_no_invited") || "No invited users yet"}</td></tr>`;
        return;
      }
      body.innerHTML = list
        .map((r) => {
          const status = r.fraud
            ? (t("r_flagged") || "Flagged") + (r.fraudReason ? ": " + escHtml(r.fraudReason) : "")
            : r.eligible
              ? t("r_eligible") || "Eligible"
              : t("r_not_yet") || "Not yet";
          return `<tr>
        <td>${escHtml(r.handle || "")}</td>
        <td>${Number(r.inserts || 0)}</td>
        <td>${Number(r.activeDays || 0)}</td>
        <td>${status}</td>
      </tr>`;
        })
        .join("");
    }

    async function loadRefLeaderboard(days = 90) {
      const body = $("refLeaderBody");
      const meEl = $("refLeaderMe");
      const lang = localStorage.getItem(siteLangKey) || "en";
      const ui = getReferralUiCopy(lang);
      if (body) {
        body.innerHTML = tableSkeletonHtml(5, 3);
      }
      const j = await api("/api/leaderboard/referrals?days=" + encodeURIComponent(String(days)));
      if (!j || !j.ok) throw new Error("leaderboard_failed");
      const top = Array.isArray(j.top) ? j.top : [];
      if (!top.length) {
        if (body) {
          body.innerHTML = `<tr><td colspan="3" class="muted">${escapeHtml(ui.leaderboardEmpty || "No data yet")}</td></tr>`;
        }
      } else if (body) {
        body.innerHTML = top
          .map(
            (r, i) =>
              `<tr><td>${i + 1}</td><td>${escHtml(r.handle || "")}</td><td>${Number(r.eligible || 0)}</td></tr>`
          )
          .join("");
      }
      if (meEl) {
        if (j.me && j.me.handle) {
          meEl.textContent = `${ui.youLabel || "You"}: ${j.me.handle} — ${ui.eligible}: ${Number(j.me.eligible || 0)} (${ui.rulesLabel || "rules"}: ≥${j.rules?.minInserts || 5} inserts + ≥${j.rules?.minActiveDays || 3} active days in ${days}d)`;
        } else {
          meEl.textContent = "";
        }
      }
    }

    function bindReferrals() {
      const refLoadBtn = $("refLoad");
      if (refLoadBtn) {
        refLoadBtn.onclick = async () => {
          if (!requireConnected("Referrals")) return;
          try {
            const j = await refreshRefStats(true);
            if (!j) throw new Error("ref_stats_unavailable");
            const link = $("refLink");
            if (link) link.value = j.refLink || "";
            revealReferralLinkUi();
            const confirmed = Number(j.confirmedRefs ?? 0) || 0;
            const active = Number(j.activeRefs ?? 0) || 0;
            const eligible = Number(j.eligibleRefs ?? j.referrals ?? j.count ?? 0) || 0;
            applyRefCountEligible(eligible);
            if ($("refConfirmedInline")) $("refConfirmedInline").textContent = String(confirmed);
            if ($("refActiveInline")) $("refActiveInline").textContent = String(active);
            try {
              renderThemes();
            } catch (_e) {}
            try {
              renderExtThemes();
            } catch (_e) {}
            try {
              initWallpapers();
            } catch (_e) {}
            try {
              renderExtWallpapers();
            } catch (_e) {}
            const msg = $("refMsg");
            try {
              await loadRefInvited(30);
            } catch (_e) {}
            if (msg) msg.innerHTML = '<span class="ok">' + escapeHtml(t("ref_loaded")) + "</span>";
            try {
              fillStyles();
              fillPacks();
            } catch (_e) {}
            try {
              await refreshUsage();
            } catch (_e) {}
          } catch (e) {
            const msg = $("refMsg");
            if (msg) msg.innerHTML = '<span class="bad">' + escapeHtml(e?.message || "failed") + "</span>";
          }
        };
      }

      try {
        initReferralPromoDetailsState();
      } catch (_e) {}

      function refUiCopiedMessage() {
        const lang = localStorage.getItem(siteLangKey) || "en";
        const ui = getReferralUiCopy(lang);
        return ui.copied || t("toast_copied") || "Copied.";
      }

      function flashRefCopied() {
        const msg = $("refMsg");
        if (msg) msg.innerHTML = '<span class="ok">' + escapeHtml(refUiCopiedMessage()) + "</span>";
        const link = $("refLink");
        if (link) {
          link.classList.add("refLinkCopied");
          setTimeout(() => {
            try {
              link.classList.remove("refLinkCopied");
            } catch (_e) {}
          }, 1200);
        }
      }

      async function copyReferralLink() {
        const link = $("refLink");
        const v = (link?.value || "").trim();
        if (!v) return false;
        try {
          await navigator.clipboard.writeText(v);
          flashRefCopied();
          return true;
        } catch (_e) {
          const msg = $("refMsg");
          if (msg) {
            msg.innerHTML =
              '<span class="bad">' + escapeHtml(t("toast_copy_failed") || "Copy failed.") + "</span>";
          }
          return false;
        }
      }

      const refLinkInput = $("refLink");
      if (refLinkInput) {
        refLinkInput.addEventListener("click", async () => {
          if (!requireConnected("Referrals")) return;
          const v = (refLinkInput.value || "").trim();
          if (!v) return;
          try {
            refLinkInput.focus();
            refLinkInput.select();
          } catch (_e) {}
          await copyReferralLink();
        });
      }

      const refCopyBtn = $("refCopy");
      if (refCopyBtn) {
        refCopyBtn.onclick = async () => {
          if (!requireConnected("Referrals")) return;
          await copyReferralLink();
        };
      }

      const refShareBtn = $("refShare");
      if (refShareBtn && typeof navigator.share === "function") {
        refShareBtn.classList.remove("hidden");
        refShareBtn.onclick = async () => {
          if (!requireConnected("Referrals")) return;
          const link = $("refLink");
          const v = (link?.value || "").trim();
          if (!v) return;
          try {
            await navigator.share({
              title: "GMXReply",
              text: t("ref_share_text") || "Join me on GMXReply",
              url: v,
            });
          } catch (_e) {}
        };
      }
    }

    return { loadRefInvited, loadRefLeaderboard, bindReferrals };
  };
})(window);
