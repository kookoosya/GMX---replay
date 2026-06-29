const cfg = globalThis.GMXExtConfig;
const i18n = globalThis.GMXExtI18n;
const bankCore = globalThis.GMXBankSyncCore;
if (!cfg || !i18n || !bankCore) throw new Error("GMX side panel libs missing");

const {
  DEFAULT_BASE,
  STORAGE_KEYS,
  BANK_KEYS,
  LEGACY_KEYS,
  EXT_VERSION,
} = cfg;
const { extT, refreshUiLangFromStorage, applyStaticExtI18n } = i18n;

const state = {
  base: DEFAULT_BASE,
  handle: "",
  token: "",
  tab: "gm",
  search: "",
  banks: { gm: [], gn: [] },
  syncedAt: 0,
  offline: false,
  refreshInflight: false,
};

const el = {
  sessionStatus: document.getElementById("sessionStatus"),
  sessionValue: document.getElementById("sessionValue"),
  syncNote: document.getElementById("syncNote"),
  cardList: document.getElementById("cardList"),
  emptyState: document.getElementById("emptyState"),
  emptyTitle: document.getElementById("emptyTitle"),
  emptyHint: document.getElementById("emptyHint"),
  searchInput: document.getElementById("searchInput"),
  tabGm: document.getElementById("tabGm"),
  tabGn: document.getElementById("tabGn"),
  btnRefresh: document.getElementById("btnRefresh"),
  btnOpenSite: document.getElementById("btnOpenSite"),
  btnEmptyOpenSite: document.getElementById("btnEmptyOpenSite"),
  syncSiteBtn: document.getElementById("syncSiteBtn"),
  connectBtn: document.getElementById("connectBtn"),
  disconnectBtn: document.getElementById("disconnectBtn"),
  handleInput: document.getElementById("handleInput"),
  connectStatus: document.getElementById("connectStatus"),
  versionLabel: document.getElementById("versionLabel"),
};

function normalizeBase(raw) {
  const value = String(raw || "").trim();
  if (!value) return DEFAULT_BASE;
  try {
    const url = new URL(value);
    const host = String(url.hostname || "").toLowerCase();
    if (host === "www.gmxreply.com" || host === "gmxreply.com") {
      return String(url.origin).replace(/\/$/, "");
    }
  } catch {}
  return DEFAULT_BASE;
}

function normalizeHandle(raw) {
  const value = String(raw || "").trim().replace(/^@+/, "");
  if (!value || !/^[A-Za-z0-9_]{1,15}$/.test(value)) return "";
  return value;
}

function isSiteUrl(url) {
  try {
    const host = new URL(String(url || "")).hostname.toLowerCase();
    return host === "www.gmxreply.com" || host === "gmxreply.com";
  } catch {
    return false;
  }
}

async function storageGet(keys) {
  return chrome.storage.local.get(keys);
}

async function storageSet(payload) {
  return chrome.storage.local.set(payload);
}

async function storageRemove(keys) {
  return chrome.storage.local.remove(keys);
}

function parseBankJson(raw) {
  try {
    const parsed = JSON.parse(String(raw || "[]"));
    return Array.isArray(parsed) ? bankCore.dedupeBankLines(parsed) : [];
  } catch {
    return [];
  }
}

async function loadState() {
  const data = await storageGet([
    STORAGE_KEYS.base,
    STORAGE_KEYS.handle,
    STORAGE_KEYS.token,
    BANK_KEYS.gm,
    BANK_KEYS.gn,
    BANK_KEYS.syncedAt,
    LEGACY_KEYS.base,
    LEGACY_KEYS.handle,
    LEGACY_KEYS.token,
    "gmx_site_lang_v1",
  ]);
  state.base = normalizeBase(data[STORAGE_KEYS.base] || data[LEGACY_KEYS.base]);
  state.handle = String(data[STORAGE_KEYS.handle] || data[LEGACY_KEYS.handle] || "").trim();
  state.token = String(data[STORAGE_KEYS.token] || data[LEGACY_KEYS.token] || "").trim();
  state.banks.gm = parseBankJson(data[BANK_KEYS.gm]);
  state.banks.gn = parseBankJson(data[BANK_KEYS.gn]);
  state.syncedAt = Number(data[BANK_KEYS.syncedAt] || 0) || 0;
}

