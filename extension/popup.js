const DEFAULT_BASE = "https://www.gmxreply.com";
const STORAGE_KEYS = {
  base: "gmx_ext_api_base_v2",
  handle: "gmx_ext_handle_v2",
  token: "gmx_ext_token_v2",
  mode: "gmx_ext_mode_v2",
  lastText: "gmx_ext_last_text_v2",
};
const ALERT_KEYS = {
  enabled: "gmx_market_alerts_enabled_v1",
  interval: "gmx_market_alerts_interval_v1",
};
const ASSET_REV = "20260530b";
const LEGACY_KEYS = {
  base: "apiBase",
  handle: "handle",
  token: "token",
};
const LEGACY_STORAGE_KEYS = Object.values(LEGACY_KEYS);
const THEME_KEYS = {
  extTheme: "gmx_ext_theme_v2",
  siteTheme: "gmx_theme",
  extView: "gmx_ext_view_v2",
  extWallpaper: "gmx_ext_wp_v2",
  extWallpaperPopup: "gmx_ext_wp_v2_popup",
  extWallpaperQuick: "gmx_ext_wp_v2_quick",
  extCustomBg: "gmx_ext_custom_bg_global_v2",
};
const LEGACY_THEME_KEYS = {
  extTheme: "gmx_ext_theme",
  extView: "gmx_ext_view",
  extWallpaper: "gmx_ext_wp",
  extWallpaperPopup: "gmx_ext_wp_view_popup",
  extWallpaperQuick: "gmx_ext_wp_view_quick",
  extCustomBg: "gmx_ext_custom_bg_global",
};

const EXT_FEATURED_WALLPAPERS = [
  { id: 'ext_free_01', name: 'Mempool Grid' },
  { id: 'ext_free_02', name: 'Solana Glass' },
  { id: 'lux_ext_degen_terminal', name: 'Degen Terminal' },
  { id: 'lux_ext_onchain_spaceport', name: 'Onchain Spaceport' },
  { id: 'lux_ext_solana_temple', name: 'Solana Temple' },
  { id: 'lux_ext_ct_warroom', name: 'CT War Room' },
  { id: 'lux_ext_nft_gallery', name: 'NFT Gallery' },
  { id: 'lux_ext_noir_detective', name: 'Ledger Noir' },
  { id: 'lux_ext_anime_neon_alley', name: 'Neon Alley' },
  { id: 'lux_ext_cinematic_heroes', name: 'Validator Skyline' },
];

const EXT_WALLPAPER_OPTIONS = (()=>{
  const out = [...EXT_FEATURED_WALLPAPERS];
  for (let i=1; i<=58; i++){
    const n = String(i).padStart(2,'0');
    out.push({ id: `extv3_${n}`, name: ['Laser Grid', 'Night Drive', 'Order Book', 'Signal Bloom', 'Validator Sky', 'Candle Mist', 'Relay Tunnel', 'Mint Horizon', 'Blockwave', 'Node Rain', 'Airdrop Haze', 'Hyperlane', 'Glass Router', 'Vault Glow', 'Neon Tape', 'Cold Ledger', 'Warp Stack', 'Luma Chain', 'Dawn Engine', 'Token Drift', 'Blue Volume', 'Mirror Pool', 'Circuit Cloud', 'Mint Static', 'Heatmap', 'Price Halo', 'Turbo Dusk', 'Late Block', 'Shard Dream', 'Chainlight', 'Mercury Lane', 'Peak Flow', 'Silent Mint', 'Fast Route', 'Prime Tape', 'Node Bloom', 'Ghost Volume', 'Crystal Wire', 'Lunar DEX', 'Crossfade', 'Vector Frost', 'Frame Shift', 'Plasma Window', 'Afterhours', 'Spectra Gate', 'Glass Depth', 'Hash Garden', 'Night Relay', 'Pulse Harbor', 'Ocean Node', 'Sky Cache', 'Gamma Field', 'Quiet Tape', 'Zero Slip', 'Soft Orbit', 'Flash Market', 'Aurora Book'][i-1] || `Backdrop ${n}` });
  }
  return out;
})();
const DEFAULT_THEME = {
  id: "classic",
  a: "rgba(153,69,255,1)",
  b: "rgba(20,241,149,1)",
};

const FALLBACK_LINES = {
  gm: [
    "gm, hope your day starts easy",
    "good morning, nice read here",
    "gm, strong post and a clean start",
    "gm, hope the morning treats you well",
    "good morning, this was a solid read",
    "gm, wishing you a smooth day ahead",
  ],
  gn: [
    "gn, hope you get a calm reset tonight",
    "good night, soft close here",
    "gn, rest well after this one",
    "good night, hope you get an easy reset",
    "gn, calm post to end the day on",
    "good night, sleep well tonight",
  ],
};

let lastThemeSignature = "";

const state = {
  base: DEFAULT_BASE,
  handle: "",
  token: "",
  mode: "mid",
  lastText: "",
  extTheme: "classic",
  extView: "theme",
  extWallpaper: "",
  extCustomBg: "",
  themeCatalog: null,
  cache: { gm: [], gn: [] },
  fallbackIndex: { gm: 0, gn: 0 },
  alertsEnabled: true,
  alertsInterval: 5,
};

// Ensure legacy wallpaper ids don't break the popup after packs are cleaned
function canonicalExtWallpaperId(id){
  const v = String(id||'').trim().toLowerCase();
  if (!v) return '';
  if (v === "custom_upload") return "custom_upload";
  if (EXT_WALLPAPER_OPTIONS.some(x=>String(x.id||'').toLowerCase()===v)) return v;
  let m = v.match(/^extv3_(\d{1,2})$/i);
  if (m) {
    const n = String(Math.max(1, Math.min(58, Number(m[1]) || 1))).padStart(2, '0');
    return `extv3_${n}`;
  }
  m = v.match(/^ext_free_(\d{1,2})$/i);
  if (m) {
    const n = String(Math.max(1, Math.min(2, Number(m[1]) || 1))).padStart(2, '0');
    return `ext_free_${n}`;
  }
  m = v.match(/^ext_(\d{1,2})$/i);
  if (m) {
    const num = Math.max(1, Math.min(58, Number(m[1]) || 1));
    return `extv3_${String(num).padStart(2, '0')}`;
  }
  if (/^lux_ext_[a-z0-9_]+$/i.test(v)) return v;
  return 'ext_free_01';
}

