#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const localesDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "shared", "i18n", "locales");

const PATCH = {
  de: { ui_breadcrumb_nav_label: "Brotkrumen-Navigation" },
  fr: { ui_breadcrumb_nav_label: "Fil d'Ariane" },
  es: { ui_breadcrumb_nav_label: "Migas de pan" },
  pt: { ui_breadcrumb_nav_label: "Navegação estrutural" },
  it: { ui_breadcrumb_nav_label: "Percorso di navigazione" },
  nl: { ui_breadcrumb_nav_label: "Broodkruimelnavigatie" },
  pl: { ui_breadcrumb_nav_label: "Okruszki nawigacji" },
  tr: { ui_breadcrumb_nav_label: "İçerik yolu" },
  id: { ui_breadcrumb_nav_label: "Navigasi breadcrumb" },
  ru: { ui_breadcrumb_nav_label: "Навигационная цепочка" },
  uk: { ui_breadcrumb_nav_label: "Навігаційний ланцюжок" },
  hi: { ui_breadcrumb_nav_label: "ब्रेडक्रंब नेविगेशन" },
  ja: { ui_breadcrumb_nav_label: "パンくずナビ" },
  zh: { ui_breadcrumb_nav_label: "面包屑导航" },
};

const en = JSON.parse(fs.readFileSync(path.join(localesDir, "en.json"), "utf8"));
if (!en.ui_breadcrumb_nav_label) {
  en.ui_breadcrumb_nav_label = "Breadcrumb";
  fs.writeFileSync(path.join(localesDir, "en.json"), `${JSON.stringify(en, null, 2)}\n`);
}

for (const lang of fs.readdirSync(localesDir).map((f) => f.replace(/\.json$/, "")).filter((c) => c !== "en")) {
  const file = path.join(localesDir, `${lang}.json`);
  const j = JSON.parse(fs.readFileSync(file, "utf8"));
  if (j.ui_breadcrumb_nav_label === undefined) j.ui_breadcrumb_nav_label = en.ui_breadcrumb_nav_label;
  if (PATCH[lang]) Object.assign(j, PATCH[lang]);
  fs.writeFileSync(file, `${JSON.stringify(j, null, 2)}\n`);
}
console.log("patch-breadcrumbs-i18n: ok");
