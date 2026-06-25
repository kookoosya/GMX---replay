#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const localesDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "shared", "i18n", "locales");

const PATCH = {
  de: {
    wp_filter_featured: "Empfohlene Auswahl",
    wp_filter_all: "Alle Hintergründe",
    wp_filter_free: "Nur kostenlos",
    wp_filter_mine: "Freigeschaltet",
    wp_group_custom: "Eigene",
    wp_group_free: "Kostenlos",
    wp_group_unlocked: "Freigeschaltet",
    wp_group_locked: "Gesperrt",
    wp_sync_ext_text: "Passendes Extension-Hintergrundbild mit anwenden",
  },
  fr: {
    wp_filter_featured: "Sélection vedette",
    wp_filter_all: "Tous les fonds",
    wp_filter_free: "Gratuits seulement",
    wp_filter_mine: "Débloqués",
    wp_group_custom: "Perso",
    wp_group_free: "Gratuit",
    wp_group_unlocked: "Débloqué",
    wp_group_locked: "Verrouillé",
    wp_sync_ext_text: "Appliquer aussi le fond d'extension correspondant",
  },
  es: {
    wp_filter_featured: "Selección destacada",
    wp_filter_all: "Todos los fondos",
    wp_filter_free: "Solo gratis",
    wp_filter_mine: "Desbloqueados",
    wp_group_custom: "Personal",
    wp_group_free: "Gratis",
    wp_group_unlocked: "Desbloqueado",
    wp_group_locked: "Bloqueado",
    wp_sync_ext_text: "Aplicar también el fondo de extensión coincidente",
  },
  pt: {
    wp_filter_featured: "Seleção em destaque",
    wp_filter_all: "Todos os fundos",
    wp_filter_free: "Só grátis",
    wp_filter_mine: "Desbloqueados",
    wp_group_custom: "Personalizado",
    wp_group_free: "Grátis",
    wp_group_unlocked: "Desbloqueado",
    wp_group_locked: "Bloqueado",
    wp_sync_ext_text: "Aplicar também o papel de parede da extensão correspondente",
  },
  it: {
    wp_filter_featured: "Scelti per te",
    wp_filter_all: "Tutti gli sfondi",
    wp_filter_free: "Solo gratis",
    wp_filter_mine: "Sbloccati",
    wp_group_custom: "Personalizzati",
    wp_group_free: "Gratis",
    wp_group_unlocked: "Sbloccati",
    wp_group_locked: "Bloccati",
    wp_sync_ext_text: "Applica anche lo sfondo extension abbinato",
  },
  nl: {
    wp_filter_featured: "Uitgelichte keuze",
    wp_filter_all: "Alle achtergronden",
    wp_filter_free: "Alleen gratis",
    wp_filter_mine: "Vrijgespeeld",
    wp_group_custom: "Eigen",
    wp_group_free: "Gratis",
    wp_group_unlocked: "Vrijgespeeld",
    wp_group_locked: "Vergrendeld",
    wp_sync_ext_text: "Pas ook de bijpassende extensie-achtergrond toe",
  },
  pl: {
    wp_filter_featured: "Polecane",
    wp_filter_all: "Wszystkie tapety",
    wp_filter_free: "Tylko darmowe",
    wp_filter_mine: "Odblokowane",
    wp_group_custom: "Własne",
    wp_group_free: "Darmowe",
    wp_group_unlocked: "Odblokowane",
    wp_group_locked: "Zablokowane",
    wp_sync_ext_text: "Zastosuj też pasującą tapetę rozszerzenia",
  },
  tr: {
    wp_filter_featured: "Öne çıkanlar",
    wp_filter_all: "Tüm duvar kağıtları",
    wp_filter_free: "Sadece ücretsiz",
    wp_filter_mine: "Açılmış",
    wp_group_custom: "Özel",
    wp_group_free: "Ücretsiz",
    wp_group_unlocked: "Açılmış",
    wp_group_locked: "Kilitli",
    wp_sync_ext_text: "Eşleşen uzantı duvar kağıdını da uygula",
  },
  id: {
    wp_filter_featured: "Pilihan unggulan",
    wp_filter_all: "Semua wallpaper",
    wp_filter_free: "Gratis saja",
    wp_filter_mine: "Terbuka",
    wp_group_custom: "Kustom",
    wp_group_free: "Gratis",
    wp_group_unlocked: "Terbuka",
    wp_group_locked: "Terkunci",
    wp_sync_ext_text: "Terapkan juga wallpaper ekstensi yang cocok",
  },
  ru: {
    wp_filter_featured: "Избранные",
    wp_filter_all: "Все обои",
    wp_filter_free: "Только бесплатные",
    wp_filter_mine: "Открытые",
    wp_group_custom: "Свои",
    wp_group_free: "Бесплатные",
    wp_group_unlocked: "Открытые",
    wp_group_locked: "Закрытые",
    wp_sync_ext_text: "Также применить обои для расширения",
  },
  uk: {
    wp_filter_featured: "Обрані",
    wp_filter_all: "Усі шпалери",
    wp_filter_free: "Лише безкоштовні",
    wp_filter_mine: "Відкриті",
    wp_group_custom: "Свої",
    wp_group_free: "Безкоштовні",
    wp_group_unlocked: "Відкриті",
    wp_group_locked: "Закриті",
    wp_sync_ext_text: "Також застосувати шпалери для розширення",
  },
  hi: {
    wp_filter_featured: "चुनिंदा",
    wp_filter_all: "सभी वॉलपेपर",
    wp_filter_free: "केवल मुफ़्त",
    wp_filter_mine: "अनलॉक",
    wp_group_custom: "कस्टम",
    wp_group_free: "मुफ़्त",
    wp_group_unlocked: "अनलॉक",
    wp_group_locked: "लॉक",
    wp_sync_ext_text: "मैचिंग एक्सटेंशन वॉलपेपर भी लगाएँ",
  },
  ja: {
    wp_filter_featured: "おすすめ",
    wp_filter_all: "すべての壁紙",
    wp_filter_free: "無料のみ",
    wp_filter_mine: "解放済み",
    wp_group_custom: "カスタム",
    wp_group_free: "無料",
    wp_group_unlocked: "解放済み",
    wp_group_locked: "ロック",
    wp_sync_ext_text: "対応する拡張機能の壁紙も適用",
  },
  zh: {
    wp_filter_featured: "精选",
    wp_filter_all: "全部壁纸",
    wp_filter_free: "仅免费",
    wp_filter_mine: "已解锁",
    wp_group_custom: "自定义",
    wp_group_free: "免费",
    wp_group_unlocked: "已解锁",
    wp_group_locked: "锁定",
    wp_sync_ext_text: "同时应用匹配的扩展壁纸",
  },
};

