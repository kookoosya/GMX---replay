#!/usr/bin/env node
/**
 * Fill critical UI keys that were left in English across locales.
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = path.join(process.cwd(), "shared", "i18n", "locales");

const PATCHES = {
  ru: {
    h_what_2: "HTML:Безопасный copy-first flow в расширении: сгенерируй, скопируй, вставь в X вручную.",
    h_freepro_1: "HTML:<b>Free:</b> сбор и правка списков, лимит сохранённых строк и дневной лимит генерации.",
    h_freepro_2: "HTML:<b>Pro:</b> снимает лимиты, открывает премиум-контроли и усиленный best-pass.",
    gm_daily_label: "Дневная генерация GM (расширение)",
    gn_daily_label: "Дневная генерация GN (расширение)",
    gm_right_desc: "Короткие утренние ответы GM на чужой пост — естественно, по делу, удобно вставлять.",
    gn_right_desc: "Короткие ночные ответы GN на чужой пост — спокойно, по-человечески, удобно вставлять.",
    ref_k_legacy: "Перенос",
    ref_def_legacy: "старые рефералы, всё ещё учитываются в разблокировках.",
    ref_def_eligible: "max(активные, перенос).",
    ref_daily_limit_title: "Дневной лимит генерации (GM и GN отдельно)",
    ref_bonus_rule: "Бонус: +{per20} к дневной генерации за каждые 20 eligible (шагов: {chunks}).",
    t_prediction: "Прогноз",
    ref_desc: "Рефералы: делись ссылкой. Confirmed = подключился, Active = пользовался, Eligible = max(active, carry-over). Бонус: +10/день за 20 eligible.",
    pm_title: "Сигналы рынка",
    pm_filter_asset_label: "Актив",
    pm_filter_bias_label: "Смещение",
    pm_filter_conf_label: "Уверенность",
    pm_risk_title: "Риск",
    pm_disclaimer_title: "Дисклеймер",
    wp_apply_prediction: "Применить к Prediction",
    locked_pack: "Пак заблокирован. Нужен Pro или рефералы.",
    pack_applied: "Пак применён",
    r_li2c: "Active = подтверждённый реферал, который хотя бы раз пользовался продуктом.",
    r_li4: "Каждые <b>20 eligible</b> дают <b>+10</b> дневной генерации (Promoter 50+ = <b>+12</b> за 20).",
  },
  uk: {
    h_what_2: "HTML:Безпечний copy-first flow у розширенні: згенеруй, скопіюй, встав у X вручну.",
    h_freepro_1: "HTML:<b>Free:</b> збір і редагування списків, ліміт збережених рядків і денний ліміт генерації.",
    h_freepro_2: "HTML:<b>Pro:</b> знімає ліміти, відкриває преміум-контролі та сильніший best-pass.",
    gm_daily_label: "Денна генерація GM (розширення)",
    gn_daily_label: "Денна генерація GN (розширення)",
    gm_right_desc: "Короткі ранкові відповіді GM на чужий пост — природно, по суті, зручно вставляти.",
    gn_right_desc: "Короткі нічні відповіді GN на чужий пост — спокійно, по-людськи, зручно вставляти.",
    ref_k_legacy: "Перенос",
    t_prediction: "Прогноз",
    locked_pack: "Пак заблоковано. Потрібен Pro або реферали.",
    pack_applied: "Пак застосовано",
  },
  de: {
    gm_daily_label: "Tägliche GM-Generierung (Extension)",
    gn_daily_label: "Tägliche GN-Generierung (Extension)",
    gm_right_desc: "Kurze GM-Morgenantworten auf fremde Posts — natürlich, direkt, einfach einfügen.",
    gn_right_desc: "Kurze GN-Nachtantworten auf fremde Posts — ruhig, menschlich, einfach einfügen.",
    t_prediction: "Prognose-Markt",
    locked_pack: "Paket gesperrt. Pro oder Referrals nötig.",
    pack_applied: "Paket angewendet",
  },
  es: {
    gm_daily_label: "Generación diaria GM (extensión)",
    gn_daily_label: "Generación diaria GN (extensión)",
    gm_right_desc: "Respuestas GM cortas por la mañana — naturales, directas, fáciles de pegar.",
    gn_right_desc: "Respuestas GN cortas por la noche — calmadas, humanas, fáciles de pegar.",
    t_prediction: "Mercado de predicción",
    locked_pack: "Pack bloqueado. Necesitas Pro o referidos.",
    pack_applied: "Pack aplicado",
  },
  fr: {
    gm_daily_label: "Génération GM quotidienne (extension)",
    gn_daily_label: "Génération GN quotidienne (extension)",
    gm_right_desc: "Réponses GM matinales courtes — naturelles, directes, faciles à coller.",
    gn_right_desc: "Réponses GN nocturnes courtes — calmes, humaines, faciles à coller.",
    t_prediction: "Marché de prédiction",
    locked_pack: "Pack verrouillé. Pro ou parrainages requis.",
    pack_applied: "Pack appliqué",
  },
  pt: {
    gm_daily_label: "Geração diária GM (extensão)",
    gn_daily_label: "Geração diária GN (extensão)",
    gm_right_desc: "Respostas GM curtas de manhã — naturais, diretas, fáceis de colar.",
    gn_right_desc: "Respostas GN curtas à noite — calmas, humanas, fáceis de colar.",
    t_prediction: "Mercado de previsão",
    locked_pack: "Pack bloqueado. Pro ou indicações necessários.",
    pack_applied: "Pack aplicado",
  },
  it: {
    gm_daily_label: "Generazione GM giornaliera (estensione)",
    gn_daily_label: "Generazione GN giornaliera (estensione)",
    gm_right_desc: "Risposte GM mattutine brevi — naturali, dirette, facili da incollare.",
    gn_right_desc: "Risposte GN notturne brevi — calme, umane, facili da incollare.",
    t_prediction: "Mercato delle previsioni",
    locked_pack: "Pack bloccato. Serve Pro o referral.",
    pack_applied: "Pack applicato",
  },
  nl: {
    gm_daily_label: "Dagelijkse GM-generatie (extensie)",
    gn_daily_label: "Dagelijkse GN-generatie (extensie)",
    gm_right_desc: "Korte GM-ochtendantwoorden — natuurlijk, direct, makkelijk te plakken.",
    gn_right_desc: "Korte GN-nachtantwoorden — rustig, menselijk, makkelijk te plakken.",
    t_prediction: "Voorspellingsmarkt",
    locked_pack: "Pack vergrendeld. Pro of referrals nodig.",
    pack_applied: "Pack toegepast",
  },
  tr: {
    gm_daily_label: "Günlük GM üretimi (eklenti)",
    gn_daily_label: "Günlük GN üretimi (eklenti)",
    gm_right_desc: "Kısa sabah GM yanıtları — doğal, net, yapıştırmaya hazır.",
    gn_right_desc: "Kısa gece GN yanıtları — sakin, insani, yapıştırmaya hazır.",
    t_prediction: "Tahmin pazarı",
    locked_pack: "Paket kilitli. Pro veya referans gerekir.",
    pack_applied: "Paket uygulandı",
  },
  pl: {
    gm_daily_label: "Dzienna generacja GM (rozszerzenie)",
    gn_daily_label: "Dzienna generacja GN (rozszerzenie)",
    gm_right_desc: "Krótkie poranne odpowiedzi GM — naturalne, konkretne, łatwe do wklejenia.",
    gn_right_desc: "Krótkie nocne odpowiedzi GN — spokojne, ludzkie, łatwe do wklejenia.",
    t_prediction: "Rynek predykcji",
    locked_pack: "Pakiet zablokowany. Potrzebny Pro lub polecenia.",
    pack_applied: "Pakiet zastosowany",
  },
  id: {
    gm_daily_label: "Generasi GM harian (ekstensi)",
    gn_daily_label: "Generasi GN harian (ekstensi)",
    gm_right_desc: "Balasan GM pagi singkat — natural, langsung, mudah ditempel.",
    gn_right_desc: "Balasan GN malam singkat — tenang, manusiawi, mudah ditempel.",
    t_prediction: "Pasar prediksi",
    locked_pack: "Paket terkunci. Butuh Pro atau referral.",
    pack_applied: "Paket diterapkan",
  },
  hi: {
    gm_daily_label: "दैनिक GM जनरेशन (एक्सटेंशन)",
    gn_daily_label: "दैनिक GN जनरेशन (एक्सटेंशन)",
    gm_right_desc: "छोटे सुबह के GM जवाब — प्राकृतिक, सीधे, पेस्ट करने में आसान।",
    gn_right_desc: "छोटे रात के GN जवाब — शांत, मानवीय, पेस्ट करने में आसान।",
    t_prediction: "भविष्यवाणी बाज़ार",
    locked_pack: "पैक लॉक है। Pro या रेफरल चाहिए।",
    pack_applied: "पैक लागू",
  },
  ja: {
    gm_daily_label: "1日のGM生成（拡張機能）",
    gn_daily_label: "1日のGN生成（拡張機能）",
    gm_right_desc: "短い朝のGM返信 — 自然で、そのまま貼りやすい。",
    gn_right_desc: "短い夜のGN返信 — 落ち着いて、人間味があり、貼りやすい。",
    t_prediction: "予測マーケット",
    locked_pack: "パックはロック中。Proまたは紹介が必要です。",
    pack_applied: "パックを適用しました",
  },
  zh: {
    gm_daily_label: "每日 GM 生成（扩展）",
    gn_daily_label: "每日 GN 生成（扩展）",
    gm_right_desc: "简短的早晨 GM 回复 — 自然、直接、便于粘贴。",
    gn_right_desc: "简短的夜间 GN 回复 — 平静、人性化、便于粘贴。",
    t_prediction: "预测市场",
    locked_pack: "包已锁定。需要 Pro 或推荐。",
    pack_applied: "已应用包",
  },
};

const enExtra = {
  locked_pack: "Pack is locked. Upgrade to Pro or unlock via referrals.",
  pack_applied: "Applied pack",
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
total += mergeLocale("en", enExtra);
for (const [code, patch] of Object.entries(PATCHES)) {
  total += mergeLocale(code, patch);
}
console.log(`[i18n_critical_patches] updated keys=${total}`);
