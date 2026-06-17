#!/usr/bin/env node
/** Copy canonical public/app.js to frontend mirror (vite dev optional static). */
import fs from "fs";
import path from "path";

const root = process.cwd();
const src = path.join(root, "public/app.js");
const targets = [path.join(root, "frontend/public/app.js")];

const body = fs.readFileSync(src, "utf8");
for (const dest of targets) {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  const prev = fs.existsSync(dest) ? fs.readFileSync(dest, "utf8") : "";
  if (prev !== body) {
    fs.writeFileSync(dest, body);
    console.log(`synced → ${path.relative(root, dest)}`);
  }
}


const shellModules = [
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
  "app.wallpaperui.js",
  "app.wallpaperupload.js",
  "app.health.js",
  "app.setbg.js",
  "app.themesui.js",
  "app.extview.js",
  "app.extwallpaperstore.js",
  "app.bootstrapunlockwire.js",
  "app.bootstrapgenwire.js",
  "app.bootstrapusagewire.js",
  "app.bootstrapuiwire.js",
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
  "app.authwire.js",
  "app.shellwire.js",
  "app.chromewire.js",
  "app.connect.js",
  "app.connectwire.js",
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
];
for (const name of shellModules) {
  const modSrc = path.join(root, "public", name);
  if (!fs.existsSync(modSrc)) continue;
  const modBody = fs.readFileSync(modSrc, "utf8");
  for (const destRoot of ["frontend/public", "public/bridge"]) {
    const dest = path.join(root, destRoot, name);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    const prev = fs.existsSync(dest) ? fs.readFileSync(dest, "utf8") : "";
    if (prev !== modBody) {
      fs.writeFileSync(dest, modBody);
      console.log(`synced → ${path.relative(root, dest)}`);
    }
  }
}

// bridge loads /app.js from site root — no bridge/app.js copy needed
const bridgeCopy = path.join(root, "public/bridge/app.js");
if (fs.existsSync(bridgeCopy)) {
  fs.unlinkSync(bridgeCopy);
  console.log("removed obsolete public/bridge/app.js");
}
