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
  "Extension Skin 1",
  "Extension Skin 2",
  "Extension Skin 3",
  "Extension Skin 4",
  "Extension Skin 5",
  "Extension Skin 6",
  "Extension Skin 7",
  "Extension Skin 8",
  "Extension Skin 9",
  "Extension Skin 10",
  "Extension Skin 11",
  "Extension Skin 12",
  "Extension Skin 13",
  "Extension Skin 14",
  "Extension Skin 15",
  "Extension Skin 16",
  "Extension Skin 17",
  "Extension Skin 18",
  "Extension Skin 19",
  "Extension Skin 20",
  "Extension Skin 21",
  "Extension Skin 22",
  "Extension Skin 23",
  "Extension Skin 24",
  "Extension Skin 25",
  "Extension Skin 26",
  "Extension Skin 27",
  "Extension Skin 28",
  "Extension Skin 29",
  "Extension Skin 30",
  "Extension Skin 31",
  "Extension Skin 32",
  "Extension Skin 33",
  "Extension Skin 34",
  "Extension Skin 35",
  "Extension Skin 36",
  "Extension Skin 37",
  "Extension Skin 38",
  "Extension Skin 39",
  "Extension Skin 40",
  "Extension Skin 41",
  "Extension Skin 42",
  "Extension Skin 43",
  "Extension Skin 44",
  "Extension Skin 45",
  "Extension Skin 46",
  "Extension Skin 47",
  "Extension Skin 48",
  "Extension Skin 49",
  "Extension Skin 50",
  "Extension Skin 51",
  "Extension Skin 52",
  "Extension Skin 53",
  "Extension Skin 54",
  "Extension Skin 55",
  "Extension Skin 56",
  "Extension Skin 57",
  "Extension Skin 58",
  "Extension Skin 59",
  "Extension Skin 60"
];

    const SITE_PACK_NAMES = [
  "Geometric Scene",
  "Abstract Scene",
  "Neon Scene",
  "Neon Scene 2",
  "Neon Scene 3",
  "Geometric Scene 2",
  "Neon Scene 4",
  "Neon Scene 5",
  "Geometric Scene 3",
  "Neon Scene 6",
  "Abstract Scene 2",
  "Abstract Scene 3",
  "Neon Scene 7",
  "Neon Alley Inspired",
  "Futuristic Scene",
  "Night Scene",
  "Minimal Scene",
  "Minimal Scene 2",
  "Futuristic Scene 2",
  "Futuristic Scene 3",
  "Geometric Scene 4",
  "Abstract Scene 4",
  "Forest Scene",
  "Futuristic Scene 4",
  "Night Scene 2",
  "Forest Scene 2",
  "Minimal Scene 3",
  "Forest Scene 3",
  "Abstract Scene 5",
  "Futuristic Scene 5",
  "Futuristic Scene 6",
  "Pop Color Inspired",
  "Forest Scene 4",
  "Forest Scene 5",
  "Geometric Scene 5",
  "Mech Grid Inspired",
  "Futuristic Scene 8",
  "Mountains Scene",
  "Mountains Scene 2",
  "Night Scene 3",
  "Abstract Scene 6",
  "Moon Scene",
  "Geometric Scene 6",
  "Mountains Scene 3",
  "Fantasy Peaks",
  "Desert Scene",
  "Ocean Scene",
  "Orbital Sci-Fi",
  "Abstract Scene 7",
  "Ocean Scene 2",
  "Geometric Scene 7",
  "Night Scene 4",
  "Pastel Sky Inspired",
  "Forest Scene 7",
  "Moon Scene 3",
  "Moon Scene 4",
  "Halftone Inspired",
  "Forest Scene 8",
  "Abstract Scene 8",
  "Tower Light Inspired",
  "Desert Scene 3",
  "Mountains Scene 4",
  "Night Scene 5",
  "Night Scene 6",
  "Circuit Mech Inspired",
  "Northern Scene",
  "Space Scene 2",
  "Desert Scene 5",
  "Desert Scene 6",
  "Skyline Hero Inspired",
  "Minimal Scene 4",
  "Mist Valley",
  "Mountains Scene 6",
  "Deep Space Sci-Fi",
  "Ocean Scene 3",
  "Space Scene 3",
  "Mountains Scene 8",
  "Rain Neon Inspired",
  "Minimal Scene 6",
  "Mountains Scene 9",
  "Bold Spectrum Inspired",
  "Minimal Scene 7",
  "Ocean Scene 5",
  "City Glow Inspired",
  "Space Scene 5",
  "Steel Frame Inspired",
  "Northern Scene 2",
  "Moonlit Fantasy",
  "Space Scene 8",
  "Ocean Scene 6",
  "Nebula Sci-Fi",
  "Northern Scene 4",
  "Ocean Scene 7",
  "Twilight Inspired",
  "Northern Scene 5",
  "Northern Scene 6",
  "Aurora Fantasy",
  "Ocean Scene 9",
  "Moon Scene 6",
  "Moon Scene 7"
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
      return `sitev4_${String(Number(m[1])).padStart(3, "0")}.webp`;
    }

    function extPackAssetFile(id) {
      let m = String(id || "").match(/^extskin_(\d+)$/i);
      if (!m) m = String(id || "").match(/^extv3_(\d+)$/i);
      if (!m) return "";
      const n = Math.max(1, Math.min(EXT_PACK_COUNT, Number(m[1]) || 1));
      return `extskin_v4_${String(n).padStart(3, "0")}.webp`;
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
      return `/assets/wallpapers/thumbs/sitev4_001.webp${revQuery()}`;
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
      return `/assets/extskins/thumbs/extskin_v4_001.webp${revQuery()}`;
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
