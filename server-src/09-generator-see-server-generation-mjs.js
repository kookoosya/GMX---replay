import { registerGenerateRoutes } from "./server/routes/generate.mjs";
import { registerProToolsRoutes } from "./server/routes/pro-tools.mjs";
import { registerPublicRoutes } from "./server/routes/public.mjs";

// ---------- GENERATOR (see server/generation.mjs) ----------
let normLang, generateRankedCandidates, generateUnique, saveRecent;
let composeReply, sanitizeSingle, getRecentSet;
function initGenerator() {
  const gen = createGenerator({ safeDb, db, nowIso, safeOptionalHistoryDb, sha256 });
  normLang = gen.normLang;
  generateRankedCandidates = gen.generateRankedCandidates;
  generateUnique = gen.generateUnique;
  saveRecent = gen.saveRecent;
  composeReply = gen.composeReply;
  sanitizeSingle = gen.sanitizeSingle;
  getRecentSet = gen.getRecentSet;
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
  registerProToolsRoutes({
    app,
    requireAuth,
    sendError,
    ERROR_CODES,
    parseAntiLastN,
    rateLimit,
    normLang,
    generateUnique,
    saveRecent,
    composeReply,
    sanitizeSingle,
    getRecentSet,
    todayKeyUTC,
    userByHandle,
    subscriptionInfo,
    getDailyUsed,
    incDaily,
    safeOptionalHistoryDb,
    safeDb,
    db,
    getSupabaseAdmin,
    sbFavoritesGet,
    sbFavoritesHas,
    sbFavoritesDelete,
    sbFavoritesCount,
    sbFavoritesUpsert,
    sha256,
    nowIso,
    consumeLimiter,
    genBurstLimiter,
    bulkBurstLimiter,
    enforceGenGuard,
    GEN_SEMAPHORE,
    awardReferralBonus,
    maybeAwardStarterReward,
    insertLimitForUser,
    supabaseActive,
    sbConsumeDailyAtomic,
    consumeDailyAtomic,
    nextResetUTC,
    logActivity,
    referralFingerprint,
    originFromReq,
    sbBackfillInvitesFromSqlite,
    sbReferralsCount,
    sbRefClicksCount,
    sbUsageEverUsed,
    referralCountConfirmed,
    referralCountActive,
    getReferralPromoterSummary,
    referralRewardTotal,
    computeReferralUnlocks,
    CONFIG,
    classifyReferralEntry,
    REF_MIN_ACTIVE_DAYS,
    REF_MIN_ACTIVE_USES,
    getBearer,
    userByToken,
    validHandle,
    isAdminHandle,
    setFeatureFlag,
    sbRefClicksUpsert,
  });
  registerPublicRoutes({
    app,
    sendError,
    normLang,
    generateRankedCandidates,
    composeReply,
    sanitizeSingle,
    safeDb,
    db,
    todayKeyUTC,
  });
}
