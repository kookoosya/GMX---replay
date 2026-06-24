#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const localesDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "shared", "i18n", "locales");

const PATCH = {
  de: {
    plan_modal_desc:
      "Wähle, was du brauchst — jederzeit verlängerbar. Jährlich spart 2 Monate ($80/Jahr). Pro schaltet sofort alles frei — inkl. aller Arcade-Spiele.",
    plan_badge_2mo_free: "2 Monate gratis",
    plan_badge_popular: "Beliebt",
    w_yearly_save: "Jährlich spart 2 Monate — $80/Jahr statt $120 bei monatlicher Zahlung.",
  },
  fr: {
    plan_modal_desc:
      "Choisis ce qu’il te faut — prolongeable à tout moment. L’annuel économise 2 mois (80 $/an). Pro débloque tout instantanément — y compris tous les jeux Arcade.",
    plan_badge_2mo_free: "2 mois offerts",
    plan_badge_popular: "Populaire",
    w_yearly_save: "L’annuel économise 2 mois — 80 $/an au lieu de 120 $ en mensuel.",
  },
  es: {
    plan_modal_desc:
      "Elige lo que necesitas — ampliable cuando quieras. El plan anual ahorra 2 meses ($80/año). Pro desbloquea todo al instante — incluidos todos los juegos Arcade.",
    plan_badge_2mo_free: "2 meses gratis",
    plan_badge_popular: "Más vendido",
    w_yearly_save: "El anual ahorra 2 meses — $80/año en lugar de $120 pagando mes a mes.",
  },
  pt: {
    plan_modal_desc:
      "Escolha o que precisa — pode estender depois. O anual economiza 2 meses ($80/ano). Pro libera tudo na hora — incluindo todos os jogos Arcade.",
    plan_badge_2mo_free: "2 meses grátis",
    plan_badge_popular: "Mais escolhido",
    w_yearly_save: "O anual economiza 2 meses — $80/ano em vez de $120 no mensal.",
  },
  it: {
    plan_modal_desc:
      "Scegli ciò che ti serve — estendibile quando vuoi. L’annuale risparmia 2 mesi ($80/anno). Pro sblocca tutto subito — inclusi tutti i giochi Arcade.",
    plan_badge_2mo_free: "2 mesi gratis",
    plan_badge_popular: "Popolare",
    w_yearly_save: "L’annuale risparmia 2 mesi — $80/anno invece di $120 con il mensile.",
  },
  nl: {
    plan_modal_desc:
      "Kies wat je nodig hebt — altijd verlengbaar. Jaarlijks bespaart 2 maanden ($80/jaar). Pro ontgrendelt alles direct — inclusief alle Arcade-games.",
    plan_badge_2mo_free: "2 maanden gratis",
    plan_badge_popular: "Populair",
    w_yearly_save: "Jaarlijks bespaart 2 maanden — $80/jaar i.p.v. $120 bij maandelijks betalen.",
  },
  tr: {
    plan_modal_desc:
      "İhtiyacına göre seç — istediğin zaman uzat. Yıllık 2 ay kazandırır ($80/yıl). Pro anında her şeyi açar — tüm Arcade oyunları dahil.",
    plan_badge_2mo_free: "2 ay bedava",
    plan_badge_popular: "Popüler",
    w_yearly_save: "Yıllık 2 ay kazandırır — aylık ödesen $120 yerine $80/yıl.",
  },
  pl: {
    plan_modal_desc:
      "Wybierz, czego potrzebujesz — przedłużysz kiedy chcesz. Roczny oszczędza 2 miesiące ($80/rok). Pro odblokowuje wszystko od razu — w tym wszystkie gry Arcade.",
    plan_badge_2mo_free: "2 miesiące gratis",
    plan_badge_popular: "Popularny",
    w_yearly_save: "Roczny oszczędza 2 miesiące — $80/rok zamiast $120 przy płatności miesięcznej.",
  },
  id: {
    plan_modal_desc:
      "Pilih yang kamu butuhkan — bisa diperpanjang kapan saja. Tahunan hemat 2 bulan ($80/tahun). Pro membuka semuanya instan — termasuk semua game Arcade.",
    plan_badge_2mo_free: "2 bulan gratis",
    plan_badge_popular: "Populer",
    w_yearly_save: "Tahunan hemat 2 bulan — $80/tahun vs $120 jika bayar bulanan.",
  },
  ru: {
    plan_modal_desc:
      "Выбери план — продлить можно в любой момент. Годовой экономит 2 месяца ($80/год). Pro открывает всё сразу — включая все игры Arcade.",
    plan_badge_2mo_free: "2 месяца в подарок",
    plan_badge_popular: "Популярный",
    w_yearly_save: "Годовой экономит 2 месяца — $80/год вместо $120 при помесячной оплате.",
  },
  uk: {
    plan_modal_desc:
      "Обери план — продовжити можна будь-коли. Річний економить 2 місяці ($80/рік). Pro відкриває все одразу — включно з усіма іграми Arcade.",
    plan_badge_2mo_free: "2 місяці в подарунок",
    plan_badge_popular: "Популярний",
    w_yearly_save: "Річний економить 2 місяці — $80/рік замість $120 при щомісячній оплаті.",
  },
  hi: {
    plan_modal_desc:
      "Pick what you need — extend anytime. Yearly saves 2 months ($80/yr). Pro unlocks everything instantly — including all Arcade games.",
    plan_badge_2mo_free: "2 महीने मुफ़्त",
    plan_badge_popular: "लोकप्रिय",
    w_yearly_save: "Yearly saves 2 months — $80/year instead of $120 if paid monthly.",
  },
  ja: {
    plan_modal_desc:
      "必要なプランを選べます — いつでも延長可能。年払いは2か月お得（$80/年）。Proですぐ全機能解放 — Arcadeの全ゲーム含む。",
    plan_badge_2mo_free: "2か月無料",
    plan_badge_popular: "人気",
    w_yearly_save: "年払いは2か月お得 — 月払い$120のところ$80/年。",
  },
  zh: {
    plan_modal_desc:
      "按需选择，随时续费。年付省 2 个月（$80/年）。Pro 立即解锁全部功能 — 包括所有 Arcade 游戏。",
    plan_badge_2mo_free: "赠送 2 个月",
    plan_badge_popular: "热门",
    w_yearly_save: "年付省 2 个月 — $80/年，按月付则要 $120。",
  },
};

for (const [code, values] of Object.entries(PATCH)) {
  const file = path.join(localesDir, `${code}.json`);
  const json = JSON.parse(fs.readFileSync(file, "utf8"));
  Object.assign(json, values);
  fs.writeFileSync(file, JSON.stringify(json, null, 2) + "\n", "utf8");
  console.log(`patched ${code}.json`);
}
