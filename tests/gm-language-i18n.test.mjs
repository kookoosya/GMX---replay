/**
 * GM tab — multilingual generation and GM-specific i18n contract tests.
 */
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import Database from "better-sqlite3";
import { freePort, spawnTestServer, freshSmokeHandle } from "../tools/tests/_helpers.mjs";
import { createGenerator } from "../server/generation.mjs";
import { SUPPORTED_REPLY_LANGS, normLang, DEFAULT_REPLY_LANG } from "../server/generation-lang.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const localesDir = path.join(root, "shared", "i18n", "locales");

const RE_ANY_EMOJI = /\p{Extended_Pictographic}/u;
const EN_GM_PHRASES = /\b(Good morning|nice post|clean one|hope the day|coffee first|morning back)\b/i;

const LANG_CONTRACT = {
  en: { probe: (t) => /\b(Gm|Good morning|Morning|bro|friend|homie)\b/i.test(t), reject: /[\u0400-\u04FF]/ },
  ru: { probe: (t) => /[\u0400-\u04FF]/.test(t), reject: EN_GM_PHRASES },
  tr: { probe: (t) => /(Günaydın|gün|güzel|paylaşım|Sabah|kanka|iyi sabah|GM)/i.test(t), reject: EN_GM_PHRASES },
  es: { probe: (t) => /(Buenos días|buen|Mañana|amigo|energía|que el día|arranque|GM)/i.test(t), reject: EN_GM_PHRASES },
  de: { probe: (t) => /(Guten Morgen|Morgen|guter Post|guten Tag|gute Energie|kollege|GM|bro)/i.test(t), reject: EN_GM_PHRASES },
  fr: { probe: (t) => /(Bonjour|Matin|beau post|bonne|ami|doux|journée|GM)/i.test(t), reject: EN_GM_PHRASES },
};

function makeGen() {
  const db = new Database(":memory:");
  db.exec(`
    CREATE TABLE IF NOT EXISTS recent_replies (
      handle TEXT, kind TEXT, reply TEXT, created_at TEXT
    );
    CREATE TABLE IF NOT EXISTS recent_reply_shapes (
      kind TEXT, mode TEXT, family TEXT, reply_hash TEXT, shape TEXT, created_at TEXT
    );
  `);
  const safeDb = (fn) => {
    try {
      return fn();
    } catch {
      return null;
    }
  };
  const safeOptionalHistoryDb = (fn, fallback) => {
    try {
      return fn();
    } catch {
      return fallback;
    }
  };
  const sha256 = (s) => crypto.createHash("sha256").update(String(s)).digest("hex");
  return createGenerator({
    safeDb,
    db,
    nowIso: () => new Date().toISOString(),
    safeOptionalHistoryDb,
    sha256,
  });
}

function sampleGm(gen, lang, style = "classic", mode = "mid", n = 12) {
  const handle = `@lang_${lang}_${style}`;
  const out = [];
  for (let i = 0; i < n; i++) {
    const line = gen.generateUnique(handle, "gm", mode, lang, style, 0);
    if (line && !out.includes(line)) out.push(line);
  }
  return out;
}

