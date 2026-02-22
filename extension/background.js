// GMXReply background service worker (MV3)
// Provides global hotkeys (commands) to insert replies on X without opening the popup.

const DEFAULT_API_BASE = "https://www.gmxreply.com";
const EMPTY = "__EMPTY__";

async function storageGet(keys){
  return await chrome.storage.sync.get(keys);
}

async function getActiveTabId(){
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  return tabs && tabs[0] ? tabs[0].id : null;
}

function buildPayload(kind, cfg, type){
  const mode = (cfg?.[`${kind}Mode`] || "min");
  const view = (cfg?.[`${kind}View`] || "global");
  const langMode = (cfg?.[`${kind}Lang`] || "auto");
  const style = (cfg?.[`${kind}Style`] || "classic");
  const pack = (cfg?.[`${kind}Pack`] || "classic");
  const antiRepeat = Number(cfg?.antiRepeat ?? 35);
  const openComposerFirst = !!cfg?.openComposerFirst;

  const template = String(cfg?.[`${kind}Template`] || "{reply}");
  const diagEnabled = (cfg?.diagEnabled !== false);
  const safetyCheckEnabled = (cfg?.safetyCheckEnabled !== false);

  const base = (cfg?.apiBase || DEFAULT_API_BASE).replace(/\/$/, "");

  const basePayload = {
    kind,
    base,
    handle: cfg?.handle || "",
    token: cfg?.token || "",
    mode,
    view,
    langMode,
    style,
    pack,
    antiRepeat,
    openComposerFirst,
    template,
    diagEnabled,
    safetyCheckEnabled,
  };

  if (type === "GMX_INSERT_BEST"){
    // Keep hotkey requests lightweight; server-side preview is rate-limited for Free.
    basePayload.bestCount = 3;
  }

  return basePayload;
}

async function hasAnySavedLines(kind, cfg){
  try{
    const view = (cfg?.[`${kind}View`] || "global");
    const langMode = (cfg?.[`${kind}Lang`] || "auto");
    const gk = `${kind}_list_global`;
    const key = (view === "lang" && langMode && langMode !== "auto")
      ? `${kind}_list_${langMode}`
      : gk;
    const o = await storageGet([gk, key]);
    const a = Array.isArray(o[key]) ? o[key] : [];
    const g = Array.isArray(o[gk]) ? o[gk] : [];
    return a.some(x=>x && x!==EMPTY) || g.some(x=>x && x!==EMPTY);
  }catch(_e){
    return false;
  }
}

chrome.commands.onCommand.addListener(async (command) => {
  try{
    const tabId = await getActiveTabId();
    if (!tabId) return;

    const cfg = await storageGet([
      "handle","token","apiBase","antiRepeat","openComposerFirst",
      "gmMode","gmView","gmLang","gmStyle","gmPack",
      "gnMode","gnView","gnLang","gnStyle","gnPack",
      "gmTemplate","gnTemplate","diagEnabled","safetyCheckEnabled"
    ]);

    const kind = (command === "insert-gn") ? "gn" : "gm";
    const type = "GMX_INSERT";
    // If not connected, we can still insert from saved lists.
const connected = !!cfg?.handle && !!cfg?.token;
if (!connected){
  const hasSaved = await hasAnySavedLines(kind, cfg);
  if (!hasSaved){
    // No saved lines and not connected -> open site for quick connect.
    const url = (cfg?.apiBase || DEFAULT_API_BASE).replace(/\/$/, "") + "/app";
    chrome.tabs.create({ url });
    return;
  }
}


    const payload = buildPayload(kind, cfg, type);

    chrome.tabs.sendMessage(tabId, { type, payload }, () => {
      // Best-effort; we don't have a UI surface here.
      // Swallow the common MV3 error when the content script is not present on this tab.
      void chrome.runtime.lastError;
    });
  }catch(e){
    // Silent fail (service worker shouldn't spam)
  }
});
