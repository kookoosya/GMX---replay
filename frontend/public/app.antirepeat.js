(function (window) {
  if (window.__GMXAntiRepeatFactory) return;

  function antiWindow(strength) {
    const s = Math.max(0, Math.min(5, Math.trunc(Number(strength) || 0)));
    const map = [0, 10, 20, 30, 40, 50];
    return map[s] ?? 0;
  }

  if (typeof window.antiWindow !== "function") {
    window.antiWindow = antiWindow;
  }

  window.__GMXAntiRepeatFactory = function createGMXAntiRepeat(ctx) {
    const storage = ctx && ctx.storage ? ctx.storage : {};
    const repeatKey = typeof ctx.repeatKey === "function" ? ctx.repeatKey : () => "";
    const readKey = typeof ctx.readKey === "function" ? ctx.readKey : () => [];
    const filterLinesByBan =
      typeof ctx.filterLinesByBan === "function" ? ctx.filterLinesByBan : (lines) => lines || [];

    function lsKeyRecent(kind) {
      return typeof storage.lsKeyRecent === "function"
        ? storage.lsKeyRecent(kind)
        : kind === "gn"
          ? "gmx_gn_recent"
          : "gmx_gm_recent";
    }

    function getRecent(kind) {
      try {
        const raw = storage.lsGet(lsKeyRecent(kind), "");
        const arr = raw ? JSON.parse(raw) : [];
        return Array.isArray(arr) ? arr.filter((x) => typeof x === "string") : [];
      } catch {
        return [];
      }
    }

    function pushRecent(kind, keys) {
      try {
        const cur = getRecent(kind);
        const merged = cur.concat(keys || []);
        const out = merged.slice(-120);
        storage.lsSet(lsKeyRecent(kind), JSON.stringify(out));
      } catch {}
    }

    function buildBanSet(kind, key, strength) {
      const ban = new Set();
      if (strength <= 0) return ban;

      const recent = getRecent(kind);
      const keep = Math.min(recent.length, antiWindow(strength));
      for (const k of recent.slice(recent.length - keep)) ban.add(k);

      const cur = readKey(key);
      for (const s of cur) {
        const rk = repeatKey(s, Math.max(1, strength));
        if (rk) ban.add(rk);
      }
      return ban;
    }

    function filterLines(kind, key, lines, strength) {
      if (strength <= 0) return lines || [];
      const ban = buildBanSet(kind, key, strength);
      return filterLinesByBan(lines, ban, strength);
    }

    return {
      antiWindow,
      getRecent,
      pushRecent,
      buildBanSet,
      filterLines,
    };
  };
})(window);
