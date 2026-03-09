/* DEPRECATED ARCHIVE: this file is intentionally NOT loaded by manifest.json. Keep it only as historical reference; do not wire it back into the extension. */

// GMXReply Extension Content Script (v10)
if (window.__GMXREPLY_CS_LOADED){
  // Avoid double-initialization on X SPA navigations
  // (content script can be re-evaluated in some edge cases).
  // eslint-disable-next-line no-unused-expressions
  0;
} else {
  window.__GMXREPLY_CS_LOADED = true;
}
const LANGS = new Set(["en","es","pt","fr","de","it","nl","tr","pl","id","ru","uk","hi","ja","zh"]);

const REMOTE_SELECTORS_KEY = "gmx_remote_selectors_v1";
const REMOTE_SELECTORS_META_MS = 30*60*1000; // 30 min
let REMOTE_SELECTORS = null;

const CLIENT_ID_KEY = "gmx_client_id_v1";

const DEFAULT_BASE = "https://www.gmxreply.com";

function normBase(b){
  const raw = String(b || "").trim();
  if (!raw) return DEFAULT_BASE;
  let u;
  try{ u = new URL(raw); }catch{
    try{ u = new URL(raw.replace(/\/$/, "") + "/"); }catch{ return DEFAULT_BASE; }
  }
  const host = String(u.hostname || "").toLowerCase();
  const origin = (u.origin || "").replace(/\/$/, "");
  if (host === "www.gmxreply.com") return "https://www.gmxreply.com";
  if (host === "gmxreply.com") return "https://gmxreply.com";
  if (host === "localhost" || host === "127.0.0.1") return origin;
  return DEFAULT_BASE;
}


async function getClientId(){
  try{
    const o = await chrome.storage.local.get([CLIENT_ID_KEY]);
    let id = String(o[CLIENT_ID_KEY] || "").trim();
    if (id && id.length >= 8) return id;
    id = Array.from(crypto.getRandomValues(new Uint8Array(12))).map(b=>b.toString(16).padStart(2,"0")).join("");
    await chrome.storage.local.set({ [CLIENT_ID_KEY]: id });
    return id;
  }catch(_e){
    // fallback (not persisted)
    try{
      return Array.from(crypto.getRandomValues(new Uint8Array(12))).map(b=>b.toString(16).padStart(2,"0")).join("");
    }catch(__e){
      return "anon";
    }
  }
}

function uniqNodes(arr){
  const out = [];
  const seen = new Set();
  for (const n of arr){
    if (!n) continue;
    if (seen.has(n)) continue;
    seen.add(n);
    out.push(n);
  }
  return out;
}
function queryAll(selectors){
  const out = [];
  for (const sel of selectors || []){
    if (!sel) continue;
    try{ document.querySelectorAll(sel).forEach(n=>out.push(n)); }catch(_e){}
  }
  return uniqNodes(out);
}
async function loadRemoteSelectors(apiBase, force=false){
  try{
    const now = Date.now();
    const base = normBase(apiBase);
    const clientId = await getClientId();
    // Security: allow remote selectors only from our known API hosts.
    // This enables self-healing selector hotfixes when X changes DOM.
    try{
      const h = new URL(base).hostname.toLowerCase();
      const allowed = new Set(['localhost','127.0.0.1','gmxreply.com','www.gmxreply.com']);
      if (!allowed.has(h)) return;
    }catch(_e){ return; }

    // Expose for other self-heal paths
    try{ window.__GMXREPLY_API_BASE = base; }catch{}

    if (!force){
      const cached = await chrome.storage.local.get([REMOTE_SELECTORS_KEY]);
      const c = cached[REMOTE_SELECTORS_KEY];
      const fresh = (c && c.ts && (now - c.ts) < 6*60*60*1000 && c.data);

      // If cache is fresh, do a lightweight meta poll occasionally to detect admin hotfix updates.
      if (fresh){
        REMOTE_SELECTORS = c.data;

        const metaTs = Number(c.metaTs || 0);
        if ((now - metaTs) > REMOTE_SELECTORS_META_MS){
          try{
            const mu = base + "/api/ext/selectors?meta=1&client_id=" + encodeURIComponent(clientId) + "&t=" + now;
            const mr = await fetch(mu, { cache:"no-store" });
            const mj = await mr.json().catch(()=>null);
            const changed = !!(mj && mj.ok && (
              String(mj.build||"") !== String(c.data.build||"") ||
              String(mj.overrideUpdatedAt||"") !== String(c.data.overrideUpdatedAt||"") ||
              String(mj.rolloutUpdatedAt||"") !== String(c.data.rolloutUpdatedAt||"") ||
              String(mj.inRollout||"") !== String(c.data.inRollout||"") ||
              Number(mj.rolloutPercent||0) !== Number(c.data.rolloutPercent||0) ||
              Number(mj.version||0) !== Number(c.data.version||0)
            ));

            // Persist metaTs regardless, so we don't spam the server if offline.
            await chrome.storage.local.set({ [REMOTE_SELECTORS_KEY]: { ...c, metaTs: now } });

            if (!changed) return;
            // If changed, fall through and fetch full selectors.
          }catch(_e){
            try{ await chrome.storage.local.set({ [REMOTE_SELECTORS_KEY]: { ...c, metaTs: now } }); }catch{}
            return;
          }
        } else {
          return;
        }
      }
    }

    const url = base + "/api/ext/selectors?client_id=" + encodeURIComponent(clientId) + "&t=" + now; // cache-bust
    const r = await fetch(url, { cache:"no-store" });
    const j = await r.json().catch(()=>null);
    if (!r.ok || !j || !j.ok) return;

    REMOTE_SELECTORS = {
      composer: Array.isArray(j.composer) ? j.composer : [],
      tweetText: Array.isArray(j.tweetText) ? j.tweetText : [],
      anchors: Array.isArray(j.anchors) ? j.anchors : [],
      build: j.build || "",
      overrideUpdatedAt: j.overrideUpdatedAt || null,
      rolloutUpdatedAt: j.rolloutUpdatedAt || null,
      rolloutPercent: Number(j.rolloutPercent ?? 100),
      inRollout: !!j.inRollout,
      version: Number(j.version || 1)
    };
    await chrome.storage.local.set({ [REMOTE_SELECTORS_KEY]: { ts: now, metaTs: now, data: REMOTE_SELECTORS } });
  }catch(_e){}
}


function normLang(input){
  if (!input) return "en";
  const raw = String(input).toLowerCase().trim().replace("_","-");
  const primary = raw.split("-")[0];
  return LANGS.has(primary) ? primary : "en";
}

function findTweetText(){
  const remote = (REMOTE_SELECTORS && Array.isArray(REMOTE_SELECTORS.tweetText)) ? REMOTE_SELECTORS.tweetText : [];
  if (remote.length){
    const nodes = queryAll(remote);
    for (const n of nodes){
      const t = (n?.innerText || n?.textContent || "").trim();
      if (t && t.length > 3) return t;
    }
  }

  // Try tweet text inside an opened tweet / reply dialog
  const candidates = [
    'article div[data-testid="tweetText"]',
    'article [lang]',
    'div[data-testid="tweetText"]',
    'article'
  ];
  for (const sel of candidates){
    const el = document.querySelector(sel);
    const t = el?.innerText?.trim();
    if (t && t.length > 3) return t;
  }
  return "";
}

function guessLangHeuristic(text){
  const t = (text||"").toLowerCase();

  // Cyrillic: ru vs uk basic heuristics
  if (/[а-яёіїєґ]/i.test(t)){
    // Ukrainian markers
    if (/[іїєґ]/i.test(t) || /\b(та|і|це|що|як|мені|тебе)\b/i.test(t)) return "uk";
    return "ru";
  }

  // CJK
  if (/[\u3040-\u30ff]/.test(t)) return "ja";
  if (/[\uac00-\ud7af]/.test(t)) return "ko";
  if (/[\u4e00-\u9fff]/.test(t)) return "zh";

  // Arabic
  if (/[\u0600-\u06ff]/.test(t)) return "ar";

  // Latin heuristics
  if (/\b(el|la|que|hoy|buenos)\b/.test(t)) return "es";
  if (/\b(der|die|das|und|guten)\b/.test(t)) return "de";
  if (/\b(le|la|les|bonjour|merci)\b/.test(t)) return "fr";
  if (/\b(o|a|que|bom|boa|obrigado)\b/.test(t)) return "pt";
  if (/\b(il|lo|ciao|grazie|buon)\b/.test(t)) return "it";
  if (/\b(de|het|goed|morgen)\b/.test(t)) return "nl";
  if (/\b(ve|bir|günaydın|iyi)\b/.test(t)) return "tr";
  if (/\b(i|you|good|morning|night)\b/.test(t)) return "en";

  return "en";
}

function findTweetLang(){
  const el = document.querySelector('article [lang]');
  const l = el?.getAttribute?.("lang");
  if (l) return normLang(l);
  const html = document.documentElement.getAttribute("lang");
  if (html) return normLang(html);
  // heuristic from text
  return normLang(guessLangHeuristic(findTweetText()));
}

