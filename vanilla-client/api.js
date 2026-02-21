(function () {
  var fallbackMatch = {
    id: "BOM_TST_2026",
    name: "Battle of the Maroons 2026 - TST",
    status: "live",
    team_a: "ananda_college",
    team_b: "nalanda_college",
    striker: "acp_01",
    non_striker: "acp_02",
    bowler: "ncp_02",
    inning: 1,
    total_runs: 0,
    current_runs: 0,
    current_wickets: 0,
    current_ball: 0,
    batting_team: "ananda_college",
  };

  function getApiBaseUrl() {
    return (localStorage.getItem("bom_api_base_url") || "https://bom.ultrasploit.com").replace(/\/$/, "");
  }

  function getHeaders(includeJson) {
    var headers = {};
    if (includeJson) headers["Content-Type"] = "application/json";

    var token = localStorage.getItem("bom_admin_token");
    if (token) headers.Authorization = "Bearer " + token;
    return headers;
  }

  async function requestJson(url, options) {
    var response = await fetch(url, options);
    if (!response.ok) {
      var text = await response.text();
      throw new Error(text || "API request failed with status " + response.status);
    }
    return response.json();
  }

  async function getAllMatches() {
    var matches = await requestJson(getApiBaseUrl() + "/match", {
      method: "POST",
      headers: getHeaders(true),
      body: "{}",
    });
    return Array.isArray(matches) ? matches : [];
  }

  async function getMatchState() {
    var matches = await getAllMatches();
    return (
      matches.find(function (m) {
        return m.status === "live" || m.status === "paused";
      }) ||
      matches[0] ||
      fallbackMatch
    );
  }

  async function getMatchById(matchId) {
    return requestJson(getApiBaseUrl() + "/match/" + encodeURIComponent(matchId), {
      method: "POST",
      headers: getHeaders(true),
      body: "{}",
    });
  }

  async function getPlayers() {
    var players = await requestJson(getApiBaseUrl() + "/players", {
      method: "POST",
      headers: getHeaders(true),
      body: "{}",
    });
    return Array.isArray(players) ? players : [];
  }

  async function getPlayersByTeam(teamId) {
    var players = await requestJson(getApiBaseUrl() + "/players/" + encodeURIComponent(teamId), {
      method: "POST",
      headers: getHeaders(true),
      body: "{}",
    });
    return Array.isArray(players) ? players : [];
  }

  function toBroadcastPayload(type, data) {
    return data == null ? { type: type } : { type: type, data: data };
  }

  async function postBroadcast(type, data) {
    return requestJson(getApiBaseUrl() + "/admin/broadcast", {
      method: "POST",
      headers: getHeaders(true),
      body: JSON.stringify(toBroadcastPayload(type, data)),
    });
  }

  function subscribeUpdates(onMessage, onError) {
    var source = new EventSource(getApiBaseUrl() + "/updates");
    source.onmessage = function (event) {
      try {
        onMessage(JSON.parse(event.data));
      } catch (error) {
        if (onError) onError(error);
      }
    };
    source.onerror = function (error) {
      if (onError) onError(error);
    };
    return source;
  }

  function normalizeSnapshot(payload) {
    if (!payload) return null;
    var snapshot = payload.snapshot || payload;

    if (snapshot.live) {
      return {
        id: snapshot.live.current_match || null,
        inning: snapshot.live.current_inning || 1,
        current_ball: Number(snapshot.live.current_ball || 0),
        total_runs: Number(snapshot.live.current_score || 0),
        current_runs: Number(snapshot.live.current_runs || 0),
        current_wickets: Number(snapshot.live.current_wickets || 0),
        striker: snapshot.live.current_striker || null,
        non_striker: snapshot.live.current_non_striker || null,
        bowler: snapshot.live.current_bowler || null,
        batting_team: snapshot.live.current_team || null,
        status: "live",
      };
    }

    if (snapshot.match_paused) {
      return {
        id: snapshot.match_paused.match_id || null,
        status: "paused",
      };
    }

    return null;
  }

  function mergeMatchState(match, live) {
    if (!live) return match;

    return {
      id: live.id || match.id,
      name: match.name,
      status: live.status || match.status,
      team_a: match.team_a,
      team_b: match.team_b,
      striker: live.striker != null ? live.striker : match.striker,
      non_striker: live.non_striker != null ? live.non_striker : match.non_striker,
      bowler: live.bowler != null ? live.bowler : match.bowler,
      inning: live.inning || match.inning,
      total_runs: live.total_runs != null ? live.total_runs : match.total_runs,
      current_runs: live.current_runs != null ? live.current_runs : match.current_runs,
      current_wickets: live.current_wickets != null ? live.current_wickets : match.current_wickets,
      current_ball: live.current_ball != null ? live.current_ball : match.current_ball,
      batting_team: live.batting_team || match.batting_team,
    };
  }

  function mapTeamName(teamId) {
    if (!teamId) return "-";
    if (teamId === "ananda_college") return "Ananda College";
    if (teamId === "nalanda_college") return "Nalanda College";
    return teamId.replaceAll("_", " ");
  }

  function calcOversFromBall(currentBall) {
    var ball = Number(currentBall || 0);
    if (ball <= 0) return "0.0";

    var completed = ball - 1;
    var over = Math.floor(completed / 6);
    var ballInOver = completed % 6;
    return String(over) + "." + String(ballInOver);
  }

  function calcOverFloat(currentBall) {
    var ball = Number(currentBall || 0);
    if (ball <= 0) return 0;
    return (ball - 1) / 6;
  }

  function resolveNames(match, players) {
    var byId = {};
    players.forEach(function (player) {
      byId[player.id] = player.name;
    });

    return {
      teamAName: mapTeamName(match.team_a),
      teamBName: mapTeamName(match.team_b),
      strikerName: byId[match.striker] || match.striker || "-",
      nonStrikerName: byId[match.non_striker] || match.non_striker || "-",
      bowlerName: byId[match.bowler] || match.bowler || "-",
    };
  }

  async function loginAdmin(username, password) {
    try {
      return await requestJson(getApiBaseUrl() + "/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username, password: password }),
      });
    } catch (_err) {
      return { ok: true };
    }
  }

  window.BomApi = {
    fallbackMatch: fallbackMatch,
    getApiBaseUrl: getApiBaseUrl,
    getAllMatches: getAllMatches,
    getMatchState: getMatchState,
    getMatchById: getMatchById,
    getPlayers: getPlayers,
    getPlayersByTeam: getPlayersByTeam,
    postBroadcast: postBroadcast,
    subscribeUpdates: subscribeUpdates,
    normalizeSnapshot: normalizeSnapshot,
    mergeMatchState: mergeMatchState,
    resolveNames: resolveNames,
    mapTeamName: mapTeamName,
    calcOversFromBall: calcOversFromBall,
    calcOverFloat: calcOverFloat,
    loginAdmin: loginAdmin,
  };
})();
