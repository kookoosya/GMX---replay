#!/usr/bin/env node
/** Rebuild public/app.generate.js from canonical implementations (self or site-src/_lib). */
import fs from "fs";
import path from "path";

const root = process.cwd();

function sliceBetween(src, startNeedle, endNeedle) {
  const start = src.indexOf(startNeedle);
  if (start < 0) throw new Error(`start not found: ${startNeedle}`);
  const end = src.indexOf(endNeedle, start + startNeedle.length);
  if (end < 0) throw new Error(`end not found after: ${startNeedle}`);
  return src.slice(start, end).trim();
}

const libPath = path.join(root, "site-src/_lib/generate-text-helpers.js");
const dest = path.join(root, "public/app.generate.js");
const canonical = fs.existsSync(libPath)
  ? fs.readFileSync(libPath, "utf8")
  : fs.readFileSync(dest, "utf8");

const normalizeLine = sliceBetween(canonical, "function normalizeLine(s){", "\n\n    function dedupeLines");
const dedupeLines = sliceBetween(canonical, "function dedupeLines(lines){", "\n\n    function repeatKey");
const repeatKey = sliceBetween(canonical, "function repeatKey(s, strength){", "\n\n    function dedupeLinesByShape");
const dedupeLinesByShape = sliceBetween(canonical, "function dedupeLinesByShape(lines, strength){", "\n\n    function bestLineShape");
const bestLineShape = sliceBetween(canonical, "function bestLineShape(kind, s){", "\n\n    function scoreLineForBest");
const scoreLineForBest = sliceBetween(canonical, "function scoreLineForBest(kind, s){", "function pickBestLine(kind, lines, opts)");

const pickBestCore = `
  function pickBestLine(kind, lines, opts) {
    opts = opts || {};
    const arr = (lines || []).map((x) => String(x || "").trim()).filter(Boolean);
    if (!arr.length) return "";

    const byShape = new Map();
    for (const v of arr) {
      const sc = scoreLineForBest(kind, v);
      if (!Number.isFinite(sc) || sc <= -1e8) continue;
      const shape = bestLineShape(kind, v) || v.toLowerCase();
      const prev = byShape.get(shape);
      if (!prev || sc > prev.sc || (sc === prev.sc && v.length > prev.v.length)) byShape.set(shape, { v, sc, shape });
    }

    const scored = Array.from(byShape.values());
    if (!scored.length) return arr[0] || "";

    scored.sort((a, b) => b.sc - a.sc || b.v.length - a.v.length);
    const last = String(opts.last || "").trim();
    const lastShape = bestLineShape(kind, last);
    const recentShapes = Array.isArray(opts.recentShapes)
      ? opts.recentShapes.map((x) => String(x || "").trim()).filter(Boolean).slice(-3)
      : [];
    const recentSet = new Set(recentShapes);
    const pick = (scored.find((x) => x.v.trim() !== last && x.shape !== lastShape && !recentSet.has(x.shape))
      || scored.find((x) => x.v.trim() !== last && x.shape !== lastShape)
      || scored[0] || {}).v || "";

    if (pick && typeof opts.onPersist === "function") {
      const nextShape = bestLineShape(kind, pick);
      const merged = nextShape ? [...recentShapes, nextShape].slice(-3) : recentShapes;
      opts.onPersist(pick, nextShape, merged);
    }
    return pick;
  }
`;

const extras = `
  function mergeAppendUnique(existing, newLines) {
    const out = (existing || []).map((s) => String(s || "").trim()).filter(Boolean);
    const seen = new Set(out.map((s) => s.toLowerCase()));
    for (const s of (newLines || [])) {
      const t = String(s || "").trim();
      if (!t) continue;
      const k = t.toLowerCase();
      if (seen.has(k)) continue;
      seen.add(k);
      out.push(t);
    }
    return out;
  }

  function collectBulkUniqueLines(seedLines, incoming, maxCount) {
    const exactSeen = new Set(
      (seedLines || []).map((s) => normalizeLine(s).toLowerCase()).filter(Boolean)
    );
    const accepted = [];
    const acceptedExact = new Set();
    for (const raw of (incoming || [])) {
      const s = normalizeLine(raw);
      if (!s) continue;
      const exact = s.toLowerCase();
      if (exactSeen.has(exact)) continue;
      if (acceptedExact.has(exact)) continue;
      acceptedExact.add(exact);
      exactSeen.add(exact);
      accepted.push(s);
      if (accepted.length >= maxCount) break;
    }
    return accepted;
  }

  function filterLinesByBan(lines, ban, strength) {
    const out = [];
    const set = ban instanceof Set ? ban : new Set(ban || []);
    for (const s of (lines || [])) {
      const rk = repeatKey(s, strength);
      if (!rk) continue;
      if (set.has(rk)) continue;
      set.add(rk);
      out.push(s);
    }
    return out;
  }

  function isLineAlreadySaved(savedLines, reply, strength) {
    const r = normalizeLine(reply);
    if (!r) return false;
    const exactKey = r.toLowerCase();
    const nearKey = repeatKey(r, Math.max(1, strength));
    return (savedLines || []).some((s) => {
      const raw = String(s || "").trim();
      if (!raw) return false;
      if (raw.toLowerCase() === exactKey) return true;
      if (strength > 0 && nearKey && repeatKey(raw, Math.max(1, strength)) === nearKey) return true;
      return false;
    });
  }

  function selectBestByShape(kind, lines, strength) {
    const byShape = new Map();
    for (const line of (lines || [])) {
      const v = String(line || "").trim();
      if (!v) continue;
      const sc = scoreLineForBest(kind, v);
      if (!Number.isFinite(sc) || sc <= -1e8) continue;
      const shape = bestLineShape(kind, v) || v.toLowerCase();
      const prev = byShape.get(shape);
      if (!prev || sc > prev.sc || (sc === prev.sc && v.length > prev.v.length)) byShape.set(shape, { v, sc });
    }
    return Array.from(byShape.values())
      .sort((a, b) => b.sc - a.sc || b.v.length - a.v.length)
      .map((x) => x.v);
  }
`;

const out = `(function (window) {
  if (window.__GMXGenerateFactory) return;

  window.__GMXGenerateFactory = function createGMXGenerate() {
    ${normalizeLine}

    ${dedupeLines}

    ${repeatKey}

    ${dedupeLinesByShape}

    ${bestLineShape}

    ${scoreLineForBest}

    ${pickBestCore}

    ${extras}

    return {
      normalizeLine,
      dedupeLines,
      repeatKey,
      dedupeLinesByShape,
      bestLineShape,
      scoreLineForBest,
      pickBestLine,
      mergeAppendUnique,
      collectBulkUniqueLines,
      filterLinesByBan,
      isLineAlreadySaved,
      selectBestByShape,
    };
  };
})(window);
`;

fs.writeFileSync(dest, out);
console.log(`built ${dest} (${out.length} bytes)`);
