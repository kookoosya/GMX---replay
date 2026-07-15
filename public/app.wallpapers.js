(function (global) {
  if (global.__GMXWallpapersFactory) return;

  global.__GMXWallpapersFactory = function createGMXWallpapers(ctx) {
    const getAssetRev = () => String((ctx && typeof ctx.getAssetRev === "function" ? ctx.getAssetRev() : "") || "");
    const getSiteCustomUpload = () => String((ctx && typeof ctx.getSiteCustomUpload === "function" ? ctx.getSiteCustomUpload() : "") || "");
    const getExtCustomUpload = () => String((ctx && typeof ctx.getExtCustomUpload === "function" ? ctx.getExtCustomUpload() : "") || "");

    const SITE_PACK_COUNT = 100;
    const SITE_FREE_PACK_COUNT = 10;
    const EXT_PACK_COUNT = 60;
    const EXT_FREE_PACK_COUNT = 4;
    const CUSTOM_WP_FREE_COUNT = 5;
    const CUSTOM_UPLOAD_ID = "custom_upload";
    const CUSTOM_WP_RE = /^custom_[a-zA-Z0-9_.-]+\.(png|jpg|jpeg|webp)$/i;

    const EXT_PACK_NAMES = [
      "Obsidian Relay",
      "Glass Meridian",
      "Signal Bloom",
      "Vector Nocturne",
      "Chrome Interval",
      "Midnight Lattice",
      "Quiet Brutalism",
      "Shadow Aperture",
      "Copper Static",
      "Civic Afterglow",
      "Night Transit",
      "Monochrome Axis",
      "Neon Divide",
      "Data Cathedral",
      "Linear Eclipse",
      "Redline Matrix",
      "Prism Facade",
      "Blackwater Circuit",
      "Gold Fracture",
      "Electric Avenue",
      "Twilight Grid",
      "City Frequency",
      "Scarlet Protocol",
      "Skyline Index",
      "Solar Geometry",
      "White Noise Hall",
      "Hardlight Study",
      "Desert Signal",
      "Circuit Blocks",
      "Tunnel Bloom",
      "Afterdark Terrace",
      "Concrete Syntax",
      "Broken Glass",
      "Vertical Weather",
      "Nightline Atlas",
      "Mist Orchard",
      "Paper Weather",
      "Reflective Terrain",
      "Steel Horizon",
      "Luminous Vector",
      "Pixel Foundry",
      "Brutalist Index",
      "Future Circuit",
      "Urban Constellation",
      "Chromatic Field",
      "Shadow Archive",
      "Neon Ravine",
      "Astral Ridge",
      "Amber Surface",
      "Architectural Silence",
      "Stellar Vale",
      "Greenhouse Haze",
      "Signal Quarter",
      "Prismatic Vault",
      "Civic Light",
      "Night Strata",
      "Rift Sculpture",
      "Monumental Gold",
      "Tidal Black",
      "Waveform Coast",
    ];

    const SITE_PACK_NAMES = [
      "Blue Hour Relay",
      "Orbital Departure",
      "Starfield Quiet",
      "Deep Space Bloom",
      "Satellite Afterglow",
      "Indigo Drift",
      "Astral Register",
      "Spiral Index",
      "Celestial Margin",
      "Null Horizon",
      "Ledger Glow",
      "Desert Fall",
      "Neon Borough",
      "Reflective Hills",
      "Ritual Monument",
      "Skyline Pulse",
      "Glass Angle",
      "Mist Archive",
      "Golden Mesa",
      "Grid Terrace",
      "Red Block Theory",
      "Lightcube",
      "City Nightfall",
      "Shadow Stripe",
      "Window Signal",
      "Weathered Paper",
      "Reflected Garden",
      "Prism Chapel",
      "Cathedral Glass",
      "Algorithmic Portrait",
      "Stellar Cartography",
      "Plasma Garden",
      "Ember Atlas",
      "Chainwork",
      "Block Signal",
      "Ledger Bloom",
      "Token Geometry",
      "Vector Muse",
      "Night Street",
      "Town in Amber",
      "Paper Nocturne",
      "Rocket Margin",
      "Arcane Folio",
      "Soft Orbit",
      "Convergence Light",
      "Moon Garden",
      "Generations",
      "Orbiting Dust",
      "Constellation Study",
      "Rocket Vector",
      "Night Bloom",
      "Signal Six",
      "Orbiting Room",
      "Amber Cathedral",
      "Cathedral Signal",
      "Glass Orchard",
      "Quiet Aperture",
      "Dark Lattice",
      "Rust Interval",
      "Shadow Current",
      "Electric Facade",
      "Black Geometry",
      "Solar Wall",
      "Stone Frequency",
      "Night Prism",
      "Steel Repetition",
      "Looped Circuit",
      "Carbon Edge",
      "Future Line",
      "Liquid Circuit",
      "Cyber Meadow",
      "Digital Bloom",
      "Data Veil",
      "Pixel Meridian",
      "Graphite Grid",
      "Signal Garden",
      "Urban Vector",
      "Desert Architecture",
      "Amber Skyline",
      "City Ember",
      "Brutalist Light",
      "Green Shadow",
      "Snow Vault",
      "Monochrome Study",
      "Desert Latitude",
      "Paper Satellite",
      "Coastal Frequency",
      "Hazy Monument",
      "Glass District",
      "Aurora Concrete",
      "Late Signal",
      "White Canyon",
      "Shadowed Hills",
      "Neon Foyer",
      "Winter Geometry",
      "Sunlit Interval",
      "Copper Horizon",
      "Modern Silence",
      "Cloud Atlas",
      "Frontier Static",
    ];

    function buildSiteWallpapers() {
      const out = [];
      for (let i = 1; i <= SITE_PACK_COUNT; i++) {
        const n = String(i).padStart(3, "0");
        out.push({
          id: `v2_${n}`,
          name: SITE_PACK_NAMES[i - 1] || `Scene ${i}`,
          tier: i <= SITE_FREE_PACK_COUNT ? "free" : "premium",
        });
      }
      return out;
    }

    function buildExtWallpapers() {
      const out = [];
      for (let i = 1; i <= EXT_PACK_COUNT; i++) {
        out.push({
          id: `extskin_${String(i).padStart(3, "0")}`,
          name: EXT_PACK_NAMES[i - 1] || `Scene ${i}`,
          tier: i <= EXT_FREE_PACK_COUNT ? "free" : "premium",
        });
      }
      return out;
    }

    function catalogHasId(catalog, id) {
      if (!Array.isArray(catalog)) return false;
      return catalog.some((x) => {
        if (typeof x === "string") return x === id;
        return String(x && x.id || "") === id;
      });
    }

    function normalizeWallpaperId(id, catalog) {
      const v = String(id || "").trim();
      if (!v) return "";
      if (catalogHasId(catalog, v)) return v;
      if (v === CUSTOM_UPLOAD_ID) return v;
      if (CUSTOM_WP_RE.test(v)) return v;
      if (/^w\d+$/i.test(v) || /^v3_\d+$/i.test(v) || /^free\d+$/i.test(v) || /^lux_/i.test(v)) return "v2_001";
      return "v2_001";
    }

    function formatExtSkinIdLocal(n) {
      const num = Math.max(1, Math.min(EXT_PACK_COUNT, Number(n) || 1));
      return `extskin_${String(num).padStart(3, "0")}`;
    }

    function sitePackAssetFile(id) {
      const m = String(id || "").match(/^v2_(\d+)$/i);
      if (!m) return "";
      return `livev1_${String(Number(m[1])).padStart(3, "0")}.webp`;
    }

    function extPackAssetFile(id) {
      let m = String(id || "").match(/^extskin_(\d+)$/i);
      if (!m) m = String(id || "").match(/^extv3_(\d+)$/i);
      if (!m) return "";
      const n = Math.max(1, Math.min(EXT_PACK_COUNT, Number(m[1]) || 1));
      return `liveext_v1_${String(n).padStart(3, "0")}.webp`;
    }

    function normalizeExtWallpaperIdLocal(id, catalog) {
      const v = String(id || "").trim();
      if (!v) return "";
      if (catalogHasId(catalog, v)) return v;
      if (v === CUSTOM_UPLOAD_ID) return v;
      if (CUSTOM_WP_RE.test(v)) return v;
      let m = v.match(/^extskin_(\d{1,3})$/i);
      if (m) return formatExtSkinIdLocal(Number(m[1]) || 1);
      m = v.match(/^extv3_(\d{1,3})$/i);
      if (m) return formatExtSkinIdLocal(Number(m[1]) || 1);
      m = v.match(/^w(\d{1,3})$/i);
      if (m) return formatExtSkinIdLocal(Number(m[1]) || 1);
      if (/^lux_ext_/i.test(v) || /^ext_free_/i.test(v)) return "extskin_001";
      return "extskin_001";
    }

    function wallpaperAssetPath(id) {
      if (!id) return "";
      if (String(id).startsWith("v2_")) return sitePackAssetFile(id);
      return String(id) + ".svg";
    }

    function extWallpaperAssetPath(id, catalog) {
      const norm = normalizeExtWallpaperIdLocal(id, catalog);
      if (!norm) return "";
      if (norm.startsWith("extskin_")) return extPackAssetFile(norm);
      return norm + ".svg";
    }

    function revQuery() {
      const rev = getAssetRev();
      return rev ? `?v=${rev}` : "";
    }

    function wallpaperFullUrl(id, catalog) {
      const norm = normalizeWallpaperId(id, catalog);
      if (!norm) return "";
      if (norm === CUSTOM_UPLOAD_ID) return getSiteCustomUpload();
      if (norm.startsWith("custom_")) return `/assets/wallpapers/custom/${norm.slice(7)}${revQuery()}`;
      if (norm.startsWith("v2_")) {
        const f = sitePackAssetFile(norm);
        return f ? `/assets/wallpapers/${f}${revQuery()}` : "";
      }
      const p = wallpaperAssetPath(norm);
      return p ? `/assets/wallpapers/${p}${revQuery()}` : "";
    }

    function wallpaperThumbUrl(id, catalog) {
      const norm = normalizeWallpaperId(id, catalog);
      if (!norm) return "";
      if (norm === CUSTOM_UPLOAD_ID) return getSiteCustomUpload();
      if (norm.startsWith("custom_")) return `/assets/wallpapers/custom/${norm.slice(7)}${revQuery()}`;
      if (norm.startsWith("v2_")) {
        const f = sitePackAssetFile(norm);
        return f ? `/assets/wallpapers/thumbs/${f}${revQuery()}` : "";
      }
      return `/assets/wallpapers/thumbs/livev1_001.webp${revQuery()}`;
    }

    function wallpaperUrl(id, catalog) {
      const full = wallpaperFullUrl(id, catalog);
      return full ? `url("${full}")` : "none";
    }

    function extWallpaperFullUrl(id, catalog) {
      const norm = normalizeExtWallpaperIdLocal(id, catalog);
      if (!norm) return "";
      if (norm === CUSTOM_UPLOAD_ID) return getExtCustomUpload();
      if (norm.startsWith("custom_")) return `/assets/extskins/custom/${norm.slice(7)}${revQuery()}`;
      if (norm.startsWith("extskin_")) {
        const f = extPackAssetFile(norm);
        return f ? `/assets/extskins/${f}${revQuery()}` : "";
      }
      const p = extWallpaperAssetPath(norm, catalog);
      return p ? `/assets/extskins/${p}${revQuery()}` : "";
    }

    function extWallpaperThumbUrl(id, catalog) {
      const norm = normalizeExtWallpaperIdLocal(id, catalog);
      if (!norm) return "";
      if (norm === CUSTOM_UPLOAD_ID) return getExtCustomUpload();
      if (norm.startsWith("custom_")) return `/assets/extskins/custom/${norm.slice(7)}${revQuery()}`;
      if (norm.startsWith("extskin_")) {
        const f = extPackAssetFile(norm);
        return f ? `/assets/extskins/thumbs/${f}${revQuery()}` : "";
      }
      return `/assets/extskins/thumbs/liveext_v1_001.webp${revQuery()}`;
    }

    return {
      SITE_PACK_COUNT,
      SITE_FREE_PACK_COUNT,
      EXT_PACK_COUNT,
      EXT_FREE_PACK_COUNT,
      CUSTOM_WP_FREE_COUNT,
      CUSTOM_UPLOAD_ID,
      CUSTOM_WP_RE,
      buildSiteWallpapers,
      buildExtWallpapers,
      normalizeWallpaperId,
      normalizeExtWallpaperIdLocal,
      wallpaperAssetPath,
      extWallpaperAssetPath,
      wallpaperFullUrl,
      wallpaperThumbUrl,
      wallpaperUrl,
      extWallpaperFullUrl,
      extWallpaperThumbUrl,
      ensureWallpaperLayer: ensureWallpaperLayerDom,
      setWallpaperLayerImage: setWallpaperLayerImageDom,
    };
  };

  function wallpaperBgMount() {
    if (typeof document === "undefined") return null;
    return document.querySelector(".bg") || document.body;
  }

  function ensureWallpaperLayerDom() {
    const mount = wallpaperBgMount();
    if (!mount) return null;
    let layer = mount.querySelector("#gmxWallLayer") || document.getElementById("gmxWallLayer");
    if (layer && layer.parentElement !== mount) {
      mount.prepend(layer);
    }
    if (!layer) {
      layer = document.createElement("div");
      layer.id = "gmxWallLayer";
      layer.className = "gmxWallLayer";
      layer.setAttribute("aria-hidden", "true");
      mount.prepend(layer);
    }
    return layer;
  }

  function setWallpaperLayerImageDom(layer, url) {
    if (!layer) return;
    const target = String(url || "");
    if (!target) {
      layer.replaceChildren();
      layer.style.display = "none";
      layer.removeAttribute("data-wall-url");
      return;
    }
    if (layer.getAttribute("data-wall-url") === target) {
      layer.style.display = "block";
      return;
    }
    layer.setAttribute("data-wall-url", target);
    const img = document.createElement("img");
    img.className = "gmxWallImg";
    img.alt = "";
    img.decoding = "async";
    img.loading = "eager";
    img.draggable = false;
    img.src = target;
    layer.replaceChildren(img);
    layer.style.display = "block";
  }

  global.ensureWallpaperLayer = ensureWallpaperLayerDom;
  global.setWallpaperLayerImage = setWallpaperLayerImageDom;
})(window);
