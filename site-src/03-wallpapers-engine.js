  // Wallpapers — per-tab. Photo pack (webp under /assets/wallpapers/v2_*.webp).
  const LS_WP_GLOBAL = K.WP_GLOBAL;
  const LS_WP_TAB_PREFIX = K.WP_TAB_PREFIX;
  const SITE_WALLPAPER_PACK_COUNT = 58;
  const SITE_WALLPAPER_FREE_PACK_COUNT = 10;
  const SITE_PACK_NAMES = [
    "Coastal Dawn",
    "Forest Mist",
    "Mountain Lake",
    "City Sunset",
    "Desert Dunes",
    "Ocean Horizon",
    "Nordic Fjord",
    "Rainy Street",
    "Cherry Blossom",
    "Golden Hour",
    "Misty Pines",
    "Alpine Meadow",
    "River Bend",
    "Cliff Coast",
    "Lavender Field",
    "Autumn Trail",
    "Snow Peak",
    "Bamboo Grove",
    "Harbor Lights",
    "Vineyard Hills",
    "Canyon View",
    "Tropical Cove",
    "Urban Night",
    "Meadow Bloom",
    "Glacier Bay",
    "Sandstone Arch",
    "Waterfall Glen",
    "Prairie Wind",
    "Island Palm",
    "Moonlit Bay",
    "Cedar Forest",
    "Rose Garden",
    "Stone Bridge",
    "Lighthouse Shore",
    "Wildflower Hill",
    "Cloud Valley",
    "Emerald Coast",
    "Silver Lake",
    "Amber Woods",
    "Coral Reef",
    "Indigo Sky",
    "Morning Fog",
    "Twilight Pier",
    "Bamboo Path",
    "Rocky Shore",
    "Savanna Gold",
    "Maple Lane",
    "Crystal Cave",
    "Dunescape",
    "Orchid Green",
    "Vineyard Dawn",
    "Ice Lagoon",
    "Red Rock",
    "Moss Garden",
    "Delta Mirror",
    "Panorama Ridge",
    "Silk Clouds",
    "Cedar Sunset"
  ];
  const CRYPTO_SITE_WALL_SOURCES = [];
  function buildSiteWallpapers(){
    const out = [];
    for (let i=1; i<=SITE_WALLPAPER_PACK_COUNT; i++){
      const m = cryptoWallpaperMotif(i);
      const n = String(i).padStart(3, "0");
      out.push({
        id: `v2_${n}`,
        name: `${m.label} • ${m.sub} #${i}`,
        tier: i <= SITE_WALLPAPER_FREE_PACK_COUNT ? "free" : "premium"
      });
    }
    return out;
  }
  const WALLPAPERS = buildSiteWallpapers();
  const WALLPAPER_REFRESH_MIGRATION_KEY = K.WALLPAPER_REFRESH_MIGRATION;
  function migrateLegacyWallpaperSelectionOnce(){
    try{
      if (localStorage.getItem(WALLPAPER_REFRESH_MIGRATION_KEY) === "1") return;
      const mapLegacy = (id) => {
        const v = String(id || "").trim();
        if (!v) return "";
        if (/^free0[12]$/i.test(v) || /^w\d+$/i.test(v) || /^v3_\d+$/i.test(v) || /^lux_/i.test(v)) return "v2_001";
        if (v.startsWith("v2_")) return v;
        return "v2_001";
      };
      const g = mapLegacy(localStorage.getItem(LS_WP_GLOBAL));
      if (g) localStorage.setItem(LS_WP_GLOBAL, g); else localStorage.removeItem(LS_WP_GLOBAL);
      for (const [tab] of WALLPAPER_TABS){
        const k = wallpaperKeyForTab(tab);
        const norm = mapLegacy(localStorage.getItem(k));
        if (norm) localStorage.setItem(k, norm); else localStorage.removeItem(k);
      }
      localStorage.setItem(WALLPAPER_REFRESH_MIGRATION_KEY, "1");
    }catch{}
  }

  const WALLPAPER_TABS = [
    ["all","wp_apply_all"],
    ["home","wp_apply_home"],
    ["gm","wp_apply_gm"],
    ["gn","wp_apply_gn"],
    ["prediction","wp_apply_prediction"],
    ["studio","wp_apply_studio"],
    ["packs","wp_apply_packs"],
    ["bulk","wp_apply_bulk"],
    ["history","wp_apply_history"],
    ["favorites","wp_apply_favorites"],
    ["referrals","wp_apply_referrals"],
    ["themes","wp_apply_themes"],
    ["extthemes","wp_apply_extthemes"],
    ["wallet","wp_apply_wallet"]
  ];

  const CUSTOM_WP_RE = /^custom_[a-zA-Z0-9_.-]+\.(png|jpg|jpeg|webp)$/i;
  const CUSTOM_WP_FREE_COUNT = 5;
  const CUSTOM_UPLOAD_ID = "custom_upload";
  let CUSTOM_WALLPAPERS_SITE = [];
  let CUSTOM_WALLPAPERS_EXT = [];
  let CUSTOM_WALLPAPERS_LOADED = false;
  async function loadCustomWallpapers(){
    if (CUSTOM_WALLPAPERS_LOADED) return false;
    try{
      const r = await fetch("/api/wallpapers/custom", { cache:"no-store" });
      const j = await r.json();
      if (j?.ok){
        CUSTOM_WALLPAPERS_LOADED = true;
        CUSTOM_WALLPAPERS_SITE = (j.site||[]).map(x=>({ ...x, tier:"custom" }));
        CUSTOM_WALLPAPERS_EXT = (j.ext||[]).map(x=>({ ...x, tier:"custom" }));
        return CUSTOM_WALLPAPERS_SITE.length > 0 || CUSTOM_WALLPAPERS_EXT.length > 0;
      }
    }catch{}
    return false;
  }

  // ---- Wallpaper migration / validation (keeps old saved ids from breaking the UI)
  function normalizeWallpaperId(id){
    const v = String(id||"").trim();
    if (!v) return "";
    if (WALLPAPERS.some(x=>x.id===v)) return v;
    if (v === CUSTOM_UPLOAD_ID) return v;
    if (CUSTOM_WP_RE.test(v)) return v;
    // migrate legacy svg ids (w01..w99) or removed v3 ids to a safe default
    if (/^w\d+$/i.test(v) || /^v3_\d+$/i.test(v) || /^free\d+$/i.test(v) || /^lux_/i.test(v)) return "v2_001";
    return "v2_001";
  }

  function normalizeAllWallpapers(){
    try{
      const g = normalizeWallpaperId(localStorage.getItem(LS_WP_GLOBAL));
      if (g) localStorage.setItem(LS_WP_GLOBAL, g);
      else localStorage.removeItem(LS_WP_GLOBAL);
    }catch{}
    try{
      for (const [tab] of WALLPAPER_TABS){
        const k = wallpaperKeyForTab(tab);
        const cur = localStorage.getItem(k);
        const norm = normalizeWallpaperId(cur);
        if (norm) localStorage.setItem(k, norm);
        else localStorage.removeItem(k);
      }
    }catch{}
  }
  normalizeAllWallpapers();

  function normalizeExtWallpaperIdLocal(id){
    const v = String(id||"").trim();
    if (!v) return "";
    if (EXT_WALLPAPERS.some(x=>String(x.id||"").toLowerCase()===v.toLowerCase())) return v;
    if (v === CUSTOM_UPLOAD_ID) return v;
    if (CUSTOM_WP_RE.test(v)) return v;
    let m = v.match(/^extv3_(\d{1,2})$/i);
    if (m){
      const n = String(Math.max(1, Math.min(58, Number(m[1]) || 1))).padStart(2, "0");
      return `extv3_${n}`;
    }
    m = v.match(/^ext_free_(\d{1,2})$/i);
    if (m){
      const n = String(Math.max(1, Math.min(2, Number(m[1]) || 1))).padStart(2, "0");
      return `ext_free_${n}`;
    }
    m = v.match(/^ext_(\d{1,2})$/i);
    if (m){
      const num = Math.max(1, Math.min(58, Number(m[1]) || 1));
      return `extv3_${String(num).padStart(2, "0")}`;
    }
    if (/^lux_ext_/i.test(v) || /^ext_free_/i.test(v)) return "extv3_01";
    return "extv3_01";
  }

  function svgDataUri(svg){
    return `data:image/svg+xml;utf8,${encodeURIComponent(String(svg || ""))}`;
  }

  function cryptoWallpaperPalette(num){
    const palettes = [
      { a: "#7c3aed", b: "#14f195", glow: "#14f195", x: "#070a12" },  // Solana glow
      { a: "#9945ff", b: "#06b6d4", glow: "#06b6d4", x: "#0a0d15" },  // Neon CT-ish
      { a: "#22c55e", b: "#7c3aed", glow: "#22c55e", x: "#050810" }, // DeGen green
      { a: "#f97316", b: "#7c3aed", glow: "#f7931a", x: "#070a12" }, // Alpha burn
    ];
    return palettes[(Math.abs(num | 0) || 0) % palettes.length] || palettes[0];
  }

  function cryptoWallpaperMotif(num){
    const m = (Math.abs(num | 0) || 0) % 6;
    if (m === 0) return { label: "SOLANA", sub: "X" };
    if (m === 1) return { label: "DEGEN", sub: "SOL" };
    if (m === 2) return { label: "CT", sub: "X" };
    if (m === 3) return { label: "WAGMI", sub: "SOL" };
    if (m === 4) return { label: "DEGEN", sub: "X" };
    return { label: "SOL/X", sub: "CT" };
  }

  function cryptoWallpaperDataUri(kind, num, thumb){
    const isExt = String(kind) === "ext";
    const N = Math.max(1, Math.min(99, Number(num) || 1));
    const p = cryptoWallpaperPalette(N);
    const motif = cryptoWallpaperMotif(N);

    const W = isExt ? (thumb ? 360 : 1080) : (thumb ? 480 : 1920);
    const H = isExt ? (thumb ? 640 : 1920) : (thumb ? 270 : 1080);

    const solCx = W / 2;
    const solTop = H * 0.22;
    const solW = W * 0.38;
    const solH = H * 0.42;

    const xCx = W * 0.5;
    const xCy = H * 0.72;
    const xSize = W * 0.18;

    const t = (N * 9973) % 10000;
    const circles = [];
    for (let i = 0; i < 7; i++){
      const a = (t + i * 173) % 1000;
      const b = (t + i * 331) % 1000;
      circles.push({ x: Math.round(W * (0.12 + (a % 70) / 100)), y: Math.round(H * (0.12 + (b % 70) / 100)) });
    }

    const tri = `<polygon points="${(solCx - solW / 2)},${solTop} ${(
      solCx + solW / 2
    )},${solTop} ${solCx},${solTop + solH}" fill="url(#solGrad)"/>`;

    const xIcon = `
      <g opacity="0.95">
        <path d="M ${xCx - xSize} ${xCy - xSize} L ${xCx + xSize} ${xCy + xSize}" stroke="${p.glow}" stroke-width="${Math.max(10, W * 0.018)}" stroke-linecap="round"/>
        <path d="M ${xCx + xSize} ${xCy - xSize} L ${xCx - xSize} ${xCy + xSize}" stroke="${p.glow}" stroke-width="${Math.max(10, W * 0.018)}" stroke-linecap="round"/>
      </g>`;

    const labelY = H * 0.58;
    const subY = H * 0.66;
    const fontSizeA = Math.max(42, W * (isExt ? 0.065 : 0.07));
    const fontSizeB = Math.max(24, W * (isExt ? 0.04 : 0.045));

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="${p.x}"/>
          <stop offset="35%" stop-color="${p.a}"/>
          <stop offset="100%" stop-color="${p.b}"/>
        </linearGradient>
        <linearGradient id="solGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="${p.b}"/>
          <stop offset="100%" stop-color="${p.a}"/>
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="${thumb ? 10 : 18}" result="blur"/>
          <feMerge>
            <feMergeNode in="blur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>

      <rect width="${W}" height="${H}" fill="url(#bg)"/>

      <g opacity="0.20">
        ${circles.map(c => `<circle cx="${c.x}" cy="${c.y}" r="${Math.max(3, W * 0.01)}" fill="${p.glow}"/>`).join("")}
      </g>

      <g opacity="0.28" stroke="${p.glow}">
        ${circles.map(c => `<path d="M ${c.x - W * 0.18} ${c.y} C ${c.x} ${c.y - H * 0.08} ${c.x} ${c.y + H * 0.12} ${c.x + W * 0.18} ${c.y}" fill="none" stroke-width="${Math.max(2, W * 0.005)}"/>`).join("")}
      </g>

      <g filter="url(#glow)">${tri}</g>
      ${xIcon}

      <text x="${W / 2}" y="${labelY}" text-anchor="middle" fill="rgba(255,255,255,0.92)" font-size="${fontSizeA}" font-family="ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial" font-weight="900" letter-spacing="0.5">${motif.label}</text>
      <text x="${W / 2}" y="${subY}" text-anchor="middle" fill="rgba(255,255,255,0.74)" font-size="${fontSizeB}" font-family="ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial" font-weight="800" letter-spacing="0.7">${motif.sub}</text>
    </svg>`;

    return svgDataUri(svg);
  }



  function extWallpaperAssetPath(id){
    const norm = normalizeExtWallpaperIdLocal(id);
    if (!norm) return "";
    if (norm.startsWith("extv3_")) return norm + ".webp";
    return norm + ".svg";
  }

  function extWallpaperFullUrl(id){
    const norm = normalizeExtWallpaperIdLocal(id);
    if (!norm) return "";
    if (norm === CUSTOM_UPLOAD_ID){
      try{ return localStorage.getItem(LS_EXT_CUSTOM_BG_GLOBAL) || ""; }catch{ return ""; }
    }
    if (norm.startsWith("custom_")) return `/assets/extbg/custom/${norm.slice(7)}?v=${ASSET_REV}`;
    if (norm.startsWith("extv3_")) return `/assets/extbg/${norm}.webp?v=${ASSET_REV}`;
    const p = extWallpaperAssetPath(norm);
    return p ? `/assets/extbg/${p}?v=${ASSET_REV}` : "";
  }

  function extWallpaperThumbUrl(id){
    const norm = normalizeExtWallpaperIdLocal(id);
    if (!norm) return "";
    if (norm === CUSTOM_UPLOAD_ID){
      try{ return localStorage.getItem(LS_EXT_CUSTOM_BG_GLOBAL) || ""; }catch{ return ""; }
    }
    if (norm.startsWith("custom_")) return `/assets/extbg/custom/${norm.slice(7)}?v=${ASSET_REV}`;
    if (norm.startsWith("extv3_")) return `/assets/extbg/thumbs/${norm}.webp?v=${ASSET_REV}`;
    return `/assets/extbg/thumbs/extv3_01.webp?v=${ASSET_REV}`;
  }
  try{
    const cur = localStorage.getItem(LS_EXT_WP);
    const norm = normalizeExtWallpaperIdLocal(cur);
    if (norm) localStorage.setItem(LS_EXT_WP, norm);
    else localStorage.removeItem(LS_EXT_WP);
  }catch{}

  const TOP_LEVEL_TABS = ["home","gm","gn","prediction","referrals","leaderboard","themes","extthemes","wallet","admin"];
  function normalizeTopLevelTab(raw){
    const name = String(raw || "").trim().toLowerCase();
    if (name === "upgrade") return "wallet";
    if (name === "extension-themes" || name === "extthemes") return "extthemes";
    return TOP_LEVEL_TABS.includes(name) ? name : "home";
  }

  let CURRENT_TAB = "home";
  function currentTabName(){ return CURRENT_TAB; }

  function wallpaperKeyForTab(tab){
    if (!tab || tab === "all") return LS_WP_GLOBAL;
    return LS_WP_TAB_PREFIX + tab;
  }

  function getWallpaperForTab(tab){
    const direct = localStorage.getItem(wallpaperKeyForTab(tab)) || "";
    if (direct) return direct;
    const global = localStorage.getItem(LS_WP_GLOBAL) || "";
    return global;
  }

  function setWallpaperForTab(tab, id){
    const k = wallpaperKeyForTab(tab);
    if (!id) localStorage.removeItem(k);
    else localStorage.setItem(k, id);
  }

  function wallpaperAssetPath(id){
    if (!id) return "";
    if (String(id).startsWith("v2_")) return String(id) + ".webp";
    return String(id) + ".svg";
  }

  function wallpaperFullUrl(id){
    const norm = normalizeWallpaperId(id);
    if (!norm) return "";
    if (norm === CUSTOM_UPLOAD_ID){
      try{ return localStorage.getItem(LS_CUSTOM_BG_GLOBAL) || ""; }catch{ return ""; }
    }
    if (norm.startsWith("custom_")) return `/assets/wallpapers/custom/${norm.slice(7)}?v=${ASSET_REV}`;
    if (norm.startsWith("v2_")) return `/assets/wallpapers/${norm}.webp?v=${ASSET_REV}`;
    const p = wallpaperAssetPath(norm);
    return p ? `/assets/wallpapers/${p}?v=${ASSET_REV}` : "";
  }

  function wallpaperThumbUrl(id){
    const norm = normalizeWallpaperId(id);
    if (!norm) return "";
    if (norm === CUSTOM_UPLOAD_ID){
      try{ return localStorage.getItem(LS_CUSTOM_BG_GLOBAL) || ""; }catch{ return ""; }
    }
    if (norm.startsWith("custom_")) return `/assets/wallpapers/custom/${norm.slice(7)}?v=${ASSET_REV}`;
    if (norm.startsWith("v2_")) return `/assets/wallpapers/thumbs/${norm}.webp?v=${ASSET_REV}`;
    return `/assets/wallpapers/thumbs/v2_001.webp?v=${ASSET_REV}`;
  }

  function wallpaperUrl(id){
    const full = wallpaperFullUrl(id);
    return full ? `url("${full}")` : "none";
  }

  function wallpaperUnlocked(wp, idx, effectiveCustomLen){
    if (!wp) return false;
    if (wp.tier === "custom"){
      const customIdx = idx;
      return isPro() || customIdx < CUSTOM_WP_FREE_COUNT;
    }
    const mainIdx = idx - (effectiveCustomLen || 0);
    return isPro() || (mainIdx < unlockedCountByRefs(WALLPAPERS.length, FREE_VISIBLE_WALLPAPERS));
  }

  function effectiveCustomWallpapersSite(){
    const out = [...CUSTOM_WALLPAPERS_SITE];
    try{ if (localStorage.getItem(LS_CUSTOM_BG_GLOBAL)) out.push({ id: CUSTOM_UPLOAD_ID, name: "My upload", tier: "custom" }); }catch{}
    return out;
  }

  function ensureWallpaperLayer(){
    let layer = document.getElementById("gmxWallLayer");
    if (!layer){
      layer = document.createElement("div");
      layer.id = "gmxWallLayer";
      layer.className = "gmxWallLayer";
      layer.setAttribute("aria-hidden", "true");
      document.body.prepend(layer);
    }
    return layer;
  }

  function setWallpaperLayerImage(layer, url){
    if (!layer) return;
    if (!url){
      layer.replaceChildren();
      layer.style.display = "none";
      layer.removeAttribute("data-wall-url");
      return;
    }
    const safe = String(url).replace(/"/g, "%22");
    if (layer.getAttribute("data-wall-url") === url && layer.querySelector("img")){
      layer.style.display = "block";
      return;
    }
    layer.setAttribute("data-wall-url", url);
    layer.replaceChildren();
    const img = document.createElement("img");
    img.className = "gmxWallImg";
    img.alt = "";
    img.decoding = "async";
    img.loading = "eager";
    img.draggable = false;
    img.src = url;
    layer.appendChild(img);
    layer.style.display = "block";
  }

  function applyWallpaper(tab){
    const safeTab = String(tab || currentTabName() || "home");
    const id = getWallpaperForTab(safeTab);
    const effectiveCustom = effectiveCustomWallpapersSite();
    const allWps = [...effectiveCustom, ...WALLPAPERS];
    const wp = effectiveCustom.find(x=>x.id===id) || WALLPAPERS.find(x=>x.id===id) || null;
    let idx = -1;
    try{ idx = wp ? allWps.findIndex(x=>x.id===id) : -1; }catch{}
    const ok = !id || !wp || wallpaperUnlocked(wp, idx, effectiveCustom.length);

    const layer = ensureWallpaperLayer();
    const full = (id && ok) ? wallpaperFullUrl(id) : "";
    const on = !!(id && ok && full);

    setWallpaperLayerImage(layer, on ? full : "");
    document.documentElement.style.setProperty("--bg_wall", "none");
    document.body.classList.toggle("hasWallBg", on);
    document.body.classList.toggle("has-wallpaper", on);
  }

  
  function sanitizeI18nValue(lang, value, fallback){
    const allowCyr = (lang === "ru" || lang === "uk");
    if (Array.isArray(value)){
      const fb = Array.isArray(fallback) ? fallback : [];
      const out = value.map((item, idx)=>sanitizeI18nValue(lang, item, fb[idx])).filter(v=>v !== undefined && v !== null && v !== "");
      if (out.length) return out;
      return fb.length ? fb : undefined;
    }
    if (typeof value === "string"){
      const txt = value.trim();
      if (!txt) return (typeof fallback === "string" && fallback.trim()) ? fallback : undefined;
      if (!allowCyr && /[\u0400-\u04FF]/.test(value)) return (typeof fallback === "string" && fallback.trim()) ? fallback : undefined;
      return value;
    }
    if (value === undefined || value === null) return fallback;
    return value;
  }

  function trWp(k){
    let lang = "en";
    try{ lang = localStorage.getItem(LS_SITE_LANG) || "en"; }catch{}
    let base = {}, dict = {};
    try{ base = I18N.en || {}; dict = I18N[lang] || {}; }catch{}
    const v = sanitizeI18nValue(lang, dict[k], base[k]);
    return (v ?? base[k] ?? k);
  }

  // i18n helper (global)
  function t(k){
    return trWp(k);
  }

  function prettyError(code){
    const c = String(code||"").trim();
    if (!c) return (t("err_unknown") || "Unknown error");
    const m = {
      invalid_handle: t("err_invalid_handle") || "Invalid handle",
      unauthorized: t("err_unauthorized") || "Unauthorized",
      forbidden: t("err_forbidden") || "Forbidden",
      rate_limited: t("err_rate_limited") || "Too many requests",
      busy_try_again: t("err_busy") || "Server busy, try again",
      limit_reached: t("err_limit_reached") || "Daily limit reached",
      upgrade_required: t("err_upgrade_required") || "Upgrade required",
      server_error: t("err_server_error") || "Server error",
      not_found: t("err_not_found") || "Not found",
      init_failed: t("err_init_failed") || "Init failed",
    };
    return m[c] || c;
  }



function renderWallpaperUI(){
    const tabSel = $("wpTab");
    const grid = $("wpGrid");
    const st = $("wpStatus");
    if (!tabSel || !grid || !st) return;

    // fill select (keep value across re-render; re-renders on UI language changes)
    const prev = tabSel.value || "all";
    tabSel.innerHTML = "";
    for (const [v,l] of WALLPAPER_TABS){
      const o = document.createElement("option");
      o.value = v;
      o.textContent = trWp(l);
      tabSel.appendChild(o);
    }
    // restore previous selection if still present
    try{
      const ok = Array.from(tabSel.options).some(o=>o.value===prev);
      tabSel.value = ok ? prev : "all";
    }catch{}

    const targetTab = tabSel.value || "all";
    const activeId = (targetTab === "all")
      ? (localStorage.getItem(LS_WP_GLOBAL) || "")
      : (localStorage.getItem(wallpaperKeyForTab(targetTab)) || "");

    const effectiveCustom = effectiveCustomWallpapersSite();
    const allWps = [...effectiveCustom, ...WALLPAPERS];
    const mainUnlocked = unlockedCountByRefs(WALLPAPERS.length, FREE_VISIBLE_WALLPAPERS);
    const customUnlocked = Math.min(effectiveCustom.length, isPro() ? effectiveCustom.length : CUSTOM_WP_FREE_COUNT);
    const unlocked = mainUnlocked + customUnlocked;
    const unlockedAll = isPro() || unlocked >= allWps.length;
    const nextReq = reqRefsForUnlockIndex(unlockedCountByRefs(WALLPAPERS.length, FREE_VISIBLE_WALLPAPERS), FREE_VISIBLE_WALLPAPERS);
    st.innerHTML = unlockedAll
      ? `<span class="ok">Unlocked.</span> All wallpapers available. First ${CUSTOM_WP_FREE_COUNT} custom free, rest Pro.`
      : `<span class="warn">Locked.</span> First ${FREE_VISIBLE_WALLPAPERS} main + ${CUSTOM_WP_FREE_COUNT} custom free. Next unlock at <b>${nextReq} ref</b>.`;

    loadCustomWallpapers().then((loaded)=>{
      if (loaded && document.contains(grid)) renderWallpaperUI();
    });

    const items = allWps.map((wp, idx)=>({ wp, idx }));
    chunkedRender(grid, items, ({ wp, idx })=>{
      const isUnlocked = wallpaperUnlocked(wp, idx, effectiveCustom.length);
      const card = document.createElement("button");
      card.type = "button";
      card.dataset.wpId = wp.id;
      const mainIdx = wp.tier === "custom" ? -1 : (idx - effectiveCustom.length);
      card.dataset.tier = wp.tier || (mainIdx >= 0 && mainIdx < FREE_VISIBLE_WALLPAPERS ? "free" : "premium");
      card.className = "wpCard" + (isUnlocked ? "" : " mystery") + (wp.id===activeId ? " active" : "");

      const thumb = document.createElement("div");
      thumb.className = "wpThumb";
      const thumbUrl = wallpaperThumbUrl(wp.id);
      const fullUrl = wallpaperFullUrl(wp.id);
      if (thumbUrl) thumb.setAttribute('data-bg', thumbUrl);
      observeLazyBg(thumb);
      // Warm cache for instant apply.
      if (isUnlocked && fullUrl){
        card.addEventListener('pointerenter', ()=>{ try{ prefetchImage(fullUrl); }catch{} }, { passive:true });
      }

      const name = document.createElement("div");
      name.className = "wpName";
      name.textContent = wp.name;

      const meta = document.createElement("div");
      meta.className = "wpMeta";
      meta.textContent = (wp.tier === "custom") ? "Custom" : ((mainIdx >= 0 && mainIdx < FREE_VISIBLE_WALLPAPERS) ? "Free" : (isPro() ? "Pro" : "Locked"));

      const tag = document.createElement("div");
      tag.className = "wpTag";
      tag.textContent = (wp.tier === "custom") ? "CUSTOM" : ((mainIdx >= 0 && mainIdx < FREE_VISIBLE_WALLPAPERS) ? "FREE" : (isUnlocked ? "UNLOCKED" : (reqRefsForUnlockIndex(mainIdx, FREE_VISIBLE_WALLPAPERS) + " ref")));

      card.appendChild(thumb);
      card.appendChild(name);
      card.appendChild(meta);
      card.appendChild(tag);

      if (!isUnlocked){
        const ov = document.createElement("div");
        ov.className = "mysteryOverlay";
        ov.textContent = (t("locked")||"LOCKED");
        card.appendChild(ov);
      }

      card.addEventListener("click", ()=>{
        if (!isUnlocked){
          const reqIdx = wp.tier === "custom" ? idx : (idx - effectiveCustom.length);
          toast("warn", (t("locked_unlock_at") || "Locked. Unlock at {n} referrals (+1 every 3 refs at first, then +1 every 4) or Pro.").replace("{n}", String(reqRefsForUnlockIndex(reqIdx, FREE_VISIBLE_WALLPAPERS))));
          return;
        }

        if (targetTab === "all"){
          localStorage.setItem(LS_WP_GLOBAL, wp.id);
        } else {
          setWallpaperForTab(targetTab, wp.id);
        }

        // Avoid full grid re-render (prevents UI freeze).
        const newActive = (targetTab === 'all')
          ? (localStorage.getItem(LS_WP_GLOBAL) || '')
          : (localStorage.getItem(wallpaperKeyForTab(targetTab)) || '');
        markWallpaperSelection(newActive);

        // Preview: apply to selected tab (not to the Themes tab).
        const previewTab = (targetTab === "all") ? currentTabName() : targetTab;
        // Preload before applying (smooth, avoids jank on first paint).
        const _full = wallpaperFullUrl(wp.id);
        if (_full){
          prefetchImage(_full).finally(()=>{
            applyUserBg(previewTab);
            applyWallpaper(previewTab);
          });
        } else {
          applyUserBg(previewTab);
          applyWallpaper(previewTab);
        }
      });

      return card;
    }, { key: "wpGrid", chunk: 12 });
  }
// Theme / Wallpaper toggle inside Themes tab
  const LS_THEMEWALL_VIEW = K.THEMEWALL_VIEW;

  function setThemeWallView(view){
    const themeBtn  = $("tabTheme");
    const wallBtn   = $("tabWall");
    const themePane  = $("themePane");
    const wallPane   = $("wallPane");
    const wpNote = $("wp_note");
    if (!themeBtn || !wallBtn || !themePane || !wallPane) return;

    const v = (view === "wall") ? "wall" : "theme";
    localStorage.setItem(LS_THEMEWALL_VIEW, v);

    const themeOn  = (v === "theme");
    const wallOn   = (v === "wall");

    themeBtn.classList.toggle("active", themeOn);
    wallBtn.classList.toggle("active", wallOn);

    themeBtn.setAttribute("aria-selected", themeOn ? "true" : "false");
    wallBtn.setAttribute("aria-selected", wallOn ? "true" : "false");

    themePane.classList.toggle("hidden", !themeOn);
    wallPane.classList.toggle("hidden", !wallOn);

    if (wpNote) wpNote.classList.toggle("hidden", !wallOn);

    if (wallOn){
      try{ renderWallpaperUI(); }catch{}
    }
  }

  function initThemeWallTabs(){
    const themeBtn  = $("tabTheme");
    const wallBtn   = $("tabWall");
    if (themeBtn)  themeBtn.addEventListener("click", ()=>setThemeWallView("theme"));
    if (wallBtn)   wallBtn.addEventListener("click",  ()=>setThemeWallView("wall"));

    const saved = localStorage.getItem(LS_THEMEWALL_VIEW) || "theme";
    setThemeWallView(saved === "custom" ? "wall" : saved);
  }


  function initWallpapers(){
  if (initWallpapers._done) return;
  initWallpapers._done = true;
    const tabSel = $("wpTab");
    const clearBtn = $("wpClear");
    if (tabSel){
      tabSel.addEventListener("change", ()=>{
        renderWallpaperUI();
      });
    }
    if (clearBtn){
      clearBtn.addEventListener("click", ()=>{
        const targetTab = ($("wpTab")?.value || "all");
        if (targetTab === "all") localStorage.removeItem(LS_WP_GLOBAL);
        else setWallpaperForTab(targetTab, "");
        renderWallpaperUI();
        const previewTab = (targetTab === "all") ? currentTabName() : targetTab;
        applyUserBg(previewTab);
        applyWallpaper(previewTab);
        toast("ok", (t("toast_wallpaper_cleared")||"Wallpaper cleared."));
      });
    }
    renderWallpaperUI();
  }
  let SITE_LANGS = [["en","English"]];

  // English-only product: UI and reply generation stay on English.
  let REPLY_LANGS = [["en","English"]];
// --- Flags + language chips (By language) ---
    function flagEmoji(code){
    const c = String(code || "").trim().toUpperCase();
    return c || "GLB";
  }

  function updateLangFlags(){
    const site = $("siteLang")?.value || "en";
    const gm = $("gmLang")?.value || "en";
    const gn = $("gnLang")?.value || "en";
    if ($("siteLangFlag")) $("siteLangFlag").textContent = (site === "en") ? "GLB" : flagEmoji(site);
    if ($("gmLangFlag")) $("gmLangFlag").textContent = flagEmoji(gm);
    if ($("gnLangFlag")) $("gnLangFlag").textContent = flagEmoji(gn);
  }

  function renderLangChips(kind){
    const wrap = kind==="gm" ? $("gmLangChipsWrap") : $("gnLangChipsWrap");
    const box  = kind==="gm" ? $("gmLangChips") : $("gnLangChips");
    if (wrap) wrap.style.display = "none";
    if (box) box.innerHTML = "";
  }
