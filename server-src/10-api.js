import { registerMetaRoutes } from "./server/routes/meta.mjs";

registerMetaRoutes({
  app,
  getHealthSnapshot,
  BUILD_ID,
  STARTED_AT,
  DEV_RUN_TOKEN,
  nowIso,
  CONFIG,
  PLANS,
  SOL_RECEIVER,
  BILLING_TOKENS,
  BILLING_PLANS,
  EXTENSION_STORE_URL,
});
