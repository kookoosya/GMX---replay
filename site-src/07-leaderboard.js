// ----- Leaderboard -----
let LB_DAYS = 7;
async function loadLeaderboard(days){
  try{
    LB_DAYS = Number(days||7) || 7;
    const st = $("lb_status");

    st.textContent = "";
    const body = $("lb_body");
    if (body) body.innerHTML = `<tr><td colspan="4" class="muted">${escapeHtml(t('loading')||'Loading...')}</td></tr>`;

    // If user is connected, include token (shows "me" rank).
    const opts = {};
    const token = getToken();
    if (token) opts.headers = { Authorization: "Bearer " + token };
    const r = await fetch(`/api/leaderboard/referrals?days=${encodeURIComponent(LB_DAYS)}`, { cache:"no-store", ...opts });
    const j = await r.json().catch(()=>null);
    if (!r.ok || !j || !j.ok) throw new Error(j?.error || `http_${r.status}`);

    const top = Array.isArray(j.top) ? j.top : [];
    if (body){
      if (!top.length){
        body.innerHTML = `<tr><td colspan="4" class="muted">${escapeHtml(t('lb_empty')||'No data yet.')}</td></tr>`;
      } else {
        body.innerHTML = top.map((row, idx)=>{
          const h = escHtml(String(row.handle||""));
          const eligible = Number(row.eligible||0)||0;
          const active = Number(row.active||0)||0;
          return `<tr><td>${idx+1}</td><td>@${h}</td><td>${eligible}</td><td>${active}</td></tr>`;
        }).join("");
      }
    }

    const you = $("lb_you");
    if (you){
      const me = j.me;
      if (me && me.handle){
        const h = escHtml(String(me.handle||""));
        const eligible = Number(me.eligible||0)||0;
        // rank in top list, else show ">50"
        const idx = top.findIndex(r=>String(r.handle||"")===String(me.handle||""));
        const rank = idx >= 0 ? String(idx+1) : ">50";
        you.innerHTML = `${escapeHtml(t('lb_you')||'You')}: <b>#${rank}</b> @${h} В· ${escapeHtml(t('lb_eligible')||'Eligible')}: <b>${eligible}</b>`;
      } else {
        you.textContent = getHandle() ? "" : (t('connectFirst') || "Connect first.");
      }
    }

    if (st) st.textContent = `${LB_DAYS}d`;
    return j;
  }catch(e){
    const st = $("lb_status");
    if (st) st.textContent = (t('error')||'Error') + ": " + String(e?.message||e||'failed');
    const body = $("lb_body");
    if (body) body.innerHTML = `<tr><td colspan="4" class="muted">${escapeHtml(t('lb_failed')||'Could not load leaderboard.')}</td></tr>`;
    return null;
  }
}

function bindLeaderboardUI(){
  if (bindLeaderboardUI._done) return;
  bindLeaderboardUI._done = true;
  const b7 = $("lb_7d");
  const b30 = $("lb_30d");
  const set = (d)=>{
    if (b7) b7.classList.toggle("active", d===7);
    if (b30) b30.classList.toggle("active", d===30);
    loadLeaderboard(d);
  };
  if (b7) b7.addEventListener("click", ()=>set(7));
  if (b30) b30.addEventListener("click", ()=>set(30));
}
