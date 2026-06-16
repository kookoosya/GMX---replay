(function (window) {
  if (window.__GMXGenerateFactory) return;

  window.__GMXGenerateFactory = function createGMXGenerate() {
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

    return { mergeAppendUnique };
  };
})(window);
