#!/usr/bin/env node
import fs from "fs";
import path from "path";

const file = path.join(process.cwd(), "extension/popup.js");
let s = fs.readFileSync(file, "utf8");

if (!s.includes("extWallpaperPopup")) {
  s = s.replace(
    `const THEME_KEYS = {
  extTheme: "gmx_ext_theme_v2",
  siteTheme: "gmx_theme",
  extView: "gmx_ext_view_v2",
  extWallpaper: "gmx_ext_wp_v2",
  extCustomBg: "gmx_ext_custom_bg_global_v2",
};`,
    `const THEME_KEYS = {
  extTheme: "gmx_ext_theme_v2",
  siteTheme: "gmx_theme",
  extView: "gmx_ext_view_v2",
  extWallpaper: "gmx_ext_wp_v2",
  extWallpaperPopup: "gmx_ext_wp_v2_popup",
  extWallpaperQuick: "gmx_ext_wp_v2_quick",
  extCustomBg: "gmx_ext_custom_bg_global_v2",
};`
  );
}

if (!s.includes("function extensionViewId")) {
  s = s.replace(
    "// Ensure legacy wallpaper ids don't break the popup after packs are cleaned\nfunction canonicalExtWallpaperId(id){",
    `function extensionViewId() {
  const v = String(document.body && document.body.getAttribute("data-view") || "popup").trim().toLowerCase();
  return v === "quick" ? "quick" : "popup";
}

function wallpaperStorageKeyForView(view) {
  const v = view || extensionViewId();
  if (v === "quick") return THEME_KEYS.extWallpaperQuick;
  if (v === "popup") return THEME_KEYS.extWallpaperPopup;
  return THEME_KEYS.extWallpaper;
}

function resolveWallpaperIdFromStorage(data) {
  const viewKey = wallpaperStorageKeyForView();
  const perView = normalizeWallpaperOptionId(String(data[viewKey] || "").trim());
  if (perView) return perView;
  return normalizeWallpaperOptionId(
    String(data[THEME_KEYS.extWallpaper] || data[LEGACY_THEME_KEYS.extWallpaper] || "").trim()
  );
}

// Ensure legacy wallpaper ids don't break the popup after packs are cleaned
function canonicalExtWallpaperId(id){`
  );
}

s = s.replace(
  'state.extWallpaper = normalizeWallpaperOptionId(String(data[THEME_KEYS.extWallpaper] || data[LEGACY_THEME_KEYS.extWallpaper] || "").trim());',
  "state.extWallpaper = resolveWallpaperIdFromStorage(data);"
);

if (!s.includes("response.extWallpaperPopup")) {
  s = s.replace(
    `        if (typeof response.extWallpaper === 'string') syncPayload[THEME_KEYS.extWallpaper] = normalizeWallpaperOptionId(response.extWallpaper);
        if (typeof response.extCustomBg === 'string') syncPayload[THEME_KEYS.extCustomBg] = String(response.extCustomBg || '').trim();`,
    `        if (typeof response.extWallpaper === 'string') syncPayload[THEME_KEYS.extWallpaper] = normalizeWallpaperOptionId(response.extWallpaper);
        if (typeof response.extWallpaperPopup === 'string') syncPayload[THEME_KEYS.extWallpaperPopup] = normalizeWallpaperOptionId(response.extWallpaperPopup);
        if (typeof response.extWallpaperQuick === 'string') syncPayload[THEME_KEYS.extWallpaperQuick] = normalizeWallpaperOptionId(response.extWallpaperQuick);
        if (typeof response.extCustomBg === 'string') syncPayload[THEME_KEYS.extCustomBg] = String(response.extCustomBg || '').trim();`
  );
}

if (!s.includes("gmx_ext_wp_v2_popup")) throw new Error("popup patch failed");
fs.writeFileSync(file, s);
console.log("patched extension/popup.js");
