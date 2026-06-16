  function mergeAppendUnique(existing, newLines){
    return __gmxGen.mergeAppendUnique(existing, newLines);
  }
async function generate(kind, count){
    if (!requireConnected(kind==="gm"?"GM":"GN")) return;
    const msgElEarly = kind==="gm" ? $("gmMsg") : $("gnMsg");
    if (!getToken() && getHandle()){
      try{ await initSession(true); }catch(_e){}
    }
    if (!getToken()){
      if (msgElEarly) msgElEarly.innerHTML = `<span class="warn">${escapeHtml(siteTr("gen_session_expired", "Session expired — reconnect your @handle, then retry."))}</span>`;
      return;
    }
    const h = getHandle();

    const modeEl  = kind==="gm" ? $("gmMode") : $("gnMode");
    const styleEl = kind==="gm" ? $("gmStyle") : $("gnStyle");
    const packEl  = kind==="gm" ? $("gmPack") : $("gnPack");

    const mode = modeEl ? modeEl.value : "mid";
    const lang = currentLang(kind);

    let style = styleEl ? styleEl.value : "classic";
    const packs = (typeof packsForKind === "function") ? packsForKind(kind) : (PACKS || []);
    const packId = packEl ? (packEl.value || "classic") : "classic";
    const packIdx = packs.findIndex(p=>p.id===packId);
    const packLocked = (!isPro() && packIdx >= unlockedPacksCountFor(kind));
    const pack = packs.find(p=>p.id===packId) || packs[0] || null;

    const msgEl = kind==="gm" ? $("gmMsg") : $("gnMsg");

    const strength = getAntiStrength(kind);
    const antiN = antiWindow(strength);
    const autoClean = (count <= 1) ? getCleanFillEnabled(kind) : false;

    if ((kind==="gm" ? gmView : gnView) === "lang") ensureIndexed(kind, lang);

    // Reply tone + Size use the live dropdowns (pack preset applies via UI / pack change).
    if (!styleEl) style = pack && pack.style ? pack.style : style;
    if (!modeEl && pack && pack.mode) mode = pack.mode;

    const keyActive = activeKey(kind);
    const keyGlobal = getGlobalKey(kind);
    const beforeCount = readKey(keyActive).length;

    // Respect save cap (70) for Free. Editing remains unlimited.
    const remSlots = remainingSlots(kind);
    const effCount = (remSlots === Infinity) ? count : Math.max(0, Math.min(count, remSlots));
    
if (effCount <= 0){
  if (msgEl) msgEl.innerHTML = `<span class="warn">Free save limit reached (${saveCap()}). You can still copy lines, but no saved line will be replaced automatically.</span>`;
  postEvent('limit_hit', { where:'save_cap', kind });
  renderList(kind);
  return;
}

      if (INFLIGHT[kind]){
      if (msgEl) msgEl.innerHTML = '<span class="muted">Working...</span>';
      return;
    }
    INFLIGHT[kind] = true;
    try{ window.__i18nPause = true; }catch{}
    setBusy(kind, true, count > 1 ? `Adding ${effCount}…` : "Working...");
    try{ if (ABORT[kind]) ABORT[kind].abort(); }catch{}
    const ctrl = new AbortController();
    ABORT[kind] = ctrl;

    let didRender = false;
    try{
      if (count === 1){
        const tries = Math.max(1, Math.min(4, 1 + Math.floor(strength/2)));
        let reply = null;

        for (let t=0; t<tries; t++){
          const j = await api(`/api/generate?kind=${kind}&mode=${encodeURIComponent(mode)}&lang=${encodeURIComponent(lang)}&style=${encodeURIComponent(style)}&anti_last_n=${encodeURIComponent(antiN)}`, "GET", null, { signal: ctrl.signal, timeoutMs: 20000 });
          const candidate = j.reply || "";
          const filtered = filterAntiRepeat(kind, keyActive, [candidate]);
          if (filtered.length){
            reply = filtered[0];
            break;
          }
        }

        if (!reply){
          // fallback: take one even if it repeats
          const j = await api(`/api/generate?kind=${kind}&mode=${encodeURIComponent(mode)}&lang=${encodeURIComponent(lang)}&style=${encodeURIComponent(style)}&anti_last_n=${encodeURIComponent(antiN)}`, "GET", null, { signal: ctrl.signal, timeoutMs: 20000 });
          reply = j.reply || "";
        }

        if (!String(reply || "").trim()){
          if (msgEl) msgEl.innerHTML = `<span class="warn">${escapeHtml(t("gen_empty_reply") || "Server returned an empty line. Try another tone or preset.")}</span>`;
          return;
        }

        const cur = readKey(keyActive);
        const r = String(reply||"").trim();
        if (__gmxGen.isLineAlreadySaved(cur, r, strength)){
          renderList(kind);
          didRender = true;
          if (msgEl) msgEl.innerHTML = `<span class="muted">Duplicate ignored.</span>`;
          return;
        }
        if (remainingSlots(kind) <= 0){
  if (msgEl) msgEl.innerHTML = `<span class="warn">Free save limit reached (${saveCap()} lines). You can still copy lines, but no saved line will be replaced automatically.</span>`;
  postEvent('limit_hit', { where:'save_cap', kind });
  renderList(kind);
  return;
}
        cur.push(r);
        writeKey(keyActive, cur);

        pushRecent(kind, [repeatKey(reply, Math.max(1, strength))]);
        if (!autoClean){
          renderList(kind);
          didRender = true;
        }
        msgEl.innerHTML = `<span class="ok">Added 1</span>`;
        logEvent("gen_one", { kind, lang, style, pack: packId, view: (kind==="gm"?gmView:gnView) });
        try{ await refreshUsage(); }catch{}
      } else {
        // Bulk generate as loose random fill first. Best pass is an optional second pass.
        const accepted = [];
        const takeLines = (arr)=>{
          const chunk = __gmxGen.collectBulkUniqueLines([...readKey(keyActive), ...accepted], arr, effCount - accepted.length);
          if (chunk.length) accepted.push(...chunk);
        };

        const buffer = 12;
        const genDeadline = Date.now() + 22000;
        let attempts = 0;
        while (accepted.length < effCount && attempts < 4){
          if (Date.now() > genDeadline) break;
          attempts++;
          const missing = effCount - accepted.length;
          const reqCount = Math.min(48, missing + buffer);
          const bulk = await api(`/api/generate-bulk?kind=${kind}&mode=${encodeURIComponent(mode)}&lang=${encodeURIComponent(lang)}&style=${encodeURIComponent(style)}&anti_last_n=${encodeURIComponent(antiN)}&count=${reqCount}`, "GET", null, { signal: ctrl.signal, timeoutMs: 15000 })
          await yieldToUiFrame();;
          takeLines(bulk.list || []);
          if (!Array.isArray(bulk.list) || bulk.list.length === 0) break;
        }

        const incoming = accepted.slice();
        const preferBest = autoClean || getBestMode();
        let selected = [];
        if (preferBest){
          selected = __gmxGen.selectBestByShape(kind, incoming, Math.max(1, strength)).slice(0, effCount);
        } else {
          selected = incoming.slice(0, effCount).sort(()=>Math.random()-0.5);
        }

        const applyToKey = (k, list)=>{
          if (!list || !list.length) return;
          const cur = readKey(k);
          const merged = mergeAppendUnique(cur, list);
          writeKey(k, merged);
        };
        applyToKey(keyActive, selected);
        pushRecent(kind, selected.map(x=>repeatKey(x, Math.max(1, CLEAN_FILL_STRENGTH))));
        renderList(kind);

        let added = Math.max(0, readKey(keyActive).length - beforeCount);
        let cleanRes = null;
        if (autoClean){
          const targetTotal = (remSlots === Infinity) ? (beforeCount + effCount) : Math.min(saveCap(), beforeCount + effCount);
          cleanRes = await oneClickCleanup(kind, { targetCount: targetTotal, silent: true, keepMessage: true, signal: ctrl.signal });
          renderList(kind);
          didRender = true;
          added = Math.max(0, (cleanRes?.finalCount ?? readKey(keyActive).length) - beforeCount);
        }

        if (autoClean && cleanRes){
          if (cleanRes.finalCount >= cleanRes.targetCount){
            msgEl.innerHTML = `<span class="ok">Added ${added}</span> <span class="muted small">(Best pass removed ${cleanRes.removed}, refilled ${cleanRes.refilled})</span>`;
          } else {
            msgEl.innerHTML = `<span class="warn">Added ${added}. Best pass removed ${cleanRes.removed}, refilled ${cleanRes.refilled}, final ${cleanRes.finalCount}/${cleanRes.targetCount}. Try another tone or preset for a wider pool.</span>`;
          }
        } else if (added < effCount){
          msgEl.innerHTML = `<span class="warn">Added ${added}/${effCount}. Random fill stopped early because the pool got too narrow. Change tone or preset for a wider pull.</span>`;
        } else {
          msgEl.innerHTML = `<span class="ok">Added ${added}</span> <span class="muted small">Run Best pass manually if you want cleanup/refill.</span>`;
        }
        logEvent("gen_bulk", { kind, lang, style, pack: packId, count: effCount, view: (kind==="gm"?gmView:gnView), cleanFill: autoClean });
        try{ await refreshUsage(); }catch{}
      }
    } catch(e){
      const m = (e && e.message) ? e.message : "failed";
      const friendly = friendlyUiErrorMessage(m, { scope:"generate" });
      if (msgEl) msgEl.innerHTML = `<span class="bad">${escapeHtml(friendly)}</span>`;
      try{ toast("bad", `<b>Generate failed:</b> ${escapeHtml(friendly)}`); }catch(_e){}
      logEvent("gen_error", { kind, err: m, friendly });
    } finally {
      INFLIGHT[kind] = false;
      try{ window.__i18nPause = false; }catch{}
      try{ ABORT[kind] = null; }catch{}
      setBusy(kind, false);
      if (!didRender){
        try{ renderList(kind); }catch{}
      }
    }
  }

  

