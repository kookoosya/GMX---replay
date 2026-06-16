(function (window) {
  if (window.__GMXGenerateFactory) return;

  window.__GMXGenerateFactory = function createGMXGenerate() {
    function normalizeLine(s){
    let t = String(s||"");
    t = t.replace(/\s+/g, " ").trim();
    // remove leading dashes that look botted
    t = t.replace(/^(?:-|–|—)+\s*/,"");
    return t;
  }

    function dedupeLines(lines){
    const seen = new Set();
    const out = [];
    for (const x of lines){
      const t = normalizeLine(x);
      const key = t.toLowerCase();
      if (!t) continue;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(t);
    }
    return out;
  }

    function repeatKey(s, strength){
    let t = normalizeLine(s).toLowerCase();
    if (!t) return "";
    try{ t = t.replace(/\p{Extended_Pictographic}/gu, " "); }catch{}
    t = t.replace(/\b(gm|good morning|morning)\b/g, "gm");
    t = t.replace(/\b(gn|good night|night)\b/g, "gn");
    if (strength >= 1){
      t = t.replace(/\b(legend|bro|degen|friend|homie)\b/g, "@voc");
    }
    if (strength >= 2){
      t = t.replace(/[~`!@#$%^&*()_=+\[\]{};:'",.<>/?\\|]/g, " ");
      t = t.replace(/\s+/g, " ").trim();
    }
    if (strength >= 3){
      try{
        t = t.replace(/[^\p{L}\p{N}\s]/gu, " ");
      } catch {
        t = t.replace(/[^a-z0-9\s]/gi, " ");
      }
      t = t.replace(/\b(a|an|the|and|to|your|you|on|this|that|here|today|tonight|tomorrow|back|really|just)\b/g, " ");
      t = t.replace(/\s+/g, " ").trim();
    }
    if (strength >= 4){
      t = t.replace(/\b(good|nice|solid|strong|clean|calm|soft|easy|quiet|steady|warm|kind|smooth)\b/g, "@adj");
      t = t.replace(/\b(gm|gn)\s+(this|keeping|saving|holding|closing)\b/g, "@open");
      t = t.replace(/\b(good one|nice post|clean one|strong post|solid post|good post|clean post|strong take|solid take|clean read|good read|nice read|solid read)\b/g, "@post");
      t = t.replace(/\b(sleep easy|sleep well|rest easy|rest well|good rest|real rest|proper rest|easy reset|soft landing|calm close|easy close|soft close)\b/g, "@close");
      t = t.replace(/\b(this reads|this lands|this sits|this holds|this closes|keeping this one|saving this one|holding this one)\b/g, "@canned");
      t = t.replace(/\b(start the day|start the session|open the day|open the morning|open the session|close the day|end the day)\b/g, "@phase");
      t = t.replace(/\s+/g, " ").trim();
    }
    return t;
  }

    function dedupeLinesByShape(lines, strength){
    const out = [];
    const seenExact = new Set();
    const seenShape = new Set();
    for (const raw of (lines || [])){
      const t = normalizeLine(raw);
      if (!t) continue;
      const exact = t.toLowerCase();
      if (seenExact.has(exact)) continue;
      const shape = repeatKey(t, Math.max(1, strength));
      if (shape && seenShape.has(shape)) continue;
      seenExact.add(exact);
      if (shape) seenShape.add(shape);
      out.push(t);
    }
    return out;
  }

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

    
  function pickBestLine(kind, lines, opts) {
    opts = opts || {};
    const arr = (lines || []).map((x) => String(x || "").trim()).filter(Boolean);
    if (!arr.length) return "";

    const byShape = new Map();
    for (const v of arr) {
      const sc = scoreLineForBest(kind, v);
      if (!Number.isFinite(sc) || sc <= -1e8) continue;
      const shape = bestLineShape(kind, v) || v.toLowerCase();
      const prev = byShape.get(shape);
      if (!prev || sc > prev.sc || (sc === prev.sc && v.length > prev.v.length)) byShape.set(shape, { v, sc, shape });
    }

    const scored = Array.from(byShape.values());
    if (!scored.length) return arr[0] || "";

    scored.sort((a, b) => b.sc - a.sc || b.v.length - a.v.length);
    const last = String(opts.last || "").trim();
    const lastShape = bestLineShape(kind, last);
    const recentShapes = Array.isArray(opts.recentShapes)
      ? opts.recentShapes.map((x) => String(x || "").trim()).filter(Boolean).slice(-3)
      : [];
    const recentSet = new Set(recentShapes);
    const pick = (scored.find((x) => x.v.trim() !== last && x.shape !== lastShape && !recentSet.has(x.shape))
      || scored.find((x) => x.v.trim() !== last && x.shape !== lastShape)
      || scored[0] || {}).v || "";

    if (pick && typeof opts.onPersist === "function") {
      const nextShape = bestLineShape(kind, pick);
      const merged = nextShape ? [...recentShapes, nextShape].slice(-3) : recentShapes;
      opts.onPersist(pick, nextShape, merged);
    }
    return pick;
  }


    
  function mergeAppendUnique(existing, newLines) {
    const out = (existing || []).map((s) => String(s || "").trim()).filter(Boolean);
    const seen = new Set(out.map((s) => s.toLowerCase()));
    for (const s of (newLines || [])) {
      const t = String(s || "").trim();
      if (!t) continue;
      const k = t.toLowerCase();
      if (seen.has(k)) continue;
      seen.add(k);
      out.push(t);
    }
    return out;
  }

  function collectBulkUniqueLines(seedLines, incoming, maxCount) {
    const exactSeen = new Set(
      (seedLines || []).map((s) => normalizeLine(s).toLowerCase()).filter(Boolean)
    );
    const accepted = [];
    const acceptedExact = new Set();
    for (const raw of (incoming || [])) {
      const s = normalizeLine(raw);
      if (!s) continue;
      const exact = s.toLowerCase();
      if (exactSeen.has(exact)) continue;
      if (acceptedExact.has(exact)) continue;
      acceptedExact.add(exact);
      exactSeen.add(exact);
      accepted.push(s);
      if (accepted.length >= maxCount) break;
    }
    return accepted;
  }

  function filterLinesByBan(lines, ban, strength) {
    const out = [];
    const set = ban instanceof Set ? ban : new Set(ban || []);
    for (const s of (lines || [])) {
      const rk = repeatKey(s, strength);
      if (!rk) continue;
      if (set.has(rk)) continue;
      set.add(rk);
      out.push(s);
    }
    return out;
  }

  function isLineAlreadySaved(savedLines, reply, strength) {
    const r = normalizeLine(reply);
    if (!r) return false;
    const exactKey = r.toLowerCase();
    const nearKey = repeatKey(r, Math.max(1, strength));
    return (savedLines || []).some((s) => {
      const raw = String(s || "").trim();
      if (!raw) return false;
      if (raw.toLowerCase() === exactKey) return true;
      if (strength > 0 && nearKey && repeatKey(raw, Math.max(1, strength)) === nearKey) return true;
      return false;
    });
  }

  function selectBestByShape(kind, lines, strength) {
    const byShape = new Map();
    for (const line of (lines || [])) {
      const v = String(line || "").trim();
      if (!v) continue;
      const sc = scoreLineForBest(kind, v);
      if (!Number.isFinite(sc) || sc <= -1e8) continue;
      const shape = bestLineShape(kind, v) || v.toLowerCase();
      const prev = byShape.get(shape);
      if (!prev || sc > prev.sc || (sc === prev.sc && v.length > prev.v.length)) byShape.set(shape, { v, sc });
    }
    return Array.from(byShape.values())
      .sort((a, b) => b.sc - a.sc || b.v.length - a.v.length)
      .map((x) => x.v);
  }


    return {
      normalizeLine,
      dedupeLines,
      repeatKey,
      dedupeLinesByShape,
      bestLineShape,
      scoreLineForBest,
      pickBestLine,
      mergeAppendUnique,
      collectBulkUniqueLines,
      filterLinesByBan,
      isLineAlreadySaved,
      selectBestByShape,
    };
  };
})(window);
