  // ----- Themes + Writing Styles (gating) -----
// Free: first 10 items
// Referrals: unlock 1 item at 10 refs, then +1 per +5 refs
// Pro: unlock all
  const THEMES = [
    { id:"classic",  name:"Classic Glass", note:"Default neon glass", a:"rgba(124,92,255,1)", b:"rgba(0,229,255,1)" },
    { id:"midnight", name:"Midnight",      note:"Cool blue glow",    a:"rgba(98,114,255,1)",  b:"rgba(0,200,255,1)" },
    { id:"sunrise",  name:"Sunrise",       note:"Warm gradient",     a:"rgba(255,122,0,1)",   b:"rgba(255,75,145,1)" },
    { id:"emerald",  name:"Emerald",       note:"Fresh green",       a:"rgba(0,229,125,1)",   b:"rgba(0,200,255,1)" },
    { id:"gold",     name:"Gold Rush",     note:"Premium gold",      a:"rgba(255,210,77,1)",  b:"rgba(255,122,0,1)" },

    { id:"berry",    name:"Berry",         note:"Vibrant magenta",   a:"rgba(255,75,145,1)",  b:"rgba(124,92,255,1)" },
    { id:"ice",      name:"Ice",           note:"Bright icy",        a:"rgba(0,229,255,1)",   b:"rgba(200,245,255,1)" },
    { id:"lava",     name:"Lava",          note:"Hot orange",        a:"rgba(255,60,0,1)",    b:"rgba(255,210,77,1)" },
    { id:"matrix",   name:"Matrix",        note:"Green terminal",    a:"rgba(0,255,160,1)",   b:"rgba(0,200,80,1)" },
    { id:"violet",   name:"Violet",        note:"Purple glow",       a:"rgba(180,110,255,1)", b:"rgba(124,92,255,1)" },

    { id:"ocean",    name:"Ocean",         note:"Sea blue",          a:"rgba(0,160,255,1)",   b:"rgba(0,229,255,1)" },
    { id:"sand",     name:"Sand",          note:"Soft warm",         a:"rgba(255,210,150,1)", b:"rgba(255,122,0,1)" },
    { id:"carbon",   name:"Carbon",        note:"Muted pro",         a:"rgba(180,180,190,1)", b:"rgba(90,95,110,1)" },
    { id:"plasma",   name:"Plasma",        note:"Pink x cyan",       a:"rgba(255,75,145,1)",  b:"rgba(0,229,255,1)" },
    { id:"mint",     name:"Mint",          note:"Clean mint",        a:"rgba(120,255,210,1)", b:"rgba(0,200,255,1)" },

    { id:"royal",    name:"Royal",         note:"Purple x gold",     a:"rgba(124,92,255,1)",  b:"rgba(255,210,77,1)" },
    { id:"peach",    name:"Peach",         note:"Soft peach",        a:"rgba(255,160,120,1)", b:"rgba(255,75,145,1)" },
    { id:"storm",    name:"Storm",         note:"Dark blue",         a:"rgba(90,120,200,1)",  b:"rgba(80,90,140,1)" },
    { id:"neon",     name:"Neon",          note:"Cyber neon",        a:"rgba(0,229,255,1)",   b:"rgba(0,229,125,1)" },
    { id:"mono",     name:"Mono",          note:"Minimal gray",      a:"rgba(220,220,225,1)", b:"rgba(160,160,170,1)" },

    // Premium pack (80)
    { id:"p01", name:"Aurora Glass", note:"Cool violet cyan glass", a:"rgba(0,229,255,1)", b:"rgba(124,92,255,1)" },
    { id:"p02", name:"Neon Pulse", note:"Bright magenta cyan", a:"rgba(255,75,145,1)", b:"rgba(0,229,255,1)" },
    { id:"p03", name:"Night Indigo", note:"Deep blue purple", a:"rgba(24,33,68,1)", b:"rgba(124,92,255,1)" },
    { id:"p04", name:"Mint Pop", note:"Playful mint accent", a:"rgba(0,229,125,1)", b:"rgba(255,75,145,1)" },
    { id:"p05", name:"Pool Teal", note:"Blue-green flow", a:"rgba(0,200,255,1)", b:"rgba(0,229,125,1)" },
    { id:"p06", name:"Candy Pink", note:"Warm pink gold", a:"rgba(255,75,145,1)", b:"rgba(255,210,77,1)" },
    { id:"p07", name:"Shadow Violet", note:"Dark purple edge", a:"rgba(70,29,132,1)", b:"rgba(0,200,255,1)" },
    { id:"p08", name:"Golden Gleam", note:"Gold purple shine", a:"rgba(255,210,77,1)", b:"rgba(124,92,255,1)" },
    { id:"p09", name:"Laser Ember", note:"Cyan orange glow", a:"rgba(0,229,255,1)", b:"rgba(255,122,0,1)" },
    { id:"p10", name:"Forest Calm", note:"Calm green depth", a:"rgba(0,229,125,1)", b:"rgba(26,132,86,1)" },
    { id:"p11", name:"Crimson Edge", note:"Bold red violet", a:"rgba(220,38,38,1)", b:"rgba(124,92,255,1)" },
    { id:"p12", name:"Wave Green", note:"Fresh green cyan", a:"rgba(34,197,94,1)", b:"rgba(0,229,255,1)" },
    { id:"p13", name:"Chrome Sheen", note:"Silver violet", a:"rgba(229,231,235,1)", b:"rgba(124,92,255,1)" },
    { id:"p14", name:"Mist Lavender", note:"Soft lavender haze", a:"rgba(167,139,250,1)", b:"rgba(0,229,255,1)" },
    { id:"p15", name:"Plasma Heat", note:"Hot orange pink", a:"rgba(255,122,0,1)", b:"rgba(255,75,145,1)" },
    { id:"p16", name:"Builder Steel", note:"Clean steel", a:"rgba(148,163,184,1)", b:"rgba(59,130,246,1)" },
    { id:"p17", name:"Iceberg", note:"Cold minimal", a:"rgba(186,230,253,1)", b:"rgba(124,92,255,1)" },
    { id:"p18", name:"Sunset Blaze", note:"Warm orange cyan", a:"rgba(255,122,0,1)", b:"rgba(0,200,255,1)" },
    { id:"p19", name:"Orbit", note:"Cosmic orbit", a:"rgba(17,24,39,1)", b:"rgba(0,200,255,1)" },
    { id:"p20", name:"Photon", note:"Bright photon", a:"rgba(250,250,250,1)", b:"rgba(0,229,255,1)" },
    { id:"p21", name:"Cyber Lime", note:"Cyber lime", a:"rgba(163,230,53,1)", b:"rgba(0,200,255,1)" },
    { id:"p22", name:"Royal Violet", note:"Royal violet", a:"rgba(124,92,255,1)", b:"rgba(255,75,145,1)" },
    { id:"p23", name:"Ocean Matrix", note:"Ocean matrix", a:"rgba(0,200,255,1)", b:"rgba(2,132,199,1)" },
    { id:"p24", name:"Circuit Mint", note:"Circuit mint", a:"rgba(0,229,125,1)", b:"rgba(0,200,255,1)" },
    { id:"p25", name:"Pink Noise", note:"Pink noise", a:"rgba(255,75,145,1)", b:"rgba(124,92,255,1)" },
    { id:"p26", name:"Night Market", note:"Night market", a:"rgba(15,23,42,1)", b:"rgba(255,210,77,1)" },
    { id:"p27", name:"Starship", note:"Starship", a:"rgba(0,229,255,1)", b:"rgba(255,210,77,1)" },
    { id:"p28", name:"Turbo Teal", note:"Turbo teal", a:"rgba(20,184,166,1)", b:"rgba(124,92,255,1)" },
    { id:"p29", name:"Sapphire", note:"Sapphire", a:"rgba(59,130,246,1)", b:"rgba(124,92,255,1)" },
    { id:"p30", name:"Blackout Pro", note:"Near-black pro", a:"rgba(5,7,14,1)", b:"rgba(124,92,255,1)" },

    // Premium pack continued (80)
    { id:"p31", name:"Neon Bloom", note:"Clean neon gradient", a:"rgba(215,238,43,1)", b:"rgba(37,130,244,1)" },
    { id:"p32", name:"Chrome Circuit", note:"Dark pro glow", a:"rgba(95,238,43,1)", b:"rgba(195,37,244,1)" },
    { id:"p33", name:"Prism Wave", note:"Cold glass shine", a:"rgba(43,238,111,1)", b:"rgba(244,37,40,1)" },
    { id:"p34", name:"Aurora Grid", note:"Warm premium glow", a:"rgba(43,238,231,1)", b:"rgba(202,244,37,1)" },
    { id:"p35", name:"Void Flux", note:"Cyber pop", a:"rgba(43,124,238,1)", b:"rgba(37,244,123,1)" },
    { id:"p36", name:"Laser Drive", note:"Soft haze", a:"rgba(82,43,238,1)", b:"rgba(37,113,244,1)" },
    { id:"p37", name:"Cosmic Mist", note:"High-contrast UI", a:"rgba(202,43,238,1)", b:"rgba(213,37,244,1)" },
    { id:"p38", name:"Glitch Edge", note:"Muted pro tone", a:"rgba(238,43,153,1)", b:"rgba(244,51,37,1)" },
    { id:"p39", name:"Titan Engine", note:"Bright accent", a:"rgba(238,52,43,1)", b:"rgba(185,244,37,1)" },
    { id:"p40", name:"Sakura Orbit", note:"Deep space vibe", a:"rgba(238,173,43,1)", b:"rgba(37,244,140,1)" },
    { id:"p41", name:"Solstice Signal", note:"Clean neon gradient", a:"rgba(183,238,43,1)", b:"rgba(37,95,244,1)" },
    { id:"p42", name:"Phantom Drift", note:"Dark pro glow", a:"rgba(62,238,43,1)", b:"rgba(230,37,244,1)" },
    { id:"p43", name:"Jet Rift", note:"Cold glass shine", a:"rgba(43,238,144,1)", b:"rgba(244,68,37,1)" },
    { id:"p44", name:"Hyper Matrix", note:"Warm premium glow", a:"rgba(43,212,238,1)", b:"rgba(168,244,37,1)" },
    { id:"p45", name:"Pulse Runway", note:"Cyber pop", a:"rgba(43,91,238,1)", b:"rgba(37,244,157,1)" },
    { id:"p46", name:"Mirage Peak", note:"Soft haze", a:"rgba(114,43,238,1)", b:"rgba(37,78,244,1)" },
    { id:"p47", name:"Holo Forge", note:"High-contrast UI", a:"rgba(235,43,238,1)", b:"rgba(244,37,240,1)" },
    { id:"p48", name:"Cipher Harbor", note:"Muted pro tone", a:"rgba(238,43,121,1)", b:"rgba(244,85,37,1)" },
    { id:"p49", name:"Kinetic Relay", note:"Bright accent", a:"rgba(238,85,43,1)", b:"rgba(151,244,37,1)" },
    { id:"p50", name:"Obsidian Vortex", note:"Deep space vibe", a:"rgba(238,205,43,1)", b:"rgba(37,244,175,1)" },
    { id:"p51", name:"Arctic Spray", note:"Clean neon gradient", a:"rgba(150,238,43,1)", b:"rgba(37,61,244,1)" },
    { id:"p52", name:"Inferno Beacon", note:"Dark pro glow", a:"rgba(43,238,56,1)", b:"rgba(244,37,223,1)" },
    { id:"p53", name:"Cobalt Temple", note:"Cold glass shine", a:"rgba(43,238,176,1)", b:"rgba(244,102,37,1)" },
    { id:"p54", name:"Emerald Vista", note:"Warm premium glow", a:"rgba(43,179,238,1)", b:"rgba(133,244,37,1)" },
    { id:"p55", name:"Magenta Lane", note:"Cyber pop", a:"rgba(43,59,238,1)", b:"rgba(37,244,192,1)" },
    { id:"p56", name:"Solar Core", note:"Soft haze", a:"rgba(147,43,238,1)", b:"rgba(37,44,244,1)" },
    { id:"p57", name:"Lunar Pool", note:"High-contrast UI", a:"rgba(238,43,209,1)", b:"rgba(244,37,206,1)" },
    { id:"p58", name:"Turbo Garden", note:"Muted pro tone", a:"rgba(238,43,88,1)", b:"rgba(244,120,37,1)" },
    { id:"p59", name:"Quantum Storm", note:"Bright accent", a:"rgba(238,117,43,1)", b:"rgba(116,244,37,1)" },
    { id:"p60", name:"Iridescent Bridge", note:"Deep space vibe", a:"rgba(238,238,43,1)", b:"rgba(37,244,209,1)" },
    { id:"p61", name:"Deck Neon", note:"Clean neon gradient", a:"rgba(117,238,43,1)", b:"rgba(47,37,244,1)" },
    { id:"p62", name:"Night Node", note:"Dark pro glow", a:"rgba(43,238,88,1)", b:"rgba(244,37,188,1)" },
    { id:"p63", name:"Dawn Tape", note:"Cold glass shine", a:"rgba(43,238,209,1)", b:"rgba(244,137,37,1)" },
    { id:"p64", name:"Dusk Portal", note:"Warm premium glow", a:"rgba(43,147,238,1)", b:"rgba(99,244,37,1)" },
    { id:"p65", name:"Frost Field", note:"Cyber pop", a:"rgba(59,43,238,1)", b:"rgba(37,244,226,1)" },
    { id:"p66", name:"Sable Valley", note:"Soft haze", a:"rgba(179,43,238,1)", b:"rgba(65,37,244,1)" },
    { id:"p67", name:"Vapor Spire", note:"High-contrast UI", a:"rgba(238,43,176,1)", b:"rgba(244,37,171,1)" },
    { id:"p68", name:"Ion Crown", note:"Muted pro tone", a:"rgba(238,43,56,1)", b:"rgba(244,154,37,1)" },
    { id:"p69", name:"Reactor Rise", note:"Bright accent", a:"rgba(238,150,43,1)", b:"rgba(82,244,37,1)" },
    { id:"p70", name:"Zen Shade", note:"Deep space vibe", a:"rgba(205,238,43,1)", b:"rgba(37,244,244,1)" },
    { id:"p71", name:"Neon Bloom", note:"Clean neon gradient", a:"rgba(85,238,43,1)", b:"rgba(82,37,244,1)" },
    { id:"p72", name:"Chrome Circuit", note:"Dark pro glow", a:"rgba(43,238,121,1)", b:"rgba(244,37,154,1)" },
    { id:"p73", name:"Prism Runway", note:"Cold glass shine", a:"rgba(43,235,238,1)", b:"rgba(244,171,37,1)" },
    { id:"p74", name:"Aurora Beacon", note:"Warm premium glow", a:"rgba(43,114,238,1)", b:"rgba(65,244,37,1)" },
    { id:"p75", name:"Void Storm", note:"Cyber pop", a:"rgba(91,43,238,1)", b:"rgba(37,226,244,1)" },
    { id:"p76", name:"Laser Valley", note:"Soft haze", a:"rgba(212,43,238,1)", b:"rgba(99,37,244,1)" },
    { id:"p77", name:"Cosmic Wave", note:"High-contrast UI", a:"rgba(238,43,144,1)", b:"rgba(244,37,137,1)" },
    { id:"p78", name:"Glitch Orbit", note:"Muted pro tone", a:"rgba(238,62,43,1)", b:"rgba(244,188,37,1)" },
    { id:"p79", name:"Titan Forge", note:"Bright accent", a:"rgba(238,183,43,1)", b:"rgba(47,244,37,1)" },
    { id:"p80", name:"Sakura Vista", note:"Deep space vibe", a:"rgba(173,238,43,1)", b:"rgba(37,209,244,1)" },
  ].slice(0, 60);

  const EXT_THEMES = THEMES.map(t=>({ id:t.id, name:t.name, note:t.note, a:t.a, b:t.b }));
  const EXT_WALLPAPER_PACK_COUNT = 58;
  const EXT_WALLPAPER_FREE_PACK_COUNT = 4;
  const EXT_PACK_NAMES = [
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
  const CRYPTO_EXT_WALL_SOURCES = [];
  function buildExtWallpapers(){
    const out = [];
    for (let i=1; i<=EXT_WALLPAPER_PACK_COUNT; i++){
      out.push({
        id: `extv3_${String(i).padStart(2, "0")}`,
        name: EXT_PACK_NAMES[i - 1] || `Scene ${i}`,
        tier: i <= EXT_WALLPAPER_FREE_PACK_COUNT ? "free" : "premium"
      });
    }
    return out;
  }
  const EXT_WALLPAPERS = buildExtWallpapers();
  function migrateLegacyExtWallpaperSelectionOnce(){
    try{
      const done = "gmx_ext_wallpaper_pexels_v2";
      if (localStorage.getItem(done) === "1") return;
      // keep IDs stable; visual refresh now happens in URL resolver
      localStorage.setItem(done, "1");
    }catch{}
  }



  const STYLES = [
    ["classic","Natural / Balanced"],
    ["degen","CT / Market"],
    ["builder","Builder / Productive"],
    ["alpha","Alpha / Read"],
    ["calm","Soft / Calm"],
    ["meme","Light / Wry"],
    ["classy","Polished / Smooth"],
    ["minimal","Minimal / Tight"],
    ["noemoji","No emoji"],
    ["emoji","Emoji / Extra"],
    ["focus","Focused / Direct"],
    ["cheer","Warm / Light"],
  ];


  const PACKS = [
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
        o.textContent = locked ? `${t("locked")||"LOCKED"} (${need} ref)` : p.name;
        o.disabled = locked;
        sel.appendChild(o);
      });
      if ([...sel.options].some(o=>o.value===prev && !o.disabled)) sel.value = prev;
      else sel.value = "classic";
    };
    fill($("gmPack"), LS_GM_PACK);
    fill($("gnPack"), LS_GN_PACK);
  }

  function unlockedThemesCount(){ return unlockedCountByRefs(THEMES.length, FREE_VISIBLE_THEMES); }
  function unlockedStylesCount(){ return unlockedCountByRefs(STYLES.length, FREE_VISIBLE_STYLES); }

  function rgbaToRgbTuple(s){
    const m = String(s||"").match(/rgba?\(([^)]+)\)/i);
    if (!m) return null;
    const parts = m[1].split(",").map(x=>x.trim());
    const r = Number(parts[0]); const g = Number(parts[1]); const b = Number(parts[2]);
    if (![r,g,b].every(Number.isFinite)) return null;
    return [Math.max(0,Math.min(255,r)), Math.max(0,Math.min(255,g)), Math.max(0,Math.min(255,b))];
  }
  function relLum(rgb){
    // sRGB to linear
    const f = (v)=>{ v/=255; return (v<=0.04045)? (v/12.92) : Math.pow((v+0.055)/1.055, 2.4); };
    const [r,g,b]=rgb;
    return 0.2126*f(r) + 0.7152*f(g) + 0.0722*f(b);
  }
  function pickAccentOn(a,b){
    const ra = rgbaToRgbTuple(a) || [124,92,255];
    const rb = rgbaToRgbTuple(b) || [0,229,255];
    const lum = (relLum(ra) + relLum(rb)) / 2;
    // If the gradient is bright, use dark text; otherwise use light text.
    return (lum > 0.62) ? "#0A0D15" : "#FFFFFF";
  }

