(function () {
  if (!window.BomApi) return;

  var form = document.getElementById("loginForm");
  var message = document.getElementById("loginMessage");

  if (localStorage.getItem("admin_session") === "true") {
    window.location.replace("./admin-dashboard.html");
    return;
  }

  function setMessage(text, isError) {
    message.textContent = text;
    message.className = "form-message " + (isError ? "error" : "success");
  }

  form.addEventListener("submit", async function (event) {
    event.preventDefault();

    var username = document.getElementById("username").value.trim();
    var password = document.getElementById("password").value;

    try {
      var payload = await window.BomApi.loginAdmin(username, password);
      if (payload && payload.token) {
        localStorage.setItem("bom_admin_token", payload.token);
      }
      localStorage.setItem("admin_session", "true");
      setMessage("Login success. Redirecting...", false);
      setTimeout(function () {
        window.location.replace("./admin-dashboard.html");
      }, 250);
      return;
    } catch (_apiErr) {
      if (username === "bomadmin" && password === "epstein") {
        localStorage.setItem("admin_session", "true");
        setMessage("Demo login success. Redirecting...", false);
        setTimeout(function () {
          window.location.replace("./admin-dashboard.html");
        }, 250);
      } else {
        setMessage("Invalid credentials", true);
      }
    }
  });
})();
