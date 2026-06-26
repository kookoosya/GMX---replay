(function (global) {
  if (global.__GMXWallpapersFactory) return;

  global.__GMXWallpapersFactory = function createGMXWallpapers(ctx) {
    const getAssetRev = () => String((ctx && typeof ctx.getAssetRev === "function" ? ctx.getAssetRev() : "") || "");
    const getSiteCustomUpload = () => String((ctx && typeof ctx.getSiteCustomUpload === "function" ? ctx.getSiteCustomUpload() : "") || "");
    const getExtCustomUpload = () => String((ctx && typeof ctx.getExtCustomUpload === "function" ? ctx.getExtCustomUpload() : "") || "");

    const SITE_PACK_COUNT = 100;
    const SITE_FREE_PACK_COUNT = 10;
    const EXT_PACK_COUNT = 100;
    const EXT_FREE_PACK_COUNT = 4;
    const CUSTOM_WP_FREE_COUNT = 5;
    const CUSTOM_UPLOAD_ID = "custom_upload";
    const CUSTOM_WP_RE = /^custom_[a-zA-Z0-9_.-]+\.(png|jpg|jpeg|webp)$/i;

    const EXT_PACK_NAMES = [
  "BTC Stock Chart",
  "Gold Bitcoin",
  "Comic Hero Pages",
  "Alpine Aurora",
  "Blockchain Pulse",
  "Ethereum Pulse",
  "DeFi Pulse",
  "Web3 Pulse",
  "Token Pulse",
  "Satoshi Pulse",
  "Altcoin Pulse",
  "Fintech Pulse",
  "Bitcoin Glow",
  "Crypto Glow",
  "Blockchain Glow",
  "Ethereum Glow",
  "DeFi Glow",
  "Web3 Glow",
  "Token Glow",
  "Satoshi Glow",
  "Altcoin Glow",
  "Fintech Glow",
  "Bitcoin Night",
  "Crypto Night",
  "Blockchain Night",
  "Ethereum Night",
  "DeFi Night",
  "Neo Tokyo Pulse",
  "Cyber Pulse",
  "Shinjuku Pulse",
  "Akihabara Pulse",
  "Neon Alley Pulse",
  "Vaporwave Pulse",
  "Otaku Pulse",
  "Sakura Night Pulse",
  "Blade Runner Pulse",
  "Synth City Pulse",
  "Neo Tokyo Glow",
  "Cyber Glow",
  "Shinjuku Glow",
  "Akihabara Glow",
  "Neon Alley Glow",
  "Vaporwave Glow",
  "Otaku Glow",
  "Sakura Night Glow",
  "Blade Runner Glow",
  "Synth City Glow",
  "Neo Tokyo Night",
  "Cyber Night",
  "Shinjuku Night",
  "Akihabara Night",
  "Neon Alley Night",
  "Marvel Pulse",
  "Comic Pulse",
  "Avenger Pulse",
  "Super Pulse",
  "Shield Pulse",
  "Cape Pulse",
  "Origin Pulse",
  "Power Pulse",
  "Action Pulse",
  "Hero Glow",
  "Marvel Glow",
  "Comic Glow",
  "Avenger Glow",
  "Super Glow",
  "Shield Glow",
  "Cape Glow",
  "Origin Glow",
  "Power Glow",
  "Action Glow",
  "Neon Pulse",
  "City Pulse Pulse",
  "Skyline Pulse",
  "Urban Pulse",
  "Night Drive Pulse",
  "Metro Pulse",
  "Harbor Pulse",
  "Chrome Pulse",
  "Neon Glow",
  "City Pulse Glow",
  "Skyline Glow",
  "Urban Glow",
  "Night Drive Glow",
  "Metro Glow",
  "Harbor Glow",
  "Alpine Pulse",
  "Ocean Pulse",
  "Golden Pulse",
  "Nordic Pulse",
  "Glacier Pulse",
  "Misty Pulse",
  "Coastal Pulse",
  "Desert Pulse",
  "Silk Clouds Pulse",
  "Aurora Glow",
  "Alpine Glow",
  "Ocean Glow",
  "Golden Glow",
  "Nordic Glow"
];

    const SITE_PACK_NAMES = EXT_PACK_NAMES;

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
          id: `extv3_${String(i).padStart(3, "0")}`,
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

    function formatExtPackIdLocal(n) {
      const num = Math.max(1, Math.min(100, Number(n) || 1));
      return `extv3_${String(num).padStart(3, "0")}`;
    }

    function normalizeExtWallpaperIdLocal(id, catalog) {
      const v = String(id || "").trim();
      if (!v) return "";
      if (catalogHasId(catalog, v)) return v;
      if (v === CUSTOM_UPLOAD_ID) return v;
      if (CUSTOM_WP_RE.test(v)) return v;
      let m = v.match(/^extv3_(\d{1,3})$/i);
      if (m) {
        return formatExtPackIdLocal(Number(m[1]) || 1);
      }
      m = v.match(/^ext_free_(\d{1,2})$/i);
      if (m) {
        const n = String(Math.max(1, Math.min(2, Number(m[1]) || 1))).padStart(2, "0");
        return `ext_free_${n}`;
      }
      m = v.match(/^ext_(\d{1,2})$/i);
      if (m) {
        return formatExtPackIdLocal(Number(m[1]) || 1);
      }
      if (/^lux_ext_/i.test(v) || /^ext_free_/i.test(v)) return "extv3_001";
      return "extv3_001";
    }

    function wallpaperAssetPath(id) {
      if (!id) return "";
      if (String(id).startsWith("v2_")) return String(id) + ".webp";
      return String(id) + ".svg";
    }

    function extWallpaperAssetPath(id, catalog) {
      const norm = normalizeExtWallpaperIdLocal(id, catalog);
      if (!norm) return "";
      if (norm.startsWith("extv3_")) return norm + ".webp";
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
      if (norm.startsWith("v2_")) return `/assets/wallpapers/${norm}.webp${revQuery()}`;
      const p = wallpaperAssetPath(norm);
      return p ? `/assets/wallpapers/${p}${revQuery()}` : "";
    }

    function wallpaperThumbUrl(id, catalog) {
      const norm = normalizeWallpaperId(id, catalog);
      if (!norm) return "";
      if (norm === CUSTOM_UPLOAD_ID) return getSiteCustomUpload();
      if (norm.startsWith("custom_")) return `/assets/wallpapers/custom/${norm.slice(7)}${revQuery()}`;
      if (norm.startsWith("v2_")) return `/assets/wallpapers/thumbs/${norm}.webp${revQuery()}`;
      return `/assets/wallpapers/thumbs/v2_001.webp${revQuery()}`;
    }

    function wallpaperUrl(id, catalog) {
      const full = wallpaperFullUrl(id, catalog);
      return full ? `url("${full}")` : "none";
    }

    function extWallpaperFullUrl(id, catalog) {
      const norm = normalizeExtWallpaperIdLocal(id, catalog);
      if (!norm) return "";
      if (norm === CUSTOM_UPLOAD_ID) return getExtCustomUpload();
      if (norm.startsWith("custom_")) return `/assets/extbg/custom/${norm.slice(7)}${revQuery()}`;
      if (norm.startsWith("extv3_")) return `/assets/extbg/${norm}.webp${revQuery()}`;
      const p = extWallpaperAssetPath(norm, catalog);
      return p ? `/assets/extbg/${p}${revQuery()}` : "";
    }

    function extWallpaperThumbUrl(id, catalog) {
      const norm = normalizeExtWallpaperIdLocal(id, catalog);
      if (!norm) return "";
      if (norm === CUSTOM_UPLOAD_ID) return getExtCustomUpload();
      if (norm.startsWith("custom_")) return `/assets/extbg/custom/${norm.slice(7)}${revQuery()}`;
      if (norm.startsWith("extv3_")) return `/assets/extbg/thumbs/${norm}.webp${revQuery()}`;
      return `/assets/extbg/thumbs/extv3_001.webp${revQuery()}`;
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

  const wallImgCache = new Map();

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
      const existing = layer.querySelector("img");
      if (existing && existing.complete) {
        layer.style.display = "block";
        return;
      }
    }
    layer.setAttribute("data-wall-url", target);
    let img = wallImgCache.get(target);
    if (!img) {
      img = document.createElement("img");
      img.className = "gmxWallImg";
      img.alt = "";
      img.decoding = "async";
      img.loading = "eager";
      img.draggable = false;
      img.src = target;
      wallImgCache.set(target, img);
      if (wallImgCache.size > 12) {
        const first = wallImgCache.keys().next().value;
        wallImgCache.delete(first);
      }
    }
    layer.replaceChildren(img);
    layer.style.display = "block";
  }

  global.ensureWallpaperLayer = ensureWallpaperLayerDom;
  global.setWallpaperLayerImage = setWallpaperLayerImageDom;
})(window);