function applyTheme(id){
    const t = THEMES.find(x=>x.id===id) || THEMES[0];
    // persist selected site theme
    try { localStorage.setItem("gmx_theme", String(t.id || id)); } catch(e) {}
    // CSS uses both --accentA and --accentB across gradients.
    document.documentElement.style.setProperty("--accentA", t.a);
    document.documentElement.style.setProperty("--accentB", t.b);
    document.documentElement.style.setProperty("--accentOn", pickAccentOn(t.a, t.b));
  }
const LS_EXT_VIEW = "gmx_ext_view"; // theme | wall | custom
const LS_EXT_WP = "gmx_ext_wp"; // selected extension wallpaper id
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


// Custom background for extension popup (per-tab + global)
// Note: this is stored on the site and later synced to the extension.
const LS_EXT_CUSTOM_BG_GLOBAL = "gmx_ext_custom_bg_global"; // dataURL
const LS_EXT_CUSTOM_BG_TAB_PREFIX = "gmx_ext_custom_bg_tab_"; // + tab
const LS_EXT_CUSTOM_BG_TARGET = "gmx_ext_custom_bg_target"; // selected tab in UI
const LS_EXT_CUSTOM_BG_LEGACY = "gmx_ext_custom_bg"; // legacy single key (migrated)

const EXT_POPUP_TABS = [
  ["all","wp_apply_all"],
  ["home","wp_apply_home"],
  ["gm","wp_apply_gm"],
  ["gn","wp_apply_gn"],
  ["referrals","wp_apply_referrals"],
  ["themes","wp_apply_themes"],
  ["wallet","wp_apply_wallet"],
];
const LS_EXT_WP_TARGET = "gmx_ext_wp_target"; // selected target inside extension wallpapers UI
const LS_EXT_WP_VIEW_PREFIX = "gmx_ext_wp_view_"; // + popup | quick
const EXT_WALLPAPER_VIEWS = [
  ["all", "All views"],
  ["popup", "Popup"],
  ["quick", "Quick panel"],
];

