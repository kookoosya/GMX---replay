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
 */
export function createGenerator(deps) {
  const { safeDb, db, nowIso, safeOptionalHistoryDb, sha256 } = deps;
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
    bankFor,
  };
}
`;

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, header + body + footer, "utf8");

const importLine = `import { createGenerator } from "./server/generation.mjs";\n`;
const replacement = `${importLine}\n// ---------- GENERATOR (see server/generation.mjs) ----------\nlet normLang, generateRankedCandidates, generateUnique;\nfunction initGenerator() {\n  const gen = createGenerator({ safeDb, db, nowIso, safeOptionalHistoryDb, sha256 });\n  normLang = gen.normLang;\n  generateRankedCandidates = gen.generateRankedCandidates;\n  generateUnique = gen.generateUnique;\n}\n`;

const newLines = [...lines.slice(0, start), replacement.trimEnd(), ...lines.slice(end)];
let idxContent = newLines.join("\n");

if (!idxContent.includes("initGenerator();")) {
  const marker = "initGenerator();";
  const insertAt = idxContent.indexOf("// ---------- API ----------");
  if (insertAt > 0) {
    idxContent = idxContent.slice(0, insertAt) + marker + "\n\n" + idxContent.slice(insertAt);
  }
}

fs.writeFileSync(indexPath, idxContent, "utf8");
console.log(`[split-generation] wrote ${path.relative(root, outPath)} (${end - start - 1} lines)`);
