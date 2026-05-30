#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const namesPath = path.join(root, "docs/generated/wallpaper_names.json");
const names = fs.existsSync(namesPath)
  ? JSON.parse(fs.readFileSync(namesPath, "utf8"))
  : { site: [], ext: [] };

const SITE_NAMES_JS = JSON.stringify(names.site || [], null, 2).replace(/^/gm, "  ");
const EXT_NAMES_JS = JSON.stringify(names.ext || [], null, 2).replace(/^/gm, "  ");

function patchApp(s) {
  if (s.includes("WALLPAPER_WEBP_WIRED")) return s;

  s = s.replace('const ASSET_REV = "20260310a";', 'const ASSET_REV = "20260530a";');

  s = s.replace("const SITE_WALLPAPER_PACK_COUNT = 8;", "const SITE_WALLPAPER_PACK_COUNT = 58;");
  s = s.replace("const EXT_WALLPAPER_PACK_COUNT = 50;", "const EXT_WALLPAPER_PACK_COUNT = 58;");

  if (!s.includes("const SITE_PACK_NAMES")) {
    s = s.replace(
      "const SITE_WALLPAPER_FREE = [",
      `const WALLPAPER_WEBP_WIRED = true;\n  const SITE_PACK_NAMES = ${SITE_NAMES_JS};\n  const EXT_PACK_NAMES = ${EXT_NAMES_JS};\n  const SITE_WALLPAPER_FREE = [`
    );
  }

  s = s.replace(
    /const CRYPTO_SITE_WALL_SOURCES = \[[\s\S]*?\];\n/,
    ""
  );
  s = s.replace(
    /const CRYPTO_EXT_WALL_SOURCES = \[[\s\S]*?\];\n/,
    ""
  );

  s = s.replace(
    `        name: \`Aurora #\${n}\`,`,
    `        name: SITE_PACK_NAMES[i - 1] || \`Aurora #\${n}\`,`
  );
  s = s.replace(
    `        name: \`Aurora \${i}\`,`,
    `        name: EXT_PACK_NAMES[i - 1] || \`Backdrop \${i}\`,`
  );

  s = s.replace(
    `  function wallpaperAssetPath(id){
    if (!id) return "";
    if (typeof id === "string" && id.startsWith("v2_")) {
      const lux = SITE_WALLPAPER_LUX.map(([v])=>String(v || "")).filter(Boolean);
      const num = Math.max(1, Number(String(id).slice(3)) || 1);
      const mapped = lux.length ? lux[(num - 1) % lux.length] : id;
      if (mapped.startsWith("lux_")) return mapped + ".svg";
      return id + ".webp";
    }
    return String(id) + ".svg";
  }`,
    `  function wallpaperAssetPath(id){
    if (!id) return "";
    if (typeof id === "string" && id.startsWith("v2_")) return id + ".webp";
    return String(id) + ".svg";
  }`
  );

  s = s.replace(
    `    if (norm.startsWith("v2_")) return sitePackWallpaperDataUri(norm, false);
    const p = wallpaperAssetPath(norm);
    return p ? \`/assets/wallpapers/\${p}?v=\${ASSET_REV}\` : "";`,
    `    if (norm.startsWith("v2_")) return \`/assets/wallpapers/\${norm}.webp?v=\${ASSET_REV}\`;
    const p = wallpaperAssetPath(norm);
    return p ? \`/assets/wallpapers/\${p}?v=\${ASSET_REV}\` : "";`
  );

  s = s.replace(
    `    if (norm.startsWith("v2_")) return sitePackWallpaperDataUri(norm, true);
    return \`/assets/wallpapers/\${norm}.svg?v=\${ASSET_REV}\`;`,
    `    if (norm.startsWith("v2_")) return \`/assets/wallpapers/thumbs/\${norm}.webp?v=\${ASSET_REV}\`;
    return \`/assets/wallpapers/\${norm}.svg?v=\${ASSET_REV}\`;`
  );

  s = s.replace(
    `  function extWallpaperAssetPath(id){
    const norm = normalizeExtWallpaperIdLocal(id);
    if (!norm) return "";
    if (norm.startsWith("extv3_")) {
      const lux = EXT_WALLPAPER_LUX.map(([v])=>String(v || "")).filter(Boolean);
      const num = Math.max(1, Number(norm.slice(6)) || 1);
      const mapped = lux.length ? lux[(num - 1) % lux.length] : norm;
      if (mapped.startsWith("lux_ext_")) return mapped + ".svg";
      return norm + ".webp";
    }
    return norm + ".svg";
  }`,
    `  function extWallpaperAssetPath(id){
    const norm = normalizeExtWallpaperIdLocal(id);
    if (!norm) return "";
    if (norm.startsWith("extv3_")) return norm + ".webp";
    return norm + ".svg";
  }`
  );

  s = s.replace(
    `    if (norm.startsWith("extv3_")) return extPackWallpaperDataUri(norm, false);
    const p = extWallpaperAssetPath(norm);
    return p ? \`/assets/extbg/\${p}?v=\${ASSET_REV}\` : "";`,
    `    if (norm.startsWith("extv3_")) return \`/assets/extbg/\${norm}.webp?v=\${ASSET_REV}\`;
    const p = extWallpaperAssetPath(norm);
    return p ? \`/assets/extbg/\${p}?v=\${ASSET_REV}\` : "";`
  );

  s = s.replace(
    `    if (norm.startsWith("extv3_")) return extPackWallpaperDataUri(norm, true);
    return \`/assets/extbg/\${norm}.svg?v=\${ASSET_REV}\`;`,
    `    if (norm.startsWith("extv3_")) return \`/assets/extbg/thumbs/\${norm}.webp?v=\${ASSET_REV}\`;
    return \`/assets/extbg/\${norm}.svg?v=\${ASSET_REV}\`;`
  );

  s = s.replace(
    'const WALLPAPER_REFRESH_MIGRATION_KEY = "gmx_wallpaper_refresh_20260318";',
    'const WALLPAPER_REFRESH_MIGRATION_KEY = "gmx_wallpaper_refresh_20260530";'
  );
  s = s.replace(
    'const done = "gmx_ext_wallpaper_refresh_20260318";',
    'const done = "gmx_ext_wallpaper_refresh_20260530";'
  );

  return s;
}

function patchExtensionPopup(s) {
  if (s.includes("20260530a")) return s;
  s = s.replace('const ASSET_REV = "20260310a";', 'const ASSET_REV = "20260530a";');
  const extNames = names.ext || [];
  const nameList = extNames
    .map((n, i) => `'${String(n).replace(/'/g, "\\'")}'`)
  if (nameList.length >= 57) {
    const block = `    out.push({ id: \`extv3_\${n}\`, name: ['${extNames.slice(0, 57).join("', '").replace(/'/g, "\\'")}'][i-1] || \`Backdrop \${n}\` });`;
    s = s.replace(
      /out\.push\(\{ id: `extv3_\$\{n\}`, name: \[.*?\]\[i-1\] \|\| `Backdrop \$\{n\}` \}\);/s,
      block
    );
  }
  return s;
}

for (const rel of ["public/app.js", "frontend/public/app.js"]) {
  const p = path.join(root, rel);
  const out = patchApp(fs.readFileSync(p, "utf8"));
  fs.writeFileSync(p, out);
  console.log("patched", rel);
}

const extPath = path.join(root, "extension/popup.js");
fs.writeFileSync(extPath, patchExtensionPopup(fs.readFileSync(extPath, "utf8")));
console.log("patched extension/popup.js");
