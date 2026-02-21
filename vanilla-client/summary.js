(function () {
  if (!window.BomApi) return;

  var summaryGrid = document.getElementById("summaryGrid");

  function groupByTeam(players) {
    return players.reduce(function (acc, row) {
      var key = row.team_id || "unknown";
      if (!acc[key]) acc[key] = [];
      acc[key].push(row);
      return acc;
    }, {});
  }

  function render(players) {
    var grouped = groupByTeam(players || []);
    var teams = Object.keys(grouped);

    if (teams.length === 0) {
      summaryGrid.innerHTML = '<p class="empty-text">No players available.</p>';
      return;
    }

    summaryGrid.innerHTML = teams
      .map(function (teamId) {
        var rows = grouped[teamId];
        var body = rows
          .map(function (player) {
            return (
              "<tr>" +
              "<td>" + window.escapeHtml(player.id || "-") + "</td>" +
              "<td>" + window.escapeHtml(player.name || "-") + "</td>" +
              "<td>" + window.escapeHtml(window.BomApi.mapTeamName(player.team_id || "-")) + "</td>" +
              "</tr>"
            );
          })
          .join("");

        return (
          '<article class="team-summary">' +
          "<h2>" + window.escapeHtml(window.BomApi.mapTeamName(teamId)) + " Squad</h2>" +
          '<div class="table-wrap">' +
          '<table class="summary-table">' +
          "<thead><tr><th>Player ID</th><th>Player Name</th><th>Team</th></tr></thead>" +
          "<tbody>" +
          body +
          "</tbody></table></div></article>"
        );
      })
      .join("");
  }

  async function refresh() {
    try {
      var players = await window.BomApi.getPlayers();
      render(players);
    } catch (_error) {
      render([]);
    }
  }

  refresh();
  setInterval(refresh, 15000);
})();
