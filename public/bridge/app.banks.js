(function (window) {
  if (window.__GMXBanksFactory) return;

  window.__GMXBanksFactory = function createGMXBanks(ctx) {
    const storage = ctx && ctx.storage ? ctx.storage : {};
    const K = storage.keys || {};
    const dedupeLines = typeof ctx.dedupeLines === "function" ? ctx.dedupeLines : (lines) => lines;
    const EMPTY = String(ctx.EMPTY || "__EMPTY__");

    function linesFromText(t) {
      return String(t || "")
        .split(/\r?\n/)
        .map((x) => x.trim())
        .filter((x) => x && x !== EMPTY);
    }

    function getLangIndexKey(kind) {
      return kind === "gm" ? K.GM_LANGS : K.GN_LANGS;
    }

    function getGlobalKey(kind) {
      return kind === "gm" ? K.GM_GLOBAL : K.GN_GLOBAL;
    }

    function getLangKey(kind, lang) {
      return `gmx_${kind}_lang_${lang}`;
    }

    function getBankKey(kind) {
      return kind === "gm" ? "gmx_gm_bank" : "gmx_gn_bank";
    }

    function getBankMigrationKey(kind) {
      return kind === "gm" ? "gmx_gm_bank_migrated_v2" : "gmx_gn_bank_migrated_v2";
    }

    function getLangIndex(kind) {
      try {
        return JSON.parse(storage.lsGet(getLangIndexKey(kind), "[]"));
      } catch {
        return [];
      }
    }

    function setLangIndex(kind, arr) {
      const uniq = Array.from(new Set((arr || []).filter(Boolean)));
      storage.lsSet(getLangIndexKey(kind), JSON.stringify(uniq));
    }

    function readKey(key) {
      return linesFromText(storage.lsGet(key, ""));
    }

    function writeKey(key, lines) {
      storage.lsSet(key, (lines || []).join("\n"));
    }

    function allLegacyKeysForKind(kind) {
      const keys = [getGlobalKey(kind)];
      for (const lang of getLangIndex(kind)) {
        keys.push(getLangKey(kind, lang));
      }
      return Array.from(new Set(keys));
    }

    function migrateLegacyBank(kind) {
      const bankKey = getBankKey(kind);
      const marker = getBankMigrationKey(kind);
      const bankNow = dedupeLines(readKey(bankKey));
      if ((storage.lsGet(marker, "") || "") === "1") {
        if (bankNow.join("\n") !== readKey(bankKey).join("\n")) writeKey(bankKey, bankNow);
        return bankNow.length;
      }

      const merged = [];
      const mergeCap = 5000;
      for (const key of allLegacyKeysForKind(kind)) {
        if (merged.length >= mergeCap) break;
        merged.push(...readKey(key).slice(0, mergeCap - merged.length));
      }
      if (merged.length < mergeCap) merged.push(...bankNow.slice(0, mergeCap - merged.length));

      const finalBank = dedupeLines(merged).slice(0, mergeCap);
      writeKey(bankKey, finalBank);

      for (const key of allLegacyKeysForKind(kind)) {
        storage.lsRemove(key);
      }
      setLangIndex(kind, []);
      try {
        storage.lsSet(kind === "gm" ? K.GM_REPLY_LANG : K.GN_REPLY_LANG, "en");
      } catch {}
      try {
        storage.lsSet(marker, "1");
      } catch {}
      return finalBank.length;
    }

    return {
      linesFromText,
      getLangIndexKey,
      getGlobalKey,
      getLangKey,
      getBankKey,
      getBankMigrationKey,
      getLangIndex,
      setLangIndex,
      readKey,
      writeKey,
      allLegacyKeysForKind,
      migrateLegacyBank,
    };
  };
})(window);
