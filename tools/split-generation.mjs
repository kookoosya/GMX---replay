#!/usr/bin/env node
/**
 * Extract GENERATOR block from index.js into server/generation.mjs
 */
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const indexPath = path.join(root, "index.js");
const outPath = path.join(root, "server", "generation.mjs");

const lines = fs.readFileSync(indexPath, "utf8").split("\n");
const start = lines.findIndex((l) => l.includes("// ---------- GENERATOR ----------"));
const end = lines.findIndex((l) => l.includes("// ---------- API ----------"));
if (start < 0 || end < 0 || end <= start) {
  console.error("Could not find GENERATOR block boundaries");
  process.exit(1);
}

const body = lines.slice(start + 1, end).join("\n");

const header = `/**
 * GM/GN reply generation engine (extracted from index.js).
 * Factory receives DB helpers from the main app bootstrap.
 */
export function createGenerator(deps) {
  const { safeDb, db, nowIso } = deps;
`;

const footer = `
  return {
    normLang,
    pick,
    composeReply,
    sanitizeSingle,
    shapeFingerprint,
    generateRankedCandidates,
    generateUnique,
    replyQualityScore,
    passesModeProfile,
  };
}
`;

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, header + body + footer, "utf8");

const importLine = `import { createGenerator } from "./server/generation.mjs";\n`;
const marker = "// ---------- GENERATOR ----------";
const replacement = `${importLine}\n// ---------- GENERATOR (see server/generation.mjs) ----------\nlet normLang, generateRankedCandidates, generateUnique;\nfunction initGenerator() {\n  const gen = createGenerator({ safeDb, db, nowIso });\n  normLang = gen.normLang;\n  generateRankedCandidates = gen.generateRankedCandidates;\n  generateUnique = gen.generateUnique;\n}\n`;

const newLines = [
  ...lines.slice(0, start),
  replacement.trimEnd(),
  ...lines.slice(end),
];
fs.writeFileSync(indexPath, newLines.join("\n"), "utf8");

// Insert initGenerator() call before HTTP_SERVER listen - find first app.get after generator that uses generate
const idxContent = fs.readFileSync(indexPath, "utf8");
if (!idxContent.includes("initGenerator()")) {
  const listenIdx = idxContent.indexOf("HTTP_SERVER = app.listen");
  if (listenIdx > 0) {
    const before = idxContent.slice(0, listenIdx);
    const after = idxContent.slice(listenIdx);
    fs.writeFileSync(indexPath, before + "initGenerator();\n\n" + after, "utf8");
  }
}

console.log(`[split-generation] wrote ${path.relative(root, outPath)} (${end - start - 1} lines)`);
console.log(`[split-generation] patched ${path.relative(root, indexPath)}`);
