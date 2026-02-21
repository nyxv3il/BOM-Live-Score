(function () {
  function escapeHtml(input) {
    return String(input)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function renderNav() {
    var nav = document.querySelector("[data-nav]");
    if (!nav) return;

    var path = window.location.pathname.toLowerCase();
    var current = path.substring(path.lastIndexOf("/") + 1) || "index.html";

    var links = [
      { href: "./index.html", label: "Home", key: "index.html" },
      { href: "./summary.html", label: "Summary", key: "summary.html" },
      { href: "./credits.html", label: "Credits", key: "credits.html" },
      { href: "./admin-dashboard.html", label: "Admin", key: "admin-dashboard.html" },
    ];

    var desktop = links
      .map(function (link) {
        var active = current === link.key ? " active" : "";
        return '<a class="nav-link' + active + '" href="' + link.href + '">' + escapeHtml(link.label) + "</a>";
      })
      .join("");

    nav.innerHTML =
      '<div class="nav-wrap">' +
      '<a class="brand" href="./index.html"><img src="./assets/livescore.png" alt="logo" />BOM<span>LiveScore</span></a>' +
      '<div class="nav-links">' +
      desktop +
      "</div>" +
      '<button class="mobile-toggle" type="button" aria-label="Toggle menu"><i class="fas fa-bars"></i></button>' +
      "</div>" +
      '<div class="mobile-menu"></div>' +
      '<div class="api-row">' +
      '<label for="apiBaseInput">API Base URL</label>' +
      '<input id="apiBaseInput" placeholder="https://bom.ultrasploit.com" />' +
      '<button id="saveApiBaseBtn" type="button">Save</button>' +
      "</div>";

    var mobileMenu = nav.querySelector(".mobile-menu");
    if (mobileMenu) {
      mobileMenu.innerHTML = desktop;
    }

    var toggle = nav.querySelector(".mobile-toggle");
    if (toggle && mobileMenu) {
      toggle.addEventListener("click", function () {
        mobileMenu.classList.toggle("open");
      });
    }

    var apiInput = document.getElementById("apiBaseInput");
    var saveBtn = document.getElementById("saveApiBaseBtn");
    if (apiInput) {
      apiInput.value = localStorage.getItem("bom_api_base_url") || "https://bom.ultrasploit.com";
    }
    if (apiInput && saveBtn) {
      saveBtn.addEventListener("click", function () {
        var value = apiInput.value.trim().replace(/\/$/, "");
        if (!value) return;
        localStorage.setItem("bom_api_base_url", value);
        window.location.reload();
      });
    }
  }

  window.escapeHtml = escapeHtml;
  renderNav();
})();