async function saveAuth(base, handle, token) {
  await storageSet({
    [STORAGE_KEYS.base]: normalizeBase(base || state.base),
    [STORAGE_KEYS.handle]: String(handle || "").trim(),
    [STORAGE_KEYS.token]: String(token || "").trim(),
  });
  await storageRemove([LEGACY_KEYS.base, LEGACY_KEYS.handle, LEGACY_KEYS.token]);
  state.base = normalizeBase(base || state.base);
  state.handle = String(handle || "").trim();
  state.token = String(token || "").trim();
}

async function clearPrivateData() {
  await storageRemove([
    STORAGE_KEYS.handle,
    STORAGE_KEYS.token,
    BANK_KEYS.gm,
    BANK_KEYS.gn,
    BANK_KEYS.syncedAt,
    LEGACY_KEYS.handle,
    LEGACY_KEYS.token,
  ]);
  state.handle = "";
  state.token = "";
  state.banks = { gm: [], gn: [] };
  state.syncedAt = 0;
}

function setConnectStatus(text, tone = "") {
  if (!el.connectStatus) return;
  el.connectStatus.textContent = text || "";
  el.connectStatus.className = `small${tone ? ` ${tone}` : ""}`;
}

function setSyncNote(text) {
  if (el.syncNote) el.syncNote.textContent = text || "";
}

function applySessionUi() {
  const connected = Boolean(state.token && state.handle);
  if (el.sessionValue) {
    el.sessionValue.textContent = connected ? `@${state.handle}` : extT("ext_session_guest");
  }
  if (el.sessionStatus) {
    el.sessionStatus.textContent = connected
      ? extT("ext_session_hint_connected")
      : extT("ext_session_hint_disconnected");
  }
}

function formatSyncedAt(ts) {
  if (!ts) return extT("ext_bank_never_synced", "Not synced yet");
  try {
    return extT("ext_bank_last_synced", "Last synced {time}").replace(
      "{time}",
      new Date(ts).toLocaleString()
    );
  } catch {
    return extT("ext_bank_last_synced", "Last synced {time}").replace("{time}", String(ts));
  }
}

function currentLines() {
  const kind = state.tab === "gn" ? "gn" : "gm";
  return bankCore.filterBankLines(state.banks[kind], state.search);
}

function renderCards() {
  const lines = currentLines();
  const kind = state.tab === "gn" ? "gn" : "gm";
  if (el.tabGm) el.tabGm.classList.toggle("active", kind === "gm");
  if (el.tabGn) el.tabGn.classList.toggle("active", kind === "gn");

  const empty = !lines.length;
  if (el.emptyState) {
    el.emptyState.classList.toggle("hidden", !empty);
    if (el.emptyTitle) {
      el.emptyTitle.textContent =
        kind === "gn" ? extT("bank_empty_title_gn") : extT("bank_empty_title_gm");
    }
  }
  if (el.cardList) el.cardList.classList.toggle("hidden", empty);
  if (!el.cardList) return;

  el.cardList.innerHTML = "";
  for (const text of lines) {
    const card = document.createElement("article");
    card.className = "spCard";
    card.setAttribute("role", "listitem");

    const body = document.createElement("div");
    body.className = "spCardText";
    body.textContent = text;

    const actions = document.createElement("div");
    actions.className = "spCardActions";
    const copyBtn = document.createElement("button");
    copyBtn.type = "button";
    copyBtn.className = "primary compact";
    copyBtn.textContent = extT("ext_sidepanel_copy", "Copy");
    copyBtn.addEventListener("click", () => void copyLine(text, copyBtn));

    actions.appendChild(copyBtn);
    card.appendChild(body);
    card.appendChild(actions);
    el.cardList.appendChild(card);
  }
}

