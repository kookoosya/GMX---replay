import { createAdminSessionHelpers } from "./server/admin/session.mjs";

// ---------- ADMIN (session helpers; auth routes in server/routes/admin-auth.mjs) ----------
const {
  getAdminKey,
  getAdminToken,
  safeEq,
  adminSessionCleanup,
  adminSessionCreate,
  adminSessionGet,
  adminSessionDelete,
} = createAdminSessionHelpers({ db, crypto, adminSessionHours: ADMIN_SESSION_HOURS });
