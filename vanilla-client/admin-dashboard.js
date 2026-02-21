(function () {
  if (!window.BomApi) return;

  if (localStorage.getItem("admin_session") !== "true") {
    window.location.replace("./admin-login.html");
    return;
  }

  var matchIdSelect = document.getElementById("matchIdSelect");
  var openingTeamSelect = document.getElementById("openingTeamSelect");
  var pauseReason = document.getElementById("pauseReason");
  var matchMessage = document.getElementById("matchMessage");

  var ballType = document.getElementById("ballType");
  var runsScored = document.getElementById("runsScored");
  var strikerId = document.getElementById("strikerId");
  var nonStrikerId = document.getElementById("nonStrikerId");
  var bowlerId = document.getElementById("bowlerId");
  var fielderId = document.getElementById("fielderId");
  var ballMessage = document.getElementById("ballMessage");
  var feedOutput = document.getElementById("feedOutput");

  function setMessage(el, text, type) {
    el.textContent = text;
    el.className = "form-message " + (type || "");
  }

  function appendFeed(title, payload) {
    var existing = feedOutput.textContent || "";
    var lines = existing.split("\n").filter(Boolean);
    var stamp = new Date().toLocaleTimeString();
    lines.unshift("[" + stamp + "] " + title + "\n" + JSON.stringify(payload, null, 2));
    if (lines.length > 14) lines = lines.slice(0, 14);
    feedOutput.textContent = lines.join("\n\n");
  }

  function selectOptions(items, format) {
    return items
      .map(function (item) {
        return '<option value="' + window.escapeHtml(item.id) + '">' + window.escapeHtml(format(item)) + "</option>";
      })
      .join("");
  }

  function swapStrikerSelections() {
    var prevStriker = strikerId.value;
    strikerId.value = nonStrikerId.value;
    nonStrikerId.value = prevStriker;
  }

  async function loadInitial() {
    var loaded = await Promise.all([window.BomApi.getAllMatches(), window.BomApi.getPlayers()]);
    var matches = loaded[0];
    var players = loaded[1];

    matchIdSelect.innerHTML = matches
      .map(function (m) {
        return '<option value="' + window.escapeHtml(m.id) + '">' + window.escapeHtml(m.id + " - " + m.name + " (" + m.status + ")") + "</option>";
      })
      .join("");

    var playerOptions = selectOptions(players, function (player) {
      return player.id + " - " + player.name + " (" + window.BomApi.mapTeamName(player.team_id) + ")";
    });

    strikerId.innerHTML = playerOptions;
    nonStrikerId.innerHTML = playerOptions;
    bowlerId.innerHTML = playerOptions;

    var live = matches.find(function (m) {
      return m.status === "live" || m.status === "paused";
    });
    if (live) {
      matchIdSelect.value = live.id;
      openingTeamSelect.value = live.team_a || "ananda_college";
    }
  }

  async function send(type, data, el) {
    try {
      var result = await window.BomApi.postBroadcast(type, data);
      setMessage(el, "Sent " + type + " update.", "success");
      appendFeed("Broadcast " + type, result);
    } catch (error) {
      setMessage(el, "Broadcast failed: " + (error.message || "Unknown error"), "error");
    }
  }

  document.getElementById("btnToss").addEventListener("click", function () {
    send("toss", null, matchMessage);
  });

  document.getElementById("btnStart").addEventListener("click", function () {
    send(
      "start",
      {
        match_id: matchIdSelect.value,
        opening_team: openingTeamSelect.value,
      },
      matchMessage
    );
  });

  document.getElementById("btnPause").addEventListener("click", function () {
    send(
      "pause",
      {
        reason: pauseReason.value.trim() || "manual pause",
      },
      matchMessage
    );
  });

  document.getElementById("btnEnd").addEventListener("click", function () {
    send("end", null, matchMessage);
  });

  document.getElementById("btnBall").addEventListener("click", function () {
    send(
      "ball",
      {
        ball_type: ballType.value,
        striker_id: strikerId.value,
        non_striker_id: nonStrikerId.value,
        bowler_id: bowlerId.value,
        runs_scored: Number(runsScored.value || 0),
        wicket_fielder_id: fielderId.value.trim() || null,
      },
      ballMessage
    );
  });

  document.getElementById("btnSwapStrikers").addEventListener("click", function () {
    swapStrikerSelections();
    setMessage(ballMessage, "Swapped striker and non-striker selections.", "success");
  });

  document.getElementById("btnEndOver").addEventListener("click", function () {
    swapStrikerSelections();
    setMessage(ballMessage, "Over ended. Striker and non-striker swapped.", "success");
  });

  window.BomApi.subscribeUpdates(
    function (payload) {
      appendFeed("SSE event", payload);
    },
    function (error) {
      appendFeed("SSE error", { message: String(error) });
    }
  );

  loadInitial().catch(function (error) {
    setMessage(matchMessage, "Failed to load initial match/player lists: " + (error.message || "Unknown error"), "error");
  });
})();
