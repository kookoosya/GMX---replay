const QUICK_URL = "quick.html";
const QUICK_WIDTH = 430;
const QUICK_HEIGHT = 760;

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

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (!message || message.type !== "GMX_OPEN_QUICK_PANEL") return undefined;
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
