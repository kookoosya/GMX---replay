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
  "The Town (August Strindberg) - Nationalmuseum - 21568.tif",
  "Algorithmically-generated black and white portrait art of a ",
  "Urban landscape reflected in glass windows with a blend of m",
  "A modern building with illuminated panels reflecting city li",
  "A striking black and white perspective of Hamburg's modern s",
  "Geometric shadows and light interplay in a modern urban unde",
  "Striking black and white low angle shot showcasing modern ar",
  "From above of green lawn with abstract shadow drawing on gra",
  "Explore the vibrant and dynamic world of a futuristic digita",
  "Low-angle view of vibrant apartment buildings in Minsk with ",
  "Striking black and white image of tunnel with geometric patt",
  "Black and white abstract view of shadows on a tall building ",
  "A stunning low-angle view of skyscrapers against the night s",
  "Abstract futuristic cyber landscape with digital matrix and ",
  "Monochrome image of geometric patterns in urban architecture",
  "Complex digital structure of red and black blocks, creating ",
  "Abstract view of a modern building's glass facade with refle",
  "Intriguing angle of contemporary skyscrapers with glass and ",
  "Mesmerizing abstract pattern of swirling black and gold with",
  "Illuminated building facade with vibrant neon signs in an ur",
  "Stunning aerial view of a brightly lit cityscape under twili",
  "Modern skyscrapers with lights glowing at night, vibrant cit",
  "Abstract image depicting high-tech digital circuits and glow",
  "Stunning aerial view of Taipei's skyline showcasing illumina",
  "Intriguing geometric patterns created by sunlight and archit",
  "Stylish black and white marble tiles with a geometric patter",
  "Sunlight creates striking shadows on a modern building exter",
  "A fallen tree casting shadows on a vast desert landscape und",
  "Intricate abstract visualization of digital circuit blocks w",
  "Monochrome tunnel scene with dramatic light and shadows crea",
  "Dramatic nighttime view of urban apartment buildings from be",
  "Artistic view of a building's facade with complex geometric ",
  "A black and white photo of a cracked glass block in an indus",
  "A dramatic view of illuminated skyscrapers reaching into the",
  "Stunning aerial view of a bustling city at night, illuminate",
  "Eerie mist envelops leafless trees in a serene rural orchard",
  "A textured wall with layers of torn and weathered paper for ",
  "Glass building facade reflecting hills and greenery on a sun",
  "Low angle view of modern office building with glass facade a",
  "A vibrant 3D rendering of geometric digital art with a futur",
  "Futuristic digital cube arrangement, showcasing vibrant LED-",
  "Concrete Brutalist building facade in Boston, showcasing str",
  "Stunning abstract view of futuristic digital circuitry with ",
  "A stunning night view of densely packed skyscrapers creating",
  "Abstract digital artwork showcasing a colorful, geometric de",
  "Artistic photo of tree shadows on a corrugated metal and woo",
  "Black and white abstract shadows creating geometric patterns",
  "Vibrant cityscape of Chongqing illuminated by neon lights at",
  "Captivating night sky with stars over illuminated rocky clif",
  "Dynamic shadows create an abstract pattern on an orange wall",
  "Abstract view of modern architecture with strong shadows in ",
  "Beautiful snow-covered landscape in Cappadocia under a starr",
  "A serene view of misty mountains covered in lush greenery in",
  "A bustling urban scene with neon lights and signs, capturing",
  "Vibrant stained glass featuring textured geometric patterns ",
  "Night view of Taipei skyline featuring iconic tower and mode",
  "Black and white pattern of light and shadow stripes on an in",
  "A monumental sculpture of a robot and skull set in Ringkøbin",
  "Scenic view of Monument Valley at sunset showcasing iconic r",
  "Captivating view of a wave crashing in the Baltic Sea with d"
];

    const SITE_PACK_NAMES = [
  "Abstract digital artwork showcasing a colorful, geometric de",
  "A vibrant 3D rendering of geometric digital art with a futur",
  "Spacecraft leaving a space station.jpg",
  "Galaxy starry night sky background",
  "Free blue galaxy night sky",
  "Galaxy starry night sky background",
  "Galaxy Stars",
  "Spiral galaxy",
  "Milkyway Galaxy",
  "Untitled",
  "Galaxy starry night sky background",
  "Untitled",
  "Cryptocurrency transaction",
  "Free blue galaxy night sky",
  "Untitled",
  "A fallen tree casting shadows on a vast desert landscape und",
  "A bustling urban scene with neon lights and signs, capturing",
  "Glass building facade reflecting hills and greenery on a sun",
  "A monumental sculpture of a robot and skull set in Ringkøbin",
  "A stunning low-angle view of skyscrapers against the night s",
  "Intriguing angle of contemporary skyscrapers with glass and ",
  "Eerie mist envelops leafless trees in a serene rural orchard",
  "Golden hour view of boulders and desert vegetation in Joshua",
  "Modern architectural facade with geometric window patterns c",
  "Complex digital structure of red and black blocks, creating ",
  "Futuristic digital cube arrangement, showcasing vibrant LED-",
  "Modern skyscrapers with lights glowing at night, vibrant cit",
  "Black and white pattern of light and shadow stripes on an in",
  "Urban landscape reflected in glass windows with a blend of m",
  "A textured wall with layers of torn and weathered paper for ",
  "Abstract view of a modern building's glass facade with refle",
  "Vibrant stained glass featuring textured geometric patterns ",
  "Artbreeder example anime portraits.jpg",
  "Tarantula Nebula by JWST.jpg",
  "NGC 3372a-full.jpg",
  "Dragon Encounter During Sunset (FLUX 1.1 Pro Ultra).webp",
  "Blockchain Illustration 3.jpg",
  "Blockchain Illustration.jpg",
  "Blockchain Illustration 4.jpg",
  "Blockchain Illustration 2.jpg",
  "Anime girl cat illustration",
  "Neon Street",
  "The Town (August Strindberg) - Nationalmuseum - 21568.tif",
  "Algorithmically-generated black and white portrait art of a ",
  "Futuristic rocket png sticker retro",
  "Bound Print, Title Page, Livre Nouveau de Morceaux de Fantai",
  "Anime Girl",
  "Cardano Summit 2021.jpg",
  "Moonlit Landscape View New Amstel",
  "source site, courtesy NASA/JPL-Caltech: Generations",
  "Mlikyway Galaxy",
  "Milkyway Galaxy",
  "Milkyway Galaxy",
  "Consensus 2026 - Charles Hoskinson 01.jpg",
  "Futuristic rocket, space illustration",
  "Consensus 2026 - Charles Hoskinson 06.jpg",
  "Consensus 2026 - Charles Hoskinson 02.jpg",
  "Consensus 2026 - Charles Hoskinson 05.jpg",
  "Anime girl cat illustration",
  "Nasa space elev.jpg",
  "Png anime girl cat sticker",
  "Anime girl cat collage element",
  "Abbreviated Drawing Styles Birds Animals",
  "Anime girl cat collage element",
  "NGC 1333 (2023-012).png",
  "Sunlight creates striking shadows on a modern building exter",
  "Intriguing geometric patterns created by sunlight and archit",
  "Abstract view of an urban office building's repetitive windo",
  "A modern building with illuminated panels reflecting city li",
  "Geometric shadows and light interplay in a modern urban unde",
  "Intricate abstract visualization of digital circuit blocks w",
  "Stunning abstract view of futuristic digital circuitry with ",
  "Abstract image depicting high-tech digital circuits and glow",
  "Abstract futuristic cyber landscape with digital matrix and ",
  "Explore the vibrant and dynamic world of a futuristic digita",
  "Artistic photo of tree shadows on a corrugated metal and woo",
  "Close-up view of a modern building's exterior with geometric",
  "Abstract view of modern architecture with strong shadows in ",
  "Scenic view of Monument Valley at sunset showcasing iconic r",
  "Vibrant cityscape of Chongqing illuminated by neon lights at",
  "Stunning aerial shot of Belgrade, Serbia at sunrise with cit",
  "A black and white photo of a cracked glass block in an indus",
  "Captivating night sky with stars over illuminated rocky clif",
  "Dramatic view of illuminated skyscrapers against a moody twi",
  "Striking black and white low angle shot showcasing modern ar",
  "Concrete Brutalist building facade in Boston, showcasing str",
  "From above of green lawn with abstract shadow drawing on gra",
  "Beautiful snow-covered landscape in Cappadocia under a starr",
  "Black and white abstract shadows creating geometric patterns",
  "Expansive aerial view highlighting sunlit desert mountains u",
  "Anime News Agency.svg",
  "Artist's Conception of Space Station Freedom - GPN-2003-0009",
  "Blockchain Illustration",
  "Anime girl cat illustration psd",
  "Blockchain Illustration 4",
  "Hubble Space Telescope image R136",
  "Blockchain Illustration 2",
  "Girl husky png illustration, transparent",
  "Blockchain Illustration 3",
  "Futuristic city drawing, vintage illustration"
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
