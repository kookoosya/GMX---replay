// ---------- GENERATOR (see server/generation.mjs) ----------
let normLang, generateRankedCandidates, generateUnique;
function initGenerator() {
  const gen = createGenerator({ safeDb, db, nowIso, safeOptionalHistoryDb, sha256 });
  normLang = gen.normLang;
  generateRankedCandidates = gen.generateRankedCandidates;
  generateUnique = gen.generateUnique;
}
