#!/usr/bin/env node
/** Patch i18n for canary wallpaper stages (25/50/75/100). */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const count = Number(process.argv[2] || 100);
const localesDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "shared", "i18n", "locales");

const WP_CATS = {
  wp_cat_neon_city: {
    de: "Neonstadt", fr: "Ville néon", es: "Ciudad neón", pt: "Cidade neon", it: "Città neon",
    nl: "Neonstad", tr: "Neon şehir", pl: "Neonowe miasto", id: "Kota neon", ru: "Неоновый город",
    uk: "Неонове місто", hi: "नियॉन शहर", ja: "ネオン都市", zh: "霓虹城市",
  },
  wp_cat_futuristic_architecture: {
    de: "Futuristische Architektur", fr: "Architecture futuriste", es: "Arquitectura futurista", pt: "Arquitetura futurista",
    it: "Architettura futuristica", nl: "Futuristische architectuur", tr: "Fütürist mimari", pl: "Futurystyczna architektura",
    id: "Arsitektur futuristik", ru: "Футуристическая архитектура", uk: "Футуристична архітектура", hi: "भविष्यवादी वास्तुकला",
    ja: "未来建築", zh: "未来建筑",
  },
  wp_cat_night_skyline: {
    de: "Nacht-Skyline", fr: "Skyline nocturne", es: "Horizonte nocturno", pt: "Horizonte noturno", it: "Skyline notturna",
    nl: "Nacht skyline", tr: "Gece silueti", pl: "Nocna panorama", id: "Cakrawala malam", ru: "Ночной горизонт",
    uk: "Нічний горизонт", hi: "रात्रि क्षितिज", ja: "夜景スカイライン", zh: "夜间天际线",
  },
  wp_cat_space: {
    de: "Weltraum", fr: "Espace", es: "Espacio", pt: "Espaço", it: "Spazio", nl: "Ruimte", tr: "Uzay", pl: "Kosmos",
    id: "Luar angkasa", ru: "Космос", uk: "Космос", hi: "अंतरिक्ष", ja: "宇宙", zh: "太空",
  },
  wp_cat_moon_planets: {
    de: "Mond & Planeten", fr: "Lune et planètes", es: "Luna y planetas", pt: "Lua e planetas", it: "Luna e pianeti",
    nl: "Maan & planeten", tr: "Ay ve gezegenler", pl: "Księżyc i planety", id: "Bulan & planet", ru: "Луна и планеты",
    uk: "Місяць і планети", hi: "चंद्रमा और ग्रह", ja: "月と惑星", zh: "月亮与行星",
  },
  wp_cat_mountains: {
    de: "Berge", fr: "Montagnes", es: "Montañas", pt: "Montanhas", it: "Montagne", nl: "Bergen", tr: "Dağlar", pl: "Góry",
    id: "Pegunungan", ru: "Горы", uk: "Гори", hi: "पर्वत", ja: "山", zh: "山脉",
  },
  wp_cat_forest: {
    de: "Wald", fr: "Forêt", es: "Bosque", pt: "Floresta", it: "Foresta", nl: "Bos", tr: "Orman", pl: "Las",
    id: "Hutan", ru: "Лес", uk: "Ліс", hi: "वन", ja: "森", zh: "森林",
  },
  wp_cat_ocean_underwater: {
    de: "Ozean & Unterwasser", fr: "Océan & sous-marin", es: "Océano y submarino", pt: "Oceano e subaquático",
    it: "Oceano e sottacqua", nl: "Oceaan & onderwater", tr: "Okyanus ve su altı", pl: "Ocean i podwodny",
    id: "Laut & bawah air", ru: "Океан и подводный мир", uk: "Океан і підводний світ", hi: "महासागर और पानी के नीचे",
    ja: "海と水中", zh: "海洋与水下",
  },
  wp_cat_desert: {
    de: "Wüste", fr: "Désert", es: "Desierto", pt: "Deserto", it: "Deserto", nl: "Woestijn", tr: "Çöl", pl: "Pustynia",
    id: "Gurun", ru: "Пустыня", uk: "Пустеля", hi: "रेगिस्तान", ja: "砂漠", zh: "沙漠",
  },
  wp_cat_northern_lights: {
    de: "Nordlichter", fr: "Aurores boréales", es: "Auroras boreales", pt: "Auroras boreais", it: "Aurora boreale",
    nl: "Noorderlicht", tr: "Kuzey ışıkları", pl: "Zorza polarna", id: "Aurora", ru: "Северное сияние",
    uk: "Північне сияння", hi: "उत्तरी रोशनी", ja: "オーロラ", zh: "北极光",
  },
  wp_cat_abstract_glass: {
    de: "Abstraktes Glas", fr: "Verre abstrait", es: "Cristal abstracto", pt: "Vidro abstrato", it: "Vetro astratto",
    nl: "Abstract glas", tr: "Soyut cam", pl: "Abstrakcyjne szkło", id: "Kaca abstrak", ru: "Абстрактное стекло",
    uk: "Абстрактне скло", hi: "अमूर्त काँच", ja: "抽象ガラス", zh: "抽象玻璃",
  },
  wp_cat_geometric_dark: {
    de: "Dunkle Geometrie", fr: "Géométrie sombre", es: "Geometría oscura", pt: "Geometria escura", it: "Geometria scura",
    nl: "Donkere geometrie", tr: "Karanlık geometri", pl: "Ciemna geometria", id: "Geometri gelap", ru: "Тёмная геометрия",
    uk: "Темна геометрія", hi: "गहरी ज्यामिति", ja: "ダーク幾何学", zh: "暗色几何",
  },
  wp_cat_minimal_texture: {
    de: "Minimale Textur", fr: "Texture minimale", es: "Textura minimal", pt: "Textura minimal", it: "Texture minimale",
    nl: "Minimale textuur", tr: "Minimal doku", pl: "Minimalna tekstura", id: "Tekstur minimal", ru: "Минимальная текстура",
    uk: "Мінімальна текстура", hi: "न्यूनतम बनावट", ja: "ミニマルテクスチャ", zh: "极简纹理",
  },
};

