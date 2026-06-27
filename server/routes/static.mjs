/** Static HTML shell, bridge SPA, arcade redirects, extension page. */
import path from "node:path";
import { renderArcadeSlugHtml } from "../lib/arcade-slug-page.mjs";

export function registerStaticRoutes(deps) {
  const { app, express, fs, PUBLIC_DIR, EXTENSION_STORE_URL } = deps;

  const APP_HTML = path.join(PUBLIC_DIR, "app.html");
  const INDEX_HTML = path.join(PUBLIC_DIR, "index.html");
  const BRIDGE_INDEX = path.join(PUBLIC_DIR, "bridge", "index.html");

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

  app.get("/arcade/:slug", (req, res, next) => {
    try {
      const slug = String(req.params.slug || "").trim().toLowerCase();
      if (!slug || slug.includes(".") || slug === "html") return next();
      const proto = String(req.headers["x-forwarded-proto"] || req.protocol || "https").split(",")[0].trim();
      const host = String(req.headers["x-forwarded-host"] || req.get("host") || "www.gmxreply.com").split(",")[0].trim();
      const origin = `${proto}://${host}`;
      const html = renderArcadeSlugHtml(slug, { origin });
      noStore(res);
      if (html) {
        res.type("html").send(html);
        return;
      }
      return res.redirect(302, "/arcade.html");
    } catch {
      return next();
    }
  });

  app.get("/blog", (req, res) => {
    noStore(res);
    return res.redirect(301, "/app");
  });

  app.get("/blog/:slug", (req, res) => {
    noStore(res);
    return res.redirect(301, "/app");
  });

  app.get("/blog.html", (req, res) => {
    noStore(res);
    return res.redirect(301, "/app");
  });

  app.get("/", (req, res) => {
    try {
      noStore(res);
      if (fs.existsSync(INDEX_HTML)) return res.sendFile(INDEX_HTML);
      return res.redirect(302, "/app");
    } catch {
      res.status(500).send("error");
    }
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
        if (filePath.endsWith(".webmanifest")) {
          res.setHeader("Content-Type", "application/manifest+json");
        }
      },
    })
  );

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
}
