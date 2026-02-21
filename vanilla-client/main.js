(function () {
  if (!window.BomApi) return;

  var titleText = document.getElementById("titleText");
  var scoreText = document.getElementById("scoreText");
  var metaText = document.getElementById("metaText");
  var teamAName = document.getElementById("teamAName");
  var teamAStatus = document.getElementById("teamAStatus");
  var onStrike = document.getElementById("onStrike");
  var onStrikeStats = document.getElementById("onStrikeStats");
  var nonStrike = document.getElementById("nonStrike");
  var nonStrikeStats = document.getElementById("nonStrikeStats");
  var bowler = document.getElementById("bowler");
  var bowlerStats = document.getElementById("bowlerStats");
  var partnership = document.getElementById("partnership");
  var recentBalls = document.getElementById("recentBalls");
  var timelineGrid = document.getElementById("timelineGrid");

  var currentMatch = null;
  var players = [];
  var recent = [];

  function timelineTemplate() {
    return [
      { match: "Test Match - Day 1", date: "2026-02-20", time: "9:00 AM", venue: "St. Maroon Grounds, Colombo", format: "Test" },
      { match: "Test Match - Day 2", date: "2026-02-21", time: "9:00 AM", venue: "St. Maroon Grounds, Colombo", format: "Test" },
      { match: "Test Match - Day 3", date: "2026-02-22", time: "9:00 AM", venue: "St. Maroon Grounds, Colombo", format: "Test" },
      { match: "One Day", date: "2026-02-25", time: "10:00 AM", venue: "Victory Sports Complex, Galle", format: "ODI" },
    ];
  }

  function renderTimeline() {
    timelineGrid.innerHTML = timelineTemplate()
      .map(function (event) {
        return (
          '<article class="neon-card timeline-card">' +
          '<p class="timeline-top">' + window.escapeHtml(event.match || "-") + "</p>" +
          '<h3 class="timeline-format">' + window.escapeHtml(event.format || "-") + "</h3>" +
          '<ul class="timeline-list">' +
          '<li><i class="fas fa-calendar"></i> ' + window.escapeHtml(event.date || "-") + "</li>" +
          '<li><i class="fas fa-clock"></i> ' + window.escapeHtml(event.time || "-") + "</li>" +
          '<li><i class="fas fa-map-marker-alt"></i> ' + window.escapeHtml(event.venue || "-") + "</li>" +
          "</ul>" +
          "</article>"
        );
      })
      .join("");
  }

  function ballLabel(update) {
    var b = null;
    if (update && update.ball && typeof update.ball === "object") {
      b = update.ball;
    } else if (update && update.type === "ball" && update.data) {
      b = update.data;
    }
    if (!b) return null;
    if (b.ball_type === "wicket") return "W";
    return String(b.runs_scored || 0);
  }

  function pushBall(update) {
    var label = ballLabel(update);
    if (!label) return;
    recent.unshift(label);
    if (recent.length > 10) recent = recent.slice(0, 10);
  }

  function ballEventPayload(update) {
    if (update && update.ball && typeof update.ball === "object") return update.ball;
    if (update && update.type === "ball" && update.data) return update.data;
    return null;
  }

  function applyBallUpdate(update) {
    var ball = ballEventPayload(update);
    if (!ball || !currentMatch) return;

    var runs = Number(ball.runs_scored || 0);
    var nextBall = Number(ball.ball || currentMatch.current_ball || 0);
    var isWicket = ball.ball_type === "wicket";

    currentMatch = {
      id: currentMatch.id,
      name: currentMatch.name,
      status: currentMatch.status,
      team_a: currentMatch.team_a,
      team_b: currentMatch.team_b,
      striker: ball.striker_id || currentMatch.striker,
      non_striker: ball.non_striker_id || currentMatch.non_striker,
      bowler: ball.bowler_id || currentMatch.bowler,
      inning: currentMatch.inning,
      total_runs: Number(currentMatch.total_runs || 0) + runs,
      current_runs: Number(currentMatch.current_runs || 0) + runs,
      current_wickets: Number(currentMatch.current_wickets || 0) + (isWicket ? 1 : 0),
      current_ball: nextBall,
      batting_team: currentMatch.batting_team,
    };
  }

  function renderRecent() {
    if (!recent.length) {
      recentBalls.innerHTML = '<p class="empty-text">Waiting for ball-by-ball updates.</p>';
      return;
    }

    recentBalls.innerHTML = recent
      .map(function (ball) {
        return '<span class="ball-chip">' + window.escapeHtml(ball) + "</span>";
      })
      .join("");
  }

  function renderMatch(match) {
    var names = window.BomApi.resolveNames(match, players);
    var oversDisplay = window.BomApi.calcOversFromBall(match.current_ball);
    var overFloat = window.BomApi.calcOverFloat(match.current_ball);
    var runRate = overFloat > 0 ? (Number(match.current_runs || 0) / overFloat).toFixed(2) : "0.00";

    titleText.textContent = names.teamAName + " vs " + names.teamBName;
    scoreText.textContent = String(match.current_runs || match.total_runs || 0) + "/" + String(match.current_wickets || 0);
    metaText.textContent = oversDisplay + " overs | RR " + runRate;

    teamAName.textContent = names.teamAName;
    teamAStatus.textContent = match.batting_team === match.team_a ? "Batting" : "Fielding";
    onStrike.textContent = names.strikerName;
    onStrikeStats.textContent = "ID: " + window.escapeHtml(match.striker || "-");
    nonStrike.textContent = names.nonStrikerName;
    nonStrikeStats.textContent = "ID: " + window.escapeHtml(match.non_striker || "-");
    bowler.textContent = names.bowlerName;
    bowlerStats.textContent = "ID: " + window.escapeHtml(match.bowler || "-");
    partnership.textContent = "Inning " + String(match.inning || 1) + " | " + String(match.status || "scheduled");

    renderRecent();
  }

  async function fetchInitial() {
    var loaded = await Promise.all([window.BomApi.getMatchState(), window.BomApi.getPlayers()]);
    currentMatch = loaded[0] || window.BomApi.fallbackMatch;
    players = loaded[1] || [];

    try {
      var liveMatch = await window.BomApi.getMatchById(currentMatch.id);
      currentMatch = window.BomApi.mergeMatchState(currentMatch, {
        id: liveMatch.id,
        inning: liveMatch.inning,
        striker: liveMatch.striker,
        non_striker: liveMatch.non_striker,
        bowler: liveMatch.bowler,
        total_runs: liveMatch.total_runs,
      });
    } catch (_err) {
      // Keep already loaded state if specific match lookup fails.
    }

    renderMatch(currentMatch);
  }

  function attachUpdates() {
    window.BomApi.subscribeUpdates(
      function (payload) {
        var snapshot = window.BomApi.normalizeSnapshot(payload);
        if (snapshot) {
          currentMatch = window.BomApi.mergeMatchState(currentMatch || window.BomApi.fallbackMatch, snapshot);
          renderMatch(currentMatch);
          return;
        }

        if (payload.ball) {
          applyBallUpdate(payload);
          pushBall(payload);
          renderMatch(currentMatch);
          return;
        }

        if (payload.type === "ball" && payload.data) {
          applyBallUpdate(payload);
          pushBall(payload);
          renderMatch(currentMatch);
        }
      },
      function () {
        // SSE disconnects are expected intermittently; periodic refresh below covers state sync.
      }
    );
  }

  async function pollMatch() {
    try {
      currentMatch = await window.BomApi.getMatchState();
      renderMatch(currentMatch);
    } catch (_err) {
      // Ignore one-off polling failures.
    }
  }

  renderTimeline();
  fetchInitial()
    .then(function () {
      attachUpdates();
      setInterval(pollMatch, 15000);
    })
    .catch(function () {
      currentMatch = window.BomApi.fallbackMatch;
      renderMatch(currentMatch);
      attachUpdates();
    });
})();
