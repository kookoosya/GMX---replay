const QUICK_URL = "quick.html";
const QUICK_WIDTH = 430;
const QUICK_HEIGHT = 760;
const STORAGE_BASE = "gmx_ext_api_base_v2";
const STORAGE_TOKEN = "gmx_ext_token_v2";
const STORAGE_GOTD_DAY = "gmx_gotd_toast_day_v1";
const STORAGE_UI_LANG = "gmx_site_lang_v1";
const ALARM_SIGNALS = "gmx_market_signals_poll_v1";
const ALARM_GOTD = "gmx_gotd_daily_v1";
const STORAGE_LAST_PRICES = "gmx_market_last_prices_v1";
const STORAGE_LAST_ALERT = "gmx_market_last_alert_v1";
const STORAGE_LAST_HEADLINE = "gmx_market_last_headline_v1";
const STORAGE_ALERTS_ENABLED = "gmx_market_alerts_enabled_v1";
const STORAGE_ALERTS_INTERVAL = "gmx_market_alerts_interval_v1";
const DRAW_THRESHOLD = -5;
const UPSIDE_THRESHOLD = 5;

try {
  importScripts("i18n-bundle.js", "lib/gotd-core.js");
} catch {}

function extTr(key, lang, vars) {
  try {
    const catalog = globalThis.GMX_SITE_I18N && globalThis.GMX_SITE_I18N.SITE_I18N;
    if (!catalog) return key;
    const code = String(lang || "en").toLowerCase();
    const base = catalog.en || {};
    const row = catalog[code] || {};
    let s = row[key];
    if (s === undefined || s === null || String(s).trim() === "") s = base[key];
    if (s === undefined || s === null) return key;
    let out = String(s);
    if (vars && typeof vars === "object") {
      for (const [vk, vv] of Object.entries(vars)) {
        out = out.split(`{${vk}}`).join(String(vv));
      }
    }
    return out;
  } catch {
    return key;
  }
}

async function loadGotdGames() {
  try {
    const url = chrome.runtime.getURL("lib/gotd-games.json");
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) return [];
    const data = await response.json().catch(() => null);
    return Array.isArray(data && data.games) ? data.games : [];
  } catch {
    return [];
  }
}

async function maybeShowGotdToast() {
  const core = globalThis.GMXGotdCore;
  if (!core || typeof core.gameOfTheDay !== "function") return;
  const games = await loadGotdGames();
  const game = core.gameOfTheDay(games);
  if (!game || !game.id) return;

  const today = core.todayKey();
  try {
    const stored = await chrome.storage.local.get(STORAGE_GOTD_DAY);
    if (String(stored[STORAGE_GOTD_DAY] || "") === today) return;
  } catch {}

  let lang = "en";
  try {
    const row = await chrome.storage.local.get(STORAGE_UI_LANG);
    lang = String(row[STORAGE_UI_LANG] || "en").toLowerCase();
  } catch {}

  const title = extTr("ext_gotd_toast_title", lang);
  const message = extTr("ext_gotd_toast_body", lang, { name: game.name || game.id });
  try {
    await chrome.notifications.create(`gotd:${game.id}`, {
      type: "basic",
      iconUrl: "icons/icon128.png",
      title,
      message,
      priority: 0,
    });
    await chrome.storage.local.set({ [STORAGE_GOTD_DAY]: today });
  } catch {}
}

async function ensureGotdAlarm() {
  try {
    await chrome.alarms.create(ALARM_GOTD, { periodInMinutes: 24 * 60 });
  } catch {}
}

