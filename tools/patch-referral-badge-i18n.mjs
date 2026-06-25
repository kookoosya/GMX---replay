#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const localesDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "shared", "i18n", "locales");

const PATCH = {
  de: {
    ref_badge_title: "Promoter-Abzeichen",
    ref_badge_bronze: "Bronzestufe",
    ref_badge_silver: "Silber",
    ref_badge_gold: "Goldstufe",
    ref_badge_diamond: "Diamant",
    ref_badge_next_html: "Nächstes Abzeichen bei <b>{n}</b> berechtigten — {tier}",
    ref_badge_toast_html: "Neues Abzeichen: <b>{tier}</b>",
    ref_badge_all_unlocked: "Alle Promoter-Abzeichen freigeschaltet",
  },
  fr: {
    ref_badge_title: "Badges promoteur",
    ref_badge_bronze: "Niveau bronze",
    ref_badge_silver: "Argent",
    ref_badge_gold: "Or",
    ref_badge_diamond: "Diamant",
    ref_badge_next_html: "Prochain badge à <b>{n}</b> éligibles — {tier}",
    ref_badge_toast_html: "Nouveau badge : <b>{tier}</b>",
    ref_badge_all_unlocked: "Tous les badges promoteur débloqués",
  },
  es: {
    ref_badge_title: "Insignias de promotor",
    ref_badge_bronze: "Bronce",
    ref_badge_silver: "Plata",
    ref_badge_gold: "Oro",
    ref_badge_diamond: "Diamante",
    ref_badge_next_html: "Próxima insignia con <b>{n}</b> elegibles — {tier}",
    ref_badge_toast_html: "Nueva insignia: <b>{tier}</b>",
    ref_badge_all_unlocked: "Todas las insignias de promotor desbloqueadas",
  },
  pt: {
    ref_badge_title: "Emblemas de promotor",
    ref_badge_bronze: "Nível bronze",
    ref_badge_silver: "Prata",
    ref_badge_gold: "Ouro",
    ref_badge_diamond: "Diamante",
    ref_badge_next_html: "Próximo emblema com <b>{n}</b> elegíveis — {tier}",
    ref_badge_toast_html: "Novo emblema: <b>{tier}</b>",
    ref_badge_all_unlocked: "Todos os emblemas de promotor desbloqueados",
  },
  it: {
    ref_badge_title: "Badge promotore",
    ref_badge_bronze: "Bronzo",
    ref_badge_silver: "Argento",
    ref_badge_gold: "Oro",
    ref_badge_diamond: "Diamante",
    ref_badge_next_html: "Prossimo badge a <b>{n}</b> idonei — {tier}",
    ref_badge_toast_html: "Nuovo badge: <b>{tier}</b>",
    ref_badge_all_unlocked: "Tutti i badge promotore sbloccati",
  },
  nl: {
    ref_badge_title: "Promoter-badges",
    ref_badge_bronze: "Brons",
    ref_badge_silver: "Zilver",
    ref_badge_gold: "Goud",
    ref_badge_diamond: "Diamant",
    ref_badge_next_html: "Volgende badge bij <b>{n}</b> in aanmerking komenden — {tier}",
    ref_badge_toast_html: "Nieuwe badge: <b>{tier}</b>",
    ref_badge_all_unlocked: "Alle promoter-badges ontgrendeld",
  },
  pl: {
    ref_badge_title: "Odznaki promotora",
    ref_badge_bronze: "Brąz",
    ref_badge_silver: "Srebro",
    ref_badge_gold: "Złoto",
    ref_badge_diamond: "Diament",
    ref_badge_next_html: "Następna odznaka przy <b>{n}</b> uprawnionych — {tier}",
    ref_badge_toast_html: "Nowa odznaka: <b>{tier}</b>",
    ref_badge_all_unlocked: "Wszystkie odznaki promotora odblokowane",
  },
  tr: {
    ref_badge_title: "Promoter rozetleri",
    ref_badge_bronze: "Bronz",
    ref_badge_silver: "Gümüş",
    ref_badge_gold: "Altın",
    ref_badge_diamond: "Elmas",
    ref_badge_next_html: "Sonraki rozet <b>{n}</b> uygun kullanıcıda — {tier}",
    ref_badge_toast_html: "Yeni rozet: <b>{tier}</b>",
    ref_badge_all_unlocked: "Tüm promoter rozetleri açıldı",
  },
  id: {
    ref_badge_title: "Lencana promotor",
    ref_badge_bronze: "Perunggu",
    ref_badge_silver: "Perak",
    ref_badge_gold: "Emas",
    ref_badge_diamond: "Berlian",
    ref_badge_next_html: "Lencana berikutnya pada <b>{n}</b> eligible — {tier}",
    ref_badge_toast_html: "Lencana baru: <b>{tier}</b>",
    ref_badge_all_unlocked: "Semua lencana promotor terbuka",
  },
  ru: {
    ref_badge_title: "Бейджи промоутера",
    ref_badge_bronze: "Бронза",
    ref_badge_silver: "Серебро",
    ref_badge_gold: "Золото",
    ref_badge_diamond: "Алмаз",
    ref_badge_next_html: "Следующий бейдж при <b>{n}</b> eligible — {tier}",
    ref_badge_toast_html: "Новый бейдж: <b>{tier}</b>",
    ref_badge_all_unlocked: "Все бейджи промоутера открыты",
  },
  uk: {
    ref_badge_title: "Бейджі промоутера",
    ref_badge_bronze: "Бронза",
    ref_badge_silver: "Срібло",
    ref_badge_gold: "Золото",
    ref_badge_diamond: "Алмаз",
    ref_badge_next_html: "Наступний бейдж при <b>{n}</b> eligible — {tier}",
    ref_badge_toast_html: "Новий бейдж: <b>{tier}</b>",
    ref_badge_all_unlocked: "Усі бейджі промоутера відкриті",
  },
  hi: {
    ref_badge_title: "प्रमोटर बैज",
    ref_badge_bronze: "कांस्य",
    ref_badge_silver: "रजत",
    ref_badge_gold: "स्वर्ण",
    ref_badge_diamond: "हीरा",
    ref_badge_next_html: "अगला बैज <b>{n}</b> योग्य पर — {tier}",
    ref_badge_toast_html: "नया बैज: <b>{tier}</b>",
    ref_badge_all_unlocked: "सभी प्रमोटर बैज अनलॉक",
  },
  ja: {
    ref_badge_title: "プロモーターバッジ",
    ref_badge_bronze: "ブロンズ",
    ref_badge_silver: "シルバー",
    ref_badge_gold: "ゴールド",
    ref_badge_diamond: "ダイヤ",
    ref_badge_next_html: "次のバッジは<b>{n}</b>人の対象者で — {tier}",
    ref_badge_toast_html: "新しいバッジ: <b>{tier}</b>",
    ref_badge_all_unlocked: "すべてのプロモーターバッジを解放",
  },
  zh: {
    ref_badge_title: "推广徽章",
    ref_badge_bronze: "青铜",
    ref_badge_silver: "白银",
    ref_badge_gold: "黄金",
    ref_badge_diamond: "钻石",
    ref_badge_next_html: "下一枚徽章需<b>{n}</b>个符合条件 — {tier}",
    ref_badge_toast_html: "新徽章：<b>{tier}</b>",
    ref_badge_all_unlocked: "已解锁全部推广徽章",
  },
};

const EN_KEYS = {
  ref_badge_title: "Promoter badges",
  ref_badge_bronze: "Bronze",
  ref_badge_silver: "Silver",
  ref_badge_gold: "Gold",
  ref_badge_diamond: "Diamond",
  ref_badge_next_html: "Next badge at <b>{n}</b> eligible — {tier}",
  ref_badge_toast_html: "New badge unlocked: <b>{tier}</b>",
  ref_badge_all_unlocked: "All promoter badges unlocked",
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
console.log("patch-referral-badge-i18n: ok");
