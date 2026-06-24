#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const localesDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "shared", "i18n", "locales");

const PATCH = {
  de: {
    pwa_install: "App installieren",
    pwa_install_hint: "GMXReply zum Startbildschirm hinzufügen",
    pwa_install_ios: "Tippe auf Teilen, dann Zum Home-Bildschirm.",
  },
  fr: {
    pwa_install: "Installer l'app",
    pwa_install_hint: "Ajouter GMXReply à l'écran d'accueil",
    pwa_install_ios: "Appuyez sur Partager, puis Sur l'écran d'accueil.",
  },
  es: {
    pwa_install: "Instalar app",
    pwa_install_hint: "Añadir GMXReply a la pantalla de inicio",
    pwa_install_ios: "Toca Compartir y luego Añadir a la pantalla de inicio.",
  },
  pt: {
    pwa_install: "Instalar app",
    pwa_install_hint: "Adicionar GMXReply à tela inicial",
    pwa_install_ios: "Toque em Compartilhar e depois Adicionar à Tela de Início.",
  },
  it: {
    pwa_install: "Installa app",
    pwa_install_hint: "Aggiungi GMXReply alla schermata Home",
    pwa_install_ios: "Tocca Condividi, poi Aggiungi a Home.",
  },
  nl: {
    pwa_install: "App installeren",
    pwa_install_hint: "GMXReply aan startscherm toevoegen",
    pwa_install_ios: "Tik op Delen en dan Zet op beginscherm.",
  },
  pl: {
    pwa_install: "Zainstaluj app",
    pwa_install_hint: "Dodaj GMXReply do ekranu głównego",
    pwa_install_ios: "Dotknij Udostępnij, potem Do ekranu początkowego.",
  },
  tr: {
    pwa_install: "Uygulamayı yükle",
    pwa_install_hint: "GMXReply'ı ana ekrana ekle",
    pwa_install_ios: "Paylaş'a dokunun, ardından Ana Ekrana Ekle.",
  },
  id: {
    pwa_install: "Pasang app",
    pwa_install_hint: "Tambahkan GMXReply ke layar utama",
    pwa_install_ios: "Ketuk Bagikan, lalu Tambahkan ke Layar Utama.",
  },
  hi: {
    pwa_install: "ऐप इंस्टॉल करें",
    pwa_install_hint: "GMXReply को होम स्क्रीन पर जोड़ें",
    pwa_install_ios: "शेयर दबाएँ, फिर होम स्क्रीन में जोड़ें।",
  },
  ja: {
    pwa_install: "アプリをインストール",
    pwa_install_hint: "GMXReplyをホーム画面に追加",
    pwa_install_ios: "共有をタップし、「ホーム画面に追加」を選びます。",
  },
  zh: {
    pwa_install: "安装应用",
    pwa_install_hint: "将 GMXReply 添加到主屏幕",
    pwa_install_ios: "点分享，然后添加到主屏幕。",
  },
};

for (const [code, keys] of Object.entries(PATCH)) {
  const file = path.join(localesDir, `${code}.json`);
  const j = JSON.parse(fs.readFileSync(file, "utf8"));
  Object.assign(j, keys);
  fs.writeFileSync(file, `${JSON.stringify(j, null, 2)}\n`);
  console.log("patched", code);
}
