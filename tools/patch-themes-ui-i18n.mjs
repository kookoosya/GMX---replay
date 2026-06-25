#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const localesDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "shared", "i18n", "locales");

const PATCH = {
  de: {
    themes_pick_note: "Zum Vorschauen hovern; freigeschaltete Themes per Klick anwenden.",
    themes_hover_preview: "Zum Vorschauen hovern",
    themes_group_dark: "Dunkel",
    themes_group_light: "Hell",
    themes_group_colorful: "Bunt",
    themes_pro_unlocks_all: "Pro schaltet alles frei",
  },
  fr: {
    themes_pick_note: "Survolez pour prévisualiser ; cliquez sur un thème débloqué pour l'appliquer.",
    themes_hover_preview: "Survoler pour prévisualiser",
    themes_group_dark: "Sombre",
    themes_group_light: "Clair",
    themes_group_colorful: "Coloré",
    themes_pro_unlocks_all: "Pro débloque tout",
  },
  es: {
    themes_pick_note: "Pasa el cursor para previsualizar; haz clic en un tema desbloqueado para aplicarlo.",
    themes_hover_preview: "Pasa el cursor para previsualizar",
    themes_group_dark: "Oscuro",
    themes_group_light: "Claro",
    themes_group_colorful: "Colorido",
    themes_pro_unlocks_all: "Pro desbloquea todo",
  },
  pt: {
    themes_pick_note: "Passe o mouse para pré-visualizar; clique num tema desbloqueado para aplicar.",
    themes_hover_preview: "Passe o mouse para pré-visualizar",
    themes_group_dark: "Escuro",
    themes_group_light: "Claro",
    themes_group_colorful: "Colorido",
    themes_pro_unlocks_all: "Pro desbloqueia tudo",
  },
  it: {
    themes_pick_note: "Passa il mouse per l'anteprima; clic su un tema sbloccato per applicarlo.",
    themes_hover_preview: "Passa il mouse per l'anteprima",
    themes_group_dark: "Scuro",
    themes_group_light: "Chiaro",
    themes_group_colorful: "Colorato",
    themes_pro_unlocks_all: "Pro sblocca tutto",
  },
  nl: {
    themes_pick_note: "Hover voor preview; klik een ontgrendeld thema om toe te passen.",
    themes_hover_preview: "Hover voor preview",
    themes_group_dark: "Donker",
    themes_group_light: "Licht",
    themes_group_colorful: "Kleurrijk",
    themes_pro_unlocks_all: "Pro ontgrendelt alles",
  },
  pl: {
    themes_pick_note: "Najedź, by zobaczyć podgląd; kliknij odblokowany motyw, by zastosować.",
    themes_hover_preview: "Najedź, by zobaczyć podgląd",
    themes_group_dark: "Ciemne",
    themes_group_light: "Jasne",
    themes_group_colorful: "Kolorowe",
    themes_pro_unlocks_all: "Pro odblokowuje wszystko",
  },
  tr: {
    themes_pick_note: "Önizlemek için üzerine gelin; uygulamak için açık temaya tıklayın.",
    themes_hover_preview: "Önizlemek için üzerine gelin",
    themes_group_dark: "Koyu",
    themes_group_light: "Açık",
    themes_group_colorful: "Renkli",
    themes_pro_unlocks_all: "Pro hepsini açar",
  },
  id: {
    themes_pick_note: "Arahkan kursor untuk pratinjau; klik tema terbuka untuk menerapkan.",
    themes_hover_preview: "Arahkan kursor untuk pratinjau",
    themes_group_dark: "Gelap",
    themes_group_light: "Terang",
    themes_group_colorful: "Warna-warni",
    themes_pro_unlocks_all: "Pro membuka semua",
  },
  hi: {
    themes_pick_note: "प्रीव्यू के लिए होवर करें; अनलॉक थीम पर क्लिक करके लागू करें।",
    themes_hover_preview: "प्रीव्यू के लिए होवर करें",
    themes_group_dark: "डार्क",
    themes_group_light: "लाइट",
    themes_group_colorful: "रंगीन",
    themes_pro_unlocks_all: "Pro सब अनलॉक करता है",
  },
  ja: {
    themes_pick_note: "ホバーでプレビュー、アンロック済みテーマをクリックで適用。",
    themes_hover_preview: "ホバーでプレビュー",
    themes_group_dark: "ダーク",
    themes_group_light: "ライト",
    themes_group_colorful: "カラフル",
    themes_pro_unlocks_all: "Proで全解放",
  },
  zh: {
    themes_pick_note: "悬停预览；点击已解锁主题即可应用。",
    themes_hover_preview: "悬停预览",
    themes_group_dark: "深色",
    themes_group_light: "浅色",
    themes_group_colorful: "多彩",
    themes_pro_unlocks_all: "Pro 解锁全部",
  },
};

for (const [code, keys] of Object.entries(PATCH)) {
  const file = path.join(localesDir, `${code}.json`);
  const data = JSON.parse(fs.readFileSync(file, "utf8"));
  Object.assign(data, keys);
  fs.writeFileSync(file, JSON.stringify(data, null, 2) + "\n");
  console.log("patched", code);
}
