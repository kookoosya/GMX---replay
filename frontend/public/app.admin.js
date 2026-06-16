(function (window) {
  if (window.__GMXAdminFactory) return;

  window.__GMXAdminFactory = function createGMXAdmin(ctx) {
    ctx = ctx || {};
    const $ = typeof ctx.$ === "function" ? ctx.$ : (id) => document.getElementById(id);
    const escapeHtml = typeof ctx.escapeHtml === "function" ? ctx.escapeHtml : (s) => String(s || "");
    const api = typeof ctx.api === "function" ? ctx.api : async () => ({});
    const getHandle = typeof ctx.getHandle === "function" ? ctx.getHandle : () => "";
    const requireConnected =
      typeof ctx.requireConnected === "function" ? ctx.requireConnected : () => true;
    const setAdminToken = typeof ctx.setAdminToken === "function" ? ctx.setAdminToken : () => {};
    const isAdminSignedIn =
      typeof ctx.isAdminSignedIn === "function" ? ctx.isAdminSignedIn : () => false;
    const adminHandle = ctx.adminHandle || "@Kristofer_Sol_";

    const adminHandleEl = $("adminHandle");
    const adminPwEl = $("adminPassword");
    const adminStateEl = $("adminAuthState");

    function requireAdminSignedIn() {
      if (!isAdminSignedIn()) {
        const m = $("adminMsg");
        if (m) m.innerHTML = '<span class="bad">Sign in first.</span>';
        return false;
      }
      return true;
    }

    function syncAdminUi() {
      try {
        if (adminHandleEl) {
          const h = getHandle() || adminHandle;
          if (!adminHandleEl.value) adminHandleEl.value = h;
        }
        if (adminStateEl) {
          adminStateEl.textContent = isAdminSignedIn() ? "signed in" : "signed out";
        }
      } catch (_e) {}
    }

    async function adminLoadLb(days) {
      if (!requireConnected("Admin")) return;
      if (!requireAdminSignedIn()) return;
      const msg = $("adminLbMsg");
      if (msg) msg.textContent = "";
      try {
        const j = await api("/api/admin/leaderboard/referrals?days=" + days);
        const rows = (j.top || []).slice(0, 3);
        const table = $("adminLbTable" + String(days));
        if (table) {
          const tb = table.querySelector("tbody");
          if (tb) {
            tb.innerHTML =
              rows
                .map((r) => {
                  const h = escapeHtml(r.handle);
                  const elig = Number(r.eligible || 0) || 0;
                  const rank = Number(r.rank || 0) || 0;
                  const btnId = `lb_award_${days}_${rank}`;
                  return `<tr>
            <td>${rank}</td>
            <td><span class="kbd">@${h}</span></td>
            <td>${elig}</td>
            <td><button class="btn secondary" id="${btnId}" type="button">Award</button></td>
          </tr>`;
                })
                .join("") || `<tr><td colspan="4" class="muted">No data</td></tr>`;
            rows.forEach((r) => {
              const rank = Number(r.rank || 0) || 0;
              const b = $("lb_award_" + days + "_" + rank);
              if (b) {
                b.onclick = async () => {
                  if (!requireAdminSignedIn()) return;
                  const handle = String(r.handle || "").trim();
                  const place = rank;
                  if (!handle) return;
                  if (!confirm(`Award Pro to @${handle} for ${days} days (place #${place})?`)) return;
                  try {
                    b.disabled = true;
                    const out = await api("/api/admin/leaderboard/award", "POST", {
                      days,
                      place,
                      handle,
                    });
                    if (msg) {
                      msg.innerHTML = `<span class="ok">Awarded @${escapeHtml(handle)} (${days}d). Code: <span class="kbd">${escapeHtml(out.code || "")}</span></span>`;
                    }
                  } catch (e) {
                    if (msg) {
                      msg.innerHTML = `<span class="bad">${escapeHtml(e?.message || "award_failed")}</span>`;
                    }
                  } finally {
                    b.disabled = false;
                  }
                };
              }
            });
          }
        }
        if (msg) msg.innerHTML = `<span class="ok">Loaded ${days}d winners.</span>`;
      } catch (e) {
        if (msg) msg.innerHTML = `<span class="bad">${escapeHtml(e?.message || "failed")}</span>`;
      }
    }

    function bindAdmin() {
      const adminLoginBtn = $("adminLogin");
      if (adminLoginBtn) {
        adminLoginBtn.onclick = async () => {
          if (!requireConnected("Admin")) return;
          $("adminMsg").textContent = "";
          try {
            const h = (adminHandleEl?.value || "").trim() || "";
            const me = getHandle();
            if (h && me && h !== me) {
              $("adminMsg").innerHTML =
                '<span class="bad">Admin handle must match connected handle.</span>';
              return;
            }
            const pw = (adminPwEl?.value || "").trim();
            if (!pw) {
              $("adminMsg").innerHTML = '<span class="bad">Enter password.</span>';
              return;
            }
            const j = await api("/api/admin/login", "POST", { password: pw });
            if (j?.adminToken) {
              setAdminToken(j.adminToken);
              if (adminPwEl) adminPwEl.value = "";
              $("adminMsg").innerHTML = '<span class="ok">Signed in.</span>';
              syncAdminUi();
            } else {
              $("adminMsg").innerHTML = '<span class="bad">Login failed.</span>';
            }
          } catch (e) {
            $("adminMsg").innerHTML =
              '<span class="bad">' + escapeHtml(e?.message || "Login failed") + "</span>";
          }
        };
      }

      const adminLogoutBtn = $("adminLogout");
      if (adminLogoutBtn) {
        adminLogoutBtn.onclick = async () => {
          if (!requireConnected("Admin")) return;
          try {
            await api("/api/admin/logout", "POST", {});
          } catch (_e) {}
          setAdminToken("");
          syncAdminUi();
          const m = $("adminMsg");
          if (m) m.innerHTML = '<span class="ok">Signed out.</span>';
        };
      }

      const adminGenBtn = $("adminGen");
      if (adminGenBtn) {
        adminGenBtn.onclick = async () => {
          if (!requireConnected("Admin")) return;
          $("adminOut").value = "";
          if (!requireAdminSignedIn()) return;
          const n = Number(($("adminN").value || "5").trim());
          const note = ($("adminNote").value || "promo").trim();
          const days = Number(($("adminDuration").value || "0").trim());

          try {
            const j = await api("/api/admin/codes", "POST", { n, note, days });
            $("adminOut").value = (j.codes || []).join("\n");
          } catch (e) {
            $("adminOut").value = "Error: " + (e.message || "failed");
          }
        };
      }

      const adminListBtn = $("adminList");
      if (adminListBtn) {
        adminListBtn.onclick = async () => {
          if (!requireConnected("Admin")) return;
          $("adminOut").value = "";
          if (!requireAdminSignedIn()) return;
          try {
            const j = await api("/api/admin/codes");
            $("adminOut").value = (j.rows || [])
              .map(
                (r) =>
                  `${r.code} (${r.days || 0}d) ${(r.note || "").trim()} ${r.created_at || ""}`.trim()
              )
              .join("\n");
          } catch (e) {
            $("adminOut").value = "Error: " + (e.message || "failed");
          }
        };
      }

      const adminLbLoad7 = $("adminLbLoad7");
      if (adminLbLoad7) adminLbLoad7.onclick = () => adminLoadLb(7);

      const adminLbLoad30 = $("adminLbLoad30");
      if (adminLbLoad30) adminLbLoad30.onclick = () => adminLoadLb(30);
    }

    function pruneLegacyAdminPanels() {
      try {
        const retiredAnchors = ["adminSelBox", "adminSelHistory", "adminFaqBox", "adminHealthOut"];
        retiredAnchors.forEach((id) => {
          const el = $(id);
          if (!el) return;
          const card = el.closest(".card");
          if (card) card.style.display = "none";
        });

        const adminRoot = $("tab-admin");
        if (!adminRoot) return;

        const firstNote = adminRoot.querySelector(".card .note");
        if (firstNote) {
          firstNote.textContent =
            "Sign in once, then use access, code, and leaderboard tools only. Retired admin experiments are removed from this admin workspace.";
        }

        adminRoot.querySelectorAll(".card .title").forEach((node) => {
          const text = String(node.textContent || "").trim();
          if (text === "Admin stats") node.textContent = "Admin access";
          if (text === "Admin: promo codes") node.textContent = "Create access codes";
          if (text === "Admin: leaderboard rewards") node.textContent = "Leaderboard rewards";
          if (
            text === "Admin: conversion metrics" ||
            text === "Admin: extension health" ||
            text === "Admin: FAQ base" ||
            text === "Selectors history" ||
            text === "Selectors JSON" ||
            text.startsWith("Selectors")
          ) {
            const card = node.closest(".card");
            if (card) card.style.display = "none";
          }
        });
      } catch (_e) {}
    }

    return {
      syncAdminUi,
      requireAdminSignedIn,
      bindAdmin,
      adminLoadLb,
      pruneLegacyAdminPanels,
    };
  };
})(window);
