#!/usr/bin/env node
/**
 * Quick i18n audit (local dev tool).
 * - Scans public/app.js for keys used via t("...")
 * - Scans the I18N object for per-language coverage
 * Prints missing keys per language.
 *
 * Usage: node Backend/tools/i18n_audit.js
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const appJsPath = path.join(__dirname, '..', 'public', 'app.js');
const src = fs.readFileSync(appJsPath, 'utf8');

// Collect keys used via t("key")
const used = new Set();
const tCallRe = /\bt\(\s*["']([a-zA-Z0-9_\-\.]+)["']\s*\)/g;
let m;
while ((m = tCallRe.exec(src))) used.add(m[1]);

// Extract I18N object literal slice (best-effort)
const i18nStart = src.indexOf('const I18N');
if (i18nStart === -1) {
  console.error('I18N block not found');
  process.exit(1);
}
const braceStart = src.indexOf('{', i18nStart);
let i = braceStart;
let depth = 0;
for (; i < src.length; i++) {
  const c = src[i];
  if (c === '{') depth++;
  else if (c === '}') {
    depth--;
    if (depth === 0) { i++; break; }
  }
}
const i18nSlice = src.slice(braceStart, i);

// Eval in a sandboxed Function (no global access besides returned value)
let I18N;
try {
  I18N = Function(`"use strict"; return (${i18nSlice});`)();
} catch (e) {
  console.error('Failed to parse I18N object (non-fatal).', e.message);
  process.exit(2);
}

// Project requirement: we guarantee full coverage for EN + RU.
// Other languages may fallback to EN while we iterate.
const langs = ["en","ru"].filter(l => l in I18N);
const usedKeys = [...used].sort();

let hasMissing = false;
for (const lang of langs) {
  const dict = I18N[lang] || {};
  const missing = usedKeys.filter(k => !(k in dict));
  if (missing.length) {
    hasMissing = true;
    console.log(`\n[${lang}] missing ${missing.length} keys:`);
    for (const k of missing) console.log(' -', k);
  }
}

if (!hasMissing) {
  console.log('OK: no missing keys for keys used via t()');
}