const EN_ONLY = Object.fromEntries(
  Object.keys(WP_CATS).map((k) => [k, k.replace(/^wp_cat_/, "").replace(/_/g, " ")])
);
EN_ONLY.wp_cat_neon_city = "Neon city";
EN_ONLY.wp_cat_futuristic_architecture = "Futuristic architecture";
EN_ONLY.wp_cat_night_skyline = "Night skyline";
EN_ONLY.wp_cat_space = "Space";
EN_ONLY.wp_cat_moon_planets = "Moon & planets";
EN_ONLY.wp_cat_mountains = "Mountains";
EN_ONLY.wp_cat_forest = "Forest";
EN_ONLY.wp_cat_ocean_underwater = "Ocean & underwater";
EN_ONLY.wp_cat_desert = "Desert";
EN_ONLY.wp_cat_northern_lights = "Northern lights";
EN_ONLY.wp_cat_abstract_glass = "Abstract glass";
EN_ONLY.wp_cat_geometric_dark = "Geometric dark";
EN_ONLY.wp_cat_minimal_texture = "Minimal texture";

function themesDesc(lang, n) {
  const templates = {
    en: `Choose from ${n} curated photographic wallpapers below. Accent colors follow your saved theme preset. Referrals and Pro expand what you can pick; Pro adds custom uploads.`,
    de: `Wählen Sie aus ${n} kuratierten Fotohintergründen unten. Akzentfarben folgen Ihrem gespeicherten Theme. Referrals und Pro erweitern die Auswahl; Pro ermöglicht eigene Uploads.`,
    fr: `Choisissez parmi ${n} fonds d'écran photo ci-dessous. Les couleurs d'accent suivent votre thème enregistré. Parrainages et Pro élargissent le choix ; Pro ajoute vos propres fichiers.`,
    es: `Elige entre ${n} fondos fotográficos curados abajo. Los colores de acento siguen tu tema guardado. Referidos y Pro amplían la selección; Pro añade cargas propias.`,
    pt: `Escolha entre ${n} papéis de parede fotográficos abaixo. As cores de destaque seguem o tema salvo. Indicações e Pro ampliam a escolha; Pro adiciona uploads próprios.`,
    it: `Scegli tra ${n} sfondi fotografici curati qui sotto. I colori d'accento seguono il tema salvato. Referral e Pro ampliano la scelta; Pro aggiunge caricamenti personali.`,
    nl: `Kies uit ${n} gecureerde fotowallpapers hieronder. Accentkleuren volgen je opgeslagen thema. Referrals en Pro vergroten de keuze; Pro voegt eigen uploads toe.`,
    tr: `Aşağıdan ${n} seçilmiş fotoğraf duvar kağıdı arasından seçin. Vurgu renkleri kayıtlı temanızı izler. Referanslar ve Pro seçimi genişletir; Pro özel yüklemeler ekler.`,
    pl: `Wybierz spośród ${n} starannie dobranych fototapet poniżej. Kolory akcentu podążają za zapisanym motywem. Polecenia i Pro rozszerzają wybór; Pro dodaje własne pliki.`,
    id: `Pilih dari ${n} wallpaper foto kurasi di bawah. Warna aksen mengikuti tema tersimpan. Referral dan Pro memperluas pilihan; Pro menambah unggahan sendiri.`,
    ru: `${n} курируемых фотографических обоев — выбирайте ниже. Акцентные цвета следуют сохранённой теме. Рефералы и Pro открывают больше; Pro добавляет свои загрузки.`,
    uk: `${n} кураторських фото-шпалер — обирайте нижче. Акцентні кольори слідують збереженій темі. Реферали та Pro розширюють вибір; Pro додає власні завантаження.`,
    hi: `नीचे ${n} क्यूरेटेड फोटो वॉलपेपर में से चुनें। एक्सेंट रंग आपकी सहेजी थीम का अनुसरण करते हैं। रेफरल और Pro विकल्प बढ़ाते हैं; Pro कस्टम अपलोड जोड़ता है।`,
    ja: `下から${n}枚の厳選フォト壁紙を選べます。アクセント色は保存したテーマに従います。紹介とProで選択肢が広がり、Proは独自アップロードを追加します。`,
    zh: `从下方${n}张精选摄影壁纸中选择。强调色跟随您保存的主题。推荐与Pro扩展可选范围；Pro可添加自定义上传。`,
  };
  return templates[lang] || templates.en;
}

for (const file of fs.readdirSync(localesDir).filter((f) => f.endsWith(".json"))) {
  const lang = file.replace(/\.json$/, "");
  const p = path.join(localesDir, file);
  const j = JSON.parse(fs.readFileSync(p, "utf8"));
  j.themes_desc = themesDesc(lang, count);
  if (lang === "en") Object.assign(j, EN_ONLY);
  else {
    for (const [key, map] of Object.entries(WP_CATS)) {
      if (map[lang]) j[key] = map[lang];
    }
  }
  fs.writeFileSync(p, `${JSON.stringify(j, null, 2)}\n`);
}
console.log(`patch-wallpaper-canary-i18n OK (${count})`);
