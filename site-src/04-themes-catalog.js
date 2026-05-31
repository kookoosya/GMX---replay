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


  const GM_PACKS = [
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
    { id:"king",    name:"Market Read PM",   pro:false, style:"alpha",   mode:"mid", anti:2, clean:true },
    { id:"degen",   name:"CT Night",         pro:true,  style:"degen",   mode:"mid", anti:4, clean:true },
    { id:"minimal", name:"Tight GN",         pro:true,  style:"minimal", mode:"min", anti:4, clean:true },
    { id:"builder", name:"Builder PM",       pro:true,  style:"builder", mode:"mid", anti:4, clean:true },
    { id:"kind",    name:"Soft Close",       pro:true,  style:"calm",    mode:"mid", anti:4, clean:true },
    { id:"aggro",   name:"Alpha Push PM",    pro:true,  style:"alpha",   mode:"max", anti:3, clean:true },
  ];
  const PACKS = GM_PACKS;

  function packsForKind(kind){
    return kind === "gn" ? GN_PACKS : GM_PACKS;
  }


  function readGenParams(kind){
    const modeEl = kind === "gm" ? $("gmMode") : $("gnMode");
    const styleEl = kind === "gm" ? $("gmStyle") : $("gnStyle");
    const mode = modeEl ? modeEl.value : "mid";
    const lang = currentLang(kind);
    const style = styleEl ? styleEl.value : "classic";
    const strength = getAntiStrength(kind);
    const antiN = antiWindow(strength);
    return { mode, lang, style, antiN };
  }

  function applyPackDefaultsToUi(kind, pack){
    if (!pack) return;
    const styleSel = kind === "gm" ? $("gmStyle") : $("gnStyle");
    const modeSel  = kind === "gm" ? $("gmMode")  : $("gnMode");
    if (styleSel && pack.style) styleSel.value = pack.style;
    if (modeSel && pack.mode) modeSel.value = pack.mode;
    try{ syncModePanelCopy(); }catch(_e){}
  }

  function unlockedPacksCountFor(kind){
    return unlockedCountByRefs(packsForKind(kind).length, FREE_VISIBLE_PACKS);
  }

  function fillPacks(){
    const fill = (kind, sel, lsKey)=>{
      if (!sel) return;
      const packs = packsForKind(kind);
      const unlocked = unlockedPacksCountFor(kind);
      const prev = localStorage.getItem(lsKey) || "classic";
      sel.innerHTML = "";
      packs.forEach((p, idx)=>{
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
    fill("gm", $("gmPack"), LS_GM_PACK);
    fill("gn", $("gnPack"), LS_GN_PACK);
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

