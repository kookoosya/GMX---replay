// ---------- DB ----------
import { createDb } from "./server/db.mjs";

const {
  DB_MODE,
  SUPABASE_CONFIGURED,
  getSupabaseAdmin,
  supabaseActive,
  sbEnsureUser,
  sbCloudListsGet,
  sbCloudListsUpsert,
  sbFavoritesGet,
  sbFavoritesCount,
  sbFavoritesHas,
  sbFavoritesDelete,
  sbFavoritesUpsert,
  sbGetDailyUsed,
  sbConsumeDailyAtomic,
  DB_PATH,
  db,
} = createDb({
  createClient,
  path,
  dirname: __dirname,
  Database,
  nowIso,
  mirrorSupabaseUsageToSqlite,
  sbReferralsMarkFirstUse,
});
