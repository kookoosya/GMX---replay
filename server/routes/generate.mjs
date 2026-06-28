/** GM/GN generation HTTP routes (site + shared auth). */

const VALID_STYLES = new Set([
  "classic","classy","emoji","noemoji","minimal","meme","degen","alpha","cheer","calm","builder","focus"
]);

import {
  freeGenLimitsFromPromo,
  getFreeGenState,
  consumeFreeGenAtomic,
  ensureFreeGenMigratedAsync,
} from "../free-gen-quota.mjs";

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
    userByHandle,
    subscriptionInfo,
    getReferralPromoterSummary,
    awardReferralBonus,
    maybeAwardStarterReward,
    safeDb,
    db,
    CONFIG,
    logActivity,
    sbSumLegacyGenUsed,
  } = deps;

  async function freeGenContext(handle) {
    try {
      awardReferralBonus(handle);
    } catch (_e) {}
    try {
      maybeAwardStarterReward(handle);
    } catch (_e) {}
    const u = userByHandle(handle) || { handle };
    const promo = await getReferralPromoterSummary(handle, { userRow: u });
    const sub = subscriptionInfo({ ...u, handle });
    const limits = freeGenLimitsFromPromo(CONFIG, promo);
    await ensureFreeGenMigratedAsync(safeDb, db, handle, limits.total, { sbSumLegacyGenUsed });
    const state = getFreeGenState(safeDb, db, handle, sub.active ? 999999 : limits.total);
    return { u, sub, promo, limits, state };
  }

  function logGenerateRouteError(stage, err, meta = {}) {
    console.error("GENERATE_ROUTE_ERROR", {
      stage,
      name: err?.name || "Error",
      message: String(err?.message || err).slice(0, 240),
      kind: meta.kind || null,
      count: meta.count ?? null,
    });
  }

  function limitReachedBody(state, limits, requested = 1) {
    return {
      ok: false,
      error: "limit_reached",
      used: state.used,
      limit: limits.total,
      baseLimit: limits.base,
      bonusLimit: limits.bonus,
      requested,
      remaining: Math.max(0, limits.total - state.used),
      resetAt: null,
      shared: true,
    };
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

      const ctx = await freeGenContext(handle);
      if (!ctx.sub.active && ctx.state.remaining < 1) {
        try {
          logActivity(handle, "limit_hit", {
            kind,
            used: ctx.state.used,
            limit: ctx.limits.total,
            source: "site_generate",
          });
        } catch (_e) {}
        return res.status(429).json(limitReachedBody(ctx.state, ctx.limits, 1));
      }

      let reply;
      try {
        reply = generateUnique(handle, kind, mode, lang, style, antiN);
      } catch (e) {
        logGenerateRouteError("engine", e, { kind });
        return sendError(res, 500, ERROR_CODES.SERVER_ERROR);
      }

      if (!String(reply || "").trim()) {
        return res.status(502).json({ ok: false, error: "empty_reply" });
      }

      let consume = { ok: true, used: ctx.state.used, limit: ctx.limits.total, remaining: ctx.state.remaining };
      if (!ctx.sub.active) {
        consume = consumeFreeGenAtomic(safeDb, db, handle, 1, ctx.limits.total, kind);
        if (!consume.ok) {
          return res.status(429).json(limitReachedBody(getFreeGenState(safeDb, db, handle, ctx.limits.total), ctx.limits, 1));
        }
      }

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
          used: consume.used,
          limit: ctx.sub.active ? null : ctx.limits.total,
          baseLimit: ctx.limits.base,
          bonusLimit: ctx.limits.bonus,
          remaining: ctx.sub.active ? null : Math.max(0, ctx.limits.total - consume.used),
          resetAt: null,
          shared: true,
        },
      });
    } catch (e) {
      logGenerateRouteError("route", e, { kind: req.query?.kind, count: 1 });
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

      const ctx = await freeGenContext(handle);
      if (!ctx.sub.active && ctx.state.remaining < count) {
        try {
          logActivity(handle, "limit_hit", {
            kind,
            used: ctx.state.used,
            limit: ctx.limits.total,
            requested: count,
            source: "site_generate_bulk",
          });
        } catch (_e) {}
        return res.status(429).json(limitReachedBody(ctx.state, ctx.limits, count));
      }

      let list;
      try {
        list = generateRankedCandidates(handle, kind, mode, lang, style, count, antiN, false);
      } catch (e) {
        logGenerateRouteError("engine_bulk", e, { kind, count });
        return sendError(res, 500, ERROR_CODES.SERVER_ERROR);
      }

      const lines = Array.isArray(list) ? list.filter((x) => String(x || "").trim()) : [];
      if (!lines.length) {
        return res.status(502).json({ ok: false, error: "empty_reply", count: 0, list: [] });
      }

      const chargeCount = lines.length;
      let consume = { ok: true, used: ctx.state.used, limit: ctx.limits.total, remaining: ctx.state.remaining };
      if (!ctx.sub.active) {
        consume = consumeFreeGenAtomic(safeDb, db, handle, chargeCount, ctx.limits.total, kind);
        if (!consume.ok) {
          return res.status(429).json(
            limitReachedBody(getFreeGenState(safeDb, db, handle, ctx.limits.total), ctx.limits, chargeCount)
          );
        }
      }

      for (const r of lines) saveRecent(handle, kind, r, mode, style);
      try {
        logActivity(handle, "gen_bulk", { kind, mode, lang, style, count: lines.length, source: "site" });
      } catch (_e) {}

      res.json({
        ok: true,
        handle,
        kind,
        mode,
        lang,
        count: lines.length,
        list: lines,
        usage: {
          used: consume.used,
          limit: ctx.sub.active ? null : ctx.limits.total,
          baseLimit: ctx.limits.base,
          bonusLimit: ctx.limits.bonus,
          remaining: ctx.sub.active ? null : Math.max(0, ctx.limits.total - consume.used),
          resetAt: null,
          shared: true,
        },
      });
    } catch (e) {
      logGenerateRouteError("route_bulk", e, { kind: req.query?.kind, count: req.query?.count });
      sendError(res, 500, ERROR_CODES.SERVER_ERROR);
    }
  });
}
