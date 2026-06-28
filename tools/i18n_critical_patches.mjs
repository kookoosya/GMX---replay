#!/usr/bin/env node
/**
 * Fill critical UI keys that were left in English across locales.
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = path.join(process.cwd(), "shared", "i18n", "locales");

const PATCHES = {
  ru: {
    hero_video_title: "Ответы на X. Играй.",
    h_what_2: "HTML:Безопасный copy-first flow в расширении: сгенерируй, скопируй, вставь в X вручную.",
    h_freepro_1: "HTML:<b>Free:</b> сбор и правка списков, лимит сохранённых строк и дневной лимит генерации.",
    h_freepro_2: "HTML:<b>Pro:</b> снимает лимиты, открывает премиум-контроли и усиленный best-pass.",
    gm_daily_label: "Кредиты генерации (GM+GN общие)",
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
    h_badge_fast: "Швидко",
    h_badge_safe: "Без seed phrase",
    h_badge_onchain: "On-chain перевірка",
    h_badge_copy: "Лише копіювання",
    h_badge_arcade: "Браузерні ігри",
    h_what_2: "HTML:Безпечний copy-first flow у розширенні: згенеруй, скопіюй, встав у X вручну.",
    h_freepro_1: "HTML:<b>Free:</b> збір і редагування списків, ліміт збережених рядків і денний ліміт генерації.",
    h_freepro_2: "HTML:<b>Pro:</b> знімає ліміти, відкриває преміум-контролі та сильніший best-pass.",
    gm_daily_label: "Кредити генерації (GM+GN спільні)",
    gn_daily_label: "Денна генерація GN (розширення)",
    gm_right_desc: "Короткі ранкові відповіді GM на чужий пост — природно, по суті, зручно вставляти.",
    gn_right_desc: "Короткі нічні відповіді GN на чужий пост — спокійно, по-людськи, зручно вставляти.",
    ref_k_legacy: "Перенос",
    t_prediction: "Прогноз",
    locked_pack: "Пак заблоковано. Потрібен Pro або реферали.",
    pack_applied: "Пак застосовано",
  },
  de: {
    h_badge_fast: "Schnell",
    h_badge_safe: "Keine Seed Phrase",
    h_badge_onchain: "On-Chain-Verifizierung",
    h_badge_copy: "Nur kopieren",
    h_badge_arcade: "Browser-Spiele",
    gm_daily_label: "Generierungs-Credits (GM+GN gemeinsam)",
    gn_daily_label: "Tägliche GN-Generierung (Extension)",
    gm_right_desc: "Kurze GM-Morgenantworten auf fremde Posts — natürlich, direkt, einfach einfügen.",
    gn_right_desc: "Kurze GN-Nachtantworten auf fremde Posts — ruhig, menschlich, einfach einfügen.",
    t_prediction: "Prognose-Markt",
    locked_pack: "Paket gesperrt. Pro oder Referrals nötig.",
    pack_applied: "Paket angewendet",
  },
  es: {
    h_badge_fast: "Rápido",
    h_badge_safe: "Sin seed phrase",
    h_badge_onchain: "Verificación on-chain",
    h_badge_copy: "Solo copiar",
    h_badge_arcade: "Juegos en navegador",
    gm_daily_label: "Créditos de generación (GM+GN compartidos)",
    gn_daily_label: "Generación diaria GN (extensión)",
    gm_right_desc: "Respuestas GM cortas por la mañana — naturales, directas, fáciles de pegar.",
    gn_right_desc: "Respuestas GN cortas por la noche — calmadas, humanas, fáciles de pegar.",
    t_prediction: "Mercado de predicción",
    locked_pack: "Pack bloqueado. Necesitas Pro o referidos.",
    pack_applied: "Pack aplicado",
  },
  fr: {
    h_badge_fast: "Rapide",
    h_badge_safe: "Pas de seed phrase",
    h_badge_onchain: "Vérification on-chain",
    h_badge_copy: "Copie uniquement",
    h_badge_arcade: "Jeux navigateur",
    gm_daily_label: "Crédits de génération (GM+GN partagés)",
    gn_daily_label: "Génération GN quotidienne (extension)",
    gm_right_desc: "Réponses GM matinales courtes — naturelles, directes, faciles à coller.",
    gn_right_desc: "Réponses GN nocturnes courtes — calmes, humaines, faciles à coller.",
    t_prediction: "Marché de prédiction",
    locked_pack: "Pack verrouillé. Pro ou parrainages requis.",
    pack_applied: "Pack appliqué",
  },
  pt: {
    h_badge_fast: "Rápido",
    h_badge_safe: "Sem seed phrase",
    h_badge_onchain: "Verificação on-chain",
    h_badge_copy: "Só copiar",
    h_badge_arcade: "Jogos no navegador",
    gm_daily_label: "Créditos de geração (GM+GN compartilhados)",
    gn_daily_label: "Geração diária GN (extensão)",
    gm_right_desc: "Respostas GM curtas de manhã — naturais, diretas, fáceis de colar.",
    gn_right_desc: "Respostas GN curtas à noite — calmas, humanas, fáceis de colar.",
    t_prediction: "Mercado de previsão",
    locked_pack: "Pack bloqueado. Pro ou indicações necessários.",
    pack_applied: "Pack aplicado",
  },
  it: {
    h_badge_fast: "Veloce",
    h_badge_safe: "Nessuna seed phrase",
    h_badge_onchain: "Verifica on-chain",
    h_badge_copy: "Solo copia",
    h_badge_arcade: "Giochi browser",
    gm_daily_label: "Crediti di generazione (GM+GN condivisi)",
    gn_daily_label: "Generazione GN giornaliera (estensione)",
    gm_right_desc: "Risposte GM mattutine brevi — naturali, dirette, facili da incollare.",
    gn_right_desc: "Risposte GN notturne brevi — calme, umane, facili da incollare.",
    t_prediction: "Mercato delle previsioni",
    locked_pack: "Pack bloccato. Serve Pro o referral.",
    pack_applied: "Pack applicato",
  },
  nl: {
    h_badge_fast: "Snel",
    h_badge_safe: "Geen seed phrase",
    h_badge_onchain: "On-chain verificatie",
    h_badge_copy: "Alleen kopiëren",
    h_badge_arcade: "Browsergames",
    gm_daily_label: "Generatiecredits (GM+GN gedeeld)",
    gn_daily_label: "Dagelijkse GN-generatie (extensie)",
    gm_right_desc: "Korte GM-ochtendantwoorden — natuurlijk, direct, makkelijk te plakken.",
    gn_right_desc: "Korte GN-nachtantwoorden — rustig, menselijk, makkelijk te plakken.",
    t_prediction: "Voorspellingsmarkt",
    locked_pack: "Pack vergrendeld. Pro of referrals nodig.",
    pack_applied: "Pack toegepast",
  },
  tr: {
    h_badge_fast: "Hızlı",
    h_badge_safe: "Seed phrase yok",
    h_badge_onchain: "Zincir üstü doğrulama",
    h_badge_copy: "Yalnızca kopyala",
    h_badge_arcade: "Tarayıcı oyunları",
    gm_daily_label: "Üretim kredileri (GM+GN paylaşımlı)",
    gn_daily_label: "Günlük GN üretimi (eklenti)",
    gm_right_desc: "Kısa sabah GM yanıtları — doğal, net, yapıştırmaya hazır.",
    gn_right_desc: "Kısa gece GN yanıtları — sakin, insani, yapıştırmaya hazır.",
    t_prediction: "Tahmin pazarı",
    locked_pack: "Paket kilitli. Pro veya referans gerekir.",
    pack_applied: "Paket uygulandı",
  },
  pl: {
    h_badge_fast: "Szybko",
    h_badge_safe: "Bez seed phrase",
    h_badge_onchain: "Weryfikacja on-chain",
    h_badge_copy: "Tylko kopiowanie",
    h_badge_arcade: "Gry w przeglądarce",
    gm_daily_label: "Kredyty generacji (GM+GN wspólne)",
    gn_daily_label: "Dzienna generacja GN (rozszerzenie)",
    gm_right_desc: "Krótkie poranne odpowiedzi GM — naturalne, konkretne, łatwe do wklejenia.",
    gn_right_desc: "Krótkie nocne odpowiedzi GN — spokojne, ludzkie, łatwe do wklejenia.",
    t_prediction: "Rynek predykcji",
    locked_pack: "Pakiet zablokowany. Potrzebny Pro lub polecenia.",
    pack_applied: "Pakiet zastosowany",
  },
  id: {
    h_badge_fast: "Cepat",
    h_badge_safe: "Tanpa seed phrase",
    h_badge_onchain: "Verifikasi on-chain",
    h_badge_copy: "Hanya salin",
    h_badge_arcade: "Game browser",
    gm_daily_label: "Kredit generasi (GM+GN bersama)",
    gn_daily_label: "Generasi GN harian (ekstensi)",
    gm_right_desc: "Balasan GM pagi singkat — natural, langsung, mudah ditempel.",
    gn_right_desc: "Balasan GN malam singkat — tenang, manusiawi, mudah ditempel.",
    t_prediction: "Pasar prediksi",
    locked_pack: "Paket terkunci. Butuh Pro atau referral.",
    pack_applied: "Paket diterapkan",
  },
  hi: {
    h_badge_fast: "तेज़",
    h_badge_safe: "कोई seed phrase नहीं",
    h_badge_onchain: "On-chain सत्यापन",
    h_badge_copy: "केवल कॉपी",
    h_badge_arcade: "ब्राउज़र गेम",
    gm_daily_label: "जनरेशन क्रेडिट (GM+GN साझा)",
    gn_daily_label: "दैनिक GN जनरेशन (एक्सटेंशन)",
    gm_right_desc: "छोटे सुबह के GM जवाब — प्राकृतिक, सीधे, पेस्ट करने में आसान।",
    gn_right_desc: "छोटे रात के GN जवाब — शांत, मानवीय, पेस्ट करने में आसान।",
    t_prediction: "भविष्यवाणी बाज़ार",
    locked_pack: "पैक लॉक है। Pro या रेफरल चाहिए।",
    pack_applied: "पैक लागू",
  },
  ja: {
    h_badge_fast: "高速",
    h_badge_safe: "シードフレーズ不要",
    h_badge_onchain: "オンチェーン検証",
    h_badge_copy: "コピーのみ",
    h_badge_arcade: "ブラウザゲーム",
    gm_daily_label: "生成クレジット（GM+GN共有）",
    gn_daily_label: "1日のGN生成（拡張機能）",
    gm_right_desc: "短い朝のGM返信 — 自然で、そのまま貼りやすい。",
    gn_right_desc: "短い夜のGN返信 — 落ち着いて、人間味があり、貼りやすい。",
    t_prediction: "予測マーケット",
    locked_pack: "パックはロック中。Proまたは紹介が必要です。",
    pack_applied: "パックを適用しました",
  },
  zh: {
    h_badge_fast: "快速",
    h_badge_safe: "无需助记词",
    h_badge_onchain: "链上验证",
    h_badge_copy: "仅复制",
    h_badge_arcade: "浏览器游戏",
    gm_daily_label: "生成额度（GM+GN 共享）",
    gn_daily_label: "每日 GN 生成（扩展）",
    gm_right_desc: "简短的早晨 GM 回复 — 自然、直接、便于粘贴。",
    gn_right_desc: "简短的夜间 GN 回复 — 平静、人性化、便于粘贴。",
    t_prediction: "预测市场",
    locked_pack: "包已锁定。需要 Pro 或推荐。",
    pack_applied: "已应用包",
  },
};

const GM_TAB_BUTTON_LABELS = {
  gmRand1: "Quick 1",
  gmRand10: "Batch 10",
  gmRand70: "Batch 10",
};

for (const code of Object.keys(PATCHES)) {
  Object.assign(PATCHES[code], GM_TAB_BUTTON_LABELS);
}

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
