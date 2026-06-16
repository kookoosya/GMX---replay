import fs from "fs";
const app = fs.readFileSync("public/app.js", "utf8");
const m = app.match(/const THEMES = \[([\s\S]*?)\]\s*\.slice\(0,\s*60\)/);
if (!m) throw new Error("THEMES not found");
const themeStrs = m[1].match(/\{\s*id:"[^"]+",[^}]+\}/g) || [];
const themes = themeStrs.map((s) => {
  const id = (s.match(/id:\s*["']([^"']+)["']/) || [])[1];
  const name = (s.match(/name:\s*["']([^"']+)["']/) || [])[1];
  const note = (s.match(/note:\s*["']([^"']+)["']/) || [])[1];
  const a = (s.match(/a:\s*["']([^"']+)["']/) || [])[1];
  const b = (s.match(/b:\s*["']([^"']+)["']/) || [])[1];
  return { id, name, note, a, b };
});
const out = { ok: true, updatedAt: new Date().toISOString().slice(0, 10), themes: themes.slice(0, 60) };
fs.writeFileSync("public/themes.json", JSON.stringify(out, null, 2));
console.log("Written", themes.length, "themes");
