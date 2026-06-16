  // ---- UI Translation (site language) ----
  // Important: Always apply the base catalog first, then override with the selected locale (fallback for all UI languages).
    // ---- UI Translation (site language) ----
  // Source of truth now lives in shared/i18n/locales/*.json and is generated into /public/i18n/siteI18n.js.
  const I18N = (globalThis.GMX_SITE_I18N && typeof globalThis.GMX_SITE_I18N.createSiteI18nCatalog === "function")
    ? globalThis.GMX_SITE_I18N.createSiteI18nCatalog()
    : { en: {} };

  function siteTr(key, fallback = ""){ return __gmxSiteI18nUi.siteTr(key, fallback); }
  function applyLang(){ return __gmxSiteI18nUi.applyLang(); }

  function getReferralUiCopy(lang){ return __gmxSiteI18nDynamic.getReferralUiCopy(lang); }
  function getGuideUiCopy(lang){ return __gmxSiteI18nDynamic.getGuideUiCopy(lang); }
  function renderGuideRightCopy(lang){ return __gmxSiteI18nDynamic.renderGuideRightCopy(lang); }
  function deriveReferralUnlocks(eligible, rawUnlocks){
    return __gmxSiteI18nDynamic.deriveReferralUnlocks(eligible, rawUnlocks);
  }
  function nextReferralUnlockAt(eligible){ return __gmxSiteI18nDynamic.nextReferralUnlockAt(eligible); }
  function nextReferralUnlockLabel(lang, step){
    return __gmxSiteI18nDynamic.nextReferralUnlockLabel(lang, step);
  }
  function renderReferralRightCopy(lang){ return __gmxSiteI18nDynamic.renderReferralRightCopy(lang); }
  function syncModePanelCopy(){ return __gmxSiteI18nDynamic.syncModePanelCopy(); }
  function patchDynamicCopy(lang, merged){ return __gmxSiteI18nDynamic.patchDynamicCopy(lang, merged); }


  function fillSelect(sel, arr){ return __gmxSiteLangMenu.fillSelect(sel, arr); }

  // --- init ---
  const { siteLangSel } = await __gmxSiteLangMenu.bootstrapSiteLangUi();

  applyLang();
  try{ syncBestModeUi(); }catch(_e){}
  try{ syncCleanFillUi(); }catch(_e){}
  pruneLegacyAdminPanels();

  __gmxSiteLangMenu.wireI18nObserver();

  updateLangFlags();

  // Track referral link clicks (promoter analytics)
  try{
    const ref = new URLSearchParams(location.search).get("ref");
    if (ref){
      fetch("/api/referral/click?ref=" + encodeURIComponent(ref)).catch(()=>{});
    }
  }catch{}

  window.addEventListener("message", (e)=>{
    try{
      if (!e || !e.data) return;
      if (e.data.type === "GMX_BEST_MODE_SYNC"){
        setBestMode(e.data.value === true, true);
        return;
      }
      if (e.data.type === "GMX_CLEAN_FILL_SYNC"){
        if (e.data.kind === "gm" || e.data.kind === "gn") setCleanFillEnabled(e.data.kind, e.data.value === true, true);
      }
    }catch(_e){}
  });

  __gmxSiteLangMenu.wireSiteLangSelectChange(siteLangSel);

  const { gmLangSel, gnLangSel } = __gmxSiteLangMenu.fillReplyLangSelects();

  // styles + theme (depend on SUB/REF_COUNT, but must exist before refreshUsage)
  fillStyles();
      fillPacks();
  applyTheme(localStorage.getItem("gmx_theme") || "classic");
  renderThemes();
  applyUserBg();
  initWallpapers();

  // initial language chips
  renderLangChips("gm");
  renderLangChips("gn");

  // referrals UI

  // default reply langs (persist per tab)
  const validReply = (v)=> REPLY_LANGS.some(([code])=>code===v) ? v : "en";
  const storedGm = localStorage.getItem(LS_GM_REPLY_LANG) || "en";
  const storedGn = localStorage.getItem(LS_GN_REPLY_LANG) || "en";
  if (gmLangSel) gmLangSel.value = validReply(storedGm);
  if (gnLangSel) gnLangSel.value = validReply(storedGn);

  if (gmLangSel) gmLangSel.addEventListener("change", ()=>{
    try{ localStorage.setItem(LS_GM_REPLY_LANG, gmLangSel.value); }catch{}
    updateLangFlags();
    if (gmView === "lang") ensureIndexed("gm", gmLangSel.value);
    renderList("gm");
    renderLangChips("gm");
  });
  if (gnLangSel) gnLangSel.addEventListener("change", ()=>{
    try{ localStorage.setItem(LS_GN_REPLY_LANG, gnLangSel.value); }catch{}
    updateLangFlags();
    if (gnView === "lang") ensureIndexed("gn", gnLangSel.value);
    renderList("gn");
    renderLangChips("gn");
  });

  const gmViewGlobalBtn = $("gmViewGlobal");
  if (gmViewGlobalBtn) gmViewGlobalBtn.onclick = ()=>{ if(requireConnected("GM")) setView("gm","global"); };
  const gmViewLangBtn = $("gmViewLang");
  if (gmViewLangBtn) gmViewLangBtn.onclick = ()=>{ if(requireConnected("GM")) setView("gm","lang"); };
  const gnViewGlobalBtn = $("gnViewGlobal");
  if (gnViewGlobalBtn) gnViewGlobalBtn.onclick = ()=>{ if(requireConnected("GN")) setView("gn","global"); };
  const gnViewLangBtn = $("gnViewLang");
  if (gnViewLangBtn) gnViewLangBtn.onclick = ()=>{ if(requireConnected("GN")) setView("gn","lang"); };

  const gmRand1Btn = $("gmRand1");
  if (gmRand1Btn) gmRand1Btn.onclick = ()=>{ if(requireConnected("GM")){ try{trackEvent("generate_click",{kind:"gm",count:1});}catch(_e){} generate("gm", 1); } };
  const gmRand10Btn = $("gmRand10");
  if (gmRand10Btn) gmRand10Btn.onclick = ()=>{ if(requireConnected("GM")){ try{trackEvent("generate_click",{kind:"gm",count:10});}catch(_e){} generate("gm", 10); } };
  const gmBestBtn = $("gmBestBtn");
  if (gmBestBtn) gmBestBtn.onclick = ()=>{ if(requireConnected("GM")){ try{trackEvent("best_click",{kind:"gm",mode:getBestMode()?"live":"saved"});}catch(_e){} (getBestMode() ? doBestServer("gm") : doBest("gm")); } };

  const gmBestModeToggle = $("gmBestModeToggle");
  if (gmBestModeToggle) gmBestModeToggle.onclick = ()=>{ setBestMode(!getBestMode()); };
  const gmCleanFillToggle = $("gmCleanFillToggle");
  if (gmCleanFillToggle) gmCleanFillToggle.onclick = ()=>{ setCleanFillEnabled("gm", !getCleanFillEnabled("gm")); };

  const gnRand1Btn = $("gnRand1");
  if (gnRand1Btn) gnRand1Btn.onclick = ()=>{ if(requireConnected("GN")){ try{trackEvent("generate_click",{kind:"gn",count:1});}catch(_e){} generate("gn", 1); } };
  const gnRand10Btn = $("gnRand10");
  if (gnRand10Btn) gnRand10Btn.onclick = ()=>{ if(requireConnected("GN")){ try{trackEvent("generate_click",{kind:"gn",count:10});}catch(_e){} generate("gn", 10); } };
  const gnBestBtn = $("gnBestBtn");
  if (gnBestBtn) gnBestBtn.onclick = ()=>{ if(requireConnected("GN")){ try{trackEvent("best_click",{kind:"gn",mode:getBestMode()?"live":"saved"});}catch(_e){} (getBestMode() ? doBestServer("gn") : doBest("gn")); } };

  const gnBestModeToggle = $("gnBestModeToggle");
  if (gnBestModeToggle) gnBestModeToggle.onclick = ()=>{ setBestMode(!getBestMode()); };
  const gnCleanFillToggle = $("gnCleanFillToggle");
  if (gnCleanFillToggle) gnCleanFillToggle.onclick = ()=>{ setCleanFillEnabled("gn", !getCleanFillEnabled("gn")); };

  const gmNewAddBtn = $("gmNewAdd");
  if (gmNewAddBtn) gmNewAddBtn.onclick = ()=>{ if(requireConnected("GM")) commitNewLine("gm"); };
  const gmNewLineInp = $("gmNewLine");
  if (gmNewLineInp) gmNewLineInp.addEventListener("keydown", (e)=>{ if(e.key==="Enter"){ e.preventDefault(); if(requireConnected("GM")) commitNewLine("gm"); } });
  const gmCleanupBtn = $("gmCleanup");
  if (gmCleanupBtn) gmCleanupBtn.onclick = ()=>{ if(requireConnected("GM")) oneClickCleanup("gm"); };
  const gmClearBtn = $("gmClear");
  if (gmClearBtn) gmClearBtn.onclick = ()=>{ if(requireConnected("GM")) clearView("gm"); };
  const gmClearAllBtn = $("gmClearAll");
  if (gmClearAllBtn) gmClearAllBtn.onclick = ()=>{ if(requireConnected("GM")) clearAll("gm"); };
  const gmPasteAddBtn = $("gmPasteAdd");
  if (gmPasteAddBtn) gmPasteAddBtn.onclick = ()=>{ if(requireConnected("GM")) addPasted("gm"); };

  const gnNewAddBtn = $("gnNewAdd");
  if (gnNewAddBtn) gnNewAddBtn.onclick = ()=>{ if(requireConnected("GN")) commitNewLine("gn"); };
  const gnNewLineInp = $("gnNewLine");
  if (gnNewLineInp) gnNewLineInp.addEventListener("keydown", (e)=>{ if(e.key==="Enter"){ e.preventDefault(); if(requireConnected("GN")) commitNewLine("gn"); } });
  const gnCleanupBtn = $("gnCleanup");
  if (gnCleanupBtn) gnCleanupBtn.onclick = ()=>{ if(requireConnected("GN")) oneClickCleanup("gn"); };
  const gnClearBtn = $("gnClear");
  if (gnClearBtn) gnClearBtn.onclick = ()=>{ if(requireConnected("GN")) clearView("gn"); };
  const gnClearAllBtn = $("gnClearAll");
  if (gnClearAllBtn) gnClearAllBtn.onclick = ()=>{ if(requireConnected("GN")) clearAll("gn"); };
  const gnPasteAddBtn = $("gnPasteAdd");
  if (gnPasteAddBtn) gnPasteAddBtn.onclick = ()=>{ if(requireConnected("GN")) addPasted("gn"); };

  // copy/export
  const gmCopyAllBtn = $("gmCopyAll");
  if (gmCopyAllBtn) gmCopyAllBtn.onclick = ()=>{ if(requireConnected("GM")) copyAll("gm"); };
  const gmExportBtn = $("gmExport");
  if (gmExportBtn) gmExportBtn.onclick = ()=>{ if(requireConnected("GM")) exportAll("gm"); };
  const gnCopyAllBtn = $("gnCopyAll");
  if (gnCopyAllBtn) gnCopyAllBtn.onclick = ()=>{ if(requireConnected("GN")) copyAll("gn"); };
  const gnExportBtn = $("gnExport");
  if (gnExportBtn) gnExportBtn.onclick = ()=>{ if(requireConnected("GN")) exportAll("gn"); };

  // filters (view only)
  const gmFilterInp = $("gmFilter");
  if (gmFilterInp) gmFilterInp.addEventListener("input", ()=>renderList("gm"));
  const gnFilterInp = $("gnFilter");
  if (gnFilterInp) gnFilterInp.addEventListener("input", ()=>renderList("gn"));
  const gmFilterClearBtn = $("gmFilterClear");
  if (gmFilterClearBtn) gmFilterClearBtn.onclick = ()=>{ if (gmFilterInp) gmFilterInp.value=""; renderList("gm"); };
  const gnFilterClearBtn = $("gnFilterClear");
  if (gnFilterClearBtn) gnFilterClearBtn.onclick = ()=>{ if (gnFilterInp) gnFilterInp.value=""; renderList("gn"); };

  // Quick presets: Casual / Pro / Fun
  document.querySelectorAll(".quickPresets [data-preset]").forEach(btn=>{
    btn.onclick = ()=>{
      const wrap = btn.closest(".quickPresets");
      const kind = wrap?.dataset?.kind || "gm";
      const preset = btn.dataset.preset || "casual";
      const modeEl = kind==="gm" ? $("gmMode") : $("gnMode");
      const styleEl = kind==="gm" ? $("gmStyle") : $("gnStyle");
      const packEl = kind==="gm" ? $("gmPack") : $("gnPack");
      if (preset==="casual"){ if(modeEl) modeEl.value="mid"; if(styleEl) styleEl.value="classic"; if(packEl) packEl.value="classic"; }
      else if (preset==="pro"){ if(modeEl) modeEl.value="mid"; if(styleEl) styleEl.value="alpha"; if(packEl) packEl.value="king"; }
      else if (preset==="fun"){ if(modeEl) modeEl.value="min"; if(styleEl) styleEl.value="cheer"; if(packEl) packEl.value="classic"; }
      wrap?.querySelectorAll("[data-preset]").forEach(b=>b.classList.toggle("active", b===btn));
    };
  });

  // Ctrl+Enter = Batch 10 when on GM/GN tab
  document.addEventListener("keydown", (e)=>{
    if (!(e.ctrlKey||e.metaKey) || e.key!=="Enter") return;
    const active = $("t_gm")?.classList.contains("active") ? "gm" : ($("t_gn")?.classList.contains("active") ? "gn" : null);
    if (!active) return;
    const target = e.target; if (!target) return;
    const inGM = active==="gm" && target.closest("#tab-gm");
    const inGN = active==="gn" && target.closest("#tab-gn");
    if (inGM && getHandle()){ e.preventDefault(); generate("gm", 10); }
    else if (inGN && getHandle()){ e.preventDefault(); generate("gn", 10); }
  });

  // draft autosave
  const gmPaste = $("gmPaste");
  const gnPaste = $("gnPaste");
  if (gmNewLineInp) gmNewLineInp.addEventListener("input", ()=>saveDraft("gm"));
  if (gnNewLineInp) gnNewLineInp.addEventListener("input", ()=>saveDraft("gn"));
  if (gmPaste) gmPaste.addEventListener("input", ()=>saveDraft("gm"));
  if (gnPaste) gnPaste.addEventListener("input", ()=>saveDraft("gn"));


  // Add wallpaper (themes - custom upload in wallpapers tab)
  const wpAddCustom = $("wpAddCustom");
  const wpAddFile = $("wpAddFile");
  if (wpAddCustom && wpAddFile){
    wpAddCustom.onclick = ()=>{ if (requireConnected("Themes")) wpAddFile.click(); };
  }
  if (wpAddFile){
    wpAddFile.addEventListener("change", async ()=>{
      try{
        if (!requireConnected("Themes")) { wpAddFile.value = ""; return; }
        const f = wpAddFile.files && wpAddFile.files[0];
        if (!f) return;
        const data = await compressImageToJpegDataURL(f, { profile: "site" });
        localStorage.setItem(LS_CUSTOM_BG_GLOBAL, data);
        const targetTab = ($("wpTab")?.value || "all");
        if (targetTab === "all") localStorage.setItem(LS_WP_GLOBAL, CUSTOM_UPLOAD_ID);
        else setWallpaperForTab(targetTab, CUSTOM_UPLOAD_ID);
        try{ renderWallpaperUI(); }catch{}
        const previewTab = (targetTab === "all") ? currentTabName() : targetTab;
        applyWallpaper(previewTab);
        applyUserBg(previewTab);
        toast("ok", (t("toast_custom_bg_saved")||"Custom wallpaper saved."));
      }catch(e){
        toast("warn", (t("err_custom_wp_save")||"Could not save image (too large or blocked)."));
      }finally{
        wpAddFile.value = "";
      }
    });
  }
  function pushRecent(kind, keys){ return __gmxAnti.pushRecent(kind, keys); }

  function repeatKey(s, strength){ return __gmxGen.repeatKey(s, strength); }

  function buildBanSet(kind, key, strength){ return __gmxAnti.buildBanSet(kind, key, strength); }

  function filterAntiRepeat(kind, key, lines){
    return __gmxAnti.filterLines(kind, key, lines, getAntiStrength(kind));
  }

  
  const CLEAN_FILL_INFLIGHT = { gm:false, gn:false };

  function dedupeLinesByShape(lines, strength){
    return __gmxGen.dedupeLinesByShape(lines, strength);
  }

  async function dedupeLinesByShapeAsync(lines, strength, yieldEvery){
    const out = [];
    const seenExact = new Set();
    const seenShape = new Set();
    const step = Math.max(40, Number(yieldEvery) || 180);
    let scanned = 0;
    for (const raw of (lines || [])){
      scanned++;
      const t = normalizeLine(raw);
      if (!t) {
        if ((scanned % step) === 0) await yieldToUiFrame();
        continue;
      }
      const exact = t.toLowerCase();
      if (seenExact.has(exact)) {
        if ((scanned % step) === 0) await yieldToUiFrame();
        continue;
      }
      const shape = repeatKey(t, Math.max(1, strength));
      if (shape && seenShape.has(shape)) {
        if ((scanned % step) === 0) await yieldToUiFrame();
        continue;
      }
      seenExact.add(exact);
      if (shape) seenShape.add(shape);
      out.push(t);
      if ((scanned % step) === 0) await yieldToUiFrame();
    }
    return out;
  }

  async function refillCleanFill(kind, targetCount, opts){
    const key = activeKey(kind);
    const { mode, lang, style, antiN } = readGenParams(kind);

    const before = readKey(key);
    const cleaned = await dedupeLinesByShapeAsync(before, CLEAN_FILL_STRENGTH, 200);
    const removed = Math.max(0, before.length - cleaned.length);
    let cur = cleaned.slice();
    writeKey(key, cur);
    await yieldToUiFrame();

    const remSlotsNow = remainingSlots(kind);
    let desiredTotal = Number.isFinite(targetCount) ? Math.max(0, Math.trunc(targetCount)) : before.length;
    if (remSlotsNow !== Infinity){
      desiredTotal = Math.min(cur.length + remSlotsNow, desiredTotal);
    }
    desiredTotal = Math.max(cur.length, desiredTotal);

    const exactSeen = new Set(cur.map(s=>String(s||"").trim().toLowerCase()).filter(Boolean));
    const shapeSeen = new Set(cur.map(s=>repeatKey(s, CLEAN_FILL_STRENGTH)).filter(Boolean));
    const addedShapeKeys = [];
    let refilled = 0;
    let attempts = 0;
    let stalled = 0;
    const refillDeadline = Date.now() + 45000;
    while (cur.length < desiredTotal && attempts < 3){
      if (Date.now() > refillDeadline) break;
      attempts++;
      const missing = desiredTotal - cur.length;
      const reqCount = Math.min(180, missing + 50 + (stalled * 20));
      const bulk = await api(`/api/generate-bulk?kind=${kind}&mode=${encodeURIComponent(mode)}&lang=${encodeURIComponent(lang)}&style=${encodeURIComponent(style)}&anti_last_n=${encodeURIComponent(antiN)}&count=${reqCount}`, "GET", null, { signal: opts?.signal, timeoutMs: 12000 });
      const list = Array.isArray(bulk?.list) ? bulk.list : [];
      if (!list.length) {
        stalled++;
        if (stalled >= 2) break;
        continue;
      }
      let progress = 0;
      let scannedBatch = 0;
      for (const raw of list){
        scannedBatch++;
        const t = normalizeLine(raw);
        if (!t) continue;
        const exact = t.toLowerCase();
        if (exactSeen.has(exact)) continue;
        const shape = repeatKey(t, CLEAN_FILL_STRENGTH);
        if (shape && shapeSeen.has(shape)) continue;
        exactSeen.add(exact);
        if (shape){
          shapeSeen.add(shape);
          addedShapeKeys.push(shape);
        }
        cur.push(t);
        refilled++;
        progress++;
        if ((scannedBatch % 120) === 0) await yieldToUiFrame();
        if (cur.length >= desiredTotal) break;
      }
      if (progress <= 0) {
        stalled++;
        if (stalled >= 2) break;
        continue;
      }
      stalled = 0;
    }

    writeKey(key, cur);
    if (addedShapeKeys.length) pushRecent(kind, addedShapeKeys);
    return { removed, refilled, finalCount: cur.length, targetCount: desiredTotal };
  }

  async function oneClickCleanup(kind, opts){
    const msgEl = kind==="gm" ? $("gmMsg") : $("gnMsg");
    if (!getHandle()){
      tab("home");
      return { removed:0, refilled:0, finalCount:0, targetCount:0 };
    }
    if (CLEAN_FILL_INFLIGHT[kind]) return null;
    const key = activeKey(kind);
    const cur = readKey(key);
    const targetCount = Number.isFinite(opts?.targetCount) ? Math.max(0, Math.trunc(opts.targetCount)) : cur.length;
    if (!cur.length && targetCount <= 0){
      if (msgEl && !opts?.silent) msgEl.innerHTML = `<span class="muted">Nothing saved yet.</span>`;
      return { removed:0, refilled:0, finalCount:0, targetCount:0 };
    }

    CLEAN_FILL_INFLIGHT[kind] = true;
    try{
      if (msgEl && !opts?.silent) msgEl.innerHTML = `<span class="muted">Best pass...</span>`;
      const res = await refillCleanFill(kind, targetCount, opts || {});
      renderList(kind);
      if (msgEl && !opts?.keepMessage){
        if (res.finalCount >= res.targetCount){
          msgEl.innerHTML = `<span class="ok">Best pass removed ${res.removed} and refilled ${res.refilled}. Bank now has ${res.finalCount}/${res.targetCount}.</span>`;
        } else {
          msgEl.innerHTML = `<span class="warn">Best pass removed ${res.removed} and refilled ${res.refilled}. Bank finished at ${res.finalCount}/${res.targetCount}. Try another tone or preset for a wider pool.</span>`;
        }
      }
      return res;
    } catch(e){
      const m = (e && e.message) ? e.message : "failed";
      if (msgEl && !opts?.keepMessage) msgEl.innerHTML = `<span class="bad">${escapeHtml(m)}</span>`;
      return { removed:0, refilled:0, finalCount:cur.length, targetCount };
    } finally {
      CLEAN_FILL_INFLIGHT[kind] = false;
    }
  }

