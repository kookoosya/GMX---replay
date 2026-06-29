#!/usr/bin/env node
/**
 * Referrals tab: align copy with lifetime shared 50 + separate bonus pool (not daily).
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = path.join(process.cwd(), "shared", "i18n", "locales");
const LOCALES = [
  "en",
  "ru",
  "uk",
  "de",
  "fr",
  "es",
  "pt",
  "it",
  "nl",
  "tr",
  "pl",
  "id",
  "hi",
  "ja",
  "zh",
];

const PATCH = {
  en: {
    ref_daily_limit_title: "Generation credits (GM + GN shared, lifetime)",
    ref_per_day: "lifetime shared pool",
    ref_bonus_rule:
      "Bonus: +{per20} lifetime generation credits for each 20 eligible referrals (steps unlocked: {chunks}).",
    ref_desc:
      "Share your link. Confirmed = connected via your link. Active = real GM/GN use. Eligible = max(active, carry-over). Bonus: +{per20} credits per 20 eligible (+12 at 50+). Base 50 stays separate.",
    r_li2c:
      "Promoters: eligible referrals add bonus generation credits on top of the base 50 (shown separately).",
    ref_promoter_body:
      "Rewards need eligible referrals (connect + real use). Clicks are tracked separately.",
    ref_k_gen_total: "Total credits",
    ref_status_confirmed: "Connected",
    ref_status_active: "Active",
    ref_lb_rules_summary: "referrals with at least one GM or GN use",
    ref_fraud_device: "duplicate device",
    ref_fraud_burst: "suspicious burst",
    r_list: [
      "<b>Confirmed</b> counts when someone connects a handle with your link.",
      "<b>Active</b> counts confirmed users with recorded usage. <b>Eligible</b> = max(active, carry-over).",
      "Every <b>20 eligible</b> adds <b>+10</b> lifetime credits (Promoter 50+ = <b>+12</b> per 20).",
      "Bonus credits share one GM+GN pool with the base 50. Pro removes caps and unlocks everything.",
    ],
  },
  ru: {
    ref_daily_limit_title: "Кредиты генерации (GM + GN общий пул, навсегда)",
    ref_per_day: "общий пул навсегда",
    ref_bonus_rule:
      "Бонус: +{per20} кредитов генерации навсегда за каждые 20 eligible рефералов (шагов: {chunks}).",
    ref_desc:
      "Поделись ссылкой. Confirmed = подключился по ссылке. Active = реальное использование GM/GN. Eligible = max(active, carry-over). Бонус: +{per20} за 20 eligible (+12 при 50+). Базовые 50 отдельно.",
    r_li2c:
      "Промоутерам: eligible рефералы добавляют бонусные кредиты поверх базовых 50 (показываются отдельно).",
    ref_promoter_body:
      "Награды только за eligible рефералов (подключение + реальное использование). Клики считаются отдельно.",
    ref_k_gen_total: "Всего кредитов",
    ref_status_confirmed: "Подключён",
    ref_status_active: "Активен",
    ref_lb_rules_summary: "рефералы с хотя бы одним использованием GM или GN",
    r_list: [
      "<b>Confirmed</b> — когда кто-то подключил handle по твоей ссылке.",
      "<b>Active</b> — confirmed с записанным использованием. <b>Eligible</b> = max(active, carry-over).",
      "Каждые <b>20 eligible</b> дают <b>+10</b> кредитов навсегда (при 50+ = <b>+12</b> за 20).",
      "Бонусные кредиты в одном пуле GM+GN с базовыми 50. Pro снимает лимиты.",
    ],
  },
  uk: {
    ref_daily_limit_title: "Кредити генерації (GM + GN спільний пул, назавжди)",
    ref_per_day: "спільний пул назавжди",
    ref_bonus_rule:
      "Бонус: +{per20} кредитів генерації назавжди за кожні 20 eligible рефералів (кроків: {chunks}).",
    ref_desc:
      "Поділись посиланням. Confirmed = підключився за посиланням. Active = реальне використання GM/GN. Eligible = max(active, carry-over). Бонус: +{per20} за 20 eligible (+12 при 50+). Базові 50 окремо.",
    r_li2c:
      "Промоутерам: eligible реферали додають бонусні кредити поверх базових 50 (показуються окремо).",
    ref_promoter_body:
      "Нагороди лише за eligible рефералів (підключення + реальне використання). Кліки рахуються окремо.",
    ref_k_gen_total: "Усього кредитів",
    ref_status_confirmed: "Підключений",
    ref_status_active: "Активний",
    ref_lb_rules_summary: "реферали з хоча б одним використанням GM або GN",
    r_list: [
      "<b>Confirmed</b> — коли хтось підключив handle за твоїм посиланням.",
      "<b>Active</b> — confirmed із записаним використанням. <b>Eligible</b> = max(active, carry-over).",
      "Кожні <b>20 eligible</b> дають <b>+10</b> кредитів назавжди (при 50+ = <b>+12</b> за 20).",
      "Бонусні кредити в одному пулі GM+GN з базовими 50. Pro знімає ліміти.",
    ],
  },
  de: {
    ref_daily_limit_title: "Generierungs-Credits (GM + GN gemeinsam, lebenslang)",
    ref_per_day: "gemeinsamer lebenslanger Pool",
    ref_bonus_rule:
      "Bonus: +{per20} lebenslange Generierungs-Credits je 20 berechtigte Referrals (Schritte: {chunks}).",
    r_li2c:
      "Promoter: berechtigte Referrals erhöhen den Bonus separat zum Basis-50-Pool.",
    ref_k_gen_total: "Credits gesamt",
    ref_status_confirmed: "Verbunden",
    ref_status_active: "Aktiv",
    ref_lb_rules_summary: "Referrals mit mindestens einer GM- oder GN-Nutzung",
  },
  fr: {
    ref_daily_limit_title: "Crédits de génération (GM + GN partagés, à vie)",
    ref_per_day: "pool partagé à vie",
    ref_bonus_rule:
      "Bonus : +{per20} crédits de génération à vie pour chaque 20 filleuls éligibles (étapes : {chunks}).",
    r_li2c:
      "Promoteurs : les filleuls éligibles ajoutent un bonus séparé au pool de base de 50.",
    ref_k_gen_total: "Crédits totaux",
    ref_status_confirmed: "Connecté",
    ref_status_active: "Actif",
    ref_lb_rules_summary: "filleuls avec au moins une utilisation GM ou GN",
  },
  es: {
    ref_daily_limit_title: "Créditos de generación (GM + GN compartidos, de por vida)",
    ref_per_day: "pool compartido de por vida",
    ref_bonus_rule:
      "Bonificación: +{per20} créditos de generación de por vida por cada 20 referidos elegibles (pasos: {chunks}).",
    r_li2c:
      "Promotores: los referidos elegibles añaden créditos bonus aparte del base de 50.",
    ref_k_gen_total: "Créditos totales",
    ref_status_confirmed: "Conectado",
    ref_status_active: "Activo",
    ref_lb_rules_summary: "referidos con al menos un uso de GM o GN",
  },
  pt: {
    ref_daily_limit_title: "Créditos de geração (GM + GN partilhados, vitalícios)",
    ref_per_day: "pool partilhado vitalício",
    ref_bonus_rule:
      "Bônus: +{per20} créditos de geração vitalícios a cada 20 indicados elegíveis (passos: {chunks}).",
    r_li2c:
      "Promotores: indicados elegíveis acrescentam créditos bonus além do base 50.",
    ref_k_gen_total: "Créditos totais",
    ref_status_confirmed: "Conectado",
    ref_status_active: "Ativo",
    ref_lb_rules_summary: "indicados com pelo menos um uso de GM ou GN",
  },
  it: {
    ref_daily_limit_title: "Crediti di generazione (GM + GN condivisi, a vita)",
    ref_per_day: "pool condiviso a vita",
    ref_bonus_rule:
      "Bonus: +{per20} crediti di generazione a vita ogni 20 referral idonei (passi: {chunks}).",
    r_li2c:
      "Promoter: i referral idonei aggiungono crediti bonus oltre al base 50.",
    ref_k_gen_total: "Crediti totali",
    ref_status_confirmed: "Connesso",
    ref_status_active: "Attivo",
    ref_lb_rules_summary: "referral con almeno un utilizzo GM o GN",
  },
  nl: {
    ref_daily_limit_title: "Generatiecredits (GM + GN gedeeld, levenslang)",
    ref_per_day: "gedeeld levenslang pool",
    ref_bonus_rule:
      "Bonus: +{per20} levenslange generatiecredits per 20 eligible referrals (stappen: {chunks}).",
    r_li2c:
      "Promoters: eligible referrals voegen bonuscredits toe bovenop de basis 50.",
    ref_k_gen_total: "Totaal credits",
    ref_status_confirmed: "Verbonden",
    ref_status_active: "Actief",
    ref_lb_rules_summary: "referrals met minstens één GM- of GN-gebruik",
  },
  tr: {
    ref_daily_limit_title: "Üretim kredileri (GM + GN paylaşımlı, ömür boyu)",
    ref_per_day: "paylaşımlı ömür boyu havuz",
    ref_bonus_rule:
      "Bonus: Her 20 uygun yönlendirme için +{per20} ömür boyu üretim kredisi (adımlar: {chunks}).",
    r_li2c:
      "Promoterlar: uygun yönlendirmeler temel 50'nin üstüne ayrı bonus kredisi ekler.",
    ref_k_gen_total: "Toplam kredi",
    ref_status_confirmed: "Bağlandı",
    ref_status_active: "Aktif",
    ref_lb_rules_summary: "en az bir GM veya GN kullanımı olan yönlendirmeler",
  },
  pl: {
    ref_daily_limit_title: "Kredyty generacji (GM + GN wspólne, na stałe)",
    ref_per_day: "wspólny pul na stałe",
    ref_bonus_rule:
      "Premia: +{per20} kredytów generacji na stałe za każde 20 eligible poleceń (kroki: {chunks}).",
    r_li2c:
      "Promotorzy: eligible polecenia dodają bonusowe kredyty ponad bazowe 50.",
    ref_k_gen_total: "Łącznie kredytów",
    ref_status_confirmed: "Połączony",
    ref_status_active: "Aktywny",
    ref_lb_rules_summary: "polecenia z co najmniej jednym użyciem GM lub GN",
  },
  id: {
    ref_daily_limit_title: "Kredit generasi (GM + GN bersama, seumur hidup)",
    ref_per_day: "pool bersama seumur hidup",
    ref_bonus_rule:
      "Bonus: +{per20} kredit generasi seumur hidup per 20 referral eligible (langkah: {chunks}).",
    r_li2c:
      "Promotor: referral eligible menambah kredit bonus di atas base 50.",
    ref_k_gen_total: "Total kredit",
    ref_status_confirmed: "Terhubung",
    ref_status_active: "Aktif",
    ref_lb_rules_summary: "referral dengan minimal satu penggunaan GM atau GN",
  },
  hi: {
    ref_daily_limit_title: "जनरेशन क्रेडिट (GM + GN साझा, आजीवन)",
    ref_per_day: "आजीवन साझा पूल",
    ref_bonus_rule:
      "बोनस: हर 20 योग्य रेफरल पर +{per20} आजीवन जनरेशन क्रेडिट (स्टेप: {chunks})।",
    r_li2c:
      "प्रमोटर: योग्य रेफरल base 50 के ऊपर अलग बोनस क्रेडिट जोड़ते हैं।",
    ref_k_gen_total: "कुल क्रेडिट",
    ref_status_confirmed: "कनेक्टेड",
    ref_status_active: "सक्रिय",
    ref_lb_rules_summary: "कम से कम एक GM या GN उपयोग वाले रेफरल",
  },
  ja: {
    ref_daily_limit_title: "生成クレジット（GM+GN共有・生涯）",
    ref_per_day: "生涯共有プール",
    ref_bonus_rule:
      "ボーナス: 対象20件ごとに生涯 +{per20} クレジット（解除ステップ: {chunks}）。",
    r_li2c:
      "プロモーター: 対象紹介はベース50に別途ボーナスクレジットを追加。",
    ref_k_gen_total: "合計クレジット",
    ref_status_confirmed: "接続済み",
    ref_status_active: "アクティブ",
    ref_lb_rules_summary: "GMまたはGNを1回以上使った紹介",
  },
  zh: {
    ref_daily_limit_title: "生成额度（GM + GN 共享，终身）",
    ref_per_day: "终身共享池",
    ref_bonus_rule:
      "奖励：每 20 名符合条件推荐终身 +{per20} 额度（已解锁步数：{chunks}）。",
    r_li2c:
      "推广者：符合条件推荐在基础 50 之外单独增加奖励额度。",
    ref_k_gen_total: "总额度",
    ref_status_confirmed: "已连接",
    ref_status_active: "活跃",
    ref_lb_rules_summary: "至少使用过一次 GM 或 GN 的推荐",
  },
};

const FRAUD_DEVICE = {
  de: "doppeltes Gerät",
  fr: "appareil en double",
  es: "dispositivo duplicado",
  pt: "dispositivo duplicado",
  it: "dispositivo duplicato",
  nl: "dubbel apparaat",
  tr: "yinelenen cihaz",
  pl: "zduplikowane urządzenie",
  id: "perangkat duplikat",
  hi: "डुप्लिकेट डिवाइस",
  ja: "重複デバイス",
  zh: "重复设备",
  ru: "повтор устройства",
  uk: "повтор пристрою",
};

const FRAUD_BURST = {
  de: "verdächtiger Anstieg",
  fr: "pic suspect",
  es: "ráfaga sospechosa",
  pt: "pico suspeito",
  it: "picco sospetto",
  nl: "verdachte piek",
  tr: "şüpheli artış",
  pl: "podejrzany skok",
  id: "lonjakan mencurigakan",
  hi: "संदिग्ध वृद्धि",
  ja: "不審な急増",
  zh: "可疑激增",
  ru: "подозрительный всплеск",
  uk: "підозрілий сплеск",
};

const R_LIST_BONUS = {
  de: "Jede <b>20 berechtigten</b> Referrals geben <b>+10</b> lebenslange Credits (ab 50+ = <b>+12</b> pro 20).",
  fr: "Chaque <b>20 éligibles</b> ajoute <b>+10</b> crédits à vie (50+ = <b>+12</b> par 20).",
  es: "Cada <b>20 elegibles</b> suma <b>+10</b> créditos de por vida (50+ = <b>+12</b> por 20).",
  pt: "Cada <b>20 elegíveis</b> acrescenta <b>+10</b> créditos vitalícios (50+ = <b>+12</b> por 20).",
  it: "Ogni <b>20 idonei</b> aggiunge <b>+10</b> crediti a vita (50+ = <b>+12</b> ogni 20).",
  nl: "Elke <b>20 eligible</b> geeft <b>+10</b> levenslange credits (50+ = <b>+12</b> per 20).",
  tr: "Her <b>20 uygun</b> yönlendirme <b>+10</b> ömür boyu kredi ekler (50+ = 20 başına <b>+12</b>).",
  pl: "Każde <b>20 eligible</b> daje <b>+10</b> kredytów na stałe (50+ = <b>+12</b> na 20).",
  id: "Setiap <b>20 eligible</b> menambah <b>+10</b> kredit seumur hidup (50+ = <b>+12</b> per 20).",
  hi: "हर <b>20 योग्य</b> रेफरल <b>+10</b> आजीवन क्रेडिट जोड़ता है (50+ = प्रति 20 <b>+12</b>)।",
  ja: "対象<b>20件</b>ごとに生涯<b>+10</b>クレジット（50+は20件ごと<b>+12</b>）。",
  zh: "每<b>20</b>名符合条件推荐终身<b>+10</b>额度（50+为每20<b>+12</b>）。",
  ru: "Каждые <b>20 eligible</b> дают <b>+10</b> кредитов навсегда (50+ = <b>+12</b> за 20).",
  uk: "Кожні <b>20 eligible</b> дають <b>+10</b> кредитів назавжди (50+ = <b>+12</b> за 20).",
};

const R_LIST_POOL = {
  de: "Bonus-Credits teilen sich einen GM+GN-Pool mit den Basis-50. Pro hebt Limits auf.",
  fr: "Les crédits bonus partagent un pool GM+GN avec les 50 de base. Pro supprime les plafonds.",
  es: "Los créditos bonus comparten un pool GM+GN con los 50 base. Pro quita límites.",
  pt: "Créditos bonus partilham um pool GM+GN com os 50 base. Pro remove limites.",
  it: "I crediti bonus condividono un pool GM+GN con i 50 base. Pro rimuove i limiti.",
  nl: "Bonuscredits delen één GM+GN-pool met de basis 50. Pro verwijdert limieten.",
  tr: "Bonus krediler temel 50 ile tek GM+GN havuzunu paylaşır. Pro limitleri kaldırır.",
  pl: "Bonusowe kredyty dzielą jeden pul GM+GN z bazowymi 50. Pro usuwa limity.",
  id: "Kredit bonus berbagi satu pool GM+GN dengan base 50. Pro menghapus batas.",
  hi: "बोनस क्रेडिट base 50 के साथ एक GM+GN पूल साझा करते हैं। Pro सीमाएँ हटाता है।",
  ja: "ボーナスクレジットはベース50とGM+GN共有プール。Proは上限なし。",
  zh: "奖励额度与基础50共享GM+GN池。Pro移除上限。",
  ru: "Бонусные кредиты в одном пуле GM+GN с базовыми 50. Pro снимает лимиты.",
  uk: "Бонусні кредити в одному пулі GM+GN з базовими 50. Pro знімає ліміти.",
};

for (const code of LOCALES) {
  const file = path.join(ROOT, `${code}.json`);
  const j = JSON.parse(fs.readFileSync(file, "utf8"));
  const patch = PATCH[code];
  if (patch) {
    for (const [k, v] of Object.entries(patch)) {
      j[k] = v;
    }
  }
  j.ref_fraud_device = code === "en" ? "duplicate device" : FRAUD_DEVICE[code] || FRAUD_DEVICE.de;
  j.ref_fraud_burst = code === "en" ? "suspicious burst" : FRAUD_BURST[code] || FRAUD_BURST.de;
  if (Array.isArray(j.r_list) && j.r_list.length >= 4) {
    if (code === "en" && patch?.r_list) {
      j.r_list = patch.r_list;
    } else {
      j.r_list[2] = R_LIST_BONUS[code] || R_LIST_BONUS.de;
      j.r_list[3] = R_LIST_POOL[code] || R_LIST_POOL.de;
    }
  }
  fs.writeFileSync(file, `${JSON.stringify(j, null, 2)}\n`);
  console.log("patched", code);
}
