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

    var TAB = "home";

    function getLS(k){
      try{ return localStorage.getItem(k) || ""; }catch(_e){ return ""; }
    }

    function assetRev(){
      try{
        var m = document.querySelector('meta[name="gmx-asset-rev"]');
        return (m && m.getAttribute("content")) || "";
      }catch(_e){ return ""; }
    }

    function wallUrl(base, file){
      var u = base + file;
      var rev = assetRev();
      if (rev) u += (u.indexOf("?") >= 0 ? "&" : "?") + "v=" + rev;
      return u;
    }

    function paintWallLayer(url){
      function go(){
        try{
          if (!document.body){ setTimeout(go, 0); return; }
          var mount = document.querySelector(".bg") || document.body;
          var layer = mount.querySelector("#gmxWallLayer") || document.getElementById("gmxWallLayer");
          if (!layer){
            layer = document.createElement("div");
            layer.id = "gmxWallLayer";
            layer.className = "gmxWallLayer";
            layer.setAttribute("aria-hidden", "true");
            mount.prepend(layer);
          } else if (layer.parentElement !== mount) {
            mount.prepend(layer);
          }
          var img = layer.querySelector("img");
          if (!img){
            img = document.createElement("img");
            img.className = "gmxWallImg";
            img.alt = "";
            img.decoding = "async";
            img.loading = "eager";
            layer.appendChild(img);
          }
          if (layer.getAttribute("data-wall-url") !== url){
            layer.setAttribute("data-wall-url", url);
            img.src = url;
          }
          layer.style.display = "block";
        }catch(_e){}
      }
      go();
    }

    // Wallpaper: tab-specific -> global (app.js overrides with manifest-based path)
    var wp = getLS("gmx_wp_tab_" + TAB) || getLS("gmx_wp_all") || getLS("gmx_wp_global");
    var wallOn = !!wp;
    if (wp){
      var file, base = "/assets/wallpapers/";
      var wid = String(wp).replace(/[^a-z0-9_\-]/gi, "");
      if (/^custom_.*\.(png|jpg|jpeg|webp)$/i.test(String(wp))) file = "custom/" + String(wp).replace(/[^a-z0-9_.\-]/gi, "");
      else if (/^v2_\d{3}$/i.test(wid)) file = wid + ".webp";
      else if (wid === "free01") file = "free01.png";
      else if (wid === "free02") file = "free02.jpg";
      else if (/^w\d{1,3}$/.test(wid)) file = wid + ".jpg";
      else file = wid + ".svg";
      document.documentElement.style.setProperty("--bg_wall", "none");
      paintWallLayer(wallUrl(base, file));
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