function extCustomBgKeyForTab(tab){
  return (tab === "all") ? LS_EXT_CUSTOM_BG_GLOBAL : (LS_EXT_CUSTOM_BG_TAB_PREFIX + tab);
}

function normalizeExtWallpaperView(view){
  const safe = String(view || "").trim().toLowerCase();
  return (safe === "popup" || safe === "quick") ? safe : "all";
}
function extWallpaperKeyForView(view){
  const safe = normalizeExtWallpaperView(view);
  return safe === "all" ? LS_EXT_WP : (LS_EXT_WP_VIEW_PREFIX + safe);
}
function getExtWallpaperForView(view){
  try{
    return normalizeExtWallpaperIdLocal(localStorage.getItem(extWallpaperKeyForView(view)) || "");
  }catch(_e){
    return "";
  }
}
function setExtWallpaperForView(view, id){
  try{
    const safeView = normalizeExtWallpaperView(view);
    const key = extWallpaperKeyForView(safeView);
    const safeId = normalizeExtWallpaperIdLocal(id);
    extLsSet(key, safeId || "");
  }catch(_e){}
}
function syncExtWallpaperTargetUI(sel, preferred){
  if (!sel) return "all";
  const current = normalizeExtWallpaperView(preferred || sel.value || localStorage.getItem(LS_EXT_WP_TARGET) || "all");
  sel.innerHTML = "";
  for (const [value, label] of EXT_WALLPAPER_VIEWS){
    const opt = document.createElement("option");
    opt.value = value;
    opt.textContent = label;
    sel.appendChild(opt);
  }
  sel.value = current;
  try{ localStorage.setItem(LS_EXT_WP_TARGET, current); }catch(_e){}
  return current;
}
function currentExtWallpaperTarget(){
  return normalizeExtWallpaperView(localStorage.getItem(LS_EXT_WP_TARGET) || "all");
}
function extWallpaperLabel(view){
  const safe = normalizeExtWallpaperView(view);
  return EXT_WALLPAPER_VIEWS.find((entry)=>entry[0]===safe)?.[1] || "All views";
}
function normalizeStoredExtWallpaperSelections(){
  try{
    const safeGlobal = normalizeExtWallpaperIdLocal(localStorage.getItem(LS_EXT_WP) || "");
    if (safeGlobal) localStorage.setItem(LS_EXT_WP, safeGlobal);
    else localStorage.removeItem(LS_EXT_WP);
  }catch(_e){}
  for (const [view] of EXT_WALLPAPER_VIEWS){
    if (view === "all") continue;
    try{
      const key = extWallpaperKeyForView(view);
      const safeId = normalizeExtWallpaperIdLocal(localStorage.getItem(key) || "");
      if (safeId) localStorage.setItem(key, safeId);
      else localStorage.removeItem(key);
    }catch(_e){}
  }
}

function migrateExtCustomBgLegacy(){
  try{
    const legacy = localStorage.getItem(LS_EXT_CUSTOM_BG_LEGACY);
    if (legacy && !localStorage.getItem(LS_EXT_CUSTOM_BG_GLOBAL)){
      localStorage.setItem(LS_EXT_CUSTOM_BG_GLOBAL, legacy);
    }
    if (legacy) localStorage.removeItem(LS_EXT_CUSTOM_BG_LEGACY);
  }catch(e){}
}
migrateExtCustomBgLegacy();

function listExtCustomBgUsedTabs(){
  const used = [];
  try{
    for (const [k] of EXT_POPUP_TABS){
      if (k === "all") continue;
      if (localStorage.getItem(LS_EXT_CUSTOM_BG_TAB_PREFIX + k)) used.push(k);
    }
    if (localStorage.getItem(LS_EXT_CUSTOM_BG_GLOBAL)) used.push("all");
  }catch(e){}
  return used;
}

function canSetExtCustomBgOnTab(tab){
  if (tab === "all") return true;
  if (isPro()) return true;

  const used = listExtCustomBgUsedTabs();
  if (used.includes(tab)) return true; // existing slot can always be edited/cleared

  // free: up to 3 tabs of choice
  if (used.filter(x=>x!=="all").length < 3) return true;

  // beyond 3: only if unlocked by refs
  const tabsOnly = EXT_POPUP_TABS.filter(t=>t[0]!=="all").map(t=>t[0]);
  const idx = tabsOnly.indexOf(tab);
  if (idx < 0) return false;
  const unlocked = unlockedCountByRefs(tabsOnly.length, 3);
  return idx < unlocked;
}

function requiredRefsForExtCustomBgTab(tab){
  if (tab === "all") return 0;
  const tabsOnly = EXT_POPUP_TABS.filter(t=>t[0]!=="all").map(t=>t[0]);
  const idx = tabsOnly.indexOf(tab);
  if (idx < 0) return 0;
  return reqRefsForUnlockIndex(idx, 3);
}

function renderExtCustomBgUI(){
  bindExtTabs();
  migrateExtCustomBgLegacy();

  const tabSel = $("extCustomBgTab");
  const st = $("extCustomBgStatus");
  const nm = $("extCustomBgName");
  const btnClear = $("extCustomBgClear");
  const btnPick = $("extCustomBgPick");
  const inp = $("extCustomBgFile");
  const btnRemove = $("extCustomBgRemove");

  if (!tabSel || !st || !btnPick || !inp || !btnRemove || !btnClear) return;

  const prev = localStorage.getItem(LS_EXT_CUSTOM_BG_TARGET) || tabSel.value || "all";

  tabSel.innerHTML = "";
  for (const [k, labelKey] of EXT_POPUP_TABS){
    const o = document.createElement("option");
    o.value = k;
    o.textContent = t(labelKey);
    tabSel.appendChild(o);
  }
  if ([...tabSel.options].some(o=>o.value===prev)) tabSel.value = prev;
  localStorage.setItem(LS_EXT_CUSTOM_BG_TARGET, tabSel.value);

  const target = tabSel.value || "all";
  const key = extCustomBgKeyForTab(target);
  const cur = localStorage.getItem(key);
  const used = listExtCustomBgUsedTabs();
  const usedCount = used.filter(x=>x!=="all").length;
  const slots = Math.min(EXT_POPUP_TABS.length-1, unlockedCountByRefs(EXT_POPUP_TABS.length-1, 3));
  const isAllowed = canSetExtCustomBgOnTab(target);
  const needRefs = requiredRefsForExtCustomBgTab(target);

  if (nm) nm.textContent = cur ? "saved" : "";

  let msg = cur
    ? `<span class="ok">Active.</span> Custom background is set for <b>${escapeHtml(t(EXT_POPUP_TABS.find(x=>x[0]===target)?.[1]||"wp_apply_all"))}</b>.`
    : `<span class="muted">None.</span> Upload an image to set a custom background.`;

  if (!isPro()){
    msg += ` <span class="muted">Slots:</span> ${Math.min(usedCount, slots)}/${slots}.`;
  }
  if (!isAllowed){
    msg += ` <span class="warn">Locked:</span> need ${needRefs} referrals for this tab (or upgrade to Pro).`;
  }
  st.innerHTML = msg;

  tabSel.onchange = ()=>{
    localStorage.setItem(LS_EXT_CUSTOM_BG_TARGET, tabSel.value);
    renderExtCustomBgUI();
  };

  btnClear.onclick = ()=>{
    if (!requireConnected("Extension themes")) return;
    try{
      localStorage.removeItem(LS_EXT_CUSTOM_BG_GLOBAL);
      for (const [k] of EXT_POPUP_TABS){
        if (k === "all") continue;
        localStorage.removeItem(LS_EXT_CUSTOM_BG_TAB_PREFIX + k);
      }
    }catch(e){}
    renderExtCustomBgUI();
    toast("ok", (t("toast_cleared")||"Cleared."));
  };

  btnPick.onclick = ()=>{
    if (!requireConnected("Extension themes")) return;
    if (!canSetExtCustomBgOnTab(target)){
      renderExtCustomBgUI();
      return;
    }
    inp.click();
  };

  if (!inp._bound){
    inp._bound = true;
    inp.addEventListener("change", async ()=>{
      try{
        if (!requireConnected("Extension themes")) { inp.value=""; return; }
        const tab = tabSel.value || "all";
        if (!canSetExtCustomBgOnTab(tab)){
          inp.value=""; renderExtCustomBgUI(); return;
        }
        const file = inp.files && inp.files[0];
        if (!file) return;
        if (nm) nm.textContent = file.name || "";

        const dataUrl = await compressImageToJpegDataURL(file, { profile: "ext" });
        localStorage.setItem(extCustomBgKeyForTab(tab), dataUrl);
        extSyncNow();

        renderExtCustomBgUI();
        if (st) st.innerHTML = `<span class="ok">Saved.</span> Auto-fitted for extension popup ratio.`;
        toast("ok", (t("toast_custom_bg_saved")||"Custom background saved."));
      }catch(e){
        st.innerHTML = `<span class="bad">Error.</span> Could not save background.`;
      }finally{
        inp.value = "";
      }
    });
  }

  btnRemove.onclick = ()=>{
    if (!requireConnected("Extension themes")) return;
    const tab = tabSel.value || "all";
    localStorage.removeItem(extCustomBgKeyForTab(tab));
    extSyncNow();
    renderExtCustomBgUI();
    toast("ok", (t("toast_removed")||"Removed."));
  };
}

