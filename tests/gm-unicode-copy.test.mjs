/**
 * Unicode preservation for GM copy/save pipeline helpers.
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
  ru: "Доброе утро, бро — удачный пост ☀️",
  tr: "Günaydın kanka, güzel paylaşım 🌞",
  ja: "おはよう、いい投稿 ✨",
  zh: "早上好，好帖 🌅",
};

test("normalizeLine preserves Unicode letters and emoji", () => {
  const gen = loadGen();
  for (const sample of Object.values(SAMPLES)) {
    const out = gen.normalizeLine(sample);
    assert.equal(out, sample.replace(/\s+/g, " ").trim());
  }
});

test("JSON round-trip preserves Unicode GM line", () => {
  for (const sample of Object.values(SAMPLES)) {
    const parsed = JSON.parse(JSON.stringify({ reply: sample }));
    assert.equal(parsed.reply, sample);
  }
});

test("dedupeLines keeps exact Unicode duplicates once", () => {
  const gen = loadGen();
  const ru = SAMPLES.ru;
  const out = gen.dedupeLines([ru, ru, SAMPLES.tr]);
  assert.equal(out.length, 2);
  assert.equal(out[0], ru);
});

test("save bank simulation preserves displayed Unicode", () => {
  const store = [];
  const write = (lines) => {
    store.length = 0;
    store.push(...lines);
  };
  const read = () => store.slice();
  const line = SAMPLES.ja;
  write([line]);
  const reloaded = read()[0];
  assert.equal(reloaded, line);
  const edited = reloaded.replace("投稿", "投稿です");
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

test("whitespace normalize does not strip meaningful symbols", () => {
  const gen = loadGen();
  const spaced = "  Доброе   утро,  бро  ";
  assert.equal(gen.normalizeLine(spaced), "Доброе утро, бро");
});
