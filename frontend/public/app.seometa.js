(function (window) {
  if (window.__GMXSeoMetaFactory) return;

  const SEO_TAB_KEYS = {
    home: { title: "seo_home_title", description: "seo_home_description" },
    wallet: { title: "seo_wallet_title", description: "seo_wallet_description" },
  };

  const OG_IMAGE_PATH = "/assets/og/gmx-share.svg";

  function seoKeysForTab(tab) {
    const key = String(tab || "home").toLowerCase();
    return SEO_TAB_KEYS[key] || SEO_TAB_KEYS.home;
  }

  function ogImageUrl() {
    const origin = (typeof location !== "undefined" && location.origin) || "https://www.gmxreply.com";
    return `${String(origin).replace(/\/$/, "")}${OG_IMAGE_PATH}`;
  }

  function setMeta(attrName, attrValue, content) {
    if (!content) return;
    let el = document.querySelector(`meta[${attrName}="${attrValue}"]`);
    if (!el) {
      el = document.createElement("meta");
      el.setAttribute(attrName, attrValue);
      document.head.appendChild(el);
    }
    el.setAttribute("content", content);
  }

  window.__GMXSeoMetaFactory = function createGMXSeoMeta(ctx) {
    ctx = ctx || {};
    const tr = typeof ctx.tr === "function" ? ctx.tr : (_k, fb) => fb || "";

    function applySeoMeta(tab) {
      if (typeof document === "undefined") return;
      const keys = seoKeysForTab(tab);
      const title = tr(keys.title, "GMXReply");
      const description = tr(
        keys.description,
        "Human-sounding GM and GN replies for X. Build banks, copy safely, unlock Pro tools and Arcade games."
      );
      document.title = title;
      setMeta("name", "description", description);
      setMeta("property", "og:title", title);
      setMeta("property", "og:description", description);
      setMeta("property", "og:type", "website");
      setMeta("property", "og:image", ogImageUrl());
      if (typeof location !== "undefined" && location.href) {
        setMeta("property", "og:url", location.href);
      }
      setMeta("name", "twitter:card", "summary_large_image");
      setMeta("name", "twitter:title", title);
      setMeta("name", "twitter:description", description);
      setMeta("name", "twitter:image", ogImageUrl());
    }

    return { applySeoMeta };
  };
})(window);