function cleanupKeyLines(lines){
    return dedupeLinesByShape((lines||[]).filter(Boolean), CLEAN_FILL_STRENGTH);
  }

  function setRangeText(id, v){
    const el = $(id);
    if (el) el.textContent = String(v);
  }

  function normalizeLine(s){ return __gmxGen.normalizeLine(s); }

  function dedupeLines(lines){ return __gmxGen.dedupeLines(lines); }

  function normalizeKind(kind){
    let changed = 0;
    for (const k of allKeysForKind(kind)){
      const before = readKey(k);
      const after = before.map(normalizeLine).filter(Boolean);
      if (after.join("\n") !== before.join("\n")){
        writeKey(k, after);
        changed++;
      }
    }
    return changed;
  }

  function cleanupKind(kind){
    let changed = 0;
    for (const k of allKeysForKind(kind)){
      const before = readKey(k);
      const after = cleanupKeyLines(before).map(normalizeLine).filter(Boolean);
      if (after.join("\n") !== before.join("\n")){
        writeKey(k, after);
        changed++;
      }
    }
    return changed;
  }

  function dedupeKind(kind){
    let changed = 0;
    for (const k of allKeysForKind(kind)){
      const before = readKey(k);
      const after = dedupeLines(before);
      if (after.join("\n") !== before.join("\n")){
        writeKey(k, after);
        changed++;
      }
    }
    return changed;
  }

  function exportData(){
    const gmBank = readKey(getBankKey("gm"));
    const gnBank = readKey(getBankKey("gn"));
    const data = {
      v: 2,
      handle: getHandle(),
      theme: localStorage.getItem("gmx_theme") || "classic",
      customBg: localStorage.getItem(LS_CUSTOM_BG_GLOBAL) || null,
      gm: { bank: gmBank, index: [], global: gmBank, langs: {} },
      gn: { bank: gnBank, index: [], global: gnBank, langs: {} }
    };
    return JSON.stringify(data);
  }

  function importData(jsonText){
    const data = JSON.parse(jsonText);
    if (!data || typeof data !== "object") throw new Error("bad_json");
    if (!data.gm || !data.gn) throw new Error("missing_sections");

    if (data.theme) localStorage.setItem("gmx_theme", String(data.theme));
    if ("customBg" in data){
      if (data.customBg) localStorage.setItem(LS_CUSTOM_BG_GLOBAL, String(data.customBg));
      else localStorage.removeItem(LS_CUSTOM_BG_GLOBAL);
    }

    const mergeImportedBank = (kind, payload)=>{
      const direct = Array.isArray(payload?.bank) ? payload.bank : [];
      const legacyGlobal = Array.isArray(payload?.global) ? payload.global : [];
      const legacyLangs = (payload?.langs && typeof payload.langs === "object") ? payload.langs : {};
      const merged = [];
      merged.push(...direct);
      merged.push(...legacyGlobal);
      for (const arr of Object.values(legacyLangs)){
        if (Array.isArray(arr)) merged.push(...arr);
      }
      for (const k of Array.from(new Set([...allLegacyKeysForKind(kind), getBankKey(kind)]))) localStorage.removeItem(k);
      setLangIndex(kind, []);
      writeKey(getBankKey(kind), dedupeLines(merged));
      try{ localStorage.setItem(kind === "gm" ? LS_GM_REPLY_LANG : LS_GN_REPLY_LANG, "en"); }catch{}
      try{ localStorage.setItem(getBankMigrationKey(kind), "1"); }catch{}
    };

    mergeImportedBank("gm", data.gm);
    mergeImportedBank("gn", data.gn);
    if (!isPro()){
      try{ trimKindToCap("gm"); trimKindToCap("gn"); }catch(_e){}
    }

    applyTheme(localStorage.getItem("gmx_theme") || "classic");
    applyUserBg();
    initWallpapers();
    renderThemes();
    fillStyles();
    fillPacks();
    renderLangChips("gm"); renderLangChips("gn");
    renderList("gm"); renderList("gn");
  }

  async function copyToClipboard(text){
    try{
      await navigator.clipboard.writeText(text);
      return true;
    }catch{
      // fallback
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      try{ document.execCommand("copy"); }catch{}
      ta.remove();
      return true;
    }
  }

  function bindProTools(){
    const note = $("pro_tools_note");
    const gate = ()=>{
      if (!isPro()){
        if (note) note.textContent = (I18N[localStorage.getItem(LS_SITE_LANG)||"en"]?.pro_tools_note) || (I18N.en?.pro_tools_note) || "Pro-only tools.";
        return false;
      }
      if (note) note.textContent = "";
      return true;
    };

    const on = (id, fn)=>{
      const el = $(id);
      if (!el) return;
      el.addEventListener("click", async ()=>{
        if (!gate()) return;
        try{
          const msg = fn();
          if (note) note.textContent = msg || "Done.";
        }catch(e){
          if (note) note.textContent = "Failed: " + (e && e.message ? e.message : "error");
        }
      });
    };

        on("toolCleanupGm", ()=> `GM: cleaned ${cleanupKind("gm")} list(s).`);
    on("toolCleanupGn", ()=> `GN: cleaned ${cleanupKind("gn")} list(s).`);

    const expBtn = $("toolExport");
    if (expBtn){
      expBtn.addEventListener("click", async ()=>{
        if (!gate()) return;
        const data = exportData();
        await copyToClipboard(data);
        if (note) note.textContent = "Export copied to clipboard (JSON).";
      });
    }
    const impBtn = $("toolImport");
    if (impBtn){
      impBtn.addEventListener("click", ()=>{
        if (!gate()) return;
        const v = prompt("Paste export JSON here:");
        if (!v) return;
        try{
          importData(v);
          if (note) note.textContent = "Import complete.";
        }catch(e){
          if (note) note.textContent = "Import failed: " + (e && e.message ? e.message : "error");
        }
      });
    }
  }


  function bindProControls(){
    // packs
    const bindPack = (kind)=>{
      const sel = kind==="gm" ? $("gmPack") : $("gnPack");
      const btn = kind==="gm" ? $("gmPackApply") : $("gnPackApply");
      const msgEl = kind==="gm" ? $("gmMsg") : $("gnMsg");
      if (sel){
        sel.addEventListener("change", ()=>{
          const pid = sel.value || "classic";
          localStorage.setItem(lsKeyPack(kind), pid);
          logEvent("pack_change", { kind, pack: pid });
          const packs = packsForKind(kind);
          const idx = packs.findIndex(x=>x.id===pid);
          const locked = (!isPro() && idx >= unlockedPacksCountFor(kind));
          if (!locked){
            const packRow = packs.find(x=>x.id===pid) || packs[0];
            applyPackDefaultsToUi(kind, packRow);
          }
        });
      }
      if (btn){
        btn.addEventListener("click", ()=>{
          const pid = sel ? (sel.value || "classic") : "classic";
          const packs = packsForKind(kind);
          const p = packs.find(x=>x.id===pid) || packs[0];
          const idx = packs.findIndex(x=>x.id===pid);
          const locked = (!isPro() && idx >= unlockedPacksCountFor(kind));
          if (locked){
            if (msgEl) msgEl.innerHTML = `<span class="warn">Pack is locked. Upgrade to Pro or unlock via referrals.</span>`;
            return;
          }
          applyPackDefaultsToUi(kind, p);

          if (msgEl) msgEl.innerHTML = `<span class="ok">Applied pack: ${escapeHtml(p.name)}</span>`;
          logEvent("pack_apply", { kind, pack: pid });
        });
      }
    };

    const bindRanges = (_kind)=>{};

    // initial sync hook kept only for compatibility after removing the old anti-repeat slider.
    const sync = (_kind)=>{};

    ["gm","gn"].forEach(kind=>{
      bindPack(kind);
      bindRanges(kind);
      sync(kind);
    });

    // Expose a safe re-sync hook after subscription/referral refresh
    try{ window.__syncProControls = ()=>{ ["gm","gn"].forEach(sync); }; } catch {}
  }

  // Light/Dark mode (site-only)
  const LS_SITE_MODE = K.SITE_MODE;
  function applySiteMode(mode, persist){
    const m = (mode === "light") ? "light" : "dark";
    document.documentElement.classList.toggle("mode-light", m === "light");
    if (persist){ try{ localStorage.setItem(LS_SITE_MODE, m); }catch{} }
    const btn = $("btnMode");
    if (btn) btn.textContent = (m === "light") ? "Dark" : "Light";
  }
  function initModeToggle(){
    const btn = $("btnMode");
    if (!btn) return;
    let m = "dark";
    try{ m = localStorage.getItem(LS_SITE_MODE) || ""; }catch{}
    if (!m) m = document.documentElement.classList.contains("mode-light") ? "light" : "dark";
    applySiteMode(m, false);
    btn.addEventListener("click", ()=>{
      const now = document.documentElement.classList.contains("mode-light") ? "light" : "dark";
      applySiteMode(now === "light" ? "dark" : "light", true);
    });
  }

  bindProTools();
  bindProControls();

  if (typeof window !== "undefined" && /^(127\.0\.0\.1|localhost)$/.test(location.hostname)) {
    window.__GMX_TEST__ = Object.assign(window.__GMX_TEST__ || {}, {
      activeKey,
      writeKey,
      readKey,
      renderList,
      oneClickCleanup,
      refillCleanFill,
      getHandle,
      setCleanFillEnabled,
      getCleanFillEnabled,
      normalizeLine,
      dedupeLines
    });
  }

  AUTH_OK = !!(getHandle() && getToken());

  // restore session if exists
  $("handlePill").textContent = getHandle() ? getHandle() : "not set";
  $("xHandle").value = getHandle() || "";

  applyAdminVisibility();
  try{ initModeToggle(); }catch(e){}
  applyLang();
  try{ initThemeWallTabs(); }catch{}
  try{ bindExtTabs(); }catch{}
  try{ initExtWallpaperControls(); }catch{}
  try{ normalizeStoredExtWallpaperSelections(); }catch{}
  try{ migrateLegacyWallpaperSelectionOnce(); }catch{}
  try{ migrateLegacyExtWallpaperSelectionOnce(); }catch{}
  try{ renderExtThemes(); }catch{}
  try{ renderExtWallpapers(); }catch{}
  try{ renderExtCustomBgUI(); }catch{}
  try{ setExtView(normalizeExtViewValue(localStorage.getItem(LS_EXT_VIEW) || "theme"), { force:true, silent:true }); }catch{}
  restoreDrafts();

  let bootTab = "home";
  try{
    const storedTab = String(localStorage.getItem(LS_LAST_TAB) || "").trim();
    bootTab = normalizeTopLevelTab(storedTab || "home");
  }catch{}
  tab(bootTab);
  __gmxTabState.setCurrentTab(bootTab);
  setBg(bootTab);

  ping();
  loadBuild();
  try{ bindWalletTab(); }catch(e){}
  try{ bindLimitModal(); }catch(e){}
  try{ bindPaySuccess(); }catch(e){}
  try{ loadPlans(); }catch(e){}
  try{ loadBillingProof(); }catch(e){}
  try{ bindHelpModal(); }catch(e){}
  try{ watchBuildUpdates(); }catch(e){}

  // Only refresh protected stats when we successfully obtained a token.
  // If init fails (API down, invalid handle, etc.) we keep the UI usable and avoid noisy 401s.
  if (getHandle()){
    initSession(false).then(async (tok)=>{
      if (!tok) return;
      try{ await refreshUsage(); }catch{}
      // Plans & proof are public; already loaded above.
    }).catch(()=>{});
  }

  try{ migrateLegacyBank("gm"); }catch(e){}
  try{ migrateLegacyBank("gn"); }catch(e){}

  renderList("gm");
  renderList("gn");

    try{ initProTabs(); }catch(e){}
