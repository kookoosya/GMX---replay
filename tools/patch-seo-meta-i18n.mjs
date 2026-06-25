#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const localesDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "shared", "i18n", "locales");

const PATCH = {
  de: {
    seo_home_title: "GMXReply · GM & GN, die nach dir klingen",
    seo_home_description: "Natürliche GM/GN-Replies. Banks bauen, kopieren, auf X einfügen. Sicher, schnell, kein Seed Phrase. Themes, Wallpapers und Arcade.",
    seo_wallet_title: "GMXReply · Upgrade Pro",
    seo_wallet_description: "Unbegrenzte Zeilen, alle Themes, jedes Arcade-Spiel und Pro-Controls. Zahle mit SOL, USDC oder USDT — on-chain verifiziert.",
    seo_arcade_title: "GMXReply Arcade · 40+ Browsergames",
    seo_arcade_description: "Spiele Agar.io, Geometry Dash, Smash Karts und mehr im Browser. Free-Vorschau oder Pro für den vollen Katalog.",
  },
  fr: {
    seo_home_title: "GMXReply · GM & GN qui vous ressemblent",
    seo_home_description: "Réponses GM/GN naturelles. Créez des banks, copiez, collez sur X. Sûr, rapide, sans seed phrase. Thèmes, fonds et Arcade.",
    seo_wallet_title: "GMXReply · Upgrade Pro",
    seo_wallet_description: "Lignes illimitées, tous les thèmes, tous les jeux Arcade et contrôles Pro. Payez en SOL, USDC ou USDT — vérifié on-chain.",
    seo_arcade_title: "GMXReply Arcade · 40+ jeux navigateur",
    seo_arcade_description: "Jouez à Agar.io, Geometry Dash, Smash Karts et plus. Aperçu free ou Pro pour tout le catalogue.",
  },
  es: {
    seo_home_title: "GMXReply · GM y GN que suenan como tú",
    seo_home_description: "Respuestas GM/GN naturales. Crea bancos, copia y pega en X. Seguro, rápido, sin seed phrase. Temas, fondos y Arcade.",
    seo_wallet_title: "GMXReply · Upgrade Pro",
    seo_wallet_description: "Líneas ilimitadas, todos los temas, todos los juegos Arcade y controles Pro. Paga con SOL, USDC o USDT — verificado on-chain.",
    seo_arcade_title: "GMXReply Arcade · 40+ juegos en el navegador",
    seo_arcade_description: "Juega Agar.io, Geometry Dash, Smash Karts y más. Vista previa free o Pro para el catálogo completo.",
  },
  pt: {
    seo_home_title: "GMXReply · GM e GN com a sua cara",
    seo_home_description: "Respostas GM/GN naturais. Crie bancos, copie e cole no X. Seguro, rápido, sem seed phrase. Temas, fundos e Arcade.",
    seo_wallet_title: "GMXReply · Upgrade Pro",
    seo_wallet_description: "Linhas ilimitadas, todos os temas, todos os jogos Arcade e controlos Pro. Pague com SOL, USDC ou USDT — verificado on-chain.",
    seo_arcade_title: "GMXReply Arcade · 40+ jogos no browser",
    seo_arcade_description: "Jogue Agar.io, Geometry Dash, Smash Karts e mais. Pré-visualização free ou Pro para o catálogo completo.",
  },
  it: {
    seo_home_title: "GMXReply · GM e GN che suonano come te",
    seo_home_description: "Risposte GM/GN naturali. Crea banche, copia e incolla su X. Sicuro, veloce, senza seed phrase. Temi, sfondi e Arcade.",
    seo_wallet_title: "GMXReply · Upgrade Pro",
    seo_wallet_description: "Righe illimitate, tutti i temi, ogni gioco Arcade e controlli Pro. Paga con SOL, USDC o USDT — verificato on-chain.",
    seo_arcade_title: "GMXReply Arcade · 40+ giochi browser",
    seo_arcade_description: "Gioca ad Agar.io, Geometry Dash, Smash Karts e altro. Anteprima free o Pro per tutto il catalogo.",
  },
  nl: {
    seo_home_title: "GMXReply · GM & GN die bij je passen",
    seo_home_description: "Natuurlijke GM/GN-replies. Bouw banks, kopieer, plak op X. Veilig, snel, geen seed phrase. Themes, wallpapers en Arcade.",
    seo_wallet_title: "GMXReply · Upgrade Pro",
    seo_wallet_description: "Onbeperkte regels, alle themes, elke Arcade-game en Pro-controls. Betaal met SOL, USDC of USDT — on-chain geverifieerd.",
    seo_arcade_title: "GMXReply Arcade · 40+ browsergames",
    seo_arcade_description: "Speel Agar.io, Geometry Dash, Smash Karts en meer. Free preview of Pro voor de volledige catalogus.",
  },
  pl: {
    seo_home_title: "GMXReply · GM i GN brzmiące jak Ty",
    seo_home_description: "Naturalne odpowiedzi GM/GN. Twórz banki, kopiuj, wklejaj na X. Bezpiecznie, szybko, bez seed phrase. Motywy, tapety i Arcade.",
    seo_wallet_title: "GMXReply · Upgrade Pro",
    seo_wallet_description: "Nielimitowane linie, wszystkie motywy, każda gra Arcade i kontrolki Pro. Płać SOL, USDC lub USDT — weryfikacja on-chain.",
    seo_arcade_title: "GMXReply Arcade · 40+ gier w przeglądarce",
    seo_arcade_description: "Graj w Agar.io, Geometry Dash, Smash Karts i więcej. Podgląd free lub Pro dla pełnego katalogu.",
  },
  tr: {
    seo_home_title: "GMXReply · Sana benzeyen GM ve GN",
    seo_home_description: "Doğal GM/GN yanıtları. Bank oluştur, kopyala, X'e yapıştır. Güvenli, hızlı, seed phrase yok. Temalar, duvar kağıtları ve Arcade.",
    seo_wallet_title: "GMXReply · Upgrade Pro",
    seo_wallet_description: "Sınırsız satır, tüm temalar, her Arcade oyunu ve Pro kontrolleri. SOL, USDC veya USDT ile öde — on-chain doğrulama.",
    seo_arcade_title: "GMXReply Arcade · 40+ tarayıcı oyunu",
    seo_arcade_description: "Agar.io, Geometry Dash, Smash Karts ve daha fazlası. Free önizleme veya Pro ile tam katalog.",
  },
  id: {
    seo_home_title: "GMXReply · GM & GN seperti gaya kamu",
    seo_home_description: "Balasan GM/GN natural. Buat bank, salin, tempel di X. Aman, cepat, tanpa seed phrase. Tema, wallpaper, dan Arcade.",
    seo_wallet_title: "GMXReply · Upgrade Pro",
    seo_wallet_description: "Baris tak terbatas, semua tema, semua game Arcade, dan kontrol Pro. Bayar dengan SOL, USDC, atau USDT — terverifikasi on-chain.",
    seo_arcade_title: "GMXReply Arcade · 40+ game browser",
    seo_arcade_description: "Main Agar.io, Geometry Dash, Smash Karts, dan lainnya. Pratinjau free atau Pro untuk katalog penuh.",
  },
  ru: {
    seo_home_title: "GMXReply · GM и GN в вашем стиле",
    seo_home_description: "Живые ответы GM/GN. Собирайте банки, копируйте, вставляйте в X. Безопасно, быстро, без seed phrase. Темы, обои и Arcade.",
    seo_wallet_title: "GMXReply · Upgrade Pro",
    seo_wallet_description: "Безлимитные строки, все темы, все игры Arcade и Pro-контроли. Оплата SOL, USDC или USDT — проверка on-chain.",
    seo_arcade_title: "GMXReply Arcade · 40+ браузерных игр",
    seo_arcade_description: "Играйте в Agar.io, Geometry Dash, Smash Karts и другие. Free-превью или Pro для полного каталога.",
  },
  uk: {
    seo_home_title: "GMXReply · GM і GN у вашому стилі",
    seo_home_description: "Живі відповіді GM/GN. Збирайте банки, копіюйте, вставляйте в X. Безпечно, швидко, без seed phrase. Теми, шпалери й Arcade.",
    seo_wallet_title: "GMXReply · Upgrade Pro",
    seo_wallet_description: "Безлімітні рядки, усі теми, усі ігри Arcade та Pro-контролі. Оплата SOL, USDC або USDT — перевірка on-chain.",
    seo_arcade_title: "GMXReply Arcade · 40+ браузерних ігор",
    seo_arcade_description: "Грайте в Agar.io, Geometry Dash, Smash Karts та інші. Free-прев’ю або Pro для повного каталогу.",
  },
  hi: {
    seo_home_title: "GMXReply · आप जैसे GM और GN",
    seo_home_description: "Natural GM/GN replies. Banks बनाएं, copy करें, X पर paste करें। Safe, fast, no seed phrase. Themes, wallpapers और Arcade।",
    seo_wallet_title: "GMXReply · Upgrade Pro",
    seo_wallet_description: "Unlimited lines, सभी themes, हर Arcade game और Pro controls। SOL, USDC या USDT से pay — on-chain verify।",
    seo_arcade_title: "GMXReply Arcade · 40+ ब्राउज़र गेम",
    seo_arcade_description: "Agar.io, Geometry Dash, Smash Karts और अन्य खेलें। Free preview या Pro से पूरा catalog।",
  },
  ja: {
    seo_home_title: "GMXReply · あなたらしいGM/GN",
    seo_home_description: "自然なGM/GN返信。バンク作成、コピー、Xにペースト。安全・高速・シードフレーズ不要。テーマ、壁紙、Arcade。",
    seo_wallet_title: "GMXReply · Upgrade Pro",
    seo_wallet_description: "無制限行、全テーマ、全Arcadeゲーム、Proコントロール。SOL/USDC/USDT支払い—オンチェーン検証。",
    seo_arcade_title: "GMXReply Arcade · 40以上のブラウザゲーム",
    seo_arcade_description: "Agar.io、Geometry Dash、Smash Kartsなど。無料プレビューまたはProで全カタログ。",
  },
  zh: {
    seo_home_title: "GMXReply · 像你风格的 GM 和 GN",
    seo_home_description: "自然的 GM/GN 回复。建立 banks、复制、粘贴到 X。安全快速，无需 seed phrase。主题、壁纸与 Arcade。",
    seo_wallet_title: "GMXReply · Upgrade Pro",
    seo_wallet_description: "无限行数、全部主题、所有 Arcade 游戏与 Pro 控制。SOL/USDC/USDT 支付—链上验证。",
    seo_arcade_title: "GMXReply Arcade · 40+ 浏览器游戏",
    seo_arcade_description: "玩 Agar.io、Geometry Dash、Smash Karts 等。免费预览或 Pro 解锁完整目录。",
  },
};

const en = JSON.parse(fs.readFileSync(path.join(localesDir, "en.json"), "utf8"));
const enKeys = Object.keys(en).filter((k) => k.startsWith("seo_"));

for (const lang of fs.readdirSync(localesDir).map((f) => f.replace(/\.json$/, "")).filter((c) => c !== "en")) {
  const file = path.join(localesDir, `${lang}.json`);
  const j = JSON.parse(fs.readFileSync(file, "utf8"));
  for (const k of enKeys) {
    if (j[k] === undefined && en[k] !== undefined) j[k] = en[k];
  }
  if (PATCH[lang]) Object.assign(j, PATCH[lang]);
  fs.writeFileSync(file, `${JSON.stringify(j, null, 2)}\n`);
}
console.log("patch-seo-meta-i18n: ok");
