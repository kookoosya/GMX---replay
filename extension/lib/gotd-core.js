(function (global) {
  if (global.GMXGotdCore) return;

  function dayOfYear(d) {
    const date = d instanceof Date ? d : new Date();
    return Math.floor((date - new Date(date.getFullYear(), 0, 0)) / 86400000);
  }

  function gameOfTheDay(games, d) {
    if (!Array.isArray(games) || !games.length) return null;
    const idx = dayOfYear(d) % games.length;
    return games[idx] || null;
  }

  function todayKey(d) {
    const date = d instanceof Date ? d : new Date();
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }

  global.GMXGotdCore = { dayOfYear, gameOfTheDay, todayKey };
})(globalThis);