function sleep(ms){ return new Promise(r=>setTimeout(r, ms)); }

function antiLastNFromStrength(strength){
  const v = Number(strength || 0);
  if (!Number.isFinite(v) || v <= 0) return 0;
  const t = Math.max(0.01, Math.min(1, v / 100));
  const n = Math.round(20 + t * 40);
  return Math.max(20, Math.min(60, n));
}

function randBetween(min, max){
  const a = Math.ceil(min);
  const b = Math.floor(max);
  return Math.floor(Math.random() * (b - a + 1)) + a;
}

function splitGraphemes(str){
  try{
    if (typeof Intl !== "undefined" && Intl.Segmenter){
      const seg = new Intl.Segmenter(undefined, { granularity: "grapheme" });
      return Array.from(seg.segment(String(str||"")), s=>s.segment);
    }
  }catch{}
  return Array.from(String(str||""));
}



function composerRank(box){
  if (!box) return 0;
  const dt = box.getAttribute?.("data-testid") || "";
  if (dt.includes("tweetTextarea")) return 3;
  if (box.closest?.('div[data-testid^="tweetTextarea_"]')) return 2;
  if (box.closest?.('div[role="dialog"]')) return 1;
  return 0;
}

function findReplyBox(){
  // Prefer the currently focused composer.
  const ae = document.activeElement;
  if (ae && ae.getAttribute && ae.getAttribute("role")==="textbox" && ae.isContentEditable) return ae;

  // Remote selectors (server can hot-fix when X changes DOM)
  const remote = (REMOTE_SELECTORS && Array.isArray(REMOTE_SELECTORS.composer)) ? REMOTE_SELECTORS.composer : [];
  if (remote.length){
    const nodes = queryAll(remote).filter(b=>b && b.isContentEditable);
    nodes.sort((a,b)=>composerRank(b)-composerRank(a));
    if (nodes[0]) return nodes[0];
  }

  const boxes = Array.from(document.querySelectorAll('div[role="textbox"]'))
    .filter(b=>b && b.isContentEditable);

  boxes.sort((a,b)=>composerRank(b)-composerRank(a));
  return boxes[0] || null;
}

function findReplyBoxNear(node){
  try{
    const scope = node?.closest?.('div[role="dialog"]') || node?.closest?.('div[data-testid^="tweetTextarea_"]') || node?.parentElement || null;
    if (!scope || !scope.querySelectorAll) return null;
    const boxes = Array.from(scope.querySelectorAll('div[role="textbox"]')).filter(b=>b && b.isContentEditable);
    boxes.sort((a,b)=>composerRank(b)-composerRank(a));
    return boxes[0] || null;
  }catch(_e){
    return null;
  }
}

function resolveLiveBox(preferred, scopeNode){
  if (preferred && document.contains(preferred) && preferred.isContentEditable) return preferred;
  const near = findReplyBoxNear(scopeNode || preferred);
  if (near) return near;
  return findReplyBox();
}




/* ---------------------------
   Typing speed profiles (anti-bot)
---------------------------- */
let GMX_TYPING_PROFILE = "safe";
let GMX_TYPING_MIN = 55;
let GMX_TYPING_MAX = 85;

function applyTypingProfile(p){
  const id = String(p || "safe").toLowerCase();
  GMX_TYPING_PROFILE = id;
  if (id === "fast"){
    GMX_TYPING_MIN = 25;
    GMX_TYPING_MAX = 45;
  } else if (id === "balanced"){
    GMX_TYPING_MIN = 40;
    GMX_TYPING_MAX = 65;
  } else {
    GMX_TYPING_PROFILE = "safe";
    GMX_TYPING_MIN = 55;
    GMX_TYPING_MAX = 85;
  }
}


function normalizeEditorText(v){
  return String(v || "")
    .replace(/​/g, "")
    .replace(/ /g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function readEditorText(box){
  if (!box) return "";
  try{
    const dataNodes = Array.from(box.querySelectorAll('[data-text="true"]'));
    if (dataNodes.length){
      const joined = dataNodes.map((n)=> String(n.textContent || "")).join("");
      const norm = normalizeEditorText(joined);
      if (norm) return norm;
    }
  }catch(_e){}
  return normalizeEditorText(box.innerText || box.textContent || "");
}

function focusEditorBox(box, selectAll=false){
  if (!box) return;
  try{ box.focus(); }catch{}
  try{
    const sel = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(box);
    if (!selectAll) range.collapse(false);
    sel.removeAllRanges();
    sel.addRange(range);
  }catch{}
}

function emitEditorInput(box, data, inputType="insertText"){
  if (!box) return;
  try{ box.dispatchEvent(new InputEvent("beforeinput", { bubbles:true, cancelable:true, data: data ?? null, inputType })); }catch{}
  try{ box.dispatchEvent(new InputEvent("input", { bubbles:true, data: data ?? null, inputType })); }catch{}
  try{ box.dispatchEvent(new Event("change", { bubbles:true })); }catch{}
  try{ box.dispatchEvent(new KeyboardEvent("keyup", { bubbles:true, key:" ", code:"Space" })); }catch{}
}

function buildPasteEvent(text){
  try{
    const ev = new Event("paste", { bubbles:true, cancelable:true });
    const dt = (typeof DataTransfer !== "undefined") ? new DataTransfer() : null;
    if (dt){
      try{ dt.setData("text/plain", String(text || "")); }catch{}
      try{ dt.setData("text/html", String(text || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, "<br>")); }catch{}
      try{ Object.defineProperty(ev, "clipboardData", { configurable:true, value: dt }); }catch{}
    }
    return ev;
  }catch(_e){
    return null;
  }
}

function findWritableLeaf(box){
  if (!box || !box.querySelector) return box || null;
  const contents = box.querySelector('[data-contents="true"]');
  if (!contents) return box;
  return contents.querySelector('div[dir="auto"]')
    || contents.querySelector('span[data-text="true"]')
    || contents.querySelector('div[data-block="true"]')
    || contents.firstElementChild
    || contents;
}

function writeEditorLeaf(box, text){
  if (!box) return false;
  try{
    const target = findWritableLeaf(box) || box;
    if (target === box){
      const sel = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(box);
      range.deleteContents();
      const node = document.createTextNode(String(text || ""));
      range.insertNode(node);
      range.setStartAfter(node);
      range.collapse(true);
      sel.removeAllRanges();
      sel.addRange(range);
    } else {
      while (target.firstChild) target.removeChild(target.firstChild);
      target.appendChild(document.createTextNode(String(text || "")));
      focusEditorBox(box, false);
    }
    emitEditorInput(box, text, "insertText");
    return true;
  }catch(_e){
    return false;
  }
}

async function setTextboxText(box, text, opts={}){
  if (!box) return false;
  const t = String(text || "");

  // Human-like typing (tunable). Default is fast-but-human.
  const minDelay = Math.max(10, Number(opts.minDelay ?? GMX_TYPING_MIN));
  const maxDelay = Math.max(minDelay, Number(opts.maxDelay ?? GMX_TYPING_MAX));

  const target = normalizeEditorText(t);
  const isApplied = ()=> target ? (readEditorText(box) === target || readEditorText(box).includes(target)) : readEditorText(box) === "";

  const settleAndCheck = async (waitMs)=>{
    await sleep(waitMs);
    return isApplied();
  };

  const clearSelection = ()=>{
    try{ box.click(); }catch{}
    focusEditorBox(box, true);
    try{ document.execCommand("selectAll", false, null); }catch{}
    try{ document.execCommand("delete", false, null); }catch{}
    if (readEditorText(box)){
      try{ writeEditorLeaf(box, ""); }catch(_e){}
    }
    emitEditorInput(box, "", "deleteContentBackward");
  };

  if (!target){
    clearSelection();
    return await settleAndCheck(18);
  }

  if (isApplied()) return true;

  try{
    try{ box.click(); }catch{}
    focusEditorBox(box, false);
    try{ document.execCommand("selectAll", false, null); }catch{}
    const ok = document.execCommand("insertText", false, t);
    if (ok !== false){
      emitEditorInput(box, t, "insertText");
      if (await settleAndCheck(24)) return true;
    }
  }catch{}

  try{
    clearSelection();
    focusEditorBox(box, false);
    const ok = document.execCommand("insertText", false, t);
    if (ok !== false){
      emitEditorInput(box, t, "insertText");
      if (await settleAndCheck(24)) return true;
    }
  }catch{}

  try{
    clearSelection();
    focusEditorBox(box, false);
    const pasteEv = buildPasteEvent(t);
    if (pasteEv){
      box.dispatchEvent(pasteEv);
      emitEditorInput(box, t, "insertFromPaste");
      if (await settleAndCheck(32)) return true;
    }
  }catch{}

  try{
    clearSelection();
    focusEditorBox(box, false);
    const html = String(t)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\n/g, "<br>");
    const ok = document.execCommand("insertHTML", false, html);
    if (ok !== false){
      emitEditorInput(box, t, "insertText");
      if (await settleAndCheck(24)) return true;
    }
  }catch{}

  if (writeEditorLeaf(box, t)){
    if (await settleAndCheck(20)) return true;
  }

  try{
    clearSelection();
    await sleep(randBetween(minDelay, maxDelay));
    for (const ch of splitGraphemes(t)) {
      focusEditorBox(box, false);
      let wrote = false;
      try{
        wrote = (document.execCommand("insertText", false, ch) !== false);
      }catch{}
      if (!wrote){
        try{
          const sel = window.getSelection();
          const range = sel && sel.rangeCount ? sel.getRangeAt(0) : null;
          if (range){
            const node = document.createTextNode(ch);
            range.insertNode(node);
            range.setStartAfter(node);
            range.collapse(true);
            sel.removeAllRanges();
            sel.addRange(range);
          }
        }catch{}
      }
      emitEditorInput(box, ch, "insertText");
      await sleep(randBetween(minDelay, maxDelay));
    }
    if (await settleAndCheck(24)) return true;
  }catch{}

  return isApplied();
}

async function clickReplyButton(){
  const btn = document.querySelector('div[data-testid="reply"], button[data-testid="reply"]');
  if (btn) btn.click();
  await sleep(450);
}

function cleanReplyText(text){
  let t = String(text||"").trim();
  t = t.replace(/[—–]/g," ").replace(/\s*-\s*/g," ");
  t = t.replace(/\b(everyone|builders|builderz|folks|guys|community)\b/ig,"");
  t = t.replace(/\bdegens\b/ig,"degen");
  t = t.replace(/\b(gm|gn|good morning|good night)\s+all\b/ig,"$1");
  t = t.replace(/\s{2,}/g," ").trim();
  t = t.replace(/\. (?=[a-z])/g,", ");
  t = t.replace(/\s+,/g,",").replace(/,+/g,",").replace(/\s{2,}/g," ").trim();
  return t;
}

function normalizeLine(t){
  return cleanReplyText(t).replace(/\s+/g," ").trim();
}

// --- Insert queue (prevents overlapping inserts) ---
let __GMX_INSERT_QUEUE = Promise.resolve();
function enqueueInsert(task){
  const run = __GMX_INSERT_QUEUE.then(() => task());
  __GMX_INSERT_QUEUE = run.catch(()=>{});
  return run;
}

// --- Template / safety / diagnostics ---
function findAuthorHandle(){
  try{
    const selectors = [
      'article div[data-testid="User-Name"] a[role="link"]',
      'div[data-testid="User-Name"] a[role="link"]',
      'article a[role="link"][href^="/"]:not([href*="/status/"])',
      'a[role="link"][href^="/"]:not([href*="/status/"])'
    ];
    for (const sel of selectors){
      const a = document.querySelector(sel);
      const href = a?.getAttribute?.("href") || "";
      const m = href.match(/^\/([A-Za-z0-9_]{1,30})(?:\/|$)/);
      if (m && m[1] && m[1] !== "i") return "@" + m[1];
    }
  }catch(_e){}
  return "";
}

function applyTemplate(tpl, reply, ctx){
  const t = String(tpl || "{reply}");
  const r = String(reply || "");
  const author = String(ctx?.author || "");
  return t
    .replace(/\{reply\}/g, r)
    .replace(/\{author\}/g, author)
    .trim();
}

function looksLikeUrl(s){
  return /(https?:\/\/|www\.)/i.test(s || "");
}

function isSuspiciousText(s){
  const t = String(s || "").toLowerCase();
  if (!t.trim()) return false;
  if (/(seed phrase|recovery phrase|private key|mnemonic)/i.test(t)) return true;
  if (/(connect wallet|walletconnect|sign this|approve|airdrop claim)/i.test(t)) return true;
  if (/(send me|transfer|deposit)\s+\$?\d+/i.test(t)) return true;
  if (looksLikeUrl(t) && /(bit\.ly|tinyurl|t\.co\/)/i.test(t)) return true;
  return false;
}

async function postDiag(base, cfg, event_type, ok, error_code, meta){
  try{
    const diagEnabled = (cfg?.diagEnabled !== false);
    if (!diagEnabled) return;
    const client_id = await getClientId();
    const ext_version = chrome?.runtime?.getManifest?.()?.version || "";
    const url = (String(base || "https://www.gmxreply.com").replace(/\/$/,"")) + "/api/ext/event";
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-gmx-client": client_id },
      body: JSON.stringify({
        client_id,
        ext_version,
        event_type,
        ok: !!ok,
        error_code: error_code || "",
        meta: meta || {}
      })
    }).catch(()=>{});
  }catch(_e){}
}



