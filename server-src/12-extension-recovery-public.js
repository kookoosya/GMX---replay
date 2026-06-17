import { registerUserRoutes } from "./server/routes/user.mjs";
import { createExtSelectors } from "./server/ext-selectors.mjs";
import { registerExtRoutes } from "./server/routes/ext.mjs";

const extSelectors = createExtSelectors({ safeDb, db, nowIso, sha256, randHex });

registerExtRoutes({
  app,
  BUILD_ID,
  safeDb,
  db,
  nowIso,
  sha256,
  referralFingerprint,
  getEffectiveExtSelectorsForClient: extSelectors.getEffectiveExtSelectorsForClient,
});

registerUserRoutes({
  app,
  rateLimit,
  initLimiter,
  requireAuth,
  maybeAuth,
  sendError,
  ERROR_CODES,
  CONFIG,
  DEV_MODE,
  BUILD_ID,
  STARTED_AT,
  nowIso,
  todayKeyUTC,
  nextResetUTC,
  sha256,
  getAuthToken,
  setAuthCookie,
  canUseDevSessionReset,
  normalizeHandle,
  validHandle,
  userByHandle,
  userByToken,
  ensureUser,
  rotateToken,
  safeDb,
  db,
  supabaseActive,
  sbGetDailyUsed,
  sbReferralsUpsertInvite,
  getDailyUsed,
  subscriptionInfo,
  insertLimitForUser,
  awardReferralBonus,
  maybeAwardStarterReward,
  getReferralPromoterSummary,
  referralRewardTotal,
  computeReferralUnlocks,
  referralFingerprint,
  clientIp,
  originFromReq,
  isAdminHandle,
  logActivity,
});

// Expose for admin routes (server/routes/admin.mjs)
var __GMX_EXT_SELECTORS = extSelectors;
