#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const localesDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "shared", "i18n", "locales");

const PATCH = {
  de: { lb_your_rank: "Dein Rang", lb_unranked: "Noch nicht gerankt" },
  fr: { lb_your_rank: "Votre rang", lb_unranked: "Pas encore classé" },
  es: { lb_your_rank: "Tu posición", lb_unranked: "Aún sin ranking" },
  pt: { lb_your_rank: "Sua posição", lb_unranked: "Ainda sem ranking" },
  it: { lb_your_rank: "La tua posizione", lb_unranked: "Non ancora in classifica" },
  nl: { lb_your_rank: "Jouw positie", lb_unranked: "Nog niet gerankt" },
  pl: { lb_your_rank: "Twoja pozycja", lb_unranked: "Jeszcze bez rankingu" },
  tr: { lb_your_rank: "Sıralaman", lb_unranked: "Henüz sıralamada değil" },
  id: { lb_your_rank: "Peringkatmu", lb_unranked: "Belum masuk peringkat" },
  hi: { lb_your_rank: "आपकी रैंक", lb_unranked: "अभी रैंक में नहीं" },
  ja: { lb_your_rank: "あなたの順位", lb_unranked: "まだランク外" },
  zh: { lb_your_rank: "你的排名", lb_unranked: "尚未上榜" },
};

for (const [code, keys] of Object.entries(PATCH)) {
  const file = path.join(localesDir, `${code}.json`);
  const data = JSON.parse(fs.readFileSync(file, "utf8"));
  Object.assign(data, keys);
  fs.writeFileSync(file, JSON.stringify(data, null, 2) + "\n");
  console.log("patched", code);
}
