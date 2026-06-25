#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const localesDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "shared", "i18n", "locales");

const PATCH = {
  de: { h_connected_today: "{n} Personen heute verbunden" },
  fr: { h_connected_today: "{n} personnes connectées aujourd’hui" },
  es: { h_connected_today: "{n} personas conectadas hoy" },
  pt: { h_connected_today: "{n} pessoas conectadas hoje" },
  it: { h_connected_today: "{n} persone connesse oggi" },
  nl: { h_connected_today: "{n} mensen vandaag verbonden" },
  pl: { h_connected_today: "{n} osób połączonych dziś" },
  tr: { h_connected_today: "Bugün {n} kişi bağlandı" },
  id: { h_connected_today: "{n} orang terhubung hari ini" },
  ru: { h_connected_today: "{n} человек подключились сегодня" },
  uk: { h_connected_today: "{n} людей підключилися сьогодні" },
  hi: { h_connected_today: "आज {n} लोग जुड़े" },
  ja: { h_connected_today: "本日{n}人が接続" },
  zh: { h_connected_today: "今日 {n} 人已连接" },
};

const en = JSON.parse(fs.readFileSync(path.join(localesDir, "en.json"), "utf8"));

for (const lang of fs.readdirSync(localesDir).map((f) => f.replace(/\.json$/, "")).filter((c) => c !== "en")) {
  const file = path.join(localesDir, `${lang}.json`);
  const j = JSON.parse(fs.readFileSync(file, "utf8"));
  if (j.h_connected_today === undefined && en.h_connected_today) j.h_connected_today = en.h_connected_today;
  if (PATCH[lang]) Object.assign(j, PATCH[lang]);
  fs.writeFileSync(file, `${JSON.stringify(j, null, 2)}\n`);
}
console.log("patch-home-connected-i18n: ok");
