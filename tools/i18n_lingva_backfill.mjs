#!/usr/bin/env node
/**
 * Backfill locales where strings still match English (critical UI keys).
 * Uses MyMemory (query param — safe for HTML, slashes, long text via chunking).
 *
 *   node tools/i18n_lingva_backfill.mjs
 *   node tools/i18n_lingva_backfill.mjs --dry
 *   node tools/i18n_lingva_backfill.mjs --locale=de
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const LOCALES_DIR = path.join(ROOT, 'shared', 'i18n', 'locales');

const TARGETS = ['de', 'fr', 'es', 'pt', 'it', 'nl', 'tr', 'pl', 'id', 'ru', 'uk', 'hi', 'ja', 'zh'];

/** MyMemory langpair targets (must match API) */
const LOCALE_TO_MM = {
  de: 'de', fr: 'fr', es: 'es', pt: 'pt', it: 'it', nl: 'nl', tr: 'tr',
  pl: 'pl', id: 'id', ru: 'ru', uk: 'uk', hi: 'hi', ja: 'ja', zh: 'zh-CN'
};

const CRITICAL_PATTERNS = [
  /^t_/, /^w_/, /^h_/, /^plan_/, /^themes_/, /^ref_/, /^r_/, /^lb_/,
  /_title$/, /_label$/, /_placeholder$/, /_hint$/, /_desc$/, /^btn[A-Z]/,
  /^apply_/, /^wp_/, /^ui_/, /^gm_/, /^gn_/, /^ext_/, /^pm_/, /^arcade_/,
  /^bank_/, /^connect/, /^redeem/, /^wallet_/, /^billing_/, /^pack_/, /^scope_/, /^extthemes/, /^tool/,
  /^home/, /^this_/, /^locked/, /^support/, /^err_/, /^pay_/, /^refCopy/, /^refLoad/, /^themes_/, /^loading$/, /^error$/
];

const STRICT_IGNORE = new Set([
  't_packs', 't_admin', 'r_col_status', 'r_col_handle', 'r_lb_handle', 'ui_plan', 'ui_sync',
  'w_support_title', 'w_status_list', 'r_list', 'h_guide', 'ext_custom_slots_label'
]);

function isCriticalKey(key) {
  if (STRICT_IGNORE.has(key)) return false;
  return CRITICAL_PATTERNS.some(re => re.test(key));
}

function readJson(p) {
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function writeJson(p, v) {
  fs.writeFileSync(p, JSON.stringify(v, null, 2) + '\n', 'utf8');
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
  let o = s;
  for (let i = 0; i < list.length; i++) {
    o = o.split(`⟦${i}⟧`).join(list[i]);
  }
  return o;
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

/** Chunk so URL stays reasonable (GET limit) */
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
    const r = await fetch(url, { headers: { 'User-Agent': 'GMXReply-i18n-backfill' } });
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
  const tr = [];
  for (const part of parts) {
    tr.push(await fetchMyMemoryOnce(from, to, part));
    await sleep(BETWEEN_MS);
  }
  return prefix + unprotectPlaceholders(tr.join(' '), prot.list);
}

function sameLeaf(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

async function main() {
  console.error(`[i18n backfill] pause between requests: ${BETWEEN_MS}ms (set I18N_BACKFILL_MS to change)`);
  const dry = process.argv.includes('--dry');
  const only = process.argv.find(x => x.startsWith('--locale='))?.split('=')[1];
  const maxArg = process.argv.find(x => x.startsWith('--max='));
  const max = maxArg ? Number(maxArg.split('=')[1]) : 1200;

  const enPath = path.join(LOCALES_DIR, 'en.json');
  const en = readJson(enPath);
  const codes = only ? [only] : TARGETS;
  let total = 0;

  for (const code of codes) {
    if (code === 'en') continue;
    const to = LOCALE_TO_MM[code];
    if (!to) {
      console.warn('[skip] No MyMemory target for', code);
      continue;
    }
    const p = path.join(LOCALES_DIR, `${code}.json`);
    const loc = readJson(p);
    let n = 0;

    for (const key of Object.keys(en)) {
      if (!isCriticalKey(key)) continue;
      if (n >= max) break;

      const ev = en[key];
      const lv = loc[key];

      if (typeof ev === 'string') {
        if (typeof lv !== 'string' || !sameLeaf(lv, ev)) continue;
        process.stdout.write(`[${code}] ${key}… `);
        try {
          const tr = dry ? `[dry] ${ev}` : await translateMyMemory('en', to, ev);
          if (!dry) loc[key] = tr;
          console.log('ok');
          n++;
          total++;
          await sleep(BETWEEN_MS);
        } catch (e) {
          console.log('FAIL', e.message);
        }
      } else if (Array.isArray(ev) && Array.isArray(lv) && lv.length === ev.length) {
        for (let i = 0; i < ev.length; i++) {
          if (n >= max) break;
          if (typeof ev[i] !== 'string' || typeof lv[i] !== 'string') continue;
          if (lv[i] !== ev[i]) continue;
          process.stdout.write(`[${code}] ${key}[${i}]… `);
          try {
            const tr = dry ? `[dry] ${ev[i]}` : await translateMyMemory('en', to, ev[i]);
            if (!dry) loc[key][i] = tr;
            console.log('ok');
            n++;
            total++;
            await sleep(BETWEEN_MS);
          } catch (e) {
            console.log('FAIL', e.message);
          }
        }
      }
    }
    if (!dry) writeJson(p, loc);
    console.log(`[${code}] wrote ${n} updates (cap ${max})`);
  }

  console.log(dry ? 'Dry run — no files changed.' : `Total string updates: ${total}`);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
