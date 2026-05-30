#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

function patchAppJs(file) {
  let s = fs.readFileSync(file, "utf8");
  if (s.includes("GM_PACKS")) return false;

  const antiOld = `  // Hidden repeat guard stays off in the normal flow.
  // Best pass uses its own fixed internal shape pass only when the user turns it on.
  function getAntiStrength(kind){
    return 0;
  }`;
  const antiNew = `  function packsForKind(kind){
    return kind === "gn" ? GN_PACKS : GM_PACKS;
  }

  function getAntiStrength(kind){
    try{
      const raw = localStorage.getItem(lsKeyAnti(kind));
      if (raw !== null && raw !== ""){
        const n = Math.trunc(Number(raw));
        if (Number.isFinite(n)) return Math.max(0, Math.min(5, n));
      }
    }catch(_e){}
    const packEl = kind === "gn" ? $("gnPack") : $("gmPack");
    const pid = packEl ? (packEl.value || "classic") : "classic";
    const pack = packsForKind(kind).find((p)=>p.id === pid) || packsForKind(kind)[0];
    return Math.max(0, Math.min(5, Number.isFinite(pack?.anti) ? pack.anti : 2));
  }`;
  if (!s.includes(antiOld)) throw new Error(`anti block missing in ${file}`);
  s = s.replace(antiOld, antiNew);

  const packsOld = `  const PACKS = [
    { id:"classic", name:"Balanced",         pro:false, style:"classic", mode:null, anti:2, clean:true  },
    { id:"king",    name:"Market Read",      pro:false, style:"alpha",   mode:"mid", anti:2, clean:true  },
    { id:"degen",   name:"CT Market",        pro:true,  style:"degen",   mode:"mid", anti:4, clean:true  },
    { id:"minimal", name:"Tight Minimal",    pro:true,  style:"minimal", mode:"min", anti:4, clean:true  },
    { id:"builder", name:"Builder Clean",    pro:true,  style:"builder", mode:"mid", anti:4, clean:true  },
    { id:"kind",    name:"Soft Close",       pro:true,  style:"calm",    mode:"mid", anti:4, clean:true  },
    { id:"aggro",   name:"Alpha Push",       pro:true,  style:"alpha",   mode:"max", anti:3, clean:true  },
  ];

  function unlockedPacksCount(){ return unlockedCountByRefs(PACKS.length, FREE_VISIBLE_PACKS); }

  function fillPacks(){
    const unlocked = unlockedPacksCount();
    const fill = (sel, lsKey)=>{
      if (!sel) return;
      const prev = localStorage.getItem(lsKey) || "classic";
      sel.innerHTML = "";
      PACKS.forEach((p, idx)=>{
        const o = document.createElement("option");
        o.value = p.id;
        const locked = (!isPro() && idx >= unlocked);
        const need = reqRefsForUnlockIndex(idx, FREE_VISIBLE_PACKS);
        o.textContent = locked ? \`\${t("locked")||"LOCKED"} (\${need} ref)\` : p.name;
        o.disabled = locked;
        sel.appendChild(o);
      });
      if ([...sel.options].some(o=>o.value===prev && !o.disabled)) sel.value = prev;
      else sel.value = "classic";
    };
    fill($("gmPack"), LS_GM_PACK);
    fill($("gnPack"), LS_GN_PACK);
  }`;

  const packsNew = `  const GM_PACKS = [
    { id:"classic", name:"Morning Balanced", pro:false, style:"classic", mode:null, anti:2, clean:true },
    { id:"king",    name:"Market Read AM",   pro:false, style:"alpha",   mode:"mid", anti:2, clean:true },
    { id:"degen",   name:"CT Morning",       pro:true,  style:"degen",   mode:"mid", anti:4, clean:true },
    { id:"minimal", name:"Tight GM",         pro:true,  style:"minimal", mode:"min", anti:4, clean:true },
    { id:"builder", name:"Builder AM",       pro:true,  style:"builder", mode:"mid", anti:4, clean:true },
    { id:"kind",    name:"Warm Morning",     pro:true,  style:"calm",    mode:"mid", anti:4, clean:true },
    { id:"aggro",   name:"Alpha Push AM",    pro:true,  style:"alpha",   mode:"max", anti:3, clean:true },
  ];
  const GN_PACKS = [
    { id:"classic", name:"Night Balanced",   pro:false, style:"classic", mode:null, anti:2, clean:true },
    { id:"king",    name:"Market Wind-down", pro:false, style:"alpha",   mode:"mid", anti:2, clean:true },
    { id:"degen",   name:"CT Night",         pro:true,  style:"degen",   mode:"mid", anti:4, clean:true },
    { id:"minimal", name:"Tight GN",         pro:true,  style:"minimal", mode:"min", anti:4, clean:true },
    { id:"builder", name:"Builder Close",    pro:true,  style:"builder", mode:"mid", anti:4, clean:true },
    { id:"kind",    name:"Soft Close",       pro:true,  style:"calm",    mode:"mid", anti:4, clean:true },
    { id:"aggro",   name:"Alpha Close",      pro:true,  style:"alpha",   mode:"max", anti:3, clean:true },
  ];

  function unlockedPacksCount(){ return unlockedCountByRefs(GM_PACKS.length, FREE_VISIBLE_PACKS); }

  function fillPacks(){
    const unlocked = unlockedPacksCount();
    const fill = (sel, lsKey, packs)=>{
      if (!sel) return;
      const prev = localStorage.getItem(lsKey) || "classic";
      sel.innerHTML = "";
      packs.forEach((p, idx)=>{
        const o = document.createElement("option");
        o.value = p.id;
        const locked = (!isPro() && idx >= unlocked);
        const need = reqRefsForUnlockIndex(idx, FREE_VISIBLE_PACKS);
        o.textContent = locked ? \`\${t("locked")||"LOCKED"} (\${need} ref)\` : p.name;
        o.disabled = locked;
        sel.appendChild(o);
      });
      if ([...sel.options].some(o=>o.value===prev && !o.disabled)) sel.value = prev;
      else sel.value = "classic";
    };
    fill($("gmPack"), LS_GM_PACK, GM_PACKS);
    fill($("gnPack"), LS_GN_PACK, GN_PACKS);
  }`;
  if (!s.includes(packsOld)) throw new Error(`packs block missing in ${file}`);
  s = s.replace(packsOld, packsNew);

  s = s.replaceAll("PACKS.findIndex", "packsForKind(kind).findIndex");
  s = s.replaceAll("PACKS.find(", "packsForKind(kind).find(");
  s = s.replaceAll("|| PACKS[0]", "|| packsForKind(kind)[0]");

  s = s.replace(
    `    const strength = getAntiStrength(kind);
    const antiN = 0;
    const autoClean = (count <= 1) ? getCleanFillEnabled(kind) : false;`,
    `    const strength = getAntiStrength(kind);
    const antiN = antiWindow(strength);
    const autoClean = (count <= 1) ? getCleanFillEnabled(kind) : false;`
  );

  const bindOld = `          const p = packsForKind(kind).find(x=>x.id===pid) || packsForKind(kind)[0];
          const idx = packsForKind(kind).findIndex(x=>x.id===pid);
          const locked = (!isPro() && idx >= unlockedPacksCount());
          if (locked){
            if (msgEl) msgEl.innerHTML = \`<span class="warn">Pack is locked. Upgrade to Pro or unlock via referrals.</span>\`;
            return;
          }
          // apply preset defaults
          const styleSel = kind==="gm" ? $("gmStyle") : $("gnStyle");
          const modeSel  = kind==="gm" ? $("gmMode")  : $("gnMode");
          if (styleSel && p.style) styleSel.value = p.style;
          if (modeSel && p.mode) modeSel.value = p.mode;

          if (msgEl) msgEl.innerHTML = \`<span class="ok">Applied pack: \${escapeHtml(p.name)}</span>\`;`;
  const bindNew = `          const packs = packsForKind(kind);
          const p = packs.find(x=>x.id===pid) || packs[0];
          const idx = packs.findIndex(x=>x.id===pid);
          const locked = (!isPro() && idx >= unlockedPacksCount());
          if (locked){
            if (msgEl) msgEl.innerHTML = \`<span class="warn">\${escapeHtml(t("locked_pack") || "Pack is locked.")}</span>\`;
            return;
          }
          const styleSel = kind==="gm" ? $("gmStyle") : $("gnStyle");
          const modeSel  = kind==="gm" ? $("gmMode")  : $("gnMode");
          if (styleSel && p.style) styleSel.value = p.style;
          if (modeSel && p.mode) modeSel.value = p.mode;
          if (Number.isFinite(p.anti)) {
            try{ localStorage.setItem(lsKeyAnti(kind), String(Math.max(0, Math.min(5, p.anti)))); }catch(_e){}
          }
          if (msgEl) msgEl.innerHTML = \`<span class="ok">\${escapeHtml(t("pack_applied") || "Applied pack")}: \${escapeHtml(p.name)}</span>\`;`;
  if (s.includes(bindOld)) s = s.replace(bindOld, bindNew);

  fs.writeFileSync(file, s);
  return true;
}