const EN_KEYS = {
  wp_filter_featured: "Featured picks",
  wp_filter_all: "All wallpapers",
  wp_filter_free: "Free only",
  wp_filter_mine: "Unlocked",
  wp_group_custom: "Custom",
  wp_group_free: "Free",
  wp_group_unlocked: "Unlocked",
  wp_group_locked: "Locked",
  wp_sync_ext_text: "Also apply matching extension wallpaper",
};

const enPath = path.join(localesDir, "en.json");
const en = JSON.parse(fs.readFileSync(enPath, "utf8"));
Object.assign(en, EN_KEYS);
fs.writeFileSync(enPath, `${JSON.stringify(en, null, 2)}\n`);

for (const lang of fs.readdirSync(localesDir).map((f) => f.replace(/\.json$/, "")).filter((c) => c !== "en")) {
  const file = path.join(localesDir, `${lang}.json`);
  const j = JSON.parse(fs.readFileSync(file, "utf8"));
  for (const [k, v] of Object.entries(EN_KEYS)) {
    if (j[k] === undefined) j[k] = v;
  }
  if (PATCH[lang]) Object.assign(j, PATCH[lang]);
  fs.writeFileSync(file, `${JSON.stringify(j, null, 2)}\n`);
}
console.log("patch-wallpaper-i18n: ok");
