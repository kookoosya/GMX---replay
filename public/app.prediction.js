(function (window) {
  if (window.__GMXPredictionFactory) return;

  window.__GMXPredictionFactory = function createGMXPrediction(ctx) {
    ctx = ctx || {};
    const $ = typeof ctx.$ === "function" ? ctx.$ : (id) => document.getElementById(id);
    const escapeHtml = typeof ctx.escapeHtml === "function" ? ctx.escapeHtml : (s) => String(s || "");
    const t = typeof ctx.t === "function" ? ctx.t : (_k, fb) => fb;
    const api = typeof ctx.api === "function" ? ctx.api : async () => ({});
    const getHandle = typeof ctx.getHandle === "function" ? ctx.getHandle : () => "";
    const getToken = typeof ctx.getToken === "function" ? ctx.getToken : () => "";
    const friendlyUiErrorMessage =
      typeof ctx.friendlyUiErrorMessage === "function" ? ctx.friendlyUiErrorMessage : (m) => m;
    const getCurrentTab = typeof ctx.getCurrentTab === "function" ? ctx.getCurrentTab : () => "";

    const PM_INTRO_KEY_PREFIX = "gmx_pm_intro_done_v1:";
    let pmLastJson = "";
    const pmFilters = { asset: "all", bias: "all", minConf: 0 };
    let pmLastSignals = [];
    let pmLastHandle = "";
    let pmIsPreview = true;

    function lsGet(key, fb = "") {
      try {
        const v = localStorage.getItem(key);
        return v === null || v === undefined ? fb : v;
      } catch {
        return fb;
      }
    }

    function lsSet(key, value) {
      try {
        localStorage.setItem(key, value);
      } catch {}
    }

    function introStorageKey() {
      const handle = String(getHandle() || "").trim().toLowerCase();
      return `${PM_INTRO_KEY_PREFIX}${handle || "anon"}`;
    }

    function isIntroDismissed() {
      return lsGet(introStorageKey(), "") === "1";
    }

    function dismissIntro() {
      lsSet(introStorageKey(), "1");
      syncPredictionIntro();
    }

    function syncPredictionIntro() {
      const block = $("pm_newbie_block");
      if (!block) return;
      block.classList.toggle("hidden", isIntroDismissed());
    }

    function resetPredictionPrivateState() {
      pmLastJson = "";
      pmLastSignals = [];
      pmLastHandle = "";
      pmIsPreview = true;
      const host = $("pmList");
      if (host) host.innerHTML = "";
      const status = $("pm_status");
      if (status) status.textContent = "";
    }

    function ensureHandleIsolation() {
      const handle = String(getHandle() || "").trim().toLowerCase();
      if (handle !== pmLastHandle) {
        pmLastJson = "";
        pmLastSignals = [];
        pmLastHandle = handle;
      }
      syncPredictionIntro();
    }

    function syncPredictionFilterCopy() {
      const bias = $("pm_bias");
      if (bias) {
        const cur = String(bias.value || "all");
        bias.innerHTML = [
          `<option value="all">${escapeHtml(t("all") || "All")}</option>`,
          `<option value="bullish">${escapeHtml(t("bullish") || "Bullish")}</option>`,
          `<option value="bearish">${escapeHtml(t("bearish") || "Bearish")}</option>`,
          `<option value="neutral">${escapeHtml(t("neutral") || "Neutral")}</option>`,
        ].join("");
        bias.value = ["all", "bullish", "bearish", "neutral"].includes(cur) ? cur : "all";
      }
      const conf = $("pm_conf");
      if (conf) {
        const cur = String(conf.value || "0");
        conf.innerHTML = [
          `<option value="0">${escapeHtml(t("any") || "Any")}</option>`,
          `<option value="60">60%+</option>`,
          `<option value="70">70%+</option>`,
          `<option value="80">80%+</option>`,
        ].join("");
        conf.value = ["0", "60", "70", "80"].includes(cur) ? cur : "0";
      }
    }

    function fillPredictionAssetFilter(list) {
      const sel = $("pm_asset");
      if (!sel) return;
      const prev = String(sel.value || pmFilters.asset || "all");
      const symbols = Array.from(
        new Set(
          (Array.isArray(list) ? list : [])
            .map((x) => String(x?.symbol || "").trim())
            .filter(Boolean)
        )
      ).sort();
      sel.innerHTML =
        `<option value="all">${escapeHtml(t("all") || "All")}</option>` +
        symbols.map((s) => `<option value="${escapeHtml(s)}">${escapeHtml(s)}</option>`).join("");
      sel.value = symbols.includes(prev) ? prev : "all";
      pmFilters.asset = sel.value;
    }

    function filteredPredictionSignals(list) {
      const rows = Array.isArray(list) ? list : [];
      return rows.filter((row) => {
        const symbol = String(row?.symbol || "").trim();
        const bias = String(row?.bias || "neutral").toLowerCase();
        const conf = Number(row?.confidence || 0);
        if (pmFilters.asset !== "all" && symbol !== pmFilters.asset) return false;
        if (pmFilters.bias !== "all" && bias !== pmFilters.bias) return false;
        if (conf < Number(pmFilters.minConf || 0)) return false;
        return true;
      });
    }

    function previewBadgeHtml() {
      if (!pmIsPreview) return "";
      return `<span class="badge pmPreviewBadge">${escapeHtml(t("pm_preview_badge") || "Preview")}</span>`;
    }

    function renderPredictionSignals(list) {
      const host = $("pmList");
      if (!host) return;
      const allRows = Array.isArray(list) ? list : [];
      const rows = filteredPredictionSignals(allRows);
      if (!rows.length) {
        host.classList.remove("pmList");
        if (allRows.length) {
          host.innerHTML = `<div class="muted">${escapeHtml(t("pm_filter_empty") || "No demo cards match these filters.")}</div>`;
          return;
        }
        host.innerHTML = `<div class="muted">${escapeHtml(t("pm_empty") || "No signals yet. The feed is not connected — check back after launch.")}</div>`;
        return;
      }
      host.classList.add("pmList");
      const demoNote = pmIsPreview
        ? `<div class="muted small pmDemoNote">${escapeHtml(t("pm_demo_note") || "Demo bot output only — not live Polymarket data.")}</div>`
        : "";
      host.innerHTML =
        demoNote +
        rows
          .map((row) => {
            const symbol = escapeHtml(String(row.symbol || "PAIR").toUpperCase());
            const bias = String(row.bias || "neutral").toLowerCase();
            const move = Number(row.changePct || 0);
            const moveLabel = `${move > 0 ? "+" : ""}${move.toFixed(2)}%`;
            const confidence = Number(row.confidence || 0);
            const thesis = escapeHtml(String(row.thesis || ""));
            const risk = escapeHtml(String(row.risk || ""));
            const biasClass =
              bias === "bullish" ? "pmBiasBull" : bias === "bearish" ? "pmBiasBear" : "pmBiasNeutral";
            const confPct = Math.max(0, Math.min(100, confidence));
            const moveClass = move >= 0 ? "pmMoveUp" : "pmMoveDown";
            return `
      <div class="lineRow pmSignalRow">
        <div class="split pmSignalHead">
          <div class="pmSymbolWrap"><b class="pmSymbol">${symbol}</b> ${previewBadgeHtml()} <span class="badge ${biasClass}">${escapeHtml(bias)}</span></div>
          <div class="muted"><span class="${moveClass}">${escapeHtml(moveLabel)}</span> · ${escapeHtml(String(confidence))}% conf</div>
        </div>
        <div class="pmConfTrack"><div class="pmConfFill" style="width:${confPct}%"></div></div>
        <div class="small pmThesis">${thesis}</div>
        <div class="muted small pmRisk">${risk}</div>
      </div>
    `;
          })
          .join("");
    }

    function renderPredictionError(message) {
      const host = $("pmList");
      if (!host) return;
      host.classList.remove("pmList");
      host.innerHTML = `<div class="bad small">${escapeHtml(message)}</div>`;
    }

    async function loadPredictionSignals(opts) {
      const force = !!(opts && opts.force);
      const status = $("pm_status");
      const locked = $("pm_locked_note");
      ensureHandleIsolation();
      const hasSession = !!(getHandle() && getToken());
      if (!hasSession) {
        pmIsPreview = true;
        pmLastSignals = [];
        fillPredictionAssetFilter([]);
        renderPredictionSignals([]);
        if (status) {
          status.textContent =
            t("pm_unauth_status") ||
            "Connect your @handle to preview demo bot cards. No live Polymarket feed is connected.";
        }
        if (locked) {
          locked.textContent =
            t("pm_locked_note") ||
            "Signals are informational only, may be wrong, and are not outcomes. This tab never moves funds.";
        }
        const host = $("pmList");
        if (host) {
          host.innerHTML = `<div class="muted">${escapeHtml(
            t("pm_unauth_empty") ||
              "Sign in with your @handle to preview demo cards. External markets are linked below — trading happens on those sites, not here."
          )}</div>`;
        }
        return;
      }
      if (status) status.textContent = t("loading") || "Loading...";
      try {
        const j = await api("/api/market/signals", "GET");
        const payload = JSON.stringify(j || {});
        if (!force && payload === pmLastJson) {
          if (status) {
            status.textContent = pmIsPreview
              ? t("pm_status_preview") || "No live feed yet — external signal source is not connected."
              : t("pm_status") || "Signals are up to date.";
          }
          return;
        }
        pmLastJson = payload;
        pmLastSignals = Array.isArray(j?.signals) ? j.signals : [];
        pmIsPreview = !!(j?.preview || j?.comingSoon);
        fillPredictionAssetFilter(pmLastSignals);
        if (locked) {
          locked.textContent =
            t("pm_locked_note") ||
            "Signals are informational only, may be wrong, and are not outcomes. This tab never moves funds.";
        }
        renderPredictionSignals(pmLastSignals);
        if (status) {
          if (pmIsPreview) {
            status.textContent =
              t("pm_status_preview") ||
              "No live feed yet — external signal source is not connected. Refresh only checks the server.";
          } else {
            const at = j?.asOf ? new Date(j.asOf).toLocaleTimeString() : "";
            const cadence = String(j?.scheduleRangePerDay || "3-5");
            const base = `${cadence} signals/day`;
            status.textContent = at ? `${base} · updated: ${at}` : base;
          }
        }
      } catch (e) {
        const msg =
          friendlyUiErrorMessage(e?.message || "failed") ||
          t("pm_error_retry") ||
          "Could not load signals. Tap Refresh to try again.";
        if (status) status.textContent = msg;
        renderPredictionError(
          t("pm_error_retry", "Could not load signals. Tap Refresh to try again.")
        );
      }
    }

    function bindPredictionMarketUI() {
      if (bindPredictionMarketUI._done) return;
      bindPredictionMarketUI._done = true;
      const pmRefreshBtn = $("pm_refresh");
      if (pmRefreshBtn) {
        pmRefreshBtn.onclick = () => {
          loadPredictionSignals({ force: true });
        };
      }
      const dismissBtn = $("pm_newbie_dismiss");
      if (dismissBtn) {
        dismissBtn.onclick = () => dismissIntro();
      }
      syncPredictionFilterCopy();
      syncPredictionIntro();
      const pmAssetSel = $("pm_asset");
      if (pmAssetSel) {
        pmAssetSel.addEventListener("change", () => {
          pmFilters.asset = String(pmAssetSel.value || "all");
          renderPredictionSignals(pmLastSignals);
        });
      }
      const pmBiasSel = $("pm_bias");
      if (pmBiasSel) {
        pmBiasSel.addEventListener("change", () => {
          pmFilters.bias = String(pmBiasSel.value || "all").toLowerCase();
          renderPredictionSignals(pmLastSignals);
        });
      }
      const pmConfSel = $("pm_conf");
      if (pmConfSel) {
        pmConfSel.addEventListener("change", () => {
          pmFilters.minConf = Number(pmConfSel.value || 0) || 0;
          renderPredictionSignals(pmLastSignals);
        });
      }
      const timer = setInterval(() => {
        try {
          if (getCurrentTab() === "prediction") loadPredictionSignals({ force: false });
        } catch (_e) {}
      }, 60000);
      if (timer && typeof timer.unref === "function") timer.unref();
    }

    return {
      syncPredictionFilterCopy,
      syncPredictionIntro,
      dismissIntro,
      isIntroDismissed,
      introStorageKey,
      resetPredictionPrivateState,
      loadPredictionSignals,
      bindPredictionMarketUI,
      renderPredictionSignals,
      filteredPredictionSignals,
    };
  };
})(window);
