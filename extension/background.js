const SIDE_PANEL_PATH = "sidepanel.html";

function configureSidePanel() {
  try {
    if (chrome.sidePanel && typeof chrome.sidePanel.setPanelBehavior === "function") {
      chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
    }
  } catch {}
  try {
    if (chrome.sidePanel && typeof chrome.sidePanel.setOptions === "function") {
      chrome.sidePanel.setOptions({ path: SIDE_PANEL_PATH, enabled: true });
    }
  } catch {}
}

chrome.runtime.onInstalled.addListener(() => {
  configureSidePanel();
});

chrome.runtime.onStartup.addListener(() => {
  configureSidePanel();
});

configureSidePanel();