async function openQuickPanel() {
  const url = chrome.runtime.getURL(QUICK_URL);
  try {
    const existingTabs = await chrome.tabs.query({ url });
    if (Array.isArray(existingTabs) && existingTabs.length) {
      const tab = existingTabs[0];
      if (Number.isFinite(tab.windowId)) {
        await chrome.windows.update(tab.windowId, { focused: true });
      }
      if (Number.isFinite(tab.id)) {
        await chrome.tabs.update(tab.id, { active: true });
      }
      return { ok: true, reused: true };
    }
  } catch {}

  try {
    await chrome.windows.create({
      url,
      type: "popup",
      width: QUICK_WIDTH,
      height: QUICK_HEIGHT,
      focused: true,
    });
    return { ok: true, reused: false };
  } catch {
    await chrome.tabs.create({ url });
    return { ok: true, reused: false, fallback: "tab" };
  }
}

const ALLOWED_API_HOSTS = new Set(["www.gmxreply.com", "gmxreply.com", "localhost", "127.0.0.1"]);

function normalizeBase(raw) {
  const value = String(raw || "").trim();
  if (!value) return "https://www.gmxreply.com";
  try {
    const url = new URL(value);
    const host = String(url.hostname || "").toLowerCase();
    if (!ALLOWED_API_HOSTS.has(host)) return "https://www.gmxreply.com";
    return String(url.origin || "https://www.gmxreply.com").replace(/\/$/, "");
  } catch {
    return "https://www.gmxreply.com";
  }
}

async function getSession() {
  try {
    const data = await chrome.storage.local.get([
      STORAGE_BASE,
      STORAGE_TOKEN,
      STORAGE_LAST_PRICES,
      STORAGE_LAST_ALERT,
      STORAGE_LAST_HEADLINE,
      STORAGE_ALERTS_ENABLED,
      STORAGE_ALERTS_INTERVAL,
    ]);
    return {
      base: normalizeBase(data[STORAGE_BASE]),
      token: String(data[STORAGE_TOKEN] || "").trim(),
      lastPrices: (data[STORAGE_LAST_PRICES] && typeof data[STORAGE_LAST_PRICES] === "object") ? data[STORAGE_LAST_PRICES] : {},
      lastAlert: (data[STORAGE_LAST_ALERT] && typeof data[STORAGE_LAST_ALERT] === "object") ? data[STORAGE_LAST_ALERT] : {},
      lastHeadline: String(data[STORAGE_LAST_HEADLINE] || "").trim(),
      alertsEnabled: data[STORAGE_ALERTS_ENABLED] !== false,
      alertsInterval: [5, 10, 15].includes(Number(data[STORAGE_ALERTS_INTERVAL])) ? Number(data[STORAGE_ALERTS_INTERVAL]) : 5,
    };
  } catch {
    return { base: "https://www.gmxreply.com", token: "", lastPrices: {}, lastAlert: {}, lastHeadline: "", alertsEnabled: true, alertsInterval: 5 };
  }
}

async function saveSignalState(prices, alerts, headlineId) {
  try {
    await chrome.storage.local.set({
      [STORAGE_LAST_PRICES]: prices || {},
      [STORAGE_LAST_ALERT]: alerts || {},
      [STORAGE_LAST_HEADLINE]: String(headlineId || "").trim(),
    });
  } catch {}
}

async function notifySignal(title, message) {
  try {
    await chrome.notifications.create({
      type: "basic",
      iconUrl: "icons/icon128.png",
      title,
      message,
      priority: 1,
    });
  } catch {}
}

