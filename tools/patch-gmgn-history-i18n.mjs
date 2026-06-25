#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const localesDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "shared", "i18n", "locales");

const PATCH = {
  de: {
    gen_history_label: "Letzte Batches",
    gen_history_copy: "Erneut kopieren",
    gm_gen_history_label: "Letzte GM-Batches",
    gn_gen_history_label: "Letzte GN-Batches",
    gm_gen_history_copy: "Erneut kopieren",
    gn_gen_history_copy: "Erneut kopieren",
    gm_edit_hint: "Klicke eine gespeicherte Zeile, um sie inline zu bearbeiten.",
    gn_edit_hint: "Klicke eine gespeicherte Zeile, um sie inline zu bearbeiten.",
  },
  fr: {
    gen_history_label: "Lots récents",
    gen_history_copy: "Copier à nouveau",
    gm_gen_history_label: "Lots GM récents",
    gn_gen_history_label: "Lots GN récents",
    gm_gen_history_copy: "Copier à nouveau",
    gn_gen_history_copy: "Copier à nouveau",
    gm_edit_hint: "Cliquez sur une ligne enregistrée pour la modifier.",
    gn_edit_hint: "Cliquez sur une ligne enregistrée pour la modifier.",
  },
  es: {
    gen_history_label: "Lotes recientes",
    gen_history_copy: "Copiar de nuevo",
    gm_gen_history_label: "Lotes GM recientes",
    gn_gen_history_label: "Lotes GN recientes",
    gm_gen_history_copy: "Copiar de nuevo",
    gn_gen_history_copy: "Copiar de nuevo",
    gm_edit_hint: "Haz clic en una línea guardada para editarla.",
    gn_edit_hint: "Haz clic en una línea guardada para editarla.",
  },
  pt: {
    gen_history_label: "Lotes recentes",
    gen_history_copy: "Copiar novamente",
    gm_gen_history_label: "Lotes GM recentes",
    gn_gen_history_label: "Lotes GN recentes",
    gm_gen_history_copy: "Copiar novamente",
    gn_gen_history_copy: "Copiar novamente",
    gm_edit_hint: "Clique numa linha salva para editar inline.",
    gn_edit_hint: "Clique numa linha salva para editar inline.",
  },
  it: {
    gen_history_label: "Batch recenti",
    gen_history_copy: "Copia di nuovo",
    gm_gen_history_label: "Batch GM recenti",
    gn_gen_history_label: "Batch GN recenti",
    gm_gen_history_copy: "Copia di nuovo",
    gn_gen_history_copy: "Copia di nuovo",
    gm_edit_hint: "Clicca una riga salvata per modificarla inline.",
    gn_edit_hint: "Clicca una riga salvata per modificarla inline.",
  },
  nl: {
    gen_history_label: "Recente batches",
    gen_history_copy: "Opnieuw kopiëren",
    gm_gen_history_label: "Recente GM-batches",
    gn_gen_history_label: "Recente GN-batches",
    gm_gen_history_copy: "Opnieuw kopiëren",
    gn_gen_history_copy: "Opnieuw kopiëren",
    gm_edit_hint: "Klik op een opgeslagen regel om inline te bewerken.",
    gn_edit_hint: "Klik op een opgeslagen regel om inline te bewerken.",
  },
  pl: {
    gen_history_label: "Ostatnie paczki",
    gen_history_copy: "Kopiuj ponownie",
    gm_gen_history_label: "Ostatnie paczki GM",
    gn_gen_history_label: "Ostatnie paczki GN",
    gm_gen_history_copy: "Kopiuj ponownie",
    gn_gen_history_copy: "Kopiuj ponownie",
    gm_edit_hint: "Kliknij zapisaną linię, aby edytować ją inline.",
    gn_edit_hint: "Kliknij zapisaną linię, aby edytować ją inline.",
  },
  tr: {
    gen_history_label: "Son batch'ler",
    gen_history_copy: "Tekrar kopyala",
    gm_gen_history_label: "Son GM batch'leri",
    gn_gen_history_label: "Son GN batch'leri",
    gm_gen_history_copy: "Tekrar kopyala",
    gn_gen_history_copy: "Tekrar kopyala",
    gm_edit_hint: "Satır içi düzenlemek için kayıtlı bir satıra tıklayın.",
    gn_edit_hint: "Satır içi düzenlemek için kayıtlı bir satıra tıklayın.",
  },
  id: {
    gen_history_label: "Batch terbaru",
    gen_history_copy: "Salin lagi",
    gm_gen_history_label: "Batch GM terbaru",
    gn_gen_history_label: "Batch GN terbaru",
    gm_gen_history_copy: "Salin lagi",
    gn_gen_history_copy: "Salin lagi",
    gm_edit_hint: "Klik baris tersimpan untuk mengedit inline.",
    gn_edit_hint: "Klik baris tersimpan untuk mengedit inline.",
  },
  hi: {
    gen_history_label: "हाल के बैच",
    gen_history_copy: "फिर से कॉपी करें",
    gm_gen_history_label: "हाल के GM बैच",
    gn_gen_history_label: "हाल के GN बैच",
    gm_gen_history_copy: "फिर से कॉपी करें",
    gn_gen_history_copy: "फिर से कॉपी करें",
    gm_edit_hint: "इनलाइन एडिट के लिए किसी सेव्ड लाइन पर क्लिक करें।",
    gn_edit_hint: "इनलाइन एडिट के लिए किसी सेव्ड लाइन पर क्लिक करें।",
  },
  ja: {
    gen_history_label: "最近のバッチ",
    gen_history_copy: "もう一度コピー",
    gm_gen_history_label: "最近のGMバッチ",
    gn_gen_history_label: "最近のGNバッチ",
    gm_gen_history_copy: "もう一度コピー",
    gn_gen_history_copy: "もう一度コピー",
    gm_edit_hint: "保存行をクリックしてインライン編集。",
    gn_edit_hint: "保存行をクリックしてインライン編集。",
  },
  zh: {
    gen_history_label: "最近批次",
    gen_history_copy: "再次复制",
    gm_gen_history_label: "最近 GM 批次",
    gn_gen_history_label: "最近 GN 批次",
    gm_gen_history_copy: "再次复制",
    gn_gen_history_copy: "再次复制",
    gm_edit_hint: "点击任意已保存行即可内联编辑。",
    gn_edit_hint: "点击任意已保存行即可内联编辑。",
  },
};

for (const [code, keys] of Object.entries(PATCH)) {
  const file = path.join(localesDir, `${code}.json`);
  const data = JSON.parse(fs.readFileSync(file, "utf8"));
  Object.assign(data, keys);
  fs.writeFileSync(file, JSON.stringify(data, null, 2) + "\n");
  console.log("patched", code);
}