function patchExtensionPopup() {
  const file = path.join(root, "extension", "popup.js");
  let s = fs.readFileSync(file, "utf8");
  let changed = false;

  if (!s.includes("gmMode:")) {
    s = s.replace(
      `const STORAGE_KEYS = {
  base: "gmx_ext_api_base_v2",
  handle: "gmx_ext_handle_v2",
  token: "gmx_ext_token_v2",
  mode: "gmx_ext_mode_v2",
  lastText: "gmx_ext_last_text_v2",
};`,
      `const STORAGE_KEYS = {
  base: "gmx_ext_api_base_v2",
  handle: "gmx_ext_handle_v2",
  token: "gmx_ext_token_v2",
  mode: "gmx_ext_mode_v2",
  gmMode: "gmx_ext_gm_mode_v2",
  gnMode: "gmx_ext_gn_mode_v2",
  gmStyle: "gmx_ext_gm_style_v2",
  gnStyle: "gmx_ext_gn_style_v2",
  lastText: "gmx_ext_last_text_v2",
};`
    );
    s = s.replace(
      `  mode: "mid",
  lastText: "",`,
      `  mode: "mid",
  gmMode: "mid",
  gnMode: "mid",
  gmStyle: "classic",
  gnStyle: "classic",
  lastText: "",`
    );
    changed = true;
  }

  if (!s.includes("function extModeForKind")) {
    s = s.replace(
      `async function fetchBatch(kind, count = 6) {
  const safeKind = kind === "gn" ? "gn" : "gm";
  const safeMode = ["min", "mid", "max"].includes(state.mode) ? state.mode : "mid";
  const path = state.token
    ? \`/api/generate-bulk?kind=\${safeKind}&mode=\${encodeURIComponent(safeMode)}&count=\${Math.max(1, Math.min(10, count))}\`
    : \`/api/public/random-bulk?kind=\${safeKind}&mode=\${encodeURIComponent(safeMode)}&count=\${Math.max(1, Math.min(10, count))}\`;`,
      `function extModeForKind(kind) {
  const key = kind === "gn" ? "gnMode" : "gmMode";
  const raw = state[key] || state.mode || "mid";
  return ["min", "mid", "max"].includes(raw) ? raw : "mid";
}

function extStyleForKind(kind) {
  const key = kind === "gn" ? "gnStyle" : "gmStyle";
  const raw = String(state[key] || "classic").toLowerCase();
  const allowed = new Set(["classic","degen","builder","alpha","calm","meme","classy","minimal","noemoji","emoji","focus","cheer"]);
  return allowed.has(raw) ? raw : "classic";
}

async function fetchBatch(kind, count = 6) {
  const safeKind = kind === "gn" ? "gn" : "gm";
  const safeMode = extModeForKind(safeKind);
  const safeStyle = extStyleForKind(safeKind);
  const qs = new URLSearchParams({
    kind: safeKind,
    mode: safeMode,
    style: safeStyle,
    count: String(Math.max(1, Math.min(10, count))),
  });
  if (state.token) qs.set("anti_last_n", "20");
  const path = state.token
    ? \`/api/generate-bulk?\${qs}\`
    : \`/api/public/random-bulk?\${qs}\`;`
    );
    changed = true;
  }

  if (s.includes("extPackWallpaperDataUri(id, false)")) {
    s = s.replace(
      `  if (!(typeof id === "string" && id.startsWith("extv3_"))) {
    const localUrl = chrome.runtime.getURL(\`extbg/\${encodeURIComponent(id)}.svg\`);
    WALL_CACHE.set(cacheKey, localUrl);
    try{ prefetchWallpaper(localUrl); }catch{}
    return localUrl;
  }
  const finalUrl = extPackWallpaperDataUri(id, false);
  WALL_CACHE.set(cacheKey, finalUrl);
  try{ prefetchWallpaper(finalUrl); }catch{}
  return finalUrl;`,
      `  const baseUrl = normalizeBase(base);
  if (typeof id === "string" && id.startsWith("extv3_")) {
    const remote = \`\${baseUrl}/assets/extbg/\${encodeURIComponent(id)}.webp?v=\${ASSET_REV}\`;
    WALL_CACHE.set(cacheKey, remote);
    try{ prefetchWallpaper(remote); }catch{}
    return remote;
  }
  const localUrl = chrome.runtime.getURL(\`extbg/\${encodeURIComponent(id)}.svg\`);
  WALL_CACHE.set(cacheKey, localUrl);
  try{ prefetchWallpaper(localUrl); }catch{}
  return localUrl;`
    );
    changed = true;
  }

  if (!s.includes("scoreTemplate(text, kind")) {
    s = s.replace("function scoreTemplate(text) {", "function scoreTemplate(text, kind = \"gm\") {");
    s = s.replace(
      `  if (/^(gm|gn)\\b/i.test(value)) score += 6;`,
      `  if (/^(gm|good morning|morning)\\b/i.test(value) && kind === "gm") score += 8;
  if (/^(gn|good night|night)\\b/i.test(value) && kind === "gn") score += 8;`
    );
    // pass kind to scoreTemplate in specific call sites only
    s = s.replace(
      `      const current = scoreTemplate(queue[i]);`,
      `      const current = scoreTemplate(queue[i], kind);`
    );
    s = s.replace(
      `    baseList.sort((a, b) => scoreTemplate(b) - scoreTemplate(a));`,
      `    baseList.sort((a, b) => scoreTemplate(b, safeKind) - scoreTemplate(a, safeKind));`
    );
    changed = true;
  }

  if (!s.includes("state.gmMode = next")) {
    s = s.replace(
      `      state.mode = ["min", "mid", "max"].includes(el.modeSelect.value) ? el.modeSelect.value : "mid";
      state.cache = { gm: [], gn: [] };
      await saveState({ [STORAGE_KEYS.mode]: state.mode });`,
      `      const next = ["min", "mid", "max"].includes(el.modeSelect.value) ? el.modeSelect.value : "mid";
      state.mode = next;
      state.gmMode = next;
      state.gnMode = next;
      state.cache = { gm: [], gn: [] };
      await saveState({
        [STORAGE_KEYS.mode]: state.mode,
        [STORAGE_KEYS.gmMode]: state.gmMode,
        [STORAGE_KEYS.gnMode]: state.gnMode,
      });`
    );
    changed = true;
  }

  if (changed) fs.writeFileSync(file, s);
  return changed;
}

