(function () {
  var y = document.getElementById("home_year");
  if (y) y.textContent = String(new Date().getFullYear());

  var toggle = document.getElementById("home_nav_toggle");
  var nav = document.getElementById("home_nav");
  if (!toggle || !nav) return;

  toggle.addEventListener("click", function () {
    var open = nav.classList.toggle("is-open");
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && nav.classList.contains("is-open")) {
      nav.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
      toggle.focus();
    }
  });
})();
