#!/usr/bin/env node
/**
 * GN tab: align button labels, quota copy, and first-run description across locales.
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = path.join(process.cwd(), "shared", "i18n", "locales");

const GN_DESC = {
  en: "Build short night replies for X. Pick a tone and reply language, tap Quick 1, then copy or save lines you like. Free includes 50 lifetime generation credits (GM+GN shared).",
  ru: "Короткие ночные ответы для X. Выберите тон и язык ответа, нажмите Quick 1, копируйте или сохраняйте строки. Free: 50 кредитов генерации на всё время (GM+GN общие).",
  uk: "Короткі нічні відповіді для X. Оберіть тон і мову відповіді, натисніть Quick 1, копіюйте або зберігайте рядки. Free: 50 кредитів генерації на все життя (GM+GN спільні).",
  de: "Kurze Nachtantworten für X. Ton und Antwortsprache wählen, Quick 1 tippen, Zeilen kopieren oder speichern. Free: 50 Generierungs-Credits lebenslang (GM+GN gemeinsam).",
  fr: "Réponses GN courtes pour la nuit sur X. Choisissez le ton et la langue de réponse, appuyez sur Quick 1, copiez ou enregistrez. Free : 50 crédits de génération à vie (GM+GN partagés).",
  es: "Respuestas nocturnas cortas para X. Elige tono e idioma de respuesta, pulsa Quick 1 y copia o guarda líneas. Free: 50 créditos de generación de por vida (GM+GN compartidos).",
  pt: "Respostas noturnas curtas para X. Escolha tom e idioma da resposta, toque Quick 1 e copie ou salve linhas. Free: 50 créditos de geração vitalícios (GM+GN compartilhados).",
  it: "Risposte notturne brevi per X. Scegli tono e lingua della risposta, premi Quick 1, copia o salva le righe. Free: 50 crediti di generazione a vita (GM+GN condivisi).",
  nl: "Korte avondantwoorden voor X. Kies toon en antwoordtaal, tik Quick 1 en kopieer of bewaar regels. Free: 50 generatiecredits levenslang (GM+GN gedeeld).",
  tr: "X için kısa gece GN yanıtları. Ton ve yanıt dilini seçin, Quick 1'e dokunun, satırları kopyalayın veya kaydedin. Free: 50 ömür boyu üretim kredisi (GM+GN paylaşımlı).",
  pl: "Krótkie nocne odpowiedzi GN na X. Wybierz ton i język odpowiedzi, naciśnij Quick 1, kopiuj lub zapisuj linie. Free: 50 kredytów generacji na całe życie (GM+GN wspólne).",
  id: "Balasan malam singkat untuk X. Pilih nada dan bahasa balasan, ketuk Quick 1, salin atau simpan baris. Free: 50 kredit generasi seumur hidup (GM+GN bersama).",
  hi: "X के लिए छोटे रात के GN जवाब। टोन और जवाब की भाषा चुनें, Quick 1 दबाएँ, लाइनें कॉपी या सेव करें। Free: 50 जीवनभर जनरेशन क्रेडिट (GM+GN साझा)।",
  ja: "X向けの短い夜のGN返信。トーンと返信言語を選び、Quick 1で生成、コピーまたは保存。Free：生涯50生成クレジット（GM+GN共有）。",
  zh: "为 X 生成简短夜间 GN 回复。选择语气与回复语言，点 Quick 1，然后复制或保存。Free：终身 50 次生成额度（GM+GN 共享）。",
};

const GN_RIGHT_DESC = {
  en: "Build short night replies to someone else's post. Keep them calm, human, and easy to paste.",
  ru: "Короткие ночные ответы к чужому посту. Спокойные, человечные, готовые к вставке.",
  tr: "Başkasının gönderisine kısa gece yanıtları. Sakin, insani ve yapıştırmaya hazır.",
  es: "Respuestas nocturnas cortas al post de otro. Calmas, humanas y fáciles de pegar.",
  ja: "他人の投稿への短い夜の返信。落ち着いて、自然で、そのまま貼れる文に。",
  zh: "回复他人帖子的简短夜间回复。保持平静、自然、便于粘贴。",
};

let total = 0;
for (const file of fs.readdirSync(ROOT).filter((f) => f.endsWith(".json"))) {
  const code = file.replace(/\.json$/, "");
  const filePath = path.join(ROOT, file);
  const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
  let n = 0;
  const set = (k, v) => {
    if (v == null || data[k] === v) return;
    data[k] = v;
    n++;
  };
  if (data.gmRand1) set("gnRand1", data.gmRand1);
  if (data.gmRand10) set("gnRand10", data.gmRand10);
  if (data.gmRand70) set("gnRand70", data.gmRand70);
  if (data.gm_daily_label) set("gn_daily_label", data.gm_daily_label);
  if (GN_DESC[code]) set("gn_desc", GN_DESC[code]);
  if (GN_RIGHT_DESC[code]) set("gn_right_desc", GN_RIGHT_DESC[code]);
  if (code === "en") {
    set("gnControlsHelp", "Quick tone sets size + style + preset in one click. Quick 1 = one line; Batch 10 = ten lines.");
    set("gn_lang", "Reply language");
  }
  if (n) {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + "\n");
    total += n;
  }
}
console.log(`[i18n_gn_tab_patches] updated keys=${total}`);
