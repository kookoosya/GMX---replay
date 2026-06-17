#!/usr/bin/env node
/**
 * Ensures public/ and frontend/public/ stay byte-identical for synced app shell files.
 * Run after sync-app-and-assets.mjs (npm run dev / npm run build already run sync first).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import crypto from "node:crypto";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const PUBLIC = path.join(ROOT, "public");
const FRONTEND_PUBLIC = path.join(ROOT, "frontend", "public");

const APP_FILES = [
  "app.html",
  "app.js",
  "app.css",
  "app.auth.js",
  "app.storage.js",
  "app.format.js",
  "app.i18nui.js",
  "app.sitei18nui.js",
  "app.sitei18ndynamic.js",
  "app.chrome.js",
  "app.sitemode.js",
  "app.modals.js",
  "app.shellerrors.js",
  "app.recover.js",
  "app.langui.js",
  "app.sitelangmenu.js",
  "app.i18nbridge.js",
  "app.tabstate.js",
  "app.unlock.js",
  "app.wallpapers.js",
  "app.wallpaperhelpers.js",
  "app.wallpaperstore.js",
  "app.customwallpapers.js",
  "app.themes.js",
  "app.themeapply.js",
  "app.ui.js",
  "app.uiwire.js",
  "app.generate.js",
  "app.banks.js",
  "app.bankswire.js",
  "app.bankui.js",
  "app.bankuiwire.js",
  "app.antirepeat.js",
  "app.genparams.js",
  "app.cleanfill.js",
  "app.cleanfillrun.js",
  "app.cleanfillrunwire.js",
  "app.styles.js",
  "app.themescatalogwire.js",
  "app.procontrols.js",
  "app.toggles.js",
  "app.custombg.js",
  "app.tabtheme.js",
  "app.logs.js",
  "app.shelldeps.js",
  "app.shelldepswire.js",
  "app.paywall.js",
  "app.help.js",
  "app.usage.js",
  "app.wallpaperapply.js",
  "app.wallpaperupload.js",
  "app.health.js",
  "app.setbg.js",
  "app.themesui.js",
  "app.extview.js",
  "app.extwallpaperstore.js",
  "app.extapply.js",
  "app.extthemesui.js",
  "app.extcustombgui.js",
  "app.nav.js",
  "app.tabwire.js",
  "app.gmgnwire.js",
  "app.sitesync.js",
  "app.extwallpaperui.js",
  "app.wallpaperswire.js",
  "app.themeswire.js",
  "app.accountui.js",
  "app.admin.js",
  "app.adminwire.js",
  "app.leaderboard.js",
  "app.leaderboardwire.js",
  "app.referrals.js",
  "app.referralswire.js",
  "app.redeem.js",
  "app.redeemwire.js",
  "app.prediction.js",
  "app.predictionwire.js",
  "app.connect.js",
  "app.connectwire.js",
  "app.shellwire.js",
  "app.chromewire.js",
  "app.authwire.js",
  "app.siteboot.js",
  "app.siteinit.js",
  "app.siteinitwire.js",
  "app.wallethelpers.js",
  "app.walletpay.js",
  "app.walletui.js",
  "app.walletwire.js",
  "app.bestpick.js",
  "app.refstats.js",
  "app.generateflow.js",
  "app.generatewire.js",
  "arcade.html",
  "arcade.js",
  "entitlements.js",
  "mode.js",
  "themes.json",
];

function sha256(buf) {
  return crypto.createHash("sha256").update(buf).digest("hex");
}

let failed = false;
for (const f of APP_FILES) {
  const a = path.join(PUBLIC, f);
  const b = path.join(FRONTEND_PUBLIC, f);
  if (!fs.existsSync(a)) {
    console.error(`[parity] missing: ${f} in public/`);
    failed = true;
    continue;
  }
  if (!fs.existsSync(b)) {
    console.error(`[parity] missing: ${f} in frontend/public/ — run: node tools/sync-app-and-assets.mjs`);
    failed = true;
    continue;
  }
  const ba = fs.readFileSync(a);
  const bb = fs.readFileSync(b);
  if (!ba.equals(bb)) {
    console.error(
      `[parity] mismatch: ${f}\n  public:          ${sha256(ba).slice(0, 16)}…\n  frontend/public: ${sha256(bb).slice(0, 16)}…\n  Fix: node tools/sync-app-and-assets.mjs`
    );
    failed = true;
  }
}

if (failed) {
  process.exit(1);
}
console.log(`[parity] OK — ${APP_FILES.length} app shell files match public/ ↔ frontend/public/`);
