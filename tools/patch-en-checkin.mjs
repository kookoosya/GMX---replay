import fs from "fs";
import path from "path";

const file = path.join(process.cwd(), "shared/i18n/locales/en.json");
const j = JSON.parse(fs.readFileSync(file, "utf8"));

j.w_support_title = "";
j.w_support_desc = "";
j.toolSupport = "";
j.toolDiag = "";
j.toolLogs = "";
j.supportOut_ph = "";

const payFinal = "<li><b>Payments are final:</b> verified on-chain payments are not refunded or reversed by us.</li>";
if (!String(j.w_trust_list_html || "").includes("Payments are final")) {
  j.w_trust_list_html = String(j.w_trust_list_html || "").replace(/<\/li>\s*$/, "") + payFinal;
}

const faqRefund = "<b>Can I get a refund?</b> No. Once a Solana payment is verified on-chain, it is final.";
if (!Array.isArray(j.w_faq_list)) j.w_faq_list = [];
if (!j.w_faq_list.some((x) => String(x).includes("refund"))) {
  j.w_faq_list.push(faqRefund);
}

Object.assign(j, {
  gm_size_label: "Size",
  gm_mode_min: "Fast · short",
  gm_mode_mid: "Balanced · default",
  gm_mode_max: "Full · richer",
  gm_mode_min_hint: "One short line, ready to paste.",
  gm_mode_mid_hint: "A bit more color; still a natural reply.",
  gm_mode_max_hint: "Warmer tone — not an essay.",
  gn_size_label: "Size",
  gn_mode_min: "Fast · short",
  gn_mode_mid: "Balanced · default",
  gn_mode_max: "Full · richer",
  gn_mode_min_hint: "One short line, ready to paste.",
  gn_mode_mid_hint: "A bit more color; still a natural reply.",
  gn_mode_max_hint: "Warmer tone — not an essay."
});

fs.writeFileSync(file, JSON.stringify(j, null, 2) + "\n");
console.log("patched en.json");
