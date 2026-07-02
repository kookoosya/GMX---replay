/** Load Backend/.env into process.env (no logging). */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "..");

export function loadEnv() {
  const file = path.join(ROOT, ".env");
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i < 1) continue;
    const key = t.slice(0, i).trim();
    let val = t.slice(i + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = val;
  }
}

export function ensurePexelsKey(key) {
  const file = path.join(ROOT, ".env");
  let content = fs.existsSync(file) ? fs.readFileSync(file, "utf8") : "";
  if (/^PEXELS_API_KEY=/m.test(content)) {
    content = content.replace(/^PEXELS_API_KEY=.*$/m, `PEXELS_API_KEY=${key}`);
  } else {
    content = `${content.replace(/\s*$/, "")}\nPEXELS_API_KEY=${key}\n`;
  }
  fs.writeFileSync(file, content, "utf8");
}

export function removePexelsKey() {
  const file = path.join(ROOT, ".env");
  if (!fs.existsSync(file)) return;
  const content = fs
    .readFileSync(file, "utf8")
    .split(/\r?\n/)
    .filter((line) => !/^PEXELS_API_KEY=/.test(line.trim()))
    .join("\n");
  fs.writeFileSync(file, content ? (content.endsWith("\n") ? content : `${content}\n`) : "", "utf8");
}

export { ROOT };
