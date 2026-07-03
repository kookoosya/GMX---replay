#!/usr/bin/env node
/** Localized V4 wallpaper category labels (strict i18n gate). */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const LOCALES = path.join(ROOT, "shared", "i18n", "locales");

const PATCHES = {
  de: {
    wp_cat_anime_inspired: "Anime-inspiriert",
    wp_cat_comic_inspired: "Comic-inspiriert",
    wp_cat_superhero_inspired: "Superhelden-inspiriert",
    wp_cat_mecha: "Mecha-Roboter",
    wp_cat_fantasy: "Fantasie",
    wp_cat_sci_fi: "Science-Fiction",
  },
  fr: {
    wp_cat_anime_inspired: "Inspiré anime",
    wp_cat_comic_inspired: "Inspiré comics",
    wp_cat_superhero_inspired: "Inspiré super-héros",
    wp_cat_mecha: "Robots mécha",
    wp_cat_fantasy: "Fantastique",
    wp_cat_sci_fi: "Science-fiction",
  },
  es: {
    wp_cat_anime_inspired: "Inspirado en anime",
    wp_cat_comic_inspired: "Inspirado en cómics",
    wp_cat_superhero_inspired: "Inspirado en superhéroes",
    wp_cat_mecha: "Estilo mecha",
    wp_cat_fantasy: "Fantasía",
    wp_cat_sci_fi: "Ciencia ficción",
  },
  pt: {
    wp_cat_anime_inspired: "Inspirado em anime",
    wp_cat_comic_inspired: "Inspirado em quadrinhos",
    wp_cat_superhero_inspired: "Inspirado em super-heróis",
    wp_cat_mecha: "Estilo mecha",
    wp_cat_fantasy: "Fantasia",
    wp_cat_sci_fi: "Ficção científica",
  },
  it: {
    wp_cat_anime_inspired: "Ispirato all'anime",
    wp_cat_comic_inspired: "Ispirato ai fumetti",
    wp_cat_superhero_inspired: "Ispirato ai supereroi",
    wp_cat_mecha: "Stile mecha",
    wp_cat_fantasy: "Mondo fantasy",
    wp_cat_sci_fi: "Fantascienza",
  },
  nl: {
    wp_cat_anime_inspired: "Anime-geïnspireerd",
    wp_cat_comic_inspired: "Strip-geïnspireerd",
    wp_cat_superhero_inspired: "Superheld-geïnspireerd",
    wp_cat_mecha: "Mecha-stijl",
    wp_cat_fantasy: "Fantasie",
    wp_cat_sci_fi: "Sciencefiction",
  },
  tr: {
    wp_cat_anime_inspired: "Anime esintili",
    wp_cat_comic_inspired: "Çizgi roman esintili",
    wp_cat_superhero_inspired: "Süper kahraman esintili",
    wp_cat_mecha: "Mecha tarzı",
    wp_cat_fantasy: "Fantezi",
    wp_cat_sci_fi: "Bilim kurgu",
  },
  pl: {
    wp_cat_anime_inspired: "W stylu anime",
    wp_cat_comic_inspired: "W stylu komiksów",
    wp_cat_superhero_inspired: "W stylu superbohaterów",
    wp_cat_mecha: "Styl mecha",
    wp_cat_fantasy: "Świat fantasy",
    wp_cat_sci_fi: "Science fiction",
  },
  id: {
    wp_cat_anime_inspired: "Terinspirasi anime",
    wp_cat_comic_inspired: "Terinspirasi komik",
    wp_cat_superhero_inspired: "Terinspirasi superhero",
    wp_cat_mecha: "Gaya mecha",
    wp_cat_fantasy: "Fantasi",
    wp_cat_sci_fi: "Fiksi ilmiah",
  },
  ru: {
    wp_cat_anime_inspired: "В стиле аниме",
    wp_cat_comic_inspired: "В стиле комиксов",
    wp_cat_superhero_inspired: "В стиле супергероев",
    wp_cat_mecha: "Меха",
    wp_cat_fantasy: "Фэнтези",
    wp_cat_sci_fi: "Научная фантастика",
  },
  uk: {
    wp_cat_anime_inspired: "У стилі аніме",
    wp_cat_comic_inspired: "У стилі коміксів",
    wp_cat_superhero_inspired: "У стилі супергероїв",
    wp_cat_mecha: "Меха",
    wp_cat_fantasy: "Фентезі",
    wp_cat_sci_fi: "Наукова фантастика",
  },
  hi: {
    wp_cat_anime_inspired: "एनीमे से प्रेरित",
    wp_cat_comic_inspired: "कॉमिक से प्रेरित",
    wp_cat_superhero_inspired: "सुपरहीरो से प्रेरित",
    wp_cat_mecha: "मेचा",
    wp_cat_fantasy: "फंतासी",
    wp_cat_sci_fi: "साइ-फाई",
  },
  ja: {
    wp_cat_anime_inspired: "アニメ風",
    wp_cat_comic_inspired: "コミック風",
    wp_cat_superhero_inspired: "スーパーヒーロー風",
    wp_cat_mecha: "メカ",
    wp_cat_fantasy: "ファンタジー",
    wp_cat_sci_fi: "SF",
  },
  zh: {
    wp_cat_anime_inspired: "动漫风格",
    wp_cat_comic_inspired: "漫画风格",
    wp_cat_superhero_inspired: "超级英雄风格",
    wp_cat_mecha: "机甲",
    wp_cat_fantasy: "奇幻",
    wp_cat_sci_fi: "科幻",
  },
};

let updated = 0;
for (const [code, patch] of Object.entries(PATCHES)) {
  const file = path.join(LOCALES, `${code}.json`);
  const json = JSON.parse(fs.readFileSync(file, "utf8"));
  for (const [key, value] of Object.entries(patch)) {
    json[key] = value;
    updated++;
  }
  fs.writeFileSync(file, `${JSON.stringify(json, null, 2)}\n`, "utf8");
}
console.log(`i18n-themes-v4-category-patches: ${updated} keys across ${Object.keys(PATCHES).length} locales`);
