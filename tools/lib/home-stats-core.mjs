/** Home public stats helpers (Sprint 24.1). */

export function formatConnectedTodayCopy(template, count) {
  const n = Math.max(0, Math.floor(Number(count) || 0));
  return String(template || "").replace(/\{n\}/g, String(n));
}

export function shouldShowConnectedToday(stats) {
  return !!(stats && stats.ok && Number(stats.connectedToday) > 0);
}

export function dayStartUtcIso(dayKey) {
  return `${String(dayKey || "").slice(0, 10)}T00:00:00.000Z`;
}
