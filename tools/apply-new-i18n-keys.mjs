#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const LOCALES = path.join(ROOT, 'shared', 'i18n', 'locales');

const FIXES = {
  de: {
    themes_pro_tip: 'Pro schaltet die volle Theme- und Wallpaper-Bibliothek frei.',
    gen_empty_reply: 'Server hat eine leere Zeile zurückgegeben. Versuche einen anderen Ton oder ein anderes Preset.',
  },
  es: {
    themes_pro_tip: 'Pro desbloquea toda la biblioteca de temas y fondos.',
    gen_empty_reply: 'El servidor devolvió una línea vacía. Prueba otro tono o preset.',
  },
  fr: {
    themes_pro_tip: 'Pro débloque toute la bibliothèque de thèmes et fonds d\'écran.',
    gen_empty_reply: 'Le serveur a renvoyé une ligne vide. Essayez un autre ton ou préréglage.',
  },
  pt: {
    themes_pro_tip: 'O Pro desbloqueia toda a biblioteca de temas e wallpapers.',
    gen_empty_reply: 'O servidor devolveu uma linha vazia. Tente outro tom ou preset.',
  },
  it: {
    themes_pro_tip: 'Pro sblocca l\'intera libreria di temi e sfondi.',
    gen_empty_reply: 'Il server ha restituito una riga vuota. Prova un altro tono o preset.',
  },
  nl: {
    themes_pro_tip: 'Pro ontgrendelt de volledige thema- en achtergrondbibliotheek.',
    gen_empty_reply: 'Server gaf een lege regel terug. Probeer een andere toon of preset.',
  },
  tr: {
    themes_pro_tip: 'Pro, tüm tema ve duvar kağıdı kütüphanesini açar.',
    gen_empty_reply: 'Sunucu boş bir satır döndürdü. Başka bir ton veya ön ayar deneyin.',
  },
  pl: {
    themes_pro_tip: 'Pro odblokowuje pełną bibliotekę motywów i tapet.',
    gen_empty_reply: 'Serwer zwrócił pustą linię. Spróbuj innego tonu lub presetu.',
  },
  ru: {
    themes_pro_tip: 'Pro открывает полную библиотеку тем и обоев.',
    gen_empty_reply: 'Сервер вернул пустую строку. Попробуйте другой тон или пресет.',
  },
  uk: {
    themes_pro_tip: 'Pro відкриває повну бібліотеку тем і шпалер.',
    gen_empty_reply: 'Сервер повернув порожній рядок. Спробуйте інший тон або пресет.',
  },
  hi: {
    themes_pro_tip: 'Pro पूरा थीम और वॉलपेपर संग्रह अनलॉक करता है।',
    gen_empty_reply: 'सर्वर ने खाली लाइन लौटाई। दूसरा टोन या प्रीसेट आज़माएँ।',
  },
  ja: {
    themes_pro_tip: 'Proでテーマと壁紙の全ライブラリが解放されます。',
    gen_empty_reply: 'サーバーが空の行を返しました。別のトーンかプリセットを試してください。',
  },
  zh: {
    themes_pro_tip: 'Pro 解锁完整主题和壁纸库。',
    gen_empty_reply: '服务器返回了空行。请尝试其他语气或预设。',
  },
  id: {
    themes_pro_tip: 'Pro membuka seluruh perpustakaan tema dan wallpaper.',
    gen_empty_reply: 'Server mengembalikan baris kosong. Coba nada atau preset lain.',
  },
};

for (const [code, keys] of Object.entries(FIXES)) {
  const file = path.join(LOCALES, `${code}.json`);
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));
  Object.assign(data, keys);
  fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n', 'utf8');
  console.log(`Updated ${code}`);
}
