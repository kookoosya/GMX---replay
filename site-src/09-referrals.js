// ----- Referrals -----

  function escHtml(s){
    return String(s||"").replace(/[&<>"']/g, (c)=>({ "&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;" }[c]));
  }
  function fmtShortDate(iso){
    if (!iso) return "";
    try{
      const d = new Date(iso);
      if (!isFinite(d.getTime())) return String(iso).slice(0,10);
      return d.toLocaleDateString();
    }catch(_e){
      return String(iso).slice(0,10);
    }
  }

  async function loadRefInvited(days=30){
    const body = $("refInvitedBody");
    if (!body) return;
    body.innerHTML = `<tr><td colspan="4" class="muted">${t("r_loading") || "Loading..."}<\/td><\/tr>`;
    const j = await api("/api/referral/list?days=" + encodeURIComponent(String(days)));
    if (!j || !j.ok) throw new Error("ref_list_failed");
    const list = Array.isArray(j.list) ? j.list : [];
    if (!list.length){
      body.innerHTML = `<tr><td colspan="4" class="muted">${t("r_no_invited") || "No invited users yet"}<\/td><\/tr>`;
      return;
    }
    body.innerHTML = list.map((r)=>{
      const status = r.fraud ? ((t("r_flagged") || "Flagged") + (r.fraudReason ? (": " + escHtml(r.fraudReason)) : "")) : (r.eligible ? (t("r_eligible") || "Eligible") : (t("r_not_yet") || "Not yet"));
      return `<tr>
        <td>${escHtml(r.handle||"")}</td>
        <td>${Number(r.inserts||0)}</td>
        <td>${Number(r.activeDays||0)}</td>
        <td>${status}</td>
      </tr>`;
    }).join("");
  }

async function loadRefLeaderboard(days=90){
  const body = $("refLeaderBody");
  const meEl = $("refLeaderMe");
  const lang = localStorage.getItem(LS_SITE_LANG) || "en";
  const ui = getReferralUiCopy(lang);
  if (body) body.innerHTML = `<tr><td colspan="3" class="muted">${escapeHtml(ui.leaderboardLoading || "Loading...")}</td></tr>`;
  const j = await api("/api/leaderboard/referrals?days=" + encodeURIComponent(String(days)));
  if (!j || !j.ok) throw new Error("leaderboard_failed");
  const top = Array.isArray(j.top) ? j.top : [];
  if (!top.length){
    if (body) body.innerHTML = `<tr><td colspan="3" class="muted">${escapeHtml(ui.leaderboardEmpty || "No data yet")}</td></tr>`;
  } else {
    if (body) body.innerHTML = top.map((r,i)=>`<tr><td>${i+1}</td><td>${escHtml(r.handle||"")}</td><td>${Number(r.eligible||0)}</td></tr>`).join("");
  }
  if (meEl){
    if (j.me && j.me.handle){
      meEl.textContent = `${ui.youLabel || "You"}: ${j.me.handle} — ${ui.eligible}: ${Number(j.me.eligible||0)} (${ui.rulesLabel || "rules"}: ≥${j.rules?.minInserts||5} inserts + ≥${j.rules?.minActiveDays||3} active days in ${days}d)`;
    } else {
      meEl.textContent = "";
    }
  }
}


  const refLoadBtn = $("refLoad");
  if (refLoadBtn) refLoadBtn.onclick = async ()=>{
    if (!requireConnected("Referrals")) return;
    try{
      const j = await refreshRefStats(true);
      if (!j) throw new Error("ref_stats_unavailable");
      const link = $("refLink");
      if (link) link.value = j.refLink || "";
      revealReferralLinkUi();
      const confirmed = Number(j.confirmedRefs ?? 0) || 0;
      const active = Number(j.activeRefs ?? 0) || 0;
      const eligible = Number(j.eligibleRefs ?? j.referrals ?? j.count ?? 0) || 0;
      applyRefCountEligible(eligible);
      if ($("refConfirmedInline")) $("refConfirmedInline").textContent = String(confirmed);
      if ($("refActiveInline")) $("refActiveInline").textContent = String(active);
      try{ renderThemes(); }catch(e){}
      try{ renderExtThemes(); }catch(e){}
      try{ initWallpapers(); }catch(e){}
      try{ renderExtWallpapers(); }catch(e){}
const msg = $("refMsg");
      try{ await loadRefInvited(30); }catch(e){}
      if (msg) msg.innerHTML = '<span class="ok">' + escapeHtml(t("ref_loaded")) + '</span>';
      try{ fillStyles(); fillPacks(); }catch{}
      try{ await refreshUsage(); }catch{}
    }catch(e){
      const msg = $("refMsg");
      if (msg) msg.innerHTML = '<span class="bad">' + escapeHtml(e?.message||"failed") + '</span>';
    }
  };

  try{ initReferralPromoDetailsState(); }catch{}

  const refCopyBtn = $("refCopy");
  if (refCopyBtn) refCopyBtn.onclick = async ()=>{
    if (!requireConnected("Referrals")) return;
    const link = $("refLink");
    const v = (link?.value || "").trim();
    if (!v) return;
    await navigator.clipboard.writeText(v);
    const msg = $("refMsg");
    const lang = localStorage.getItem(LS_SITE_LANG) || "en";
    const ui = getReferralUiCopy(lang);
    if (msg) msg.innerHTML = '<span class="ok">' + escapeHtml(ui.copied || "Copied.") + '</span>';
  };
  const pmRefreshBtn = $("pm_refresh");
  if (pmRefreshBtn) pmRefreshBtn.onclick = ()=>{ loadPredictionSignals({ force:true }); };
  syncPredictionFilterCopy();
  const pmAssetSel = $("pm_asset");
  if (pmAssetSel) pmAssetSel.addEventListener("change", ()=>{
    PM_FILTERS.asset = String(pmAssetSel.value || "all");
    renderPredictionSignals(PM_LAST_SIGNALS);
  });
  const pmBiasSel = $("pm_bias");
  if (pmBiasSel) pmBiasSel.addEventListener("change", ()=>{
    PM_FILTERS.bias = String(pmBiasSel.value || "all").toLowerCase();
    renderPredictionSignals(PM_LAST_SIGNALS);
  });
  const pmConfSel = $("pm_conf");
  if (pmConfSel) pmConfSel.addEventListener("change", ()=>{
    PM_FILTERS.minConf = Number(pmConfSel.value || 0) || 0;
    renderPredictionSignals(PM_LAST_SIGNALS);
  });
  setInterval(()=>{
    try{
      if (__gmxTabState.getCurrentTab() === "prediction") loadPredictionSignals({ force:false });
    }catch{}
  }, 60000);
