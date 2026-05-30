(async () => {
  const API = location.origin;

  const ADMIN_HANDLE = "@Kristofer_Sol_";
  let SAVE_CAP_FREE = 50;
  const EMPTY = "__EMPTY__";

  let SUB = null;
  let REF_COUNT = 0;
  const LS_REF_ELIGIBLE_CACHE = "gmx_ref_eligible_v1";
  try{
    const bootEligible = Number(localStorage.getItem(LS_REF_ELIGIBLE_CACHE) || 0) || 0;
    if (bootEligible > 0) REF_COUNT = bootEligible;
  }catch(_e){}
  let AUTH_OK = false;
  let LAST_USAGE_COSMETIC_SIG = "";
  let LAST_USAGE = { gm:{ used:0, limit:0 }, gn:{ used:0, limit:0 }, resetAt:null };
  let LAST_SAVED = { gm:0, gn:0 };
  function isPro(){ return !!(SUB && SUB.active); }
  function saveCap(){ return isPro() ? Infinity : SAVE_CAP_FREE; }
  function isLocalDevHost(){
    try{
      const localHosts = new Set(["127.0.0.1","localhost"]);
      const here = String(location.hostname || "").toLowerCase();
      if (localHosts.has(here)) return true;
      const raw = String((globalThis.__GMX_API_ORIGIN || API || "")).trim();
      if (!raw) return false;
      const u = new URL(raw, location.origin);
      const host = String(u.hostname || "").toLowerCase();
      return localHosts.has(host);
    }catch(_e){
      return false;
    }
  }
// --- Unlock logic (Variant A)
const FREE_VISIBLE_THEMES = 8;
const FREE_VISIBLE_STYLES = 5;
const FREE_VISIBLE_PACKS = 2;
const FREE_VISIBLE_WALLPAPERS = 8;
const FREE_VISIBLE_EXT_THEMES = 4;
const FREE_VISIBLE_EXT_WALLPAPERS = 6;
const ASSET_REV = "20260530d";

function reqRefsForUnlockIndex(idx, freeCount=FREE_VISIBLE_THEMES){
  if (idx < freeCount) return 0;
  const k = (idx - freeCount) + 1;
  if (k <= 8) return k * 3;
  return 24 + (k - 8) * 4;
}
function unlockedCountByRefs(total, freeCount=FREE_VISIBLE_THEMES){
  if (isPro()) return total;
  const r = Number(REF_COUNT||0);
  if (total <= freeCount) return total;
  const extraFast = Math.min(8, Math.floor(r / 3));
  const extraSlow = (r > 24) ? Math.floor((r - 24) / 4) : 0;
  const extra = extraFast + extraSlow;
  return Math.min(total, freeCount + extra);
}