function patchExtensionManifest() {
  const file = path.join(root, "extension", "manifest.json");
  const j = JSON.parse(fs.readFileSync(file, "utf8"));
  if (j.version !== "1.2.0") {
    j.version = "1.2.0";
    j.description = "Safe copy-only GM/GN companion. Per-mode generation, site sync, real extension wallpapers.";
    fs.writeFileSync(file, JSON.stringify(j, null, 2) + "\n");
    return true;
  }
  return false;
}

// i18n: copy en leaf strings to locales where identical (fill gaps from en structure)
function fillI18nFromEn() {
  const localesDir = path.join(root, "shared", "i18n", "locales");
  const en = JSON.parse(fs.readFileSync(path.join(localesDir, "en.json"), "utf8"));
  const prefixes = /^(gm_|gn_|h_|w_|plan_|ref_|t_|themes_|ext_|pm_|wallet_|billing_)/;
  let n = 0;
  for (const file of fs.readdirSync(localesDir)) {
    if (!file.endsWith(".json") || file === "en.json") continue;
    const p = path.join(localesDir, file);
    const loc = JSON.parse(fs.readFileSync(p, "utf8"));
    for (const [k, v] of Object.entries(en)) {
      if (!prefixes.test(k)) continue;
      if (loc[k] === undefined || loc[k] === "" || loc[k] === v) {
        if (file.startsWith("ru") || file.startsWith("uk")) continue; // keep manual ru/uk
        if (loc[k] !== v) { loc[k] = v; n++; }
      }
    }
    fs.writeFileSync(p, JSON.stringify(loc, null, 2) + "\n");
  }
  return n;
}

