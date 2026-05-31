/** Register all admin API route modules. */

import { registerAdminExtSelectorsRoutes } from "./ext-selectors.mjs";
import { registerAdminStatsRoutes } from "./stats.mjs";
import { registerAdminMetricsRoutes } from "./metrics.mjs";
import { registerAdminExtHealthRoutes } from "./ext-health.mjs";
import { registerAdminOperationsRoutes } from "./operations.mjs";

export function registerAdminRoutes(deps) {
  registerAdminExtSelectorsRoutes(deps);
  registerAdminStatsRoutes(deps);
  registerAdminMetricsRoutes(deps);
  registerAdminExtHealthRoutes(deps);
  registerAdminOperationsRoutes(deps);
}