INIT_DONE = true;

// --- Stability watchdog (auto-recover from unexpected runtime crashes) ---
(function(){
  const KEY = "gmx_autorecover_v1";
  function read(){
    try{ return JSON.parse(localStorage.getItem(KEY) || "{}"); }catch(e){ return {}; }
  }
  function write(v){
    try{ localStorage.setItem(KEY, JSON.stringify(v)); }catch(e){}
  }
  function shouldReload(){
    const now = Date.now();
    const s = read();
    const arr = Array.isArray(s.reloads) ? s.reloads : [];
    const fresh = arr.filter(ts => (now - ts) < 10*60*1000);
    if (fresh.length >= 3) return false; // prevent reload loops
    fresh.push(now);
    s.reloads = fresh;
    write(s);
    return true;
  }
  function scheduleReload(){
    if (window.__gmxRecovering) return;
    if (!shouldReload()) return;
    window.__gmxRecovering = true;
    try{
      try{ if (typeof toast === "function") toast("warn", "Recovering... reloading", 2500); }catch{}
    }catch{}
    setTimeout(()=>{ try{ location.reload(); }catch{} }, 1200);
  }
  window.addEventListener("error", (e)=>{
    // Ignore extremely noisy non-critical errors
    const msg = String(e?.message || "");
    if (msg.includes("ResizeObserver") || msg.includes("Non-Error promise rejection")) return;
    // Never auto-reload on expected network/API errors (we show degraded mode instead)
    if (msg.includes("Failed to fetch") || msg.includes("NetworkError") || msg.includes("request_failed") || msg.includes("timeout")){
      try{ if (typeof setDegraded === "function") setDegraded(true, "API/network issue. You can still edit lists locally."); }catch{}
      return;
    }
    scheduleReload();
  });
  window.addEventListener("unhandledrejection", (e)=>{
    const msg = String(e?.reason?.message || e?.reason || "");
    if (msg.includes("ResizeObserver")) return;
    if (msg.includes("Failed to fetch") || msg.includes("NetworkError") || msg.includes("request_failed") || msg.includes("timeout") || msg.includes("not_connected")){
      try{ if (typeof setDegraded === "function") setDegraded(true, "API/network issue. You can still edit lists locally."); }catch{}
      return;
    }
    scheduleReload();
  });
})();