const results = [];
for (const f of ["public/app.js", "frontend/public/app.js"]) {
  try { results.push(`${f}: app ${patchAppJs(path.join(root, f))}`); } catch (e) { results.push(`${f}: FAIL ${e.message}`); }
}
results.push(`extension: ${patchExtensionPopup()}`);
results.push(`manifest: ${patchExtensionManifest()}`);
// ru/uk deep patch inline
const ruPath = path.join(root, "shared/i18n/locales/ru.json");
const ukPath = path.join(root, "shared/i18n/locales/uk.json");
const ruPatch = {
  gm_right_desc: "Короткие утренние GM-ответы — естественно, по делу, удобно вставлять.",
  gn_right_desc: "Короткие ночные GN-ответы — спокойно, по-человечески, удобно вставлять.",
  gm_daily_label: "Дневная генерация GM",
  gn_daily_label: "Дневная генерация GN",
  locked_pack: "Пак заблокирован. Нужен Pro или рефералы.",
  pack_applied: "Пак применён",
  billing_receiver_missing: "Оплата недоступна: кошелёк сервера не настроен.",
  h_what_2: "HTML:Безопасный copy-first: сгенерируй в расширении, скопируй, вставь в X вручную.",
  h_freepro_1: "HTML:<b>Free:</b> лимиты на сохранённые строки и дневную генерацию.",
  h_freepro_2: "HTML:<b>Pro:</b> без лимитов, все стили и премиум-функции.",
};
for (const [p, patch] of [[ruPath, ruPatch], [ukPath, { ...ruPatch, gm_right_desc: "Короткі ранкові GM-відповіді.", gn_right_desc: "Короткі нічні GN-відповіді." }]]) {
  const d = JSON.parse(fs.readFileSync(p, "utf8"));
  Object.assign(d, patch);
  fs.writeFileSync(p, JSON.stringify(d, null, 2) + "\n");
}
results.push(`i18n fill: ${fillI18nFromEn()} keys`);
console.log(results.join("\n"));
