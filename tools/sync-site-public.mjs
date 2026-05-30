#!/usr/bin/env node
/** Copy canonical public/app.js to frontend mirror (vite dev optional static). */
import fs from "fs";
import path from "path";

const root = process.cwd();
const src = path.join(root, "public/app.js");
const targets = [path.join(root, "frontend/public/app.js")];

const body = fs.readFileSync(src, "utf8");
for (const dest of targets) {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  const prev = fs.existsSync(dest) ? fs.readFileSync(dest, "utf8") : "";
  if (prev !== body) {
    fs.writeFileSync(dest, body);
    console.log(`synced → ${path.relative(root, dest)}`);
  }
}

// bridge loads /app.js from site root — no bridge/app.js copy needed
const bridgeCopy = path.join(root, "public/bridge/app.js");
if (fs.existsSync(bridgeCopy)) {
  fs.unlinkSync(bridgeCopy);
  console.log("removed obsolete public/bridge/app.js");
}
