// Sync GMXReply site session + saved lists into extension storage.
// Runs ONLY on allowed GMXReply origins (gmxreply.com / localhost) as a safe bridge.

(() => {
  if (window.__GMX_SITE_SYNC__) return;
  window.__GMX_SITE_SYNC__ = true;

  const LS_HANDLE = "gmx_handle";
  const LS_TOKEN  = "gmx_token";
  const LS_SITE_LANG = "gmx_site_lang";
  const LS_GM_REPLY_LANG = "gmx_gm_reply_lang";
  const LS_GN_REPLY_LANG = "gmx_gn_reply_lang";
  const LS_GM_PACK = "gmx_gm_pack";
  const LS_GN_PACK = "gmx_gn_pack";
  const LS_GM_ANTI = "gmx_gm_anti";
  const LS_GN_ANTI = "gmx_gn_anti";
  const GM_GLOBAL = "gmx_gm_global";
  const GN_GLOBAL = "gmx_gn_global";
  const GM_LANGS  = "gmx_gm_langs";
  const GN_LANGS  = "gmx_gn_langs";

  // Extension theme prefs (selected on site)
  const LS_EXT_THEME = "gmx_ext_theme";
  const LS_EXT_WP = "gmx_ext_wp";
  const LS_EXT_CUSTOM_BG_GLOBAL = "gmx_ext_custom_bg_global";
  const LS_EXT_CUSTOM_BG_TAB_PREFIX = "gmx_ext_custom_bg_tab_";

  const EMPTY = "__EMPTY__";

  function isAllowedOrigin(){
    try{
      const h = String(location.hostname || '').toLowerCase();
      if (h === 'gmxreply.com' || h === 'www.gmxreply.com') return true;
      if (h === 'localhost' || h === '127.0.0.1') return true;
    }catch{}
    return false;
  }

  function normHandle(h){
    const s = String(h || '').trim().replace(/^@/, '');
    if (!/^[A-Za-z0-9_]{1,15}$/.test(s)) return '';
    return s;
  }

  let __GMX_SYNC_LAST_LOCAL = "";
let __GMX_SYNC_LAST_SYNC = "";

function stableStringify(obj){
  try{
    const keys = Object.keys(obj).sort();
    const out = {};
    for (const k of keys) out[k] = obj[k];
    return JSON.stringify(out);
  }catch(_e){ return ""; }
}
function hashStr(s){
  let h = 2166136261;
  for (let i=0;i<s.length;i++){
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h>>>0).toString(16);
}

function linesFromText(t){
    return String(t||"")
      .split(/\r?\n/)
      .map(x => x.trim())
      .filter(x => x && x !== EMPTY);
  }

  function safeJsonList(raw){
    try{
      const a = JSON.parse(String(raw||"[]"));
      return Array.isArray(a) ? a.filter(Boolean).map(String) : [];
    }catch{
      return [];
    }
  }

  function readLangKey(kind, lang){
    return `gmx_${kind}_lang_${lang}`;
  }

  async function syncOnce(){
    try{
      if (!isAllowedOrigin()) return;
      const siteHandle = normHandle(localStorage.getItem(LS_HANDLE));
      const siteToken  = String(localStorage.getItem(LS_TOKEN) || "").trim();

      // IMPORTANT: Never overwrite the extension session with empty values.
      // If the site is not currently connected, keep the last known handle/token in the extension.
      let handle = "";
      let token = "";
      const hasSiteSession = !!(siteHandle && siteToken);
      if (hasSiteSession){
        handle = siteHandle;
        token = siteToken;
      } else {
        try{
          const prev = await chrome.storage.local.get(["handle","token"]);
          handle = String(prev.handle || "").trim();
          token  = String(prev.token  || "").trim();
        }catch(_e){}
      }
      const apiBase = String(location.origin || '').trim();
      const uiLang = String(localStorage.getItem(LS_SITE_LANG) || "").trim();
      const gmReplyLang = String(localStorage.getItem(LS_GM_REPLY_LANG) || "").trim();
      const gnReplyLang = String(localStorage.getItem(LS_GN_REPLY_LANG) || "").trim();
      const gmPack = String(localStorage.getItem(LS_GM_PACK) || "").trim();
      const gnPack = String(localStorage.getItem(LS_GN_PACK) || "").trim();
      const gmAnti = String(localStorage.getItem(LS_GM_ANTI) || "").trim();
      const gnAnti = String(localStorage.getItem(LS_GN_ANTI) || "").trim();

      const extTheme = String(localStorage.getItem(LS_EXT_THEME) || "").trim();
      const extWp = String(localStorage.getItem(LS_EXT_WP) || "").trim();

      // custom backgrounds can be large -> keep in local storage only
      const extCustomBgGlobal = String(localStorage.getItem(LS_EXT_CUSTOM_BG_GLOBAL) || "");
      const extCustomBgTabs = {};
      try{
        // only copy existing ones to avoid storage bloat
        for (const k of ["home","gm","gn","referrals","leaderboard","themes","extthemes","wallet"]){
          const v = localStorage.getItem(LS_EXT_CUSTOM_BG_TAB_PREFIX + k);
          if (v) extCustomBgTabs[k] = String(v);
        }
      }catch{}

      // Session is sensitive: keep it local (NOT sync).
      const _localPayload = { apiBase, handle, token, uiLang, gmReplyLang, gnReplyLang, gmPack, gnPack, gmAnti, gnAnti, extTheme, extWp, extCustomBgGlobal, extCustomBgTabs };
      const _localHash = hashStr(stableStringify(_localPayload));
      if (_localHash !== __GMX_SYNC_LAST_LOCAL){
        __GMX_SYNC_LAST_LOCAL = _localHash;
        await chrome.storage.local.set({ ..._localPayload, sessionUpdatedAt: Date.now() });
      }

      // Lists can be sync (non-sensitive).
      const gmGlobal = linesFromText(localStorage.getItem(GM_GLOBAL) || "");
      const gnGlobal = linesFromText(localStorage.getItem(GN_GLOBAL) || "");

      const gmLangs = safeJsonList(localStorage.getItem(GM_LANGS));
      const gnLangs = safeJsonList(localStorage.getItem(GN_LANGS));

      const payload = {
        gm_list_global: gmGlobal,
        gn_list_global: gnGlobal,
        pref_site_lang: uiLang,
        pref_gm_reply_lang: gmReplyLang,
        pref_gn_reply_lang: gnReplyLang,
        pref_gm_pack: gmPack,
        pref_gn_pack: gnPack,
        pref_gm_anti: gmAnti,
        pref_gn_anti: gnAnti,
        pref_ext_theme: extTheme,
        pref_ext_wp: extWp
      };

      for (const lang of gmLangs){
        const key = readLangKey("gm", lang);
        payload[`gm_list_${lang}`] = linesFromText(localStorage.getItem(key) || "");
      }
      for (const lang of gnLangs){
        const key = readLangKey("gn", lang);
        payload[`gn_list_${lang}`] = linesFromText(localStorage.getItem(key) || "");
      }

      const _syncHash = hashStr(stableStringify(payload));
      if (_syncHash !== __GMX_SYNC_LAST_SYNC){
        __GMX_SYNC_LAST_SYNC = _syncHash;
        await chrome.storage.sync.set(payload);
      }
    }catch(_e){
      // silent
    }
  }


  // Allow the site to request an immediate sync (storage events don't fire in the same tab).
  window.addEventListener("message", (e) => {
    try{
      if (!e || !e.data || e.data.type !== "GMX_SYNC_NOW") return;
      syncOnce();
    }catch(_e){}
  }, { passive: true });

  syncOnce();
  window.addEventListener('focus', () => { syncOnce(); }, { passive: true });
  window.addEventListener('storage', () => { syncOnce(); }, { passive: true });
  setInterval(syncOnce, 5000);
})();
