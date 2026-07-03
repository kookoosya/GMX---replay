#!/usr/bin/env node
/** Patch legacy inspired + anime_style keys so strict i18n audit passes. */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const LOCALES = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "shared", "i18n", "locales");

const LEGACY = {
  de: {
    wp_cat_anime_inspired: "Anime-inspiriert",
    wp_cat_comic_inspired: "Comic-inspiriert",
    wp_cat_superhero_inspired: "Superhelden-inspiriert",
    wp_cat_mecha: "Mecha-Roboter",
    wp_cat_fantasy: "Fantasy",
    wp_cat_sci_fi: "Science-Fiction",
    wp_cat_anime_style: "Anime-Stil",
    extskin_cat_anime_style: "Anime-Stil",
  },
  fr: {
    wp_cat_anime_inspired: "Inspiré anime",
    wp_cat_comic_inspired: "Inspiré comics",
    wp_cat_superhero_inspired: "Inspiré super-héros",
    wp_cat_mecha: "Mecha",
    wp_cat_fantasy: "Fantaisie",
    wp_cat_sci_fi: "Science-fiction",
    wp_cat_anime_style: "Style anime",
    extskin_cat_anime_style: "Style anime",
  },
  es: {
    wp_cat_anime_inspired: "Inspirado en anime",
    wp_cat_comic_inspired: "Inspirado en cómics",
    wp_cat_superhero_inspired: "Inspirado en superhéroes",
    wp_cat_mecha: "Mecha",
    wp_cat_fantasy: "Fantasía",
    wp_cat_sci_fi: "Ciencia ficción",
    wp_cat_anime_style: "Estilo anime",
    extskin_cat_anime_style: "Estilo anime",
  },
  pt: {
    wp_cat_anime_inspired: "Inspirado em anime",
    wp_cat_comic_inspired: "Inspirado em quadrinhos",
    wp_cat_superhero_inspired: "Inspirado em super-heróis",
    wp_cat_mecha: "Mecha",
    wp_cat_fantasy: "Fantasia",
    wp_cat_sci_fi: "Ficção científica",
    wp_cat_anime_style: "Estilo anime",
    extskin_cat_anime_style: "Estilo anime",
  },
  it: {
    wp_cat_anime_inspired: "Ispirato all'anime",
    wp_cat_comic_inspired: "Ispirato ai fumetti",
    wp_cat_superhero_inspired: "Ispirato ai supereroi",
    wp_cat_mecha: "Mecha",
    wp_cat_fantasy: "Fantasy",
    wp_cat_sci_fi: "Fantascienza",
    wp_cat_anime_style: "Stile anime",
    extskin_cat_anime_style: "Stile anime",
  },
  nl: {
    wp_cat_anime_inspired: "Anime-geïnspireerd",
    wp_cat_comic_inspired: "Comic-geïnspireerd",
    wp_cat_superhero_inspired: "Superheld-geïnspireerd",
    wp_cat_mecha: "Mecha",
    wp_cat_fantasy: "Fantasy",
    wp_cat_sci_fi: "Sci-fi",
    wp_cat_anime_style: "Anime-stijl",
    extskin_cat_anime_style: "Anime-stijl",
  },
  tr: {
    wp_cat_anime_inspired: "Anime esintili",
    wp_cat_comic_inspired: "Çizgi roman esintili",
    wp_cat_superhero_inspired: "Süper kahraman esintili",
    wp_cat_mecha: "Mecha",
    wp_cat_fantasy: "Fantastik",
    wp_cat_sci_fi: "Bilim kurgu",
    wp_cat_anime_style: "Anime tarzı",
    extskin_cat_anime_style: "Anime tarzı",
  },
  pl: {
    wp_cat_anime_inspired: "Inspiracja anime",
    wp_cat_comic_inspired: "Inspiracja komiksowa",
    wp_cat_superhero_inspired: "Inspiracja superbohaterami",
    wp_cat_mecha: "Mecha",
    wp_cat_fantasy: "Fantasy",
    wp_cat_sci_fi: "Sci-fi",
    wp_cat_anime_style: "Styl anime",
    extskin_cat_anime_style: "Styl anime",
  },
  id: {
    wp_cat_anime_inspired: "Terinspirasi anime",
    wp_cat_comic_inspired: "Terinspirasi komik",
    wp_cat_superhero_inspired: "Terinspirasi superhero",
    wp_cat_mecha: "Mecha",
    wp_cat_fantasy: "Fantasi",
    wp_cat_sci_fi: "Fiksi ilmiah",
    wp_cat_anime_style: "Gaya anime",
    extskin_cat_anime_style: "Gaya anime",
  },
  ru: {
    wp_cat_anime_inspired: "В стиле аниме",
    wp_cat_comic_inspired: "В стиле комиксов",
    wp_cat_superhero_inspired: "В стиле супергероев",
    wp_cat_mecha: "Меха",
    wp_cat_fantasy: "Фэнтези",
    wp_cat_sci_fi: "Научная фантастика",
    wp_cat_anime_style: "Стиль аниме",
    extskin_cat_anime_style: "Стиль аниме",
  },
  uk: {
    wp_cat_anime_inspired: "У стилі аніме",
    wp_cat_comic_inspired: "У стилі коміксів",
    wp_cat_superhero_inspired: "У стилі супергероїв",
    wp_cat_mecha: "Меха",
    wp_cat_fantasy: "Фентезі",
    wp_cat_sci_fi: "Наукова фантастика",
    wp_cat_anime_style: "Стиль аніме",
    extskin_cat_anime_style: "Стиль аніме",
  },
  hi: {
    wp_cat_anime_inspired: "एनीमे से प्रेरित",
    wp_cat_comic_inspired: "कॉमिक से प्रेरित",
    wp_cat_superhero_inspired: "सुपरहीरो से प्रेरित",
    wp_cat_mecha: "मecha",
    wp_cat_fantasy: "फंतासी",
    wp_cat_sci_fi: "विज्ञान-कथा",
    wp_cat_anime_style: "एनीमे शैली",
    extskin_cat_anime_style: "एनीमे शैली",
  },
  ja: {
    wp_cat_anime_inspired: "アニメ風",
    wp_cat_comic_inspired: "コミック風",
    wp_cat_superhero_inspired: "ヒーロー風",
    wp_cat_mecha: "メカ",
    wp_cat_fantasy: "ファンタジー",
    wp_cat_sci_fi: "SF",
    wp_cat_anime_style: "アニメ",
    extskin_cat_anime_style: "アニメ",
  },
  zh: {
    wp_cat_anime_inspired: "动漫灵感",
    wp_cat_comic_inspired: "漫画灵感",
    wp_cat_superhero_inspired: "超级英雄灵感",
    wp_cat_mecha: "机甲",
    wp_cat_fantasy: "奇幻",
    wp_cat_sci_fi: "科幻",
    wp_cat_anime_style: "动漫",
    extskin_cat_anime_style: "动漫",
  },
};

for (const [code, keys] of Object.entries(LEGACY)) {
  const file = path.join(LOCALES, `${code}.json`);
  const json = JSON.parse(fs.readFileSync(file, "utf8"));
  Object.assign(json, keys);
  fs.writeFileSync(file, `${JSON.stringify(json, null, 2)}\n`, "utf8");
}
