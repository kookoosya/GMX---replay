#!/usr/bin/env node
/**
 * Apply curated critical-string fixes from shared/i18n/critical-fixes.json
 * Run: node tools/i18n_apply_critical_fixes.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const FIXES_PATH = path.join(ROOT, 'shared', 'i18n', 'critical-fixes.json');
const LOCALES_DIR = path.join(ROOT, 'shared', 'i18n', 'locales');

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2) + '\n', 'utf8');
}

function main() {
  if (!fs.existsSync(FIXES_PATH)) {
    console.error('Missing', FIXES_PATH);
    process.exit(1);
  }
  const fixes = readJson(FIXES_PATH);
  let total = 0;

  for (const [code, patch] of Object.entries(fixes)) {
    if (code === 'en' || !patch || typeof patch !== 'object') continue;
    const localePath = path.join(LOCALES_DIR, `${code}.json`);
    if (!fs.existsSync(localePath)) {
      console.warn(`[skip] no locale file for ${code}`);
      continue;
    }
    const locale = readJson(localePath);
    let n = 0;
    for (const [key, value] of Object.entries(patch)) {
      locale[key] = value;
      n++;
    }
    writeJson(localePath, locale);
    total += n;
    console.log(`[${code}] applied ${n} fixes`);
  }

  console.log(`Total fixes applied: ${total}`);
}

main();