function normalizeExtViewValue(view){
  const v = String(view || "").trim().toLowerCase();
  if (v === "wall" || v === "custom") return v;
  return "theme";
}

function setExtView(view, opts){
  const safeView = normalizeExtViewValue(view);
  const prev = normalizeExtViewValue(localStorage.getItem(LS_EXT_VIEW) || "theme");
  extLsSet(LS_EXT_VIEW, safeView);
  const options = opts || {};
  if (!options.silent && prev !== safeView) extSyncNow("ext_view");
  const btnTheme = $("extTabTheme");
  const btnWall = $("extTabWall");
  const paneTheme = $("extThemePane");
  const paneWall = $("extWallPane");
  if (!btnTheme || !btnWall || !paneTheme || !paneWall) return;

  btnTheme.classList.toggle("active", safeView==="theme");
  btnWall.classList.toggle("active", safeView==="wall");

  btnTheme.setAttribute("aria-selected", safeView==="theme" ? "true" : "false");
  btnWall.setAttribute("aria-selected", safeView==="wall" ? "true" : "false");

  paneTheme.classList.toggle("hidden", safeView!=="theme");
  paneWall.classList.toggle("hidden", safeView!=="wall");

  const hasRenderedContent = (safeView==="theme" ? !!paneTheme.querySelector(".themeCard") : !!paneWall.querySelector(".wpCard"));
  const shouldRender = options.force === true || prev !== safeView || !hasRenderedContent;
  if (safeView==="theme" && shouldRender) renderExtThemes();
  if (safeView==="wall" && shouldRender) renderExtWallpapers();
}

  let __extSyncDebounce = 0;
  function extSyncNow(reason){
    try{ clearTimeout(__extSyncDebounce); }catch(_e){}
    __extSyncDebounce = setTimeout(()=>{
      try{ window.postMessage({ type: "GMX_SYNC_NOW", reason: reason || "ext_ui_change" }, "*"); }catch(_e){}
    }, 90);
  }

  function markExtThemeSelection(id){
    try{
      const grid = $("extThemeGrid");
      if (!grid) return;
      const cards = grid.querySelectorAll(".themeCard[data-theme-id]");
      cards.forEach((card)=>{
        card.classList.toggle("active", card.getAttribute("data-theme-id") === String(id || "").trim());
      });
    }catch(_e){}
  }

  function markWallpaperSelection(activeId){
    try{
      const grid = $('wpGrid');
      if (!grid) return;
      const chosen = String(activeId || '').trim();
      const cards = grid.querySelectorAll('.wpCard[data-wp-id]');
      cards.forEach((card)=>{
        card.classList.toggle('active', card.getAttribute('data-wp-id') === chosen);
      });
    }catch(_e){}
  }

function markExtWallpaperSelection(id){
    try{
      const grid = $("extWpGrid");
      if (!grid) return;
      const chosen = String(id || "").trim();
      const cards = grid.querySelectorAll(".wpCard[data-wp-id]");
      cards.forEach((card)=>{
        card.classList.toggle("active", card.getAttribute("data-wp-id") === chosen);
      });
    }catch(_e){}
  }

  function unlockedExtThemesCount(){ return unlockedCountByRefs(EXT_THEMES.length, FREE_VISIBLE_EXT_THEMES); }

  function applyExtTheme(id){
    const unlocked = unlockedExtThemesCount();
    const idx = EXT_THEMES.findIndex(x=>x.id===id);
    if (!isPro() && (idx<0 || idx >= unlocked)) return;
    extLsSet("gmx_ext_theme", id);
    markExtThemeSelection(id);
    if (normalizeExtViewValue(localStorage.getItem(LS_EXT_VIEW) || "theme") !== "theme") setExtView("theme");
    extSyncNow("ext_theme");
    const st = $("extThemeStatus");
    if (st) st.innerHTML = '<span class="ok">Selected.</span>';
  }

  function applyExtWallpaper(id, targetView){
    const safeId = normalizeExtWallpaperIdLocal(id);
    if (!safeId) return;
    const safeTarget = normalizeExtWallpaperView(targetView || currentExtWallpaperTarget());
    setExtWallpaperForView(safeTarget, safeId);
    try{ localStorage.removeItem(LS_EXT_CUSTOM_BG_LEGACY); }catch(e){}
    if (normalizeExtViewValue(localStorage.getItem(LS_EXT_VIEW) || "theme") !== "wall") setExtView("wall");
    extSyncNow("ext_wallpaper");
    renderExtWallpapers();
  }


/* removed legacy renderExtThemes (cat/status filters) */

/* rebuilt Theme + Extension Themes renderers (no dead references) */

function themePreviewBg(th){
  const a = th?.a || "rgba(124,92,255,1)";
  const b = th?.b || "rgba(0,229,255,1)";
  return `linear-gradient(135deg, ${a}, ${b})`;
}

function unlockTagText(idx, unlocked, freeCount){
  if (idx < freeCount) return "FREE";
  if (unlocked) return "UNLOCKED";
  const need = reqRefsForUnlockIndex(idx, freeCount);
  return `${need} ref`;
}

function renderThemes(){
  const grid = $("themeGrid");
  if (!grid) return;

  const total = THEMES.length;
  const unlocked = unlockedThemesCount();
  const chosen = localStorage.getItem("gmx_theme") || "classic";

  const curThemes = Math.min(unlocked, total);
  const curWps = Math.min(unlockedCountByRefs(WALLPAPERS.length, FREE_VISIBLE_WALLPAPERS), WALLPAPERS.length);

  const thEl = $("themesUnlocked");
  if (thEl) thEl.textContent = `${curThemes}/${total}`;
  const thVal = $("themesUnlockedVal");
  if (thVal) thVal.textContent = `${curThemes}/${total}`;
  try{ setMeter("themesUnlockedVal", "themesUnlockedFill", curThemes, total); }catch{}
  const wpEl = $("wpUnlocked");
  if (wpEl) wpEl.textContent = `${curWps}/${WALLPAPERS.length}`;
  const wpVal = $("wpUnlockedVal");
  if (wpVal) wpVal.textContent = `${curWps}/${WALLPAPERS.length}`;
  try{ setMeter("wpUnlockedVal", "wpUnlockedFill", curWps, WALLPAPERS.length); }catch{}

  const items = THEMES.map((th, idx)=>({ th, idx }));
  chunkedRender(grid, items, ({ th, idx })=>{
    const isUnlocked = isPro() || (idx < unlocked);
    const card = document.createElement("button");
    card.type = "button";
    card.dataset.themeId = th.id;
    card.className = "themeCard" + (th.id === chosen ? " active" : "") + (!isUnlocked ? " mystery" : "");

    const sw = document.createElement("div");
    sw.className = "swatch";
    sw.style.background = themePreviewBg(th);

    const nm = document.createElement("div");
    nm.className = "tname";
    nm.textContent = th.name || th.id;

    const note = document.createElement("div");
    note.className = "tnote";
    note.textContent = th.note || "";

    const tag = document.createElement("div");
    tag.className = "lockTag";
    tag.textContent = unlockTagText(idx, isUnlocked, FREE_VISIBLE_THEMES);

    card.appendChild(sw);
    card.appendChild(nm);
    card.appendChild(note);
    card.appendChild(tag);

    if (!isUnlocked){
      const ov = document.createElement("div");
      ov.className = "mysteryOverlay";
      ov.textContent = (t("locked")||"LOCKED");
      card.appendChild(ov);
    }

    card.addEventListener("click", ()=>{
      if (!requireConnected("Themes")) return;
      if (!isUnlocked){
        const need = reqRefsForUnlockIndex(idx, FREE_VISIBLE_THEMES);
        toast("warn", (t("locked_unlock_at") || "Locked. Unlock at {n} referrals (+1 every 3 refs at first, then +1 every 4) or Pro.").replace("{n}", String(need)));
        return;
      }
      applyTheme(th.id);
      renderThemes();
    });

    return card;
  }, { key: "themeGrid", chunk: 24 });
}

