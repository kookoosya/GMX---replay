#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const FIXES_PATH = path.join(ROOT, 'shared', 'i18n', 'batch2c-fixes.json');
const LOCALES_DIR = path.join(ROOT, 'shared', 'i18n', 'locales');

function readJson(p) {
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function writeJson(p, v) {
  fs.writeFileSync(p, JSON.stringify(v, null, 2) + '\n', 'utf8');
}

function main() {
  if (!fs.existsSync(FIXES_PATH)) {
    console.error('Missing', FIXES_PATH);
    process.exit(1);
  }
  const fixes = readJson(FIXES_PATH);
  let total = 0;
  for (const [code, patch] of Object.entries(fixes)) {
    const localePath = path.join(LOCALES_DIR, `${code}.json`);
    if (!fs.existsSync(localePath)) {
      console.warn('[skip]', code);
      continue;
    }
    const locale = readJson(localePath);
    const n = Object.keys(patch).length;
    Object.assign(locale, patch);
    writeJson(localePath, locale);
    total += n;
    console.log(`[${code}] ${n} fixes`);
  }
  console.log(`Applied ${total} fixes`);
}

main();
