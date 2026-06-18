(function (global) {
  if (global.__GMXWallpapersFactory) return;

  global.__GMXWallpapersFactory = function createGMXWallpapers(ctx) {
    const getAssetRev = () => String((ctx && typeof ctx.getAssetRev === "function" ? ctx.getAssetRev() : "") || "");
    const getSiteCustomUpload = () => String((ctx && typeof ctx.getSiteCustomUpload === "function" ? ctx.getSiteCustomUpload() : "") || "");
    const getExtCustomUpload = () => String((ctx && typeof ctx.getExtCustomUpload === "function" ? ctx.getExtCustomUpload() : "") || "");

    const SITE_PACK_COUNT = 58;
    const SITE_FREE_PACK_COUNT = 10;
    const EXT_PACK_COUNT = 58;
    const EXT_FREE_PACK_COUNT = 4;
    const CUSTOM_WP_FREE_COUNT = 5;
    const CUSTOM_UPLOAD_ID = "custom_upload";
    const CUSTOM_WP_RE = /^custom_[a-zA-Z0-9_.-]+\.(png|jpg|jpeg|webp)$/i;

    const EXT_PACK_NAMES = [
      "Coastal Dawn", "Forest Mist", "Mountain Lake", "City Sunset", "Desert Dunes",
      "Ocean Horizon", "Nordic Fjord", "Rainy Street", "Cherry Blossom", "Golden Hour",
      "Misty Pines", "Alpine Meadow", "River Bend", "Cliff Coast", "Lavender Field",
      "Autumn Trail", "Snow Peak", "Bamboo Grove", "Harbor Lights", "Vineyard Hills",
      "Canyon View", "Tropical Cove", "Urban Night", "Meadow Bloom", "Glacier Bay",
      "Sandstone Arch", "Waterfall Glen", "Prairie Wind", "Island Palm", "Moonlit Bay",
      "Cedar Forest", "Rose Garden", "Stone Bridge", "Lighthouse Shore", "Wildflower Hill",
      "Cloud Valley", "Emerald Coast", "Silver Lake", "Amber Woods", "Coral Reef",
      "Indigo Sky", "Morning Fog", "Twilight Pier", "Bamboo Path", "Rocky Shore",
      "Savanna Gold", "Maple Lane", "Crystal Cave", "Dunescape", "Orchid Green",
      "Vineyard Dawn", "Ice Lagoon", "Red Rock", "Moss Garden", "Delta Mirror",
      "Panorama Ridge", "Silk Clouds", "Cedar Sunset",
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
          id: `extv3_${String(i).padStart(2, "0")}`,
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

    function normalizeExtWallpaperIdLocal(id, catalog) {
      const v = String(id || "").trim();
      if (!v) return "";
      if (catalogHasId(catalog, v)) return v;
      if (v === CUSTOM_UPLOAD_ID) return v;
      if (CUSTOM_WP_RE.test(v)) return v;
      let m = v.match(/^extv3_(\d{1,2})$/i);
      if (m) {
        const n = String(Math.max(1, Math.min(58, Number(m[1]) || 1))).padStart(2, "0");
        return `extv3_${n}`;
      }
      m = v.match(/^ext_free_(\d{1,2})$/i);
      if (m) {
        const n = String(Math.max(1, Math.min(2, Number(m[1]) || 1))).padStart(2, "0");
        return `ext_free_${n}`;
      }
      m = v.match(/^ext_(\d{1,2})$/i);
      if (m) {
        const num = Math.max(1, Math.min(58, Number(m[1]) || 1));
        return `extv3_${String(num).padStart(2, "0")}`;
      }
      if (/^lux_ext_/i.test(v) || /^ext_free_/i.test(v)) return "extv3_01";
      return "extv3_01";
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
      return `/assets/extbg/thumbs/extv3_01.webp${revQuery()}`;
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

  function ensureWallpaperLayerDom() {
    let layer = document.getElementById("gmxWallLayer");
    if (!layer) {
      layer = document.createElement("div");
      layer.id = "gmxWallLayer";
      layer.className = "gmxWallLayer";
      layer.setAttribute("aria-hidden", "true");
      document.body.prepend(layer);
    }
    return layer;
  }

  function setWallpaperLayerImageDom(layer, url) {
    if (!layer) return;
    if (!url) {
      layer.replaceChildren();
      layer.style.display = "none";
      layer.removeAttribute("data-wall-url");
      return;
    }
    if (layer.getAttribute("data-wall-url") === url && layer.querySelector("img")) {
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

  global.ensureWallpaperLayer = ensureWallpaperLayerDom;
  global.setWallpaperLayerImage = setWallpaperLayerImageDom;
})(window);
