import fs from "fs";
const s = fs.readFileSync("public/arcade.js", "utf8");
const re = /"icon":\s*"([^"]+)"/g;
let m;
const seen = new Set();
while ((m = re.exec(s))) {
  const icon = m[1];
  if (seen.has(icon)) continue;
  seen.add(icon);
  if (/[\u0400-\u04FF]/.test(icon)) {
    console.log("Bad icon:", JSON.stringify(icon));
    for (let i = 0; i < icon.length; i++) {
      console.log("  ", i, "U+" + icon.charCodeAt(i).toString(16).toUpperCase().padStart(4, "0"));
    }
  }
}
