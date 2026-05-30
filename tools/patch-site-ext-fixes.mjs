#!/usr/bin/env node
import fs from "fs";
import path from "path";

const root = process.cwd();
const appPath = path.join(root, "public/app.js");
let app = fs.readFileSync(appPath, "utf8");

if (!app.includes("SITE_WALLPAPER_PACK_COUNT = 58")) {
  throw new Error("public/app.js missing expected wallpaper pack count");
}

app = app.replace(
  /Math\.max\(1, Math\.min\(50, Number\(m\[1\]\)/g,
  "Math.max(1, Math.min(58, Number(m[1])"
);
app = app.replace(
  /const num = Math\.max\(1, Math\.min\(50, Number\(m\[1\]\)/g,
  "const num = Math.max(1, Math.min(58, Number(m[1])"
);

if (app.includes("CRYPTO_EXT_WALL_SOURCES = [")) {
  app = app.replace(
    /const CRYPTO_EXT_WALL_SOURCES = \[[\s\S]*?\];/,
    "const CRYPTO_EXT_WALL_SOURCES = [];"
  );
}

if (!app.includes("function extLsSet(")) {
  const insertAfter = 'const LS_EXT_WP = "gmx_ext_wp"; // selected extension wallpaper id\n';
  const helper = `const LS_EXT_WP = "gmx_ext_wp"; // selected extension wallpaper id
const EXT_LS_V2 = {
  "gmx_ext_theme": "gmx_ext_theme_v2",
  "gmx_ext_wp": "gmx_ext_wp_v2",
  "gmx_ext_view": "gmx_ext_view_v2",
  "gmx_ext_custom_bg_global": "gmx_ext_custom_bg_global_v2",
  "gmx_ext_wp_view_popup": "gmx_ext_wp_v2_popup",
  "gmx_ext_wp_view_quick": "gmx_ext_wp_v2_quick",
};
function extLsSet(key, value){
  try{
    const v2 = EXT_LS_V2[key];
    if (value === undefined || value === null || value === ""){
      localStorage.removeItem(key);
      if (v2) localStorage.removeItem(v2);
      return;
    }
    const s = String(value);
    localStorage.setItem(key, s);
    if (v2) localStorage.setItem(v2, s);
  }catch(_e){}
}

`;
  if (!app.includes(insertAfter.trim())) throw new Error("LS_EXT_WP anchor missing");
  app = app.replace(insertAfter, helper);
}

app = app.replace(
  /function setExtWallpaperForView\(view, id\)\{\s*try\{\s*const safeView = normalizeExtWallpaperView\(view\);\s*const key = extWallpaperKeyForView\(safeView\);\s*const safeId = normalizeExtWallpaperIdLocal\(id\);\s*if \(safeId\) localStorage\.setItem\(key, safeId\);\s*else localStorage\.removeItem\(key\);\s*\}catch\(_e\)\{\}\s*\}/,
  `function setExtWallpaperForView(view, id){
  try{
    const safeView = normalizeExtWallpaperView(view);
    const key = extWallpaperKeyForView(safeView);
    const safeId = normalizeExtWallpaperIdLocal(id);
    extLsSet(key, safeId || "");
  }catch(_e){}
}`
);

app = app.replace(
  'localStorage.setItem(LS_EXT_VIEW, safeView);',
  'extLsSet(LS_EXT_VIEW, safeView);'
);
app = app.replace(
  'localStorage.setItem("gmx_ext_theme", id);',
  'extLsSet("gmx_ext_theme", id);'
);

if (!app.includes('extLsSet(LS_EXT_CUSTOM_BG_GLOBAL')) {
  app = app.replace(
    /localStorage\.setItem\(LS_EXT_CUSTOM_BG_GLOBAL, data\);/g,
    "extLsSet(LS_EXT_CUSTOM_BG_GLOBAL, data);"
  );
}

fs.writeFileSync(appPath, app);
console.log("patched public/app.js");
