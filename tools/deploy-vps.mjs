#!/usr/bin/env node
/**
 * Production deploy is Render-only. VPS SSH deploy moved to tools/legacy/.
 */
const action = process.argv[2] || "deploy";

console.error(`[deploy] OBSOLETE: npm run deploy:${action === "deploy" ? "vps" : action} is disabled.`);
console.error("Production: https://www.gmxreply.com (Render auto-deploy on push to main).");
console.error("");
console.error("Workflow:");
console.error("  git push origin main");
console.error("  npm run verify:prod");
console.error("");
console.error("Legacy VPS (migration only): see tools/legacy/README.md");
console.error("  npm run deploy:legacy:vps");
process.exit(1);