function normalizeWallpaperOptionId(id){
  return canonicalExtWallpaperId(id);
}

function getExtensionSurface() {
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

function normalizeExtView(raw) {
  const value = String(raw || "").trim().toLowerCase();
  return ["theme", "wall", "custom"].includes(value) ? value : "theme";
}

function sanitizeThemeId(raw, catalog) {
  const value = String(raw || "").trim();
  if (!value) return DEFAULT_THEME.id;
  if (Array.isArray(catalog) && catalog.some((item) => String(item && item.id || "").trim() === value)) return value;
  return DEFAULT_THEME.id;
}

const el = {
  openSite: document.getElementById("openSite"),
  openArcade: document.getElementById("openArcade"),
  openArcadeGotd: document.getElementById("openArcadeGotd"),
  openX: document.getElementById("openX"),
  openQuick: document.getElementById("openQuick"),
  syncSiteBtn: document.getElementById("syncSiteBtn"),
  modeSelect: document.getElementById("modeSelect"),
  copyGm: document.getElementById("copyGm"),
  copyBestGm: document.getElementById("copyBestGm"),
  copyGn: document.getElementById("copyGn"),
  copyBestGn: document.getElementById("copyBestGn"),
  copyStatus: document.getElementById("copyStatus"),
  previewText: document.getElementById("previewText"),
  sessionValue: document.getElementById("sessionValue"),
  sessionHint: document.getElementById("sessionHint"),
  handleInput: document.getElementById("handleInput"),
  connectBtn: document.getElementById("connectBtn"),
  disconnectBtn: document.getElementById("disconnectBtn"),
  connectStatus: document.getElementById("connectStatus"),
  planValue: document.getElementById("planValue"),
  baseValue: document.getElementById("baseValue"),
  gmUsed: document.getElementById("gmUsed"),
  gnUsed: document.getElementById("gnUsed"),
  refEligible: document.getElementById("refEligible"),
  refConfirmed: document.getElementById("refConfirmed"),
  statsHint: document.getElementById("statsHint"),
  shortcutHint: document.getElementById("shortcutHint"),
  alertsEnabled: document.getElementById("alertsEnabled"),
  alertsInterval: document.getElementById("alertsInterval"),
  alertsStatus: document.getElementById("alertsStatus"),
};

function normalizeHandle(raw) {
  const cleaned = String(raw || "").trim().replace(/^@+/, "").replace(/\s+/g, "");
  if (!cleaned) return "";
  return /^[A-Za-z0-9_]{1,15}$/.test(cleaned) ? cleaned : "";
}

function normalizeBase(raw) {
  const value = String(raw || "").trim();
  if (!value) return DEFAULT_BASE;
  try {
    const url = new URL(value);
    const origin = String(url.origin || DEFAULT_BASE).replace(/\/$/, "");
    const host = String(url.hostname || "").toLowerCase();
    if (["www.gmxreply.com", "gmxreply.com", "localhost", "127.0.0.1"].includes(host)) return origin;
  } catch {}
  return DEFAULT_BASE;
}

function replyShapeKey(text) {
  let value = String(text || "").trim().toLowerCase();
  if (!value) return "";
  try { value = value.replace(/\p{Extended_Pictographic}/gu, " "); } catch {}
  value = value
    .replace(/\b(gm|good morning|morning)\b/g, "gm")
    .replace(/\b(gn|good night|night)\b/g, "gn")
    .replace(/\b(legend|ser|mate|dear|builder|king|bro|homie|degen|friend)\b/g, "@voc")
    .replace(/\b(good one|nice post|clean one|strong post|solid post|good post|clean post|strong take|solid take|clean read|good read|nice gm)\b/g, "@post")
    .replace(/\b(sleep easy|sleep well|rest easy|rest well|good rest|real rest|proper rest|easy reset|soft landing|calm close|easy close|soft close)\b/g, "@close")
    .replace(/\b(start the day|start the session|open the day|open the morning|open the session|close the day|end the day)\b/g, "@phase")
    .replace(/\b(good|nice|solid|strong|clean|calm|soft|easy|quiet|smooth|kind|warm|steady|proper|real)\b/g, "@adj")
    .replace(/[^a-z0-9\s]+/g, " ")
    .replace(/\b(a|an|the|and|to|your|you|on|this|that|here|today|tonight|tomorrow|back|really|just|one|side)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return value;
}

function uniq(list) {
  const out = [];
  const seen = new Set();
  const seenShapes = new Set();
  for (const item of list || []) {
    const key = String(item || "").trim();
    if (!key) continue;
    const exact = key.toLowerCase();
    const shape = replyShapeKey(key);
    if (seen.has(exact)) continue;
    if (shape && seenShapes.has(shape)) continue;
    seen.add(exact);
    if (shape) seenShapes.add(shape);
    out.push(key);
  }
  return out;
}

function isSiteUrl(url) {
  try {
    const parsed = new URL(String(url || ""));
    const host = String(parsed.hostname || "").toLowerCase();
    return host === "www.gmxreply.com" || host === "gmxreply.com" || host === "localhost" || host === "127.0.0.1";
  } catch {
    return false;
  }
}


function parseColorChannels(raw, fallback = [110, 231, 255]) {
  const match = String(raw || "").match(/rgba?\(\s*([0-9.]+)\s*,\s*([0-9.]+)\s*,\s*([0-9.]+)/i);
  if (!match) return fallback;
  return [1, 2, 3].map((index) => {
    const value = Math.round(Number(match[index] || 0));
    return Math.max(0, Math.min(255, Number.isFinite(value) ? value : fallback[index - 1]));
  });
}

function withAlpha(raw, alpha, fallback = [110, 231, 255]) {
  const [r, g, b] = parseColorChannels(raw, fallback);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

async function loadBundledThemeCatalog() {
  try {
    const response = await fetch(chrome.runtime.getURL("themes.json"), { cache: "no-store" });
    const data = await response.json().catch(() => null);
    const bundled = Array.isArray(data && data.themes) ? data.themes : [];
    return bundled.length ? bundled : [];
  } catch {
    return [];
  }
}

async function getThemeCatalog() {
  if (Array.isArray(state.themeCatalog)) return state.themeCatalog;
  let list = [];

  try {
    const response = await fetch(`${normalizeBase(state.base)}/themes.json`, { cache: "no-store" });
    const data = await response.json().catch(() => null);
    const remote = Array.isArray(data && data.themes) ? data.themes : [];
    // Thin client: site catalog is the source of truth.
    if (remote.length) list = remote;
  } catch {}

  if (!list.length) {
    try { list = await loadBundledThemeCatalog(); } catch {}
  }

  state.themeCatalog = list.length ? list : [DEFAULT_THEME];
  return state.themeCatalog;
}

async function applyThemeUi() {
  const list = await getThemeCatalog();

  const pickedId = sanitizeThemeId(state.extTheme, list);
  const requestedView = normalizeExtView(state.extView || "theme");
  state.extTheme = pickedId;
  state.extView = requestedView;
  const theme = list.find((item) => String(item && item.id || "") === pickedId)
    || list.find((item) => String(item && item.id || "") === DEFAULT_THEME.id)
    || DEFAULT_THEME;
  const a = String(theme && theme.a || DEFAULT_THEME.a);
  const b = String(theme && theme.b || DEFAULT_THEME.b);
  const root = document.documentElement;
  if (!root) return;

  let wallSource = "";
  if (requestedView === "custom" && state.extCustomBg) {
    wallSource = state.extCustomBg;
  } else if (requestedView === "wall" && state.extWallpaper) {
    if ((state.extWallpaper === "custom_upload" || String(state.extWallpaper || "").toLowerCase() === "custom_upload") && state.extCustomBg) {
      wallSource = state.extCustomBg;
    } else {
      wallSource = await resolveWallpaperSource(state.base, state.extWallpaper);
    }
  }
  const effectiveView = wallSource ? requestedView : "theme";
  state.extView = effectiveView;
  const hasWallView = Boolean(wallSource);
  const themeSignature = [normalizeBase(state.base), String(theme && theme.id || DEFAULT_THEME.id), effectiveView, String(state.extWallpaper || ""), String(state.extCustomBg || ""), a, b].join("|");
  if (themeSignature === lastThemeSignature) return;
  lastThemeSignature = themeSignature;

  root.style.setProperty("--accent", a);
  root.style.setProperty("--accent2", b);
  root.style.setProperty("--accent-soft", withAlpha(a, 0.28));
  root.style.setProperty("--accent2-soft", withAlpha(b, 0.30));
  root.style.setProperty("--border", withAlpha(a, 0.24));
  root.style.setProperty("--border-strong", withAlpha(a, 0.42));
  root.style.setProperty("--overlayA", withAlpha(a, hasWallView ? 0.16 : 0.28));
  root.style.setProperty("--overlayB", withAlpha(b, hasWallView ? 0.14 : 0.24));
  root.style.setProperty("--bg", `radial-gradient(circle at 12% 0%, ${withAlpha(a, 0.26)} 0%, transparent 34%), radial-gradient(circle at 100% 0%, ${withAlpha(b, 0.22)} 0%, transparent 28%), linear-gradient(180deg, rgba(7,11,20,0.98) 0%, rgba(8,12,22,0.94) 24%, rgba(6,10,18,1) 100%)`);
  root.style.setProperty("--card", `linear-gradient(180deg, ${withAlpha(a, 0.20)} 0%, rgba(10,14,26,0.90) 24%, ${withAlpha(b, 0.16)} 100%)`);
  root.style.setProperty("--surface", hasWallView ? "rgba(8,12,22,0.46)" : "rgba(13,18,32,0.80)");
  root.style.setProperty("--surface-strong", hasWallView ? "rgba(8,12,22,0.62)" : "rgba(12,17,30,0.90)");
  root.style.setProperty("--input", hasWallView ? "rgba(9,14,24,0.56)" : "rgba(13,18,32,0.78)");
  root.style.setProperty("--btn-hover", hasWallView ? "rgba(255,255,255,0.12)" : withAlpha(a, 0.20));
  root.style.setProperty("--danger-soft", "rgba(255,255,255,0.028)");
  root.style.setProperty("--muted", "rgba(248, 251, 255, 0.98)");
  root.style.setProperty("--dim", hasWallView ? "rgba(232, 240, 255, 0.90)" : "rgba(224, 236, 255, 0.86)");
  root.style.setProperty("--wall", wallSource ? cssUrl(wallSource) : "none");

  if (document.body) {
    document.body.setAttribute("data-ext-theme", String(theme && theme.id || DEFAULT_THEME.id));
    document.body.setAttribute("data-ext-view", effectiveView);
    document.body.classList.toggle("has-wallpaper", Boolean(wallSource));
  }
}

function cssUrl(raw) {
  const value = String(raw || "").trim();
  if (!value) return "none";
  return "url('" + value.replace(/'/g, "%27") + "')";
}

const __WALL_PREFETCH = new Map();
function prefetchWallpaper(url){
  try{
    const u = String(url||'').trim();
    if (!u) return;
    if (__WALL_PREFETCH.has(u)) return;
    const img = new Image();
    img.decoding = 'async';
    img.onload = ()=>{ try{ if (img.decode) img.decode(); }catch{} };
    img.src = u;
    __WALL_PREFETCH.set(u, true);
  }catch{}
}

const WALL_CACHE = new Map();

function svgDataUri(svg) {
  return `data:image/svg+xml;utf8,${encodeURIComponent(String(svg || ""))}`;
}

const EXT_PACK_PALETTES = [
  { tag: "GM", c1: "#9945ff", c2: "#14f195" },
  { tag: "DEGEN", c1: "#ff6b35", c2: "#f7931a" },
  { tag: "ALPHA", c1: "#00d4ff", c2: "#7c3aed" },
  { tag: "WAGMI", c1: "#22c55e", c2: "#10b981" },
  { tag: "NGMI", c1: "#ef4444", c2: "#f97316" },
  { tag: "LFG", c1: "#8b5cf6", c2: "#ec4899" },
  { tag: "SER", c1: "#06b6d4", c2: "#3b82f6" },
  { tag: "APE", c1: "#eab308", c2: "#f59e0b" },
  { tag: "MOON", c1: "#a855f7", c2: "#6366f1" },
  { tag: "CHAD", c1: "#14b8a6", c2: "#0d9488" },
  { tag: "SIZE", c1: "#f43f5e", c2: "#ec4899" },
  { tag: "CT", c1: "#64748b", c2: "#94a3b8" }
];

function extPackWallpaperDataUri(id, thumb) {
  const n = Math.max(1, Number(String(id || "").slice(6)) || 1);
  const p = EXT_PACK_PALETTES[(n - 1) % EXT_PACK_PALETTES.length];
  const w = thumb ? 360 : 1080;
  const h = thumb ? 640 : 1920;
  const blur = thumb ? 40 : 120;
  const orbs = [
    { cx: 0.2 + (n % 5) * 0.1, cy: 0.25, r: 0.5, c: p.c1, op: 0.2 },
    { cx: 0.8 - (n % 4) * 0.1, cy: 0.7, r: 0.4, c: p.c2, op: 0.18 },
    { cx: 0.5, cy: 0.5, r: 0.35, c: p.c1, op: 0.06 }
  ];
  const orbEls = orbs.map(o=>`<ellipse cx="${w*o.cx}" cy="${h*o.cy}" rx="${w*o.r}" ry="${h*o.r*0.8}" fill="${o.c}" opacity="${o.op}" filter="url(#blur)"/>`).join("");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}"><defs><linearGradient id="bg" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stop-color="#070a12"/><stop offset="100%" stop-color="#050810"/></linearGradient><filter id="blur"><feGaussianBlur stdDeviation="${blur}"/></filter></defs><rect width="${w}" height="${h}" fill="url(#bg)"/>${orbEls}</svg>`;
  return svgDataUri(svg);
}

function normalizeExtWallpaperId(raw) {
  return canonicalExtWallpaperId(raw);
}

async function resolveWallpaperSource(base, wallpaperId) {
  const id = normalizeExtWallpaperId(wallpaperId);
  if (!id) return "";

  const cacheKey = `${normalizeBase(base)}::${id}`;
  if (WALL_CACHE.has(cacheKey)) return WALL_CACHE.get(cacheKey) || "";

  const origin = normalizeBase(base);
  if (id.startsWith("custom_")) {
    const remote = `${origin}/assets/extbg/custom/${encodeURIComponent(id.slice(7))}?v=${ASSET_REV}`;
    WALL_CACHE.set(cacheKey, remote);
    try{ prefetchWallpaper(remote); }catch{}
    return remote;
  }
  if (id.startsWith("extv3_")) {
    const remote = `${origin}/assets/extbg/${encodeURIComponent(id)}.webp?v=${ASSET_REV}`;
    WALL_CACHE.set(cacheKey, remote);
    try{ prefetchWallpaper(remote); }catch{}
    return remote;
  }
  const localUrl = chrome.runtime.getURL(`extbg/${encodeURIComponent(id)}.svg`);
  WALL_CACHE.set(cacheKey, localUrl);
  try{ prefetchWallpaper(localUrl); }catch{}
  return localUrl;
}

function friendlyError(result) {
  const raw = String(
    result?.data?.hint ||
    result?.data?.error_code ||
    result?.data?.error ||
    result?.error ||
    "Request failed"
  );
  if (/existing_session_required|open_site_or_use_existing_session|token_required_for_rotate/i.test(raw)) {
    return "This account already exists. Use site session instead.";
  }
  if (/Failed to fetch|network_error/i.test(raw)) {
    return "Could not reach the backend right now";
  }
  return raw;
}

function scoreTemplate(text) {
  const value = String(text || "").trim();
  if (!value) return -9999;

  const len = value.length;
  const words = value.split(/\s+/).filter(Boolean);
  const lower = value.toLowerCase();
  const clauses = value.split(",").map((part) => String(part || "").trim()).filter(Boolean);
  let score = 0;

  if (len >= 18 && len <= 86) score += 8;
  else if (len >= 12 && len <= 110) score += 4;
  else score -= 6;

  if (words.length >= 4 && words.length <= 11) score += 8;
  else if (words.length >= 3 && words.length <= 13) score += 4;
  else score -= 6;

  if (clauses.length <= 3) score += 4;
  else score -= (clauses.length - 3) * 3;

  if (/^(gm|gn)\b/i.test(value)) score += 6;
  try {
    const emojiHits = (value.match(/[\u{1F300}-\u{1FAFF}]/gu) || []).length;
    if (emojiHits === 1) score += 2;
    else if (emojiHits === 2) score += 1;
    else if (emojiHits > 2) score -= (emojiHits - 2) * 3;
  } catch {}
  if (/!/.test(value)) score -= 4;
  if (/[—–-]/.test(value)) score -= 4;

  if (/(coffee|brain|screen|pace|hour|desk|today|tonight|tomorrow|morning|night|rest|slow|sleep|reset|sunrise)/i.test(value)) score += 5;
  if (/(good morning|good night|hope|wishing|sleep easy|quiet reset|soft landing)/i.test(value)) score += 5;
  if (/(starting|keeping|calling|logging|leaving|waking|closing|working|loading|forcing|hoping|wishing)/i.test(value)) score += 4;

  const stale = ["clean", "good", "quiet", "simple", "steady", "calm"];
  for (const word of stale) {
    const matches = lower.match(new RegExp(`\\b${word}\\b`, "g"));
    const count = Array.isArray(matches) ? matches.length : 0;
    if (count > 1) score -= (count - 1) * 4;
  }

  if (/^(that|this|when|what|why|you|yeah|love|feels|there's)\b/i.test(value)) score -= 8;
  if (lower === "gm" || lower === "gn" || lower === "good morning" || lower === "good night") score -= 14;

  return score;
}

function baseCandidates(preferred) {
  return uniq([
    normalizeBase(preferred || state.base),
    normalizeBase(state.base),
    "http://127.0.0.1:5173",
    "http://localhost:5173",
    "http://127.0.0.1:10000",
    "http://localhost:10000",
    "https://www.gmxreply.com",
    "https://gmxreply.com",
  ]);
}

async function removeState(keys) {
  const list = Array.isArray(keys) ? keys.filter(Boolean) : [keys].filter(Boolean);
  if (!list.length) return;
  try { await chrome.storage.local.remove(list); } catch {}
}

async function saveState(partial) {
  try {
    await chrome.storage.local.set(partial);
  } catch {}
}

async function saveAuthState(base, handle, token) {
  const safeBase = normalizeBase(base || state.base);
  const safeHandle = String(handle || "").trim();
  const safeToken = String(token || "").trim();
  state.base = safeBase;
  state.handle = safeHandle;
  state.token = safeToken;
  await saveState({
    [STORAGE_KEYS.base]: safeBase,
    [STORAGE_KEYS.handle]: safeHandle,
    [STORAGE_KEYS.token]: safeToken,
  });
  await removeState(LEGACY_STORAGE_KEYS);
}

async function loadState() {
  let data = {};
  try {
    data = await chrome.storage.local.get([
      ...Object.values(STORAGE_KEYS),
      ...Object.values(ALERT_KEYS),
      ...Object.values(LEGACY_KEYS),
      ...Object.values(THEME_KEYS),
      ...Object.values(LEGACY_THEME_KEYS),
    ]);
  } catch {}
  const hadLegacyValues = Boolean(data[LEGACY_KEYS.base] || data[LEGACY_KEYS.handle] || data[LEGACY_KEYS.token]);
  state.base = normalizeBase(data[STORAGE_KEYS.base] || data[LEGACY_KEYS.base] || DEFAULT_BASE);
  state.handle = String(data[STORAGE_KEYS.handle] || data[LEGACY_KEYS.handle] || "").trim();
  state.token = String(data[STORAGE_KEYS.token] || data[LEGACY_KEYS.token] || "").trim();
  if (hadLegacyValues) {
    await saveState({
      [STORAGE_KEYS.base]: state.base,
      [STORAGE_KEYS.handle]: state.handle,
      [STORAGE_KEYS.token]: state.token,
    });
    await removeState(LEGACY_STORAGE_KEYS);
  }
  state.mode = ["min", "mid", "max"].includes(String(data[STORAGE_KEYS.mode] || "")) ? String(data[STORAGE_KEYS.mode]) : "mid";
  state.lastText = String(data[STORAGE_KEYS.lastText] || "").trim();
  const hadLegacyThemeValues = Boolean(data[LEGACY_THEME_KEYS.extTheme] || data[LEGACY_THEME_KEYS.extView] || data[LEGACY_THEME_KEYS.extWallpaper] || data[LEGACY_THEME_KEYS.extCustomBg]);
  state.extTheme = String(data[THEME_KEYS.extTheme] || data[LEGACY_THEME_KEYS.extTheme] || data[THEME_KEYS.siteTheme] || DEFAULT_THEME.id).trim() || DEFAULT_THEME.id;
  state.extView = normalizeExtView(data[THEME_KEYS.extView] || data[LEGACY_THEME_KEYS.extView] || "theme");
  state.extWallpaper = pickSyncedWallpaperId(data);
  state.extCustomBg = String(data[THEME_KEYS.extCustomBg] || data[LEGACY_THEME_KEYS.extCustomBg] || "").trim();
  if (state.extView === "wall" && !state.extWallpaper) state.extView = "theme";
  if (state.extView === "custom" && !state.extCustomBg) state.extView = "theme";
  if (hadLegacyThemeValues) {
    await saveState({
      [THEME_KEYS.extTheme]: state.extTheme,
      [THEME_KEYS.extView]: state.extView,
      [THEME_KEYS.extWallpaper]: state.extWallpaper,
      [THEME_KEYS.extCustomBg]: state.extCustomBg,
    });
    await removeState(Object.values(LEGACY_THEME_KEYS));
  }
  if (el.handleInput) el.handleInput.value = state.handle ? `@${state.handle}` : "";
  if (el.modeSelect) el.modeSelect.value = state.mode;
  if (el.previewText) el.previewText.textContent = state.lastText || "Nothing copied yet";
  state.alertsEnabled = data[ALERT_KEYS.enabled] !== false;
  const interval = Number(data[ALERT_KEYS.interval] || 5);
  state.alertsInterval = [5, 10, 15].includes(interval) ? interval : 5;
  if (el.alertsEnabled) el.alertsEnabled.checked = !!state.alertsEnabled;
  if (el.alertsInterval) el.alertsInterval.value = String(state.alertsInterval);
  if (el.alertsStatus) {
    el.alertsStatus.textContent = state.alertsEnabled
      ? `Active. Poll every ${state.alertsInterval} min.`
      : "Disabled.";
  }
}

async function saveAlertSettings() {
  const enabled = !!(el.alertsEnabled && el.alertsEnabled.checked);
  const interval = Number(el.alertsInterval && el.alertsInterval.value || state.alertsInterval || 5);
  state.alertsEnabled = enabled;
  state.alertsInterval = [5, 10, 15].includes(interval) ? interval : 5;
  await saveState({
    [ALERT_KEYS.enabled]: state.alertsEnabled,
    [ALERT_KEYS.interval]: state.alertsInterval,
  });
  if (el.alertsStatus) {
    el.alertsStatus.textContent = state.alertsEnabled
      ? `Active. Poll every ${state.alertsInterval} min.`
      : "Disabled.";
  }
  try {
    chrome.runtime.sendMessage({
      type: "GMX_MARKET_ALERTS_CONFIG_CHANGED",
      enabled: state.alertsEnabled,
      interval: state.alertsInterval,
    });
  } catch {}
}

async function rememberBase(base) {
  const next = normalizeBase(base);
  if (next === state.base) return;
  state.base = next;
  await saveState({ [STORAGE_KEYS.base]: next });
  await removeState([LEGACY_KEYS.base]);
}

async function apiRequest(path, options = {}) {
  const method = options.method || "GET";
  const body = options.body ? JSON.stringify(options.body) : null;
  const token = options.token || state.token || "";
  const acceptStatuses = new Set([200, ...(options.acceptStatuses || [])]);

  let lastFailure = null;
  for (const base of baseCandidates(options.preferredBase)) {
    try {
      const headers = {
        "Accept": "application/json",
        "X-GMX-Client": "extension-safe-copy",
        "X-GMX-Ext-Version": "1.1.1",
      };
      if (body) headers["Content-Type"] = "application/json";
      if (token) headers["Authorization"] = `Bearer ${token}`;
      const response = await fetch(`${base}${path}`, {
        method,
        headers,
        body,
        cache: "no-store",
      });
      const data = await response.json().catch(() => null);
      if (acceptStatuses.has(response.status) || response.ok) {
        await rememberBase(base);
        return { ok: response.ok, status: response.status, data, base };
      }
      lastFailure = { ok: false, status: response.status, data, base };
      if (response.status >= 400 && response.status < 500 && response.status !== 404) {
        await rememberBase(base);
        return lastFailure;
      }
    } catch (error) {
      lastFailure = { ok: false, status: 0, error: String(error && error.message || error || "network_error") };
    }
  }
  return lastFailure || { ok: false, status: 0, error: "network_error" };
}

function applySessionUi() {
  const connected = Boolean(state.token && state.handle);
  if (el.sessionValue) el.sessionValue.textContent = connected ? `@${state.handle}` : "Guest";
  if (el.sessionHint) {
    el.sessionHint.textContent = connected
      ? "Connected through your site session. Copy stays manual and safe on X."
      : "Use site sync first for the clean setup. Manual handle connect is only a fallback for new accounts.";
  }
  if (el.baseValue) el.baseValue.textContent = state.base.replace(/^https?:\/\//, "");
}

function renderStats(usage, refStats) {
  const sub = usage && usage.sub || null;
  const plan = sub && (sub.isUnlimited || sub.tier === "unlimited")
    ? "Unlimited"
    : sub && sub.active
      ? "Paid"
      : state.token
        ? "Free"
        : "Guest";

  if (el.planValue) el.planValue.textContent = plan;
  if (el.gmUsed) el.gmUsed.textContent = usage && usage.gm ? `${usage.gm.used}/${usage.gm.limit}` : "—";
  if (el.gnUsed) el.gnUsed.textContent = usage && usage.gn ? `${usage.gn.used}/${usage.gn.limit}` : "—";
  if (el.refEligible) el.refEligible.textContent = refStats && Number.isFinite(Number(refStats.eligibleRefs)) ? String(refStats.eligibleRefs) : "—";
  if (el.refConfirmed) el.refConfirmed.textContent = refStats && Number.isFinite(Number(refStats.confirmedRefs)) ? String(refStats.confirmedRefs) : "—";
  if (el.statsHint) {
    el.statsHint.textContent = state.token
      ? "Connected snapshot from your backend. Buttons still only copy text."
      : "Offline fallback is ready. Buttons still only copy text.";
  }
}

function setConnectStatus(text, tone = "") {
  if (!el.connectStatus) return;
  el.connectStatus.textContent = text || "";
  el.connectStatus.className = `small${tone ? ` ${tone}` : ""}`;
}

function setCopyStatus(text, tone = "") {
  if (!el.copyStatus) return;
  el.copyStatus.textContent = text || "";
  el.copyStatus.className = `small${tone ? ` ${tone}` : ""}`;
}
function requestSignalPoll() {
  try { chrome.runtime.sendMessage({ type: "GMX_MARKET_SIGNAL_POLL_NOW" }); } catch {}
}

function consumeFromCache(kind, preferBest = false) {
  const queue = state.cache[kind] || [];
  if (!queue.length) return "";
  let index = 0;
  if (preferBest) {
    let bestScore = -Infinity;
    for (let i = 0; i < queue.length; i++) {
      const current = scoreTemplate(queue[i]);
      if (current > bestScore) {
        bestScore = current;
        index = i;
      }
    }
  }
  const [picked] = queue.splice(index, 1);
  return String(picked || "").trim();
}

function fallbackLine(kind, preferBest = false) {
  const safeKind = kind === "gn" ? "gn" : "gm";
  const baseList = Array.isArray(FALLBACK_LINES[safeKind]) ? [...FALLBACK_LINES[safeKind]] : [];
  if (!baseList.length) return "";
  if (preferBest) {
    baseList.sort((a, b) => scoreTemplate(b) - scoreTemplate(a));
    return String(baseList[0] || "").trim();
  }
  const index = state.fallbackIndex[safeKind] % baseList.length;
  state.fallbackIndex[safeKind] = index + 1;
  return String(baseList[index] || "").trim();
}

async function fetchBatch(kind, count = 6) {
  const safeKind = kind === "gn" ? "gn" : "gm";
  const safeMode = ["min", "mid", "max"].includes(state.mode) ? state.mode : "mid";
  const path = state.token
    ? `/api/generate-bulk?kind=${safeKind}&mode=${safeMode}&count=${Math.max(1, Math.min(10, count))}`
    : `/api/public/random-bulk?kind=${safeKind}&mode=${safeMode}&count=${Math.max(1, Math.min(10, count))}`;
  const result = await apiRequest(path, { acceptStatuses: [401, 403] });
  if (!result.ok || !result.data) {
    if (result.status === 401 || result.status === 403) {
      await saveAuthState(state.base, "", "");
      applySessionUi();
      renderStats(null, null);
    }
    return [];
  }
  const list = Array.isArray(result.data.list) ? result.data.list : (result.data.reply ? [result.data.reply] : []);
  return uniq(list.map((item) => String(item || "").trim()));
}

async function ensureCache(kind, minItems) {
  const queue = state.cache[kind] || [];
  if (queue.length >= minItems) return;
  const fresh = await fetchBatch(kind, Math.max(4, minItems));
  if (!fresh.length) return;
  state.cache[kind] = uniq([...queue, ...fresh]);
}

async function copyToClipboard(text) {
  const value = String(text || "").trim();
  if (!value) throw new Error("Nothing to copy");
  try {
    await navigator.clipboard.writeText(value);
    return;
  } catch {}

  const area = document.createElement("textarea");
  area.value = value;
  area.setAttribute("readonly", "readonly");
  area.style.position = "fixed";
  area.style.opacity = "0";
  area.style.pointerEvents = "none";
  document.body.appendChild(area);
  area.select();
  const ok = document.execCommand("copy");
  area.remove();
  if (!ok) throw new Error("Clipboard blocked");
}

async function persistLastText(text) {
  const value = String(text || "").trim();
  state.lastText = value;
  await saveState({ [STORAGE_KEYS.lastText]: value });
}

async function copyKind(kind, preferBest = false) {
  const safeKind = kind === "gn" ? "gn" : "gm";
  setCopyStatus(`Loading ${preferBest ? "best " : ""}${safeKind.toUpperCase()}...`);
  await ensureCache(safeKind, preferBest ? 5 : 1);
  let picked = consumeFromCache(safeKind, preferBest);
  if (!picked) {
    const fresh = await fetchBatch(safeKind, preferBest ? 6 : 1);
    state.cache[safeKind] = uniq([...(state.cache[safeKind] || []), ...fresh]);
    picked = consumeFromCache(safeKind, preferBest);
  }
  if (!picked) {
    picked = fallbackLine(safeKind, preferBest);
  }
  if (!picked) {
    setCopyStatus("Could not load text right now", "bad");
    return;
  }

  try {
    await copyToClipboard(picked);
    if (el.previewText) el.previewText.textContent = picked;
    await persistLastText(picked);
    setCopyStatus(`Copied ${preferBest ? "best " : ""}${safeKind.toUpperCase()} to clipboard`, "good");
    if ((state.cache[safeKind] || []).length < 3) {
      void ensureCache(safeKind, 5);
    }
  } catch (error) {
    setCopyStatus(String(error && error.message || "Clipboard blocked"), "bad");
  }
}

async function refreshSnapshot() {
  applySessionUi();
  if (!state.token) {
    renderStats(null, null);
    void ensureCache("gm", 4);
    void ensureCache("gn", 4);
    return;
  }

  const usage = await apiRequest("/api/usage", { acceptStatuses: [401, 403] });
  if (usage.status === 401 || usage.status === 403) {
    await saveAuthState(state.base, "", "");
    applySessionUi();
    renderStats(null, null);
    setConnectStatus("Saved session expired. Use site session again.", "bad");
    return;
  }

  const refs = await apiRequest("/api/referral/stats", { acceptStatuses: [401, 403] });
  renderStats(usage.ok ? usage.data : null, refs.ok ? refs.data : null);
  requestSignalPoll();
  void ensureCache("gm", 4);
  void ensureCache("gn", 4);
}

async function queryAllTabs() {
  try {
    return await chrome.tabs.query({});
  } catch {
    try {
      return await chrome.tabs.query({ currentWindow: true });
    } catch {
      return [];
    }
  }
}

async function syncFromSite(options = {}) {
  const openIfMissing = options.openIfMissing !== false;
  const silent = options.silent === true;
  if (!silent) setConnectStatus("Looking for an open site tab...");
  const tabs = await queryAllTabs();
  const siteTabs = (tabs || []).filter((tab) => isSiteUrl(tab.url));

  if (!siteTabs.length) {
    if (openIfMissing) {
      await openTab(`${state.base || DEFAULT_BASE}/app`);
      if (!silent) setConnectStatus("Opened the site. If you are already logged in there, click Use site session again.");
    } else if (!silent) {
      setConnectStatus("No site tab found", "bad");
    }
    return false;
  }

  let responded = false;
  for (const tab of siteTabs) {
    if (!Number.isFinite(tab.id)) continue;
    try {
      const response = await chrome.tabs.sendMessage(tab.id, { type: "GMX_FORCE_SITE_SYNC" });
      if (response && response.ok) responded = true;
      if (response && response.ok) {
        const syncPayload = {};
        if (response.base) {
          syncPayload[STORAGE_KEYS.base] = normalizeBase(response.base);
        }
        if (typeof response.handle === 'string') {
          syncPayload[STORAGE_KEYS.handle] = String(response.handle || '').trim();
        }
        if (typeof response.token === 'string') {
          syncPayload[STORAGE_KEYS.token] = String(response.token || '').trim();
        }
        if (typeof response.extTheme === 'string') syncPayload[THEME_KEYS.extTheme] = String(response.extTheme || '').trim();
        if (typeof response.siteTheme === 'string') syncPayload[THEME_KEYS.siteTheme] = String(response.siteTheme || '').trim();
        if (typeof response.extView === 'string') syncPayload[THEME_KEYS.extView] = String(response.extView || '').trim();
        if (typeof response.extWallpaper === 'string') syncPayload[THEME_KEYS.extWallpaper] = normalizeWallpaperOptionId(response.extWallpaper);
        if (typeof response.extWallpaperPopup === 'string') syncPayload[THEME_KEYS.extWallpaperPopup] = normalizeWallpaperOptionId(response.extWallpaperPopup);
        if (typeof response.extWallpaperQuick === 'string') syncPayload[THEME_KEYS.extWallpaperQuick] = normalizeWallpaperOptionId(response.extWallpaperQuick);
        if (typeof response.extCustomBg === 'string') syncPayload[THEME_KEYS.extCustomBg] = String(response.extCustomBg || '').trim();
        if (Object.keys(syncPayload).length) await saveState(syncPayload);
      }
    } catch {}
  }

  await new Promise((resolve) => setTimeout(resolve, responded ? 60 : 220));
  await loadState();
  await applyThemeUi();
  applySessionUi();
  await refreshSnapshot();

  if (state.token && state.handle) {
    if (!silent) setConnectStatus(`Using site session @${state.handle}`, "good");
    return true;
  }
  if (!silent) {
    setConnectStatus(
      responded
        ? "Site tab responded, but no active site session was found"
        : "Site tab found, but sync did not return a session",
      "bad"
    );
  }
  return false;
}

async function connectHandle() {
  const handle = normalizeHandle(el.handleInput && el.handleInput.value);
  if (!handle) {
    setConnectStatus("Enter a valid @handle", "bad");
    return;
  }
  setConnectStatus("Connecting...");
  const result = await apiRequest("/api/user/init", {
    method: "POST",
    body: { handle },
  });
  if (!result.ok || !result.data || !result.data.token) {
    const msg = friendlyError(result);
    if (/Use site session instead/i.test(msg)) {
      setConnectStatus("This handle already exists. Trying site sync...");
      const synced = await syncFromSite({ openIfMissing: true, silent: true });
      if (synced) {
        setConnectStatus(`Using site session @${state.handle}`, "good");
        return;
      }
    }
    setConnectStatus(msg, "bad");
    return;
  }

  await saveAuthState(result.base || state.base, String(result.data.handle || handle), String(result.data.token || ""));
  if (el.handleInput) el.handleInput.value = state.handle ? `@${state.handle}` : "";
  setConnectStatus("Connected", "good");
  await refreshSnapshot();
}

async function resetSession() {
  state.cache = { gm: [], gn: [] };
  await saveAuthState(state.base, "", "");
  if (el.handleInput) el.handleInput.value = "";
  setConnectStatus("Local extension session cleared");
  await refreshSnapshot();
}

async function openTab(url) {
  try {
    await chrome.tabs.create({ url });
  } catch {
    window.open(url, "_blank", "noopener,noreferrer");
  }
}

async function openQuickPanel() {
  try {
    const result = await chrome.runtime.sendMessage({ type: "GMX_OPEN_QUICK_PANEL" });
    if (result && result.ok) return;
  } catch {}
  await openTab(chrome.runtime.getURL("quick.html"));
}

function bindEvents() {
  if (el.modeSelect) {
    el.modeSelect.addEventListener("change", async () => {
      state.mode = ["min", "mid", "max"].includes(el.modeSelect.value) ? el.modeSelect.value : "mid";
      state.cache = { gm: [], gn: [] };
      await saveState({ [STORAGE_KEYS.mode]: state.mode });
      setCopyStatus(`Mode saved: ${state.mode.toUpperCase()}`);
      void ensureCache("gm", 4);
      void ensureCache("gn", 4);
    });
  }
  if (el.alertsEnabled) {
    el.alertsEnabled.addEventListener("change", () => { void saveAlertSettings(); });
  }
  if (el.alertsInterval) {
    el.alertsInterval.addEventListener("change", () => { void saveAlertSettings(); });
  }

  if (el.copyGm) el.copyGm.addEventListener("click", () => void copyKind("gm", false));
  if (el.copyBestGm) el.copyBestGm.addEventListener("click", () => void copyKind("gm", true));
  if (el.copyGn) el.copyGn.addEventListener("click", () => void copyKind("gn", false));
  if (el.copyBestGn) el.copyBestGn.addEventListener("click", () => void copyKind("gn", true));

  if (el.syncSiteBtn) el.syncSiteBtn.addEventListener("click", () => void syncFromSite({ openIfMissing: true }));
  if (el.connectBtn) el.connectBtn.addEventListener("click", () => void connectHandle());
  if (el.disconnectBtn) el.disconnectBtn.addEventListener("click", () => void resetSession());
  if (el.handleInput) {
    el.handleInput.addEventListener("keydown", (event) => {
      if (event.key === "Enter") void connectHandle();
    });
  }


  if (el.openQuick) el.openQuick.addEventListener("click", () => void openQuickPanel());
  if (el.openSite) el.openSite.addEventListener("click", () => void openTab(`${state.base || DEFAULT_BASE}/app`));
  if (el.openArcade) el.openArcade.addEventListener("click", () => void openTab(`${state.base || DEFAULT_BASE}/arcade.html`));
  if (el.openArcadeGotd) el.openArcadeGotd.addEventListener("click", () => void openTab(`${state.base || DEFAULT_BASE}/arcade.html`));
  if (el.openX) el.openX.addEventListener("click", () => void openTab("https://x.com"));

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== "local" || !changes) return;
    const authKeys = new Set([
      STORAGE_KEYS.base,
      STORAGE_KEYS.handle,
      STORAGE_KEYS.token,
      LEGACY_KEYS.base,
      LEGACY_KEYS.handle,
      LEGACY_KEYS.token,
    ]);
    const themeKeys = new Set([
      ...Object.values(THEME_KEYS),
      ...Object.values(LEGACY_THEME_KEYS),
    ]);
    let needsAuthRefresh = false;
    let needsThemeRefresh = false;
    let needsPreviewRefresh = false;

    for (const key of Object.keys(changes)) {
      if (authKeys.has(key)) needsAuthRefresh = true;
      if (themeKeys.has(key)) needsThemeRefresh = true;
      if (key === STORAGE_KEYS.lastText) needsPreviewRefresh = true;
    }

    if (!needsAuthRefresh && !needsThemeRefresh && !needsPreviewRefresh) return;

    void (async () => {
      await loadState();
      if (needsPreviewRefresh && el.previewText) {
        el.previewText.textContent = state.lastText || "Nothing copied yet";
      }
      if (needsThemeRefresh || needsAuthRefresh) {
        await applyThemeUi();
      }
      if (needsAuthRefresh) {
        applySessionUi();
        await refreshSnapshot();
      }
    })();
  });
}

(async function init() {
  bindEvents();
  await loadState();
  await applyThemeUi();
  applySessionUi();
  if (el.shortcutHint) {
    el.shortcutHint.textContent = "Optional shortcut: assign one yourself in chrome://extensions/shortcuts for \"Open GMXReply quick panel\"";
  }
  await syncFromSite({ openIfMissing: false, silent: true });
  await refreshSnapshot();
})();
