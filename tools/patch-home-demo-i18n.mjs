#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const localesDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "shared", "i18n", "locales");

const PATCH = {
  de: {
    home_try_loading: "Beispiele werden erzeugt…",
    home_try_empty: "Keine Beispiele erhalten. Bitte erneut versuchen.",
    home_try_copy: "Beispiele kopieren",
  },
  fr: {
    home_try_loading: "Génération d’exemples…",
    home_try_empty: "Aucun exemple retourné. Réessaie.",
    home_try_copy: "Copier les exemples",
  },
  es: {
    home_try_loading: "Generando ejemplos…",
    home_try_empty: "No se devolvieron ejemplos. Inténtalo de nuevo.",
    home_try_copy: "Copiar ejemplos",
  },
  pt: {
    home_try_loading: "Gerando exemplos…",
    home_try_empty: "Nenhum exemplo retornado. Tente de novo.",
    home_try_copy: "Copiar exemplos",
  },
  it: {
    home_try_loading: "Generazione esempi…",
    home_try_empty: "Nessun esempio restituito. Riprova.",
    home_try_copy: "Copia esempi",
  },
  nl: {
    home_try_loading: "Voorbeelden genereren…",
    home_try_empty: "Geen voorbeelden ontvangen. Probeer opnieuw.",
    home_try_copy: "Voorbeelden kopiëren",
  },
  tr: {
    home_try_loading: "Örnekler üretiliyor…",
    home_try_empty: "Örnek dönmedi. Tekrar dene.",
    home_try_copy: "Örnekleri kopyala",
  },
  pl: {
    home_try_loading: "Generowanie przykładów…",
    home_try_empty: "Brak przykładów. Spróbuj ponownie.",
    home_try_copy: "Kopiuj przykłady",
  },
  id: {
    home_try_loading: "Membuat contoh…",
    home_try_empty: "Tidak ada contoh. Coba lagi.",
    home_try_copy: "Salin contoh",
  },
  ru: {
    home_try_loading: "Генерируем примеры…",
    home_try_empty: "Примеры не пришли. Попробуй ещё раз.",
    home_try_copy: "Копировать примеры",
  },
  uk: {
    home_try_loading: "Генеруємо приклади…",
    home_try_empty: "Прикладів немає. Спробуй ще раз.",
    home_try_copy: "Копіювати приклади",
  },
  hi: {
    home_try_loading: "सैंपल बना रहे हैं…",
    home_try_empty: "कोई सैंपल नहीं मिला। फिर कोशिश करें।",
    home_try_copy: "सैंपल कॉपी करें",
  },
  ja: {
    home_try_loading: "サンプルを生成中…",
    home_try_empty: "サンプルがありません。もう一度お試しください。",
    home_try_copy: "サンプルをコピー",
  },
  zh: {
    home_try_loading: "正在生成示例…",
    home_try_empty: "没有返回示例，请重试。",
    home_try_copy: "复制示例",
    homeTryGm: "试试 GM",
    homeTryGn: "试试 GN",
    h_try_note: "无需钱包。先体验一下，再连接 @handle 保存并解锁 Pro 功能。",
  },
};

for (const [code, values] of Object.entries(PATCH)) {
  const file = path.join(localesDir, `${code}.json`);
  const json = JSON.parse(fs.readFileSync(file, "utf8"));
  Object.assign(json, values);
  fs.writeFileSync(file, JSON.stringify(json, null, 2) + "\n", "utf8");
  console.log(`patched ${code}.json`);
}
