(function (window) {
  if (window.__GMXGenHistoryUiFactory) return;

  window.__GMXGenHistoryUiFactory = function createGMXGenHistoryUi(ctx) {
    ctx = ctx || {};
    const $ = typeof ctx.$ === "function" ? ctx.$ : (id) => document.getElementById(id);
    const t = typeof ctx.t === "function" ? ctx.t : (k, fb) => fb || k;
    const toast = typeof ctx.toast === "function" ? ctx.toast : () => {};
    const escapeHtml = typeof ctx.escapeHtml === "function" ? ctx.escapeHtml : (s) => String(s || "");

    const storage =
      ctx.storage ||
      (typeof window.__GMXStorageFactory === "function" ? window.__GMXStorageFactory() : null);
    const lsGet =
      typeof ctx.lsGet === "function"
        ? ctx.lsGet
        : (k, d) => {
            try {
              return storage?.lsGet?.(k, d) ?? d;
            } catch {
              return d;
            }
          };
    const lsSet =
      typeof ctx.lsSet === "function"
        ? ctx.lsSet
        : (k, v) => {
            try {
              storage?.lsSet?.(k, v);
            } catch {}
          };

    const core = window.GMXGmGnGenHistoryCore || {};
    const readBatchHistory =
      typeof core.readBatchHistory === "function"
        ? (kind) => core.readBatchHistory(kind, lsGet)
        : () => [];
    const pushBatchHistory =
      typeof core.pushBatchHistory === "function"
        ? (kind, entry) => core.pushBatchHistory(kind, entry, lsGet, lsSet)
        : () => [];
    const formatBatchWhen =
      typeof core.formatBatchWhen === "function" ? core.formatBatchWhen : (iso) => String(iso || "");

    async function copyLines(lines) {
      const text = (lines || []).join("\n").trim();
      if (!text) return false;
      try {
        await navigator.clipboard.writeText(text);
        toast("ok", t("toast_copied") || "Copied.");
        return true;
      } catch {
        toast("bad", t("toast_copy_failed") || "Copy failed.");
        return false;
      }
    }

    function recordBatchHistory(kind, entry) {
      pushBatchHistory(kind, entry);
      renderGenHistory(kind);
    }

    function renderGenHistory(kind) {
      const wrap = $(`${kind}GenHistory`);
      const list = $(`${kind}GenHistoryList`);
      if (!wrap || !list) return;

      const label = $(`${kind}_gen_history_label`);
      if (label) label.textContent = t(`${kind}_gen_history_label`) || t("gen_history_label") || "Recent batches";

      const batches = readBatchHistory(kind);
      if (!batches.length) {
        wrap.classList.add("hidden");
        list.replaceChildren();
        return;
      }

      wrap.classList.remove("hidden");
      list.replaceChildren();

      for (const batch of batches) {
        const row = document.createElement("div");
        row.className = "genHistoryItem";

        const meta = document.createElement("div");
        meta.className = "genHistoryMeta";
        const n = Math.max(1, Number(batch.count) || batch.lines?.length || 0);
        const when = formatBatchWhen(batch.at);
        meta.textContent = `${n} lines${when ? ` · ${when}` : ""}`;

        const preview = document.createElement("div");
        preview.className = "genHistoryPreview muted small";
        const sample = (batch.lines || []).slice(0, 2).join(" · ");
        preview.textContent = sample || "—";

        const copyBtn = document.createElement("button");
        copyBtn.type = "button";
        copyBtn.className = "btn ghost mini";
        copyBtn.textContent = t(`${kind}_gen_history_copy`) || t("gen_history_copy") || "Copy again";
        copyBtn.addEventListener("click", () => {
          copyLines(batch.lines || []);
        });

        row.appendChild(meta);
        row.appendChild(preview);
        row.appendChild(copyBtn);
        list.appendChild(row);
      }
    }

    function renderAllGenHistory() {
      renderGenHistory("gm");
      renderGenHistory("gn");
    }

    return { recordBatchHistory, renderGenHistory, renderAllGenHistory };
  };
})(window);
