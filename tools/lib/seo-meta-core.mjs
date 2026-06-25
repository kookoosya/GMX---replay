/** SEO meta key mapping per app tab (Sprint 25.1). */

export const SEO_OG_IMAGE_PATH = "/assets/og/gmx-share.svg";

export const SEO_TAB_KEYS = Object.freeze({
  home: { title: "seo_home_title", description: "seo_home_description" },
  wallet: { title: "seo_wallet_title", description: "seo_wallet_description" },
});

export function seoKeysForTab(tab) {
  const key = String(tab || "home").toLowerCase();
  return SEO_TAB_KEYS[key] || SEO_TAB_KEYS.home;
}

export function seoOgImageUrl(origin) {
  const base = String(origin || "https://www.gmxreply.com").replace(/\/$/, "");
  return `${base}${SEO_OG_IMAGE_PATH}`;
}