function randInt(n){ return Math.floor(Math.random()*n); }

async function pickFromList({ kind, view, lang, antiRepeat }){
  const EMPTY = "__EMPTY__";
  const globalKey = `${kind}_list_global`;
  const langKey = `${kind}_list_${lang}`;

  const keys = view === "lang" ? [langKey, globalKey] : [globalKey];
  const o = await chrome.storage.sync.get(keys);

  let candidates = [];
  for (const k of keys){
    const arr = Array.isArray(o[k]) ? o[k] : [];
    candidates = arr.filter(x=>x!==EMPTY).map(normalizeLine).filter(Boolean);
    if (candidates.length) break;
  }
  if (!candidates.length) return { reply: "", source: "empty" };

  // history stored in local storage (not sync)
  const histKey = `hist_${kind}_${lang}_${view}`;
  const lo = await chrome.storage.local.get([histKey]);
  const hist = Array.isArray(lo[histKey]) ? lo[histKey] : [];

  const strength = Math.max(0, Math.min(100, Number(antiRepeat)||0));
  const window = Math.max(0, Math.round((strength/100) * Math.min(25, candidates.length-1)));
  const recent = new Set(hist.slice(-window).map(x=>x.toLowerCase()));

  const pool = window ? candidates.filter(x=>!recent.has(x.toLowerCase())) : candidates;
  const chosen = (pool.length ? pool : candidates)[randInt((pool.length ? pool : candidates).length)];

  const newHist = hist.concat([chosen]).slice(-60);
  await chrome.storage.local.set({ [histKey]: newHist });

  return { reply: chosen, source: "list" };
}

async function getListCandidates({ kind, view, lang }){
  const EMPTY = "__EMPTY__";
  const globalKey = `${kind}_list_global`;
  const langKey = `${kind}_list_${lang}`;
  const keys = (view === "lang") ? [langKey, globalKey] : [globalKey];
  const o = await chrome.storage.sync.get(keys);
  let all = [];
  for (const k of keys){
    const arr = Array.isArray(o[k]) ? o[k] : [];
    for (const x of arr){
      if (!x || x === EMPTY) continue;
      const t = normalizeLine(x);
      if (t) all.push(t);
    }
  }
  // uniq + hard cap
  const seen = new Set();
  const out = [];
  for (const t of all){
    const key = t.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(t);
    if (out.length >= 300) break;
  }
  return out;
}

async function apiConsume(base, handle, token, { kind }){
  const url = `${base}/api/consume`;
  const r = await fetch(url, {
    method: "POST",
    headers: { "Content-Type":"application/json", "Authorization": "Bearer " + token },
    body: JSON.stringify({ kind })
  });
  const j = await r.json().catch(()=>({}));
  if (!r.ok) throw new Error(j.error || "consume_failed");
  return j;
}

async function apiGenerate(base, handle, token, { kind, mode, lang, style }){
  const url = `${base}/api/random?kind=${encodeURIComponent(kind)}&mode=${encodeURIComponent(mode)}&lang=${encodeURIComponent(lang)}&style=${encodeURIComponent(style||"classic")}`;
  const r = await fetch(url, { headers: { "Authorization": "Bearer " + token } });
  const j = await r.json().catch(()=>({}));
  if (!r.ok) throw new Error(j.error || "random_failed");
  return j;
}

async function apiPreview(base, handle, token, { kind, mode, lang, style, anti_last_n }){
  const url = `${base}/api/tools/preview?kind=${encodeURIComponent(kind)}&mode=${encodeURIComponent(mode)}&lang=${encodeURIComponent(lang)}&style=${encodeURIComponent(style||"classic")}&anti_last_n=${encodeURIComponent(String(anti_last_n||0))}`;
  const r = await fetch(url, { headers: { "Authorization": "Bearer " + token } });
  const j = await r.json().catch(()=>({}));
  if (!r.ok) throw new Error(j.error || "preview_failed");
  return j;
}


