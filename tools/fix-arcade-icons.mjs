#!/usr/bin/env node
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const arcadePath = path.join(__dirname, "..", "public", "arcade.js");

let s = fs.readFileSync(arcadePath, "utf8");

// Direct string replacements for mojibake (UTF-8 emoji misinterpreted as Latin/Cyrillic)
const pairs = [
  ["\u0440\u045F\u201D\u00AB", "\uD83C\uDFAE"],  // рџ"« -> 🎮
  ["\u0432\u0459\u201D\u043F\u0451\u040F", "\uD83C\uDFB2"],  // вљ"пёЏ -> 🎲
];
let n = 0;
for (const [bad, good] of pairs) {
  const count = (s.split(bad).length - 1);
  s = s.split(bad).join(good);
  n += count;
}
fs.writeFileSync(arcadePath, s, "utf8");
console.log(`Fixed ${n} mojibake icons in arcade.js`);
