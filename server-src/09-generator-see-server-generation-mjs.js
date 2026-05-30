import { registerGenerateRoutes } from "./server/routes/generate.mjs";

// ---------- GENERATOR (see server/generation.mjs) ----------
let normLang, generateRankedCandidates, generateUnique, saveRecent;
function initGenerator() {
  const gen = createGenerator({ safeDb, db, nowIso, safeOptionalHistoryDb, sha256 });
  normLang = gen.normLang;
  generateRankedCandidates = gen.generateRankedCandidates;
  generateUnique = gen.generateUnique;
  saveRecent = gen.saveRecent;
  registerGenerateRoutes({
    app,
    requireAuth,
    sendError,
    ERROR_CODES,
    parseAntiLastN,
    normLang,
    generateUnique,
    generateRankedCandidates,
    saveRecent,
  });
}
