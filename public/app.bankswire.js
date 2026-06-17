(function (window) {
  if (window.__GMXBanksWireFactory) return;

  window.__GMXBanksWireFactory = function createGMXBanksWire(ctx) {
    ctx = ctx || {};
    const banks = ctx.banks || {};

    function linesFromText(t) {
      return banks.linesFromText?.(t);
    }
    function getLangIndexKey(kind) {
      return banks.getLangIndexKey?.(kind);
    }
    function getGlobalKey(kind) {
      return banks.getGlobalKey?.(kind);
    }
    function getLangKey(kind, lang) {
      return banks.getLangKey?.(kind, lang);
    }
    function getBankKey(kind) {
      return banks.getBankKey?.(kind);
    }
    function getBankMigrationKey(kind) {
      return banks.getBankMigrationKey?.(kind);
    }
    function getLangIndex(kind) {
      return banks.getLangIndex?.(kind);
    }
    function setLangIndex(kind, arr) {
      return banks.setLangIndex?.(kind, arr);
    }
    function readKey(key) {
      return banks.readKey?.(key);
    }
    function writeKey(key, lines) {
      return banks.writeKey?.(key, lines);
    }
    function allLegacyKeysForKind(kind) {
      return banks.allLegacyKeysForKind?.(kind);
    }
    function migrateLegacyBank(kind) {
      return banks.migrateLegacyBank?.(kind);
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
