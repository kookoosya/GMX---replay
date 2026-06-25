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
  "Bitcoin Green Pulse",
  "Crypto Coin Stack",
  "Digital Gold Bars",
  "Blockchain Neon",
  "Fintech Glow",
  "Trading Terminal",
  "Ethereum Violet",
  "Coin Macro",
  "Crypto Keys",
  "Ledger Light",
  "Wallet Neon",
  "Market Charts",
  "Token Spark",
  "DeFi Matrix",
  "Solana Teal",
  "Chain Link",
  "Crypto Circuit",
  "Mining Rig",
  "Bull Run",
  "Satoshi Glow",
  "Web3 Dawn",
  "Hash Rate",
  "Altcoin Wave",
  "Cold Storage",
  "Exchange Floor",
  "Neo Tokyo",
  "Cyber Shrine",
  "Rainy Akihabara",
  "Sakura Night",
  "Neon Alley",
  "Tokyo Tower",
  "Manga Skyline",
  "Cyberpunk Rain",
  "Vaporwave City",
  "Anime Sunset",
  "Purple Haze",
  "Night Crossing",
  "Electric Street",
  "Pink Neon",
  "Midnight Metro",
  "Blade Runner",
  "Synth City",
  "Hologram Lane",
  "Pixel Rain",
  "Otaku Lights",
  "Arcade Glow",
  "Retro Future",
  "Kawaii Neon",
  "Shinjuku Blue",
  "Cyber Sakura",
  "Hero Burst",
  "Comic Pop",
  "Power Gradient",
  "Shield Glow",
  "Avenger Tone",
  "Cartoon Sky",
  "Toon Burst",
  "Color Smash",
  "Marvel Mood",
  "Super Pop",
  "Cosmic Hero",
  "Galaxy Shield",
  "Neon Cape",
  "Comic Ink",
  "Hero Horizon",
  "Cartoon Clouds",
  "Pop Art",
  "Bold Panels",
  "Action Blur",
  "Origin Story",
  "City Pulse",
  "Skyline Teal",
  "Rooftop Night",
  "Bridge Lights",
  "Urban Violet",
  "Glass Tower",
  "Metro Rush",
  "Downtown Glow",
  "Night Drive",
  "Harbor Neon",
  "Street Chrome",
  "City Rain",
  "Late Night",
  "Luxury Night",
  "Aurora City",
  "Alpine Stars",
  "Ocean Cliff",
  "Desert Gold",
  "Forest Mist",
  "Nordic Fjord",
  "Coastal Dawn",
  "Mountain Lake",
  "Golden Hour",
  "Cherry Blossom",
  "Lavender Field",
  "Glacier Bay",
  "Misty Pines",
  "River Bend",
  "Snow Peak",
  "Silk Clouds"
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

  function fitWallpaperCover(img) {
    if (!img || !img.naturalWidth || !img.naturalHeight) return;
    if (typeof window === "undefined") return;
    const vw = window.innerWidth || 1;
    const vh = window.innerHeight || 1;
    const nw = img.naturalWidth;
    const nh = img.naturalHeight;
    const scale = Math.max(vw / nw, vh / nh);
    img.style.width = Math.ceil(nw * scale) + "px";
    img.style.height = Math.ceil(nh * scale) + "px";
  }

  let wallpaperResizeBound = false;
  function bindWallpaperResize(layer) {
    if (wallpaperResizeBound || !layer) return;
    if (typeof window === "undefined" || typeof window.addEventListener !== "function") return;
    wallpaperResizeBound = true;
    let timer = 0;
    window.addEventListener("resize", () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        const img = layer.querySelector(".gmxWallImg");
        if (img && img.complete) fitWallpaperCover(img);
      }, 120);
    });
  }

  function setWallpaperLayerImageDom(layer, url) {
    if (!layer) return;
    bindWallpaperResize(layer);
    if (!url) {
      layer.replaceChildren();
      layer.style.display = "none";
      layer.removeAttribute("data-wall-url");
      return;
    }
    if (layer.getAttribute("data-wall-url") === url && layer.querySelector("img")) {
      layer.style.display = "block";
      const existing = layer.querySelector("img");
      if (existing && existing.complete) fitWallpaperCover(existing);
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
    if (typeof img.addEventListener === "function") {
      img.addEventListener("load", () => fitWallpaperCover(img), { once: true });
    }
    img.src = url;
    layer.appendChild(img);
    layer.style.display = "block";
    if (img.complete) fitWallpaperCover(img);
  }

  global.ensureWallpaperLayer = ensureWallpaperLayerDom;
  global.setWallpaperLayerImage = setWallpaperLayerImageDom;
})(window);
