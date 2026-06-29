#!/usr/bin/env node
/**
 * Wallet / Pro tab: align generation-credit copy (no daily/70 promises).
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = path.join(process.cwd(), "shared", "i18n", "locales");

const PLAN_CMP_FEAT_DAILY = {
  en: "Generation credits",
  ru: "Кредиты генерации",
  uk: "Кредити генерації",
  de: "Generierungs-Credits",
  fr: "Crédits de génération",
  es: "Créditos de generación",
  pt: "Créditos de geração",
  it: "Crediti di generazione",
  nl: "Generatiecredits",
  tr: "Üretim kredileri",
  pl: "Kredyty generacji",
  id: "Kredit generasi",
  hi: "जनरेशन क्रेडिट",
  ja: "生成クレジット",
  zh: "生成额度",
};

const WALLET_DESC = {
  en: "Upgrade Pro: unlimited generation credits, all themes/styles/extension skins & wallpapers, and all Arcade games. Pay on Solana with SOL, USDC, or USDT — verified on-chain.",
  ru: "Апгрейд Pro: безлимитные кредиты генерации, вся косметика (темы, стили, скины и обои расширения) и все игры Arcade. Оплата в Solana: SOL / USDC / USDT. Проверка on-chain.",
  uk: "Апгрейд Pro: безлімітні кредити генерації, уся косметика (теми, стилі, скіни та шпалери розширення) і всі ігри Arcade. Оплата в Solana: SOL / USDC / USDT. Перевірка on-chain.",
  de: "Pro-Upgrade: unbegrenzte Generierungs-Credits, alle Kosmetik (Themes, Styles, Extension-Skins & Wallpapers) und alle Arcade-Spiele. Zahlung auf Solana mit SOL / USDC / USDT — on-chain verifiziert.",
  fr: "Upgrade Pro : crédits de génération illimités, tous les cosmétiques (thèmes, styles, skins & wallpapers d’extension) et tous les jeux Arcade. Paiement sur Solana en SOL / USDC / USDT — vérifié on-chain.",
  es: "Upgrade Pro: créditos de generación ilimitados, todos los cosméticos (temas, estilos, skins y wallpapers de extensión) y todos los juegos Arcade. Pago en Solana con SOL / USDC / USDT — verificado on-chain.",
  pt: "Upgrade Pro: créditos de geração ilimitados, todos os cosméticos (temas, estilos, skins e wallpapers da extensão) e todos os jogos Arcade. Pagamento em Solana com SOL / USDC / USDT — verificado on-chain.",
  it: "Upgrade Pro: crediti di generazione illimitati, tutti i cosmetici (temi, stili, skin e wallpaper dell’estensione) e tutti i giochi Arcade. Pagamento su Solana con SOL / USDC / USDT — verificato on-chain.",
  nl: "Pro-upgrade: onbeperkte generatiecredits, alle cosmetica (themes, styles, extension skins & wallpapers) en alle Arcade-games. Betaal op Solana met SOL / USDC / USDT — on-chain geverifieerd.",
  tr: "Pro yükseltme: sınırsız üretim kredisi, tüm kozmetikler (temalar, stiller, extension skin & wallpaper) ve tüm Arcade oyunları. Solana’da SOL / USDC / USDT ile öde — on-chain doğrulama.",
  pl: "Upgrade Pro: nielimitowane kredyty generacji, cała kosmetyka (motywy, style, skórki i tapety rozszerzenia) i wszystkie gry Arcade. Płatność w Solana: SOL / USDC / USDT — weryfikacja on-chain.",
  id: "Upgrade Pro: kredit generasi tak terbatas, semua kosmetik (tema, style, skin & wallpaper ekstensi) dan semua game Arcade. Bayar di Solana dengan SOL / USDC / USDT — terverifikasi on-chain.",
  hi: "Pro अपग्रेड: असीमित जनरेशन क्रेडिट, सभी कॉस्मेटिक्स (थीम्स, स्टाइल्स, एक्सटेंशन स्किन्स और वॉलपेपर) और सभी Arcade गेम्स। Solana पर SOL / USDC / USDT से भुगतान — on-chain सत्यापित।",
  ja: "Proアップグレード：無制限の生成クレジット、すべてのコスメ（テーマ、スタイル、拡張スキン＆壁紙）、Arcadeの全ゲーム。SolanaでSOL / USDC / USDT支払い—オンチェーン検証。",
  zh: "升级 Pro：无限生成额度、全部外观（主题、样式、扩展皮肤与壁纸）以及全部 Arcade 游戏。Solana 上用 SOL / USDC / USDT 支付—链上验证。",
};

const SEO_WALLET_DESCRIPTION = {
  en: "Unlimited generation credits, all themes, every Arcade game, and Pro controls. Pay with SOL, USDC, or USDT — verified on-chain.",
  ru: "Безлимитные кредиты генерации, все темы, все игры Arcade и Pro-контроли. Оплата SOL, USDC или USDT — проверка on-chain.",
  uk: "Безлімітні кредити генерації, усі теми, усі ігри Arcade та Pro-контролі. Оплата SOL, USDC або USDT — перевірка on-chain.",
  de: "Unbegrenzte Generierungs-Credits, alle Themes, jedes Arcade-Spiel und Pro-Controls. Zahle mit SOL, USDC oder USDT — on-chain verifiziert.",
  fr: "Crédits de génération illimités, tous les thèmes, tous les jeux Arcade et contrôles Pro. Payez en SOL, USDC ou USDT — vérifié on-chain.",
  es: "Créditos de generación ilimitados, todos los temas, todos los juegos Arcade y controles Pro. Paga con SOL, USDC o USDT — verificado on-chain.",
  pt: "Créditos de geração ilimitados, todos os temas, todos os jogos Arcade e controlos Pro. Pague com SOL, USDC ou USDT — verificado on-chain.",
  it: "Crediti di generazione illimitati, tutti i temi, ogni gioco Arcade e controlli Pro. Paga con SOL, USDC o USDT — verificato on-chain.",
  nl: "Onbeperkte generatiecredits, alle themes, elke Arcade-game en Pro-controls. Betaal met SOL, USDC of USDT — on-chain geverifieerd.",
  tr: "Sınırsız üretim kredisi, tüm temalar, her Arcade oyunu ve Pro kontrolleri. SOL, USDC veya USDT ile öde — on-chain doğrulama.",
  pl: "Nielimitowane kredyty generacji, wszystkie motywy, każda gra Arcade i kontrolki Pro. Płać SOL, USDC lub USDT — weryfikacja on-chain.",
  id: "Kredit generasi tak terbatas, semua tema, semua game Arcade, dan kontrol Pro. Bayar dengan SOL, USDC, atau USDT — terverifikasi on-chain.",
  hi: "असीमित जनरेशन क्रेडिट, सभी थीम्स, हर Arcade गेम और Pro कंट्रोल। SOL, USDC या USDT से भुगतान — on-chain सत्यापित।",
  ja: "無制限の生成クレジット、全テーマ、全Arcadeゲーム、Proコントロール。SOL/USDC/USDT支払い—オンチェーン検証。",
  zh: "无限生成额度、全部主题、所有 Arcade 游戏与 Pro 控制。SOL/USDC/USDT 支付—链上验证。",
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
  if (PLAN_CMP_FEAT_DAILY[code]) set("plan_cmp_feat_daily", PLAN_CMP_FEAT_DAILY[code]);
  if (WALLET_DESC[code]) set("wallet_desc", WALLET_DESC[code]);
  if (SEO_WALLET_DESCRIPTION[code]) set("seo_wallet_description", SEO_WALLET_DESCRIPTION[code]);
  if (n) {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + "\n");
    total += n;
  }
}
console.log(`[i18n_wallet_tab_patches] updated keys=${total}`);
