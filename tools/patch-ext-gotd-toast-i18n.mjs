#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const localesDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "shared", "i18n", "locales");

const PATCH = {
  de: {
    ext_gotd_toast_title: "Spiel des Tages",
    ext_gotd_toast_body: "Probiere {name} im GMX Arcade — tippe zum Spielen.",
  },
  fr: {
    ext_gotd_toast_title: "Jeu du jour",
    ext_gotd_toast_body: "Essaie {name} dans GMX Arcade — appuie pour jouer.",
  },
  es: {
    ext_gotd_toast_title: "Juego del día",
    ext_gotd_toast_body: "Prueba {name} en GMX Arcade — toca para jugar.",
  },
  pt: {
    ext_gotd_toast_title: "Jogo do dia",
    ext_gotd_toast_body: "Experimente {name} no GMX Arcade — toque para jogar.",
  },
  it: {
    ext_gotd_toast_title: "Gioco del giorno",
    ext_gotd_toast_body: "Prova {name} in GMX Arcade — tocca per giocare.",
  },
  nl: {
    ext_gotd_toast_title: "Spel van de dag",
    ext_gotd_toast_body: "Probeer {name} in GMX Arcade — tik om te spelen.",
  },
  tr: {
    ext_gotd_toast_title: "Günün oyunu",
    ext_gotd_toast_body: "GMX Arcade'de {name} oyna — dokun ve başlat.",
  },
  pl: {
    ext_gotd_toast_title: "Gra dnia",
    ext_gotd_toast_body: "Wypróbuj {name} w GMX Arcade — dotknij, by grać.",
  },
  id: {
    ext_gotd_toast_title: "Game hari ini",
    ext_gotd_toast_body: "Coba {name} di GMX Arcade — ketuk untuk main.",
  },
  ru: {
    ext_gotd_toast_title: "Игра дня",
    ext_gotd_toast_body: "Попробуй {name} в GMX Arcade — нажми, чтобы играть.",
  },
  uk: {
    ext_gotd_toast_title: "Гра дня",
    ext_gotd_toast_body: "Спробуй {name} у GMX Arcade — натисни, щоб грати.",
  },
  hi: {
    ext_gotd_toast_title: "आज का गेम",
    ext_gotd_toast_body: "GMX Arcade में {name} आज़माएँ — खेलने के लिए टैप करें।",
  },
  ja: {
    ext_gotd_toast_title: "今日のゲーム",
    ext_gotd_toast_body: "GMX Arcadeで{name}をプレイ — タップして開始。",
  },
  zh: {
    ext_gotd_toast_title: "今日游戏",
    ext_gotd_toast_body: "在 GMX Arcade 试试 {name} — 点击即玩。",
  },
};

for (const [code, values] of Object.entries(PATCH)) {
  const file = path.join(localesDir, `${code}.json`);
  const json = JSON.parse(fs.readFileSync(file, "utf8"));
  Object.assign(json, values);
  fs.writeFileSync(file, JSON.stringify(json, null, 2) + "\n", "utf8");
  console.log(`patched ${code}.json`);
}
