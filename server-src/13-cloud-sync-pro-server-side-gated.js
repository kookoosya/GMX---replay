import { registerCloudRoutes } from "./server/routes/cloud.mjs";

registerCloudRoutes({
  app,
  requireAuth,
  userByHandle,
  subscriptionInfo,
  getSupabaseAdmin,
  sbCloudListsGet,
  sbCloudListsUpsert,
  safeDb,
  db,
  nowIso,
});
