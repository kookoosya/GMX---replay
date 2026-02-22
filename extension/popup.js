const DEFAULT_BASE = "https://www.gmxreply.com";

const I18N = {
  en: {
    ext_subtitle: "Bridge to X",
    openSite: "Open site",

    bestToggleLabel: "Best mode",
    bestToggleHint: "When enabled, GM/GN on X auto-picks and uses Best logic",
    typingLabel: "Typing speed",
    typingHint: "Safe looks the most human",
    openXBtn: "Open x.com",

    ext_session_label: "Session",
    ext_connect_label: "Connect @handle",
    connectBtn: "Connect",

    ext_stats_title: "Stats",
    ext_k_eligible: "Eligible",
    ext_k_active: "Active",
    ext_k_confirmed: "Confirmed",
    ext_k_daily_bonus: "Daily bonus",
    ext_k_gm_used: "GM used",
    ext_k_gn_used: "GN used",

    ext_foot: "Lists and session sync automatically from the site",

    session_not_connected: "Not connected",
    session_hint_not_connected: "Connect once. Extension will reuse your session token.",
    session_connected: "Connected",

    status_connect_first: "Enter your @handle first",
    status_sending: "Sending…",
    connect_ok: "Connected ✅",
    connect_fail: "Connect failed",

    stats_promoter: "Promoter tier active",
    stats_unavailable: "Stats unavailable right now",

    status_saved: "Saved",
    status_open_x: "Open x.com to use inline GM/GN buttons"
  },
  ru: {
    ext_subtitle: "Мост в X",
    openSite: "Открыть сайт",

    bestToggleLabel: "Best режим",
    bestToggleHint: "Если включено: GM/GN в X сами выберут и применят Best-логику",
    typingLabel: "Скорость набора",
    typingHint: "Safe выглядит максимально естественно",
    openXBtn: "Открыть x.com",

    ext_session_label: "Сессия",
    ext_connect_label: "Подключить @handle",
    connectBtn: "Подключить",

    ext_stats_title: "Статистика",
    ext_k_eligible: "Eligible",
    ext_k_active: "Active",
    ext_k_confirmed: "Confirmed",
    ext_k_daily_bonus: "Daily bonus",
    ext_k_gm_used: "GM использ.",
    ext_k_gn_used: "GN использ.",

    ext_foot: "Списки и сессия синхронизируются автоматически с сайта",

    session_not_connected: "Не подключено",
    session_hint_not_connected: "Подключись один раз. Расширение сохранит токен.",
    session_connected: "Подключено",

    status_connect_first: "Сначала введи свой @handle",
    status_sending: "Отправляю…",
    connect_ok: "Подключено ✅",
    connect_fail: "Ошибка подключения",

    stats_promoter: "Promoter tier активен",
    stats_unavailable: "Статистика временно недоступна",

    status_saved: "Сохранено",
    status_open_x: "Открой x.com чтобы использовать GM/GN кнопки"
  }
};

let LANG = "en";

function qs(id){ return document.getElementById(id); }
function setText(id, v){ const el = qs(id); if (el) el.textContent = String(v ?? ""); }
function t(key){ return (I18N[LANG] && I18N[LANG][key]) || (I18N.en && I18N.en[key]) || key; }

