#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const localesDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "shared", "i18n", "locales");

const PATCH = {
  de: {
    ref_progress_need_html: "Noch <b>{n}</b> berechtigte nötig",
    ref_progress_ready: "Freischaltung beim nächsten berechtigten Referral",
  },
  fr: {
    ref_progress_need_html: "Encore <b>{n}</b> éligibles requis",
    ref_progress_ready: "Déverrouillage au prochain parrainage éligible",
  },
  es: {
    ref_progress_need_html: "Faltan <b>{n}</b> elegibles más",
    ref_progress_ready: "Desbloqueo en el próximo referido elegible",
  },
  pt: {
    ref_progress_need_html: "Faltam <b>{n}</b> elegíveis",
    ref_progress_ready: "Desbloqueio no próximo referido elegível",
  },
  it: {
    ref_progress_need_html: "Servono ancora <b>{n}</b> idonei",
    ref_progress_ready: "Sblocco al prossimo referral idoneo",
  },
  nl: {
    ref_progress_need_html: "Nog <b>{n}</b> in aanmerking komenden nodig",
    ref_progress_ready: "Ontgrendeling bij de volgende eligible referral",
  },
  pl: {
    ref_progress_need_html: "Potrzeba jeszcze <b>{n}</b> uprawnionych",
    ref_progress_ready: "Odblokowanie przy następnym eligible referralu",
  },
  tr: {
    ref_progress_need_html: "<b>{n}</b> uygun kullanıcı daha gerekli",
    ref_progress_ready: "Sonraki uygun referansla kilidi açılır",
  },
  id: {
    ref_progress_need_html: "Butuh <b>{n}</b> eligible lagi",
    ref_progress_ready: "Terbuka pada referral eligible berikutnya",
  },
  hi: {
    ref_progress_need_html: "अभी <b>{n}</b> और योग्य चाहिए",
    ref_progress_ready: "अगले योग्य रेफ़रल पर अनलॉक",
  },
  ja: {
    ref_progress_need_html: "あと<b>{n}</b>人の対象者が必要",
    ref_progress_ready: "次の対象紹介でロック解除",
  },
  zh: {
    ref_progress_need_html: "还需<b>{n}</b>个符合条件",
    ref_progress_ready: "下一个符合条件推荐即可解锁",
  },
};

for (const [code, keys] of Object.entries(PATCH)) {
  const file = path.join(localesDir, `${code}.json`);
  const j = JSON.parse(fs.readFileSync(file, "utf8"));
  Object.assign(j, keys);
  fs.writeFileSync(file, `${JSON.stringify(j, null, 2)}\n`);
  console.log("patched", code);
}
