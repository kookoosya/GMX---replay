import { registerStaticRoutes } from "./server/routes/static.mjs";

const PUBLIC_DIR = path.join(__dirname, "public");

registerStaticRoutes({
  app,
  express,
  fs,
  PUBLIC_DIR,
  EXTENSION_STORE_URL,
});

import { registerAdminAuthRoutes } from "./server/routes/admin-auth.mjs";

registerAdminAuthRoutes({
  app,
  requireAuth,
  rateLimit,
  getAdminKey,
  getAdminToken,
  safeEq,
  adminSessionCreate,
  adminSessionDelete,
  ADMIN_SECRET,
  ADMIN_PASSWORD,
  getAdminHandle,
  setSetting,
  isAdminHandle,
});

import { registerBillingRoutes } from "./server/routes/billing.mjs";

registerBillingRoutes({
  app,
  requireAuth,
  sendError,
  ERROR_CODES,
  BILLING_PLANS,
  BILLING_TOKENS,
  SOL_RECEIVER,
  isSolanaPubkey,
  getSolUsd,
  quoteSolLamportsFromUsd,
  safeDb,
  db,
  nowIso,
  randHex,
  userByHandle,
  subscriptionInfo,
  logActivity,
  grantReferralReward,
  referralCountActive,
  referralRewardTotal,
  computeReferralUnlocks,
  PUBLIC_DIR,
  ASSETS_DIR,
  path,
  fs,
  crypto,
  fetch,
});

initGenerator();
