// ---------- STATIC SITE ----------
const PUBLIC_DIR = path.join(__dirname, "public");
const APP_HTML = path.join(PUBLIC_DIR, "app.html");
const BRIDGE_DIR = path.join(PUBLIC_DIR, "bridge");
const BRIDGE_INDEX = path.join(BRIDGE_DIR, "index.html");

function noStore(res) {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
}

function sendBridgeIndex(res) {
  try {
    noStore(res);
    if (fs.existsSync(BRIDGE_INDEX)) return res.sendFile(BRIDGE_INDEX);
    res.status(404).send("bridge build not found");
  } catch {
    res.status(500).send("error");
  }
}

app.get("/bridge", (req, res) => {
  sendBridgeIndex(res);
});

app.get("/arcade", (req, res) => {
  noStore(res);
  return res.redirect(302, "/arcade.html");
});

app.use(
  express.static(PUBLIC_DIR, {
    maxAge: "1h",
    redirect: false,
    setHeaders: (res, filePath) => {
      if (
        filePath.endsWith(".html") ||
        filePath.endsWith(".css") ||
        filePath.endsWith(".js") ||
        filePath.endsWith(".json")
      ) {
        noStore(res);
      }
    },
  })
);

app.get("/", (req, res) => {
  noStore(res);
  res.redirect("/app");
});

// Common local dev footgun:
// users sometimes paste URLs like "http://localhost:5173/app…" (unicode ellipsis/quotes)
// which becomes a path like "/app%E2%80%A6". That does not match "/app" or "/app/*".
// If the request starts with "/app" but is NOT "/app" and NOT "/app/…",
// redirect to the canonical legacy entry.
app.use((req, res, next) => {
  try {
    const p = String(req.path || "");
    if (p.startsWith("/app") && p !== "/app" && !p.startsWith("/app/")) {
      return res.redirect(302, "/app");
    }
  } catch {}
  return next();
});

app.get("/app", (req, res) => {
  try {
    noStore(res);
    if (fs.existsSync(APP_HTML)) return res.sendFile(APP_HTML);
    res.status(404).send("app.html not found");
  } catch {
    res.status(500).send("error");
  }
});

app.get("/bridge/*", (req, res) => {
  sendBridgeIndex(res);
});

app.get("/arcade/*", (req, res) => {
  noStore(res);
  return res.redirect(302, "/arcade.html");
});

app.get("/app/*", (req, res) => {
  try {
    noStore(res);
    if (fs.existsSync(APP_HTML)) return res.sendFile(APP_HTML);
    res.status(404).send("app.html not found");
  } catch {
    res.status(500).send("error");
  }
});

app.get("/get-extension", (req, res) => {
  noStore(res);
  if (EXTENSION_STORE_URL) return res.redirect(EXTENSION_STORE_URL);

  res.status(200).send(`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>GMXReply Extension</title></head><body style="font-family:system-ui;margin:24px">
  <h2>GMXReply Chrome Extension</h2>
  <p>The extension is included in the repo under <b>/extension</b>.</p>
  <p><b>Local install:</b> open <b>chrome://extensions</b> → enable Developer mode → <b>Load unpacked</b> → select the <b>extension</b> folder.</p>
  <p>Once published, this page will redirect to the Chrome Web Store automatically.</p>
  <p>Go back to <a href="/app">/app</a>.</p>
</body></html>`);
});

import { registerBillingRoutes } from "./server/routes/billing.mjs";

registerBillingRoutes({
  app,
  requireAuth,
  sendError,
  ERROR_CODES,
  BILLING_PLANS,
  BILLING_TOKENS,
  SOL_RECEIVER,
  isSolanaPubkey,
  getSolUsd,
  quoteSolLamportsFromUsd,
  safeDb,
  db,
  nowIso,
  randHex,
  userByHandle,
  subscriptionInfo,
  logActivity,
  grantReferralReward,
  referralCountActive,
  referralRewardTotal,
  computeReferralUnlocks,
  PUBLIC_DIR,
  ASSETS_DIR,
  path,
  fs,
  crypto,
  fetch,
});

