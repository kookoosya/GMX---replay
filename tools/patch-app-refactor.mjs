#!/usr/bin/env node
import fs from "fs";
import path from "path";

const root = process.cwd();
const targets = [
  "public/app.js",
  "public/bridge/app.js",
  "frontend/public/app.js",
];

function patchApp(src) {
  let s = src;
  let n = 0;

  const must = (cond, msg) => {
    if (!cond) throw new Error(msg);
  };

  if (!s.includes("const SITE_WALLPAPER_PACK_COUNT = 58;")) {
    throw new Error("expected SITE_WALLPAPER_PACK_COUNT = 58 in app.js");
  }

  if (!s.includes("let REF_COUNT = 0;")) {
    throw new Error("REF_COUNT anchor missing");
  }

  if (!s.includes("LS_REF_ELIGIBLE_CACHE")) {
    s = s.replace(
      "  let REF_COUNT = 0;\n  let AUTH_OK = false;",
      `  let REF_COUNT = 0;
  const LS_REF_ELIGIBLE_CACHE = "gmx_ref_eligible_v1";
  try{
    const bootEligible = Number(localStorage.getItem(LS_REF_ELIGIBLE_CACHE) || 0) || 0;
    if (bootEligible > 0) REF_COUNT = bootEligible;
  }catch(_e){}
  let AUTH_OK = false;
  let LAST_USAGE_COSMETIC_SIG = "";`
    );
    n++;
  }

  if (!s.includes("function applyRefCountEligible")) {
    s = s.replace(
      "async function refreshUsage(){",
      `function applyRefCountEligible(eligible, { renderUnlockUi = false } = {}){
    const num = Math.max(0, Number(eligible || 0) || 0);
    const changed = REF_COUNT !== num;
    REF_COUNT = num;
    try{ localStorage.setItem(LS_REF_ELIGIBLE_CACHE, String(num)); }catch(_e){}
    if ($("refCountPill")) $("refCountPill").textContent = String(num);
    if ($("refCountRight")) $("refCountRight").textContent = String(num);
    if ($("refCountInline")) $("refCountInline").textContent = String(num);
    if ($("refEligibleInline")) $("refEligibleInline").textContent = String(num);
    if (!renderUnlockUi || !changed) return changed;
    try{ renderThemes(); }catch(_e){}
    try{ renderExtThemes(); }catch(_e){}
    try{ fillStyles(); }catch(_e){}
    try{ fillPacks(); }catch(_e){}
    return changed;
  }

  function usageCosmeticSignature(j){
    const eligible = Number(j?.limits?.referralUnlocks?.eligible ?? 0) || 0;
    const tier = String(j?.sub?.tier || j?.sub?.plan || "");
    const active = j?.sub?.active ? "1" : "0";
    return \`\${active}|\${tier}|\${eligible}|\${SAVE_CAP_FREE}\`;
  }

async function refreshUsage(){`
    );
    n++;
  }

  if (!s.includes("applyRefCountEligible(Number(j?.limits?.referralUnlocks")) {
    s = s.replace(
      "      SUB = j.sub || null;\n      renderWalletStatus(j.sub);\n\n      const gmCapUI",
      `      SUB = j.sub || null;
      renderWalletStatus(j.sub);

      applyRefCountEligible(Number(j?.limits?.referralUnlocks?.eligible ?? 0) || 0, { renderUnlockUi: true });

      const gmCapUI`
    );
    n++;
  }

  if (s.includes("// refresh UI that depends on subscription / limits")) {
    s = s.replace(
      `      const ra = $("kResetAt");
      if (ra) ra.textContent = j.resetAt || "-";


      // refresh UI that depends on subscription / limits
      fillStyles();
      fillPacks();
      try{ window.__syncProControls && window.__syncProControls(); }catch(e){}

      applyUserBg();
      initWallpapers();

      // themes + view
      renderThemes();
      initExtWallpaperControls();
      normalizeStoredExtWallpaperSelections();
      renderExtThemes();
      renderExtWallpapers();
      renderExtCustomBgUI();
      setExtView(normalizeExtViewValue(localStorage.getItem(LS_EXT_VIEW)||"theme"), { force:true, silent:true });

      // also refresh referral count for unlocks
      try{ scheduleRefStatsRefresh(120); }catch(e){}`,
      `      const ra = $("kResetAt");
      if (ra) ra.textContent = j.resetAt || "-";

      const cosmeticSig = usageCosmeticSignature(j);
      if (cosmeticSig !== LAST_USAGE_COSMETIC_SIG){
        LAST_USAGE_COSMETIC_SIG = cosmeticSig;
        fillStyles();
        fillPacks();
        try{ window.__syncProControls && window.__syncProControls(); }catch(e){}
        applyUserBg();
        initWallpapers();
        renderThemes();
        initExtWallpaperControls();
        normalizeStoredExtWallpaperSelections();
        renderExtThemes();
        renderExtWallpapers();
        renderExtCustomBgUI();
        setExtView(normalizeExtViewValue(localStorage.getItem(LS_EXT_VIEW)||"theme"), { force:true, silent:true });
      }

      try{ scheduleRefStatsRefresh(120); }catch(e){}`
    );
    n++;
  }

  if (s.includes("initWpLazyLoad")) {
    s = s.replace(/\s*if \(st\)\s+try\{ initWpLazyLoad\(\); \}catch\(_e\)\{\}\n/, "\n");
    n++;
  }

  if (s.includes("REF_COUNT = eligible;")) {
    s = s.replace(
      `    REF_COUNT = eligible;

    if ($("refCountPill")) $("refCountPill").textContent = String(eligible);
    if ($("refCountRight")) $("refCountRight").textContent = String(eligible);
    if ($("refCountInline")) $("refCountInline").textContent = String(eligible);

    if ($("refConfirmedInline"))`,
      `    applyRefCountEligible(eligible);

    if ($("refConfirmedInline"))`
    );
    s = s.replace(
      /if \(\$\("refEligibleInline"\)\) \$\("refEligibleInline"\)\.textContent = String\(eligible\);\n\n    const link/,
      "const link"
    );
    s = s.replace(
      `      const eligible = Number(j.eligibleRefs ?? j.referrals ?? j.count ?? 0) || 0;
      REF_COUNT = eligible;
      if ($("refCountPill")) $("refCountPill").textContent = String(eligible);
      if ($("refCountRight")) $("refCountRight").textContent = String(eligible);
      if ($("refConfirmedInline")) $("refConfirmedInline").textContent = String(confirmed);
      if ($("refActiveInline")) $("refActiveInline").textContent = String(active);
      if ($("refEligibleInline")) $("refEligibleInline").textContent = String(eligible);`,
      `      const eligible = Number(j.eligibleRefs ?? j.referrals ?? j.count ?? 0) || 0;
      applyRefCountEligible(eligible);
      if ($("refConfirmedInline")) $("refConfirmedInline").textContent = String(confirmed);
      if ($("refActiveInline")) $("refActiveInline").textContent = String(active);`
    );
    n++;
  }

  if (!s.includes("const mergeCap = 5000;")) {
    s = s.replace(
      `    const merged = [];
    for (const key of allLegacyKeysForKind(kind)){
      merged.push(...readKey(key));
    }
    merged.push(...bankNow);

    const finalBank = dedupeLines(merged);`,
      `    const merged = [];
    const mergeCap = 5000;
    for (const key of allLegacyKeysForKind(kind)){
      if (merged.length >= mergeCap) break;
      merged.push(...readKey(key).slice(0, mergeCap - merged.length));
    }
    if (merged.length < mergeCap) merged.push(...bankNow.slice(0, mergeCap - merged.length));

    const finalBank = dedupeLines(merged).slice(0, mergeCap);`
    );
    n++;
  }

  if (!s.includes('trimKindToCap("gm")')) {
    s = s.replace(
      `    mergeImportedBank("gm", data.gm);
    mergeImportedBank("gn", data.gn);

    applyTheme(localStorage.getItem("gmx_theme")`,
      `    mergeImportedBank("gm", data.gm);
    mergeImportedBank("gn", data.gn);
    if (!isPro()){
      try{ trimKindToCap("gm"); trimKindToCap("gn"); }catch(_e){}
    }

    applyTheme(localStorage.getItem("gmx_theme")`
    );
    n++;
  }

  s = s.replace(/\n  function supportBundle\(\)\{[\s\S]*?return JSON\.stringify\(bundle, null, 2\);\n  \}\n\n  function logsBundle\(\)/, "\n  function logsBundle()");

  if (s.includes("toolSupport")) {
    s = s.replace(
      `    const supBtn = $("toolSupport");
    if (supBtn){
      supBtn.addEventListener("click", async ()=>{
        const data = supportBundle();
        await copyToClipboard(data);
        if (note) note.textContent = "Support bundle copied. Send it only if support asks for it.";
      });
    }

    const logsBtn`,
      "    const logsBtn"
    );
    n++;
  }

  if (s.includes('logEvent("support_logs"')) {
    s = s.replace(
      `        const out = logsBundle();
        const ta = $("supportOut");
        if (ta) ta.value = out;
        await copyToClipboard(out);
        if (note) note.textContent = "Logs copied. Send them only if support asks for them.";
        logEvent("support_logs", { size: out.length });`,
      `        const out = logsBundle();
        await copyToClipboard(out);
        if (note) note.textContent = "Logs copied to clipboard.";
        logEvent("pro_logs_copy", { size: out.length });`
    );
    n++;
  }

  s = s.replace(/\n    setPh\("supportOut","supportOut_ph",merged\);\n/, "\n");

  must(!s.includes("supportBundle"), "supportBundle still present");
  must(!s.includes("initWpLazyLoad"), "initWpLazyLoad still present");
  must(s.includes("applyRefCountEligible"), "applyRefCountEligible missing");

  return { s, n };
}

for (const rel of targets) {
  const file = path.join(root, rel);
  if (!fs.existsSync(file)) continue;
  const raw = fs.readFileSync(file, "utf8");
  const { s, n } = patchApp(raw);
  if (n > 0 || s !== raw) {
    fs.writeFileSync(file, s);
    console.log(`patched ${rel} (${n} change groups)`);
  } else {
    console.log(`ok ${rel} (already patched)`);
  }
}

for (const rel of ["public/app.html", "public/bridge/app.html", "frontend/public/app.html"]) {
  const file = path.join(root, rel);
  if (!fs.existsSync(file)) continue;
  let html = fs.readFileSync(file, "utf8");
  const next = html.replace(
    /<textarea id="supportOut"[^>]*><\/textarea>\s*\n/g,
    ""
  );
  if (next !== html) {
    fs.writeFileSync(file, next);
    console.log(`patched ${rel} (removed supportOut)`);
  }
}

console.log("done");