async function copyLine(text, button) {
  const value = String(text || "").trim();
  if (!value) return;
  try {
    await navigator.clipboard.writeText(value);
    if (button) {
      const prev = button.textContent;
      button.textContent = extT("ext_sidepanel_copied", "Copied");
      setTimeout(() => {
        button.textContent = prev;
      }, 1200);
    }
  } catch {
    if (button) button.textContent = extT("ext_copy_clipboard_blocked", "Clipboard blocked");
  }
}

async function apiRequest(path, options = {}) {
  const method = options.method || "GET";
  const body = options.body ? JSON.stringify(options.body) : null;
  const token = options.token || state.token || "";
  const headers = {
    Accept: "application/json",
    "X-GMX-Client": "extension-sidepanel-copy",
    "X-GMX-Ext-Version": EXT_VERSION || "1.2.0",
  };
  if (body) headers["Content-Type"] = "application/json";
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await fetch(`${state.base}${path}`, {
    method,
    headers,
    body,
    cache: "no-store",
  });
  const data = await response.json().catch(() => null);
  return { ok: response.ok, status: response.status, data };
}

async function querySiteTabs() {
  try {
    return await chrome.tabs.query({
      url: ["https://www.gmxreply.com/*", "https://gmxreply.com/*"],
    });
  } catch {
    return [];
  }
}

async function syncFromSite(options = {}) {
  const openIfMissing = options.openIfMissing !== false;
  if (!options.silent) setConnectStatus(extT("ext_connect_looking_tab"));
  const tabs = await querySiteTabs();
  if (!tabs.length) {
    if (openIfMissing) {
      await chrome.tabs.create({ url: `${state.base}/app` });
      if (!options.silent) setConnectStatus(extT("ext_connect_opened_site"));
    } else if (!options.silent) {
      setConnectStatus(extT("ext_connect_no_tab"), "bad");
    }
    return false;
  }

  let bestResponse = null;
  let foundSiteSession = false;
  for (const tab of tabs) {
    if (!Number.isFinite(tab.id)) continue;
    try {
      const response = await chrome.tabs.sendMessage(tab.id, { type: "GMX_FORCE_SITE_SYNC" });
      if (!response || !response.ok) continue;
      if (response.hasSiteSession) {
        bestResponse = response;
        foundSiteSession = true;
        break;
      }
      if (!bestResponse) bestResponse = response;
    } catch {}
  }

  if (bestResponse) {
    const syncPayload = {};
    if (bestResponse.base) syncPayload[STORAGE_KEYS.base] = normalizeBase(bestResponse.base);
    if (typeof bestResponse.handle === "string") syncPayload[STORAGE_KEYS.handle] = bestResponse.handle;
    if (typeof bestResponse.token === "string") syncPayload[STORAGE_KEYS.token] = bestResponse.token;
    if (Object.keys(syncPayload).length) await storageSet(syncPayload);
  }

  await new Promise((r) => setTimeout(r, 120));
  await loadState();
  applySessionUi();
  renderCards();
  updateSyncNote();

  if (state.token && state.handle && (foundSiteSession || options.silent)) {
    if (!options.silent) {
      setConnectStatus(extT("ext_connect_using_session", { handle: `@${state.handle}` }), "good");
    }
    return true;
  }
  if (!options.silent) {
    setConnectStatus(extT("ext_connect_sync_failed"), "bad");
  }
  return false;
}

