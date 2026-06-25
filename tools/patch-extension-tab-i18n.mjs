#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const localesDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "shared", "i18n", "locales");

const PATCH = {
  de: {
    ext_sync_hub_title: "Synchronisiert mit der Website",
    ext_sync_hub_desc: "GMXReply in einem Browser-Tab offen lassen — die Website steuert Login und Extension-Cosmetics.",
    ext_sync_list: [
      "<b>Login</b> — @handle und Sitzung aus einem offenen GMXReply-Tab (Website schlägt manuelles Extension-Login).",
      "<b>Extension-Theme</b> — das Skin, das du unten wählst.",
      "<b>Wallpaper</b> — Popup/Inline-Hintergrund von diesem Tab.",
      "<b>GM/GN-Schalter</b> — Best-Modus und Clean-fill bleiben abgestimmt.",
    ],
    ext_preview_popup_caption: "Popup — schnelles GM/GN-Kopieren",
    ext_preview_inline_caption: "Inline-Panel auf X",
    ext_chrome_store_btn: "Chrome-Erweiterung holen",
    ext_chrome_store_hint: "Öffnet den Chrome Web Store nach Veröffentlichung oder lokale Installationshinweise.",
  },
  fr: {
    ext_sync_hub_title: "Synchronisé avec le site",
    ext_sync_hub_desc: "Gardez GMXReply ouvert dans un onglet — le site pilote la connexion et les cosmétiques extension.",
    ext_sync_list: [
      "<b>Connexion</b> — @handle et session depuis un onglet GMXReply ouvert (le site prime sur la connexion manuelle).",
      "<b>Thème extension</b> — le skin choisi ci-dessous.",
      "<b>Fond d’écran</b> — arrière-plan popup/inline depuis cet onglet.",
      "<b>Interrupteurs GM/GN</b> — Best mode et Clean-fill restent alignés.",
    ],
    ext_preview_popup_caption: "Popup — copie rapide GM/GN",
    ext_preview_inline_caption: "Panneau inline sur X",
    ext_chrome_store_btn: "Obtenir l’extension Chrome",
    ext_chrome_store_hint: "Ouvre le Chrome Web Store une fois publié, ou instructions d’installation locale.",
  },
  es: {
    ext_sync_hub_title: "Sincroniza con el sitio",
    ext_sync_hub_desc: "Mantén GMXReply abierto en una pestaña — el sitio controla el login y los cosméticos de la extensión.",
    ext_sync_list: [
      "<b>Login</b> — @handle y sesión desde una pestaña GMXReply abierta (el sitio gana al login manual).",
      "<b>Tema de extensión</b> — el skin que eliges abajo.",
      "<b>Fondo</b> — wallpaper popup/inline desde esta pestaña.",
      "<b>Interruptores GM/GN</b> — Best mode y Clean-fill alineados.",
    ],
    ext_preview_popup_caption: "Popup — copia rápida GM/GN",
    ext_preview_inline_caption: "Panel inline en X",
    ext_chrome_store_btn: "Obtener extensión Chrome",
    ext_chrome_store_hint: "Abre Chrome Web Store al publicar, o instrucciones de instalación local.",
  },
  pt: {
    ext_sync_hub_title: "Sincroniza com o site",
    ext_sync_hub_desc: "Mantenha o GMXReply aberto num separador — o site controla login e cosméticos da extensão.",
    ext_sync_list: [
      "<b>Login</b> — @handle e sessão de um separador GMXReply aberto (o site vence o login manual).",
      "<b>Tema da extensão</b> — o skin escolhido abaixo.",
      "<b>Papel de parede</b> — fundo popup/inline deste separador.",
      "<b>Interruptores GM/GN</b> — Best mode e Clean-fill alinhados.",
    ],
    ext_preview_popup_caption: "Popup — cópia rápida GM/GN",
    ext_preview_inline_caption: "Painel inline no X",
    ext_chrome_store_btn: "Obter extensão Chrome",
    ext_chrome_store_hint: "Abre a Chrome Web Store após publicação, ou instruções locais.",
  },
  it: {
    ext_sync_hub_title: "Si sincronizza col sito",
    ext_sync_hub_desc: "Tieni GMXReply aperto in una scheda — il sito controlla login e cosmetici dell’estensione.",
    ext_sync_list: [
      "<b>Login</b> — @handle e sessione da una scheda GMXReply aperta (il sito batte il login manuale).",
      "<b>Tema estensione</b> — la skin scelta sotto.",
      "<b>Sfondo</b> — wallpaper popup/inline da questa scheda.",
      "<b>Toggle GM/GN</b> — Best mode e Clean-fill allineati.",
    ],
    ext_preview_popup_caption: "Popup — copia rapida GM/GN",
    ext_preview_inline_caption: "Pannello inline su X",
    ext_chrome_store_btn: "Scarica estensione Chrome",
    ext_chrome_store_hint: "Apre Chrome Web Store dopo la pubblicazione, o istruzioni locali.",
  },
  nl: {
    ext_sync_hub_title: "Sync met de site",
    ext_sync_hub_desc: "Houd GMXReply open in een tab — de site stuurt login en extension-cosmetics.",
    ext_sync_list: [
      "<b>Login</b> — @handle en sessie van een open GMXReply-tab (site wint van handmatige extension-login).",
      "<b>Extension-thema</b> — de skin die je hieronder kiest.",
      "<b>Achtergrond</b> — popup/inline wallpaper van dit tabblad.",
      "<b>GM/GN-schakelaars</b> — Best mode en Clean-fill blijven gelijk.",
    ],
    ext_preview_popup_caption: "Popup — snel GM/GN kopiëren",
    ext_preview_inline_caption: "Inline-paneel op X",
    ext_chrome_store_btn: "Chrome-extensie halen",
    ext_chrome_store_hint: "Opent Chrome Web Store na publicatie, of lokale installatie-instructies.",
  },
  pl: {
    ext_sync_hub_title: "Synchronizacja ze stroną",
    ext_sync_hub_desc: "Trzymaj GMXReply otwarte w karcie — strona steruje logowaniem i kosmetykami rozszerzenia.",
    ext_sync_list: [
      "<b>Login</b> — @handle i sesja z otwartej karty GMXReply (strona wygrywa z ręcznym logowaniem).",
      "<b>Motyw rozszerzenia</b> — skin wybrany poniżej.",
      "<b>Tapeta</b> — tło popup/inline z tej karty.",
      "<b>Przełączniki GM/GN</b> — Best mode i Clean-fill pozostają zsynchronizowane.",
    ],
    ext_preview_popup_caption: "Popup — szybkie kopiowanie GM/GN",
    ext_preview_inline_caption: "Panel inline na X",
    ext_chrome_store_btn: "Pobierz rozszerzenie Chrome",
    ext_chrome_store_hint: "Otwiera Chrome Web Store po publikacji lub instrukcje lokalnej instalacji.",
  },
  tr: {
    ext_sync_hub_title: "Site ile senkron",
    ext_sync_hub_desc: "GMXReply’i bir sekmede açık tutun — site giriş ve extension kozmetiklerini yönetir.",
    ext_sync_list: [
      "<b>Giriş</b> — açık GMXReply sekmesinden @handle ve oturum (site, manuel girişten önceliklidir).",
      "<b>Extension teması</b> — aşağıda seçtiğiniz skin.",
      "<b>Duvar kağıdı</b> — bu sekmeden popup/inline arka plan.",
      "<b>GM/GN anahtarları</b> — Best mode ve Clean-fill hizalı kalır.",
    ],
    ext_preview_popup_caption: "Popup — hızlı GM/GN kopyalama",
    ext_preview_inline_caption: "X’te inline panel",
    ext_chrome_store_btn: "Chrome uzantısını al",
    ext_chrome_store_hint: "Yayınlandığında Chrome Web Store’u açar veya yerel kurulum talimatları.",
  },
  id: {
    ext_sync_hub_title: "Sinkron dengan situs",
    ext_sync_hub_desc: "Biarkan GMXReply terbuka di tab — situs mengontrol login dan kosmetik ekstensi.",
    ext_sync_list: [
      "<b>Login</b> — @handle dan sesi dari tab GMXReply terbuka (situs mengalahkan login manual).",
      "<b>Tema ekstensi</b> — skin yang Anda pilih di bawah.",
      "<b>Wallpaper</b> — latar popup/inline dari tab ini.",
      "<b>Toggle GM/GN</b> — Best mode dan Clean-fill tetap selaras.",
    ],
    ext_preview_popup_caption: "Popup — salin GM/GN cepat",
    ext_preview_inline_caption: "Panel inline di X",
    ext_chrome_store_btn: "Dapatkan ekstensi Chrome",
    ext_chrome_store_hint: "Membuka Chrome Web Store setelah rilis, atau petunjuk instalasi lokal.",
  },
  hi: {
    ext_sync_hub_title: "साइट के साथ sync",
    ext_sync_hub_desc: "GMXReply को ब्राउज़र टैब में खुला रखें — साइट login और extension cosmetics नियंत्रित करती है।",
    ext_sync_list: [
      "<b>Login</b> — खुले GMXReply टैब से @handle और session (साइट manual login से आगे)।",
      "<b>Extension theme</b> — नीचे चुना गया skin।",
      "<b>Wallpaper</b> — इस टैब से popup/inline background।",
      "<b>GM/GN toggles</b> — Best mode और Clean-fill aligned रहते हैं।",
    ],
    ext_preview_popup_caption: "Popup — त्वरित GM/GN copy",
    ext_preview_inline_caption: "X पर inline panel",
    ext_chrome_store_btn: "Chrome extension लें",
    ext_chrome_store_hint: "प्रकाशन के बाद Chrome Web Store खोलता है, या local install निर्देश।",
  },
  ja: {
    ext_sync_hub_title: "サイトと同期",
    ext_sync_hub_desc: "GMXReply をブラウザタブで開いたままに — サイトがログインと拡張コスメを管理します。",
    ext_sync_list: [
      "<b>ログイン</b> — 開いている GMXReply タブの @handle とセッション（サイトが手動ログインより優先）。",
      "<b>拡張テーマ</b> — 下で選ぶスキン。",
      "<b>壁紙</b> — このタブから popup/inline 背景。",
      "<b>GM/GN トグル</b> — Best mode と Clean-fill を揃えます。",
    ],
    ext_preview_popup_caption: "ポップアップ — クイック GM/GN コピー",
    ext_preview_inline_caption: "X のインラインパネル",
    ext_chrome_store_btn: "Chrome 拡張を入手",
    ext_chrome_store_hint: "公開後は Chrome Web Store、それ以前はローカル手順。",
  },
  zh: {
    ext_sync_hub_title: "与网站同步",
    ext_sync_hub_desc: "保持 GMXReply 在浏览器标签页打开 — 网站控制登录与扩展外观。",
    ext_sync_list: [
      "<b>登录</b> — 来自已打开 GMXReply 标签的 @handle 与会话（优先于扩展内手动登录）。",
      "<b>扩展主题</b> — 下方选择的皮肤。",
      "<b>壁纸</b> — 本标签的 popup/inline 背景。",
      "<b>GM/GN 开关</b> — Best mode 与 Clean-fill 保持一致。",
    ],
    ext_preview_popup_caption: "弹窗 — 快速复制 GM/GN",
    ext_preview_inline_caption: "X 上的内联面板",
    ext_chrome_store_btn: "获取 Chrome 扩展",
    ext_chrome_store_hint: "发布后打开 Chrome 网上应用店，或本地安装说明。",
  },
  ru: {
    ext_sync_hub_title: "Синхронизация с сайтом",
    ext_sync_hub_desc: "Держите GMXReply открытым во вкладке — сайт управляет входом и косметикой расширения.",
    ext_sync_list: [
      "<b>Вход</b> — @handle и сессия с открытой вкладки GMXReply (сайт важнее ручного входа в расширении).",
      "<b>Тема расширения</b> — скин, который вы выбираете ниже.",
      "<b>Обои</b> — фон popup/inline с этой вкладки.",
      "<b>Переключатели GM/GN</b> — Best mode и Clean-fill остаются согласованными.",
    ],
    ext_preview_popup_caption: "Popup — быстрое копирование GM/GN",
    ext_preview_inline_caption: "Inline-панель на X",
    ext_chrome_store_btn: "Установить расширение Chrome",
    ext_chrome_store_hint: "Откроет Chrome Web Store после публикации или инструкцию для локальной установки.",
  },
  uk: {
    ext_sync_hub_title: "Синхронізація з сайтом",
    ext_sync_hub_desc: "Тримайте GMXReply відкритим у вкладці — сайт керує входом і косметикою розширення.",
    ext_sync_list: [
      "<b>Вхід</b> — @handle і сесія з відкритої вкладки GMXReply (сайт важливіший за ручний вхід у розширенні).",
      "<b>Тема розширення</b> — скін, який ви обираєте нижче.",
      "<b>Шпалери</b> — фон popup/inline з цієї вкладки.",
      "<b>Перемикачі GM/GN</b> — Best mode і Clean-fill залишаються узгодженими.",
    ],
    ext_preview_popup_caption: "Popup — швидке копіювання GM/GN",
    ext_preview_inline_caption: "Inline-панель на X",
    ext_chrome_store_btn: "Отримати розширення Chrome",
    ext_chrome_store_hint: "Відкриє Chrome Web Store після публікації або інструкцію локального встановлення.",
  },
};

for (const [lang, keys] of Object.entries(PATCH)) {
  const file = path.join(localesDir, `${lang}.json`);
  const j = JSON.parse(fs.readFileSync(file, "utf8"));
  Object.assign(j, keys);
  fs.writeFileSync(file, `${JSON.stringify(j, null, 2)}\n`);
}
console.log("patch-extension-tab-i18n: ok");