function normBase(raw){
  const s = String(raw || "").trim();
  if (!s) return DEFAULT_BASE;
  if (!/^https?:\/\//i.test(s)) return DEFAULT_BASE;
  return s.replace(/\/+$/, "");
}

function localGet(keys){
  return new Promise((resolve)=>chrome.storage.local.get(keys, resolve));
}
function localSet(obj){
  return new Promise((resolve)=>chrome.storage.local.set(obj, resolve));
}
function syncGet(keys){
  return new Promise((resolve)=>chrome.storage.sync.get(keys, resolve));
}

let __THEMES_MAP = null;
let __THEMES_LOADING = null;

async function loadThemesMap(){
  if (__THEMES_MAP) return __THEMES_MAP;
  if (__THEMES_LOADING) return __THEMES_LOADING;
  __THEMES_LOADING = (async ()=>{
    try{
      const url = chrome.runtime.getURL("themes.json");
      const r = await fetch(url, { cache:"no-store" });
      const j = await r.json();
      const map = {};
      const arr = (j && j.themes) ? j.themes : [];
      for (const t of arr){
        if (!t || !t.id) continue;
        const id = String(t.id).trim();
        const a = String(t.a || "").trim();
        const b = String(t.b || "").trim();
        if (!id || !a || !b) continue;
        map[id] = { a, b };
      }
      if (!map.classic) map.classic = { a:"rgba(124,92,255,1)", b:"rgba(0,229,255,1)" };
      __THEMES_MAP = map;
      return map;
    }catch(_e){
      __THEMES_MAP = { classic:{ a:"rgba(124,92,255,1)", b:"rgba(0,229,255,1)" } };
      return __THEMES_MAP;
    }finally{
      __THEMES_LOADING = null;
    }
  })();
  return __THEMES_LOADING;
}

async function applyPopupSkin(){
  try{
    const local = await localGet(["apiBase","extCustomBgGlobal"]);
    const sync = await syncGet(["pref_ext_wp","pref_ext_theme"]);
    const base = normBase(local.apiBase);

    const customBg = String(local.extCustomBgGlobal || "").trim();
    const wpId = String(sync.pref_ext_wp || "").trim();

    let wallUrl = "";
    if (customBg && /^data:image\//i.test(customBg)){
      wallUrl = customBg;
    } else if (wpId && wpId !== "none" && wpId !== "__EMPTY__"){
      if (/^https?:\/\//i.test(wpId)) wallUrl = wpId;
      else wallUrl = `${base}/assets/extbg/${encodeURIComponent(wpId)}.svg`;
    }
    setWallVar(wallUrl);

    const themeId = String(sync.pref_ext_theme || "").trim() || "classic";
    const map = await loadThemesMap();
    const th = map[themeId] || map.classic;
    if (th){
      document.documentElement.style.setProperty("--accent", th.a);
      document.documentElement.style.setProperty("--accent2", th.b);
    }
  }catch{}
}

function syncSet(obj){
  return new Promise((resolve)=>chrome.storage.sync.set(obj, resolve));
}

async function detectLang(){
  // Persist UI language in local storage for the popup only.
  // Default is EN (do NOT auto-switch based on OS language).
  try{
    const s = await localGet(["uiLang"]);
    if (s.uiLang && (s.uiLang === "en" || s.uiLang === "ru")) {
      LANG = s.uiLang;
      return;
    }
  }catch{}

  // If site language is available, follow it once
  try{
    const ss = await syncGet(["pref_site_lang"]);
    const v = String(ss.pref_site_lang || "").trim();
    if (v === "en" || v === "ru"){
      LANG = v;
      try{ await localSet({ uiLang: LANG }); }catch{}
      return;
    }
  }catch{}

  LANG = "en";
  try{ await localSet({ uiLang: LANG }); }catch{}
}

function applyLang(){
  const ids = [
    "ext_subtitle","openSite",
    "bestToggleLabel","bestToggleHint",
    "typingLabel","typingHint",
    "openXBtn",
    "ext_session_label","ext_connect_label","connectBtn",
    "ext_stats_title","ext_k_eligible","ext_k_active","ext_k_confirmed",
    "ext_k_daily_bonus","ext_k_gm_used","ext_k_gn_used",
    "ext_foot"
  ];
  for (const id of ids){
    const el = qs(id);
    if (el) el.textContent = t(id);
  }

  // lang buttons
  const bEn = qs("langEn");
  const bRu = qs("langRu");
  if (bEn) bEn.classList.toggle("active", LANG === "en");
  if (bRu) bRu.classList.toggle("active", LANG === "ru");

  // placeholders
  const hi = qs("handleInput");
  if (hi) hi.placeholder = (LANG === "ru") ? "@ваш_хендл" : "@yourhandle";

}

async function refreshBestToggle(){
  const btn = qs("bestToggle");
  if (!btn) return;
  const s = await syncGet(["bestEnabled"]);
  const on = s.bestEnabled === true;
  btn.textContent = on ? "On" : "Off";
  btn.classList.toggle("on", on);
  btn.setAttribute("aria-pressed", on ? "true" : "false");
}

async function refreshTypingProfile(){
  const sel = qs("typingProfile");
  if (!sel) return;
  const s = await syncGet(["typingProfile"]);
  const v = String(s.typingProfile || "safe");
  if (["safe","balanced","fast"].includes(v)) sel.value = v;
  else sel.value = "safe";
}

function setStatus(msg){
  const el = qs("actionStatus");
  if (el) el.textContent = msg || "";
}

function fetchJson(url, token){
  const headers = token ? { "Authorization": "Bearer " + token } : {};
  return fetch(url, { headers }).then(async (r)=>{
    const j = await r.json().catch(()=>({}));
    if (!r.ok) throw new Error(j.error || "request_failed");
    return j;
  });
}

function setWallVar(url){
  try{
    document.documentElement.style.setProperty('--wall', url ? `url("${url}")` : 'none');
  }catch{}
}

async function refreshStatus(){
  const sess = await localGet(["apiBase","handle","token"]);
  const base = normBase(sess.apiBase);
  const handle = sess.handle;
  const token = sess.token;

  // Show a helper button when the current active tab isn't x.com
try{
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  const tab = tabs && tabs[0];
  const url = String(tab && tab.url || "");
  const isX = /^https:\/\/(x\.com|twitter\.com)\//i.test(url);
  const wrap = qs("openXWrap");
  if (wrap) wrap.style.display = isX ? "none" : "flex";
  if (!isX) setStatus(t("status_open_x"));
  else setStatus("");
}catch(_e){}

  // Apply popup theme + wallpaper from site settings
  try{ await applyPopupSkin(); }catch{}

  if (!handle || !token){
    setText("sessionValue", t("session_not_connected"));
    const hint = qs("sessionHint");
    if (hint) hint.textContent = t("session_hint_not_connected");
    ["refEligible","refActive","refConfirmed","dailyBonus","gmUsed","gnUsed"].forEach(k => setText(k, "—"));
    const statsHint = qs("statsHint");
    if (statsHint) statsHint.textContent = "";
    return;
  }

  setText("sessionValue", "@" + handle);
  const hint = qs("sessionHint");
  if (hint) hint.textContent = t("session_connected");

  try{
    const me = await fetchJson(base + "/api/me", token);
    const ref = await fetchJson(base + "/api/referral/stats", token);

    setText("refEligible", ref.eligibleRefs);
    setText("refActive", ref.activeRefs);
    setText("refConfirmed", ref.confirmedRefs);
    setText("dailyBonus", ref.dailyBonus);

    const gm = me?.usage?.gm;
    const gn = me?.usage?.gn;
    setText("gmUsed", (gm && gm.limit != null) ? `${gm.used}/${gm.limit}` : "—");
    setText("gnUsed", (gn && gn.limit != null) ? `${gn.used}/${gn.limit}` : "—");

    const sh = qs("statsHint");
    if (sh) sh.textContent = ref.promoter ? t("stats_promoter") : "";
  }catch(_e){
    const sh = qs("statsHint");
    if (sh) sh.textContent = t("stats_unavailable");
  }
}

function normHandle(raw){
  const s = String(raw||"").trim();
  if (!s) return "";
  return s.replace(/^@+/, "").replace(/\s+/g, "");
}

async function connectHandle(){
  const inp = qs("handleInput");
  const st = qs("connectStatus");
  const btn = qs("connectBtn");
  const h = normHandle(inp ? inp.value : "");
  if (!h){
    if (st) st.textContent = t("status_connect_first");
    return;
  }
  const cur = await localGet(["apiBase"]);
  const base = normBase(cur.apiBase);
  if (btn) btn.disabled = true;
  if (st) st.textContent = t("status_sending");
  try{
    const r = await fetch(`${base}/api/user/init`, {
      method: "POST",
      headers: { "Content-Type":"application/json" },
      body: JSON.stringify({ handle: h })
    });
    const j = await r.json().catch(()=>({}));
    if (!r.ok || !j.ok || !j.token) throw new Error(j.error || "request_failed");
    await localSet({ apiBase: base, handle: h, token: j.token });
    if (st) st.textContent = t("connect_ok");
    await refreshStatus();
  }catch(e){
    if (st) st.textContent = t("connect_fail") + ": " + String(e?.message||e||"");
  }finally{
    if (btn) btn.disabled = false;
  }
}

async function openSite(){
  const sess = await localGet(["apiBase"]);
  const base = normBase(sess.apiBase);
  chrome.tabs.create({ url: base.replace(/\/$/, "") + "/app" });
}

function openX(){
  chrome.tabs.create({ url: "https://x.com/home" });
}

document.addEventListener("DOMContentLoaded", () => {
  (async ()=>{
    await detectLang();
    applyLang();

    // Live-update popup skin when settings change
    try{
      chrome.storage.onChanged.addListener((changes, area)=>{
        if (!changes) return;
        if (area === "sync" && (changes.pref_ext_wp || changes.pref_ext_theme)){
          applyPopupSkin();
        }
        if (area === "local" && (changes.extCustomBgGlobal || changes.apiBase)){
          applyPopupSkin();
        }
      });
    }catch{}

    // Language toggle (popup only)
    const setLang = async (l)=>{
      LANG = (l === "ru") ? "ru" : "en";
      try{ await localSet({ uiLang: LANG }); }catch{}
      applyLang();
    };
    qs("langEn")?.addEventListener("click", ()=>setLang("en"));
    qs("langRu")?.addEventListener("click", ()=>setLang("ru"));

    qs("openSite")?.addEventListener("click", openSite);

    qs("connectBtn")?.addEventListener("click", connectHandle);
    qs("handleInput")?.addEventListener("keydown", (e)=>{ if (e.key === "Enter") connectHandle(); });

    qs("openXBtn")?.addEventListener("click", openX);

    const bestToggle = qs("bestToggle");
    if (bestToggle){
      bestToggle.addEventListener("click", async ()=>{
        const cur = await syncGet(["bestEnabled"]);
        await syncSet({ bestEnabled: !(cur.bestEnabled === true) });
        await refreshBestToggle();
        setStatus(t("status_saved"));
        setTimeout(()=>setStatus(""), 900);
      });
    }

    const typing = qs("typingProfile");
    if (typing){
      typing.addEventListener("change", async ()=>{
        const v = String(typing.value || "safe");
        await syncSet({ typingProfile: v });
        setStatus(t("status_saved"));
        setTimeout(()=>setStatus(""), 900);
      });
    }

    await refreshBestToggle();
    await refreshTypingProfile();
    await refreshStatus();
  })();
});