function assertGmContract(line, { lang, style, kind = "gm" } = {}) {
  const text = String(line || "").trim();
  assert.ok(text, "empty GM output");
  assert.ok(!/\[object Object\]|undefined|null/i.test(text), "serialization leak");
  assert.ok(!/^Here are|Option 1|```/i.test(text), "prompt leak");
  assert.ok(text.length <= 280, "X length");
  if (kind === "gm") assert.ok(!/\bGood night\b/i.test(text), "GM line looks like GN");
  if (style === "noemoji") assert.ok(!RE_ANY_EMOJI.test(text), `emoji in noemoji: ${text}`);
  const c = LANG_CONTRACT[lang];
  if (c) {
    assert.ok(c.probe(text), `${lang} output missing language markers: ${text}`);
    if (c.reject) assert.ok(!c.reject.test(text), `${lang} output looks English: ${text}`);
  }
}

async function initSession(base, handle) {
  const res = await fetch(`${base}/api/user/init`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ handle }),
  });
  const body = await res.json();
  return body.token;
}

test("normLang: empty uses canonical default en", () => {
  assert.equal(normLang(""), DEFAULT_REPLY_LANG);
  assert.equal(normLang(undefined), DEFAULT_REPLY_LANG);
});

test("normLang: supported codes pass through", () => {
  for (const code of SUPPORTED_REPLY_LANGS) {
    assert.equal(normLang(code), code);
    assert.equal(normLang(code.toUpperCase()), code);
  }
});

test("normLang: unknown code is null (not silent English)", () => {
  assert.equal(normLang("xx"), null);
  assert.equal(normLang("english"), null);
});

test("extension-config reply languages match engine supported list", () => {
  const cfg = JSON.parse(fs.readFileSync(path.join(root, "public", "extension-config.json"), "utf8"));
  const uiCodes = (cfg.languages?.reply || []).map((x) => String(x[0]).toLowerCase());
  assert.deepEqual([...uiCodes].sort(), [...SUPPORTED_REPLY_LANGS].sort());
  for (const [code, label] of cfg.languages.reply) {
    assert.ok(String(label || "").trim(), `missing label for ${code}`);
  }
});

test("GM HTML exposes visible reply language control", () => {
  const html = fs.readFileSync(path.join(root, "public", "app.html"), "utf8");
  assert.match(html, /id="gmLang"/);
  assert.match(html, /id="gm_lang"[^>]*>Reply language</);
  assert.doesNotMatch(html, /id="gmLang"[^>]*style="display:\s*none"/);
});

for (const lang of ["en", "ru", "tr", "es", "de"]) {
  test(`engine: lang=${lang} produces ${lang} GM (not English fallback)`, () => {
    const gen = makeGen();
    const lines = sampleGm(gen, lang, "classic");
    assert.ok(lines.length >= 3, `too few unique samples for ${lang}`);
    for (const line of lines) assertGmContract(line, { lang, style: "classic" });
  });
}

test("engine: all supported reply langs generate without English-only fallback", () => {
  const gen = makeGen();
  for (const lang of SUPPORTED_REPLY_LANGS) {
    if (lang === "en") continue;
    const line = gen.generateUnique(`@all_${lang}`, "gm", "mid", lang, "classic", 0);
    assert.ok(String(line || "").trim(), `empty for ${lang}`);
    if (LANG_CONTRACT[lang]) {
      assertGmContract(line, { lang, style: "classic" });
    }
    assert.ok(
      !EN_GM_PHRASES.test(line) || /[^\x00-\x7F]/.test(line),
      `${lang} returned English-only phrase: ${line}`
    );
  }
});

test("engine: style degen preserved per language", () => {
  const gen = makeGen();
  for (const lang of ["en", "ru", "tr"]) {
    const line = gen.generateUnique(`@deg_${lang}`, "gm", "mid", lang, "degen", 0);
    assertGmContract(line, { lang, style: "degen" });
  }
});

test("engine: noemoji strips emoji for non-EN languages", () => {
  const gen = makeGen();
  for (const lang of ["ru", "tr", "ja"]) {
    const lines = sampleGm(gen, lang, "noemoji", "mid", 8);
    for (const line of lines) assertGmContract(line, { lang, style: "noemoji" });
  }
});

test("engine: batch has no exact duplicates", () => {
  const gen = makeGen();
  const list = gen.generateRankedCandidates("@batch_ru", "gm", "mid", "ru", "classic", 10, 0, false);
  assert.equal(list.length, 10);
  assert.equal(new Set(list).size, list.length);
  for (const line of list) {
    assertGmContract(line, { lang: "ru", style: "classic" });
    assert.ok(!EN_GM_PHRASES.test(line));
  }
});

test("engine: GM batch for ru contains no English-only line", () => {
  const gen = makeGen();
  const list = gen.generateRankedCandidates("@batch_mix", "gm", "mid", "ru", "casual", 10, 0, false);
  const englishOnly = list.filter((l) => EN_GM_PHRASES.test(l) && !/[\u0400-\u04FF]/.test(l));
  assert.equal(englishOnly.length, 0, englishOnly.join(" | "));
});

test("engine: GN still generates for ru (shared code regression)", () => {
  const gen = makeGen();
  const gn = gen.generateUnique("@gn_ru", "gn", "mid", "ru", "classic", 0);
  assert.ok(/[\u0400-\u04FF]|GN|Спокойной|Ночь/i.test(gn), gn);
  assert.ok(!/\bGood night\b/i.test(gn) || /[\u0400-\u04FF]/.test(gn));
});

test("API: lang=ru returns Russian GM via real route", async () => {
  const ctx = await spawnTestServer(await freePort());
  try {
    const handle = freshSmokeHandle("gmru");
    const token = await initSession(ctx.base, handle);
    const res = await fetch(`${ctx.base}/api/generate?kind=gm&mode=mid&lang=ru&style=classic`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const body = await res.json();
    assert.equal(res.status, 200);
    assert.equal(body.lang, "ru");
    assertGmContract(body.reply, { lang: "ru", style: "classic" });
  } finally {
    ctx.child?.kill("SIGTERM");
    try {
      fs.unlinkSync(ctx.dbPath);
    } catch {}
  }
});

test("API: lang=tr returns Turkish GM via real route", async () => {
  const ctx = await spawnTestServer(await freePort());
  try {
    const handle = freshSmokeHandle("gmtr");
    const token = await initSession(ctx.base, handle);
    const res = await fetch(`${ctx.base}/api/generate?kind=gm&mode=min&lang=tr&style=degen`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const body = await res.json();
    assert.equal(res.status, 200);
    assert.equal(body.lang, "tr");
    assertGmContract(body.reply, { lang: "tr", style: "degen" });
  } finally {
    ctx.child?.kill("SIGTERM");
    try {
      fs.unlinkSync(ctx.dbPath);
    } catch {}
  }
});

test("API: unknown lang returns 400 invalid_lang (not English success)", async () => {
  const ctx = await spawnTestServer(await freePort());
  try {
    const handle = freshSmokeHandle("gmbad");
    const token = await initSession(ctx.base, handle);
    const res = await fetch(`${ctx.base}/api/generate?kind=gm&mode=mid&lang=xx&style=classic`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const body = await res.json();
    assert.equal(res.status, 400);
    assert.match(String(body.error || body.error_code || ""), /invalid_lang/i);
    assert.equal(body.reply, undefined);
  } finally {
    ctx.child?.kill("SIGTERM");
    try {
      fs.unlinkSync(ctx.dbPath);
    } catch {}
  }
});

test("API: missing lang defaults to en", async () => {
  const ctx = await spawnTestServer(await freePort());
  try {
    const handle = freshSmokeHandle("gmdef");
    const token = await initSession(ctx.base, handle);
    const res = await fetch(`${ctx.base}/api/generate?kind=gm&mode=mid&style=classic`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const body = await res.json();
    assert.equal(res.status, 200);
    assert.equal(body.lang, "en");
    assertGmContract(body.reply, { lang: "en", style: "classic" });
  } finally {
    ctx.child?.kill("SIGTERM");
    try {
      fs.unlinkSync(ctx.dbPath);
    } catch {}
  }
});

test("Unicode copy/save round-trip preserves Cyrillic GM line", () => {
  const line = "Доброе утро, бро ☀️";
  const encoded = JSON.stringify({ reply: line });
  const parsed = JSON.parse(encoded);
  assert.equal(parsed.reply, line);
  const merged = [line];
  const deduped = [...new Set(merged)];
  assert.equal(deduped[0], line);
});

const GM_QUOTA_KEYS = [
  "gm_pro_1",
  "gen_daily_limit_reached",
  "limit_modal_daily_a",
  "limit_modal_daily_b",
  "gm_daily_label",
  "gm_desc",
  "gmRand70",
];

const BAD_QUOTA = [
  /\b70\b/,
  /\b50\s*\/\s*day\b/i,
  /\b50\/day\b/i,
  /\beach\b.*\b50\b/i,
  /\bdaily generation limit\b/i,
  /\btoday'?s free generation\b/i,
  /\bper day\b/i,
  /\bevery day\b/i,
  /\bdaily reset\b/i,
  /\bRandom 70\b/i,
];

test("all 15 locale bundles: GM quota keys avoid daily/70/per-kind promises", () => {
  const files = fs.readdirSync(localesDir).filter((f) => f.endsWith(".json"));
  assert.equal(files.length, 15);
  for (const file of files) {
    const loc = JSON.parse(fs.readFileSync(path.join(localesDir, file), "utf8"));
    for (const key of GM_QUOTA_KEYS) {
      const val = String(loc[key] || "");
      if (!val) continue;
      for (const bad of BAD_QUOTA) {
        assert.ok(!bad.test(val), `${file} ${key} violates quota contract: ${val}`);
      }
      if (key === "gm_pro_1" || key.startsWith("limit_modal") || key === "gen_daily_limit_reached") {
        assert.ok(
          /credit|кредит|Crédit|crédit|kredit|クレジット|额度|क्रेडिट/i.test(val) ||
            /generation/i.test(val) ||
            /генерац|генераці|Generierung|generación|generazione|generatie|generacji|generasi|जनरेशन|üretim/i.test(val),
          `${file} ${key} should describe generation credits: ${val}`
        );
      }
    }
  }
});

test("readGenParams wiring: gm flow sends selected lang code", () => {
  const flowCode = fs.readFileSync(path.join(root, "public", "app.generateflow.js"), "utf8");
  assert.match(flowCode, /readGenParams\(kind\)/);
  const bootSrc = fs.readFileSync(path.join(root, "site-src", "00-bootstrap.js"), "utf8");
  assert.match(bootSrc, /replyLangForKind/);
  assert.match(bootSrc, /getCurrentLang:\s*replyLangForKind/);
  const wireCode = fs.readFileSync(path.join(root, "public", "app.bankuiwire.js"), "utf8");
  assert.match(wireCode, /gmLang/);
  assert.doesNotMatch(wireCode, /el\.value\s*=\s*"en"/);
});
