import fs from "fs";
import path from "path";

const file = path.join(process.cwd(), "public/app.js");
let s = fs.readFileSync(file, "utf8");

const checks = [
  ['SITE_WALLPAPER_PACK_COUNT = 58', "wallpaper pack count"],
  ['antiN = antiWindow(strength)', "generate antiN"],
  ['/assets/wallpapers/${norm}.webp', "site webp urls"],
  ['EXT_WALLPAPER_PACK_COUNT = 58', "ext pack count (target)"],
];

function mustHave(needle, label) {
  if (!s.includes(needle)) throw new Error(`Expected before patch: ${label} (${needle})`);
}

mustHave("SITE_WALLPAPER_PACK_COUNT = 58", "wallpaper pack count");
mustHave("const antiN = antiWindow(strength);", "generate antiN in HEAD");
mustHave("/assets/wallpapers/${norm}.webp", "site webp");

s = s.replace('const ASSET_REV = "20260530a";', 'const ASSET_REV = "20260530b";');
s = s.replace(
  "  const EXT_WALLPAPER_PACK_COUNT = 50;",
  "  const EXT_WALLPAPER_PACK_COUNT = 58;"
);
s = s.replace(
  '    setPh("adminOut","adminOut_ph",merged);\n    setPh("supportOut","supportOut_ph",merged);\n',
  '    setPh("adminOut","adminOut_ph",merged);\n'
);

const syncFn = `  function syncModePanelCopy(){
    const bind = (kind)=>{
      const sizeLbl = $(kind === "gm" ? "gm_size" : "gn_size");
      const sel = $(kind === "gm" ? "gmMode" : "gnMode");
      if (sizeLbl) sizeLbl.textContent = t(kind === "gm" ? "gm_size_label" : "gn_size_label") || "Size";
      if (!sel) return;
      const labels = {
        min: t(kind === "gm" ? "gm_mode_min" : "gn_mode_min"),
        mid: t(kind === "gm" ? "gm_mode_mid" : "gn_mode_mid"),
        max: t(kind === "gm" ? "gm_mode_max" : "gn_mode_max")
      };
      for (const opt of sel.options){
        const v = String(opt.value || "").toLowerCase();
        if (labels[v]) opt.textContent = labels[v];
      }
    };
    bind("gm");
    bind("gn");
  }

`;

if (!s.includes("function syncModePanelCopy")) {
  s = s.replace("  function patchDynamicCopy(lang, merged){", syncFn + "  function patchDynamicCopy(lang, merged){");
}

const supportBlock = `  function supportBundle(){
    const bundle = {
      product: "GMXReply",
      build: $("ui_build") ? $("ui_build").textContent : "",
      handle: getHandle(),
      uiLang: localStorage.getItem(LS_SITE_LANG) || "en",
      gm: { total: totalSaved("gm"), langs: getLangIndex("gm") },
      gn: { total: totalSaved("gn"), langs: getLangIndex("gn") },
      sub: SUB ? { active:true, tier: SUB.tier || SUB.plan || "", until: SUB.until || SUB.expires || "" } : { active:false },
      theme: localStorage.getItem("gmx_theme") || "classic",
      hasCustomBg: !!localStorage.getItem(LS_CUSTOM_BG_GLOBAL),
      ua: navigator.userAgent
    };
    return JSON.stringify(bundle, null, 2);
  }

  function logsBundle(){
    const out = {
      ts: new Date().toISOString(),
      handle: getHandle(),
      logs: LOGS.slice(-120)
    };
    return JSON.stringify(out, null, 2);
  }


`;
s = s.replace(supportBlock, "");

const handlers = `    const supBtn = $("toolSupport");
    if (supBtn){
      supBtn.addEventListener("click", async ()=>{
        const data = supportBundle();
        await copyToClipboard(data);
        if (note) note.textContent = "Support bundle copied. Send it only if support asks for it.";
      });
    }

    const logsBtn = $("toolLogs");
    if (logsBtn){
      logsBtn.addEventListener("click", async ()=>{
        const out = logsBundle();
        const ta = $("supportOut");
        if (ta) ta.value = out;
        await copyToClipboard(out);
        if (note) note.textContent = "Logs copied. Send them only if support asks for them.";
        logEvent("support_logs", { size: out.length });
      });
    }
`;
s = s.replace(handlers, "");

if (!s.includes('const ASSET_REV = "20260530b";')) throw new Error("ASSET_REV patch failed");
if (!s.includes("EXT_WALLPAPER_PACK_COUNT = 58")) throw new Error("EXT count patch failed");
if (s.includes("supportBundle")) throw new Error("supportBundle still present");
if (!s.includes("function syncModePanelCopy")) throw new Error("syncModePanelCopy missing");

fs.writeFileSync(file, s);
console.log("patched public/app.js OK");
