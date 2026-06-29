#!/usr/bin/env node
/**
 * Production-safe GM multilingual verification (isolated test handle, max 8 credits).
 * Run: node tools/tests/prod-gm-multilingual.mjs
 */
import { fail, ok, freshSmokeHandle } from "./_helpers.mjs";
import { passesMinSubstance, RE_ANY_EMOJI } from "../../server/generation-min-substance.mjs";

const BASE = String(process.env.PROD_BASE || "https://www.gmxreply.com").replace(/\/$/, "");

const SCENARIOS = [
  { id: "en_mid_classic", lang: "en", mode: "mid", style: "classic", probe: (t) => /\b(Gm|Good morning|bro)\b/i.test(t) },
  { id: "ru_mid_classic", lang: "ru", mode: "mid", style: "classic", probe: (t) => /[\u0400-\u04FF]/.test(t) },
  { id: "tr_mid_cheer", lang: "tr", mode: "mid", style: "cheer", probe: (t) => /[çğıöşüÇĞİÖŞÜ]|güzel|Günaydın|paylaşım/i.test(t) },
  { id: "es_mid_noemoji", lang: "es", mode: "mid", style: "noemoji", probe: (t) => /[áéíóúñ]|Buenos|buen/i.test(t), noEmoji: true },
  { id: "ja_mid_classic", lang: "ja", mode: "mid", style: "classic", probe: (t) => /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]/u.test(t) },
  { id: "zh_mid_classic", lang: "zh", mode: "mid", style: "classic", probe: (t) => /[\p{Script=Han}]/u.test(t) },
  { id: "ru_min_classic", lang: "ru", mode: "min", style: "classic", probe: (t) => /[\u0400-\u04FF]/.test(t), min: true },
  { id: "en_min_noemoji", lang: "en", mode: "min", style: "noemoji", probe: (t) => /\b(Gm|Good morning|nice|post|bro)\b/i.test(t), min: true, noEmoji: true },
];

async function post(path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(30000),
  });
  const json = await res.json().catch(() => ({}));
  return { status: res.status, json };
}

async function generate(token, { lang, mode, style, kind = "gm" }) {
  const qs = new URLSearchParams({ kind, mode, lang, style }).toString();
  const res = await fetch(`${BASE}/api/generate?${qs}`, {
    headers: { Authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(30000),
  });
  const json = await res.json().catch(() => ({}));
  return { status: res.status, json };
}

console.log(`Prod GM multilingual: ${BASE}\n`);

const handle = freshSmokeHandle("gmpm");
const init = await post("/api/user/init", { handle });
if (init.status !== 200 || !init.json?.token) fail(`init failed: ${init.status}`);
const token = init.json.token;
ok(`init handle=${handle.slice(0, 12)}…`);

const bad = await generate(token, { lang: "xx", mode: "mid", style: "classic" });
if (bad.status !== 400) fail(`invalid lang expected 400 got ${bad.status}`);
ok("invalid lang returns 400 without success body");

let prevUsed = null;
for (const sc of SCENARIOS) {
  const { status, json } = await generate(token, sc);
  if (status !== 200 || !json?.ok) fail(`${sc.id}: HTTP ${status} ${JSON.stringify(json).slice(0, 120)}`);
  if (json.lang !== sc.lang) fail(`${sc.id}: lang ${json.lang} != ${sc.lang}`);
  const reply = String(json.reply || "").trim();
  if (!reply) fail(`${sc.id}: empty reply`);
  if (!sc.probe(reply)) fail(`${sc.id}: language probe failed: ${reply.slice(0, 80)}`);
  if (sc.noEmoji && RE_ANY_EMOJI.test(reply)) fail(`${sc.id}: emoji in noemoji`);
  if (sc.min && !passesMinSubstance(reply, "gm", sc.lang, sc.style)) fail(`${sc.id}: thin min: ${reply}`);
  if (/\b(Good morning|nice post)\b/i.test(reply) && /[\u0400-\u04FF]/.test(reply) === false && sc.lang === "ru") {
    fail(`${sc.id}: english in ru output`);
  }
  const used = Number(json.usage?.used);
  if (!Number.isFinite(used)) fail(`${sc.id}: missing usage.used`);
  if (prevUsed != null && used !== prevUsed + 1) fail(`${sc.id}: usage jump ${prevUsed} -> ${used}`);
  prevUsed = used;
  ok(`${sc.id} lang=${json.lang} used=${used}`);
}

console.log("\nPROD_GM_MULTILINGUAL_OK");
