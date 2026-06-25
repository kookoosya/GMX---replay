#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const localesDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "shared", "i18n", "locales");

const PATCH = {
  de: {
    pm_newbie_title: "Was ist ein Prediction Market?",
    pm_newbie_body: "Menschen handeln JA/NEIN-Anteile auf reale Ereignisse. Preise spiegeln Crowd-Odds wider — keine Anlageberatung von GMXReply.",
    pm_learn_more_label: "Live-Märkte extern erkunden",
    pm_learn_polymarket: "Polymarket",
    pm_learn_kalshi: "Kalshi",
    pm_learn_manifold: "Manifold",
  },
  fr: {
    pm_newbie_title: "Qu’est-ce qu’un marché de prédiction ?",
    pm_newbie_body: "On échange des parts OUI/NON sur des événements réels. Les prix reflètent les probabilités de la foule — pas un conseil de GMXReply.",
    pm_learn_more_label: "Explorer les marchés en direct ailleurs",
    pm_learn_polymarket: "Polymarket",
    pm_learn_kalshi: "Kalshi",
    pm_learn_manifold: "Manifold",
  },
  es: {
    pm_newbie_title: "¿Qué es un mercado de predicción?",
    pm_newbie_body: "La gente negocia acciones SÍ/NO sobre resultados reales. Los precios reflejan probabilidades de la multitud — no es asesoramiento de GMXReply.",
    pm_learn_more_label: "Explorar mercados en vivo fuera del sitio",
    pm_learn_polymarket: "Polymarket",
    pm_learn_kalshi: "Kalshi",
    pm_learn_manifold: "Manifold",
  },
  pt: {
    pm_newbie_title: "O que é um mercado de previsão?",
    pm_newbie_body: "Pessoas negociam cotas SIM/NÃO sobre resultados reais. Os preços refletem probabilidades da multidão — não é aconselhamento da GMXReply.",
    pm_learn_more_label: "Explorar mercados ao vivo em outros sites",
    pm_learn_polymarket: "Polymarket",
    pm_learn_kalshi: "Kalshi",
    pm_learn_manifold: "Manifold",
  },
  it: {
    pm_newbie_title: "Cos’è un prediction market?",
    pm_newbie_body: "Si scambiano quote SÌ/NO su esiti reali. I prezzi riflettono le probabilità della folla — non è consulenza di GMXReply.",
    pm_learn_more_label: "Esplora mercati live altrove",
    pm_learn_polymarket: "Polymarket",
    pm_learn_kalshi: "Kalshi",
    pm_learn_manifold: "Manifold",
  },
  nl: {
    pm_newbie_title: "Wat is een prediction market?",
    pm_newbie_body: "Mensen handelen JA/NEE-aandelen op echte uitkomsten. Prijzen weerspiegelen crowd-kansen — geen beleggingsadvies van GMXReply.",
    pm_learn_more_label: "Live markten elders verkennen",
    pm_learn_polymarket: "Polymarket",
    pm_learn_kalshi: "Kalshi",
    pm_learn_manifold: "Manifold",
  },
  pl: {
    pm_newbie_title: "Czym jest prediction market?",
    pm_newbie_body: "Ludzie handlują udziałami TAK/NIE na realne wyniki. Ceny odzwierciedlają szanse tłumu — to nie porada inwestycyjna GMXReply.",
    pm_learn_more_label: "Poznaj live rynki gdzie indziej",
    pm_learn_polymarket: "Polymarket",
    pm_learn_kalshi: "Kalshi",
    pm_learn_manifold: "Manifold",
  },
  tr: {
    pm_newbie_title: "Prediction market nedir?",
    pm_newbie_body: "İnsanlar gerçek sonuçlarda EVET/HAYIR payları alır-satar. Fiyatlar kalabalık olasılığını yansıtır — GMXReply yatırım tavsiyesi değildir.",
    pm_learn_more_label: "Canlı piyasaları başka yerde keşfedin",
    pm_learn_polymarket: "Polymarket",
    pm_learn_kalshi: "Kalshi",
    pm_learn_manifold: "Manifold",
  },
  id: {
    pm_newbie_title: "Apa itu prediction market?",
    pm_newbie_body: "Orang memperdagangkan saham YA/TIDAK pada hasil dunia nyata. Harga mencerminkan peluang massa — bukan saran investasi GMXReply.",
    pm_learn_more_label: "Jelajahi pasar live di tempat lain",
    pm_learn_polymarket: "Polymarket",
    pm_learn_kalshi: "Kalshi",
    pm_learn_manifold: "Manifold",
  },
  hi: {
    pm_newbie_title: "Prediction market क्या है?",
    pm_newbie_body: "लोग real-world नतीजों पर YES/NO shares ट्रेड करते हैं। कीमतें crowd odds दिखाती हैं — GMXReply की investment advice नहीं।",
    pm_learn_more_label: "बाहर live markets देखें",
    pm_learn_polymarket: "Polymarket",
    pm_learn_kalshi: "Kalshi",
    pm_learn_manifold: "Manifold",
  },
  ja: {
    pm_newbie_title: "予測マーケットとは？",
    pm_newbie_body: "現実の出来事に YES/NO シェアを売買します。価格は群衆の確率を反映 — GMXReply の投資助言ではありません。",
    pm_learn_more_label: "外部のライブ市場を見る",
    pm_learn_polymarket: "Polymarket",
    pm_learn_kalshi: "Kalshi",
    pm_learn_manifold: "Manifold",
  },
  zh: {
    pm_newbie_title: "什么是预测市场？",
    pm_newbie_body: "人们在真实事件上交易是/否份额。价格反映群体概率 — 不是 GMXReply 的投资建议。",
    pm_learn_more_label: "在其他平台探索实时市场",
    pm_learn_polymarket: "Polymarket",
    pm_learn_kalshi: "Kalshi",
    pm_learn_manifold: "Manifold",
  },
  ru: {
    pm_newbie_title: "Что такое prediction market?",
    pm_newbie_body: "Люди торгуют долями ДА/НЕТ на исходы реальных событий. Цены отражают «вероятность толпы» — это не инвестсовет GMXReply.",
    pm_learn_more_label: "Изучить live-рынки на стороне",
    pm_learn_polymarket: "Polymarket",
    pm_learn_kalshi: "Kalshi",
    pm_learn_manifold: "Manifold",
  },
  uk: {
    pm_newbie_title: "Що таке prediction market?",
    pm_newbie_body: "Люди торгують частками ТАК/НІ на результати реальних подій. Ціни відображають «ймовірність натовпу» — це не інвестпорада GMXReply.",
    pm_learn_more_label: "Дослідити live-ринки зовні",
    pm_learn_polymarket: "Polymarket",
    pm_learn_kalshi: "Kalshi",
    pm_learn_manifold: "Manifold",
  },
};

for (const [lang, keys] of Object.entries(PATCH)) {
  const file = path.join(localesDir, `${lang}.json`);
  const j = JSON.parse(fs.readFileSync(file, "utf8"));
  Object.assign(j, keys);
  fs.writeFileSync(file, `${JSON.stringify(j, null, 2)}\n`);
}
console.log("patch-prediction-onboarding-i18n: ok");