async function connectHandle() {
  const handle = normalizeHandle(el.handleInput && el.handleInput.value);
  if (!handle) {
    setConnectStatus(extT("ext_connect_invalid_handle"), "bad");
    return;
  }
  setConnectStatus(extT("ext_connect_connecting"));
  const result = await apiRequest("/api/user/init", { method: "POST", body: { handle } });
  if (!result.ok || !result.data?.token) {
    const raw = String(result?.data?.error_code || result?.data?.error || "");
    if (/existing_session_required|open_site_or_use_existing_session/i.test(raw)) {
      const synced = await syncFromSite({ openIfMissing: true, silent: true });
      if (synced) {
        setConnectStatus(extT("ext_connect_using_session", { handle: `@${state.handle}` }), "good");
        return;
      }
    }
    setConnectStatus(extT("ext_connect_failed", "Could not connect"), "bad");
    return;
  }
  await saveAuth(state.base, result.data.handle || handle, result.data.token);
  if (el.handleInput) el.handleInput.value = state.handle ? `@${state.handle}` : "";
  setConnectStatus(extT("ext_connect_connected"), "good");
  applySessionUi();
}

async function resetSession() {
  await clearPrivateData();
  if (el.handleInput) el.handleInput.value = "";
  setConnectStatus(extT("ext_connect_session_cleared"));
  applySessionUi();
  renderCards();
  updateSyncNote();
}

function updateSyncNote() {
  const note = formatSyncedAt(state.syncedAt);
  const offline =
    state.syncedAt > 0 && Date.now() - state.syncedAt > 5 * 60 * 1000
      ? ` · ${extT("ext_bank_offline_cached", "Showing cached replies")}`
      : "";
  setSyncNote(note + offline);
}

async function refreshBanks() {
  if (state.refreshInflight) return;
  state.refreshInflight = true;
  setSyncNote(extT("ext_bank_syncing", "Syncing…"));
  try {
    await syncFromSite({ openIfMissing: false, silent: true });
    await loadState();
    renderCards();
    updateSyncNote();
  } finally {
    state.refreshInflight = false;
  }
}

function bindEvents() {
  if (el.tabGm) {
    el.tabGm.addEventListener("click", () => {
      state.tab = "gm";
      renderCards();
    });
  }
  if (el.tabGn) {
    el.tabGn.addEventListener("click", () => {
      state.tab = "gn";
      renderCards();
    });
  }
  if (el.searchInput) {
    el.searchInput.addEventListener("input", () => {
      state.search = el.searchInput.value || "";
      renderCards();
    });
  }
  if (el.btnRefresh) el.btnRefresh.addEventListener("click", () => void refreshBanks());
  if (el.syncSiteBtn) el.syncSiteBtn.addEventListener("click", () => void syncFromSite({ openIfMissing: true }));
  if (el.connectBtn) el.connectBtn.addEventListener("click", () => void connectHandle());
  if (el.disconnectBtn) el.disconnectBtn.addEventListener("click", () => void resetSession());
  if (el.handleInput) {
    el.handleInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") void connectHandle();
    });
  }
  const openSite = () => void chrome.tabs.create({ url: `${state.base}/app` });
  if (el.btnOpenSite) el.btnOpenSite.addEventListener("click", openSite);
  if (el.btnEmptyOpenSite) el.btnEmptyOpenSite.addEventListener("click", openSite);

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== "local" || !changes) return;
    const watch = new Set([BANK_KEYS.gm, BANK_KEYS.gn, BANK_KEYS.syncedAt, STORAGE_KEYS.handle, STORAGE_KEYS.token]);
    if (Object.keys(changes).some((k) => watch.has(k))) {
      void loadState().then(() => {
        applySessionUi();
        renderCards();
        updateSyncNote();
      });
    }
  });
}

async function boot() {
  if (el.versionLabel) el.versionLabel.textContent = `v${EXT_VERSION || "1.2.0"}`;
  await refreshUiLangFromStorage();
  applyStaticExtI18n(document);
  await loadState();
  applySessionUi();
  renderCards();
  updateSyncNote();
  bindEvents();
}

void boot();
