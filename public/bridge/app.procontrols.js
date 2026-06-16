(function (window) {
  if (window.__GMXProControlsFactory) return;

  window.__GMXProControlsFactory = function createGMXProControls(ctx) {
    ctx = ctx || {};
    const $ = typeof ctx.$ === "function" ? ctx.$ : (id) => document.getElementById(id);
    const isPro = typeof ctx.isPro === "function" ? ctx.isPro : () => false;
    const escapeHtml = typeof ctx.escapeHtml === "function" ? ctx.escapeHtml : (s) => String(s || "");
    const storage = ctx.storage || {};
    const lsKeyPack =
      typeof ctx.lsKeyPack === "function"
        ? ctx.lsKeyPack
        : typeof storage.lsKeyPack === "function"
          ? (kind) => storage.lsKeyPack(kind)
          : () => "";
    const lsSet =
      typeof ctx.lsSet === "function"
        ? ctx.lsSet
        : typeof storage.lsSet === "function"
          ? (k, v) => storage.lsSet(k, v)
          : (k, v) => {
              try {
                localStorage.setItem(k, String(v));
              } catch {}
            };
    const lsGet =
      typeof ctx.lsGet === "function"
        ? ctx.lsGet
        : typeof storage.lsGet === "function"
          ? (k, fb) => storage.lsGet(k, fb)
          : (k, fb = "") => {
              try {
                const v = localStorage.getItem(k);
                return v === null || v === undefined ? fb : v;
              } catch {
                return fb;
              }
            };
    const lsRemove =
      typeof ctx.lsRemove === "function"
        ? ctx.lsRemove
        : typeof storage.lsRemove === "function"
          ? (k) => storage.lsRemove(k)
          : (k) => {
              try {
                localStorage.removeItem(k);
              } catch {}
            };
    const packsForKind = typeof ctx.packsForKind === "function" ? ctx.packsForKind : () => [];
    const unlockedPacksCountFor =
      typeof ctx.unlockedPacksCountFor === "function" ? ctx.unlockedPacksCountFor : () => 999;
    const applyPackDefaultsToUi =
      typeof ctx.applyPackDefaultsToUi === "function" ? ctx.applyPackDefaultsToUi : () => {};
    const logEvent = typeof ctx.logEvent === "function" ? ctx.logEvent : () => {};
    const getProToolsNote =
      typeof ctx.getProToolsNote === "function" ? ctx.getProToolsNote : () => "Pro-only tools.";
    const readKey = typeof ctx.readKey === "function" ? ctx.readKey : () => [];
    const writeKey = typeof ctx.writeKey === "function" ? ctx.writeKey : () => {};
    const getBankKey = typeof ctx.getBankKey === "function" ? ctx.getBankKey : (kind) => kind;
    const allKeysForKind = typeof ctx.allKeysForKind === "function" ? ctx.allKeysForKind : () => [];
    const allLegacyKeysForKind =
      typeof ctx.allLegacyKeysForKind === "function" ? ctx.allLegacyKeysForKind : () => [];
    const getHandle = typeof ctx.getHandle === "function" ? ctx.getHandle : () => "";
    const dedupeLines = typeof ctx.dedupeLines === "function" ? ctx.dedupeLines : (lines) => lines;
    const normalizeLine = typeof ctx.normalizeLine === "function" ? ctx.normalizeLine : (s) => String(s || "").trim();
    const cleanupKeyLines =
      typeof ctx.cleanupKeyLines === "function" ? ctx.cleanupKeyLines : (lines) => lines || [];
    const setLangIndex = typeof ctx.setLangIndex === "function" ? ctx.setLangIndex : () => {};
    const getBankMigrationKey =
      typeof ctx.getBankMigrationKey === "function" ? ctx.getBankMigrationKey : () => "";
    const trimKindToCap = typeof ctx.trimKindToCap === "function" ? ctx.trimKindToCap : () => {};
    const onAfterImport = typeof ctx.onAfterImport === "function" ? ctx.onAfterImport : () => {};
    const themeKey = ctx.themeKey || "gmx_theme";
    const customBgKey = ctx.customBgKey || "gmx_custom_bg_global";
    const gmReplyLangKey = ctx.gmReplyLangKey || "gmx_gm_reply_lang";
    const gnReplyLangKey = ctx.gnReplyLangKey || "gmx_gn_reply_lang";

    function cleanupKind(kind) {
      let changed = 0;
      for (const k of allKeysForKind(kind)) {
        const before = readKey(k);
        const after = cleanupKeyLines(before).map(normalizeLine).filter(Boolean);
        if (after.join("\n") !== before.join("\n")) {
          writeKey(k, after);
          changed++;
        }
      }
      return changed;
    }

    function exportData() {
      const gmBank = readKey(getBankKey("gm"));
      const gnBank = readKey(getBankKey("gn"));
      const data = {
        v: 2,
        handle: getHandle(),
        theme: lsGet(themeKey, "classic") || "classic",
        customBg: lsGet(customBgKey, "") || null,
        gm: { bank: gmBank, index: [], global: gmBank, langs: {} },
        gn: { bank: gnBank, index: [], global: gnBank, langs: {} },
      };
      return JSON.stringify(data);
    }

    function importData(jsonText) {
      const data = JSON.parse(jsonText);
      if (!data || typeof data !== "object") throw new Error("bad_json");
      if (!data.gm || !data.gn) throw new Error("missing_sections");

      if (data.theme) lsSet(themeKey, String(data.theme));
      if ("customBg" in data) {
        if (data.customBg) lsSet(customBgKey, String(data.customBg));
        else lsRemove(customBgKey);
      }

      const mergeImportedBank = (kind, payload) => {
        const direct = Array.isArray(payload?.bank) ? payload.bank : [];
        const legacyGlobal = Array.isArray(payload?.global) ? payload.global : [];
        const legacyLangs = payload?.langs && typeof payload.langs === "object" ? payload.langs : {};
        const merged = [];
        merged.push(...direct);
        merged.push(...legacyGlobal);
        for (const arr of Object.values(legacyLangs)) {
          if (Array.isArray(arr)) merged.push(...arr);
        }
        for (const k of Array.from(new Set([...allLegacyKeysForKind(kind), getBankKey(kind)]))) {
          lsRemove(k);
        }
        setLangIndex(kind, []);
        writeKey(getBankKey(kind), dedupeLines(merged));
        try {
          lsSet(kind === "gm" ? gmReplyLangKey : gnReplyLangKey, "en");
        } catch {}
        try {
          lsSet(getBankMigrationKey(kind), "1");
        } catch {}
      };

      mergeImportedBank("gm", data.gm);
      mergeImportedBank("gn", data.gn);
      if (!isPro()) {
        try {
          trimKindToCap("gm");
          trimKindToCap("gn");
        } catch (_e) {}
      }
      onAfterImport(data);
    }

    async function copyToClipboard(text) {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch {
        const ta = document.createElement("textarea");
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        try {
          document.execCommand("copy");
        } catch {}
        ta.remove();
        return true;
      }
    }

    function bindProTools() {
      const note = $("pro_tools_note");
      const gate = () => {
        if (!isPro()) {
          if (note) note.textContent = getProToolsNote();
          return false;
        }
        if (note) note.textContent = "";
        return true;
      };

      const on = (id, fn) => {
        const el = $(id);
        if (!el) return;
        el.addEventListener("click", async () => {
          if (!gate()) return;
          try {
            const msg = fn();
            if (note) note.textContent = msg || "Done.";
          } catch (e) {
            if (note) note.textContent = "Failed: " + (e && e.message ? e.message : "error");
          }
        });
      };

      on("toolCleanupGm", () => `GM: cleaned ${cleanupKind("gm")} list(s).`);
      on("toolCleanupGn", () => `GN: cleaned ${cleanupKind("gn")} list(s).`);

      const expBtn = $("toolExport");
      if (expBtn) {
        expBtn.addEventListener("click", async () => {
          if (!gate()) return;
          const data = exportData();
          await copyToClipboard(data);
          if (note) note.textContent = "Export copied to clipboard (JSON).";
        });
      }
      const impBtn = $("toolImport");
      if (impBtn) {
        impBtn.addEventListener("click", () => {
          if (!gate()) return;
          const v = prompt("Paste export JSON here:");
          if (!v) return;
          try {
            importData(v);
            if (note) note.textContent = "Import complete.";
          } catch (e) {
            if (note) note.textContent = "Import failed: " + (e && e.message ? e.message : "error");
          }
        });
      }
    }

    function bindProControls() {
      const bindPack = (kind) => {
        const sel = kind === "gm" ? $("gmPack") : $("gnPack");
        const btn = kind === "gm" ? $("gmPackApply") : $("gnPackApply");
        const msgEl = kind === "gm" ? $("gmMsg") : $("gnMsg");
        if (sel) {
          sel.addEventListener("change", () => {
            const pid = sel.value || "classic";
            lsSet(lsKeyPack(kind), pid);
            logEvent("pack_change", { kind, pack: pid });
            const packs = packsForKind(kind);
            const idx = packs.findIndex((x) => x.id === pid);
            const locked = !isPro() && idx >= unlockedPacksCountFor(kind);
            if (!locked) {
              const packRow = packs.find((x) => x.id === pid) || packs[0];
              applyPackDefaultsToUi(kind, packRow);
            }
          });
        }
        if (btn) {
          btn.addEventListener("click", () => {
            const pid = sel ? sel.value || "classic" : "classic";
            const packs = packsForKind(kind);
            const p = packs.find((x) => x.id === pid) || packs[0];
            const idx = packs.findIndex((x) => x.id === pid);
            const locked = !isPro() && idx >= unlockedPacksCountFor(kind);
            if (locked) {
              if (msgEl) {
                msgEl.innerHTML =
                  '<span class="warn">Pack is locked. Upgrade to Pro or unlock via referrals.</span>';
              }
              return;
            }
            applyPackDefaultsToUi(kind, p);
            if (msgEl) {
              msgEl.innerHTML = `<span class="ok">Applied pack: ${escapeHtml(p.name)}</span>`;
            }
            logEvent("pack_apply", { kind, pack: pid });
          });
        }
      };

      const sync = (_kind) => {};

      ["gm", "gn"].forEach((kind) => {
        bindPack(kind);
        sync(kind);
      });

      try {
        window.__syncProControls = () => {
          ["gm", "gn"].forEach(sync);
        };
      } catch {}
    }

    function wire() {
      bindProTools();
      bindProControls();
    }

    return { wire, cleanupKind, exportData, importData, copyToClipboard };
  };
})(window);
