// ----- Admin -----
let __gmxAdminWire = null;

function pruneLegacyAdminPanelsBoot() {
  try {
    const retiredAnchors = ["adminSelBox", "adminSelHistory", "adminFaqBox", "adminHealthOut"];
    retiredAnchors.forEach((id) => {
      const el = $(id);
      if (!el) return;
      const card = el.closest(".card");
      if (card) card.style.display = "none";
    });

    const adminRoot = $("tab-admin");
    if (!adminRoot) return;

    const firstNote = adminRoot.querySelector(".card .note");
    if (firstNote) {
      firstNote.textContent =
        "Sign in once, then use access, code, and leaderboard tools only. Retired admin experiments are removed from this admin workspace.";
    }

    adminRoot.querySelectorAll(".card .title").forEach((node) => {
      const text = String(node.textContent || "").trim();
      if (text === "Admin stats") node.textContent = "Admin access";
      if (text === "Admin: promo codes") node.textContent = "Create access codes";
      if (text === "Admin: leaderboard rewards") node.textContent = "Leaderboard rewards";
      if (
        text === "Admin: conversion metrics" ||
        text === "Admin: extension health" ||
        text === "Admin: FAQ base" ||
        text === "Selectors history" ||
        text === "Selectors JSON" ||
        text.startsWith("Selectors")
      ) {
        const card = node.closest(".card");
        if (card) card.style.display = "none";
      }
    });
  } catch (_e) {}
}

function initAdminTab() {
  if (__gmxAdminWire) return __gmxAdminWire;
  if (!window.__GMXAdminWireFactory) throw new Error("GMX adminrunwire factory missing");
  __gmxAdminWire = window.__GMXAdminWireFactory({
    core: { $, escapeHtml, api },
    auth: { getHandle, requireConnected },
    admin: { setAdminToken, isAdminSignedIn, adminHandle: ADMIN_HANDLE },
  });
  return __gmxAdminWire;
}

window.__gmxLazyTabHooks = window.__gmxLazyTabHooks || {};
window.__gmxLazyTabHooks.admin = () => { initAdminTab(); };

function syncAdminUi() {
  window.__gmxEnsureTabPack("admin")
    .then(() => { try { initAdminTab().syncAdminUi(); } catch {} })
    .catch(() => {});
}

function requireAdminSignedIn() {
  if (!__gmxAdminWire) return false;
  return __gmxAdminWire.requireAdminSignedIn();
}

function pruneLegacyAdminPanels() {
  if (__gmxAdminWire) return __gmxAdminWire.pruneLegacyAdminPanels();
  return pruneLegacyAdminPanelsBoot();
}
