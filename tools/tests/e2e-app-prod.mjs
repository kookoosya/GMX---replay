#!/usr/bin/env node
/** Production E2E smoke — explicit prod URL. */
process.env.E2E_BASE = process.env.E2E_BASE || "https://www.gmxreply.com";
await import("./e2e-app.mjs");
