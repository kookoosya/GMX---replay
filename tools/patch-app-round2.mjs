#!/usr/bin/env node
import fs from "fs";
import path from "path";

const root = process.cwd();

const appTargets = ["public/app.js", "public/bridge/app.js", "frontend/public/app.js"];
const htmlTargets = ["public/app.html", "public/bridge/app.html", "frontend/public/app.html", "frontend/src/legacy/legacyBody.html"];

function patchForceLogoutV2(s) {
  if (s.includes("LS_FORCE_LOGOUT_V2")) return s;
  return s.replace(
    '  const LS_FORCE_LOGOUT = "gmx_ext_force_logout";',
    `  const LS_FORCE_LOGOUT = "gmx_ext_force_logout";
  const LS_FORCE_LOGOUT_V2 = "gmx_ext_force_logout_v2";`
  ).replace(
    "try{ localStorage.removeItem(LS_FORCE_LOGOUT); }catch{}",
    "try{ localStorage.removeItem(LS_FORCE_LOGOUT); }catch{}\n      try{ localStorage.removeItem(LS_FORCE_LOGOUT_V2); }catch{}"
  ).replace(
    'try{ localStorage.setItem(LS_FORCE_LOGOUT, String(Date.now())); }catch{}',
    `try{ localStorage.setItem(LS_FORCE_LOGOUT, String(Date.now())); }catch{}
    try{ localStorage.setItem(LS_FORCE_LOGOUT_V2, String(Date.now())); }catch{}`
  );
}

for (const rel of appTargets) {
  const file = path.join(root, rel);
  if (!fs.existsSync(file)) continue;
  const raw = fs.readFileSync(file, "utf8");
  const next = patchForceLogoutV2(raw);
  if (next !== raw) {
    fs.writeFileSync(file, next);
    console.log(`patched ${rel} (force logout v2)`);
  }
}

for (const rel of htmlTargets) {
  const file = path.join(root, rel);
  if (!fs.existsSync(file)) continue;
  let html = fs.readFileSync(file, "utf8");
  const next = html.replace(/<textarea id="supportOut"[^>]*><\/textarea>\s*\n?/g, "");
  if (next !== html) {
    fs.writeFileSync(file, next);
    console.log(`patched ${rel} (removed supportOut)`);
  }
}

console.log("patch-app-round2 done");
