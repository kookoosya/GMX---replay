#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.join(__dirname, '..');
const LOCALES_DIR = path.join(ROOT, 'shared', 'i18n', 'locales');
const FRONTEND_SRC_DIR = path.join(ROOT, 'frontend', 'src');
const PUBLIC_JS = path.join(ROOT, 'public', 'app.js');

const LOCALE_RE = /^[a-z]{2}$/;

// Strict mode: fail if critical keys are still identical to English in non-en locales.
// Enable via: `node tools/i18n_audit.js --strict` or env `I18N_STRICT=1`
const STRICT = process.argv.includes('--strict') || process.env.I18N_STRICT === '1';

// In strict mode we want to catch truly user-facing EN leftovers.
// Some keys are intentionally allowed to stay identical to EN (short technical labels,
// or long list blocks that are not worth blocking builds for).
const STRICT_IGNORE_KEYS = new Set([
  // Final fixed nav labels
  't_packs',
  't_admin',

  // Referrals table headers (short technical labels)
  'r_col_status',
  'r_col_handle',
  'r_lb_handle',

  // Small UI labels
  'ui_plan',
  'ui_sync',

  // Support/FAQ header is not critical for build gating
  'w_support_title',

  // Long lists / guide blocks (do not block builds)
  'w_status_list',
  'r_list',
  'h_guide',

  // Extension-only label (can remain EN until extension locale set is fully curated)
  'ext_custom_slots_label',
]);

// Keep this intentionally conservative: these are the most user-visible UI strings.
const CRITICAL_PATTERNS = [
  /^t_/,                 // tabs / nav
  /^w_/,                 // wallet / upgrade
  /^h_/,                 // home/connect
  /^plan_/,              // plan modal
  /^themes_/,            // themes page
  /^ref_/,               // referrals
  /^r_/,                 // referral ui
  /_title$/,             // titles
  /_label$/,             // labels
  /_placeholder$/,       // placeholders
  /_hint$/,              // hints
  /_desc$/,              // descriptions
  /^btn[A-Z]/,           // buttons in public/app
  /^apply_/,             // apply actions
  /^wp_/,                // wallpaper actions
  /^ui_/,                // small ui labels
];

function read(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function readJson(filePath) {
  return JSON.parse(read(filePath));
}

function collectUsedKeys(source) {
  const used = new Set();
  const re = /\bt\(\s*["']([a-zA-Z0-9_\-.]+)["']\s*\)/g;
  let m;
  while ((m = re.exec(source))) used.add(m[1]);
  return used;
}

function collectSourceFiles(dirPath, out = []) {
  if (!fs.existsSync(dirPath)) return out;
  const items = fs.readdirSync(dirPath, { withFileTypes: true });
  for (const item of items) {
    if (!item || !item.name) continue;
    if (item.name.startsWith('.')) continue;
    const full = path.join(dirPath, item.name);
    if (item.isDirectory()) {
      collectSourceFiles(full, out);
      continue;
    }
    if (!/\.(ts|tsx|js|jsx)$/i.test(item.name)) continue;
    if (/\.bak($|[._-])/i.test(item.name)) continue;
    out.push(full);
  }
  return out;
}

function flatten(value, prefix = '', out = new Map()) {
  if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i++) flatten(value[i], `${prefix}[${i}]`, out);
    return out;
  }
  if (value && typeof value === 'object') {
    for (const key of Object.keys(value)) flatten(value[key], prefix ? `${prefix}.${key}` : key, out);
    return out;
  }
  out.set(prefix, value);
  return out;
}

function isCriticalKey(key) {
  return CRITICAL_PATTERNS.some(re => re.test(key));
}

function sameValue(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

function main() {
  if (!fs.existsSync(LOCALES_DIR)) {
    console.error('Locales directory missing:', LOCALES_DIR);
    process.exit(1);
  }

  const localeCodes = fs.readdirSync(LOCALES_DIR)
    .filter(name => name.endsWith('.json'))
    .map(name => name.slice(0, -5))
    .filter(code => LOCALE_RE.test(code))
    .sort();

  if (!localeCodes.includes('en')) {
    console.error('Missing shared/i18n/locales/en.json');
    process.exit(1);
  }

  const locales = Object.fromEntries(localeCodes.map(code => [code, readJson(path.join(LOCALES_DIR, `${code}.json`))]));
  const en = locales.en;
  const enFlat = flatten(en);

  const frontendFiles = collectSourceFiles(FRONTEND_SRC_DIR);
  const frontendUsed = new Set();
  for (const filePath of frontendFiles) {
    for (const key of collectUsedKeys(read(filePath))) frontendUsed.add(key);
  }
  const publicUsed = fs.existsSync(PUBLIC_JS) ? collectUsedKeys(read(PUBLIC_JS)) : new Set();
  // extension/popup.js keeps its own locale dictionary and should not be audited against shared site locales.
  const used = [...new Set([...frontendUsed, ...publicUsed])].sort();

  let failed = false;

  const missingInEn = used.filter(key => !(key in en));
  if (missingInEn.length) {
    failed = true;
    console.log(`[en] keys used via t() but missing in en.json: ${missingInEn.length}`);
    for (const key of missingInEn) console.log(' -', key);
    console.log('');
  }

  for (const code of localeCodes) {
    const locale = locales[code] || {};
    const flat = flatten(locale);

    const missing = [];
    const mismatchedArrays = [];
    for (const key of Object.keys(en)) {
      if (!(key in locale)) missing.push(key);
      else if (Array.isArray(en[key]) && (!Array.isArray(locale[key]) || locale[key].length !== en[key].length)) {
        mismatchedArrays.push(`${key} (${Array.isArray(locale[key]) ? locale[key].length : 'not-array'} vs ${en[key].length})`);
      }
    }

    const identicalToEn = [...enFlat.keys()]
      .filter(key => flat.has(key) && sameValue(flat.get(key), enFlat.get(key))).length;

    console.log(`[${code}] top-level keys=${Object.keys(locale).length}, identical leaves to en=${identicalToEn}/${enFlat.size}`);

    if (missing.length) {
      failed = true;
      console.log(`  missing top-level keys: ${missing.length}`);
      for (const key of missing.slice(0, 25)) console.log('   -', key);
      if (missing.length > 25) console.log('   ...');
    }
    if (mismatchedArrays.length) {
      failed = true;
      console.log(`  mismatched arrays: ${mismatchedArrays.length}`);
      for (const item of mismatchedArrays.slice(0, 25)) console.log('   -', item);
      if (mismatchedArrays.length > 25) console.log('   ...');
    }

    if (STRICT && code !== 'en') {
      const offenders = [];
      for (const key of Object.keys(en)) {
        if (!isCriticalKey(key)) continue;
        if (STRICT_IGNORE_KEYS.has(key)) continue;
        if (!(key in locale)) continue; // missing already handled above
        if (en[key] === '' || en[key] == null) continue; // ignore intentionally empty EN
        if (sameValue(locale[key], en[key])) offenders.push(key);
      }
      if (offenders.length) {
        failed = true;
        console.log(`  [strict] critical keys still identical to EN: ${offenders.length}`);
        for (const key of offenders.slice(0, 30)) console.log('   -', key);
        if (offenders.length > 30) console.log('   ...');
      }
    }
  }

  if (failed) process.exit(2);
}

main();
