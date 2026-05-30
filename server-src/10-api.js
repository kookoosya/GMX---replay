// ---------- API ----------
app.get("/api/health", async (req, res) => {
  const force = String(req.query.force || "").trim() === "1";
  const payload = await getHealthSnapshot(force);
  res.status(payload.ok ? 200 : 503).json(payload);
});

app.get("/api/version", (req, res) => {
  res.json({
    ok: true,
    build: BUILD_ID,
    startedAt: STARTED_AT,
    ...(DEV_RUN_TOKEN ? { devRunToken: DEV_RUN_TOKEN } : {}),
  });
});

app.get("/api/config", (req, res) => {
  // Single source of truth for plans/limits/flags. UI should not hardcode numbers.
  res.json({
    ok: true,
    build: BUILD_ID,
    startedAt: STARTED_AT,
    serverTime: nowIso(),
    limits: {
      freeDaily: CONFIG.FREE_DAILY_BASE,
      saveCapFree: CONFIG.SAVE_CAP_FREE,
    },
    plans: PLANS,
    billing: {
      receiver: SOL_RECEIVER,
      tokens: BILLING_TOKENS.map((t) => ({ key: t.key, label: t.label, kind: t.kind, decimals: t.decimals })),
      plans: BILLING_PLANS,
    },
    extension: {
      storeUrl: EXTENSION_STORE_URL,
    },
  });
});

app.get("/status", (req, res) => {
  // Lightweight status/health endpoint (HTML or JSON)
  const payload = {
    ok: true,
    build: BUILD_ID,
    startedAt: STARTED_AT,
    serverTime: nowIso(),
    uptimeSec: Math.round(process.uptime()),
    db: "ok",
  };
  const accept = String(req.headers.accept || "");
  if (accept.includes("text/html")) {
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    return res.end(`<!doctype html><html><head><meta charset='utf-8'><meta name='viewport' content='width=device-width,initial-scale=1'><title>Status</title><style>body{font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Arial;margin:24px}code{background:#f3f3f3;padding:2px 6px;border-radius:6px}</style></head><body><h1>GMXReply status</h1><p><strong>OK</strong></p><p>Build: <code>${payload.build}</code></p><p>Started: <code>${payload.startedAt}</code></p><p>Server time: <code>${payload.serverTime}</code></p><p>Uptime: <code>${payload.uptimeSec}s</code></p></body></html>`);
  }
  res.json(payload);
});

