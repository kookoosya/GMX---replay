(function (window) {
  if (window.__GMXThemesFactory) return;
  window.__GMXThemesFactory = function createGMXThemes() {
    const THEMES = [
    { id:"classic",  name:"Classic Glass", a:"rgba(124,92,255,1)", b:"rgba(0,229,255,1)" },
    { id:"midnight", name:"Midnight",    a:"rgba(98,114,255,1)",  b:"rgba(0,200,255,1)" },
    { id:"sunrise",  name:"Sunrise",     a:"rgba(255,122,0,1)",   b:"rgba(255,75,145,1)" },
    { id:"emerald",  name:"Emerald",       a:"rgba(0,229,125,1)",   b:"rgba(0,200,255,1)" },
    { id:"gold",     name:"Gold Rush",      a:"rgba(255,210,77,1)",  b:"rgba(255,122,0,1)" },

    { id:"berry",    name:"Berry",   a:"rgba(255,75,145,1)",  b:"rgba(124,92,255,1)" },
    { id:"ice",      name:"Ice",        a:"rgba(0,229,255,1)",   b:"rgba(200,245,255,1)" },
    { id:"lava",     name:"Lava",        a:"rgba(255,60,0,1)",    b:"rgba(255,210,77,1)" },
    { id:"matrix",   name:"Matrix",    a:"rgba(0,255,160,1)",   b:"rgba(0,200,80,1)" },
    { id:"violet",   name:"Violet",       a:"rgba(180,110,255,1)", b:"rgba(124,92,255,1)" },

    { id:"ocean",    name:"Ocean",          a:"rgba(0,160,255,1)",   b:"rgba(0,229,255,1)" },
    { id:"sand",     name:"Sand",         a:"rgba(255,210,150,1)", b:"rgba(255,122,0,1)" },
    { id:"carbon",   name:"Carbon",         a:"rgba(180,180,190,1)", b:"rgba(90,95,110,1)" },
    { id:"plasma",   name:"Plasma",       a:"rgba(255,75,145,1)",  b:"rgba(0,229,255,1)" },
    { id:"mint",     name:"Mint",        a:"rgba(120,255,210,1)", b:"rgba(0,200,255,1)" },

    { id:"royal",    name:"Royal",     a:"rgba(124,92,255,1)",  b:"rgba(255,210,77,1)" },
    { id:"peach",    name:"Peach",        a:"rgba(255,160,120,1)", b:"rgba(255,75,145,1)" },
    { id:"storm",    name:"Storm",         a:"rgba(90,120,200,1)",  b:"rgba(80,90,140,1)" },
    { id:"neon",     name:"Neon",        a:"rgba(0,229,255,1)",   b:"rgba(0,229,125,1)" },
    { id:"mono",     name:"Mono",      a:"rgba(220,220,225,1)", b:"rgba(160,160,170,1)" },

    // Premium pack (80)
    { id:"p01", name:"Aurora Glass", a:"rgba(0,229,255,1)", b:"rgba(124,92,255,1)" },
    { id:"p02", name:"Neon Pulse", a:"rgba(238,94,184,1)", b:"rgba(32,200,210,1)" },
    { id:"p03", name:"Night Indigo", a:"rgba(24,33,68,1)", b:"rgba(124,92,255,1)" },
    { id:"p04", name:"Mint Pop", a:"rgba(0,229,125,1)", b:"rgba(255,75,145,1)" },
    { id:"p05", name:"Pool Teal", a:"rgba(0,200,255,1)", b:"rgba(0,229,125,1)" },
    { id:"p06", name:"Candy Pink", a:"rgba(255,75,145,1)", b:"rgba(255,210,77,1)" },
    { id:"p07", name:"Shadow Violet", a:"rgba(70,29,132,1)", b:"rgba(0,200,255,1)" },
    { id:"p08", name:"Golden Gleam", a:"rgba(255,210,77,1)", b:"rgba(124,92,255,1)" },
    { id:"p09", name:"Laser Ember", a:"rgba(0,229,255,1)", b:"rgba(255,122,0,1)" },
    { id:"p10", name:"Forest Calm", a:"rgba(0,229,125,1)", b:"rgba(26,132,86,1)" },
    { id:"p11", name:"Crimson Edge", a:"rgba(220,38,38,1)", b:"rgba(124,92,255,1)" },
    { id:"p12", name:"Wave Green", a:"rgba(34,197,94,1)", b:"rgba(0,229,255,1)" },
    { id:"p13", name:"Chrome Sheen", a:"rgba(229,231,235,1)", b:"rgba(124,92,255,1)" },
    { id:"p14", name:"Mist Lavender", a:"rgba(167,139,250,1)", b:"rgba(0,229,255,1)" },
    { id:"p15", name:"Plasma Heat", a:"rgba(255,110,58,1)", b:"rgba(231,38,105,1)" },
    { id:"p16", name:"Builder Steel", a:"rgba(148,163,184,1)", b:"rgba(59,130,246,1)" },
    { id:"p17", name:"Iceberg", a:"rgba(186,230,253,1)", b:"rgba(124,92,255,1)" },
    { id:"p18", name:"Sunset Blaze", a:"rgba(255,122,0,1)", b:"rgba(0,200,255,1)" },
    { id:"p19", name:"Orbit", a:"rgba(17,24,39,1)", b:"rgba(0,200,255,1)" },
    { id:"p20", name:"Photon", a:"rgba(250,250,250,1)", b:"rgba(0,229,255,1)" },
    { id:"p21", name:"Cyber Lime", a:"rgba(163,230,53,1)", b:"rgba(0,200,255,1)" },
    { id:"p22", name:"Royal Violet", a:"rgba(124,92,255,1)", b:"rgba(255,75,145,1)" },
    { id:"p23", name:"Ocean Matrix", a:"rgba(0,200,255,1)", b:"rgba(2,132,199,1)" },
    { id:"p24", name:"Circuit Mint", a:"rgba(76,216,146,1)", b:"rgba(18,168,202,1)" },
    { id:"p25", name:"Pink Noise", a:"rgba(226,67,155,1)", b:"rgba(108,70,212,1)" },
    { id:"p26", name:"Night Market", a:"rgba(15,23,42,1)", b:"rgba(255,210,77,1)" },
    { id:"p27", name:"Starship", a:"rgba(0,229,255,1)", b:"rgba(255,210,77,1)" },
    { id:"p28", name:"Turbo Teal", a:"rgba(20,184,166,1)", b:"rgba(124,92,255,1)" },
    { id:"p29", name:"Sapphire", a:"rgba(59,130,246,1)", b:"rgba(124,92,255,1)" },
    { id:"p30", name:"Blackout Pro", a:"rgba(5,7,14,1)", b:"rgba(124,92,255,1)" },

    // Premium pack continued (80)
    { id:"p31", name:"Neon Bloom", a:"rgba(215,238,43,1)", b:"rgba(37,130,244,1)" },
    { id:"p32", name:"Chrome Circuit", a:"rgba(95,238,43,1)", b:"rgba(195,37,244,1)" },
    { id:"p33", name:"Prism Wave", a:"rgba(43,238,111,1)", b:"rgba(244,37,40,1)" },
    { id:"p34", name:"Aurora Grid", a:"rgba(43,238,231,1)", b:"rgba(202,244,37,1)" },
    { id:"p35", name:"Void Flux", a:"rgba(43,124,238,1)", b:"rgba(37,244,123,1)" },
    { id:"p36", name:"Laser Drive", a:"rgba(82,43,238,1)", b:"rgba(37,113,244,1)" },
    { id:"p37", name:"Cosmic Mist", a:"rgba(202,43,238,1)", b:"rgba(213,37,244,1)" },
    { id:"p38", name:"Glitch Edge", a:"rgba(238,43,153,1)", b:"rgba(244,51,37,1)" },
    { id:"p39", name:"Titan Engine", a:"rgba(238,52,43,1)", b:"rgba(185,244,37,1)" },
    { id:"p40", name:"Sakura Orbit", a:"rgba(238,173,43,1)", b:"rgba(37,244,140,1)" },
    { id:"p41", name:"Solstice Signal", a:"rgba(183,238,43,1)", b:"rgba(37,95,244,1)" },
    { id:"p42", name:"Phantom Drift", a:"rgba(62,238,43,1)", b:"rgba(230,37,244,1)" },
    { id:"p43", name:"Jet Rift", a:"rgba(43,238,144,1)", b:"rgba(244,68,37,1)" },
    { id:"p44", name:"Hyper Matrix", a:"rgba(43,212,238,1)", b:"rgba(168,244,37,1)" },
    { id:"p45", name:"Pulse Runway", a:"rgba(43,91,238,1)", b:"rgba(37,244,157,1)" },
    { id:"p46", name:"Mirage Peak", a:"rgba(114,43,238,1)", b:"rgba(37,78,244,1)" },
    { id:"p47", name:"Holo Forge", a:"rgba(235,43,238,1)", b:"rgba(244,37,240,1)" },
    { id:"p48", name:"Cipher Harbor", a:"rgba(238,43,121,1)", b:"rgba(244,85,37,1)" },
    { id:"p49", name:"Kinetic Relay", a:"rgba(238,85,43,1)", b:"rgba(151,244,37,1)" },
    { id:"p50", name:"Obsidian Vortex", a:"rgba(238,205,43,1)", b:"rgba(37,244,175,1)" },
    { id:"p51", name:"Arctic Spray", a:"rgba(150,238,43,1)", b:"rgba(37,61,244,1)" },
    { id:"p52", name:"Inferno Beacon", a:"rgba(43,238,56,1)", b:"rgba(244,37,223,1)" },
    { id:"p53", name:"Cobalt Temple", a:"rgba(43,238,176,1)", b:"rgba(244,102,37,1)" },
    { id:"p54", name:"Emerald Vista", a:"rgba(43,179,238,1)", b:"rgba(133,244,37,1)" },
    { id:"p55", name:"Magenta Lane", a:"rgba(43,59,238,1)", b:"rgba(37,244,192,1)" },
    { id:"p56", name:"Solar Core", a:"rgba(147,43,238,1)", b:"rgba(37,44,244,1)" },
    { id:"p57", name:"Lunar Pool", a:"rgba(238,43,209,1)", b:"rgba(244,37,206,1)" },
    { id:"p58", name:"Turbo Garden", a:"rgba(238,43,88,1)", b:"rgba(244,120,37,1)" },
    { id:"p59", name:"Quantum Storm", a:"rgba(238,117,43,1)", b:"rgba(116,244,37,1)" },
    { id:"p60", name:"Iridescent Bridge", a:"rgba(238,238,43,1)", b:"rgba(37,244,209,1)" },
    { id:"p61", name:"Deck Neon", a:"rgba(117,238,43,1)", b:"rgba(47,37,244,1)" },
    { id:"p62", name:"Night Node", a:"rgba(43,238,88,1)", b:"rgba(244,37,188,1)" },
    { id:"p63", name:"Dawn Tape", a:"rgba(43,238,209,1)", b:"rgba(244,137,37,1)" },
    { id:"p64", name:"Dusk Portal", a:"rgba(43,147,238,1)", b:"rgba(99,244,37,1)" },
    { id:"p65", name:"Frost Field", a:"rgba(59,43,238,1)", b:"rgba(37,244,226,1)" },
    { id:"p66", name:"Sable Valley", a:"rgba(179,43,238,1)", b:"rgba(65,37,244,1)" },
    { id:"p67", name:"Vapor Spire", a:"rgba(238,43,176,1)", b:"rgba(244,37,171,1)" },
    { id:"p68", name:"Ion Crown", a:"rgba(238,43,56,1)", b:"rgba(244,154,37,1)" },
    { id:"p69", name:"Reactor Rise", a:"rgba(238,150,43,1)", b:"rgba(82,244,37,1)" },
    { id:"p70", name:"Zen Shade", a:"rgba(205,238,43,1)", b:"rgba(37,244,244,1)" },
    { id:"p71", name:"Neon Bloom", a:"rgba(85,238,43,1)", b:"rgba(82,37,244,1)" },
    { id:"p72", name:"Chrome Circuit", a:"rgba(43,238,121,1)", b:"rgba(244,37,154,1)" },
    { id:"p73", name:"Prism Runway", a:"rgba(43,235,238,1)", b:"rgba(244,171,37,1)" },
    { id:"p74", name:"Aurora Beacon", a:"rgba(43,114,238,1)", b:"rgba(65,244,37,1)" },
    { id:"p75", name:"Void Storm", a:"rgba(91,43,238,1)", b:"rgba(37,226,244,1)" },
    { id:"p76", name:"Laser Valley", a:"rgba(212,43,238,1)", b:"rgba(99,37,244,1)" },
    { id:"p77", name:"Cosmic Wave", a:"rgba(238,43,144,1)", b:"rgba(244,37,137,1)" },
    { id:"p78", name:"Glitch Orbit", a:"rgba(238,62,43,1)", b:"rgba(244,188,37,1)" },
    { id:"p79", name:"Titan Forge", a:"rgba(238,183,43,1)", b:"rgba(47,244,37,1)" },
    { id:"p80", name:"Sakura Vista", a:"rgba(173,238,43,1)", b:"rgba(37,209,244,1)" },
  ].slice(0, 60);

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

  const EXT_THEMES = THEMES.map(t=>({ id:t.id, name:t.name, a:t.a, b:t.b }));
  function rgbaToRgbTuple(s){
    const m = String(s||"").match(/rgba?\(([^)]+)\)/i);
    if (!m) return null;
    const parts = m[1].split(",").map(x=>x.trim());
    const r = Number(parts[0]); const g = Number(parts[1]); const b = Number(parts[2]);
    if (![r,g,b].every(Number.isFinite)) return null;
    return [Math.max(0,Math.min(255,r)), Math.max(0,Math.min(255,g)), Math.max(0,Math.min(255,b))];
  }
  function relLum(rgb){
    const f = (v)=>{ v/=255; return (v<=0.04045)? (v/12.92) : Math.pow((v+0.055)/1.055, 2.4); };
    const [r,g,b]=rgb;
    return 0.2126*f(r) + 0.7152*f(g) + 0.0722*f(b);
  }
  function pickAccentOn(a,b){
    const ra = rgbaToRgbTuple(a) || [124,92,255];
    const rb = rgbaToRgbTuple(b) || [0,229,255];
    const lum = (relLum(ra) + relLum(rb)) / 2;
    return (lum > 0.62) ? "#0A0D15" : "#FFFFFF";
  }
  function packsForKindImpl(kind, gmPacks, gnPacks){
    return kind === "gn" ? gnPacks : gmPacks;
  }

    return {
      THEMES,
      STYLES,
      GM_PACKS,
      GN_PACKS,
      PACKS: GM_PACKS,
      EXT_THEMES,
      packsForKind(kind){ return packsForKindImpl(kind, GM_PACKS, GN_PACKS); },
      rgbaToRgbTuple,
      relLum,
      pickAccentOn,
    };
  };
})(window);
