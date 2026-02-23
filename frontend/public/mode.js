(function(){
  try{
    // --- Theme (fast paint) ---
    // Dark-only: keep the app in dark mode for consistency.
    var MODE_KEY = "gmx_site_mode";
    try{ localStorage.setItem(MODE_KEY, "dark"); }catch(_e){}
    document.documentElement.classList.remove("mode-light");

    // --- Backgrounds (fast paint) ---
    // Restore previously selected wallpaper/custom background ASAP to avoid a long "default theme" flash.
    // Lock checks happen later in app.js; this is only for initial paint.

    function tabFromPath(){
      try{
        var p = (location && location.pathname) ? String(location.pathname) : "/";
        // strip trailing slash
        if (p.length > 1 && p.endsWith("/")) p = p.slice(0, -1);
        if (p === "/gm") return "gm";
        if (p === "/gn") return "gn";
        if (p === "/referrals") return "referrals";
        if (p === "/leaderboard") return "leaderboard";
        if (p === "/themes") return "themes";
        if (p === "/extension-themes") return "extthemes";
        if (p === "/upgrade" || p === "/wallet") return "wallet";
        if (p === "/admin") return "admin";
        return "home";
      }catch(_e){ return "home"; }
    }

    var TAB = tabFromPath();

    function getLS(k){
      try{ return localStorage.getItem(k) || ""; }catch(_e){ return ""; }
    }

    // Wallpaper: tab-specific -> global
    var wp = getLS("gmx_wp_tab_" + TAB) || getLS("gmx_wp_all");
    var wallOn = !!wp;
    if (wp){
      var css = 'url("/assets/wallpapers/' + String(wp).replace(/[^a-z0-9_\-]/gi, "") + '.svg") center/cover no-repeat fixed';
      document.documentElement.style.setProperty("--bg_wall", css);
    } else {
      document.documentElement.style.setProperty("--bg_wall", "none");
    }

    // Custom background priority:
    // per-tab custom bg always wins; global custom bg only if no wallpaper.
    var userBg = getLS("gmx_custom_bg_tab_" + TAB);
    if (!userBg && !wallOn){
      userBg = getLS("gmx_custom_bg_global") || getLS("gmx_custom_bg"); // legacy fallback
    }
    var userOn = !!userBg;
    if (userBg){
      // data URL or absolute URL string stored by the app
      document.documentElement.style.setProperty("--bg_user", 'url("' + String(userBg).replace(/\"/g, "") + '") center/cover no-repeat fixed');
    } else {
      document.documentElement.style.setProperty("--bg_user", "none");
    }

    // Body classes affect the overlay opacity; apply as early as body exists.
    function applyBody(){
      try{
        if (!document.body){
          setTimeout(applyBody, 0);
          return;
        }
        document.body.classList.toggle("hasWallBg", wallOn);
        document.body.classList.toggle("hasUserBg", userOn);
      }catch(_e){}
    }
    applyBody();

  }catch(_e){}
})();