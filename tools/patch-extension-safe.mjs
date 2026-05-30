#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const file = path.join(process.cwd(), "extension", "popup.js");
let s = fs.readFileSync(file, "utf8");
if (s.includes("function extModeForKind")) {
  console.log("extension/popup.js: already patched");
  process.exit(0);
}

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

s = s.replace(
  "function scoreTemplate(text) {",
  'function scoreTemplate(text, kind = "gm") {'
);
s = s.replace(
  `  if (/^(gm|gn)\\b/i.test(value)) score += 6;`,
  `  if (/^(gm|good morning|morning)\\b/i.test(value) && kind === "gm") score += 8;
  if (/^(gn|good night|night)\\b/i.test(value) && kind === "gn") score += 8;`
);

s = s.replace(
  `      const current = scoreTemplate(queue[i]);`,
  `      const current = scoreTemplate(queue[i], kind);`
);
s = s.replace(
  `    baseList.sort((a, b) => scoreTemplate(b) - scoreTemplate(a));`,
  `    baseList.sort((a, b) => scoreTemplate(b, safeKind) - scoreTemplate(a, safeKind));`
);

s = s.replace(
  `async function fetchBatch(kind, count = 6) {
  const safeKind = kind === "gn" ? "gn" : "gm";
  const safeMode = ["min", "mid", "max"].includes(state.mode) ? state.mode : "mid";
  const path = state.token
    ? \`/api/generate-bulk?kind=\${safeKind}&mode=\${safeMode}&count=\${Math.max(1, Math.min(10, count))}\`
    : \`/api/public/random-bulk?kind=\${safeKind}&mode=\${safeMode}&count=\${Math.max(1, Math.min(10, count))}\`;`,
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

s = s.replace(
  `  state.mode = ["min", "mid", "max"].includes(String(data[STORAGE_KEYS.mode] || "")) ? String(data[STORAGE_KEYS.mode]) : "mid";
  state.lastText = String(data[STORAGE_KEYS.lastText] || "").trim();`,
  `  state.mode = ["min", "mid", "max"].includes(String(data[STORAGE_KEYS.mode] || "")) ? String(data[STORAGE_KEYS.mode]) : "mid";
  state.gmMode = ["min", "mid", "max"].includes(String(data[STORAGE_KEYS.gmMode] || "")) ? String(data[STORAGE_KEYS.gmMode]) : state.mode;
  state.gnMode = ["min", "mid", "max"].includes(String(data[STORAGE_KEYS.gnMode] || "")) ? String(data[STORAGE_KEYS.gnMode]) : state.mode;
  state.gmStyle = String(data[STORAGE_KEYS.gmStyle] || state.gmStyle || "classic");
  state.gnStyle = String(data[STORAGE_KEYS.gnStyle] || state.gnStyle || "classic");
  state.lastText = String(data[STORAGE_KEYS.lastText] || "").trim();`
);

s = s.replace(
  `  if (el.modeSelect) el.modeSelect.value = state.mode;`,
  `  if (el.modeSelect) el.modeSelect.value = state.mode;`
);

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

fs.writeFileSync(file, s);
console.log("extension/popup.js: patched OK");