let REF_STATS_CACHE = null;
let REF_STATS_LAST_AT = 0;
let REF_STATS_PROMISE = null;
let REF_STATS_TIMER = null;
let REF_STATS_SCHEDULED_AT = 0;

function revealReferralLinkUi(){
  try{ $("refTopRow")?.classList.remove("link-hidden"); }catch(e){}
  try{ $("refLinkCol")?.classList.remove("is-hidden"); }catch(e){}
}

function scheduleRefStatsRefresh(delay=180){
  const now = Date.now();
  if (REF_STATS_PROMISE) return;
  if (REF_STATS_CACHE && (now - REF_STATS_LAST_AT) < 8000) return;
  if (REF_STATS_TIMER && (now - REF_STATS_SCHEDULED_AT) < 900) return;
  try{ if (REF_STATS_TIMER) clearTimeout(REF_STATS_TIMER); }catch(e){}
  REF_STATS_SCHEDULED_AT = now;
  REF_STATS_TIMER = setTimeout(()=>{
    REF_STATS_TIMER = null;
    Promise.resolve().then(()=>refreshRefStats()).catch(()=>{});
  }, Math.max(160, Number(delay)||220));
}

async function refreshRefStats(force=false){
  if (!getHandle()) return null;
  const now = Date.now();
  if (!force){
    if (REF_STATS_PROMISE) return REF_STATS_PROMISE;
    if (REF_STATS_CACHE && (now - REF_STATS_LAST_AT) < 8000) return REF_STATS_CACHE;
  }
  REF_STATS_PROMISE = (async ()=>{
    try{
      const j = await api("/api/referral/stats");
    const confirmed = Number(j.confirmedRefs ?? 0) || 0;
    const active = Number(j.activeRefs ?? 0) || 0;
    const eligible = Number(j.eligibleRefs ?? j.referrals ?? j.count ?? 0) || 0;
    const legacy = Number(j.legacyReferrals ?? 0) || 0;
    const lang = localStorage.getItem(LS_SITE_LANG) || "en";
    try{ renderReferralRightCopy(lang); }catch{}
    try{ renderGuideRightCopy(lang); }catch{}

    applyRefCountEligible(eligible);

    if ($("refConfirmedInline")) $("refConfirmedInline").textContent = String(confirmed);
    if ($("refActiveInline")) $("refActiveInline").textContent = String(active);
    const link = $("refLink");
    if (link) link.value = j.refLink || "";
    revealReferralLinkUi();

    // promoter metrics
    const clicks = Number(j.clicks ?? 0) || 0;
    if ($("promoConfirmed")) $("promoConfirmed").textContent = String(confirmed);
    if ($("promoActive")) $("promoActive").textContent = String(active);
    if ($("promoEligible")) $("promoEligible").textContent = String(eligible);
    if ($("promoLegacy")) $("promoLegacy").textContent = String(legacy);
    if ($("promoClicks")) $("promoClicks").textContent = String(clicks);
    if ($("promoDailyLimit")) $("promoDailyLimit").textContent = String(Number(j.dailyLimit ?? (Number(j.freeDaily||0)+Number(j.dailyBonus||0))) || 0);
    if ($("promoBonusPer20")) $("promoBonusPer20").textContent = String(Number(j.bonusPer20||10)||10);
    if ($("promoNextAt")) $("promoNextAt").textContent = String(Number(j.nextBonusAt||20)||20);

    const promoNote = $("refPromoNote");
    if (promoNote){
      try{ renderReferralPromoNote(j, confirmed, active, eligible); }catch{}
    }
    const nextStep = nextReferralUnlockAt(eligible);
    const wrap = $("refProgressWrap");
    const nextEl = $("refProgressNext");
    const fillEl = $("refProgressFill");
    if (wrap && nextEl && fillEl){
      if (nextStep > 0){
        wrap.classList.remove("hidden");
        nextEl.textContent = String(nextStep);
        const pct = Math.min(100, Math.round((eligible / nextStep) * 100));
        fillEl.style.width = pct + "%";
      } else {
        wrap.classList.add("hidden");
      }
    }

    const promoDetails = $("promoDetails");
    if (promoDetails){
      // Do not auto-collapse this panel after stats refresh.
      // User controls the fold state manually and we restore the saved preference only.
      try{
        const saved = localStorage.getItem(LS_REF_PROMO_OPEN);
        if (saved === "1") promoDetails.open = true;
        else if (saved === "0") promoDetails.open = false;
      }catch{}
    }

    // re-render unlock-dependent UI
    try{ renderThemes(); }catch(e){}
    try{ renderExtThemes(); }catch(e){}
    try{ fillStyles(); }catch(e){}
    try{ fillPacks(); }catch(e){}
    REF_STATS_CACHE = j;
    REF_STATS_LAST_AT = Date.now();
    return j;
  }catch(e){
    return REF_STATS_CACHE || null;
  }finally{
    REF_STATS_PROMISE = null;
  }
  })();
  return REF_STATS_PROMISE;
}