function renderExtThemes(){
  const grid = $("extThemeGrid");
  const st = $("extThemeStatus");
  if (!grid || !st) return;

  const total = EXT_THEMES.length;
  const unlocked = unlockedCountByRefs(total, FREE_VISIBLE_EXT_THEMES);
  const chosen = localStorage.getItem("gmx_ext_theme") || "classic";

  const el = $("extThemesUnlocked");
  if (el) el.textContent = `${Math.min(unlocked,total)}/${total}`;
  const wEl = $("extWpUnlocked");
  if (wEl) wEl.textContent = `${Math.min(unlockedCountByRefs(EXT_WALLPAPERS.length, FREE_VISIBLE_EXT_WALLPAPERS), EXT_WALLPAPERS.length)}/${EXT_WALLPAPERS.length}`;

  const items = EXT_THEMES.map((th, idx)=>({ th, idx }));
  chunkedRender(grid, items, ({ th, idx })=>{
    const isUnlocked = isPro() || (idx < unlocked);
    const card = document.createElement("button");
    card.type = "button";
    card.className = "themeCard" + (th.id === chosen ? " active" : "") + (!isUnlocked ? " mystery" : "");

    const sw = document.createElement("div");
    sw.className = "swatch";
    sw.style.background = themePreviewBg(th);

    const nm = document.createElement("div");
    nm.className = "tname";
    nm.textContent = th.name || th.id;

    const note = document.createElement("div");
    note.className = "tnote";
    note.textContent = th.note || "";

    const tag = document.createElement("div");
    tag.className = "lockTag";
    tag.textContent = unlockTagText(idx, isUnlocked, FREE_VISIBLE_EXT_THEMES);

    card.appendChild(sw);
    card.appendChild(nm);
    card.appendChild(note);
    card.appendChild(tag);

    if (!isUnlocked){
      const ov = document.createElement("div");
      ov.className = "mysteryOverlay";
      ov.textContent = (t("locked")||"LOCKED");
      card.appendChild(ov);
    }

    card.addEventListener("click", ()=>{
      if (!requireConnected("Extension themes")) return;
      if (!isUnlocked){
        const need = reqRefsForUnlockIndex(idx, FREE_VISIBLE_EXT_THEMES);
        toast("warn", (t("locked_unlock_at") || "Locked. Unlock at {n} referrals (+1 every 3 refs at first, then +1 every 4) or Pro.").replace("{n}", String(need)));
        return;
      }
      applyExtTheme(th.id);
    });

    return card;
  }, { key: "extThemeGrid", chunk: 12 });

  const chosenName = EXT_THEMES.find(x=>x.id===chosen)?.name || chosen;
  st.innerHTML = `<span class="ok">Selected.</span> ${escapeHtml(chosenName)}.`;
}

function renderExtWallpapers(){
  const grid = $("extWpGrid");
  const st = $("extWpStatus");
  const targetSel = $("extWpTarget");
  if (!grid || !st) return;

  initExtWallpaperControls();
  loadCustomWallpapers().then((loaded)=>{
    if (loaded && document.contains(grid)) renderExtWallpapers();
  });
  const effectiveExtCustom = (()=>{
    const out = [...CUSTOM_WALLPAPERS_EXT];
    try{ if (localStorage.getItem(LS_EXT_CUSTOM_BG_GLOBAL)) out.push({ id: CUSTOM_UPLOAD_ID, name: "My upload", tier: "custom" }); }catch{}
    return out;
  })();
  const allExtWps = [...EXT_WALLPAPERS, ...effectiveExtCustom];
  const selectedTarget = syncExtWallpaperTargetUI(targetSel, targetSel?.value || currentExtWallpaperTarget());
  const total = allExtWps.length;
  const mainUnlockedExt = unlockedCountByRefs(EXT_WALLPAPERS.length, FREE_VISIBLE_EXT_WALLPAPERS);
  const customUnlockedExt = Math.min(effectiveExtCustom.length, isPro() ? effectiveExtCustom.length : CUSTOM_WP_FREE_COUNT);
  const unlocked = mainUnlockedExt + customUnlockedExt;
  const chosenDirect = getExtWallpaperForView(selectedTarget);
  const fallbackGlobal = selectedTarget === "all" ? "" : getExtWallpaperForView("all");
  const chosen = chosenDirect || fallbackGlobal || "";
  const wEl = $("extWpUnlocked");
  if (wEl) wEl.textContent = `${Math.min(unlocked,total)}/${total}`;

  const items = allExtWps.map((wp, idx)=>({ wp, idx }));
  chunkedRender(grid, items, ({ wp, idx })=>{
    const isUnlocked = wp.tier === "custom" ? (idx - EXT_WALLPAPERS.length < CUSTOM_WP_FREE_COUNT || isPro()) : (isPro() || idx < mainUnlockedExt);
    const card = document.createElement("button");
    card.type = "button";
    card.dataset.wpId = wp.id;
    card.dataset.tier = wp.tier || (idx < FREE_VISIBLE_EXT_WALLPAPERS ? "free" : "premium");
    card.className = "wpCard" + (wp.id === chosen ? " active" : "") + (!isUnlocked ? " mystery" : "");

    const thumb = document.createElement("div");
    thumb.className = "wpThumb";
    const thumbUrl = extWallpaperThumbUrl(wp.id);
    const fullUrl = extWallpaperFullUrl(wp.id);
    if (thumbUrl){
      thumb.setAttribute('data-bg', thumbUrl);
      observeLazyBg(thumb);
    }
    if (isUnlocked && fullUrl){
      card.addEventListener('pointerenter', ()=>{ try{ prefetchImage(fullUrl); }catch{} }, { passive:true });
    }

    const name = document.createElement("div");
    name.className = "wpName";
    name.textContent = wp.name || wp.id;

    const meta = document.createElement("div");
    meta.className = "wpMeta";
    meta.textContent = (wp.tier === "custom") ? "Custom" : (wp.tier || "");

    const tag = document.createElement("div");
    tag.className = "wpTag";
    tag.textContent = (wp.tier === "custom") ? "CUSTOM" : unlockTagText(idx, isUnlocked, FREE_VISIBLE_EXT_WALLPAPERS);

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
      if (!requireConnected("Extension themes")) return;
      if (!isUnlocked){
        const need = reqRefsForUnlockIndex(idx, FREE_VISIBLE_EXT_WALLPAPERS);
        toast("warn", (t("locked_unlock_at") || "Locked. Unlock at {n} referrals (+1 every 3 refs at first, then +1 every 4) or Pro.").replace("{n}", String(need)));
        return;
      }
      applyExtWallpaper(wp.id, selectedTarget);
    });

    return card;
  }, { key: "extWpGrid", chunk: 12 });

  if (!chosen){
    st.innerHTML = `<span class="muted">None.</span> Pick a wallpaper for <b>${escapeHtml(extWallpaperLabel(selectedTarget))}</b>.`;
    return;
  }
  const chosenName = EXT_WALLPAPERS.find(x=>x.id===chosen)?.name || effectiveExtCustom.find(x=>x.id===chosen)?.name || chosen;
  if (chosenDirect){
    st.innerHTML = `<span class="ok">Selected.</span> ${escapeHtml(chosenName)} for <b>${escapeHtml(extWallpaperLabel(selectedTarget))}</b>.`;
  } else {
    st.innerHTML = `<span class="ok">Using global.</span> ${escapeHtml(chosenName)} from <b>${escapeHtml(extWallpaperLabel("all"))}</b> is currently filling <b>${escapeHtml(extWallpaperLabel(selectedTarget))}</b>.`;
  }
}

function bindExtTabs(){
  if (bindExtTabs._done) return;
  bindExtTabs._done = true;

  const themeBtn  = $("extTabTheme");
  const wallBtn   = $("extTabWall");

  if (themeBtn)  themeBtn.addEventListener("click", ()=>setExtView("theme"));
  if (wallBtn)   wallBtn.addEventListener("click",  ()=>setExtView("wall"));
}

function initExtWallpaperControls(){
  if (initExtWallpaperControls._done) return;
  initExtWallpaperControls._done = true;
  const sel = $("extWpTarget");
  const clearBtn = $("extWpClear");
  const addBtn = $("extWpAddCustom");
  const addFile = $("extWpAddFile");
  if (addBtn && addFile){
    addBtn.onclick = ()=>{ if (requireConnected("Extension themes")) addFile.click(); };
  }
  if (addFile){
    addFile.addEventListener("change", async ()=>{
      try{
        if (!requireConnected("Extension themes")) { addFile.value = ""; return; }
        const f = addFile.files && addFile.files[0];
        if (!f) return;
        const data = await compressImageToJpegDataURL(f, { profile: "ext" });
        extLsSet(LS_EXT_CUSTOM_BG_GLOBAL, data);
        const target = ($("extWpTarget")?.value || "all");
        setExtWallpaperForView(normalizeExtWallpaperView(target), CUSTOM_UPLOAD_ID);
        extSyncNow("ext_wallpaper");
        try{ renderExtWallpapers(); }catch{}
        toast("ok", (t("toast_custom_bg_saved")||"Custom wallpaper saved."));
      }catch(e){
        toast("warn", (t("err_custom_wp_save")||"Could not save image."));
      }finally{
        addFile.value = "";
      }
    });
  }
  if (sel){
    syncExtWallpaperTargetUI(sel);
    sel.addEventListener("change", ()=>{
      const target = syncExtWallpaperTargetUI(sel, sel.value || "all");
      try{ localStorage.setItem(LS_EXT_WP_TARGET, target); }catch(_e){}
      renderExtWallpapers();
    });
  }
  if (clearBtn){
    clearBtn.addEventListener("click", ()=>{
      const selNow = $("extWpTarget");
      const target = normalizeExtWallpaperView(selNow?.value || currentExtWallpaperTarget());
      setExtWallpaperForView(target, "");
      renderExtWallpapers();
      extSyncNow("ext_wallpaper");
      toast("ok", (t("toast_wallpaper_cleared") || "Wallpaper cleared."));
    });
  }
}





