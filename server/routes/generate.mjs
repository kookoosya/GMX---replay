/** GM/GN generation HTTP routes (site + shared auth). */

const VALID_STYLES = new Set([
  "classic","classy","emoji","noemoji","minimal","meme","degen","alpha","cheer","calm","builder","focus"
]);

export function registerGenerateRoutes(deps) {
  const {
    app,
    requireAuth,
    sendError,
    ERROR_CODES,
    parseAntiLastN,
    normLang,
    generateUnique,
    generateRankedCandidates,
    saveRecent,
    todayKeyUTC,
    userByHandle,
    subscriptionInfo,
    insertLimitForUser,
    awardReferralBonus,
    maybeAwardStarterReward,
    supabaseActive,
    sbConsumeDailyAtomic,
    consumeDailyAtomic,
    nextResetUTC,
    logActivity,
  } = deps;

  async function consumeGenerationQuota(handle, kind, count) {
    const day = todayKeyUTC();
    try {
      awardReferralBonus(handle);
    } catch (_e) {}
    try {
      maybeAwardStarterReward(handle);
    } catch (_e) {}

    const u = userByHandle(handle);
    const limit = await insertLimitForUser({ ...u, handle }, { userRow: u });
    const sub = subscriptionInfo({ ...u, handle });
    const plan = sub.active ? "pro" : "free";

    const consume = supabaseActive()
      ? await sbConsumeDailyAtomic(handle, day, kind, limit, count, plan)
      : consumeDailyAtomic(handle, day, kind, limit, count);

    if (!consume.ok) {
      if (consume.error === "supabase_error" || consume.error === "supabase_inactive") {
        return {
          ok: false,
          status: 503,
          body: {
            ok: false,
            error: "supabase_error",
            detail: consume._sb_error || null,
            resetAt: nextResetUTC(),
          },
        };
      }
      try {
        logActivity(handle, "limit_hit", {
          kind,
          used: consume.used,
          limit: consume.limit,
          requested: count,
          resetAt: nextResetUTC(),
          source: "site_generate",
        });
      } catch (_e) {}
      return {
        ok: false,
        status: 429,
        body: {
          ok: false,
          error: "limit_reached",
          used: consume.used,
          limit: consume.limit,
          requested: count,
          remaining: Math.max(0, consume.limit - consume.used),
          resetAt: nextResetUTC(),
        },
      };
    }

    return { ok: true, used: consume.used, limit, resetAt: nextResetUTC() };
  }

  app.get("/api/generate", requireAuth, async (req, res) => {
    try {
      const handle = req.user?.handle || null;
      const kind = String(req.query.kind || "").toLowerCase();
      const mode = String(req.query.mode || "min").toLowerCase();
      const lang = normLang(req.query.lang);
      let style = String(req.query.style || "classic").toLowerCase();
      if (!VALID_STYLES.has(style)) style = "classic";
      const antiN = parseAntiLastN(req, 20);

      if (kind !== "gm" && kind !== "gn") return sendError(res, 400, "invalid_kind");
      if (!["min", "mid", "max"].includes(mode)) return sendError(res, 400, "invalid_mode");

      const quota = await consumeGenerationQuota(handle, kind, 1);
      if (!quota.ok) return res.status(quota.status).json(quota.body);

      const reply = generateUnique(handle, kind, mode, lang, style, antiN);
      saveRecent(handle, kind, reply, mode, style);
      try {
        logActivity(handle, "gen", { kind, mode, lang, style, antiN, source: "site" });
      } catch (_e) {}

      res.json({
        ok: true,
        handle,
        kind,
        mode,
        lang,
        reply,
        usage: {
          used: quota.used,
          limit: quota.limit,
          remaining:
            Number.isFinite(quota.limit) && quota.limit < 999999
              ? Math.max(0, quota.limit - quota.used)
              : null,
          resetAt: quota.resetAt,
        },
      });
    } catch (e) {
      console.error("GENERATE_ERROR", e);
      sendError(res, 500, ERROR_CODES.SERVER_ERROR);
    }
  });

  app.get("/api/generate-bulk", requireAuth, async (req, res) => {
    try {
      const handle = req.user?.handle || null;
      const kind = String(req.query.kind || "").toLowerCase();
      const mode = String(req.query.mode || "min").toLowerCase();
      const lang = normLang(req.query.lang);
      let style = String(req.query.style || "classic").toLowerCase();
      if (!VALID_STYLES.has(style)) style = "classic";
      const antiN = parseAntiLastN(req, 20);
      let count = Number(req.query.count || 10);
      if (!Number.isFinite(count)) count = 10;
      count = Math.max(1, Math.min(200, Math.floor(count)));

      if (kind !== "gm" && kind !== "gn") return sendError(res, 400, "invalid_kind");
      if (!["min", "mid", "max"].includes(mode)) return sendError(res, 400, "invalid_mode");

      const quota = await consumeGenerationQuota(handle, kind, count);
      if (!quota.ok) return res.status(quota.status).json(quota.body);

      const list = generateRankedCandidates(handle, kind, mode, lang, style, count, antiN, false);
      for (const r of list) saveRecent(handle, kind, r, mode, style);
      try {
        logActivity(handle, "gen_bulk", { kind, mode, lang, style, count: list.length, source: "site" });
      } catch (_e) {}

      res.json({
        ok: true,
        handle,
        kind,
        mode,
        lang,
        count: list.length,
        list,
        usage: {
          used: quota.used,
          limit: quota.limit,
          remaining:
            Number.isFinite(quota.limit) && quota.limit < 999999
              ? Math.max(0, quota.limit - quota.used)
              : null,
          resetAt: quota.resetAt,
        },
      });
    } catch (e) {
      console.error("BULK_ERROR", e);
      sendError(res, 500, ERROR_CODES.SERVER_ERROR);
    }
  });
}
