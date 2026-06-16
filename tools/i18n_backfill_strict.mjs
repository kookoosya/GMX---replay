#!/usr/bin/env node
/**
 * Backfill only keys that fail tools/i18n_audit.js --strict (non-EN locales).
 *
 *   node tools/i18n_backfill_strict.mjs
 *   node tools/i18n_backfill_strict.mjs --locale=ru
 *   node tools/i18n_backfill_strict.mjs --dry
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const LOCALES_DIR = path.join(ROOT, 'shared', 'i18n', 'locales');

const TARGETS = ['de', 'fr', 'es', 'pt', 'it', 'nl', 'tr', 'pl', 'id', 'ru', 'uk', 'hi', 'ja', 'zh'];

const LOCALE_TO_MM = {
  de: 'de', fr: 'fr', es: 'es', pt: 'pt', it: 'it', nl: 'nl', tr: 'tr',
  pl: 'pl', id: 'id', ru: 'ru', uk: 'uk', hi: 'hi', ja: 'ja', zh: 'zh-CN',
};

const STRICT_IGNORE_KEYS = new Set([
  't_packs', 't_admin', 'r_col_status', 'r_col_handle', 'r_lb_handle', 'ui_plan', 'ui_sync',
  'w_support_title', 'w_status_list', 'r_list', 'h_guide', 'ext_custom_slots_label',
  't_gm', 't_gn', 'arcade_doc_title', 'arcade_page_title', 'ui_tag_free', 'ui_tag_unlocked',
  'ui_tag_refs', 'ui_prediction_title', 'ui_coming_soon', 't_prediction', 'ref_reward_pro_trial',
]);

const CRITICAL_PATTERNS = [
  /^t_/, /^w_/, /^h_/, /^plan_/, /^themes_/, /^ref_/, /^r_/, /_title$/, /_label$/,
  /_placeholder$/, /_hint$/, /_desc$/, /^btn[A-Z]/, /^apply_/, /^wp_/, /^ui_/, /^pm_/,
];

function isStrictIgnoredKey(key) {
  if (STRICT_IGNORE_KEYS.has(key)) return true;
  if (/^ui_err_/.test(key)) return true;
  if (/^ui_degraded_/.test(key)) return true;
  if (/^ui_offline_/.test(key)) return true;
  return false;
}

function isCriticalKey(key) {
  return CRITICAL_PATTERNS.some((re) => re.test(key));
}

function sameValue(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2) + '\n', 'utf8');
}

function protectPlaceholders(s) {
  const list = [];
  const text = s.replace(/\$?\{[a-zA-Z0-9_]+\}/g, (m) => {
    list.push(m);
    return `⟦${list.length - 1}⟧`;
  });
  return { text, list };
}

function unprotectPlaceholders(s, list) {
  let out = s;
  for (let i = 0; i < list.length; i++) {
    out = out.split(`⟦${i}⟧`).join(list[i]);
  }
  return out;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function chunkForUrl(text, maxLen = 420) {
  if (text.length <= maxLen) return [text];
  const out = [];
  let rest = text;
  while (rest.length) {
    let take = rest.slice(0, maxLen);
    const sp = take.lastIndexOf(' ');
    if (rest.length > maxLen && sp > 80) take = rest.slice(0, sp);
    out.push(take.trim());
    rest = rest.slice(take.length).trim();
  }
  return out.filter(Boolean);
}

const BETWEEN_MS = Math.max(800, Number(process.env.I18N_BACKFILL_MS || 3200));

async function fetchMyMemoryOnce(from, to, part) {
  const q = encodeURIComponent(part);
  const url = `https://api.mymemory.translated.net/get?q=${q}&langpair=${from}|${to}`;
  let attempt = 0;
  const maxAttempts = 12;
  while (attempt < maxAttempts) {
    const r = await fetch(url, { headers: { 'User-Agent': 'GMXReply-i18n-strict-backfill' } });
    if (r.status === 429) {
      const wait = 45000 + attempt * 15000;
      console.error(`    (429 — wait ${Math.round(wait / 1000)}s)`);
      await sleep(wait);
      attempt++;
      continue;
    }
    if (!r.ok) throw new Error(`MyMemory HTTP ${r.status}`);
    const j = await r.json().catch(() => ({}));
    const out = j.responseData?.translatedText;
    if (typeof out !== 'string' || !out) throw new Error(`MyMemory: ${JSON.stringify(j).slice(0, 160)}`);
    return out;
  }
  throw new Error('MyMemory: too many 429 retries');
}

async function translateMyMemory(from, to, raw) {
  let prefix = '';
  let body = raw;
  if (body.startsWith('HTML:')) {
    prefix = 'HTML:';
    body = body.slice(5);
  }
  const prot = protectPlaceholders(body);
  const parts = chunkForUrl(prot.text);
  const translated = [];
  for (const part of parts) {
    translated.push(await fetchMyMemoryOnce(from, to, part));
    await sleep(BETWEEN_MS);
  }
  return prefix + unprotectPlaceholders(translated.join(' '), prot.list);
}

function strictOffenderKeys(en, locale) {
  const offenders = [];
  for (const key of Object.keys(en)) {
    if (!isCriticalKey(key)) continue;
    if (isStrictIgnoredKey(key)) continue;
    if (!(key in locale)) continue;
    if (en[key] === '' || en[key] == null) continue;
    if (sameValue(locale[key], en[key])) offenders.push(key);
  }
  return offenders;
}

async function main() {
  console.error(`[i18n strict backfill] pause between requests: ${BETWEEN_MS}ms`);
  const dry = process.argv.includes('--dry');
  const only = process.argv.find((x) => x.startsWith('--locale='))?.split('=')[1];
  const codes = only ? [only] : TARGETS;
  const en = readJson(path.join(LOCALES_DIR, 'en.json'));
  let total = 0;

  for (const code of codes) {
    if (code === 'en') continue;
    const to = LOCALE_TO_MM[code];
    if (!to) {
      console.warn('[skip] No MyMemory target for', code);
      continue;
    }

    const localePath = path.join(LOCALES_DIR, `${code}.json`);
    const locale = readJson(localePath);
    const keys = strictOffenderKeys(en, locale);
    if (!keys.length) {
      console.log(`[${code}] strict offenders: 0 (skip)`);
      continue;
    }

    console.log(`[${code}] strict offenders: ${keys.length}`);
    let n = 0;

    for (const key of keys) {
      const ev = en[key];
      const lv = locale[key];

      if (typeof ev === 'string') {
        process.stdout.write(`[${code}] ${key}… `);
        try {
          const tr = dry ? `[dry] ${ev}` : await translateMyMemory('en', to, ev);
          if (!dry) locale[key] = tr;
          console.log('ok');
          n++;
          total++;
        } catch (e) {
          console.log('FAIL', e.message);
        }
        continue;
      }

      if (Array.isArray(ev) && Array.isArray(lv) && lv.length === ev.length) {
        for (let i = 0; i < ev.length; i++) {
          if (typeof ev[i] !== 'string' || typeof lv[i] !== 'string') continue;
          if (lv[i] !== ev[i]) continue;
          process.stdout.write(`[${code}] ${key}[${i}]… `);
          try {
            const tr = dry ? `[dry] ${ev[i]}` : await translateMyMemory('en', to, ev[i]);
            if (!dry) locale[key][i] = tr;
            console.log('ok');
            n++;
            total++;
          } catch (e) {
            console.log('FAIL', e.message);
          }
        }
      }
    }

    if (!dry) writeJson(localePath, locale);
    console.log(`[${code}] wrote ${n} strict fixes`);
  }

  console.log(dry ? 'Dry run — no files changed.' : `Total strict updates: ${total}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
