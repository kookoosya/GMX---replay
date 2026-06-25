#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const localesDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "shared", "i18n", "locales");

const PATCH = {
  de: {
    mobile_nav_more: "Mehr",
    mobile_nav_arcade: "Arcade",
    gm_swipe_hint: "Wische links/rechts, um zwischen GM und GN zu wechseln",
  },
  fr: {
    mobile_nav_more: "Plus",
    mobile_nav_arcade: "Arcade",
    gm_swipe_hint: "Glissez à gauche/droite pour passer de GM à GN",
  },
  es: {
    mobile_nav_more: "Más",
    mobile_nav_arcade: "Arcade",
    gm_swipe_hint: "Desliza izquierda/derecha para cambiar entre GM y GN",
  },
  pt: {
    mobile_nav_more: "Mais",
    mobile_nav_arcade: "Arcade",
    gm_swipe_hint: "Deslize para a esquerda/direita para alternar GM e GN",
  },
  it: {
    mobile_nav_more: "Altro",
    mobile_nav_arcade: "Arcade",
    gm_swipe_hint: "Scorri a sinistra/destra per passare tra GM e GN",
  },
  nl: {
    mobile_nav_more: "Meer",
    mobile_nav_arcade: "Arcade",
    gm_swipe_hint: "Veeg links/rechts om te wisselen tussen GM en GN",
  },
  pl: {
    mobile_nav_more: "Więcej",
    mobile_nav_arcade: "Arcade",
    gm_swipe_hint: "Przesuń w lewo/prawo, aby przełączyć GM i GN",
  },
  tr: {
    mobile_nav_more: "Daha fazla",
    mobile_nav_arcade: "Arcade",
    gm_swipe_hint: "GM ve GN arasında geçmek için sola/sağa kaydırın",
  },
  id: {
    mobile_nav_more: "Lainnya",
    mobile_nav_arcade: "Arcade",
    gm_swipe_hint: "Geser kiri/kanan untuk beralih antara GM dan GN",
  },
  hi: {
    mobile_nav_more: "और",
    mobile_nav_arcade: "Arcade",
    gm_swipe_hint: "GM और GN के बीच स्विच करने के लिए बाएँ/दाएँ स्वाइप करें",
  },
  ja: {
    mobile_nav_more: "その他",
    mobile_nav_arcade: "Arcade",
    gm_swipe_hint: "左右にスワイプして GM と GN を切り替え",
  },
  zh: {
    mobile_nav_more: "更多",
    mobile_nav_arcade: "Arcade",
    gm_swipe_hint: "左右滑动在 GM 与 GN 之间切换",
  },
  ru: {
    mobile_nav_more: "Ещё",
    mobile_nav_arcade: "Аркада",
    gm_swipe_hint: "Свайп влево/вправо — переключение GM ↔ GN",
  },
  uk: {
    mobile_nav_more: "Ще",
    mobile_nav_arcade: "Аркада",
    gm_swipe_hint: "Свайп вліво/вправо — перемикання GM ↔ GN",
  },
};

for (const [lang, keys] of Object.entries(PATCH)) {
  const file = path.join(localesDir, `${lang}.json`);
  const j = JSON.parse(fs.readFileSync(file, "utf8"));
  Object.assign(j, keys);
  fs.writeFileSync(file, `${JSON.stringify(j, null, 2)}\n`);
}
console.log("patch-mobile-nav-i18n: ok");
