#!/usr/bin/env node
/**
 * One-pass critical fixes for site + extension. Idempotent.
 */
import fs from "fs";
import path from "path";

const root = process.cwd();

function read(rel) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}
function write(rel, s) {
  fs.writeFileSync(path.join(root, rel), s, "utf8");
}

// --- extension/site_sync.js: logout + API base allowlist ---
{
  let s = read("extension/site_sync.js");
  if (!s.includes("ALLOWED_API_HOSTS")) {
    s = s.replace(
      `  function getApiBase() {
    try {
      const hinted = String(window.__GMX_API_ORIGIN || "").trim();
      if (hinted) return hinted.replace(/\\/$/, "");
    } catch {}
    return String(location.origin || "").trim().replace(/\\/$/, "");
  }`,
      `  const ALLOWED_API_HOSTS = new Set(["gmxreply.com", "www.gmxreply.com", "localhost", "127.0.0.1"]);

  function normalizeApiOrigin(raw) {
    const value = String(raw || "").trim();
    if (!value) return "";
    try {
      const url = new URL(value);
      const host = String(url.hostname || "").toLowerCase();
      if (!ALLOWED_API_HOSTS.has(host)) return "";
      return String(url.origin || "").replace(/\\/$/, "");
    } catch {
      return "";
    }
  }

  function getApiBase() {
    const hinted = normalizeApiOrigin(window.__GMX_API_ORIGIN);
    if (hinted) return hinted;
    return String(location.origin || "").trim().replace(/\\/$/, "");
  }`
    );
  }
  if (!s.includes('nextHandle = "";\n      nextToken = "";\n      await safeSet({ [V2_HANDLE]: ""')) {
    s = s.replace(
      `    if (forceLogout) {
      try { localStorage.removeItem(LS_FORCE_LOGOUT); } catch {}
      try { localStorage.removeItem(LS_FORCE_LOGOUT_LEGACY); } catch {}
    } else if (siteHandle && siteToken) {`,
      `    if (forceLogout) {
      try { localStorage.removeItem(LS_FORCE_LOGOUT); } catch {}
      try { localStorage.removeItem(LS_FORCE_LOGOUT_LEGACY); } catch {}
      nextHandle = "";
      nextToken = "";
      await safeSet({ [V2_HANDLE]: "", [V2_TOKEN]: "", sessionUpdatedAt: Date.now() });
      await safeRemove([LEGACY_BASE, LEGACY_HANDLE, LEGACY_TOKEN]);
    } else if (siteHandle && siteToken) {`
    );
  }
  write("extension/site_sync.js", s);
  console.log("fixed extension/site_sync.js");
}

// --- AppShell API origin on prod ---
for (const rel of ["frontend/src/AppShell.tsx"]) {
  let s = read(rel);
  const old = `    (window as any).__GMX_API_ORIGIN = (isLocalFrontend && isLocalBackendEnv) ? "" : rawApiOrigin;`;
  const neu = `    const prodOrigin = String(window.location.origin || "").replace(/\\/$/, "");
    (window as any).__GMX_API_ORIGIN = (isLocalFrontend && isLocalBackendEnv)
      ? ""
      : (rawApiOrigin || prodOrigin);`;
  if (s.includes(old) && !s.includes("prodOrigin")) {
    s = s.replace(old, neu);
    write(rel, s);
    console.log("fixed", rel);
  }
}

