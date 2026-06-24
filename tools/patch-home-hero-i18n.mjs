#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const localesDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "shared", "i18n", "locales");

const PATCH = {
  de: {
    hero_video_title: "Auf X antworten. Spiele spielen.",
    hero_video_caption: "Copy-first GM/GN in Sekunden — danach direkt ins Arcade.",
    hero_try_demo: "Beispiel-Antworten testen",
  },
  fr: {
    hero_video_title: "Réponds sur X. Joue aux jeux.",
    hero_video_caption: "GM/GN copy-first en quelques secondes — puis lance l’Arcade.",
    hero_try_demo: "Essayer des exemples",
  },
  es: {
    hero_video_title: "Responde en X. Juega.",
    hero_video_caption: "GM/GN copy-first en segundos — luego entra al Arcade.",
    hero_try_demo: "Probar ejemplos",
  },
  pt: {
    hero_video_title: "Responda no X. Jogue.",
    hero_video_caption: "GM/GN copy-first em segundos — depois abra o Arcade.",
    hero_try_demo: "Testar exemplos",
  },
  it: {
    hero_video_title: "Rispondi su X. Gioca.",
    hero_video_caption: "GM/GN copy-first in pochi secondi — poi vai all’Arcade.",
    hero_try_demo: "Prova esempi",
  },
  nl: {
    hero_video_title: "Reageer op X. Speel games.",
    hero_video_caption: "Copy-first GM/GN in seconden — daarna Arcade openen.",
    hero_try_demo: "Voorbeelden proberen",
  },
  tr: {
    hero_video_title: "X’te yanıtla. Oyun oyna.",
    hero_video_caption: "Saniyeler içinde copy-first GM/GN — sonra Arcade’e geç.",
    hero_try_demo: "Örnekleri dene",
  },
  pl: {
    hero_video_title: "Odpowiadaj na X. Graj.",
    hero_video_caption: "Copy-first GM/GN w kilka sekund — potem Arcade.",
    hero_try_demo: "Wypróbuj przykłady",
  },
  id: {
    hero_video_title: "Balas di X. Main game.",
    hero_video_caption: "GM/GN copy-first dalam hitungan detik — lalu buka Arcade.",
    hero_try_demo: "Coba contoh",
  },
  ru: {
    hero_video_title: "Отвечай на X. Играй.",
    hero_video_caption: "Copy-first GM/GN за секунды — потом Arcade.",
    hero_try_demo: "Попробовать примеры",
  },
  uk: {
    hero_video_title: "Відповідай на X. Грай.",
    hero_video_caption: "Copy-first GM/GN за секунди — далі Arcade.",
    hero_try_demo: "Спробувати приклади",
  },
  hi: {
    hero_video_title: "X पर जवाब दें। गेम खेलें।",
    hero_video_caption: "सेकंडों में copy-first GM/GN — फिर Arcade खोलें।",
    hero_try_demo: "सैंपल आज़माएँ",
  },
  ja: {
    hero_video_title: "Xで返信。ゲームをプレイ。",
    hero_video_caption: "数秒でコピー優先のGM/GN — そのあとArcadeへ。",
    hero_try_demo: "サンプルを試す",
  },
  zh: {
    hero_video_title: "在 X 上回复。畅玩小游戏。",
    hero_video_caption: "几秒内 copy-first 的 GM/GN — 然后进入 Arcade。",
    hero_try_demo: "试用示例回复",
  },
};

for (const [code, values] of Object.entries(PATCH)) {
  const file = path.join(localesDir, `${code}.json`);
  const json = JSON.parse(fs.readFileSync(file, "utf8"));
  Object.assign(json, values);
  fs.writeFileSync(file, JSON.stringify(json, null, 2) + "\n", "utf8");
  console.log(`patched ${code}.json`);
}
