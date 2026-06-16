  // ----- Lists (single saved bank per kind; legacy global/lang banks migrate once) -----
  function linesFromText(t){
    return String(t||"").split(/\r?\n/).map(x=>x.trim()).filter(x=>x && x!==EMPTY);
  }

  function getLangIndexKey(kind){ return kind==="gm" ? GM_LANGS : GN_LANGS; }
  function getGlobalKey(kind){ return kind==="gm" ? GM_GLOBAL : GN_GLOBAL; }
  function getLangKey(kind, lang){ return `gmx_${kind}_lang_${lang}`; }
  function getBankKey(kind){ return kind==="gm" ? "gmx_gm_bank" : "gmx_gn_bank"; }
  function getBankMigrationKey(kind){ return kind==="gm" ? "gmx_gm_bank_migrated_v2" : "gmx_gn_bank_migrated_v2"; }

  function getLangIndex(kind){
    try{ return JSON.parse(localStorage.getItem(getLangIndexKey(kind)) || "[]"); }
    catch{ return []; }
  }
  function setLangIndex(kind, arr){
    const uniq = Array.from(new Set(arr.filter(Boolean)));
    localStorage.setItem(getLangIndexKey(kind), JSON.stringify(uniq));
  }

  function readKey(key){ return linesFromText(localStorage.getItem(key) || ""); }
  function writeKey(key, lines){ localStorage.setItem(key, lines.join("\n")); }

  function allLegacyKeysForKind(kind){
    const keys = [getGlobalKey(kind)];
    for (const lang of getLangIndex(kind)){
      keys.push(getLangKey(kind, lang));
    }
    return Array.from(new Set(keys));
  }

  function migrateLegacyBank(kind){
    const bankKey = getBankKey(kind);
    const marker = getBankMigrationKey(kind);
    const bankNow = dedupeLines(readKey(bankKey));
    if ((localStorage.getItem(marker) || "") === "1") {
      if (bankNow.join("\n") !== readKey(bankKey).join("\n")) writeKey(bankKey, bankNow);
      return bankNow.length;
    }

    const merged = [];
    const mergeCap = 5000;
    for (const key of allLegacyKeysForKind(kind)){
      if (merged.length >= mergeCap) break;
      merged.push(...readKey(key).slice(0, mergeCap - merged.length));
    }
    if (merged.length < mergeCap) merged.push(...bankNow.slice(0, mergeCap - merged.length));

    const finalBank = dedupeLines(merged).slice(0, mergeCap);
    writeKey(bankKey, finalBank);

    for (const key of allLegacyKeysForKind(kind)){
      localStorage.removeItem(key);
    }
    setLangIndex(kind, []);
    try{ localStorage.setItem(kind === "gm" ? LS_GM_REPLY_LANG : LS_GN_REPLY_LANG, "en"); }catch{}
    try{ localStorage.setItem(marker, "1"); }catch{}
    return finalBank.length;
  }

