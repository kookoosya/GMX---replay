#!/usr/bin/env node
import fs from "fs";
import path from "path";

const root = process.cwd();

// --- site_sync.js ---
const syncPath = path.join(root, "extension/site_sync.js");
let sync = fs.readFileSync(syncPath, "utf8");

if (!sync.includes("gmx_ext_wp_v2_popup")) {
  sync = sync.replace(
    `  const LS_EXT_WP_LEGACY = "gmx_ext_wp";
  const LS_EXT_VIEW = "gmx_ext_view_v2";`,
    `  const LS_EXT_WP_LEGACY = "gmx_ext_wp";
  const LS_EXT_WP_VIEW_POPUP = "gmx_ext_wp_view_popup";
  const LS_EXT_WP_VIEW_QUICK = "gmx_ext_wp_view_quick";
  const LS_EXT_VIEW = "gmx_ext_view_v2";`
  );
  sync = sync.replace(
    `  const EXT_WP_KEY = "gmx_ext_wp_v2";
  const EXT_VIEW_KEY = "gmx_ext_view_v2";`,
    `  const EXT_WP_KEY = "gmx_ext_wp_v2";
  const EXT_WP_POPUP_KEY = "gmx_ext_wp_v2_popup";
  const EXT_WP_QUICK_KEY = "gmx_ext_wp_v2_quick";
  const EXT_VIEW_KEY = "gmx_ext_view_v2";`
  );
  sync = sync.replace(
    `    const siteExtWallpaper = normalizeText(localStorage.getItem(LS_EXT_WP) || localStorage.getItem(LS_EXT_WP_LEGACY));
    const siteExtView = normalizeText(localStorage.getItem(LS_EXT_VIEW) || localStorage.getItem(LS_EXT_VIEW_LEGACY));`,
    `    const siteExtWallpaper = normalizeText(localStorage.getItem(LS_EXT_WP) || localStorage.getItem(LS_EXT_WP_LEGACY));
    const siteExtWallpaperPopup = normalizeText(localStorage.getItem(LS_EXT_WP_VIEW_POPUP) || localStorage.getItem("gmx_ext_wp_v2_popup"));
    const siteExtWallpaperQuick = normalizeText(localStorage.getItem(LS_EXT_WP_VIEW_QUICK) || localStorage.getItem("gmx_ext_wp_v2_quick"));
    const siteExtView = normalizeText(localStorage.getItem(LS_EXT_VIEW) || localStorage.getItem(LS_EXT_VIEW_LEGACY));`
  );
  sync = sync.replace(
    `      EXT_THEME_KEY, SITE_THEME_KEY, EXT_WP_KEY, EXT_VIEW_KEY, EXT_CUSTOM_BG_KEY,`,
    `      EXT_THEME_KEY, SITE_THEME_KEY, EXT_WP_KEY, EXT_WP_POPUP_KEY, EXT_WP_QUICK_KEY, EXT_VIEW_KEY, EXT_CUSTOM_BG_KEY,`
  );
  sync = sync.replace(
    `    if (!isSame(prev[EXT_WP_KEY], siteExtWallpaper)) payload[EXT_WP_KEY] = siteExtWallpaper;
    if (!isSame(prev[EXT_VIEW_KEY], siteExtView)) payload[EXT_VIEW_KEY] = siteExtView;`,
    `    if (!isSame(prev[EXT_WP_KEY], siteExtWallpaper)) payload[EXT_WP_KEY] = siteExtWallpaper;
    if (!isSame(prev[EXT_WP_POPUP_KEY], siteExtWallpaperPopup)) payload[EXT_WP_POPUP_KEY] = siteExtWallpaperPopup;
    if (!isSame(prev[EXT_WP_QUICK_KEY], siteExtWallpaperQuick)) payload[EXT_WP_QUICK_KEY] = siteExtWallpaperQuick;
    if (!isSame(prev[EXT_VIEW_KEY], siteExtView)) payload[EXT_VIEW_KEY] = siteExtView;`
  );
  sync = sync.replace(
    `      extWallpaper: siteExtWallpaper,
      extView: siteExtView,`,
    `      extWallpaper: siteExtWallpaper,
      extWallpaperPopup: siteExtWallpaperPopup,
      extWallpaperQuick: siteExtWallpaperQuick,
      extView: siteExtView,`
  );
  sync = sync.replace(
    `      if (!key || [LS_HANDLE, LS_TOKEN, LS_FORCE_LOGOUT, LS_FORCE_LOGOUT_LEGACY, LS_EXT_THEME, LS_EXT_THEME_LEGACY, LS_SITE_THEME, LS_EXT_WP, LS_EXT_WP_LEGACY, LS_EXT_VIEW, LS_EXT_VIEW_LEGACY, LS_EXT_CUSTOM_BG, LS_EXT_CUSTOM_BG_LEGACY].includes(key)) {`,
    `      if (!key || [LS_HANDLE, LS_TOKEN, LS_FORCE_LOGOUT, LS_FORCE_LOGOUT_LEGACY, LS_EXT_THEME, LS_EXT_THEME_LEGACY, LS_SITE_THEME, LS_EXT_WP, LS_EXT_WP_LEGACY, LS_EXT_WP_VIEW_POPUP, LS_EXT_WP_VIEW_QUICK, LS_EXT_VIEW, LS_EXT_VIEW_LEGACY, LS_EXT_CUSTOM_BG, LS_EXT_CUSTOM_BG_LEGACY].includes(key)) {`
  );
  fs.writeFileSync(syncPath, sync);
  console.log("patched extension/site_sync.js");
}

