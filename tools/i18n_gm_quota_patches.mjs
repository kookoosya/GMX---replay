#!/usr/bin/env node
/**
 * GM tab: align quota copy and reply-language labels across all locales.
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = path.join(process.cwd(), "shared", "i18n", "locales");

const CREDITS_USED = {
  en: {
    gm_lang: "Reply language",
    gn_pro_1: "<b>Unlimited</b> saved lines and generation credits.",
    gen_daily_limit_reached:
      "Free generation credits used up. Upgrade to Pro for unlimited generation.",
    limit_modal_daily_a:
      "You used all free generation credits. Upgrade to Pro for unlimited generation.",
    limit_modal_daily_b:
      "Free generation credits used up. Pro removes limits and unlocks everything.",
    gm_desc:
      "Build short morning replies for X. Pick a tone and reply language, tap Quick 1, then copy or save lines you like. Free includes 50 lifetime generation credits (GM+GN shared).",
  },
  ru: {
    gm_lang: "Язык ответа",
    gm_pro_1: "<b>Безлимит</b> сохранённых строк и кредитов генерации.",
    gn_pro_1: "<b>Безлимит</b> сохранённых строк и кредитов генерации.",
    gen_daily_limit_reached:
      "Бесплатные кредиты генерации закончились. Перейдите на Pro для безлимитной генерации.",
    limit_modal_daily_a:
      "Вы использовали все бесплатные кредиты генерации. Перейдите на Pro для безлимитной генерации.",
    limit_modal_daily_b:
      "Бесплатные кредиты генерации закончились. Pro снимает лимиты и открывает всё.",
    gm_desc:
      "Короткие утренние ответы для X. Выберите тон и язык ответа, нажмите Quick 1, копируйте или сохраняйте строки. Free: 50 кредитов генерации на всё время (GM+GN общие).",
  },
  uk: {
    gm_lang: "Мова відповіді",
    gm_pro_1: "<b>Безліміт</b> збережених рядків і кредитів генерації.",
    gn_pro_1: "<b>Безліміт</b> збережених рядків і кредитів генерації.",
    gen_daily_limit_reached:
      "Безкоштовні кредити генерації вичерпано. Перейдіть на Pro для безлімітної генерації.",
    limit_modal_daily_a:
      "Ви використали всі безкоштовні кредити генерації. Перейдіть на Pro для безлімітної генерації.",
    limit_modal_daily_b:
      "Безкоштовні кредити генерації вичерпано. Pro знімає ліміти й відкриває все.",
    gm_desc:
      "Короткі ранкові відповіді для X. Оберіть тон і мову відповіді, натисніть Quick 1, копіюйте або зберігайте рядки. Free: 50 кредитів генерації на все життя (GM+GN спільні).",
  },
  de: {
    gm_lang: "Antwortsprache",
    gm_pro_1: "<b>Unbegrenzt</b> gespeicherte Zeilen und Generierungs-Credits.",
    gn_pro_1: "<b>Unbegrenzt</b> gespeicherte Zeilen und Generierungs-Credits.",
    gen_daily_limit_reached:
      "Kostenlose Generierungs-Credits aufgebraucht. Upgrade auf Pro für unbegrenzte Generierung.",
    limit_modal_daily_a:
      "Alle kostenlosen Generierungs-Credits verbraucht. Upgrade auf Pro für unbegrenzte Generierung.",
    limit_modal_daily_b:
      "Kostenlose Generierungs-Credits aufgebraucht. Pro hebt Limits auf und schaltet alles frei.",
    gm_desc:
      "Kurze Morgenantworten für X. Ton und Antwortsprache wählen, Quick 1 tippen, Zeilen kopieren oder speichern. Free: 50 Generierungs-Credits lebenslang (GM+GN gemeinsam).",
  },
  es: {
    gm_lang: "Idioma de respuesta",
    gm_pro_1: "<b>Ilimitadas</b> líneas guardadas y créditos de generación.",
    gn_pro_1: "<b>Ilimitadas</b> líneas guardadas y créditos de generación.",
    gen_daily_limit_reached:
      "Créditos de generación gratis agotados. Pasa a Pro para generación ilimitada.",
    limit_modal_daily_a:
      "Usaste todos los créditos de generación gratis. Pasa a Pro para generación ilimitada.",
    limit_modal_daily_b:
      "Créditos de generación gratis agotados. Pro quita límites y desbloquea todo.",
    gm_desc:
      "Respuestas GM cortas para X. Elige tono e idioma de respuesta, pulsa Quick 1 y copia o guarda líneas. Free: 50 créditos de generación de por vida (GM+GN compartidos).",
  },
  fr: {
    gm_lang: "Langue de réponse",
    gm_pro_1: "<b>Illimitées</b> lignes enregistrées et crédits de génération.",
    gn_pro_1: "<b>Illimitées</b> lignes enregistrées et crédits de génération.",
    gen_daily_limit_reached:
      "Crédits de génération gratuits épuisés. Passez à Pro pour une génération illimitée.",
    limit_modal_daily_a:
      "Vous avez utilisé tous les crédits de génération gratuits. Passez à Pro pour une génération illimitée.",
    limit_modal_daily_b:
      "Crédits de génération gratuits épuisés. Pro supprime les limites et débloque tout.",
    gm_desc:
      "Réponses GM courtes pour X. Choisissez le ton et la langue de réponse, appuyez sur Quick 1, copiez ou enregistrez. Free : 50 crédits de génération à vie (GM+GN partagés).",
  },
  pt: {
    gm_lang: "Idioma da resposta",
    gm_pro_1: "<b>Ilimitadas</b> linhas salvas e créditos de geração.",
    gn_pro_1: "<b>Ilimitadas</b> linhas salvas e créditos de geração.",
    gen_daily_limit_reached:
      "Créditos de geração grátis esgotados. Faça upgrade para Pro e gere sem limites.",
    limit_modal_daily_a:
      "Você usou todos os créditos de geração grátis. Faça upgrade para Pro e gere sem limites.",
    limit_modal_daily_b:
      "Créditos de geração grátis esgotados. Pro remove limites e desbloqueia tudo.",
    gm_desc:
      "Respostas GM curtas para X. Escolha tom e idioma da resposta, toque Quick 1 e copie ou salve linhas. Free: 50 créditos de geração vitalícios (GM+GN compartilhados).",
  },
  it: {
    gm_lang: "Lingua della risposta",
    gm_pro_1: "<b>Illimitate</b> righe salvate e crediti di generazione.",
    gn_pro_1: "<b>Illimitate</b> righe salvate e crediti di generazione.",
    gen_daily_limit_reached:
      "Crediti di generazione gratuiti esauriti. Passa a Pro per generazione illimitata.",
    limit_modal_daily_a:
      "Hai usato tutti i crediti di generazione gratuiti. Passa a Pro per generazione illimitata.",
    limit_modal_daily_b:
      "Crediti di generazione gratuiti esauriti. Pro rimuove i limiti e sblocca tutto.",
    gm_desc:
      "Risposte GM brevi per X. Scegli tono e lingua della risposta, premi Quick 1, copia o salva le righe. Free: 50 crediti di generazione a vita (GM+GN condivisi).",
  },
  nl: {
    gm_lang: "Antwoordtaal",
    gm_pro_1: "<b>Onbeperkt</b> opgeslagen regels en generatiecredits.",
    gn_pro_1: "<b>Onbeperkt</b> opgeslagen regels en generatiecredits.",
    gen_daily_limit_reached:
      "Gratis generatiecredits opgebruikt. Upgrade naar Pro voor onbeperkte generatie.",
    limit_modal_daily_a:
      "Je hebt alle gratis generatiecredits gebruikt. Upgrade naar Pro voor onbeperkte generatie.",
    limit_modal_daily_b:
      "Gratis generatiecredits opgebruikt. Pro verwijdert limieten en ontgrendelt alles.",
    gm_desc:
      "Korte GM-ochtendantwoorden voor X. Kies toon en antwoordtaal, tik Quick 1 en kopieer of bewaar regels. Free: 50 generatiecredits levenslang (GM+GN gedeeld).",
  },
  tr: {
    gm_lang: "Yanıt dili",
    gm_pro_1: "<b>Sınırsız</b> kayıtlı satır ve üretim kredisi.",
    gn_pro_1: "<b>Sınırsız</b> kayıtlı satır ve üretim kredisi.",
    gen_daily_limit_reached:
      "Ücretsiz üretim kredileri bitti. Sınırsız üretim için Pro'ya geçin.",
    limit_modal_daily_a:
      "Tüm ücretsiz üretim kredilerini kullandınız. Sınırsız üretim için Pro'ya geçin.",
    limit_modal_daily_b:
      "Ücretsiz üretim kredileri bitti. Pro limitleri kaldırır ve her şeyi açar.",
    gm_desc:
      "X için kısa sabah GM yanıtları. Ton ve yanıt dilini seçin, Quick 1'e dokunun, satırları kopyalayın veya kaydedin. Free: 50 ömür boyu üretim kredisi (GM+GN paylaşımlı).",
  },
  pl: {
    gm_lang: "Język odpowiedzi",
    gm_pro_1: "<b>Nielimitowane</b> zapisane linie i kredyty generacji.",
    gn_pro_1: "<b>Nielimitowane</b> zapisane linie i kredyty generacji.",
    gen_daily_limit_reached:
      "Darmowe kredyty generacji wyczerpane. Przejdź na Pro, aby generować bez limitu.",
    limit_modal_daily_a:
      "Wykorzystałeś wszystkie darmowe kredyty generacji. Przejdź na Pro, aby generować bez limitu.",
    limit_modal_daily_b:
      "Darmowe kredyty generacji wyczerpane. Pro usuwa limity i odblokowuje wszystko.",
    gm_desc:
      "Krótkie poranne odpowiedzi GM na X. Wybierz ton i język odpowiedzi, naciśnij Quick 1, kopiuj lub zapisuj linie. Free: 50 kredytów generacji na całe życie (GM+GN wspólne).",
  },
  id: {
    gm_lang: "Bahasa balasan",
    gm_pro_1: "<b>Tak terbatas</b> baris tersimpan dan kredit generasi.",
    gn_pro_1: "<b>Tak terbatas</b> baris tersimpan dan kredit generasi.",
    gen_daily_limit_reached:
      "Kredit generasi gratis habis. Upgrade ke Pro untuk generasi tanpa batas.",
    limit_modal_daily_a:
      "Semua kredit generasi gratis terpakai. Upgrade ke Pro untuk generasi tanpa batas.",
    limit_modal_daily_b:
      "Kredit generasi gratis habis. Pro menghapus batas dan membuka semuanya.",
    gm_desc:
      "Balasan GM pagi singkat untuk X. Pilih nada dan bahasa balasan, ketuk Quick 1, salin atau simpan baris. Free: 50 kredit generasi seumur hidup (GM+GN bersama).",
  },
  hi: {
    gm_lang: "जवाब की भाषा",
    gm_pro_1: "<b>असीमित</b> सेव की गई लाइनें और जनरेशन क्रेडिट।",
    gn_pro_1: "<b>असीमित</b> सेव की गई लाइनें और जनरेशन क्रेडिट।",
    gen_daily_limit_reached:
      "मुफ़्त जनरेशन क्रेडिट खत्म। असीमित जनरेशन के लिए Pro पर जाएँ।",
    limit_modal_daily_a:
      "सभी मुफ़्त जनरेशन क्रेडिट इस्तेमाल हो गए। असीमित जनरेशन के लिए Pro पर जाएँ।",
    limit_modal_daily_b:
      "मुफ़्त जनरेशन क्रेडिट खत्म। Pro सीमाएँ हटाता है और सब कुछ खोलता है।",
    gm_desc:
      "X के लिए छोटे सुबह के GM जवाब। टोन और जवाब की भाषा चुनें, Quick 1 दबाएँ, लाइनें कॉपी या सेव करें। Free: 50 जीवनभर जनरेशन क्रेडिट (GM+GN साझा)।",
  },
  ja: {
    gm_lang: "返信の言語",
    gm_pro_1: "<b>無制限</b>の保存行と生成クレジット。",
    gn_pro_1: "<b>無制限</b>の保存行と生成クレジット。",
    gen_daily_limit_reached:
      "無料の生成クレジットを使い切りました。無制限生成は Pro へアップグレードしてください。",
    limit_modal_daily_a:
      "無料の生成クレジットをすべて使いました。無制限生成は Pro へアップグレードしてください。",
    limit_modal_daily_b:
      "無料の生成クレジットを使い切りました。Pro で制限解除と全機能解放。",
    gm_desc:
      "X向けの短い朝のGM返信。トーンと返信言語を選び、Quick 1で生成、コピーまたは保存。Free：生涯50生成クレジット（GM+GN共有）。",
  },
  zh: {
    gm_lang: "回复语言",
    gm_pro_1: "<b>无限</b>保存行与生成额度。",
    gn_pro_1: "<b>无限</b>保存行与生成额度。",
    gen_daily_limit_reached:
      "免费生成额度已用完。升级 Pro 可无限生成。",
    limit_modal_daily_a:
      "你已用完所有免费生成额度。升级 Pro 可无限生成。",
    limit_modal_daily_b:
      "免费生成额度已用完。Pro 解除限制并解锁全部功能。",
    gm_desc:
      "为 X 生成简短早晨 GM 回复。选择语气与回复语言，点 Quick 1，然后复制或保存。Free：终身 50 次生成额度（GM+GN 共享）。",
  },
};

function mergeLocale(code, patch) {
  const file = path.join(ROOT, `${code}.json`);
  const data = JSON.parse(fs.readFileSync(file, "utf8"));
  let n = 0;
  for (const [k, v] of Object.entries(patch)) {
    if (data[k] === v) continue;
    data[k] = v;
    n++;
  }
  fs.writeFileSync(file, JSON.stringify(data, null, 2) + "\n");
  return n;
}

let total = 0;
for (const [code, patch] of Object.entries(CREDITS_USED)) {
  total += mergeLocale(code, patch);
}
console.log(`[i18n_gm_quota_patches] updated keys=${total}`);
