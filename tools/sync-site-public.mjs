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
  "app.chrome.js",
  "app.unlock.js",
  "app.wallpapers.js",
  "app.wallpaperstore.js",
  "app.themes.js",
  "app.themeapply.js",
  "app.ui.js",
  "app.generate.js",
  "app.banks.js",
  "app.antirepeat.js",
  "app.genparams.js",
  "app.cleanfill.js",
  "app.styles.js",
  "app.toggles.js",
  "app.custombg.js",
  "app.tabtheme.js",
  "app.logs.js",
  "app.paywall.js",
  "app.help.js",
  "app.usage.js",
  "app.wallpaperapply.js",
  "app.health.js",
  "app.setbg.js",
  "app.themesui.js",
  "app.extview.js",
  "app.extwallpaperstore.js",
  "app.extapply.js",
  "app.extthemesui.js",
  "app.extcustombgui.js",
  "app.nav.js",
  "app.extwallpaperui.js",
  "app.accountui.js",
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
