const LS_EXT_VIEW = K.EXT_VIEW;

function applyTheme(id){ return __gmxThemeApply.applyTheme(id); }

function normalizeExtWallpaperView(view){ return __gmxExtWpStore.normalizeExtWallpaperView(view); }
function extWallpaperKeyForView(view){ return __gmxExtWpStore.extWallpaperKeyForView(view); }
function getExtWallpaperForView(view){ return __gmxExtWpStore.getExtWallpaperForView(view); }
function setExtWallpaperForView(view, id){ return __gmxExtWpStore.setExtWallpaperForView(view, id); }
function syncExtWallpaperTargetUI(sel, preferred){ return __gmxExtWpStore.syncExtWallpaperTargetUI(sel, preferred); }
function currentExtWallpaperTarget(){ return __gmxExtWpStore.currentExtWallpaperTarget(); }
function extWallpaperLabel(view){ return __gmxExtWpStore.extWallpaperLabel(view); }
function normalizeStoredExtWallpaperSelections(){ return __gmxExtWpStore.normalizeStoredExtWallpaperSelections(); }

function normalizeExtViewValue(view){ return __gmxExtView.normalizeExtViewValue(view); }
function setExtView(view, opts){ return __gmxExtView.setExtView(view, opts); }
function extSyncNow(reason){ return __gmxExtView.extSyncNow(reason); }

function markWallpaperSelection(activeId){ return __gmxWpUi.markWallpaperSelection(activeId); }

function unlockedExtThemesCount(){ return unlockedCountByRefs(EXT_THEMES.length, FREE_VISIBLE_EXT_THEMES); }

function unlockTagText(idx, unlocked, freeCount){ return __gmxThemesUi.unlockTagText(idx, unlocked, freeCount); }

function applyExtTheme(id){ return __gmxExtApply.applyExtTheme(id); }
function applyExtWallpaper(id, targetView){ return __gmxExtApply.applyExtWallpaper(id, targetView); }

function renderThemes(){ return __gmxThemesUi.renderThemes(); }
function renderExtCustomBgUI(){ return __gmxExtCbgUi.renderExtCustomBgUI(); }
function renderExtThemes(){ return __gmxExtThemesUi.renderExtThemes(); }
function renderExtWallpapers(){ return __gmxExtWpUi.renderExtWallpapers(); }
function bindExtTabs(){ return __gmxExtView.bindExtTabs(); }
function initExtWallpaperControls(){ return __gmxExtWpUi.initExtWallpaperControls(); }
