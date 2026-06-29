/**
 * Unicode preservation for GN copy/save pipeline helpers.
 */
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function loadGen() {
  const code = fs.readFileSync(path.join(root, "public", "app.generate.js"), "utf8");
  const fn = new Function("window", `${code}; return window.__GMXGenerateFactory();`);
  return fn({});
}

const SAMPLES = {
  ru: "Спокойной ночи, бро — хорошего отдыха 🌙",
  tr: "İyi geceler kanka, huzurlu gece 🌙",
  ja: "おやすみ、いい夜を ✨",
  zh: "晚安，好梦 🌙",
};

test("normalizeLine preserves Unicode GN lines", () => {
  const gen = loadGen();
  for (const sample of Object.values(SAMPLES)) {
    const out = gen.normalizeLine(sample);
    assert.equal(out, sample.replace(/\s+/g, " ").trim());
  }
});

test("JSON round-trip preserves Unicode GN line", () => {
  for (const sample of Object.values(SAMPLES)) {
    const parsed = JSON.parse(JSON.stringify({ reply: sample }));
    assert.equal(parsed.reply, sample);
  }
});

test("dedupeLines keeps exact Unicode GN duplicates once", () => {
  const gen = loadGen();
  const ru = SAMPLES.ru;
  const out = gen.dedupeLines([ru, ru, SAMPLES.tr]);
  assert.equal(out.length, 2);
});

test("save bank simulation preserves GN Unicode", () => {
  const store = [];
  const write = (lines) => {
    store.length = 0;
    store.push(...lines);
  };
  const read = () => store.slice();
  const line = SAMPLES.ja;
  write([line]);
  assert.equal(read()[0], line);
  const edited = read()[0].replace("夜", "夜です");
  write([edited]);
  assert.equal(read()[0], edited);
});

test("copy payload has no HTML or language code prefix", () => {
  const gen = loadGen();
  for (const sample of Object.values(SAMPLES)) {
    const text = gen.normalizeLine(sample);
    assert.ok(!/^lang=/i.test(text));
    assert.ok(!/<html/i.test(text));
    assert.ok(!/^Option \d/i.test(text));
  }
});
