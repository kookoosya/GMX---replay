(function (window) {
  if (window.__GMXBankUiFactory) return;

  window.__GMXBankUiFactory = function createGMXBankUi(ctx) {
    ctx = ctx || {};
    const $ = typeof ctx.$ === "function" ? ctx.$ : (id) => document.getElementById(id);
    const escapeHtml = typeof ctx.escapeHtml === "function" ? ctx.escapeHtml : (s) => String(s || "");
    const requireConnected =
      typeof ctx.requireConnected === "function" ? ctx.requireConnected : () => true;
    const getHandle = typeof ctx.getHandle === "function" ? ctx.getHandle : () => "";
    const isPro = typeof ctx.isPro === "function" ? ctx.isPro : () => false;
    const saveCap = typeof ctx.saveCap === "function" ? ctx.saveCap : () => Infinity;
    const saveCapFree = Number(ctx.saveCapFree) || 50;
    const lastSaved = ctx.lastSaved && typeof ctx.lastSaved === "object" ? ctx.lastSaved : { gm: 0, gn: 0 };
    const getBankKey = typeof ctx.getBankKey === "function" ? ctx.getBankKey : () => "";
    const allLegacyKeysForKind =
      typeof ctx.allLegacyKeysForKind === "function" ? ctx.allLegacyKeysForKind : () => [];
    const setLangIndex = typeof ctx.setLangIndex === "function" ? ctx.setLangIndex : () => {};
    const getBankMigrationKey =
      typeof ctx.getBankMigrationKey === "function" ? ctx.getBankMigrationKey : () => "";
    const readKey = typeof ctx.readKey === "function" ? ctx.readKey : () => [];
    const writeKey = typeof ctx.writeKey === "function" ? ctx.writeKey : () => {};
    const dedupeLines = typeof ctx.dedupeLines === "function" ? ctx.dedupeLines : (lines) => lines;
    const normalizeLine =
      typeof ctx.normalizeLine === "function" ? ctx.normalizeLine : (s) => String(s || "").trim();
    const linesFromText = typeof ctx.linesFromText === "function" ? ctx.linesFromText : () => [];
    const activeKey = typeof ctx.activeKey === "function" ? ctx.activeKey : getBankKey;
    const currentLang = typeof ctx.currentLang === "function" ? ctx.currentLang : () => "en";
    const ensureIndexed = typeof ctx.ensureIndexed === "function" ? ctx.ensureIndexed : () => {};
    const chunkedRender =
      typeof ctx.chunkedRender === "function" ? ctx.chunkedRender : (el, items, fn) => items.forEach(fn);
    const mountLineListSkeleton =
      typeof ctx.mountLineListSkeleton === "function" ? ctx.mountLineListSkeleton : () => {};
    const renderHelpModal =
      typeof ctx.renderHelpModal === "function" ? ctx.renderHelpModal : () => {};
    const openLimitModal = typeof ctx.openLimitModal === "function" ? ctx.openLimitModal : () => {};
    const trackEvent = typeof ctx.trackEvent === "function" ? ctx.trackEvent : () => {};
    const toast = typeof ctx.toast === "function" ? ctx.toast : () => {};
    const t = typeof ctx.t === "function" ? ctx.t : (_k, fb) => fb;
    const updateLangFlags = typeof ctx.updateLangFlags === "function" ? ctx.updateLangFlags : () => {};
    const renderLangChips =
      typeof ctx.renderLangChips === "function" ? ctx.renderLangChips : () => {};
    const abort = ctx.abort && typeof ctx.abort === "object" ? ctx.abort : { gm: null, gn: null };
    const draftKeys = ctx.draftKeys || {};

    let gmView = "saved";
    let gnView = "saved";

    function allKeysForKind(kind) {
      return [getBankKey(kind)];
    }

    function totalSaved(kind) {
      let total = 0;
      for (const k of allKeysForKind(kind)) {
        total += readKey(k).length;
      }
      return total;
    }

    function totalSlots(kind) {
      let total = 0;
      for (const k of allKeysForKind(kind)) {
        total += readKey(k).length;
      }
      return total;
    }

    function remainingSlots(kind) {
      const cap = saveCap();
      if (cap === Infinity) return Infinity;
      return Math.max(0, cap - totalSaved(kind));
    }

    function replaceRandomSavedLine(kind, newLine) {
      const key = activeKey(kind);
      const next = normalizeLine(newLine);
      const cur = dedupeLines(readKey(key));
      if (!next || !cur.length) return false;
      if (cur.some((x) => String(x || "").trim().toLowerCase() === next.toLowerCase())) return false;
      const idx = Math.floor(Math.random() * cur.length);
      cur[idx] = next;
      writeKey(key, cur);
      return true;
    }

    function countsByScope(kind) {
      const total = readKey(getBankKey(kind)).length;
      return { global: 0, langs: 0, total };
    }

    function updateSavedUI(kind) {
      const totalEl = kind === "gm" ? $("gmTotal") : $("gnTotal");
      const capEl = kind === "gm" ? $("gmCap") : $("gnCap");
      if (totalEl) totalEl.textContent = totalSaved(kind);
      if (capEl) capEl.textContent = isPro() ? "unlimited" : String(saveCapFree);
      const brEl = kind === "gm" ? $("gmSavedBreakdown") : $("gnSavedBreakdown");
      if (brEl) {
        brEl.textContent = "Saved bank: " + totalSaved(kind);
      }

      try {
        const used = totalSaved(kind);
        lastSaved[kind] = used;
        const cap = saveCapFree;
        const valId = kind === "gm" ? "gmSavedVal" : "gnSavedVal";
        const fillId = kind === "gm" ? "gmSavedFill" : "gnSavedFill";
        const v = $(valId);
        const f = $(fillId);
        if (v) v.textContent = isPro() ? `${used}/unlimited` : `${used}/${cap}`;
        if (f) f.style.width = isPro() ? "100%" : Math.min(100, Math.round((used / cap) * 100)) + "%";

        if (!$("help_modal")?.classList.contains("hidden")) renderHelpModal();
      } catch (_e) {}
    }

    function pruneEmptyLang(_kind, _lang) {
      return;
    }

    function trimKindToCap(kind) {
      let removed = 0;
      const key = getBankKey(kind);
      const cur = readKey(key);
      while (cur.length > saveCap()) {
        cur.pop();
        removed++;
      }
      writeKey(key, cur);
      return removed;
    }

    function renderList(kind) {
      const container = kind === "gm" ? $("gmList") : $("gnList");
      const countEl = kind === "gm" ? $("gmCount") : $("gnCount");
      const msgEl = kind === "gm" ? $("gmMsg") : $("gnMsg");
      if (!container || !countEl) return;

      const key = activeKey(kind);
      const rawLines = readKey(key);
      const lines = dedupeLines((rawLines || []).map(normalizeLine).filter(Boolean));
      if (lines.join("\n") !== rawLines.join("\n")) writeKey(key, lines);

      countEl.textContent = lines.length;
      updateSavedUI(kind);

      container.innerHTML = "";

      if (!getHandle()) {
        if (msgEl) msgEl.innerHTML = '<span class="warn">Connect first.</span>';
        return;
      }

      const filterEl = kind === "gm" ? $("gmFilter") : $("gnFilter");
      const q = filterEl && filterEl.value ? String(filterEl.value).trim().toLowerCase() : "";
      const items = q
        ? lines.map((val, idx) => ({ idx, val })).filter((x) => String(x.val || "").toLowerCase().includes(q))
        : lines.map((val, idx) => ({ idx, val }));

      if (!lines.length) {
        if (msgEl) msgEl.textContent = "Saved bank is empty.";
        return;
      }

      if (q && msgEl) {
        msgEl.innerHTML = `<span class="muted">Filtered: showing <b>${items.length}</b> / ${lines.length}</span>`;
      }

      if (q && items.length === 0) {
        const row = document.createElement("div");
        row.className = "muted";
        row.style.padding = "8px 2px";
        row.textContent = "No matches.";
        container.appendChild(row);
        return;
      }

      chunkedRender(
        container,
        items,
        (item, pos) => {
          const i = item.idx;
          const val = item.val;

          const row = document.createElement("div");
          row.className = "lineRow";
          row.innerHTML = `
        <span class="idx">${pos + 1}</span>
        <div class="lineCell" role="button" tabindex="0">
          <span class="lineText">${escapeHtml(val)}</span>
          <input class="lineInput" name="line" aria-label="Saved reply ${pos + 1}" value="${escapeHtml(val)}" style="display:none" />
        </div>
        <button class="delBtn" title="Remove" type="button" aria-label="Remove">&times;</button>
      `;
          const cell = row.querySelector(".lineCell");
          const textEl = row.querySelector(".lineText");
          const input = row.querySelector("input");
          const del = row.querySelector("button");

          function commitEdit() {
            const v = input.value.trim();
            if (!v) {
              const cur = readKey(key);
              cur.splice(i, 1);
              writeKey(key, cur);
              renderList(kind);
              return;
            }
            const cur = readKey(key);
            cur[i] = v;
            writeKey(key, cur);
            countEl.textContent = cur.length;
            textEl.textContent = v;
            input.style.display = "none";
            textEl.style.display = "";
            row.classList.remove("editing");
          }

          function startEdit() {
            row.classList.add("editing");
            input.value = textEl.textContent;
            input.style.display = "";
            textEl.style.display = "none";
            input.focus();
            input.select();
          }

          cell.addEventListener("click", (e) => {
            if (e.target === del) return;
            if (!row.classList.contains("editing")) startEdit();
          });
          input.addEventListener("blur", commitEdit);
          input.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              commitEdit();
            }
            if (e.key === "Escape") {
              e.preventDefault();
              input.value = textEl.textContent;
              input.style.display = "none";
              textEl.style.display = "";
              row.classList.remove("editing");
            }
          });
          input.addEventListener("input", () => {
            const v = input.value.trim();
            if (!v) return;
            const cur = readKey(key);
            cur[i] = v;
            writeKey(key, cur);
          });

          del.addEventListener("click", (e) => {
            e.stopPropagation();
            const cur = readKey(key);
            cur.splice(i, 1);
            writeKey(key, cur);
            renderList(kind);
          });
          return row;
        },
        { key: `lineRows_${kind}`, chunk: 26, mountSkeleton: (() => {
          try {
            if (window.GMXSkeletonCore?.lineListShouldUseSkeleton?.(items.length)) return mountLineListSkeleton;
          } catch {}
          return items.length >= 3 ? mountLineListSkeleton : undefined;
        })() }
      );
    }

    function setView(kind, _scope) {
      if (kind === "gm") {
        gmView = "saved";
        const a = $("gmViewGlobal");
        if (a) a.classList.remove("active");
        const b = $("gmViewLang");
        if (b) b.classList.add("active");
      } else {
        gnView = "saved";
        const a = $("gnViewGlobal");
        if (a) a.classList.remove("active");
        const b = $("gnViewLang");
        if (b) b.classList.add("active");
      }
      updateLangFlags();
      renderList(kind);
      renderLangChips(kind);
    }

    function addLine(kind) {
      if (!requireConnected(kind === "gm" ? "GM" : "GN")) return;
      const msgEl = kind === "gm" ? $("gmMsg") : $("gnMsg");
      const rem = remainingSlots(kind);
      if (rem <= 0) {
        msgEl.innerHTML = `<span class="warn">Free save limit reached (${saveCap()} lines). You can still edit existing lines. Upgrade for more.</span>`;
        try {
          openLimitModal({ reason: "save_cap", kind });
        } catch (_e) {}
        trackEvent("limit_hit", { kind, reason: "save_cap" });
        return;
      }
      const input = kind === "gm" ? $("gmNewLine") : $("gnNewLine");
      if (input) {
        input.focus();
        try {
          input.scrollIntoView({ block: "center", behavior: "smooth" });
        } catch (_e) {}
      }
      msgEl.innerHTML = `<span class="muted">Type your line below and click Add.</span>`;
    }

    function clearView(kind) {
      if (!requireConnected(kind === "gm" ? "GM" : "GN")) return;
      try {
        if (abort[kind]) abort[kind].abort();
      } catch (_e) {}
      const key = activeKey(kind);
      const cur = readKey(key);
      if (cur.length && !confirm("Clear this saved bank? This cannot be undone.")) return;
      writeKey(key, []);
      renderList(kind);
      const msgEl = kind === "gm" ? $("gmMsg") : $("gnMsg");
      if (msgEl) msgEl.innerHTML = `<span class="ok">Saved bank cleared.</span>`;
    }

    function clearAll(kind) {
      if (!requireConnected(kind === "gm" ? "GM" : "GN")) return;
      try {
        if (abort[kind]) abort[kind].abort();
      } catch (_e) {}
      const total = totalSaved(kind);
      if (total && !confirm("Clear all saved lines in this bank? This cannot be undone.")) return;
      for (const k of Array.from(new Set([...allLegacyKeysForKind(kind), getBankKey(kind)]))) {
        localStorage.removeItem(k);
      }
      setLangIndex(kind, []);
      writeKey(getBankKey(kind), []);
      try {
        localStorage.setItem(getBankMigrationKey(kind), "1");
      } catch (_e) {}
      if (kind === "gm") {
        gmView = "saved";
        const a = $("gmViewGlobal");
        if (a) a.classList.remove("active");
        const b = $("gmViewLang");
        if (b) b.classList.add("active");
      } else {
        gnView = "saved";
        const a = $("gnViewGlobal");
        if (a) a.classList.remove("active");
        const b = $("gnViewLang");
        if (b) b.classList.add("active");
      }
      updateLangFlags();
      renderLangChips(kind);
      renderList(kind);
      toast("ok", t("toast_cleared_all_saved_lines") || "Cleared all saved lines.");
    }

    function formatAllExport(kind) {
      const lines = readKey(getBankKey(kind));
      if (!lines.length) return "";
      return lines.join("\n").trim() + "\n";
    }

    async function copyAll(kind) {
      if (!requireConnected(kind === "gm" ? "GM" : "GN")) return;
      const txt = formatAllExport(kind);
      if (!txt) {
        toast("warn", t("toast_nothing_to_copy") || "Nothing to copy.");
        return;
      }
      try {
        await navigator.clipboard.writeText(txt);
        toast("ok", t("toast_copied") || "Copied.");
      } catch (_e) {
        const ta = document.createElement("textarea");
        ta.value = txt;
        document.body.appendChild(ta);
        ta.select();
        try {
          document.execCommand("copy");
          toast("ok", t("toast_copied") || "Copied.");
        } catch (_e2) {
          toast("bad", t("toast_copy_failed") || "Copy failed.");
        }
        ta.remove();
      }
    }

    function exportAll(kind) {
      if (!requireConnected(kind === "gm" ? "GM" : "GN")) return;
      const txt = formatAllExport(kind);
      if (!txt) {
        toast("warn", t("toast_nothing_to_export") || "Nothing to export.");
        return;
      }
      const blob = new Blob([txt], { type: "text/plain;charset=utf-8" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      const stamp = new Date().toISOString().slice(0, 10);
      a.download = `gmxreply_${kind}_${stamp}.txt`;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        URL.revokeObjectURL(a.href);
        a.remove();
      }, 50);
    }

    function saveDraft(kind) {
      try {
        if (kind === "gm") {
          const a = $("gmNewLine");
          if (a) localStorage.setItem(draftKeys.gmNew || "gmx_draft_gm_new", a.value || "");
          const p = $("gmPaste");
          if (p) localStorage.setItem(draftKeys.gmPaste || "gmx_draft_gm_paste", p.value || "");
        } else {
          const a = $("gnNewLine");
          if (a) localStorage.setItem(draftKeys.gnNew || "gmx_draft_gn_new", a.value || "");
          const p = $("gnPaste");
          if (p) localStorage.setItem(draftKeys.gnPaste || "gmx_draft_gn_paste", p.value || "");
        }
      } catch (_e) {}
    }

    function restoreDrafts() {
      try {
        const gmNew = $("gmNewLine");
        if (gmNew && !gmNew.value) {
          gmNew.value = localStorage.getItem(draftKeys.gmNew || "gmx_draft_gm_new") || "";
        }
        const gnNew = $("gnNewLine");
        if (gnNew && !gnNew.value) {
          gnNew.value = localStorage.getItem(draftKeys.gnNew || "gmx_draft_gn_new") || "";
        }
        const gmP = $("gmPaste");
        if (gmP && !gmP.value) {
          gmP.value = localStorage.getItem(draftKeys.gmPaste || "gmx_draft_gm_paste") || "";
        }
        const gnP = $("gnPaste");
        if (gnP && !gnP.value) {
          gnP.value = localStorage.getItem(draftKeys.gnPaste || "gmx_draft_gn_paste") || "";
        }
      } catch (_e) {}
    }

    function clearDraft(kind) {
      try {
        if (kind === "gm") {
          localStorage.removeItem(draftKeys.gmNew || "gmx_draft_gm_new");
          localStorage.removeItem(draftKeys.gmPaste || "gmx_draft_gm_paste");
        } else {
          localStorage.removeItem(draftKeys.gnNew || "gmx_draft_gn_new");
          localStorage.removeItem(draftKeys.gnPaste || "gmx_draft_gn_paste");
        }
      } catch (_e) {}
    }

    function commitNewLine(kind) {
      if (!requireConnected(kind === "gm" ? "GM" : "GN")) return;
      const input = kind === "gm" ? $("gmNewLine") : $("gnNewLine");
      const msgEl = kind === "gm" ? $("gmMsg") : $("gnMsg");
      if (!input) return;

      const v = input.value.trim();
      if (!v) {
        if (msgEl) msgEl.innerHTML = `<span class="muted">Type something first.</span>`;
        return;
      }

      if ((kind === "gm" ? gmView : gnView) === "lang") {
        ensureIndexed(kind, currentLang(kind));
      }

      const rem = remainingSlots(kind);
      if (rem <= 0) {
        if (msgEl) {
          msgEl.innerHTML = `<span class="warn">Free save limit reached (${saveCap()} lines). You can still edit existing lines. Upgrade for more.</span>`;
        }
        return;
      }

      const key = activeKey(kind);
      const cur = readKey(key);
      const exists = cur.some((s) => String(s || "").trim().toLowerCase() === v.toLowerCase());
      if (exists) {
        if (msgEl) msgEl.innerHTML = `<span class="muted">Already saved (duplicate ignored).</span>`;
        return;
      }
      cur.push(v);
      writeKey(key, cur);

      input.value = "";
      clearDraft(kind);
      renderList(kind);

      if (msgEl) msgEl.innerHTML = `<span class="ok">Added 1</span>`;
    }

    function addPasted(kind) {
      if (!requireConnected(kind === "gm" ? "GM" : "GN")) return;

      const box = kind === "gm" ? $("gmPaste") : $("gnPaste");
      const msgEl = kind === "gm" ? $("gmMsg") : $("gnMsg");
      if (!box) return;

      const pastedAll = linesFromText(box.value);
      if (!pastedAll.length) return;

      const rem = remainingSlots(kind);
      if (rem <= 0) {
        if (msgEl) {
          msgEl.innerHTML = `<span class="warn">Free save limit reached (${saveCap()}). You can still edit existing lines. Upgrade for more.</span>`;
        }
        return;
      }

      const pasted = rem === Infinity ? pastedAll : pastedAll.slice(0, rem);

      const key = activeKey(kind);
      const before = readKey(key);
      const combined = before.concat(pasted);
      const after = dedupeLines(combined);

      writeKey(key, after);
      box.value = "";
      clearDraft(kind);
      renderList(kind);

      const added = Math.max(0, after.length - before.length);
      const skippedDup = pasted.length - added;

      if (msgEl) {
        if (pasted.length < pastedAll.length) {
          msgEl.innerHTML = `<span class="warn">Added ${added}/${pastedAll.length} (cap reached)</span>`;
        } else if (skippedDup > 0) {
          msgEl.innerHTML = `<span class="ok">Added ${added}</span> <span class="muted small">(skipped ${skippedDup} duplicates)</span>`;
        } else {
          msgEl.innerHTML = `<span class="ok">Added ${added}</span>`;
        }
      }
    }

    return {
      totalSaved,
      totalSlots,
      remainingSlots,
      replaceRandomSavedLine,
      countsByScope,
      updateSavedUI,
      pruneEmptyLang,
      trimKindToCap,
      getGmView: () => gmView,
      getGnView: () => gnView,
      renderList,
      setView,
      addLine,
      clearView,
      clearAll,
      copyAll,
      exportAll,
      saveDraft,
      restoreDrafts,
      clearDraft,
      commitNewLine,
      addPasted,
    };
  };
})(window);
