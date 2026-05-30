#!/usr/bin/env node
/** One-shot core fixes: generation, wallpapers, parity helpers. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const APP = path.join(ROOT, 'public', 'app.js');

let t = fs.readFileSync(APP, 'utf8');

if (!t.includes('function syncModePanelCopy')) {
  const anchor = 'function getGuideUiCopy(_lang){';
  const fn = `function syncModePanelCopy(){
  const modes = ["min", "mid", "max"];
  const fillSelect = (selectId, kind)=>{
    const sel = $(selectId);
    if (!sel) return;
    const cur = String(sel.value || "mid");
    sel.innerHTML = "";
    for (const v of modes){
      const o = document.createElement("option");
      o.value = v;
      o.textContent = t(\`\${kind}_mode_\${v}\`) || v;
      const hint = t(\`\${kind}_mode_\${v}_hint\`);
      if (hint) o.title = hint;
      sel.appendChild(o);
    }
    if (modes.includes(cur)) sel.value = cur;
    else sel.value = "mid";
  };
  if ($("gm_size")) $("gm_size").textContent = t("gm_size_label") || "Size";
  if ($("gn_size")) $("gn_size").textContent = t("gn_size_label") || "Size";
  fillSelect("gmMode", "gm");
  fillSelect("gnMode", "gn");
}

`;
  if (!t.includes(anchor)) throw new Error('anchor for syncModePanelCopy not found');
  t = t.replace(anchor, fn + anchor);
}

const reps = [
  ['const ASSET_REV = "20260310a";', 'const ASSET_REV = "20260530b";'],
  ['const SITE_WALLPAPER_PACK_COUNT = 8;', 'const SITE_WALLPAPER_PACK_COUNT = 58;'],
  ['const SITE_WALLPAPER_FREE_PACK_COUNT = 6;', 'const SITE_WALLPAPER_FREE_PACK_COUNT = 10;'],
  ['if (norm.startsWith("v2_")) return sitePackWallpaperDataUri(norm, false);',
   'if (norm.startsWith("v2_")) return `/assets/wallpapers/${norm}.webp?v=${ASSET_REV}`;'],
  ['if (norm.startsWith("v2_")) return sitePackWallpaperDataUri(norm, true);',
   'if (norm.startsWith("v2_")) return `/assets/wallpapers/thumbs/${norm}.webp?v=${ASSET_REV}`;'],
  ['if (norm.startsWith("extv3_")) return extPackWallpaperDataUri(norm, false);',
   'if (norm.startsWith("extv3_")) return `/assets/extbg/${norm}.webp?v=${ASSET_REV}`;'],
  ['if (norm.startsWith("extv3_")) return extPackWallpaperDataUri(norm, true);',
   'if (norm.startsWith("extv3_")) return `/assets/extbg/thumbs/${norm}.webp?v=${ASSET_REV}`;'],
];

for (const [a, b] of reps) {
  if (t.includes(a)) t = t.replaceAll(a, b);
}

t = t.replace(
  /const CRYPTO_SITE_WALL_SOURCES = \[[\s\S]*?\];/,
  'const CRYPTO_SITE_WALL_SOURCES = [];',
);
t = t.replace(
  /const CRYPTO_EXT_WALL_SOURCES = \[[\s\S]*?\];/,
  'const CRYPTO_EXT_WALL_SOURCES = [];',
);

t = t.replace(
  'document.body.classList.toggle("hasWallBg", css !== "none");',
  `const on = css !== "none";
    document.body.classList.toggle("hasWallBg", on);
    document.body.classList.toggle("has-wallpaper", on);`,
);

t = t.replace(
  /(const strength = getAntiStrength\(kind\);\s*\n\s*)const antiN = 0;/,
  '$1const antiN = antiWindow(strength);',
);

t = t.replace(
  'INFLIGHT[kind] = true;\n    setBusy(kind, true);',
  'INFLIGHT[kind] = true;\n    try{ window.__i18nPause = true; }catch{}\n    setBusy(kind, true, count > 1 ? `Adding ${effCount}…` : "Working...");',
);

t = t.replace(
  'INFLIGHT[kind] = false;\n      try{ ABORT[kind] = null; }catch{}',
  'INFLIGHT[kind] = false;\n      try{ window.__i18nPause = false; }catch{}\n      try{ ABORT[kind] = null; }catch{}',
);

t = t.replace('while (accepted.length < effCount && attempts < 1){', 'while (accepted.length < effCount && attempts < 4){');
t = t.replace('const buffer = 24;\n        const genDeadline = Date.now() + 45000;', 'const buffer = 12;\n        const genDeadline = Date.now() + 22000;');
t = t.replace('const reqCount = Math.min(140, missing + buffer);', 'const reqCount = Math.min(48, missing + buffer);');
t = t.replace(
  '&anti_last_n=0&count=${reqCount}',
  '&anti_last_n=${encodeURIComponent(antiN)}&count=${reqCount}',
);
if (!t.includes('await yieldToUiFrame();') || !t.includes('attempts < 4')) {
  t = t.replace(
    'if (!Array.isArray(bulk.list) || bulk.list.length === 0) break;\n        }',
    'if (!Array.isArray(bulk.list) || bulk.list.length === 0) break;\n          await yieldToUiFrame();\n        }',
  );
}

t = t.replace(
  `function kick(){
        if(t) clearTimeout(t);
        t=setTimeout(()=>{ try{ applyLang(); }catch{} try{ syncBestModeUi(); }catch{} try{ syncCleanFillUi(); }catch{} }, 30);`,
  `function kick(){
        if (window.__i18nPause) return;
        if(t) clearTimeout(t);
        t=setTimeout(()=>{ if (window.__i18nPause) return; try{ applyLang(); }catch{} try{ syncBestModeUi(); }catch{} try{ syncCleanFillUi(); }catch{} }, 120);`,
);

// Remove support bundle UI handlers
t = t.replace(/\n    const supBtn = \$("toolSupport"\);[\s\S]*?\n    \}\n\n    const logsBtn = \$("toolLogs"\);[\s\S]*?\n    \}\n/, '\n');

fs.writeFileSync(APP, t, 'utf8');
console.log('patched', APP);
