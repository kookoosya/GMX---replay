// --- Safety: never crash silently ---
process.on("unhandledRejection", (err) => {
  beginShutdown("unhandledRejection", err);
});
process.on("uncaughtException", (err) => {
  beginShutdown("uncaughtException", err);
});
process.on("SIGTERM", () => {
  writeLog("WARN", "SIGTERM_RECEIVED");
  beginShutdown("sigterm", null, { level: "WARN", exitCode: 0 });
});
process.on("SIGINT", () => {
  writeLog("WARN", "SIGINT_RECEIVED");
  beginShutdown("sigint", null, { level: "WARN", exitCode: 0 });
});

const ALLOWED_ORIGINS = String(process.env.ALLOWED_ORIGINS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

// Always allow X/Twitter origins and localhost for dev.
const ALWAYS_ALLOW_ORIGINS = new Set([
  "https://x.com",
  "https://twitter.com",
  "https://mobile.twitter.com",
  "http://localhost:3000",
  "http://localhost:5173",
  "http://localhost:8080",
  "http://localhost:10000",
  "http://127.0.0.1:10000",
]);

const EXTENSION_IDS = String(process.env.EXTENSION_IDS || process.env.EXTENSION_ID || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

// By default we allow chrome-extension:// origins in production.
// Set EXTENSION_ALLOW_ALL=0 and EXTENSION_IDS=<id1,id2> to lock it down.
const EXTENSION_ALLOW_ALL = String(process.env.EXTENSION_ALLOW_ALL || "1").trim() !== "0";

function isAllowedExtensionOrigin(origin) {
  if (!origin) return false;
  try {
    const u = new URL(origin);
    const id = String(u.hostname || "").trim();
    if (!id) return false;
    // Allow all extension origins by default (safer UX for local/manual installs).
    // If EXTENSION_ALLOW_ALL=0, only allow IDs listed in EXTENSION_IDS.
    if (!EXTENSION_IDS.length) return EXTENSION_ALLOW_ALL;
    return EXTENSION_IDS.includes(id);
  } catch {
    return false;
  }
}


function isAllowedOrigin(origin) {
  if (!origin) return true; // non-browser or same-origin
  if (ALWAYS_ALLOW_ORIGINS.has(origin)) return true;
  if (origin.startsWith("chrome-extension://") || origin.startsWith("moz-extension://")) return isAllowedExtensionOrigin(origin);
  if (origin.startsWith("http://localhost:")) return true;
  if (origin.startsWith("http://127.0.0.1:")) return true;
  if (origin.startsWith("https://localhost:")) return true;
  if (origin.startsWith("https://127.0.0.1:")) return true;
  return ALLOWED_ORIGINS.includes(origin);
}

app.use(
  cors({
    origin: (origin, cb) => {
      try {
        return cb(null, isAllowedOrigin(origin));
      } catch {
        return cb(null, false);
      }
    },
    credentials: false,
    methods: ["GET","POST","PUT","DELETE","OPTIONS"],
    allowedHeaders: ["Content-Type","Authorization","X-Admin-Key","X-Admin-Token","X-GMX-Client","X-GMX-Ext-Version"],
  })
);
app.use(express.json({ limit: "256kb" }));

app.use((req, res, next) => {
  const incoming = String(req.headers["x-request-id"] || "").trim();
  const requestId = incoming || crypto.randomBytes(8).toString("hex");
  req.requestId = requestId;
  req.startedAtMs = Date.now();
  res.setHeader("X-Request-Id", requestId);
  res.on("finish", () => {
    if (res.statusCode >= 500) {
      writeLog("ERROR", "HTTP_5XX", {
        requestId,
        method: req.method,
        path: req.originalUrl,
        statusCode: res.statusCode,
        durationMs: Date.now() - req.startedAtMs,
      });
    }
  });
  next();
});

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    crossOriginEmbedderPolicy: false,
    crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
    // Strict CSP: no inline scripts (we moved site JS out of HTML).
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        defaultSrc: ["'self'"],
        baseUri: ["'self'"],
        objectSrc: ["'none'"],
        // Allow local React bridge (Vite) to embed /app during development.
        // Production stays locked.
        frameAncestors: DEV_MODE
          ? ["'self'", "http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000"]
          : ["'none'"],
        scriptSrc: ["'self'", "https://cdn.jsdelivr.net"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: [
          "'self'",
          "https://api.mainnet-beta.solana.com",
          "https://ipfs.io",
          "https://cdn.jsdelivr.net",
        ],
        fontSrc: ["'self'", "data:"],
        upgradeInsecureRequests: [],
      },
    },
  })
);


app.use(
  "/api",
  rateLimit({
    windowMs: 60_000,
    max: 240,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

// Route-level burst controls (per handle) for generation endpoints.
const genBurstLimiter = rateLimit({
  windowMs: 60_000,
  max: CONFIG.GEN_PER_MINUTE,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req)=> String(req.user?.handle || clientIp(req)),
});

const bulkBurstLimiter = rateLimit({
  windowMs: 60_000,
  max: CONFIG.BULK_CALLS_PER_MINUTE,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req)=> String(req.user?.handle || clientIp(req)),
});


// Extra-hard limits for init/consume (account safety + anti-abuse)
const initLimiter = rateLimit({
  windowMs: 60_000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => String(clientIp(req)),
});

const consumeLimiter = rateLimit({
  windowMs: 60_000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => String(req.user?.handle || clientIp(req)),
});

