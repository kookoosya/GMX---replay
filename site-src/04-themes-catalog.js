  // ----- Themes + Writing Styles (gating) -----
  const THEMES = __gmxThemes.THEMES;
  const EXT_THEMES = __gmxThemes.EXT_THEMES;
  const STYLES = __gmxThemes.STYLES;
  const GM_PACKS = __gmxThemes.GM_PACKS;
  const GN_PACKS = __gmxThemes.GN_PACKS;
  const PACKS = __gmxThemes.PACKS;

  const EXT_WALLPAPER_PACK_COUNT = __gmxWp.EXT_PACK_COUNT;
  const EXT_WALLPAPER_FREE_PACK_COUNT = __gmxWp.EXT_FREE_PACK_COUNT;
  const EXT_WALLPAPERS = __gmxWp.buildExtWallpapers();
  function migrateLegacyExtWallpaperSelectionOnce(){
    try{
      const done = "gmx_ext_wallpaper_pexels_v2";
      if (localStorage.getItem(done) === "1") return;
      localStorage.setItem(done, "1");
    }catch{}
  }

  function packsForKind(kind){
    return __gmxThemes.packsForKind(kind);
  }

  function getAntiStrength(kind){
    try{
      const raw = localStorage.getItem(lsKeyAnti(kind));
      if (raw !== null && raw !== ""){
        const n = Math.trunc(Number(raw));
        if (Number.isFinite(n)) return Math.max(0, Math.min(5, n));
      }
    }catch(_e){}
    const packEl = kind === "gn" ? $("gnPack") : $("gmPack");
    const pid = packEl ? (packEl.value || "classic") : "classic";
    const packs = packsForKind(kind);
    const pack = packs.find((p)=>p.id === pid) || packs[0];
    const anti = pack && Number.isFinite(pack.anti) ? pack.anti : 2;
    return Math.max(0, Math.min(5, anti));
  }

  function readGenParams(kind){
    const modeEl = kind === "gm" ? $("gmMode") : $("gnMode");
    const styleEl = kind === "gm" ? $("gmStyle") : $("gnStyle");
    const mode = modeEl ? modeEl.value : "mid";
    const lang = currentLang(kind);
    const style = styleEl ? styleEl.value : "classic";
    const strength = getAntiStrength(kind);
    const antiN = antiWindow(strength);
    return { mode, lang, style, antiN };
  }

  function applyPackDefaultsToUi(kind, pack){
    if (!pack) return;
    const styleSel = kind === "gm" ? $("gmStyle") : $("gnStyle");
    const modeSel  = kind === "gm" ? $("gmMode")  : $("gnMode");
    if (styleSel && pack.style) styleSel.value = pack.style;
    if (modeSel && pack.mode) modeSel.value = pack.mode;
    try{ syncModePanelCopy(); }catch(_e){}
  }

  function unlockedPacksCountFor(kind){
    return unlockedCountByRefs(packsForKind(kind).length, FREE_VISIBLE_PACKS);
  }

  function fillPacks(){
    const fill = (kind, sel, lsKey)=>{
      if (!sel) return;
      const packs = packsForKind(kind);
      const unlocked = unlockedPacksCountFor(kind);
      const prev = localStorage.getItem(lsKey) || "classic";
      sel.innerHTML = "";
      packs.forEach((p, idx)=>{
        const o = document.createElement("option");
        o.value = p.id;
        const locked = (!isPro() && idx >= unlocked);
        const need = reqRefsForUnlockIndex(idx, FREE_VISIBLE_PACKS);
        o.textContent = locked ? `${t("locked")||"LOCKED"} (${need} ref)` : p.name;
        o.disabled = locked;
        sel.appendChild(o);
      });
      if ([...sel.options].some(o=>o.value===prev && !o.disabled)) sel.value = prev;
      else sel.value = "classic";
    };
    fill("gm", $("gmPack"), LS_GM_PACK);
    fill("gn", $("gnPack"), LS_GN_PACK);
  }

  function unlockedThemesCount(){ return unlockedCountByRefs(THEMES.length, FREE_VISIBLE_THEMES); }
  function unlockedStylesCount(){ return unlockedCountByRefs(STYLES.length, FREE_VISIBLE_STYLES); }

  function rgbaToRgbTuple(s){ return __gmxThemes.rgbaToRgbTuple(s); }
  function relLum(rgb){ return __gmxThemes.relLum(rgb); }
  function pickAccentOn(a,b){ return __gmxThemes.pickAccentOn(a,b); }
