/** Pro tools route bundle (split modules). */

import { registerToolsRoutes } from "./tools.mjs";
import { registerRandomRoutes } from "./random.mjs";
import { registerReferralsRoutes } from "./referrals.mjs";
import { registerEngagementRoutes } from "./engagement.mjs";

export function registerProToolsRoutes(deps) {
  registerToolsRoutes(deps);
  registerRandomRoutes(deps);
  registerReferralsRoutes(deps);
  registerEngagementRoutes(deps);
}