function fillStyles(){
    const unlocked = unlockedStylesCount();
    const fill = (sel)=>{
      if (!sel) return;
      const prev = (sel.value || "classic");
      sel.innerHTML = "";
      STYLES.forEach(([v,label], idx)=>{
        const o = document.createElement("option");
        o.value = v;
        const locked = (!isPro() && idx >= unlocked);
        const need = reqRefsForUnlockIndex(idx, FREE_VISIBLE_STYLES);
        o.textContent = locked ? `${t("locked")||"LOCKED"} (${need} ref)` : label;
        o.disabled = locked;
        sel.appendChild(o);
      });
      // restore previous selection if possible (do NOT reset on every refresh)
      const prevIdx = STYLES.findIndex(x=>x[0]===prev);
      if (prevIdx !== -1 && (isPro() || prevIdx < unlocked)){
        sel.value = prev;
      } else {
        sel.value = STYLES[0][0];
      }
    };
    fill($("gmStyle"));
    fill($("gnStyle"));
    if ($("stylesUnlocked")) $("stylesUnlocked").textContent = `${unlocked}/${STYLES.length}`;
  }

const $ = (id) => document.getElementById(id);

  function toast(type, html, ms=4500){
    const el = $("toast");
    if (!el) return;
    el.className = `toast ${type||""}`;
    el.innerHTML = `<div class="ticon">${type==="ok"?"OK":type==="warn"?"!":"!"}</div><div class="tmsg">${html}</div>`;
    el.classList.remove("hidden");
    if (ms > 0){
      clearTimeout(el.__t);
      el.__t = setTimeout(()=>{ el.classList.add("hidden"); }, ms);
    }
  }

  // --- Degraded / offline mode (prevents "white screen" when API flakes) ---
  let API_DEGRADED = false;
  let DEGRADED_HIDDEN = false;
  let LAST_ONLINE_AT = Date.now();

  function setDegraded(on, msg){
    API_DEGRADED = !!on;
    const bar = $("degradedBar");
    if (!bar) return;
    if (!API_DEGRADED){
      bar.classList.add("hidden");
      DEGRADED_HIDDEN = false;
      LAST_ONLINE_AT = Date.now();
      return;
    }
    if (DEGRADED_HIDDEN) return;
    const title = $("degradedTitle");
    const text  = $("degradedMsg");
    if (title) title.textContent = (navigator.onLine === false) ? "Offline (browser)" : "Offline mode";
    if (text)  text.textContent = msg || "API is unreachable. You can still edit lists locally; sync/verify will retry when back online.";
    bar.classList.remove("hidden");
  }

  const dRetry = $("degradedRetry");
  if (dRetry) dRetry.onclick = ()=>{ try{ window.__gmxRetryNow?.(); }catch{} };
  const dHide = $("degradedHide");
  if (dHide) dHide.onclick = ()=>{ DEGRADED_HIDDEN = true; $("degradedBar")?.classList.add("hidden"); };

  window.addEventListener("offline", ()=>setDegraded(true, "Browser reports offline. Check your connection."));

  
  let INIT_DONE = false;
  const esc = (s)=>String(s??"").replace(/[&<>"']/g, (c)=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]));

  function showFatal(msg){
    const ov = $("fatalOverlay");
    if (!ov) return;
    const fm = $("fatalMsg");
    if (fm) fm.textContent = msg || "Something went wrong.";
    ov.classList.remove("hidden");
  }

  function hideFatal(){
    const ov = $("fatalOverlay");
    if (!ov) return;
    ov.classList.add("hidden");
  }

  const fr = $("fatalReload");
  if (fr) fr.addEventListener("click", ()=>location.reload());
  const fh = $("fatalGoHome");
  if (fh) fh.addEventListener("click", ()=>{
    try{ hideFatal(); tab("home"); }catch{ location.href="/"; }
  });

  window.addEventListener("error", (e)=>{
    try{
      const msg = (e?.message || "Unexpected error");
      const net = String(msg).includes("Failed to fetch") || String(msg).includes("NetworkError") || String(msg).includes("request_failed") || String(msg).includes("timeout");
      if (net){ setDegraded(true, "Network/API error. You can still edit lists locally."); return; }
      toast("bad", `<b>Error:</b> ${esc(msg)} <span class="muted small">(try Reload)</span>`);
      if (!INIT_DONE) showFatal(msg);
    }catch{}
  });

  window.addEventListener("unhandledrejection", (e)=>{
    try{
      const msg = (e?.reason && (e.reason.message || String(e.reason))) || "Unhandled promise rejection";
      const net = String(msg).includes("Failed to fetch") || String(msg).includes("NetworkError") || String(msg).includes("request_failed") || String(msg).includes("timeout") || String(msg).includes("not_connected");
      if (net){ setDegraded(true, "Network/API error. You can still edit lists locally."); return; }
      toast("bad", `<b>Error:</b> ${esc(msg)} <span class="muted small">(try Reload)</span>`);
      if (!INIT_DONE) showFatal(msg);
    }catch{}
  });

  function setBusy(kind, on, label){
    INFLIGHT[kind] = !!on;
    const ids = (kind==="gm")
      ? ["gmRand1","gmRand10","gmBestBtn","gmNewAdd","gmPasteAdd","gmCleanup","gmClear","gmClearAll","gmCopyAll","gmExport","gmViewGlobal","gmViewLang","gmFilter","gmFilterClear"]
      : ["gnRand1","gnRand10","gnBestBtn","gnNewAdd","gnPasteAdd","gnCleanup","gnClear","gnClearAll","gnCopyAll","gnExport","gnViewGlobal","gnViewLang","gnFilter","gnFilterClear"];

    for (const id of ids){
      const el = $(id);
      if (!el) continue;
      if (el.tagName === "INPUT") el.disabled = !!on;
      else el.disabled = !!on;
    }

    const msgEl = kind==="gm" ? $("gmMsg") : $("gnMsg");
    if (msgEl){
      if (on){
        msgEl.innerHTML = `<span class="spinner"></span> <span class="muted">${escapeHtml(label||"Working...")}</span>`;
      } else {
        // keep whatever message was set by the action; do not overwrite
      }
    }
  }


    function setBg(tab){
    const theme = TAB_THEME[tab] || TAB_THEME.home;
    const bg = (typeof theme === "function") ? theme() : theme;
    document.documentElement.style.setProperty("--bg", bg);
    applyWallpaper(tab);
    applyUserBg(tab);
  }

  function ensurePredictionTabVisible(){
    try{
      const tabs = document.querySelector(".tabs");
      if (!tabs) return;
      let btn = document.getElementById("t_prediction");
      if (!btn){
        btn = document.createElement("button");
        btn.className = "tab";
        btn.id = "t_prediction";
        btn.dataset.tab = "prediction";
        btn.textContent = "Prediction Market";
        const before = document.getElementById("t_wallet");
        if (before && before.parentNode === tabs) tabs.insertBefore(btn, before);
        else tabs.appendChild(btn);
      }
      btn.classList.remove("hidden");
      let pane = document.getElementById("tab-prediction");
      if (!pane){
        pane = document.createElement("div");
        pane.id = "tab-prediction";
        pane.className = "hidden";
        pane.innerHTML = `<div class="card"><div class="title">Prediction Market</div><div class="note">Coming soon.</div></div>`;
        tabs.insertAdjacentElement("afterend", pane);
      }
      pane.classList.add("hidden");
    }catch{}
  }

    function showTab(name){
    name = normalizeTopLevelTab(name);
    CURRENT_TAB = name;
    document.querySelectorAll(".tab").forEach(b=>b.classList.toggle("active", b.dataset.tab===name));
    TOP_LEVEL_TABS.forEach(k=>{
      const el = document.getElementById("tab-"+k);
      if (el) el.classList.toggle("hidden", k!==name);
    });
    setBg(name);
    try{ localStorage.setItem(LS_LAST_TAB, name); }catch(_e){}
  
    try{ applyLang(); }catch(e){}
    try{ updateLangFlags(); }catch(e){}
    try{ renderWallpaperUI(); }catch(e){}
  
    if (name === "referrals"){
      try{ if (getHandle()) $("refLoad")?.click(); }catch(e){}
    }
    if (name === "leaderboard"){
      try{ bindLeaderboardUI(); }catch(e){}
      try{ loadLeaderboard(LB_DAYS||7); }catch(e){}
    }
    if (name === "prediction"){
      try{ loadPredictionSignals({ force:true }); }catch(e){}
    }
    if (name === "extthemes") {
      try{ renderExtThemes(); }catch(e){}
      try{ renderExtWallpapers(); }catch(e){}
      try{ renderExtCustomBgUI(); }catch(e){}
      try{ setExtView(normalizeExtViewValue(localStorage.getItem(LS_EXT_VIEW)||"theme"), { force:true, silent:true }); }catch(e){}
    }
    if (name === "admin"){
      try{ syncAdminUi(); }catch(e){}
    }
    if (name === "wallet"){
      try{ loadPlans(); }catch(e){}
      try{ loadBillingProof(); }catch(e){}
      try{ setSfUi(); }catch(e){}
    }
}

// Simple info modal (no dependencies)
  function showInfoModal(title, html){
    try{
      const old = document.getElementById("gmxInfoModal");
      if (old) old.remove();
      const wrap = document.createElement("div");
      wrap.id = "gmxInfoModal";
      wrap.style.cssText = "position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,.55);display:flex;align-items:center;justify-content:center;padding:16px;";
      wrap.innerHTML = `
        <div style="max-width:520px;width:100%;background:rgba(20,20,24,.98);border:1px solid rgba(255,255,255,.12);border-radius:16px;box-shadow:0 12px 40px rgba(0,0,0,.5);padding:16px 16px 12px;">
          <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:10px;">
            <div style="font-weight:800;font-size:15px;line-height:1.2;">${escapeHtml(title||"Info")}</div>
            <button id="gmxInfoClose" type="button" style="border:0;background:rgba(255,255,255,.08);color:#fff;border-radius:10px;padding:6px 10px;cursor:pointer;">OK</button>
          </div>
          <div style="font-size:13px;line-height:1.45;color:rgba(255,255,255,.88);">${html||""}</div>
        </div>
      `;
      wrap.addEventListener("click", (e)=>{ if (e.target===wrap) wrap.remove(); });
      document.body.appendChild(wrap);
      const btn = document.getElementById("gmxInfoClose");
      if (btn) btn.onclick = ()=>wrap.remove();
    }catch(e){}
  }


  function tab(name){
    const nextTab = (name === "_force_home") ? "home" : normalizeTopLevelTab(name);
    // Browsing is always allowed. Actions are gated via requireConnected().
    showTab(nextTab);
    try{ trackEvent("tab_open", { tab: String(nextTab||"") }); }catch(_e){}
  }
  try{ globalThis.__gmxShowTab = tab; }catch(_e){}
  try{ globalThis.switchTab = tab; }catch(_e){}
  ensurePredictionTabVisible();
  document.querySelectorAll(".tab").forEach(b=>b.addEventListener("click", ()=>tab(b.dataset.tab)));

  function normalizeHandle(input){ return __getGMXAuth().normalizeHandle(input); }

  function getHandle(){ return __getGMXAuth().getHandle(); }

  function siteLang(){
    try{ return String(localStorage.getItem(LS_SITE_LANG) || "en").toLowerCase(); }catch(_e){ return "en"; }
  }
  function getBestMode(){
    try{ return localStorage.getItem(LS_BEST_ENABLED) === "1"; }catch(_e){ return false; }
  }
  function setBestMode(next, silent){
    const on = !!next;
    try{ localStorage.setItem(LS_BEST_ENABLED, on ? "1" : "0"); }catch(_e){}
    try{ syncBestModeUi(); }catch(_e){}
    if (!silent){
      try{ window.postMessage({ type: "GMX_SYNC_NOW", reason: "best_mode_change" }, "*"); }catch(_e){}
    }
    return on;
  }
  function ensureFreshToggleDefaults(){
    try{
      if (localStorage.getItem(LS_TOGGLES_BOOTSTRAP_V2) === "1") return;
      localStorage.setItem(LS_BEST_ENABLED, "0");
      localStorage.setItem(LS_GM_CLEAN_FILL, "0");
      localStorage.setItem(LS_GN_CLEAN_FILL, "0");
      localStorage.setItem(LS_TOGGLES_BOOTSTRAP_V2, "1");
    }catch(_e){}
  }

  function bestCopyText(){
    return getBestMode()
      ? {
          btn: "Best: live",
          hint: "Best live pulls fresh options, keeps the strongest one, and saves it."
        }
      : {
          btn: "Best: saved",
          hint: "Best uses the strongest line from your saved list."
        };
  }
  function syncBestModeUi(){
    const copy = bestCopyText();
    ["gmBestModeToggle","gnBestModeToggle"].forEach((id)=>{ const el = $(id); if (el) el.textContent = copy.btn; });
    ["gmBestModeHint","gnBestModeHint"].forEach((id)=>{ const el = $(id); if (el) el.textContent = copy.hint; });
    ["gmBestBtn","gnBestBtn"].forEach((id)=>{ const el = $(id); if (el) el.textContent = getBestMode() ? "Best live" : "Best"; });
  }

  ensureFreshToggleDefaults();
  try{ syncBestModeUi(); }catch(_e){}
  try{ syncCleanFillUi(); }catch(_e){}

  // --- Lightweight analytics (no content) ---
  function abVariant(){
    const h = getHandle() || "anon";
    const key = "gmx_ab_paywall_v1_" + h;
    const cached = localStorage.getItem(key);
    if (cached === "A" || cached === "B") return cached;
    // stable hash (fast)
    let x = 5381;
    for (let i=0;i<h.length;i++) x = ((x<<5)+x) + h.charCodeAt(i);
    const v = (Math.abs(x) % 2 === 0) ? "A" : "B";
    localStorage.setItem(key, v);
    return v;
  }

  async function trackEvent(type, meta){
    if (!getToken()){ return; }
    try{
      if (!getHandle()) return;
      await api("/api/event", "POST", { type, meta: meta || {} });
    }catch(_e){}
  }

  // --- Soft paywall modal ---
  function openLimitModal(payload){
    const m = $("limit_modal");
    if (!m) return;
    const v = abVariant();
    const desc = $("limit_modal_desc");
    const hint = $("limit_modal_hint");
    const kind = payload?.kind || "gm";
    const resetAt = payload?.resetAt || "";
    if (desc){
      desc.textContent = (v === "A")
        ? `You reached the free saved-line cap for ${kind.toUpperCase()}. Upgrade to Pro for unlimited saved lines + all cosmetics`
        : `Free saved-line cap reached for ${kind.toUpperCase()}. Pro removes caps and unlocks everything`;
    }
    if (hint){
      hint.textContent = resetAt ? (`Next reset: ${resetAt}`) : "";
    }
    m.classList.remove("hidden");
    trackEvent("upgrade_modal_open", { v, kind, reason: payload?.reason || "limit" });
  }
  function closeLimitModal(){
    const m = $("limit_modal");
    if (m) m.classList.add("hidden");
  }

  function bindLimitModal(){
    const m = $("limit_modal");
    const close = $("limit_modal_close");
    const up = $("limit_modal_upgrade");
    if (m) m.addEventListener("click", (e)=>{ if (e.target === m) closeLimitModal(); });
    if (close) close.onclick = ()=>closeLimitModal();
    if (up) up.onclick = ()=>{
      closeLimitModal();
      // move user to Upgrade Pro tab
      try{ tab("wallet"); }catch{}
      trackEvent("pay_click", { v: abVariant(), source:"paywall_modal" });
    };
  }

  // --- Payment UX state machine ---
  function setPayState(state, hint){
    const box = $("pay_state_box");
    const s1 = $("pay_step_processing");
    const s2 = $("pay_step_confirming");
    const s3 = $("pay_step_verified");
    const h = $("pay_state_hint");
    if (!box || !s1 || !s2 || !s3) return;

    const reset = ()=>{
      [s1,s2,s3].forEach(x=>{
        x.style.opacity = "0.55";
        x.style.borderColor = "var(--border)";
      });
    };
    reset();
    box.classList.remove("hidden");

    const on = (el)=>{
      el.style.opacity = "1";
      el.style.borderColor = "rgba(0,0,0,0.25)";
    };

    if (state === "idle"){
      box.classList.add("hidden");
    } else if (state === "processing"){
      on(s1);
    } else if (state === "confirming"){
      on(s1); on(s2);
    } else if (state === "verified"){
      on(s1); on(s2); on(s3);
    } else if (state === "failed"){
      // show as processing but with hint
      on(s1);
    }
    if (h) h.textContent = hint ? String(hint) : "";
  }

  function openPaySuccess(){
    const m = $("pay_success_modal");
    if (!m) return;
    m.classList.remove("hidden");
  }
  function closePaySuccess(){
    const m = $("pay_success_modal");
    if (m) m.classList.add("hidden");
  }
  function bindPaySuccess(){
    const m = $("pay_success_modal");
    const ok = $("pay_success_ok");
    if (m) m.addEventListener("click", (e)=>{ if (e.target === m) closePaySuccess(); });
    if (ok) ok.onclick = ()=>closePaySuccess();
  }

  function getToken(){ return __getGMXAuth().getToken(); }

  function isConnected(){ return __getGMXAuth().isConnected(); }
  function requireConnected(target){ return __getGMXAuth().requireConnected(target); }

  
  function isPublicApi(path){ return __getGMXAuth().isPublicApi(path); }

  async function initSession(force=false){ return await __getGMXAuth().initSession(force); }

  async function api(path, method="GET", body, opts={}){ return await __getGMXAuth().api(path, method, body, opts); }

  var __gmxAuthInstance;

  function __getGMXAuth(){
    if (__gmxAuthInstance) return __gmxAuthInstance;
    if (!window.__GMXAuthFactory) throw new Error("GMX auth factory missing");
    __gmxAuthInstance = window.__GMXAuthFactory({
      API,
      LS_HANDLE,
      LS_TOKEN,
      LS_IS_ADMIN,
      LS_ADMIN_CLAIMABLE,
      isLocalDevHost,
      getAdminToken,
      setAuthOk: (v)=>{ AUTH_OK = !!v; },
      $,
      t,
      toast,
      escapeHtml,
      applyAdminVisibility,
      ping,
      setDegraded
    });
    return __gmxAuthInstance;
  }



  function setApiPillState(state){
    const d = $("apiDot");
    const tEl = $("apiText");
    const active = state === "active";
    if (d) d.classList.toggle("ok", active);
    if (tEl) tEl.textContent = active ? "active" : (state === "offline" ? "offline" : "inactive");
  }

  async function ping(){
    const sessionLive = !!(getHandle() && getToken() && AUTH_OK);
    if (!sessionLive){
      setApiPillState("inactive");
      return;
    }
    try{
      const j = await api("/api/health");
      setApiPillState(j && j.ok ? "active" : "offline");
    }catch{
      setApiPillState("offline");
    }
  }

  // Expose a retry hook for the degraded bar (wired earlier).
  window.__gmxRetryNow = async ()=>{
    try{ await ping(); }catch{}
    // If user already set a handle, try to refresh token silently.
    try{ if (getHandle()) await initSession(true); }catch{}
    // Refresh public panels when possible.
    try{ if (CURRENT_TAB === "wallet"){ await loadPlans(); await loadBillingProof(); } }catch{}
    try{ if (CURRENT_TAB === "referrals"){ scheduleRefStatsRefresh(120); } }catch{}
    try{ if (getHandle()) await refreshUsage(); }catch{}
  };

  window.addEventListener("online", ()=>{ try{ setDegraded(false); window.__gmxRetryNow?.(); }catch{} });

  let BUILD_ID = "";

  async function loadBuild(){
    try{
      const j = await api("/api/version?x=1");
      BUILD_ID = String(j.build || "");
      const b = $("ui_build");
      if (b) b.textContent = BUILD_ID ? ("build " + BUILD_ID) : "";
      const link = document.querySelector('link[rel="stylesheet"]');
      if (link && link.href.includes("BUILD")){
        link.href = "/app.css?v=" + encodeURIComponent(j.build);
      }
    }catch{
      AUTH_OK = false;
      try{ applyAdminVisibility(); }catch{}
    }
  }

  function watchBuildUpdates(){
    // Helps when the wallet/extension updates and the page needs a clean reload.
    let last = BUILD_ID;
    let busy = false;
    setInterval(async ()=>{
      if (busy) return;
      busy = true;
      try{
        const j = await api("/api/version?x=1");
        const now = String(j.build || "");
        if (last && now && now !== last){
          toast("ok", "Update installed. Reloading...");
          setTimeout(()=>{ try{ location.reload(); }catch{} }, 700);
        }
        if (now) last = now;
      }catch(e){}
      busy = false;
    }, 5 * 60 * 1000);
  }


  function normLimitForUI(limit){
    const n = Number(limit);
    if (!Number.isFinite(n)) return Infinity;
    // backend uses a huge number to represent "unlimited" for Pro
    if (n >= 999999) return Infinity;
    return n;
  }

  function setMeter(valId, fillId, used, limit){
    const v = $(valId);
    const f = $(fillId);
    const cap = normLimitForUI(limit);
    if (v) v.textContent = (cap === Infinity) ? `${used}/unlimited` : `${used}/${cap}`;
    if (f){
      const pct = (cap === Infinity) ? 100 : (cap ? Math.min(100, Math.round((used/cap)*100)) : 0);
      f.style.width = pct + "%";
    }
  }

function renderHelpModal(){
  const gmSaved = Number(LAST_SAVED.gm ?? 0) || 0;
  const gnSaved = Number(LAST_SAVED.gn ?? 0) || 0;
  const gmUsed = Number(LAST_USAGE?.gm?.used ?? 0) || 0;
  const gnUsed = Number(LAST_USAGE?.gn?.used ?? 0) || 0;
  const gmLimit = normLimitForUI(LAST_USAGE?.gm?.limit ?? 70);
  const gnLimit = normLimitForUI(LAST_USAGE?.gn?.limit ?? 70);

  const savedEl = $("help_saved");
  if (savedEl) savedEl.textContent = isPro() ? `GM ${gmSaved}/unlimited • GN ${gnSaved}/unlimited` : `GM ${gmSaved}/${SAVE_CAP_FREE} • GN ${gnSaved}/${SAVE_CAP_FREE}`;

  const dailyEl = $("help_daily");
  if (dailyEl) dailyEl.textContent = (isPro() || gmLimit===Infinity || gnLimit===Infinity)
    ? `GM ${gmUsed}/unlimited • GN ${gnUsed}/unlimited`
    : `GM ${gmUsed}/${gmLimit} • GN ${gnUsed}/${gnLimit}`;

  // aggregate bars
  const savedFill = $("helpSavedFill");
  if (savedFill){
    if (isPro()) savedFill.style.width = "100%";
    else{
      const used = gmSaved + gnSaved;
      const cap = SAVE_CAP_FREE * 2;
      savedFill.style.width = Math.min(100, Math.round((used/cap)*100)) + "%";
    }
  }
  const dailyFill = $("helpDailyFill");
  if (dailyFill){
    if (isPro() || gmLimit===Infinity || gnLimit===Infinity) dailyFill.style.width = "100%";
    else{
      const used = gmUsed + gnUsed;
      const cap = (gmLimit + gnLimit) || 140;
      dailyFill.style.width = Math.min(100, Math.round((used/cap)*100)) + "%";
    }
  }
}

function openHelpModal(){
  const m = $("help_modal");
  if (!m) return;
  try{ renderHelpModal(); }catch{}
  m.classList.remove("hidden");
}
function closeHelpModal(){
  const m = $("help_modal");
  if (!m) return;
  m.classList.add("hidden");
}

function bindHelpModal(){
  const m = $("help_modal");
  if (!m) return;
  m.addEventListener("click", (e)=>{ if (e.target === m) closeHelpModal(); });

  const closeBtn = $("help_close");
  if (closeBtn) closeBtn.onclick = ()=>closeHelpModal();

  const goWallet = $("help_go_wallet");
  if (goWallet) goWallet.onclick = ()=>{ closeHelpModal(); tab("wallet"); };

  const openBtn = $("btnHelp");
  if (openBtn) openBtn.onclick = ()=>openHelpModal();

  window.addEventListener("keydown", (e)=>{
    if (e.key === "Escape" && !$("help_modal")?.classList.contains("hidden")) closeHelpModal();
    if (e.key === "?" && ($("help_modal")?.classList.contains("hidden"))) openHelpModal();
  });
}

function applyRefCountEligible(eligible, { renderUnlockUi = false } = {}){
    const num = Math.max(0, Number(eligible || 0) || 0);
    const changed = REF_COUNT !== num;
    REF_COUNT = num;
    try{ localStorage.setItem(LS_REF_ELIGIBLE_CACHE, String(num)); }catch(_e){}
    if ($("refCountPill")) $("refCountPill").textContent = String(num);
    if ($("refCountRight")) $("refCountRight").textContent = String(num);
    if ($("refCountInline")) $("refCountInline").textContent = String(num);
    if ($("refEligibleInline")) $("refEligibleInline").textContent = String(num);
    if (!renderUnlockUi || !changed) return changed;
    try{ renderThemes(); }catch(_e){}
    try{ renderExtThemes(); }catch(_e){}
    try{ fillStyles(); }catch(_e){}
    try{ fillPacks(); }catch(_e){}
    return changed;
  }

  function usageCosmeticSignature(j){
    const eligible = Number(j?.limits?.referralUnlocks?.eligible ?? 0) || 0;
    const tier = String(j?.sub?.tier || j?.sub?.plan || "");
    const active = j?.sub?.active ? "1" : "0";
    return `${active}|${tier}|${eligible}|${SAVE_CAP_FREE}`;
  }

async function refreshUsage(){
    if (!getToken()){ return; }
    const h = getHandle();
    if (!h) return;
    try{
      const j = await api("/api/usage");
      AUTH_OK = true;
      applyAdminVisibility();

      const fallbackFree = Number(j?.limits?.freeDaily ?? 70) || 70;
      // Keep Free saved-lines cap in sync with backend config (no UI hardcodes)
      const cap = Number(j?.limits?.saveCapFree ?? SAVE_CAP_FREE) || SAVE_CAP_FREE;
      SAVE_CAP_FREE = Math.max(10, Math.min(1000, cap));
      const gm = j.gm || { used:0, limit:fallbackFree };
            const gn = j.gn || { used:0, limit:fallbackFree };

      LAST_USAGE = { gm, gn, resetAt: j.resetAt || null };

      SUB = j.sub || null;
      renderWalletStatus(j.sub);

      applyRefCountEligible(Number(j?.limits?.referralUnlocks?.eligible ?? 0) || 0, { renderUnlockUi: true });

      const gmCapUI = normLimitForUI(gm.limit);
      const gnCapUI = normLimitForUI(gn.limit);
      const up = $("usedPill");
      if (up) up.textContent = (isPro() || gmCapUI===Infinity || gnCapUI===Infinity)
        ? `GM ${gm.used}/unlimited • GN ${gn.used}/unlimited`
        : `GM ${gm.used}/${gmCapUI} • GN ${gn.used}/${gnCapUI}`;

      // Header status pills
      try{
        const pp = $("planPill");
        if (pp) pp.textContent = isPro() ? "Pro" : "Free";
        const sp = $("syncPill");
        if (sp) {
          const d = new Date();
          sp.textContent = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
        }
      }catch(_e){}

      // meters (optional)
      setMeter("gmDailyVal","gmDailyFill", gm.used, gm.limit);
      setMeter("gnDailyVal","gnDailyFill", gn.used, gn.limit);

      const gmu = $("kGmUsed");
      if (gmu) gmu.textContent = String(gm.used);
      const gnu = $("kGnUsed");
      if (gnu) gnu.textContent = String(gn.used);

      const ra = $("kResetAt");
      if (ra) ra.textContent = j.resetAt || "-";

      const cosmeticSig = usageCosmeticSignature(j);
      if (cosmeticSig !== LAST_USAGE_COSMETIC_SIG){
        LAST_USAGE_COSMETIC_SIG = cosmeticSig;
        fillStyles();
        fillPacks();
        try{ window.__syncProControls && window.__syncProControls(); }catch(e){}
        applyUserBg();
        initWallpapers();
        renderThemes();
        initExtWallpaperControls();
        normalizeStoredExtWallpaperSelections();
        renderExtThemes();
        renderExtWallpapers();
        renderExtCustomBgUI();
        setExtView(normalizeExtViewValue(localStorage.getItem(LS_EXT_VIEW)||"theme"), { force:true, silent:true });
      }

      try{ scheduleRefStatsRefresh(120); }catch(e){}

      try{ if (!$("help_modal")?.classList.contains("hidden")) renderHelpModal(); }catch(_e){}
    }catch(e){
      AUTH_OK = false;
      try{ applyAdminVisibility(); }catch(_e){}
    }
  }

  function applyAdminVisibility(){
    const h = getHandle();
    const tok = localStorage.getItem(LS_TOKEN) || "";
    // show Admin only after we validated the session in this page load
    const isAdmin = AUTH_OK && (localStorage.getItem(LS_IS_ADMIN) === "1");
    const ta = $("t_admin");
    if (ta) ta.classList.toggle("hidden", !isAdmin);
    if (!isAdmin) document.getElementById("tab-admin")?.classList.add("hidden");
  }