async function pollMarketSignals() {
  const { base, token, lastPrices, lastAlert, lastHeadline, alertsEnabled } = await getSession();
  if (!alertsEnabled) return;
  if (!token) return;

  let data = null;
  try {
    const response = await fetch(`${base}/api/market/signals`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });
    if (!response.ok) return;
    data = await response.json().catch(() => null);
  } catch {
    return;
  }
  const headline = (data && typeof data.headlineSignal === "object") ? data.headlineSignal : null;
  const list = Array.isArray(data && data.signals) ? data.signals : [];
  const latestSignal = list.length ? list[0] : null;
  const headlineId = String(
    (latestSignal && latestSignal.id) ||
    (headline && headline.id) ||
    ""
  ).trim();
  if (headlineId && headlineId !== lastHeadline) {
    const source = String(headline.source || "Polymarket").trim();
    const confidence = Number((latestSignal && latestSignal.confidence) || (headline && headline.confidencePct) || 90);
    const title = String((latestSignal && latestSignal.symbol) || (headline && headline.title) || "Prediction signal update").trim();
    await notifySignal(
      "Prediction Market signal",
      `${title} · ${source} · ${confidence}% confidence. 3-5 bot signals/day, can be wrong.`
    );
  }
  const nextPrices = { ...lastPrices };
  const nextAlert = { ...lastAlert };

  for (const row of list) {
    const symbol = String(row && row.symbol || "").trim();
    const changePct = Number(row && row.changePct || 0);
    if (!symbol || !Number.isFinite(changePct)) continue;

    nextPrices[symbol] = changePct;
    const prev = Number(lastPrices[symbol]);
    if (!Number.isFinite(prev)) continue;
    const delta = changePct - prev;

    let side = "";
    if (delta <= DRAW_THRESHOLD) side = "drawdown";
    if (delta >= UPSIDE_THRESHOLD) side = "upside";
    if (!side) continue;

    const key = `${symbol}:${side}`;
    const marker = `${Math.round(changePct * 100)}`;
    if (nextAlert[key] === marker) continue;
    nextAlert[key] = marker;

    const title = side === "drawdown"
      ? `Signal alert: ${symbol} drawdown`
      : `Signal alert: ${symbol} upside`;
    const message = side === "drawdown"
      ? `${symbol} moved by ${delta.toFixed(2)}% from the previous checkpoint. Signals are not guarantees.`
      : `${symbol} moved by +${delta.toFixed(2)}% from the previous checkpoint. Signals are not guarantees.`;
    await notifySignal(title, message);
  }

  await saveSignalState(nextPrices, nextAlert, headlineId || lastHeadline);
}

async function ensureSignalAlarm() {
  const cfg = await getSession();
  try {
    await chrome.alarms.clear(ALARM_SIGNALS);
  } catch {}
  if (!cfg.alertsEnabled) return;
  try {
    await chrome.alarms.create(ALARM_SIGNALS, { periodInMinutes: cfg.alertsInterval || 5 });
  } catch {}
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (!message) return undefined;
  if (message.type === "GMX_MARKET_SIGNAL_POLL_NOW") {
    void pollMarketSignals();
    try { sendResponse({ ok: true, queued: true }); } catch {}
    return false;
  }
  if (message.type === "GMX_MARKET_ALERTS_CONFIG_CHANGED") {
    void ensureSignalAlarm();
    void pollMarketSignals();
    try { sendResponse({ ok: true, applied: true }); } catch {}
    return false;
  }
  if (message.type !== "GMX_OPEN_QUICK_PANEL") return undefined;
  try {
    sendResponse({ ok: true, queued: true });
  } catch {}
  void openQuickPanel();
  return false;
});

chrome.commands.onCommand.addListener((command) => {
  if (command !== "open-quick-panel") return;
  void openQuickPanel();
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (!alarm) return;
  if (alarm.name === ALARM_SIGNALS) void pollMarketSignals();
  if (alarm.name === ALARM_GOTD) void maybeShowGotdToast();
});

chrome.notifications.onClicked.addListener((notificationId) => {
  const id = String(notificationId || "");
  if (!id.startsWith("gotd:")) return;
  const slug = id.slice(5);
  if (!slug) return;
  void (async () => {
    const { base } = await getSession();
    const url = `${base}/arcade/${encodeURIComponent(slug)}`;
    try {
      await chrome.tabs.create({ url });
    } catch {}
  })();
});

chrome.runtime.onInstalled.addListener(() => {
  void ensureSignalAlarm();
  void pollMarketSignals();
  void ensureGotdAlarm();
  void maybeShowGotdToast();
});

chrome.runtime.onStartup.addListener(() => {
  void ensureSignalAlarm();
  void pollMarketSignals();
  void ensureGotdAlarm();
  void maybeShowGotdToast();
});
