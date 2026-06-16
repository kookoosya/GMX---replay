  // ----- Lists (single saved bank per kind; legacy global/lang banks migrate once) -----
  function linesFromText(t){ return __gmxBanks.linesFromText(t); }
  function getLangIndexKey(kind){ return __gmxBanks.getLangIndexKey(kind); }
  function getGlobalKey(kind){ return __gmxBanks.getGlobalKey(kind); }
  function getLangKey(kind, lang){ return __gmxBanks.getLangKey(kind, lang); }
  function getBankKey(kind){ return __gmxBanks.getBankKey(kind); }
  function getBankMigrationKey(kind){ return __gmxBanks.getBankMigrationKey(kind); }
  function getLangIndex(kind){ return __gmxBanks.getLangIndex(kind); }
  function setLangIndex(kind, arr){ return __gmxBanks.setLangIndex(kind, arr); }
  function readKey(key){ return __gmxBanks.readKey(key); }
  function writeKey(key, lines){ return __gmxBanks.writeKey(key, lines); }
  function allLegacyKeysForKind(kind){ return __gmxBanks.allLegacyKeysForKind(kind); }
  function migrateLegacyBank(kind){ return __gmxBanks.migrateLegacyBank(kind); }
