#!/usr/bin/env node
/**
 * Static logic audit — generation, referrals, billing, wallpapers.
 * Run: node tools/logic-audit.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const issues = [];
const ok = [];

function read(rel) {
  return fs.readFileSync(path.join(ROOT, rel), 'utf8');
}

function check(cond, pass, fail) {
  if (cond) ok.push(pass);
  else issues.push(fail);
}

const appJs = read('public/app.js');
const indexJs = read('index.js');

// Generation
check(/const antiN = antiWindow\(strength\)/.test(appJs), 'generate(): antiN uses antiWindow', 'generate(): antiN not wired to antiWindow');
check(/attempts < 4/.test(appJs), 'bulk generate: multiple attempts', 'bulk generate: single attempt only');
check(/window\.__i18nPause/.test(appJs), 'i18n observer pauses during generate', 'missing __i18nPause during generate');

// Wallpapers — no inline candle generator as primary v2 source
check(/if \(norm\.startsWith\("v2_"\)\) return `\/assets\/wallpapers\/\$\{norm\}\.webp/.test(appJs),
  'v2 wallpapers use /assets/wallpapers/*.webp',
  'v2 wallpapers still use data-uri generator');
check(!/candlesticks\(/.test(appJs), 'app.js: no candlestick wallpaper code', 'app.js still references candlesticks');

// Billing / refund
check(!/refund/i.test(indexJs), 'no refund endpoint (Solana payments are on-chain final)', 'unexpected refund logic in server');
check(/billing_intents/.test(indexJs), 'billing_intents schema present', 'missing billing_intents');
check(/CREATE TABLE IF NOT EXISTS payments/.test(indexJs), 'payments table present', 'missing payments table');

// Referrals
check(/sbReferralsMarkFirstUse/.test(indexJs), 'Supabase first_use_at hook', 'missing sbReferralsMarkFirstUse');
check(/referral_invites/.test(indexJs), 'sqlite referral_invites', 'missing referral_invites');

// Supabase core
check(fs.existsSync(path.join(ROOT, 'supabase/01_core.sql')), 'supabase/01_core.sql exists', 'missing supabase/01_core.sql');

// Extension wallpapers
const extPopup = read('extension/popup.js');
check(/\/assets\/extbg\/\$\{encodeURIComponent\(id\)\}\.webp/.test(extPopup), 'extension uses extbg webp URLs', 'extension still on data-uri wallpapers');

console.log('GMXReply logic audit\n');
console.log('OK (' + ok.length + ')');
ok.forEach((l) => console.log('  ✓', l));
if (issues.length) {
  console.log('\nISSUES (' + issues.length + ')');
  issues.forEach((l) => console.log('  ✗', l));
  process.exit(1);
}
console.log('\nAll checks passed.');