// --- popup.js ---
const popupPath = path.join(root, "extension/popup.js");
let pop = fs.readFileSync(popupPath, "utf8");

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

pop = pop.replace(
  `const DEFAULT_THEME = {
  id: "classic",
  a: "rgba(110,231,255,1)",
  b: "rgba(79,70,229,1)",
};`,
  `const DEFAULT_THEME = {
  id: "classic",
  a: "rgba(153,69,255,1)",
  b: "rgba(20,241,149,1)",
};`
);

pop = pop.replace(
  `  extWallpaper: "gmx_ext_wp_v2",
  extCustomBg: "gmx_ext_custom_bg_global_v2",
};`,
  `  extWallpaper: "gmx_ext_wp_v2",
  extWallpaperPopup: "gmx_ext_wp_v2_popup",
  extWallpaperQuick: "gmx_ext_wp_v2_quick",
  extCustomBg: "gmx_ext_custom_bg_global_v2",
};`
);

pop = pop.replace(
  `  extWallpaper: "gmx_ext_wp",
  extCustomBg: "gmx_ext_custom_bg_global",
};`,
  `  extWallpaper: "gmx_ext_wp",
  extWallpaperPopup: "gmx_ext_wp_view_popup",
  extWallpaperQuick: "gmx_ext_wp_view_quick",
  extCustomBg: "gmx_ext_custom_bg_global",
};`
);

