#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const localesDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "shared", "i18n", "locales");

/** @type {Record<string, { wallet_desc: string; plan_modal_desc: string; arcade_locked_premium_note: string; w_right_pro: string }>} */
const PATCH = {
  de: {
    plan_modal_desc:
      "Wähle was du brauchst — verlängern geht jederzeit. Pro schaltet sofort alles frei — inklusive aller Arcade-Spiele.",
    wallet_desc:
      "Pro-Upgrade: unbegrenzte tägliche GM/GN-Zeilen + alle Kosmetik (Themes, Styles, Extension-Skins & Wallpapers) + alle Arcade-Spiele. Zahlung auf Solana mit SOL / USDC / USDT. Auto-Verifizierung on-chain.",
    arcade_locked_premium_note:
      "Pro schaltet alle Arcade-Spiele frei. Upgrade, um diesen Titel hier zu starten.",
    w_right_pro:
      "<b>Pro:</b> unbegrenzte tägliche Generierung + unbegrenzte gespeicherte Zeilen, alles freigeschaltet (inkl. aller Arcade-Spiele und Cloud-Sync).",
  },
  fr: {
    plan_modal_desc:
      "Choisis ce qu'il te faut — tu peux prolonger à tout moment. Pro débloque tout instantanément — y compris tous les jeux Arcade.",
    wallet_desc:
      "Upgrade Pro : lignes GM/GN quotidiennes illimitées + tous les cosmétiques (thèmes, styles, skins & wallpapers d’extension) + tous les jeux Arcade. Paiement sur Solana en SOL / USDC / USDT. Vérification automatique on‑chain.",
    arcade_locked_premium_note:
      "Pro débloque tous les jeux Arcade. Passe à Pro pour lancer ce titre ici.",
    w_right_pro:
      "<b>Pro :</b> lignes sauvegardées illimitées, génération quotidienne complète, flux <b>Best</b> renforcé, tout débloqué (y compris tous les jeux Arcade et la sync Cloud quand activée).",
  },
  es: {
    plan_modal_desc:
      "Elige lo que necesitas — puedes ampliar cuando quieras. Pro desbloquea todo al instante, incluidos todos los juegos del Arcade.",
    wallet_desc:
      "Upgrade Pro: líneas GM/GN diarias ilimitadas + todos los cosméticos (temas, estilos, skins y wallpapers de extensión) + todos los juegos del Arcade. Pago en Solana con SOL / USDC / USDT. Verificación automática on-chain.",
    arcade_locked_premium_note:
      "Pro desbloquea todos los juegos del Arcade. Mejora a Pro para lanzar este título aquí.",
    w_right_pro:
      "<b>Pro:</b> líneas guardadas ilimitadas, generación diaria completa, flujo <b>Best</b> más fuerte, desbloquea todo (incluidos todos los juegos del Arcade y Cloud sync cuando esté activo).",
  },
  pt: {
    plan_modal_desc:
      "Escolha o que precisa — pode estender a qualquer momento. Pro libera tudo na hora — incluindo todos os jogos do Arcade.",
    wallet_desc:
      "Upgrade Pro: linhas GM/GN diárias ilimitadas + todos os cosméticos (temas, estilos, skins e wallpapers da extensão) + todos os jogos do Arcade. Pagamento em Solana com SOL / USDC / USDT. Verificação automática on-chain.",
    arcade_locked_premium_note:
      "Pro libera todos os jogos do Arcade. Faça upgrade para lançar este título aqui.",
    w_right_pro:
      "<b>Pro:</b> linhas salvas ilimitadas, geração diária completa, fluxo <b>Best</b> mais forte, libera tudo (incluindo todos os jogos do Arcade e Cloud sync quando ativo).",
  },
  it: {
    plan_modal_desc:
      "Scegli ciò che ti serve — puoi estendere in qualsiasi momento. Pro sblocca tutto subito — inclusi tutti i giochi Arcade.",
    wallet_desc:
      "Upgrade Pro: righe GM/GN giornaliere illimitate + tutti i cosmetici (temi, stili, skin e wallpaper dell’estensione) + tutti i giochi Arcade. Pagamento su Solana con SOL / USDC / USDT. Verifica automatica on‑chain.",
    arcade_locked_premium_note:
      "Pro sblocca tutti i giochi Arcade. Passa a Pro per avviare questo titolo qui.",
    w_right_pro:
      "<b>Pro:</b> righe salvate illimitate, generazione giornaliera completa, flusso <b>Best</b> più forte, sblocca tutto (inclusi tutti i giochi Arcade e Cloud sync quando attivo).",
  },
  nl: {
    plan_modal_desc:
      "Kies wat je nodig hebt — verlengen kan altijd. Pro ontgrendelt alles direct — inclusief alle Arcade-games.",
    wallet_desc:
      "Pro-upgrade: onbeperkte dagelijkse GM/GN-regels + alle cosmetica (themes, styles, extension skins & wallpapers) + alle Arcade-games. Betaal op Solana met SOL / USDC / USDT. Auto-verificatie on-chain.",
    arcade_locked_premium_note:
      "Pro ontgrendelt alle Arcade-games. Upgrade om deze titel hier te starten.",
    w_right_pro:
      "<b>Pro:</b> onbeperkte opgeslagen regels, volledige dagelijkse generatie, sterkere <b>Best</b>-flow, ontgrendel alles (inclusief alle Arcade-games en Cloud sync wanneer actief).",
  },
  tr: {
    plan_modal_desc:
      "İhtiyacın olanı seç — istediğin zaman uzatabilirsin. Pro anında her şeyi açar — tüm Arcade oyunları dahil.",
    wallet_desc:
      "Pro yükseltme: sınırsız günlük GM/GN satırı + tüm kozmetikler (temalar, stiller, extension skin & wallpaper) + tüm Arcade oyunları. Solana’da SOL / USDC / USDT ile öde. On-chain otomatik doğrulama.",
    arcade_locked_premium_note:
      "Pro tüm Arcade oyunlarını açar. Bu oyunu burada başlatmak için yükselt.",
    w_right_pro:
      "<b>Pro:</b> sınırsız kayıtlı satır, tam günlük üretim, daha güçlü <b>Best</b> akışı, her şeyi açar (tüm Arcade oyunları ve etkin olduğunda Cloud sync dahil).",
  },
  pl: {
    plan_modal_desc:
      "Wybierz, czego potrzebujesz — możesz przedłużyć w każdej chwili. Pro odblokowuje wszystko od razu — w tym wszystkie gry Arcade.",
    wallet_desc:
      "Upgrade Pro: nielimitowane dzienne linie GM/GN + cała kosmetyka (motywy, style, skórki i tapety rozszerzenia) + wszystkie gry Arcade. Płatność w Solana: SOL / USDC / USDT. Auto-weryfikacja on-chain.",
    arcade_locked_premium_note:
      "Pro odblokowuje wszystkie gry Arcade. Ulepsz, aby uruchomić ten tytuł tutaj.",
    w_right_pro:
      "<b>Pro:</b> nielimitowane zapisane linie, pełna dzienna generacja, mocniejszy przepływ <b>Best</b>, odblokowuje wszystko (w tym wszystkie gry Arcade i Cloud sync po włączeniu).",
  },
  id: {
    plan_modal_desc:
      "Pilih yang kamu butuhkan — bisa diperpanjang kapan saja. Pro membuka semuanya seketika — termasuk semua game Arcade.",
    wallet_desc:
      "Upgrade Pro: baris GM/GN harian tanpa batas + semua kosmetik (tema, style, skin & wallpaper ekstensi) + semua game Arcade. Bayar di Solana dengan SOL / USDC / USDT. Verifikasi otomatis on-chain.",
    arcade_locked_premium_note:
      "Pro membuka semua game Arcade. Upgrade untuk meluncurkan judul ini di sini.",
    w_right_pro:
      "<b>Pro:</b> baris tersimpan tanpa batas, generasi harian penuh, alur <b>Best</b> lebih kuat, buka semuanya (termasuk semua game Arcade dan Cloud sync saat aktif).",
  },
  ru: {
    plan_modal_desc:
      "Выбирай что нужно — продлить можно в любой момент. Pro открывает всё сразу — включая все игры Arcade.",
    wallet_desc:
      "Апгрейд Pro: безлимит на строки GM/GN в день + вся косметика (темы, стили, скины и обои для расширения) + все игры Arcade. Оплата в Solana: SOL / USDC / USDT. Авто‑проверка on‑chain.",
    arcade_locked_premium_note:
      "Pro открывает все игры Arcade. Апгрейд, чтобы запустить эту игру здесь.",
    w_right_pro:
      "<b>Pro:</b> без лимита сохранённых строк, полный дневной лимит генерации, сильнее режим <b>Best</b>, всё открыто (включая все игры Arcade и Cloud sync при включении).",
  },
  uk: {
    plan_modal_desc:
      "Обирай що потрібно — продовжити можна будь-коли. Pro відкриває все одразу — включно з усіма іграми Arcade.",
    wallet_desc:
      "Апгрейд Pro: безліміт на рядки GM/GN на день + вся косметика (теми, стилі, скіни та шпалери для розширення) + усі ігри Arcade. Оплата в Solana: SOL / USDC / USDT. Авто‑перевірка on‑chain.",
    arcade_locked_premium_note:
      "Pro відкриває всі ігри Arcade. Апгрейд, щоб запустити цю гру тут.",
    w_right_pro:
      "<b>Pro:</b> без ліміту збережених рядків, повний денний ліміт генерації, сильніший режим <b>Best</b>, усе відкрито (включно з усіма іграми Arcade та Cloud sync за увімкнення).",
  },
  hi: {
    plan_modal_desc:
      "जो चाहिए चुनें — कभी भी बढ़ा सकते हैं। Pro तुरंत सब अनलॉक करता है — सभी Arcade गेम्स सहित।",
    wallet_desc:
      "Pro अपग्रेड: अनलिमिटेड दैनिक GM/GN लाइन्स + सभी कॉस्मेटिक्स (थीम्स, स्टाइल्स, एक्सटेंशन स्किन्स और वॉलपेपर) + सभी Arcade गेम्स। Solana पर SOL / USDC / USDT से पे करें। ऑन-चेन ऑटो-वेरिफाइड।",
    arcade_locked_premium_note:
      "Pro सभी Arcade गेम्स अनलॉक करता है। यह गेम यहाँ चलाने के लिए अपग्रेड करें।",
    w_right_pro:
      "<b>Pro:</b> अनलिमिटेड सेव्ड लाइन्स, पूरी दैनिक जनरेशन, मजबूत <b>Best</b> फ्लो, सब अनलॉक (सभी Arcade गेम्स और सक्रिय होने पर Cloud sync सहित)।",
  },
  ja: {
    plan_modal_desc:
      "必要なプランを選べます — いつでも延長可能。Proはすべてを即座に解放 — Arcadeの全ゲームを含みます。",
    wallet_desc:
      "Proアップグレード：GM/GNの1日無制限 + すべてのコスメ（テーマ、スタイル、拡張スキン＆壁紙）+ Arcadeの全ゲーム。SolanaでSOL / USDC / USDT支払い。オンチェーン自動検証。",
    arcade_locked_premium_note:
      "ProでArcadeの全ゲームが解放されます。ここで起動するにはアップグレードしてください。",
    w_right_pro:
      "<b>Pro：</b>保存行数無制限、フル日次生成、強化<b>Best</b>フロー、すべて解放（Arcadeの全ゲームと有効時のCloud同期を含む）。",
  },
  zh: {
    plan_modal_desc:
      "按需选择方案 — 随时可续期。Pro 立即解锁全部 — 包括所有 Arcade 游戏。",
    wallet_desc:
      "升级 Pro：每日 GM/GN 行数不限 + 解锁全部外观（主题、样式、扩展皮肤与壁纸）+ 全部 Arcade 游戏。Solana 上用 SOL / USDC / USDT 支付。链上自动验证。",
    arcade_locked_premium_note:
      "Pro 解锁全部 Arcade 游戏。升级后可在此启动该游戏。",
    w_right_pro:
      "<b>Pro：</b>保存行数不限、完整每日生成、更强的 <b>Best</b> 流程，解锁一切（包括全部 Arcade 游戏及启用时的 Cloud 同步）。",
  },
};

function patchProBullet(list, next) {
  if (!Array.isArray(list)) return [next];
  const idx = list.findIndex((line) => /<b>Pro:/i.test(String(line)));
  if (idx === -1) return [...list, next];
  const out = list.slice();
  out[idx] = next;
  return out;
}

for (const [code, values] of Object.entries(PATCH)) {
  const file = path.join(localesDir, `${code}.json`);
  const json = JSON.parse(fs.readFileSync(file, "utf8"));
  json.plan_modal_desc = values.plan_modal_desc;
  json.wallet_desc = values.wallet_desc;
  json.arcade_locked_premium_note = values.arcade_locked_premium_note;
  json.w_right_list = patchProBullet(json.w_right_list, values.w_right_pro);
  fs.writeFileSync(file, JSON.stringify(json, null, 2) + "\n", "utf8");
  console.log(`patched ${code}.json`);
}
