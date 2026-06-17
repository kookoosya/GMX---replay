  if (!window.__GMXBanksWireFactory) throw new Error("GMX bankswire factory missing");
  const {
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
  } = window.__GMXBanksWireFactory({ banks: __gmxBanks });

function allKeysForKind(kind) {
  return [getBankKey(kind)];
}