pop = pop.replace(/for \(let i=1; i<=57; i\+\+\)/, "for (let i=1; i<=58; i++)");
pop = pop.replace(/Math\.max\(1, Math\.min\(57,/g, "Math.max(1, Math.min(58,");
pop = pop.replace('const ASSET_REV = "20260310a";', 'const ASSET_REV = "20260530b";');

if (!pop.includes("function getExtensionSurface()")) {
  pop = pop.replace(
    "function normalizeExtView(raw) {",
    `function getExtensionSurface() {
  try {
    const view = String(document.body && document.body.getAttribute("data-view") || "").trim().toLowerCase();
    return view === "quick" ? "quick" : "popup";
  } catch {
    return "popup";
  }
}

function pickSyncedWallpaperId(data) {
  const surface = getExtensionSurface();
  const viewKey = surface === "quick" ? THEME_KEYS.extWallpaperQuick : THEME_KEYS.extWallpaperPopup;
  const legacyViewKey = surface === "quick" ? LEGACY_THEME_KEYS.extWallpaperQuick : LEGACY_THEME_KEYS.extWallpaperPopup;
  const perView = normalizeWallpaperOptionId(String(data[viewKey] || data[legacyViewKey] || ""));
  const global = normalizeWallpaperOptionId(String(data[THEME_KEYS.extWallpaper] || data[LEGACY_THEME_KEYS.extWallpaper] || ""));
  return perView || global;
}

function normalizeExtView(raw) {`
  );
}

pop = pop.replace(
  "  state.extWallpaper = normalizeWallpaperOptionId(String(data[THEME_KEYS.extWallpaper] || data[LEGACY_THEME_KEYS.extWallpaper] || \"\").trim());",
  "  state.extWallpaper = pickSyncedWallpaperId(data);"
);

if (!pop.includes("async function loadBundledThemeCatalog")) {
  pop = pop.replace(
    "async function getThemeCatalog() {",
    `async function loadBundledThemeCatalog() {
  try {
    const response = await fetch(chrome.runtime.getURL("themes.json"), { cache: "no-store" });
    const data = await response.json().catch(() => null);
    const remote = Array.isArray(data && data.themes) ? data.themes : [];
    return remote.length ? remote : [];
  } catch {
    return [];
  }
}

async function getThemeCatalog() {`
  );
  pop = pop.replace(
    `  } catch {}

  state.themeCatalog = list.length ? list : [DEFAULT_THEME];
  return state.themeCatalog;`,
    `  } catch {}

  if (!list.length) {
    try { list = await loadBundledThemeCatalog(); } catch {}
  }

  state.themeCatalog = list.length ? list : [DEFAULT_THEME];
  return state.themeCatalog;`
  );
}

const resolveOld = `async function resolveWallpaperSource(base, wallpaperId) {
  const id = normalizeExtWallpaperId(wallpaperId);
  if (!id) return "";

  const cacheKey = \`\${normalizeBase(base)}::\${id}\`;
  if (WALL_CACHE.has(cacheKey)) return WALL_CACHE.get(cacheKey) || "";

  if (!(typeof id === "string" && id.startsWith("extv3_"))) {
    const localUrl = chrome.runtime.getURL(\`extbg/\${encodeURIComponent(id)}.svg\`);
    WALL_CACHE.set(cacheKey, localUrl);
    try{ prefetchWallpaper(localUrl); }catch{}
    return localUrl;
  }
  const finalUrl = extPackWallpaperDataUri(id, false);
  WALL_CACHE.set(cacheKey, finalUrl);
  try{ prefetchWallpaper(finalUrl); }catch{}
  return finalUrl;
}`;

const resolveNew = `async function resolveWallpaperSource(base, wallpaperId) {
  const id = normalizeExtWallpaperId(wallpaperId);
  if (!id) return "";

  const cacheKey = \`\${normalizeBase(base)}::\${id}\`;
  if (WALL_CACHE.has(cacheKey)) return WALL_CACHE.get(cacheKey) || "";

  const origin = normalizeBase(base);
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
  return localUrl;
}`;

if (pop.includes(resolveOld)) {
  pop = pop.replace(resolveOld, resolveNew);
} else if (!pop.includes('assets/extbg/${encodeURIComponent(id)}.webp')) {
  throw new Error("resolveWallpaperSource block not found");
}

if (!pop.includes("THEME_KEYS.extWallpaperPopup")) {
  pop = pop.replace(
    "    const themeKeys = new Set(Object.values(THEME_KEYS));",
    `    const themeKeys = new Set([
      ...Object.values(THEME_KEYS),
      ...Object.values(LEGACY_THEME_KEYS),
    ]);`
  );
}

fs.writeFileSync(popupPath, pop);
console.log("patched extension/popup.js");

// --- background.js host allowlist ---
const bgPath = path.join(root, "extension/background.js");
let bg = fs.readFileSync(bgPath, "utf8");
if (!bg.includes("ALLOWED_API_HOSTS")) {
  bg = bg.replace(
    `function normalizeBase(raw) {
  const value = String(raw || "").trim();
  if (!value) return "https://www.gmxreply.com";
  try {
    const url = new URL(value);
    return String(url.origin || "https://www.gmxreply.com").replace(/\\/$/, "");
  } catch {
    return "https://www.gmxreply.com";
  }
}`,
    `const ALLOWED_API_HOSTS = new Set(["www.gmxreply.com", "gmxreply.com", "localhost", "127.0.0.1"]);

function normalizeBase(raw) {
  const value = String(raw || "").trim();
  if (!value) return "https://www.gmxreply.com";
  try {
    const url = new URL(value);
    const host = String(url.hostname || "").toLowerCase();
    if (!ALLOWED_API_HOSTS.has(host)) return "https://www.gmxreply.com";
    return String(url.origin || "https://www.gmxreply.com").replace(/\\/$/, "");
  } catch {
    return "https://www.gmxreply.com";
  }
}`
  );
  fs.writeFileSync(bgPath, bg);
  console.log("patched extension/background.js");
}

console.log("extension patches done");