async function apiRandomBulk(base, handle, token, { kind, mode, lang, style, count, anti_last_n }){
  const c = Math.max(1, Math.min(10, Math.floor(Number(count||3))));
  const url = `${base}/api/random-bulk?kind=${encodeURIComponent(kind)}&mode=${encodeURIComponent(mode)}&lang=${encodeURIComponent(lang)}&style=${encodeURIComponent(style||"classic")}&count=${encodeURIComponent(String(c))}&anti_last_n=${encodeURIComponent(String(anti_last_n||0))}`;
  const r = await fetch(url, { headers: { "Authorization": "Bearer " + token } });
  const j = await r.json().catch(()=>({}));
  if (!r.ok) throw new Error(j.error || "random_bulk_failed");
  return j;
}

function replyScore(text, kind){
  const t = String(text||"").trim();
  if (!t) return -1e9;
  const len = Array.from(t).length;
  const ideal = (kind === "gn") ? 22 : 18;
  let s = 0;
  s -= Math.abs(len - ideal);
  if (len < 8) s -= (8 - len) * 3;
  if (len > 55) s -= (len - 55) * 2;

  const emojiCount = (t.match(/\p{Extended_Pictographic}/gu) || []).length;
  if (emojiCount > 1) s -= (emojiCount - 1) * 3;
  if (/\bhttps?:\/\//i.test(t)) s -= 6;
  if (/[!?]{2,}/.test(t)) s -= 2;
  if (/\b(gm|gn)\b/i.test(t)) s += 2;
  if (/^[A-Z]/.test(t)) s += 1;
  if (/\b(thanks|appreciate|love|great)\b/i.test(t)) s += 1;
  return s;
}

function tokenizeForMatch(s){
  const t = String(s||"")
    .toLowerCase()
    .replace(/https?:\/\/\S+/g, " ")
    .replace(/[@#][\p{L}0-9_]+/gu, " ")
    .replace(/[\p{P}\p{S}]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!t) return [];
  const stop = new Set([
    // EN
    "the","a","an","and","or","but","to","of","in","on","for","with","is","are","was","were","be","been","it","this","that","as","at","by","from","you","we","i","they","he","she","them","us",
    // RU (very small)
    "и","а","но","что","это","как","на","в","во","к","по","за","из","у","для","с","со","я","ты","мы","вы","они","он","она","оно","их","нас","вам"
  ]);
  return t.split(" ").filter(w => w.length >= 3 && !stop.has(w));
}

function bestMatchScores(candidates, kind, tweetText){
  const tweetToks = tokenizeForMatch(tweetText);
  const tweetSet = new Set(tweetToks);

  const scored = [];
  for (const c of candidates){
    const t = cleanReplyText(c);
    if (!t) continue;
    const base = replyScore(t, kind);
    let overlap = 0;
    if (tweetSet.size){
      const rt = tokenizeForMatch(t);
      const rset = new Set(rt);
      for (const w of rset){
        if (tweetSet.has(w)) overlap += 1;
      }
    }
    const score = base + overlap * 3; // overlap matters a lot for "best"
    scored.push({ t, score, overlap });
  }
  scored.sort((a,b)=>b.score - a.score);
  return scored;
}

function weightedPickTop3(scored){
  const top = scored.slice(0, 3);
  if (!top.length) return "";
  const w = [0.60, 0.25, 0.15];
  const weights = top.map((_,i)=>w[i] || 0.10);
  const sum = weights.reduce((a,b)=>a+b,0);
  let r = Math.random() * sum;
  for (let i=0;i<top.length;i++){
    r -= weights[i];
    if (r <= 0) return top[i].t;
  }
  return top[0].t;
}

function chooseBest(candidates, kind, tweetText){
  const uniq = [];
  const seen = new Set();
  for (const c of candidates){
    const t = cleanReplyText(c);
    const key = (t||"").toLowerCase();
    if (!t || seen.has(key)) continue;
    seen.add(key);
    uniq.push(t);
  }
  if (!uniq.length) return "";

  const scored = bestMatchScores(uniq, kind, tweetText || "");
  // If tweet has content but nothing overlaps, we still allow a good generic pick.
  // Generation fallback is decided by caller using finalText + source.
  return weightedPickTop3(scored);
}




chrome.runtime.onMessage.addListener((msg, sender, sendResponse)=>{
  if (msg?.type !== "GMX_INSERT" && msg?.type !== "GMX_INSERT_BEST" && msg?.type !== "GMX_INSERT_GEN") return false;

  try{ sendResponse({ ok:true, queued:true }); }catch(_e){}

  enqueueInsert(async ()=>{
    const p = msg.payload || {};
    const base = normBase(p.base || DEFAULT_BASE);

    // Ensure we have the latest DOM selectors (self-heal when X changes)
    try{ await loadRemoteSelectors(base, false); }catch(_e){}

    const cfg = {
      diagEnabled: (p.diagEnabled !== false),
      safetyCheckEnabled: (p.safetyCheckEnabled !== false),
    };

    const handle = p.handle;
    const token = p.token;
    const kind = p.kind === "gn" ? "gn" : "gm";
    const mode = (p.mode === "mid" || p.mode === "max") ? p.mode : "min";
    const style = p.style || "classic";
    const antiRepeat = Number(p.antiRepeat ?? 35);

    if (p.openComposerFirst) await clickReplyButton();

    const view = p.view || "global";
    const lang = normLang(p.langMode);
    const isBest = (msg?.type === "GMX_INSERT_BEST");
    const forceGen = (msg?.type === "GMX_INSERT_GEN");

    let finalText = "";
    let source = "list";
    try{
      if (forceGen){
        if (!handle || !token){
          await postDiag(base, cfg, "generate", false, "not_connected", { kind, view, lang, source:"none" });
          return { ok:false, error:"not_connected" };
        }
        const j = await apiGenerate(base, handle, token, { kind, mode, lang, style });
        finalText = cleanReplyText(j.reply || "");
        source = "generated";
      } else if (!isBest){
        // Prefer saved list, but if local sync is empty and user is connected,
        // fall back to a direct API generation so GM/GN still work.
        const picked = await pickFromList({ kind, view, lang, antiRepeat });
        if (!picked.reply){
          if (handle && token){
            const j = await apiGenerate(base, handle, token, { kind, mode, lang, style });
            finalText = cleanReplyText(j.reply || "");
            source = "generated";
          } else {
            await postDiag(base, cfg, "insert", false, "empty_list", { kind, view, lang, source:"list" });
            toastInline("No saved replies. Add them on the site.");
            return { ok:false, error:"empty_list" };
          }
        } else {
          finalText = picked.reply;
          source = picked.source;
        }
      } else {
        let candidates = await getListCandidates({ kind, view, lang });
        // If not enough list candidates, fallback to generation/bulk.
        if (candidates.length < 2){
          if (!handle || !token){
            await postDiag(base, cfg, "insert_best", false, "not_connected", { kind, view, lang });
            return { ok:false, error:"not_connected" };
          }
          const n = Math.min(5, Math.max(2, Number(p.bestCount||3)));
          const anti_last_n = Math.max(0, Math.round((Math.max(0, Math.min(100, antiRepeat))/100) * 10));
          try{
            const bj = await apiRandomBulk(base, handle, token, { kind, mode, lang, style, count: n, anti_last_n });
            const arr = Array.isArray(bj.list) ? bj.list : [];
            candidates = [];
            for (const r of arr){
              const t = cleanReplyText(r || "");
              if (t) candidates.push(t);
            }
            source = "bulk";
          }catch(_e){
            const j = await apiGenerate(base, handle, token, { kind, mode, lang, style });
            const t = cleanReplyText(j.reply || "");
            if (t) candidates = [t];
            source = "generated";
          }
        }
        finalText = chooseBest(candidates, kind, findTweetText());
        if (!finalText && handle && token){
          const j = await apiGenerate(base, handle, token, { kind, mode, lang, style });
          finalText = cleanReplyText(j.reply || "");
          source = "generated";
        }
      }

      if (!finalText){
        await postDiag(base, cfg, isBest ? "insert_best" : "insert", false, "empty", { kind, view, lang, source });
        return { ok:false, error:"empty" };
      }

      // Template + context
      const template = String(p.template || "{reply}");
      finalText = applyTemplate(template, finalText, { author: findAuthorHandle() });

      if (cfg.safetyCheckEnabled && isSuspiciousText(finalText)){
            toastInline("Blocked suspicious text (link / wallet / seed).");
            await postDiag(base, cfg, "insert", false, "cancelled", { kind, view, lang, source, suspicious:true });
            return { ok:false, error:"blocked_suspicious" };
          }

      let box = findReplyBox();
      if (!box){
        try{ await loadRemoteSelectors(base, true); }catch(_e){}
        box = findReplyBox();
      }
      if (!box){
        await postDiag(base, cfg, "insert", false, "reply_box_not_found", { kind, view, lang, source });
        return { ok:false, error:"reply_box_not_found" };
      }

      await setTextboxText(box, finalText);

      if (source === "list" && handle && token){
        try{ await apiConsume(base, handle, token, { kind }); }catch(_e){}
      }

      await postDiag(base, cfg, isBest ? "insert_best" : "insert", true, "", {
        kind, view, lang, source,
        selectorsVersion: REMOTE_SELECTORS?.version || 1,
        inRollout: !!REMOTE_SELECTORS?.inRollout,
        rolloutPercent: Number(REMOTE_SELECTORS?.rolloutPercent ?? 100)
      });

      return { ok:true, source, lang };
    }catch(e){
      await postDiag(base, cfg, isBest ? "insert_best" : "insert", false, String(e?.message || "insert_failed").slice(0,64), { kind, view, lang, source });
      return { ok:false, error: e?.message || "insert_failed" };
    }
  }).catch(()=>{});

  return false;
});


/* ---------------------------
   GMXReply Inline Toolbar for X
   Goal: no popup needed — buttons appear next to reply composer.
   Includes self-healing via MutationObserver + focus tracking.
---------------------------- */
(function initInlineToolbar(){
  try{
    try{
      if (window.top !== window.self) return;
      if (!/^https:\/\/(x\.com|twitter\.com)\//i.test(String(location.href||""))) return;
    }catch(_e){}
    // Load remote selectors for self-healing when X changes DOM
    (async ()=>{
      try{
        const s = await chrome.storage.local.get(["apiBase"]);
        const base = normBase(s.apiBase);
        try{ window.__GMXREPLY_API_BASE = base; }catch{}
        await loadRemoteSelectors(base, false);
        setInterval(()=>loadRemoteSelectors(base, false), 30*60*1000);
        try{
          const d = await chrome.storage.sync.get(["diagEnabled"]);
          await postDiag(base, { diagEnabled: (d.diagEnabled !== false) }, "selfcheck", true, "", {
            selectorsVersion: REMOTE_SELECTORS?.version || 1,
            inRollout: !!REMOTE_SELECTORS?.inRollout,
            rolloutPercent: Number(REMOTE_SELECTORS?.rolloutPercent ?? 100)
          });
        }catch(_e){}
      }catch(_e){}
    })();

    if (window.__GMXREPLY_INLINE_INIT) return;
    window.__GMXREPLY_INLINE_INIT = true;

    const STYLE_ID = "gmxreply_inline_style";
    const BAR_ATTR = "data-gmxreply-inline";
    const LAST_KIND_KEY = "gmx_last_kind_v1";
    async function setLastKindLocal(kind){
      try{ await chrome.storage.local.set({ [LAST_KIND_KEY]: kind }); }catch(_e){}
    }

    function injectInlineStyle(){
      if (document.getElementById(STYLE_ID)) return;
      const css = `
        :root{
          --gmxA: rgba(124,92,255,1);
          --gmxB: rgba(0,229,255,1);
          --gmxTextDark: rgba(10,13,21,1);
          --gmxBorder: rgba(255,255,255,.18);
        }
        .gmxreply-bar{
          display:inline-flex;
          gap:6px;
          align-items:center;
          flex: 0 0 auto;
          white-space: nowrap;
          margin-left: 0;
          margin-right: 8px;
          min-width: auto;
        }
        .gmxreply-bar.below{
          display:flex;
          width:100%;
          max-width:100%;
          margin: 10px 0 0;
          padding-top: 6px;
          flex-wrap: wrap;
          white-space: normal;
          gap: 6px;
        }
        .gmxreply-bar.compact{
          gap:4px;
          margin-left:0;
          margin-right:6px;
        }
        .gmxreply-bar.dock-right{
          position:absolute;
          right: calc(100% + 8px);
          top: 50%;
          transform: translateY(-50%);
          margin: 0 !important;
          z-index: 5;
        }
        .gmxreply-bar.dock-right.compact{
          right: calc(100% + 6px);
        }
        .gmxreply-bar.dock-right.below{
          position:absolute !important;
          width:auto;
          max-width:none;
          margin:0 !important;
          padding-top:0;
          flex-wrap:nowrap;
          white-space:nowrap;
        }
        .gmxreply-btn{
          cursor:pointer;
          user-select:none;
          border: 1px solid var(--gmxBorder);
          background: linear-gradient(135deg, var(--gmxA) 0%, var(--gmxB) 100%);
          color: var(--gmxTextDark);
          font-weight: 900;
          font-size: 12px;
          line-height: 1;
          padding: 8px 10px;
          border-radius: 999px;
          min-height: 30px;
          box-shadow: 0 1px 2px rgba(0,0,0,.20);
        }
        .gmxreply-btn.secondary{
          background: rgba(255,255,255,.08);
          color: rgba(255,255,255,.92);
        }
        .gmxreply-btn.secondary.bestOn{
          background: linear-gradient(135deg, var(--gmxA) 0%, var(--gmxB) 100%);
          color: var(--gmxTextDark);
        }
        .gmxreply-bar.compact .gmxreply-btn{
          padding: 7px 9px;
          min-height: 28px;
          font-size: 11px;
        }
        .gmxreply-btn.loading{
          opacity:.85;
          filter: saturate(.9);
          cursor: progress;
        }
        .gmxreply-btn:active{ transform: translateY(1px); }
        .gmxreply-launcher{ display:none !important; }
        .gmxreply-toast{
          position: fixed;
          left: 50%;
          bottom: 18px;
          transform: translateX(-50%);
          z-index: 10000;
          padding: 10px 12px;
          border-radius: 999px;
          border: 1px solid rgba(255,255,255,.14);
          background: rgba(10,12,18,.75);
          color: rgba(255,255,255,.92);
          font-size: 12px;
          backdrop-filter: blur(10px);
          box-shadow: 0 14px 45px rgba(0,0,0,.40);
          max-width: min(92vw, 520px);
          text-align:center;
        }
        @media (prefers-color-scheme: light){
          .gmxreply-btn{
            border: 1px solid rgba(0,0,0,.22);
            box-shadow: 0 1px 2px rgba(0,0,0,.18);
          }
          .gmxreply-btn.secondary{
            background: rgba(0,0,0,.08);
            color: rgba(0,0,0,.88);
          }
        }
        @media (pointer: coarse){
          .gmxreply-btn{ padding: 10px 12px; min-height: 36px; font-size: 13px; }
        }
      `;
      const st = document.createElement("style");
      st.id = STYLE_ID;
      st.textContent = css;
      document.head.appendChild(st);
    }

    const INLINE_THEME_MAP = {
      classic: { a:'rgba(124,92,255,1)', b:'rgba(0,229,255,1)' },
      solflare: { a:'rgba(250,204,21,1)', b:'rgba(250,204,21,0.75)' },
      phantom: { a:'rgba(167,139,250,1)', b:'rgba(99,102,241,1)' },
      midnight: { a:'rgba(34,211,238,1)', b:'rgba(99,102,241,1)' }
    };
    let INLINE_THEMES_LOADED = false;

    function parseColorToRgb(c){
      const s = String(c||"").trim();
      if (!s) return null;
      // rgba(r,g,b,a) or rgb(r,g,b)
      let m = s.match(/rgba?\((\s*\d+\s*),(\s*\d+\s*),(\s*\d+\s*)(?:,(\s*[0-9\.]+\s*))?\)/i);
      if (m){
        return [Number(m[1]), Number(m[2]), Number(m[3])].map(v=>Math.max(0, Math.min(255, v)));
      }
      // hex
      m = s.match(/^#?([0-9a-f]{6})$/i);
      if (m){
        const h = m[1];
        return [parseInt(h.slice(0,2),16), parseInt(h.slice(2,4),16), parseInt(h.slice(4,6),16)];
      }
      return null;
    }
    function relLum(rgb){
      const [r,g,b] = rgb.map(v=>v/255);
      const f = (x)=> x <= 0.03928 ? x/12.92 : Math.pow((x+0.055)/1.055, 2.4);
      const R=f(r), G=f(g), B=f(b);
      return 0.2126*R + 0.7152*G + 0.0722*B;
    }
    function pickOnColor(a, b){
      const ra = parseColorToRgb(a);
      const rb = parseColorToRgb(b);
      const la = ra ? relLum(ra) : 0.5;
      const lb = rb ? relLum(rb) : 0.5;
      const l = (la + lb) / 2;
      // If background is bright, use dark text, else white.
      return (l > 0.62) ? "rgba(10,13,21,1)" : "rgba(255,255,255,0.96)";
    }

    async function loadInlineThemesFromBundle(){
      if (INLINE_THEMES_LOADED) return;
      INLINE_THEMES_LOADED = true;
      try{
        const url = chrome.runtime.getURL("themes.json");
        const r = await fetch(url, { cache:"no-store" });
        const j = await r.json();
        const arr = (j && j.themes) ? j.themes : [];
        for (const t of arr){
          if (!t || !t.id) continue;
          const id = String(t.id).trim();
          const a = String(t.a || "").trim();
          const b = String(t.b || "").trim();
          if (!id || !a || !b) continue;
          INLINE_THEME_MAP[id] = { a, b };
        }
      }catch(_e){}
      // Re-apply current theme once we have the full map
      try{
        const s = await chrome.storage.sync.get(['pref_ext_theme']);
        applyInlineTheme(s && s.pref_ext_theme);
      }catch(_e){}
    }

    function applyInlineTheme(themeId){
      const id = String(themeId||'').trim() || 'classic';
      const t = INLINE_THEME_MAP[id] || INLINE_THEME_MAP.classic;
      if (!t) return;
      const on = pickOnColor(t.a, t.b);
      const root = document.documentElement;
      root.style.setProperty('--gmxA', t.a);
      root.style.setProperty('--gmxB', t.b);
      root.style.setProperty('--gmxTextDark', on);
      root.style.setProperty('--gmxBorder', 'rgba(255,255,255,.18)');
    }


    async function syncInlineTheme(){
      try{
        const s = await chrome.storage.sync.get(['pref_ext_theme']);
        applyInlineTheme(s.pref_ext_theme);
      }catch{}
    }

    function toastInline(msg){
      try{
        const id = "gmxreply_inline_toast";
        const old = document.getElementById(id);
        if (old) old.remove();
        const t = document.createElement("div");
        t.id = id;
        t.className = "gmxreply-toast";
        t.textContent = String(msg||"");
        document.body.appendChild(t);
        setTimeout(()=>{ try{ t.remove(); }catch{} }, 2200);
      }catch{}
    }

    function isLikelyComposer(box){
      if (!box) return false;
      if (!box.isContentEditable) return false;
      const dt = box.getAttribute("data-testid") || "";
      if (dt.includes("tweetTextarea")) return true;
      if (box.closest('div[data-testid^="tweetTextarea_"]')) return true;
      const al = (box.getAttribute("aria-label")||"").toLowerCase();
      if (al.includes("post") || al.includes("tweet") || al.includes("reply")) return true;
      // X sometimes nests it in a dialog during reply
      if (box.closest('div[role="dialog"]')) return true;
      return false;
    }

    function findComposerBoxes(){
      const remote = (REMOTE_SELECTORS && Array.isArray(REMOTE_SELECTORS.composer)) ? REMOTE_SELECTORS.composer : [];
      if (remote.length){
        const nodes = queryAll(remote).filter(isLikelyComposer);
        if (nodes.length) return nodes;
      }
      const all = Array.from(document.querySelectorAll('div[role="textbox"]'));
      return all.filter(isLikelyComposer);
    }

    function anchorForBox(box){
      // Prefer a stable container that survives inner re-renders
      const root = box.closest('div[data-testid^="tweetTextarea_"]') || box.parentElement;
      const anchor = root?.parentElement || root || box.parentElement || box;
      return anchor;
    }

    function findActionRowForBox(box){
      try{
        const root = box.closest('div[data-testid^="tweetTextarea_"]') || box.closest('div[role="dialog"]') || box.parentElement;
        if (!root) return null;
        const btn = root.querySelector('div[data-testid="tweetButtonInline"],button[data-testid="tweetButtonInline"],div[data-testid="tweetButton"],button[data-testid="tweetButton"]');
        if (!btn) return null;

        const pickDirectChild = (parent, node)=>{
          let cur = node;
          while (cur && cur.parentElement && cur.parentElement !== parent){
            cur = cur.parentElement;
          }
          return cur || node;
        };

        const looksWideEnough = (el)=>{
          try{
            const r = el.getBoundingClientRect();
            return !!(r && r.width >= 220 && r.height >= 24 && r.height <= 120);
          }catch(_e){
            return false;
          }
        };

        const toolbarProbe = root.querySelector('[data-testid="toolBar"]');
        if (toolbarProbe){
          let row = toolbarProbe;
          for (let i=0; i<6 && row && row !== document.body; i++){
            if (row.contains(btn) && looksWideEnough(row)) return { row, before: pickDirectChild(row, btn) };
            if (row === root) break;
            row = row.parentElement;
          }
        }

        const actionSignals = [
          '[data-testid="toolBar"]',
          '[data-testid="fileInput"]',
          '[data-testid="gifSearchButton"]',
          '[data-testid="addPollButton"]',
          '[data-testid="geoButton"]',
          '[data-testid="scheduleOption"]'
        ].join(',');

        let cur = btn.parentElement;
        let fallback = null;
        for (let i=0; i<8 && cur && cur !== document.body; i++, cur = cur.parentElement){
          if (root && !root.contains(cur)) break;
          if (!fallback && looksWideEnough(cur)) fallback = cur;
          const direct = pickDirectChild(cur, btn);
          const st = window.getComputedStyle(cur);
          const hasSignals = !!cur.querySelector(actionSignals);
          const isFlex = st && st.display === 'flex';
          const isGroup = String(cur.getAttribute('role') || '') === 'group';
          if (looksWideEnough(cur) && direct && (hasSignals || (isFlex && cur.children.length >= 2) || isGroup)){
            return { row: cur, before: direct, button: btn };
          }
        }

        if (fallback){
          return { row: fallback, before: pickDirectChild(fallback, btn), button: btn };
        }

        const row = btn.closest('div[role="group"]') || btn.parentElement;
        if (!row) return null;
        return { row, before: pickDirectChild(row, btn), button: btn };
      }catch(_e){
        return null;
      }
    }

    function ensureRelative(el){
      if (!el) return;
      const cs = window.getComputedStyle(el);
      if (cs.position === "static"){
        el.style.position = "relative";
      }
    }

    function hasToolbarSignals(el){
      if (!el || !el.querySelector) return false;
      try{
        return !!el.querySelector('[data-testid="toolBar"],[data-testid="fileInput"],[data-testid="gifSearchButton"],[data-testid="addPollButton"],[data-testid="geoButton"],[data-testid="scheduleOption"]');
      }catch(_e){
        return false;
      }
    }

    function ensureVisibleOverflow(el){
      if (!el) return;
      try{
        const cs = window.getComputedStyle(el);
        if (cs.overflow === "hidden") el.style.overflow = "visible";
      }catch(_e){}
    }

    function findReplyDockMount(btn, row){
      try{
        let cur = btn && btn.parentElement ? btn.parentElement : null;
        for (let i=0; i<6 && cur && cur !== document.body; i++, cur = cur.parentElement){
          if (row && !row.contains(cur)) break;
          if (String(cur.tagName || "").toUpperCase() === "BUTTON") continue;
          const rect = cur.getBoundingClientRect();
          const st = window.getComputedStyle(cur);
          const display = String(st?.display || "");
          const okDisplay = (display === "flex" || display === "inline-flex" || display === "block" || display === "inline-block");
          const noSignals = !hasToolbarSignals(cur);
          const okSize = rect.width >= 56 && rect.width <= 260 && rect.height >= 20 && rect.height <= 120;
          if (okDisplay && noSignals && okSize){
            return cur;
          }
          if (row && cur === row) break;
        }
      }catch(_e){}
      return null;
    }

    function isBarCramped(bar){
      try{
        if (!bar || !document.contains(bar)) return false;
        const r = bar.getBoundingClientRect();
        if (!r || !Number.isFinite(r.width)) return false;
        if (r.width < 84) return true;
        if (r.height > 52) return true;
        const host = bar.parentElement ? bar.parentElement.getBoundingClientRect() : null;
        if (host && host.width && r.width > host.width + 8) return true;
      }catch(_e){}
      return false;
    }

    function moveBarBelowBox(box, bar){
      try{
        const anchor = anchorForBox(box);
        if (!anchor || !bar) return false;
        ensureRelative(anchor);
        anchor.appendChild(bar);
        bar.classList.add("below");
        return true;
      }catch(_e){
        return false;
      }
    }

    function setCompactBar(bar, on){
      try{
        if (!bar) return;
        bar.classList.toggle("compact", !!on);
      }catch(_e){}
    }

    async function storageGet(keys){
      return await chrome.storage.sync.get(keys);
    }

    async function loadSettingsForKind(kind){
      const keys = [
        "antiRepeat","openComposerFirst",
        "gmMode","gmView","gmLang","gmStyle","gmTemplate",
        "gnMode","gnView","gnLang","gnStyle","gnTemplate",
        "diagEnabled","safetyCheckEnabled"
      ];

      const [sess, s] = await Promise.all([
        chrome.storage.local.get(["apiBase","handle","token"]),
        storageGet(keys)
      ]);

      const base = normBase(sess.apiBase);
      const handle = sess.handle || "";
      const token = sess.token || "";
      const antiRepeat = Number(s.antiRepeat ?? 35);
      const openComposerFirst = !!s.openComposerFirst;

      const mode = (s[(kind+"Mode")] === "mid" || s[(kind+"Mode")] === "max") ? s[(kind+"Mode")] : "min";
      const view = (s[(kind+"View")] === "lang") ? "lang" : "global";
      const langMode = s[(kind+"Lang")] || findTweetLang();
      const style = s[(kind+"Style")] || "classic";
      const template = String(s[(kind+"Template")] || "{reply}");
      const diagEnabled = (s.diagEnabled !== false);
      const safetyCheckEnabled = (s.safetyCheckEnabled !== false);

      return { base, handle, token, kind, mode, view, langMode, style, antiRepeat, openComposerFirst, template, diagEnabled, safetyCheckEnabled };
    }

    async function doInsertInto(box, kind, isBest){
      return enqueueInsert(async ()=>{
        const cfg = await loadSettingsForKind(kind);

        // keep selectors fresh
        try{ await loadRemoteSelectors(cfg.base, false); }catch(_e){}

        let finalText = "";
        let source = "list";
        const lang = normLang(cfg.langMode);

        try{
          if (!isBest){
            const picked = await pickFromList({ kind, view: cfg.view, lang, antiRepeat: cfg.antiRepeat });
            if (!picked.reply){
              if (cfg.handle && cfg.token){
                const j = await apiGenerate(cfg.base, cfg.handle, cfg.token, { kind, mode: cfg.mode, lang, style: cfg.style });
                finalText = cleanReplyText(j.reply || "");
                source = "generated";
              } else {
                toastInline("No saved replies. Add them on the site.");
                await postDiag(cfg.base, cfg, "insert", false, "empty_list", { kind, view: cfg.view, lang, source:"list" });
                return { ok:false, error:"empty_list" };
              }
            } else {
              finalText = picked.reply;
              source = picked.source;
            }
          }else{
            let candidates = await getListCandidates({ kind, view: cfg.view, lang });
            const tweetText = findTweetText();
            const scored = bestMatchScores(candidates, kind, tweetText);
            const maxOverlap = scored.length ? scored[0].overlap : 0;
            const needFallback = (maxOverlap < 1);

            // If not enough list candidates OR no overlap with the tweet, fallback to bulk/generation.
            if (candidates.length < 2 || needFallback){
              if (!cfg.handle || !cfg.token){
                // If user is not connected but we DO have list candidates, still insert from list.
                if (candidates.length){
                  finalText = chooseBest(candidates, kind, tweetText);
                  source = "list";
                } else {
                  toastInline("Connect your handle to use Best.");
                  await postDiag(cfg.base, cfg, "insert_best", false, "not_connected", { kind, view: cfg.view, lang });
                  return { ok:false, error:"not_connected" };
                }
              } else {
                const n = 5;
                const anti_last_n = Math.max(0, Math.round((Math.max(0, Math.min(100, cfg.antiRepeat))/100) * 10));
                try{
                  const bj = await apiRandomBulk(cfg.base, cfg.handle, cfg.token, { kind, mode: cfg.mode, lang, style: cfg.style, count: n, anti_last_n });
                  const arr = Array.isArray(bj.list) ? bj.list : [];
                  candidates = [];
                  for (const r of arr){
                    const t = cleanReplyText(r || "");
                    if (t) candidates.push(t);
                  }
                  source = "bulk";
                }catch(_e){
                  const j = await apiGenerate(cfg.base, cfg.handle, cfg.token, { kind, mode: cfg.mode, lang, style: cfg.style });
                  const t = cleanReplyText(j.reply || "");
                  if (t) candidates = [t];
                  source = "generated";
                }
                finalText = chooseBest(candidates, kind, tweetText);
              }
            } else {
              finalText = chooseBest(candidates, kind, tweetText);
              source = "list";
            }
            if (!finalText && cfg.handle && cfg.token){
              const j = await apiGenerate(cfg.base, cfg.handle, cfg.token, { kind, mode: cfg.mode, lang, style: cfg.style });
              finalText = cleanReplyText(j.reply || "");
              source = "generated";
            }
          }

          if (!finalText){
            toastInline("No reply generated.");
            await postDiag(cfg.base, cfg, isBest ? "insert_best" : "insert", false, "empty", { kind, view: cfg.view, lang, source });
            return { ok:false, error:"empty" };
          }

          finalText = applyTemplate(cfg.template, finalText, { author: findAuthorHandle() });

          if (cfg.safetyCheckEnabled && isSuspiciousText(finalText)){
            toastInline("Blocked suspicious text (link / wallet / seed).");
            await postDiag(cfg.base, cfg, isBest ? "insert_best" : "insert", false, "cancelled", { kind, view: cfg.view, lang, source, suspicious:true });
            return { ok:false, error:"blocked_suspicious" };
          }

          const liveBox = resolveLiveBox(box, box);
          if (!liveBox){
            toastInline("Reply box not found.");
            await postDiag(cfg.base, cfg, isBest ? "insert_best" : "insert", false, "reply_box_not_found", { kind, view: cfg.view, lang, source });
            return { ok:false, error:"reply_box_not_found" };
          }

          // Use default human-like delays (configured inside setTextboxText).
          const inserted = await setTextboxText(liveBox, finalText);
          if (!inserted){
            toastInline("Could not insert.");
            await postDiag(cfg.base, cfg, isBest ? "insert_best" : "insert", false, "insert_apply_failed", { kind, view: cfg.view, lang, source });
            return { ok:false, error:"insert_apply_failed" };
          }

          // Best-effort quota consume for list inserts
          if (source === "list" && cfg.handle && cfg.token){
            try{ await apiConsume(cfg.base, cfg.handle, cfg.token, { kind }); }catch(_e){}
          }

          await postDiag(cfg.base, cfg, isBest ? "insert_best" : "insert", true, "", {
            kind, view: cfg.view, lang, source,
            selectorsVersion: REMOTE_SELECTORS?.version || 1,
            inRollout: !!REMOTE_SELECTORS?.inRollout,
            rolloutPercent: Number(REMOTE_SELECTORS?.rolloutPercent ?? 100)
          });

          return { ok:true, source, lang };
        }catch(e){
          await postDiag(cfg.base, cfg, isBest ? "insert_best" : "insert", false, String(e?.message || "insert_failed").slice(0,64), { kind, view: cfg.view, lang, source });
          return { ok:false, error: e?.message || "insert_failed" };
        }
      });
    }

    function buildBar(){
      const bar = document.createElement("div");
      bar.className = "gmxreply-bar";
      bar.setAttribute(BAR_ATTR, "1");

      const btnGM = document.createElement("button");
      btnGM.className = "gmxreply-btn";
      btnGM.type = "button";
      btnGM.textContent = "GM";

      const btnGN = document.createElement("button");
      btnGN.className = "gmxreply-btn";
      btnGN.type = "button";
      btnGN.textContent = "GN";

      // Prevent X hotkeys / focus-steal from interfering with the composer.
      [btnGM, btnGN].forEach(b=>{
        const stop = (e)=>{ e.preventDefault(); e.stopPropagation(); };
        b.addEventListener("pointerdown", stop, true);
        b.addEventListener("mousedown", stop, true);
        b.addEventListener("click", (e)=>{ e.stopPropagation(); e.preventDefault(); }, true);
      });

      bar.appendChild(btnGM);
      bar.appendChild(btnGN);
      
      bar.__bind = (box)=>{
        const getBestEnabled = async ()=>{
          try{
            const s = await chrome.storage.sync.get(['bestEnabled']);
            return s.bestEnabled === true;
          }catch(_e){
            return false;
          }
        };

        const run = async (kind, best, btn)=>{
          const targetBox = resolveLiveBox(box, bar);
          if (!targetBox || !document.contains(targetBox)){
            toastInline("Reply box not found.");
            return;
          }
          if (btn.classList.contains("loading")) return;
          btn.classList.add("loading");
          try{
            const bestEnabled = await getBestEnabled();
            const useBest = bestEnabled ? true : !!best;
            const useKind = kind;
            try{ await setLastKindLocal(kind); }catch(_e){}
            const r = await doInsertInto(targetBox, useKind, useBest);
            if (!r.ok){
              toastInline(r.error === "not_connected" ? "Connect on the site first, then reload X." : "Could not insert.");
            }else{
              toastInline(`${useKind.toUpperCase()} inserted (${r.source}${useBest ? ", best" : ""})`);
            }
          }catch(e){
            toastInline("Insert failed. Retrying…");
          }finally{
            btn.classList.remove("loading");
          }
        };
        btnGM.onclick = ()=>run("gm", false, btnGM);
        btnGN.onclick = ()=>run("gn", false, btnGN);
      };

      return bar;
    }

    function ensureBarForBox(box){
      if (!box || !document.contains(box)) return null;
      injectInlineStyle();
      // Apply extension theme to inline buttons
      try{
        if (!window.__GMXREPLY_THEME_SYNC){
          window.__GMXREPLY_THEME_SYNC = true;
          try{ loadInlineThemesFromBundle(); }catch(_e){}
          syncInlineTheme();
          // Typing speed profile (Safe/Balanced/Fast)
          try{
            chrome.storage.sync.get(['typingProfile']).then(s=>applyTypingProfile(s.typingProfile)).catch(()=>{});
          }catch(_e){}
          chrome.storage.onChanged.addListener((changes, area)=>{
            if (area !== 'sync') return;
            if (changes && Object.prototype.hasOwnProperty.call(changes, 'pref_ext_theme')){
              try{ applyInlineTheme(changes.pref_ext_theme.newValue); }catch{}
            }
            if (changes && Object.prototype.hasOwnProperty.call(changes, 'typingProfile')){
              try{ applyTypingProfile(changes.typingProfile.newValue); }catch{}
            }
          });
        }
      }catch{}

      // Primary placement: keep GM/GN inline in the same row as the native Reply/Post button,
      // inserted immediately before that native button cluster.
      const place = findActionRowForBox(box);
      if (place && place.row){
        const owner = box.closest('div[role="dialog"]') || anchorForBox(box) || place.row;
        let bar = owner.querySelector(`.gmxreply-bar[${BAR_ATTR}="1"]`) || place.row.querySelector(`.gmxreply-bar[${BAR_ATTR}="1"]`);
        if (!bar){
          bar = buildBar();
        }

        const hostRow = place.row;
        const beforeNode = (place.before && place.before.parentElement === hostRow) ? place.before : null;
        const replyNode = place.button || beforeNode || null;

        try{
          ensureVisibleOverflow(hostRow);
          if (bar.parentElement !== hostRow){
            if (beforeNode) hostRow.insertBefore(bar, beforeNode);
            else hostRow.appendChild(bar);
          } else if (beforeNode && bar.nextSibling !== beforeNode){
            hostRow.insertBefore(bar, beforeNode);
          }
          bar.classList.remove('dock-right');
          bar.classList.remove('below');

          const verifyInline = ()=>{
            try{
              if (!document.contains(bar)) return;
              if (bar.parentElement !== hostRow){
                if (beforeNode && document.contains(beforeNode)) hostRow.insertBefore(bar, beforeNode);
                else hostRow.appendChild(bar);
              } else if (beforeNode && document.contains(beforeNode) && bar.nextSibling !== beforeNode){
                hostRow.insertBefore(bar, beforeNode);
              }
              bar.classList.remove('dock-right');

              const rr = bar.getBoundingClientRect();
              const br = (replyNode && document.contains(replyNode)) ? replyNode.getBoundingClientRect() : null;
              const tooFar = !!(br && rr && Math.abs(br.left - rr.right) > 260);
              const offscreen = !!(rr && rr.left < -4);
              if (offscreen || tooFar){
                if (moveBarBelowBox(box, bar)){
                  bar.classList.add('below');
                  bar.classList.remove('dock-right');
                }
              } else {
                bar.classList.remove('below');
              }
              setCompactBar(bar, isBarCramped(bar));
            }catch(_e){}
          };

          try{
            verifyInline();
            requestAnimationFrame(verifyInline);
            setTimeout(verifyInline, 60);
            setTimeout(verifyInline, 180);
          }catch(_e){}
        }catch(_e){
          if (!moveBarBelowBox(box, bar)){
            try{ hostRow.appendChild(bar); }catch(_e2){}
          }
          try{ bar.classList.add('below'); }catch(_e2){}
          try{ bar.classList.remove('dock-right'); }catch(_e2){}
        }

        try{ bar.classList.add("show"); }catch(_e){}
        bar.__bind(box);
        return bar;
      }

      // Fallback (rare DOM variants): attach to a stable parent
      const anchor = anchorForBox(box);
      if (!anchor) return null;
      let bar = anchor.querySelector(`.gmxreply-bar[${BAR_ATTR}="1"]`);
      if (!bar){
        bar = buildBar();
        try{ ensureRelative(anchor); }catch(_e){}
        anchor.appendChild(bar);
        try{ bar.classList.add("below"); }catch(_e){}
      }
      try{ bar.classList.add("below"); }catch(_e){}
      try{ bar.classList.add("show"); }catch(_e){}
      bar.__bind(box);
      return bar;
    }

    function showBarFor(box){
      const bar = ensureBarForBox(box);
      if (!bar) return;
      bar.classList.add("show");
      // Track last kind by observing which tab the user is in (rough heuristic)
      window.__GMXREPLY_LAST_KIND = "gm"; // default
      // If composer is in a reply dialog opened from "Good night" context, still fine.
    }

    function hideAllBars(){
      document.querySelectorAll(`.gmxreply-bar[${BAR_ATTR}="1"]`).forEach(b=>b.classList.remove("show"));
    }

    function onFocusIn(e){
      const t = e.target;
      if (isLikelyComposer(t)){
        hideAllBars();
        showBarFor(t);
      }
    }

    // Heuristic: track last kind from typed prefix
    function onInput(e){
      const t = e.target;
      if (!isLikelyComposer(t)) return;
      const s = (t.innerText||"").trim().toLowerCase();
      if (s.startsWith("gn")) window.__GMXREPLY_LAST_KIND = "gn";
      else if (s.startsWith("gm")) window.__GMXREPLY_LAST_KIND = "gm";
    }

    let noComposerTicks = 0;
    let lastCompatRefresh = 0;

    function rescan(){
      try{
        const boxes = findComposerBoxes();

        if (!boxes.length){
          noComposerTicks++;
          const now = Date.now();
          // If X changed DOM and we haven't seen any composer for a while,
          // force-refresh selectors from server and try again (no extension update).
          if (noComposerTicks >= 8 && (now - lastCompatRefresh) > 60_000){
            lastCompatRefresh = now;
            noComposerTicks = 0;
            const base = normBase(window.__GMXREPLY_API_BASE);
            (async ()=>{
              try{
                toastInline("Updating compatibility…");
                await loadRemoteSelectors(base, true);
              }catch(_e){}
            })();
          }
        }else{
          noComposerTicks = 0;
        }

        for (const b of boxes) ensureBarForBox(b);
      }catch{}
    }


    let launcherEl = null;
    function ensureLauncher(){
      if (launcherEl && document.contains(launcherEl)) return launcherEl;
      launcherEl = document.createElement("button");
      launcherEl.className = "gmxreply-launcher";
      launcherEl.type = "button";
      launcherEl.title = "GMXReply";
      launcherEl.textContent = "GMX";
      launcherEl.addEventListener("mousedown", (e)=>{ e.stopPropagation(); });
      launcherEl.addEventListener("click", async (e)=>{
        e.stopPropagation();
        e.preventDefault();
        try{ rescan(); }catch{}
        // Focus an existing composer if present
        const boxes = findComposerBoxes();
        if (boxes.length){
          try{ boxes[0].focus(); }catch{}
          try{ hideAllBars(); showBarFor(boxes[0]); }catch{}
          toastInline("GMXReply ready — open a reply box");
        }else{
          toastInline("Open a reply box and GMX buttons will appear");
        }
      }, { passive:false });
      document.body.appendChild(launcherEl);
      return launcherEl;
    }

    function hideLauncher(){
      try{
        if (launcherEl && launcherEl.remove) launcherEl.remove();
      }catch{}
      launcherEl = null;
    }

    function hasActiveComposer(){
      const ae = document.activeElement;
      return isLikelyComposer(ae);
    }

    function updateLauncher(){
      try{
        const el = ensureLauncher();
        const boxes = findComposerBoxes();
        const anyShown = !!document.querySelector(`.gmxreply-bar[${BAR_ATTR}="1"].show`);
        const show = !hasActiveComposer() && (!anyShown || boxes.length === 0);
        el.classList.toggle("show", !!show);
      }catch{}
    }

    // Throttled rescans (X is extremely noisy; this keeps CPU stable)
    let scanScheduled = false;
    function scheduleRescan(){
      if (scanScheduled) return;
      scanScheduled = true;
      setTimeout(()=>{
        scanScheduled = false;
        try{ rescan(); }catch{}
      }, 180);
    }

    // URL-change detection (X is an SPA; route changes can detach toolbars)
    let lastHref = location.href;
    function onUrlChange(){
      if (location.href === lastHref) return;
      lastHref = location.href;
      try{ hideAllBars(); }catch{}
      try{ hideLauncher(); }catch{}
      scheduleRescan();
    }
    try{
      const ps = history.pushState;
      history.pushState = function(){
        const r = ps.apply(this, arguments);
        setTimeout(onUrlChange, 0);
        return r;
      };
      const rs = history.replaceState;
      history.replaceState = function(){
        const r = rs.apply(this, arguments);
        setTimeout(onUrlChange, 0);
        return r;
      };
      window.addEventListener("popstate", ()=>setTimeout(onUrlChange, 0));
      window.addEventListener("hashchange", ()=>setTimeout(onUrlChange, 0));
    }catch{}

    // Observers for X SPA + DOM churn
    document.addEventListener("focusin", onFocusIn, true);
    document.addEventListener("input", onInput, true);

    const mo = new MutationObserver(()=>scheduleRescan());
    mo.observe(document.documentElement || document.body, { childList:true, subtree:true });

    // Periodic health scan (cheap)
    setInterval(()=>{ scheduleRescan(); }, 2500);

    // Initial scan
    scheduleRescan();
  }catch(_e){
    // fail silently; popup insertion still works
  }
})();
