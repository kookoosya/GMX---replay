#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const localesDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "shared", "i18n", "locales");

const PATCH = {
  de: {
    blog_home_teaser_title: "Ratgeber",
    blog_home_link_io: "Top 10 .io-Spiele 2025",
    blog_home_link_gm: "GM-Antworten menschlich schreiben",
    blog_home_link_all: "Alle Guides →",
  },
  fr: {
    blog_home_teaser_title: "Conseils",
    blog_home_link_io: "Top 10 jeux .io en 2025",
    blog_home_link_gm: "Écrire des GM qui sonnent humains",
    blog_home_link_all: "Tous les guides →",
  },
  es: {
    blog_home_teaser_title: "Guías",
    blog_home_link_io: "Top 10 juegos .io en 2025",
    blog_home_link_gm: "Cómo escribir GM que suenen humanos",
    blog_home_link_all: "Todas las guías →",
  },
  pt: {
    blog_home_teaser_title: "Guias",
    blog_home_link_io: "Top 10 jogos .io em 2025",
    blog_home_link_gm: "Como escrever GM que soam humanos",
    blog_home_link_all: "Todos os guias →",
  },
  it: {
    blog_home_teaser_title: "Guide",
    blog_home_link_io: "Top 10 giochi .io nel 2025",
    blog_home_link_gm: "Scrivere GM che suonano umani",
    blog_home_link_all: "Tutte le guide →",
  },
  nl: {
    blog_home_teaser_title: "Gidsen",
    blog_home_link_io: "Top 10 .io-games in 2025",
    blog_home_link_gm: "GM-antwoorden menselijk schrijven",
    blog_home_link_all: "Alle gidsen →",
  },
  pl: {
    blog_home_teaser_title: "Poradniki",
    blog_home_link_io: "Top 10 gier .io w 2025",
    blog_home_link_gm: "Jak pisać GM brzmiące naturalnie",
    blog_home_link_all: "Wszystkie poradniki →",
  },
  tr: {
    blog_home_teaser_title: "Rehberler",
    blog_home_link_io: "2025'in en iyi 10 .io oyunu",
    blog_home_link_gm: "İnsan gibi GM yanıtları yazma",
    blog_home_link_all: "Tüm rehberler →",
  },
  id: {
    blog_home_teaser_title: "Panduan",
    blog_home_link_io: "10 game .io terbaik 2025",
    blog_home_link_gm: "Cara menulis balasan GM yang natural",
    blog_home_link_all: "Semua panduan →",
  },
  ru: {
    blog_home_teaser_title: "Гайды",
    blog_home_link_io: "Топ-10 .io игр в 2025",
    blog_home_link_gm: "Как писать GM, которые звучат по-человечески",
    blog_home_link_all: "Все гайды →",
  },
  uk: {
    blog_home_teaser_title: "Гайди",
    blog_home_link_io: "Топ-10 .io ігор у 2025",
    blog_home_link_gm: "Як писати GM, які звучать по-людськи",
    blog_home_link_all: "Усі гайди →",
  },
  hi: {
    blog_home_teaser_title: "गाइड",
    blog_home_link_io: "2025 के टॉप 10 .io गेम",
    blog_home_link_gm: "इंसानी GM जवाब कैसे लिखें",
    blog_home_link_all: "सभी गाइड →",
  },
  ja: {
    blog_home_teaser_title: "ガイド",
    blog_home_link_io: "2025年の.ioゲームTOP10",
    blog_home_link_gm: "自然なGM返信の書き方",
    blog_home_link_all: "すべてのガイド →",
  },
  zh: {
    blog_home_teaser_title: "指南",
    blog_home_link_io: "2025 十大 .io 游戏",
    blog_home_link_gm: "如何写出自然的 GM 回复",
    blog_home_link_all: "全部指南 →",
  },
};

const EN_KEYS = {
  blog_home_teaser_title: "Guides",
  blog_home_link_io: "Top 10 .io games 2025",
  blog_home_link_gm: "How to write GM replies",
  blog_home_link_all: "All guides →",
};

const enPath = path.join(localesDir, "en.json");
const en = JSON.parse(fs.readFileSync(enPath, "utf8"));
Object.assign(en, EN_KEYS);
fs.writeFileSync(enPath, `${JSON.stringify(en, null, 2)}\n`);

for (const lang of fs.readdirSync(localesDir).map((f) => f.replace(/\.json$/, "")).filter((c) => c !== "en")) {
  const file = path.join(localesDir, `${lang}.json`);
  const j = JSON.parse(fs.readFileSync(file, "utf8"));
  for (const [k, v] of Object.entries(EN_KEYS)) {
    if (j[k] === undefined) j[k] = v;
  }
  if (PATCH[lang]) Object.assign(j, PATCH[lang]);
  fs.writeFileSync(file, `${JSON.stringify(j, null, 2)}\n`);
}
console.log("patch-blog-i18n: ok");