// --- public/app.js from HEAD baseline + patches ---
{
  const appPath = "public/app.js";
  const head = read(appPath);
  if (!head.includes("SITE_WALLPAPER_PACK_COUNT = 58")) {
    throw new Error("public/app.js missing pack 58 — run: git checkout HEAD -- public/app.js && node tools/patch-app-checkin.mjs");
  }
  let s = head;
  s = s.replace(/Math\.max\(1, Math\.min\(50, Number\(m\[1\]\)/g, "Math.max(1, Math.min(58, Number(m[1])");
  s = s.replace(/const CRYPTO_EXT_WALL_SOURCES = \[[\s\S]*?\];/, "const CRYPTO_EXT_WALL_SOURCES = [];");
  if (!s.includes("function extLsSet(")) {
    s = s.replace(
      'const LS_EXT_WP = "gmx_ext_wp"; // selected extension wallpaper id\n',
      `const LS_EXT_WP = "gmx_ext_wp"; // selected extension wallpaper id
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
    const text = String(value);
    localStorage.setItem(key, text);
    if (v2) localStorage.setItem(v2, text);
  }catch(_e){}
}

`
    );
  }
  if (!s.includes('if (v === "wall" || v === "custom")')) {
    s = s.replace(
      `function normalizeExtViewValue(view){
  const v = String(view || "").trim().toLowerCase();
  return (v === "wall") ? "wall" : "theme";
}`,
      `function normalizeExtViewValue(view){
  const v = String(view || "").trim().toLowerCase();
  if (v === "wall" || v === "custom") return v;
  return "theme";
}`
    );
  }
  s = s.replace('  localStorage.setItem(LS_EXT_VIEW, safeView);', '  extLsSet(LS_EXT_VIEW, safeView);');
  s = s.replace('    localStorage.setItem("gmx_ext_theme", id);', '    extLsSet("gmx_ext_theme", id);');
  if (!s.includes("extLsSet(key, safeId")) {
    s = s.replace(
      `    if (safeId) localStorage.setItem(key, safeId);
    else localStorage.removeItem(key);`,
      `    extLsSet(key, safeId || "");`
    );
  }
  s = s.replace(/localStorage\.setItem\(LS_EXT_CUSTOM_BG_GLOBAL, data\);/g, "extLsSet(LS_EXT_CUSTOM_BG_GLOBAL, data);");

  // wallpapers: webp not data-uri
  s = s.replace(
    /if \(norm\.startsWith\("v2_"\)\) return sitePackWallpaperDataUri\(norm, false\);/g,
    'if (norm.startsWith("v2_")) return `/assets/wallpapers/${norm}.webp?v=${ASSET_REV}`;'
  );
  s = s.replace(
    /if \(norm\.startsWith\("v2_"\)\) return sitePackWallpaperDataUri\(norm, true\);/g,
    'if (norm.startsWith("v2_")) return `/assets/wallpapers/thumbs/${norm}.webp?v=${ASSET_REV}`;'
  );
  s = s.replace(
    /if \(norm\.startsWith\("extv3_"\)\) return extPackWallpaperDataUri\(norm, false\);/g,
    'if (norm.startsWith("extv3_")) return `/assets/extbg/${norm}.webp?v=${ASSET_REV}`;'
  );
  s = s.replace(
    /if \(norm\.startsWith\("extv3_"\)\) return extPackWallpaperDataUri\(norm, true\);/g,
    'if (norm.startsWith("extv3_")) return `/assets/extbg/thumbs/${norm}.webp?v=${ASSET_REV}`;'
  );

  // bulk generate
  s = s.replace(/while \(accepted\.length < effCount && attempts < 1\)/g, "while (accepted.length < effCount && attempts < 4)");
  s = s.replace(
    /anti_last_n=0&count=\$\{reqCount\}/g,
    "anti_last_n=${encodeURIComponent(antiN)}&count=${reqCount}"
  );
  s = s.replace(/const antiN = 0;/g, "const antiN = antiWindow(strength);");

  // support removal
  s = s.replace('    setPh("supportOut","supportOut_ph",merged);\n', "");
  const supportBlock = `  function supportBundle(){
    const bundle = {
      product: "GMXReply",
      build: $("ui_build") ? $("ui_build").textContent : "",
      handle: getHandle(),
      uiLang: localStorage.getItem(LS_SITE_LANG) || "en",
      gm: { total: totalSaved("gm"), langs: getLangIndex("gm") },
      gn: { total: totalSaved("gn"), langs: getLangIndex("gn") },
      sub: SUB ? { active:true, tier: SUB.tier || SUB.plan || "", until: SUB.until || SUB.expires || "" } : { active:false },
      theme: localStorage.getItem("gmx_theme") || "classic",
      hasCustomBg: !!localStorage.getItem(LS_CUSTOM_BG_GLOBAL),
      ua: navigator.userAgent
    };
    return JSON.stringify(bundle, null, 2);
  }

  function logsBundle(){
    const out = {
      ts: new Date().toISOString(),
      handle: getHandle(),
      logs: LOGS.slice(-120)
    };
    return JSON.stringify(out, null, 2);
  }


`;
  s = s.replace(supportBlock, "");
  const handlers = `    const supBtn = $("toolSupport");
    if (supBtn){
      supBtn.addEventListener("click", async ()=>{
        const data = supportBundle();
        await copyToClipboard(data);
        if (note) note.textContent = "Support bundle copied. Send it only if support asks for it.";
      });
    }

    const logsBtn = $("toolLogs");
    if (logsBtn){
      logsBtn.addEventListener("click", async ()=>{
        const out = logsBundle();
        const ta = $("supportOut");
        if (ta) ta.value = out;
        await copyToClipboard(out);
        if (note) note.textContent = "Logs copied. Send them only if support asks for them.";
        logEvent("support_logs", { size: out.length });
      });
    }
`;
  s = s.replace(handlers, "");

  if (!s.includes("function syncModePanelCopy")) {
    const syncFn = `  function syncModePanelCopy(){
    const bind = (kind)=>{
      const sizeLbl = $(kind === "gm" ? "gm_size" : "gn_size");
      const sel = $(kind === "gm" ? "gmMode" : "gnMode");
      if (sizeLbl) sizeLbl.textContent = t(kind === "gm" ? "gm_size_label" : "gn_size_label") || "Size";
      if (!sel) return;
      const labels = {
        min: t(kind === "gm" ? "gm_mode_min" : "gn_mode_min"),
        mid: t(kind === "gm" ? "gm_mode_mid" : "gn_mode_mid"),
        max: t(kind === "gm" ? "gm_mode_max" : "gn_mode_max")
      };
      for (const opt of sel.options){
        const v = String(opt.value || "").toLowerCase();
        if (labels[v]) opt.textContent = labels[v];
      }
    };
    bind("gm");
    bind("gn");
  }

`;
    s = s.replace("  function patchDynamicCopy(lang, merged){", syncFn + "  function patchDynamicCopy(lang, merged){");
  }

  if (!s.includes('classList.toggle("has-wallpaper"')) {
    s = s.replace(
      'document.body.classList.toggle("hasWallBg", on);',
      'document.body.classList.toggle("hasWallBg", on);\n    document.body.classList.toggle("has-wallpaper", on);'
    );
  }

  write(appPath, s);
  console.log("fixed public/app.js");
}

// --- app.html support + payments ---
{
  let h = read("public/app.html");
  const bad = `</ul>
<div class="muted small" id="toolNote" style="margin-top:8px"></div>
<textarea id="supportOut" placeholder="" style="margin-top:10px;min-height:80px" aria-label="supportOut"></textarea>

<div class="hr"></div>`;
  const good = `</ul>
<div class="hr"></div>`;
  if (h.includes("supportOut")) h = h.replace(bad, good);
  if (!h.includes("Payments are final")) {
    h = h.replace(
      "  <li><b>On-chain verification:</b> Pro activates only after we verify your transaction on Solana.</li>\n</ul>",
      "  <li><b>On-chain verification:</b> Pro activates only after we verify your transaction on Solana.</li>\n  <li><b>Payments are final:</b> verified on-chain payments are not refunded or reversed by us.</li>\n</ul>"
    );
  }
  write("public/app.html", h);
  console.log("fixed public/app.html");
}

// --- en.json ---
{
  const enPath = "shared/i18n/locales/en.json";
  const j = JSON.parse(read(enPath));
  j.w_support_title = "";
  j.w_support_desc = "";
  j.toolSupport = "";
  j.toolDiag = "";
  j.toolLogs = "";
  j.supportOut_ph = "";
  const payFinal = "<li><b>Payments are final:</b> verified on-chain payments are not refunded or reversed by us.</li>";
  if (!String(j.w_trust_list_html || "").includes("Payments are final")) {
    j.w_trust_list_html = String(j.w_trust_list_html || "").replace(/<\/li>\s*$/, "") + payFinal;
  }
  const faqRefund = "<b>Can I get a refund?</b> No. Once a Solana payment is verified on-chain, it is final.";
  if (!Array.isArray(j.w_faq_list)) j.w_faq_list = [];
  if (!j.w_faq_list.some((x) => String(x).includes("refund"))) j.w_faq_list.push(faqRefund);
  write(enPath, JSON.stringify(j, null, 2) + "\n");
  console.log("fixed en.json");
}

// --- extension popup (idempotent patch) ---
{
  const p = "extension/popup.js";
  let pop = read(p);
  if (!pop.includes("async function removeState")) {
    pop = pop.replace(
      "async function saveState(partial) {",
      `async function removeState(keys) {
  const list = Array.isArray(keys) ? keys.filter(Boolean) : [keys].filter(Boolean);
  if (!list.length) return;
  try { await chrome.storage.local.remove(list); } catch {}
}

async function saveState(partial) {`
    );
  }
  pop = pop.replace(/for \(let i=1; i<=57; i\+\+\)/, "for (let i=1; i<=58; i++)");
  pop = pop.replace(/Math\.max\(1, Math\.min\(57,/g, "Math.max(1, Math.min(58,");
  pop = pop.replace('const ASSET_REV = "20260310a";', 'const ASSET_REV = "20260530b";');
  const oldResolve = /if \(!\(typeof id === "string" && id\.startsWith\("extv3_"\)\)\) \{[\s\S]*?return finalUrl;\n  \}/;
  if (oldResolve.test(pop)) {
    pop = pop.replace(oldResolve, `const origin = normalizeBase(base);
  if (id.startsWith("custom_")) {
    const remote = \`\${origin}/assets/extbg/custom/\${encodeURIComponent(id.slice(7))}?v=\${ASSET_REV}\`;
    WALL_CACHE.set(cacheKey, remote);
    try{ prefetchWallpaper(remote); }catch{}
    return remote;
  }
  if (id.startsWith("extv3_")) {
    const remote = \`\${origin}/assets/extbg/\${encodeURIComponent(id)}.webp?v=\${ASSET_REV}\`;
    WALL_CACHE.set(cacheKey, remote);
    try{ prefetchWallpaper(remote); }catch{}
    return remote;
  }
  const localUrl = chrome.runtime.getURL(\`extbg/\${encodeURIComponent(id)}.svg\`);
  WALL_CACHE.set(cacheKey, localUrl);
  try{ prefetchWallpaper(localUrl); }catch{}
  return localUrl;`);
  }
  write(p, pop);
  console.log("fixed extension/popup.js");
}

console.log("\nfix-all-critical done");
