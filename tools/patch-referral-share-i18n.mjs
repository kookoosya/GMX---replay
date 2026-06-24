#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const localesDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "shared", "i18n", "locales");

const PATCH = {
  de: {
    ref_viral_hook_html:
      "<b>3</b> berechtigte Freunde → Kosmetik-Paket + mehr BG-Slots. <b>30</b> berechtigte → <b>7 Tage Pro-Test</b>.",
    ref_link_tap_to_copy: "Tippen zum Kopieren des Empfehlungslinks",
    ref_share: "Link teilen",
    ref_share_text: "Mach mit bei GMXReply",
  },
  fr: {
    ref_viral_hook_html:
      "<b>3</b> amis éligibles → pack cosmétique + plus de fonds. <b>30</b> éligibles → <b>essai Pro 7 jours</b>.",
    ref_link_tap_to_copy: "Appuyez pour copier votre lien de parrainage",
    ref_share: "Partager le lien",
    ref_share_text: "Rejoins-moi sur GMXReply",
  },
  es: {
    ref_viral_hook_html:
      "<b>3</b> amigos elegibles → pack de cosméticos + más fondos. <b>30</b> elegibles → <b>prueba Pro 7 días</b>.",
    ref_link_tap_to_copy: "Toca para copiar tu enlace de referido",
    ref_share: "Compartir enlace",
    ref_share_text: "Únete a GMXReply",
  },
  pt: {
    ref_viral_hook_html:
      "<b>3</b> amigos elegíveis → pack de cosméticos + mais fundos. <b>30</b> elegíveis → <b>teste Pro 7 dias</b>.",
    ref_link_tap_to_copy: "Toque para copiar seu link de indicação",
    ref_share: "Compartilhar link",
    ref_share_text: "Junte-se a mim no GMXReply",
  },
  it: {
    ref_viral_hook_html:
      "<b>3</b> amici idonei → pack cosmetici + più sfondi. <b>30</b> idonei → <b>prova Pro 7 giorni</b>.",
    ref_link_tap_to_copy: "Tocca per copiare il link referral",
    ref_share: "Condividi link",
    ref_share_text: "Unisciti a me su GMXReply",
  },
  nl: {
    ref_viral_hook_html:
      "<b>3</b> in aanmerking komende vrienden → cosmeticapakket + meer achtergronden. <b>30</b> → <b>7 dagen Pro-proef</b>.",
    ref_link_tap_to_copy: "Tik om je referral-link te kopiëren",
    ref_share: "Link delen",
    ref_share_text: "Doe mee op GMXReply",
  },
  pl: {
    ref_viral_hook_html:
      "<b>3</b> uprawnionych znajomych → pakiet kosmetyków + więcej slotów BG. <b>30</b> → <b>7-dniowy trial Pro</b>.",
    ref_link_tap_to_copy: "Dotknij, aby skopiować link polecający",
    ref_share: "Udostępnij link",
    ref_share_text: "Dołącz do mnie na GMXReply",
  },
  tr: {
    ref_viral_hook_html:
      "<b>3</b> uygun arkadaş → kozmetik paketi + ekstra BG slotları. <b>30</b> uygun → <b>7 günlük Pro denemesi</b>.",
    ref_link_tap_to_copy: "Referans bağlantısını kopyalamak için dokunun",
    ref_share: "Bağlantıyı paylaş",
    ref_share_text: "GMXReply'da bana katıl",
  },
  id: {
    ref_viral_hook_html:
      "<b>3</b> teman eligible → paket kosmetik + lebih banyak slot BG. <b>30</b> eligible → <b>uji coba Pro 7 hari</b>.",
    ref_link_tap_to_copy: "Ketuk untuk menyalin tautan referral",
    ref_share: "Bagikan tautan",
    ref_share_text: "Gabung dengan saya di GMXReply",
  },
  hi: {
    ref_viral_hook_html:
      "<b>3</b> योग्य दोस्त → कॉस्मेटिक पैक + अतिरिक्त BG स्लॉट। <b>30</b> योग्य → <b>7-दिन Pro ट्रायल</b>।",
    ref_link_tap_to_copy: "रेफ़रल लिंक कॉपी करने के लिए टैप करें",
    ref_share: "लिंक साझा करें",
    ref_share_text: "GMXReply पर मुझसे जुड़ें",
  },
  ja: {
    ref_viral_hook_html:
      "対象<b>3</b>人 → コスメパック + BG枠拡張。<b>30</b>人で<b>Pro 7日間トライアル</b>。",
    ref_link_tap_to_copy: "タップして紹介リンクをコピー",
    ref_share: "リンクを共有",
    ref_share_text: "GMXReplyに参加しよう",
  },
  zh: {
    ref_viral_hook_html:
      "<b>3</b> 个符合条件好友 → 化妆品包 + 更多背景位。<b>30</b> 个 → <b>7 天 Pro 试用</b>。",
    ref_link_tap_to_copy: "点击复制推荐链接",
    ref_share: "分享链接",
    ref_share_text: "加入 GMXReply",
  },
};

for (const [code, keys] of Object.entries(PATCH)) {
  const file = path.join(localesDir, `${code}.json`);
  const j = JSON.parse(fs.readFileSync(file, "utf8"));
  Object.assign(j, keys);
  fs.writeFileSync(file, `${JSON.stringify(j, null, 2)}\n`);
  console.log("patched", code);
}
