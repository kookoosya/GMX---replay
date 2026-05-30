// ----- Best (pick a strong line and copy it) -----
function bestLineShape(kind, s){
  const t = String(s || "").toLowerCase().trim();
  if (!t) return "";
  return t
    .replace(/[\u{1F300}-\u{1FAFF}]/gu, " ")
    .replace(/\b(gm|good morning|morning)\b/g, "gm")
    .replace(/\b(gn|good night|night)\b/g, "gn")
    .replace(/\b(legend|bro|degen|anon|friend|homie)\b/g, "@voc")
    .replace(/\b(clean|good|quiet|simple|steady|calm|nice|solid|strong|soft|easy|kind|warm|smooth)\b/g, "@adj")
    .replace(/\b(good one|nice post|clean one|strong post|solid post|good post|clean post|strong take|solid take|clean read|good read|nice gm|solid read|nice read)\b/g, "@post")
    .replace(/\b(sleep easy|sleep well|rest easy|rest well|good rest|real rest|proper rest|easy reset|soft landing|calm close|easy close|soft close)\b/g, "@close")
    .replace(/\b(start the day|start the session|open the day|open the morning|open the session|close the day|end the day)\b/g, "@phase")
    .replace(/[^a-z0-9\s]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function scoreLineForBest(kind, s){
  const t = String(s || "").trim();
  if (!t) return -1e9;

  const len = t.length;
  const lower = t.toLowerCase();
  const words = lower
    .replace(/[^a-z0-9\u00c0-\u024f\s']+/gi, " ")
    .split(/\s+/)
    .map(x => x.trim())
    .filter(Boolean);
  const clauses = t.split(",").map(x => x.trim()).filter(Boolean);
  const concreteRx = /(coffee|brain|screen|pace|hour|desk|today|tonight|tomorrow|morning|night|rest|scroll|tab|room|start|stop|sleep|reset|sunrise|sunset|bed|wake|waking|closing|working|loading|watching|shipping|waiting|window|rain|light|chair|thread|reply)/i;
  const motionRx = /(starting|keeping|calling|logging|leaving|waking|closing|working|loading|watching|shipping|waiting|forcing|scrolling|typing|sending|holding|parking|dragging|landing|resetting|sleeping)/i;
  const greetOnlyRx = /^(gm|good morning|morning|gn|good night|night)(?:\s+(legend|bro|degen|anon|friend|homie))?(?:\s*[\u{1F300}-\u{1FAFF}])?$/iu;
  const fillerRx = /(nice read here|this was a solid read|strong post and a clean start|wishing you a smooth day ahead|hope your day starts easy|hope the morning treats you well|hope you get a calm reset tonight|soft close here|rest well after this one|hope you get an easy reset|calm post to end the day on|sleep well tonight)/i;
  const hollowRx = /(strong post|solid read|clean read|nice read|good read|clean post|good post|solid post|strong take|clean take|good take)/i;
  const cannedStarterRx = /^(gm|gn)\s*,?\s*(this|keeping|saving|holding)\b/i;
  const cannedClauseRx = /\b(this (reads|lands|sits|holds|closes)\b|keeping this one\b|saving this one\b|holding this one\b)\b/i;
  const phaseClicheRx = /\b(before the feed gets loud|once the feed calms down|while the tab is still quiet|for the slower close|the last scroll tonight|better morning shape than most)\b/i;
  let score = 0;

  if (len >= 18 && len <= 84) score += 12;
  else if (len >= 14 && len <= 96) score += 6;
  else if (len < 14) score -= 16;
  else score -= 8;

  if (words.length >= 4 && words.length <= 11) score += 10;
  else if (words.length >= 3 && words.length <= 13) score += 4;
  else score -= 10;

  if (clauses.length === 2) score += 5;
  else if (clauses.length <= 3) score += 2;
  else score -= (clauses.length - 3) * 4;

  if (/[\.\!\?]$/.test(t)) score -= 2;
  if (/[—–-]/.test(t)) score -= 5;
  try {
    const emojiHits = (t.match(/[\u{1F300}-\u{1FAFF}]/gu) || []).length;
    if (emojiHits === 1) score += 5;
    else if (emojiHits === 2) score += 2;
    else if (emojiHits === 0) score -= 6;
    else score -= (emojiHits - 2) * 5;
  } catch {}

  if (kind === "gm") {
    if (/^gm\b/i.test(t)) score += 7;
    else if (/^good morning\b/i.test(t)) score += 3;
  } else {
    if (/^gn\b/i.test(t)) score += 7;
    else if (/^good night\b/i.test(t)) score += 3;
  }

  if (greetOnlyRx.test(t)) score -= 32;
  if (lower === "gm" || lower === "gn" || lower === "good morning" || lower === "good night") score -= 18;
  if (/^(that|this|when|what|why|you|yeah|love|feels|there's)\b/i.test(t)) score -= 10;
  if (/(platform|campaign|liquidity|interoperability|tokenomics|roadmap|investors|engagement|strategy)/i.test(t)) score -= 10;
  if (/(morning legend|night legend|gm legend|gn legend|good alpha|nice gm|good looks)$/i.test(lower)) score -= 18;

  if (concreteRx.test(t)) score += 8;
  else score -= 6;
  if (motionRx.test(t)) score += 6;
  if (/(hope|wishing|sending|sleep easy|easy start|good morning|good night|soft landing|kind start|quiet reset)/i.test(t)) score += 5;
  if (/\b(still|but|yet|though|maybe|almost|barely|even if)\b/i.test(t)) score += 4;
  if (fillerRx.test(t)) score -= 16;
  if (hollowRx.test(t)) score -= 12;
  if (/(that reads fine|that is the line|that moves enough|that is enough to watch)/i.test(t)) score -= 10;

  const uniq = new Set(words);
  score += Math.min(6, uniq.size);
  if (words.length >= 5 && uniq.size <= Math.max(2, Math.floor(words.length * 0.55))) score -= 8;

  const stale = ["clean", "good", "quiet", "simple", "steady", "calm"];
  for (const word of stale){
    const m = lower.match(new RegExp(`\\b${word}\\b`, "g"));
    const count = Array.isArray(m) ? m.length : 0;
    if (count > 1) score -= (count - 1) * 4;
  }

  if (/(smooth day ahead|rest well tonight)/i.test(t)) score -= 10;
  if (/(gm|gn|good morning|good night).*(gm|gn|good morning|good night)/i.test(t)) score -= 8;

  return score;
}

function pickBestLine(kind, lines){
  const arr = (lines||[]).map(x=>String(x||"").trim()).filter(Boolean);
  if (!arr.length) return "";

  const byShape = new Map();
  for (const v of arr){
    const sc = scoreLineForBest(kind, v);
    if (!Number.isFinite(sc) || sc <= -1e8) continue;
    const shape = bestLineShape(kind, v) || v.toLowerCase();
    const prev = byShape.get(shape);
    if (!prev || sc > prev.sc || (sc === prev.sc && v.length > prev.v.length)) byShape.set(shape, { v, sc, shape });
  }

  const scored = Array.from(byShape.values());
  if (!scored.length) return arr[0] || "";

  scored.sort((a,b)=> b.sc - a.sc || b.v.length - a.v.length);
  const lastKey = (kind === "gm") ? "gmx_last_best_gm" : "gmx_last_best_gn";
  const histKey = (kind === "gm") ? "gmx_last_best_shapes_gm" : "gmx_last_best_shapes_gn";
  const last = (localStorage.getItem(lastKey) || "").trim();
  const lastShape = bestLineShape(kind, last);
  let recentShapes = [];
  try{ recentShapes = JSON.parse(localStorage.getItem(histKey) || "[]"); }catch{}
  recentShapes = Array.isArray(recentShapes) ? recentShapes.map(x=>String(x||"").trim()).filter(Boolean).slice(-3) : [];
  const recentSet = new Set(recentShapes);
  const pick = (scored.find(x => x.v.trim() !== last && x.shape !== lastShape && !recentSet.has(x.shape))
    || scored.find(x => x.v.trim() !== last && x.shape !== lastShape)
    || scored[0] || {}).v || "";
  try{
    localStorage.setItem(lastKey, pick);
    const nextShape = bestLineShape(kind, pick);
    const merged = nextShape ? [...recentShapes, nextShape].slice(-3) : recentShapes;
    localStorage.setItem(histKey, JSON.stringify(merged));
  }catch{}
  return pick;
}

async function doBest(kind){
  const lines = dedupeLines(readKey(activeKey(kind)));
  if (!lines || !lines.length){
    toast("warn", t("toast_nothing_to_copy") || "Nothing to copy", 2500);
    return;
  }
  const best = pickBestLine(kind, lines);
  if (!best){
    toast("warn", t("toast_nothing_to_copy") || "Nothing to copy", 2500);
    return;
  }

  try{ await navigator.clipboard.writeText(best); }catch(_e){}
  toast("ok", `Best copied<br><span class="muted">${escapeHtml(best)}</span>`, 6000);

  try{
    const bestTrim = String(best).trim();
    await new Promise(r=>requestAnimationFrame(r));
    const container = kind==="gm" ? $("gmList") : $("gnList");
    if (container){
      container.querySelectorAll(".lineRow.selected").forEach(r=>r.classList.remove("selected"));
      const rows = Array.from(container.querySelectorAll(".lineRow"));
      const row = rows.find(r => {
        const inp = r.querySelector("input");
        const txt = r.querySelector(".lineText");
        const v = (inp?.value || txt?.textContent || "").trim();
        return v === bestTrim;
      });
      if (row){
        row.classList.add("selected");
        row.classList.add("bestFlash");
        try{ row.scrollIntoView({ behavior:"smooth", block:"center" }); }catch(_e){}
        try{
          const cell = row.querySelector(".lineCell");
          const inp = row.querySelector("input");
          if (cell && !row.classList.contains("editing")) cell.click();
          else if (inp){ inp.focus(); inp.select(); }
        }catch(_e){}
        setTimeout(()=>row.classList.remove("bestFlash"), 1600);
      }
    }
  }catch(_e){}
}
async function doBestServer(kind){
  if (!requireConnected(kind==="gm"?"GM":"GN")) return;

  const modeEl  = kind==="gm" ? $("gmMode") : $("gnMode");
  const styleEl = kind==="gm" ? $("gmStyle") : $("gnStyle");
  const packEl  = kind==="gm" ? $("gmPack") : $("gnPack");
  const msgEl = kind==="gm" ? $("gmMsg") : $("gnMsg");

  const mode = modeEl ? modeEl.value : "mid";
  const lang = currentLang(kind);
  let style = styleEl ? styleEl.value : "classic";
  const packId = packEl ? (packEl.value || "classic") : "classic";
  const packIdx = PACKS.findIndex(p=>p.id===packId);
  const packLocked = (!isPro() && packIdx >= unlockedPacksCount());
  const pack = PACKS.find(p=>p.id===packId) || PACKS[0];
  if (!packLocked && pack && pack.style) style = pack.style;

  const strength = getAntiStrength(kind);
  const antiN = antiWindow(strength);
  const keyActive = activeKey(kind);

  setBusy(kind, true, "Picking the best reply...");
  try{
    const bulk = await api(`/api/generate-bulk?kind=${kind}&mode=${encodeURIComponent(mode)}&lang=${encodeURIComponent(lang)}&style=${encodeURIComponent(style)}&anti_last_n=${encodeURIComponent(antiN)}&count=5`, "GET", null, { timeoutMs: 30000 });
    const candidates = dedupeLines((bulk && bulk.list) ? bulk.list : []).map(x=>String(x||"").trim()).filter(Boolean);
    if (!candidates.length){
      if (msgEl) msgEl.innerHTML = `<span class="warn">${escapeHtml("No fresh candidates returned")}</span>`;
      return;
    }

    const best = String(pickBestLine(kind, candidates) || "").trim();
    if (!best){
      if (msgEl) msgEl.innerHTML = `<span class="warn">${escapeHtml("Could not choose the best reply")}</span>`;
      return;
    }

    const cur = readKey(keyActive);
    const rk = best.toLowerCase();
    const bestShape = bestLineShape(kind, best);
    const already = cur.some((s)=>{
      const raw = String(s||"").trim();
      if (!raw) return false;
      if (raw.toLowerCase() === rk) return true;
      return !!bestShape && bestLineShape(kind, raw) === bestShape;
    });
    let saved = false;

    if (!already){
  if (remainingSlots(kind) > 0){
    cur.push(best);
    writeKey(keyActive, cur);
    saved = true;
    pushRecent(kind, [repeatKey(best, Math.max(1, strength))]);
  }
}

    try{ navigator.clipboard.writeText(best); }catch(_e){}
    renderList(kind);
    if (msgEl){
      const head = already
        ? "Best already saved"
        : (saved ? "Best saved" : "Best copied");
      msgEl.innerHTML = `<span class="ok">${escapeHtml(head)}</span> <span class="muted small">${escapeHtml(best)}</span>`;
    }
    try{ await refreshUsage(); }catch(_e){}
  }catch(e){
    const m = (e && e.message) ? e.message : "failed";
    if (msgEl) msgEl.innerHTML = `<span class="bad">${escapeHtml(m)}</span>`;
  } finally {
    setBusy(kind, false);
  }
}


  function allKeysForKind(kind){
    return [getBankKey(kind)];
  }

  function totalSaved(kind){
    let total = 0;
    for (const k of allKeysForKind(kind)){
      total += readKey(k).length;
    }
    return total;
  }

  function totalSlots(kind){
    let total = 0;
    for (const k of allKeysForKind(kind)){
      total += readKey(k).length; // total saved lines
    }
    return total;
  }

  function remainingSlots(kind){
    const cap = saveCap();
    if (cap === Infinity) return Infinity;
    return Math.max(0, cap - totalSaved(kind));
  }

function replaceRandomSavedLine(kind, newLine){
  const key = activeKey(kind);
  const next = normalizeLine(newLine);
  const cur = dedupeLines(readKey(key));
  if (!next || !cur.length) return false;
  if (cur.some((x)=>String(x || "").trim().toLowerCase() === next.toLowerCase())) return false;
  const idx = Math.floor(Math.random() * cur.length);
  cur[idx] = next;
  writeKey(key, cur);
  return true;
}



  function countsByScope(kind){
    const total = readKey(getBankKey(kind)).length;
    return { global: 0, langs: 0, total };
  }

  function updateSavedUI(kind){
    const totalEl = kind==='gm' ? $('gmTotal') : $('gnTotal');
    const capEl = kind==='gm' ? $('gmCap') : $('gnCap');
    if (totalEl) totalEl.textContent = totalSaved(kind);
    if (capEl) capEl.textContent = isPro() ? 'unlimited' : String(SAVE_CAP_FREE);
    const brEl = kind==='gm' ? $('gmSavedBreakdown') : $('gnSavedBreakdown');
    if (brEl){
      brEl.textContent = 'Saved bank: ' + totalSaved(kind);
    }

    try{
      const used = totalSaved(kind);
      LAST_SAVED[kind] = used;
      const cap = SAVE_CAP_FREE;
      const valId = (kind==="gm") ? "gmSavedVal" : "gnSavedVal";
      const fillId = (kind==="gm") ? "gmSavedFill" : "gnSavedFill";
      const v = $(valId);
      const f = $(fillId);
      if (v) v.textContent = isPro() ? `${used}/unlimited` : `${used}/${cap}`;
      if (f) f.style.width = isPro() ? "100%" : (Math.min(100, Math.round((used/cap)*100)) + "%");

      if (!$("help_modal")?.classList.contains("hidden")) renderHelpModal();
    }catch(e){}
  }

  function pruneEmptyLang(kind, lang){
    return;
  }


  function trimKindToCap(kind){
    let removed = 0;
    const key = getBankKey(kind);
    const cur = readKey(key);
    while (cur.length > saveCap()){
      cur.pop();
      removed++;
    }
    writeKey(key, cur);
    return removed;
  }

  let gmView = "saved";
  let gnView = "saved";

  function currentLang(kind){
    try{
      const el = kind==="gm" ? $("gmLang") : $("gnLang");
      if (el) el.value = "en";
    }catch{}
    return "en";
  }
  function activeKey(kind){
    return getBankKey(kind);
  }

  function ensureIndexed(kind, lang){
    return;
  }

  function escapeHtml(s){
    return String(s||"")
      .replaceAll("&","&amp;")
      .replaceAll("<","&lt;")
      .replaceAll(">","&gt;")
      .replaceAll('"',"&quot;")
      .replaceAll("'","&#039;");
  }

  function isNetworkishErrorMessage(msg){
    const m = String(msg || "").trim();
    if (!m) return false;
    return m === "request_failed"
      || m === "timeout"
      || m === "not_connected"
      || m.includes("Failed to fetch")
      || m.includes("NetworkError")
      || m.includes("fetch")
      || m.includes("ECONN");
  }

  function friendlyUiErrorMessage(msg, opts){
    const m = String(msg || "").trim();
    const scope = String(opts && opts.scope || "").trim();
    if (!m) return scope === "connect" ? "Connection failed. Try again." : "Request failed. Try again.";
    if (m === "timeout") return scope === "generate" ? "Generation timed out. Try again." : "Network timeout. Try again.";
    if (m === "unauthorized") return "Unauthorized. Re-connect your handle.";
    if (m === "request_failed"){
      if (scope === "generate") return "Generation request failed. Check the backend and try again.";
      if (scope === "connect") return "Connection failed. Check the backend/runtime and try again.";
      return "Request failed. Check the backend/runtime and try again.";
    }
    if (m === "not_connected") return "Connect first.";
    if (m === "rpc_unavailable") return "Solana RPC is unavailable right now. Try again in a moment.";
    if (m === "wallet_bind_required") return "Wallet binding is required before verify. Sign the wallet message and try again.";
    if (isNetworkishErrorMessage(m)) return "Network/API error. Try again.";
    return m;
  }

  function renderList(kind){
    const container = kind==="gm" ? $("gmList") : $("gnList");
    const countEl = kind==="gm" ? $("gmCount") : $("gnCount");
    const msgEl = kind==="gm" ? $("gmMsg") : $("gnMsg");
    if (!container || !countEl) return;

    const key = activeKey(kind);
const rawLines = readKey(key);
const lines = dedupeLines((rawLines || []).map(normalizeLine).filter(Boolean));
if (lines.join("\n") !== rawLines.join("\n")) writeKey(key, lines);

countEl.textContent = lines.length;
    updateSavedUI(kind);

    container.innerHTML = "";

    if (!getHandle()){
      if (msgEl) msgEl.innerHTML = '<span class="warn">Connect first.</span>';
      return;
    }

    const filterEl = kind==="gm" ? $("gmFilter") : $("gnFilter");
    const q = (filterEl && filterEl.value) ? String(filterEl.value).trim().toLowerCase() : "";
    const items = q
      ? lines.map((val, idx)=>({ idx, val })).filter(x => String(x.val||"").toLowerCase().includes(q))
      : lines.map((val, idx)=>({ idx, val }));

    if (!lines.length){
      if (msgEl) msgEl.textContent = "Saved bank is empty.";
      return;
    }

    if (q && msgEl){
      msgEl.innerHTML = `<span class="muted">Filtered: showing <b>${items.length}</b> / ${lines.length}</span>`;
    }

    if (q && items.length === 0){
      const row = document.createElement("div");
      row.className = "muted";
      row.style.padding = "8px 2px";
      row.textContent = "No matches.";
      container.appendChild(row);
      return;
    }

    // Large saved banks: readable display, edit-on-click (no sea of inputs).
    chunkedRender(container, items, (item, pos)=>{
      const i = item.idx;
      const val = item.val;

      const row = document.createElement("div");
      row.className = "lineRow";
      row.innerHTML = `
        <span class="idx">${pos+1}</span>
        <div class="lineCell" role="button" tabindex="0">
          <span class="lineText">${escapeHtml(val)}</span>
          <input class="lineInput" name="line" aria-label="Saved reply ${pos+1}" value="${escapeHtml(val)}" style="display:none" />
        </div>
        <button class="delBtn" title="Remove" type="button" aria-label="Remove">&times;</button>
      `;
      const cell = row.querySelector(".lineCell");
      const textEl = row.querySelector(".lineText");
      const input = row.querySelector("input");
      const del = row.querySelector("button");

      function commitEdit(){
        const v = input.value.trim();
        if (!v){
          const cur = readKey(key);
          cur.splice(i, 1);
          writeKey(key, cur);
          renderList(kind);
          return;
        }
        const cur = readKey(key);
        cur[i] = v;
        writeKey(key, cur);
        countEl.textContent = cur.length;
        textEl.textContent = v;
        input.style.display = "none";
        textEl.style.display = "";
        row.classList.remove("editing");
      }

      function startEdit(){
        row.classList.add("editing");
        input.value = textEl.textContent;
        input.style.display = "";
        textEl.style.display = "none";
        input.focus();
        input.select();
      }

      cell.addEventListener("click", (e)=>{
        if (e.target === del) return;
        if (!row.classList.contains("editing")) startEdit();
      });
      input.addEventListener("blur", commitEdit);
      input.addEventListener("keydown", (e)=>{
        if (e.key === "Enter"){ e.preventDefault(); commitEdit(); }
        if (e.key === "Escape"){
          e.preventDefault();
          input.value = textEl.textContent;
          input.style.display = "none";
          textEl.style.display = "";
          row.classList.remove("editing");
        }
      });
      input.addEventListener("input", ()=>{
        const v = input.value.trim();
        if (!v) return;
        const cur = readKey(key);
        cur[i] = v;
        writeKey(key, cur);
      });

      del.addEventListener("click", (e)=>{
        e.stopPropagation();
        const cur = readKey(key);
        cur.splice(i, 1);
        writeKey(key, cur);
        renderList(kind);
      });
      return row;
    }, { key: `lineRows_${kind}`, chunk: 26 });
  }

  function setView(kind, scope){
    if (kind==="gm"){
      gmView = "saved";
      const a = $("gmViewGlobal"); if (a) a.classList.remove("active");
      const b = $("gmViewLang");   if (b) b.classList.add("active");
    } else {
      gnView = "saved";
      const a = $("gnViewGlobal"); if (a) a.classList.remove("active");
      const b = $("gnViewLang");   if (b) b.classList.add("active");
    }
    updateLangFlags();
    renderList(kind);
    renderLangChips(kind);
  }

  function addLine(kind){
    if (!requireConnected(kind==="gm"?"GM":"GN")) return;
    const msgEl = kind==="gm" ? $("gmMsg") : $("gnMsg");
    const rem = remainingSlots(kind);
    if (rem <= 0){
      msgEl.innerHTML = `<span class="warn">Free save limit reached (${saveCap()} lines). You can still edit existing lines. Upgrade for more.</span>`;
      try{ openLimitModal({ reason:"save_cap", kind }); }catch{}
      trackEvent("limit_hit", { kind, reason:"save_cap" });
      return;
    }
    const input = kind==="gm" ? $("gmNewLine") : $("gnNewLine");
    if (input){
      input.focus();
      try{ input.scrollIntoView({ block:"center", behavior:"smooth" }); }catch{}
    }
    msgEl.innerHTML = `<span class="muted">Type your line below and click Add.</span>`;
  }


  function clearView(kind){
    if (!requireConnected(kind==="gm"?"GM":"GN")) return;
    try{ if (ABORT[kind]) ABORT[kind].abort(); }catch{}
    const key = activeKey(kind);
    const cur = readKey(key);
    if (cur.length && !confirm("Clear this saved bank? This cannot be undone.")) return;
    writeKey(key, []);
    renderList(kind);
    const msgEl = kind==="gm" ? $("gmMsg") : $("gnMsg");
    if (msgEl) msgEl.innerHTML = `<span class="ok">Saved bank cleared.</span>`;
  }

  function clearAll(kind){
    if (!requireConnected(kind==="gm"?"GM":"GN")) return;
    try{ if (ABORT[kind]) ABORT[kind].abort(); }catch{}
    const total = totalSaved(kind);
    if (total && !confirm("Clear all saved lines in this bank? This cannot be undone.")) return;
    for (const k of Array.from(new Set([...allLegacyKeysForKind(kind), getBankKey(kind)]))) localStorage.removeItem(k);
    setLangIndex(kind, []);
    writeKey(getBankKey(kind), []);
    try{ localStorage.setItem(getBankMigrationKey(kind), "1"); }catch{}
    if (kind==="gm"){
      gmView = "saved";
      const a = $("gmViewGlobal"); if (a) a.classList.remove("active");
      const b = $("gmViewLang");   if (b) b.classList.add("active");
    } else {
      gnView = "saved";
      const a = $("gnViewGlobal"); if (a) a.classList.remove("active");
      const b = $("gnViewLang");   if (b) b.classList.add("active");
    }
    updateLangFlags();
    renderLangChips(kind);
    renderList(kind);
    toast("ok", (t("toast_cleared_all_saved_lines")||"Cleared all saved lines."));
  }

  function formatAllExport(kind){
    const lines = readKey(getBankKey(kind));
    if (!lines.length) return "";
    return lines.join("\n").trim() + "\n";
  }

  async function copyAll(kind){
    if (!requireConnected(kind==="gm"?"GM":"GN")) return;
    const txt = formatAllExport(kind);
    if (!txt){
      toast("warn", (t("toast_nothing_to_copy")||"Nothing to copy."));
      return;
    }
    try{
      await navigator.clipboard.writeText(txt);
      toast("ok", (t("toast_copied")||"Copied."));
    }catch{
      // fallback
      const ta = document.createElement("textarea");
      ta.value = txt;
      document.body.appendChild(ta);
      ta.select();
      try{ document.execCommand("copy"); toast("ok", (t("toast_copied")||"Copied.")); }catch{ toast("bad", (t("toast_copy_failed")||"Copy failed.")); }
      ta.remove();
    }
  }

  function exportAll(kind){
    if (!requireConnected(kind==="gm"?"GM":"GN")) return;
    const txt = formatAllExport(kind);
    if (!txt){
      toast("warn", (t("toast_nothing_to_export")||"Nothing to export."));
      return;
    }
    const blob = new Blob([txt], { type:"text/plain;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    const stamp = new Date().toISOString().slice(0,10);
    a.download = `gmxreply_${kind}_${stamp}.txt`;
    document.body.appendChild(a);
    a.click();
    setTimeout(()=>{ URL.revokeObjectURL(a.href); a.remove(); }, 50);
  }

  const LS_DRAFT_GM_NEW = "gmx_draft_gm_new";
  const LS_DRAFT_GN_NEW = "gmx_draft_gn_new";
  const LS_DRAFT_GM_PASTE = "gmx_draft_gm_paste";
  const LS_DRAFT_GN_PASTE = "gmx_draft_gn_paste";

  function saveDraft(kind){
    try{
      if (kind==="gm"){
        const a = $("gmNewLine"); if (a) localStorage.setItem(LS_DRAFT_GM_NEW, a.value || "");
        const p = $("gmPaste"); if (p) localStorage.setItem(LS_DRAFT_GM_PASTE, p.value || "");
      } else {
        const a = $("gnNewLine"); if (a) localStorage.setItem(LS_DRAFT_GN_NEW, a.value || "");
        const p = $("gnPaste"); if (p) localStorage.setItem(LS_DRAFT_GN_PASTE, p.value || "");
      }
    }catch{}
  }

  function restoreDrafts(){
    try{
      const gmNew = $("gmNewLine"); if (gmNew && !gmNew.value) gmNew.value = localStorage.getItem(LS_DRAFT_GM_NEW) || "";
      const gnNew = $("gnNewLine"); if (gnNew && !gnNew.value) gnNew.value = localStorage.getItem(LS_DRAFT_GN_NEW) || "";
      const gmP = $("gmPaste"); if (gmP && !gmP.value) gmP.value = localStorage.getItem(LS_DRAFT_GM_PASTE) || "";
      const gnP = $("gnPaste"); if (gnP && !gnP.value) gnP.value = localStorage.getItem(LS_DRAFT_GN_PASTE) || "";
    }catch{}
  }

  function clearDraft(kind){
    try{
      if (kind==="gm"){
        localStorage.removeItem(LS_DRAFT_GM_NEW);
        localStorage.removeItem(LS_DRAFT_GM_PASTE);
      } else {
        localStorage.removeItem(LS_DRAFT_GN_NEW);
        localStorage.removeItem(LS_DRAFT_GN_PASTE);
      }
    }catch{}
  }

  function commitNewLine(kind){
    if (!requireConnected(kind==="gm"?"GM":"GN")) return;
    const input = kind==="gm" ? $("gmNewLine") : $("gnNewLine");
    const msgEl = kind==="gm" ? $("gmMsg") : $("gnMsg");
    if (!input) return;

    const v = input.value.trim();
    if (!v){
      if (msgEl) msgEl.innerHTML = `<span class="muted">Type something first.</span>`;
      return;
    }

    if ((kind==="gm" ? gmView : gnView) === "lang"){
      ensureIndexed(kind, currentLang(kind));
    }

    const rem = remainingSlots(kind);
    if (rem <= 0){
      if (msgEl) msgEl.innerHTML = `<span class="warn">Free save limit reached (${saveCap()} lines). You can still edit existing lines. Upgrade for more.</span>`;
      return;
    }

    const key = activeKey(kind);
    const cur = readKey(key);
    const exists = cur.some(s => String(s||"").trim().toLowerCase() === v.toLowerCase());
    if (exists){
      if (msgEl) msgEl.innerHTML = `<span class="muted">Already saved (duplicate ignored).</span>`;
      return;
    }
    cur.push(v);
    writeKey(key, cur);

    input.value = "";
    clearDraft(kind);
    renderList(kind);

    if (msgEl) msgEl.innerHTML = `<span class="ok">Added 1</span>`;
  }



  function addPasted(kind){
    if (!requireConnected(kind==="gm"?"GM":"GN")) return;

    const box = kind==="gm" ? $("gmPaste") : $("gnPaste");
    const msgEl = kind==="gm" ? $("gmMsg") : $("gnMsg");
    if (!box) return;

    const pastedAll = linesFromText(box.value);
    if (!pastedAll.length) return;

    const rem = remainingSlots(kind);
    if (rem <= 0){
      if (msgEl) msgEl.innerHTML = `<span class="warn">Free save limit reached (${saveCap()}). You can still edit existing lines. Upgrade for more.</span>`;
      return;
    }

    const pasted = (rem === Infinity) ? pastedAll : pastedAll.slice(0, rem);

    const key = activeKey(kind);
    const before = readKey(key);
    const combined = before.concat(pasted);
    const after = dedupeLines(combined);

    writeKey(key, after);
    box.value = "";
    clearDraft(kind);
    renderList(kind);

    const added = Math.max(0, after.length - before.length);
    const skippedDup = pasted.length - added;

    if (msgEl){
      if (pasted.length < pastedAll.length){
        msgEl.innerHTML = `<span class="warn">Added ${added}/${pastedAll.length} (cap reached)</span>`;
      } else if (skippedDup > 0){
        msgEl.innerHTML = `<span class="ok">Added ${added}</span> <span class="muted small">(skipped ${skippedDup} duplicates)</span>`;
      } else {
        msgEl.innerHTML = `<span class="ok">Added ${added}</span>`;
      }
    }
  }
  // Keep existing order, append only truly-new unique lines.
  // Important: duplicates MUST NOT be moved to the top.
  function mergeAppendUnique(existing, newLines){
    const out = (existing||[]).map(s=>String(s||"").trim()).filter(Boolean);
    const seen = new Set(out.map(s=>s.toLowerCase()));
    for (const s of (newLines||[])){
      const t = String(s||"").trim();
      if (!t) continue;
      const k = t.toLowerCase();
      if (seen.has(k)) continue;
      seen.add(k);
      out.push(t);
    }
    return out;
  }
async function generate(kind, count){
    if (!requireConnected(kind==="gm"?"GM":"GN")) return;
    const h = getHandle();

    const modeEl  = kind==="gm" ? $("gmMode") : $("gnMode");
    const styleEl = kind==="gm" ? $("gmStyle") : $("gnStyle");
    const packEl  = kind==="gm" ? $("gmPack") : $("gnPack");

    const mode = modeEl ? modeEl.value : "mid";
    const lang = currentLang(kind);

    let style = styleEl ? styleEl.value : "classic";
    const packId = packEl ? (packEl.value || "classic") : "classic";
    const packIdx = PACKS.findIndex(p=>p.id===packId);
    const packLocked = (!isPro() && packIdx >= unlockedPacksCount());
    const pack = PACKS.find(p=>p.id===packId) || PACKS[0];

    const msgEl = kind==="gm" ? $("gmMsg") : $("gnMsg");

    const strength = getAntiStrength(kind);
    const antiN = antiWindow(strength);
    const autoClean = (count <= 1) ? getCleanFillEnabled(kind) : false;

    if ((kind==="gm" ? gmView : gnView) === "lang") ensureIndexed(kind, lang);

    // Pack influences the effective style for generation (without locking manual style).
    if (!packLocked && pack && pack.style) style = pack.style;

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

        const cur = readKey(keyActive);
        const r = String(reply||"").trim();
        const exactKey = r.toLowerCase();
        const nearKey = repeatKey(r, Math.max(1, strength));
        const already = cur.some((s)=>{
          const raw = String(s||"").trim();
          if (!raw) return false;
          if (raw.toLowerCase() === exactKey) return true;
          if (strength > 0 && nearKey && repeatKey(raw, Math.max(1, strength)) === nearKey) return true;
          return false;
        });
        if (already){
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
        const exactSeen = new Set(readKey(keyActive).map(s=>String(s||"").trim().toLowerCase()).filter(Boolean));
        const accepted = [];
        const acceptedExact = new Set();
        const takeLines = (arr)=>{
          for (const raw of (arr || [])){
            const s = normalizeLine(raw);
            if (!s) continue;
            const exact = s.toLowerCase();
            if (exactSeen.has(exact)) continue;
            if (acceptedExact.has(exact)) continue;
            acceptedExact.add(exact);
            exactSeen.add(exact);
            accepted.push(s);
            if (accepted.length >= effCount) break;
          }
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
          const byShape = new Map();
          for (const line of incoming){
            const v = String(line || "").trim();
            if (!v) continue;
            const sc = scoreLineForBest(kind, v);
            if (!Number.isFinite(sc) || sc <= -1e8) continue;
            const shape = bestLineShape(kind, v) || v.toLowerCase();
            const prev = byShape.get(shape);
            if (!prev || sc > prev.sc || (sc === prev.sc && v.length > prev.v.length)) byShape.set(shape, { v, sc });
          }
          selected = Array.from(byShape.values())
            .sort((a,b)=> b.sc - a.sc || b.v.length - a.v.length)
            .slice(0, effCount)
            .map(x=>x.v);
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
      msgEl.innerHTML = `<span class="bad">${escapeHtml(friendly)}</span>`;
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
