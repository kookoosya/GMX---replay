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
  "Neon Masked Guardian",
  "Cosmic Armor",
  "Comic Thunder Hero",
  "Crimson Vigilante",
  "Midnight Avenger",
  "Urban Shield",
  "Halftone Hero",
  "Skyline Sentinel",
  "Electric Knight",
  "Shadow Defender",
  "Powered Guardian",
  "Neon Cape",
  "Thunder Mask",
  "Armor Pulse",
  "Hero Portrait",
  "Anime Cyber Runner",
  "Manga Night Warrior",
  "Neon Ronin",
  "Pastel Hacker",
  "Cyber Student",
  "Twin-Tail Pilot",
  "Rain Runner",
  "Violet Mech",
  "Electric Katana",
  "Moon Ronin",
  "Fox Spirit",
  "Street Fighter",
  "Neon Samurai",
  "Chrome Idol",
  "Anime Portrait",
  "Solana Core",
  "Ethereum Vault",
  "Bitcoin Citadel",
  "Web3 Vault",
  "Onchain Terminal",
  "Blockchain Node",
  "Token Forge",
  "DeFi Hub",
  "Crypto Floor",
  "Wallet Glow",
  "NFT Gallery",
  "Node Mesh",
  "Mecha Defender",
  "Chrome Titan",
  "Neon Mech",
  "Cyber Frame",
  "Armored Unit",
  "Plasma Mech",
  "Steel Guardian",
  "Circuit Titan",
  "Neon Exo",
  "Mech Portrait",
  "Crystal Mage",
  "Dragon Knight",
  "Forest Spirit",
  "Moon Cleric",
  "Arcane Hunter",
  "Void Gradient",
  "Dark Glass",
  "Minimal Pulse"
];

    const SITE_PACK_NAMES = [
  "Neon Masked Guardian",
  "Cosmic Armor Sentinel",
  "Comic Thunder Squad",
  "Crimson Cape Vigilante",
  "Midnight Hero Patrol",
  "Urban Shield Warrior",
  "Halftone Justice",
  "Skyline Defender",
  "Electric Mask Knight",
  "Shadow Avenger",
  "Powered Alley Guardian",
  "Neon Vigilante",
  "Anime Cyber Runner",
  "Manga Night Warrior",
  "Neon Blade Runner",
  "Pastel Ronin",
  "Cyberpunk Student",
  "Twin-Tail Hacker",
  "Rain Alley Runner",
  "Violet Mech Pilot",
  "Electric Katana",
  "Moonlit Ronin",
  "Neon Fox Spirit",
  "Chrome Street Fighter",
  "Solana Neon Core",
  "Ethereum Vault",
  "Bitcoin Citadel",
  "Web3 Vault",
  "Onchain City",
  "Blockchain Nexus",
  "Token Forge",
  "DeFi Terminal",
  "Crypto Trading Floor",
  "Hardware Wallet Glow",
  "NFT Gallery Hall",
  "Node Network",
  "Mecha City Defender",
  "Chrome Titan",
  "Neon Mech Unit",
  "Cyber Frame Alpha",
  "Armored Sentinel",
  "Plasma Mech",
  "Steel Guardian",
  "Circuit Colossus",
  "Neon Exo Suit",
  "Neon District",
  "Glass Tower Night",
  "Rain City Glow",
  "Skyline Pulse",
  "Metro After Dark",
  "Harbor Lights",
  "Bridge Neon",
  "Urban Horizon",
  "Night Market",
  "Tower District",
  "Canal Reflections",
  "City Haze",
  "Neon Alley",
  "Skyline Drift",
  "Late Night Grid",
  "Mist Valley",
  "Ocean Depths",
  "Forest Canopy",
  "Mountain Dawn",
  "Desert Horizon",
  "Northern Glow",
  "Coastal Cliffs",
  "Pine Ridge",
  "Waterfall Mist",
  "Lake Mirror",
  "Canyon Light",
  "Rain Forest",
  "Highland Fog",
  "Tide Pool",
  "Summit Clouds",
  "Orbital Ring",
  "Nebula Drift",
  "Lunar Horizon",
  "Deep Space Gate",
  "Galaxy Spine",
  "Planet Rise",
  "Cosmic Dust",
  "Starfield",
  "Satellite Arc",
  "Void Aurora",
  "Crystal Castle",
  "Dragon Valley",
  "Mystic Forest",
  "Floating Isles",
  "Ancient Ruins",
  "Moon Temple",
  "Enchanted Peaks",
  "Spirit Lake",
  "Glass Gradient",
  "Dark Geometry",
  "Soft Texture",
  "Minimal Grid",
  "Muted Glass",
  "Quiet Lines",
  "Shadow Plane"
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
      return `sitev5_${String(Number(m[1])).padStart(3, "0")}.webp`;
    }

    function extPackAssetFile(id) {
      let m = String(id || "").match(/^extskin_(\d+)$/i);
      if (!m) m = String(id || "").match(/^extv3_(\d+)$/i);
      if (!m) return "";
      const n = Math.max(1, Math.min(EXT_PACK_COUNT, Number(m[1]) || 1));
      return `extskin_v5_${String(n).padStart(3, "0")}.webp`;
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
      m = v.match(/^ext_(\d{1,3})$/i);
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
      return `/assets/wallpapers/thumbs/sitev5_001.webp${revQuery()}`;
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
      return `/assets/extskins/thumbs/extskin_v5_001.webp${revQuery()}`;
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
