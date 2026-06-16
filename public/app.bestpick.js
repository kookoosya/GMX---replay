(function (window) {
  if (window.__GMXBestPickFactory) return;

  window.__GMXBestPickFactory = function createGMXBestPick(ctx) {
    ctx = ctx || {};
    const $ = typeof ctx.$ === "function" ? ctx.$ : (id) => document.getElementById(id);
    const api = typeof ctx.api === "function" ? ctx.api : async () => ({});
    const requireConnected =
      typeof ctx.requireConnected === "function" ? ctx.requireConnected : () => true;
    const readGenParams =
      typeof ctx.readGenParams === "function" ? ctx.readGenParams : () => ({});
    const getAntiStrength =
      typeof ctx.getAntiStrength === "function" ? ctx.getAntiStrength : () => 1;
    const activeKey = typeof ctx.activeKey === "function" ? ctx.activeKey : () => "";
    const readKey = typeof ctx.readKey === "function" ? ctx.readKey : () => [];
    const writeKey = typeof ctx.writeKey === "function" ? ctx.writeKey : () => {};
    const dedupeLines = typeof ctx.dedupeLines === "function" ? ctx.dedupeLines : (x) => x;
    const remainingSlots =
      typeof ctx.remainingSlots === "function" ? ctx.remainingSlots : () => Infinity;
    const pushRecent = typeof ctx.pushRecent === "function" ? ctx.pushRecent : () => {};
    const repeatKey = typeof ctx.repeatKey === "function" ? ctx.repeatKey : () => "";
    const renderList = typeof ctx.renderList === "function" ? ctx.renderList : () => {};
    const refreshUsage = typeof ctx.refreshUsage === "function" ? ctx.refreshUsage : async () => {};
    const setBusy = typeof ctx.setBusy === "function" ? ctx.setBusy : () => {};
    const toast = typeof ctx.toast === "function" ? ctx.toast : () => {};
    const t = typeof ctx.t === "function" ? ctx.t : (key) => key;
    const escapeHtml = typeof ctx.escapeHtml === "function" ? ctx.escapeHtml : (s) => String(s || "");
    const gen = ctx.gen || {};

    function pickBestLine(kind, lines) {
      const lastKey = kind === "gm" ? "gmx_last_best_gm" : "gmx_last_best_gn";
      const histKey = kind === "gm" ? "gmx_last_best_shapes_gm" : "gmx_last_best_shapes_gn";
      let recentShapes = [];
      try {
        recentShapes = JSON.parse(localStorage.getItem(histKey) || "[]");
      } catch {}
      recentShapes = Array.isArray(recentShapes)
        ? recentShapes
            .map((x) => String(x || "").trim())
            .filter(Boolean)
            .slice(-3)
        : [];
      return gen.pickBestLine(kind, lines, {
        last: (localStorage.getItem(lastKey) || "").trim(),
        recentShapes,
        onPersist(pick, _nextShape, merged) {
          try {
            localStorage.setItem(lastKey, pick);
            localStorage.setItem(histKey, JSON.stringify(merged));
          } catch {}
        },
      });
    }

    async function doBest(kind) {
      const lines = dedupeLines(readKey(activeKey(kind)));
      if (!lines || !lines.length) {
        toast("warn", t("toast_nothing_to_copy") || "Nothing to copy", 2500);
        return;
      }
      const best = pickBestLine(kind, lines);
      if (!best) {
        toast("warn", t("toast_nothing_to_copy") || "Nothing to copy", 2500);
        return;
      }

      try {
        await navigator.clipboard.writeText(best);
      } catch (_e) {}
      toast("ok", `Best copied<br><span class="muted">${escapeHtml(best)}</span>`, 6000);

      try {
        const bestTrim = String(best).trim();
        await new Promise((r) => requestAnimationFrame(r));
        const container = kind === "gm" ? $("gmList") : $("gnList");
        if (container) {
          container.querySelectorAll(".lineRow.selected").forEach((r) => r.classList.remove("selected"));
          const rows = Array.from(container.querySelectorAll(".lineRow"));
          const row = rows.find((r) => {
            const inp = r.querySelector("input");
            const txt = r.querySelector(".lineText");
            const v = (inp?.value || txt?.textContent || "").trim();
            return v === bestTrim;
          });
          if (row) {
            row.classList.add("selected");
            row.classList.add("bestFlash");
            try {
              row.scrollIntoView({ behavior: "smooth", block: "center" });
            } catch (_e) {}
            try {
              const cell = row.querySelector(".lineCell");
              const inp = row.querySelector("input");
              if (cell && !row.classList.contains("editing")) cell.click();
              else if (inp) {
                inp.focus();
                inp.select();
              }
            } catch (_e) {}
            setTimeout(() => row.classList.remove("bestFlash"), 1600);
          }
        }
      } catch (_e) {}
    }

    async function doBestServer(kind) {
      if (!requireConnected(kind === "gm" ? "GM" : "GN")) return;

      const msgEl = kind === "gm" ? $("gmMsg") : $("gnMsg");
      const { mode, lang, style, antiN } = readGenParams(kind);
      const keyActive = activeKey(kind);
      const strength = getAntiStrength(kind);

      setBusy(kind, true, "Picking the best reply...");
      try {
        const bulk = await api(
          `/api/generate-bulk?kind=${kind}&mode=${encodeURIComponent(mode)}&lang=${encodeURIComponent(lang)}&style=${encodeURIComponent(style)}&anti_last_n=${encodeURIComponent(antiN)}&count=5`,
          "GET",
          null,
          { timeoutMs: 30000 }
        );
        const candidates = dedupeLines((bulk && bulk.list) ? bulk.list : [])
          .map((x) => String(x || "").trim())
          .filter(Boolean);
        if (!candidates.length) {
          if (msgEl) msgEl.innerHTML = `<span class="warn">${escapeHtml("No fresh candidates returned")}</span>`;
          return;
        }

        const best = String(pickBestLine(kind, candidates) || "").trim();
        if (!best) {
          if (msgEl) msgEl.innerHTML = `<span class="warn">${escapeHtml("Could not choose the best reply")}</span>`;
          return;
        }

        const cur = readKey(keyActive);
        const already = gen.isLineAlreadySaved(cur, best, strength);
        let saved = false;

        if (!already) {
          if (remainingSlots(kind) > 0) {
            cur.push(best);
            writeKey(keyActive, cur);
            saved = true;
            pushRecent(kind, [repeatKey(best, Math.max(1, strength))]);
          }
        }

        try {
          navigator.clipboard.writeText(best);
        } catch (_e) {}
        renderList(kind);
        if (msgEl) {
          const head = already ? "Best already saved" : saved ? "Best saved" : "Best copied";
          msgEl.innerHTML = `<span class="ok">${escapeHtml(head)}</span> <span class="muted small">${escapeHtml(best)}</span>`;
        }
        try {
          await refreshUsage();
        } catch (_e) {}
      } catch (e) {
        const m = e && e.message ? e.message : "failed";
        if (msgEl) msgEl.innerHTML = `<span class="bad">${escapeHtml(m)}</span>`;
      } finally {
        setBusy(kind, false);
      }
    }

    return { pickBestLine, doBest, doBestServer };
  };
})(window);
