"use client";

import { ChangeEvent, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import ViewerCount from "@/components/ViewerCount";

interface MatchState {
  id?: number;
  team_a_name: string;
  team_b_name: string;
  match_status: string;
  inning: number;
  team_a_runs: number;
  team_a_wickets: number;
  team_a_overs: number;
  team_b_runs: number;
  team_b_wickets: number;
  team_b_overs: number;
  runs: number;
  wickets: number;
  overs: number;
  recent_balls: string;
  current_batsman: string;
  current_bowler: string;
  batting_team: string;
  non_striker: string;
  partnership: string;
  current_batsman_stats: string;
  non_striker_stats: string;
  current_bowler_stats: string;
  series_name: string;
  match_logo_url: string;
  match_description: string;
  match_1_date: string;
  match_1_time: string;
  match_1_venue: string;
  match_1_format: string;
  match_2_date: string;
  match_2_time: string;
  match_2_venue: string;
  match_2_format: string;
  match_3_date: string;
  match_3_time: string;
  match_3_venue: string;
  match_3_format: string;
  match_4_date: string;
  match_4_time: string;
  match_4_venue: string;
  match_4_format: string;
}

interface PlayerScore {
  id?: number;
  team_name: string;
  player_name: string;
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  strike_rate: number;
  wickets: number;
  overs: number;
  economy: number;
}

interface TeamPlayer {
  id?: number;
  team_name: string;
  player_name: string;
}

type MatchFieldKey = Exclude<keyof MatchState, "id">;
type ExtraType = "none" | "wd" | "nb" | "bye" | "legbye";
type WicketType =
  | "bowled"
  | "caught"
  | "lbw"
  | "run_out"
  | "stumped"
  | "hit_wicket";

const swapStrikerFields = (state: MatchState): MatchState => ({
  ...state,
  current_batsman: state.non_striker,
  non_striker: state.current_batsman,
  current_batsman_stats: state.non_striker_stats,
  non_striker_stats: state.current_batsman_stats,
});

const roundTo = (value: number, digits = 2): number => {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
};

const normalizeName = (value: string | null | undefined): string =>
  (value || "").trim().toLowerCase();

const findPlayerIndex = (
  rows: PlayerScore[],
  name: string,
  teamName?: string,
): number => {
  const normalizedName = normalizeName(name);
  const normalizedTeam = normalizeName(teamName);
  if (!normalizedName) return -1;

  const byTeam = rows.findIndex(
    (row) =>
      normalizeName(row.player_name) === normalizedName &&
      (!normalizedTeam || normalizeName(row.team_name) === normalizedTeam),
  );

  if (byTeam !== -1) return byTeam;
  return rows.findIndex(
    (row) => normalizeName(row.player_name) === normalizedName,
  );
};

const defaultMatch: MatchState = {
  team_a_name: "",
  team_b_name: "",
  match_status: "scheduled",
  inning: 1,
  team_a_runs: 0,
  team_a_wickets: 0,
  team_a_overs: 0,
  team_b_runs: 0,
  team_b_wickets: 0,
  team_b_overs: 0,
  runs: 0,
  wickets: 0,
  overs: 0,
  recent_balls: "",
  current_batsman: "",
  current_bowler: "",
  batting_team: "",
  non_striker: "",
  partnership: "",
  current_batsman_stats: "",
  non_striker_stats: "",
  current_bowler_stats: "",
  series_name: "",
  match_logo_url: "",
  match_description: "",
  match_1_date: "",
  match_1_time: "",
  match_1_venue: "",
  match_1_format: "",
  match_2_date: "",
  match_2_time: "",
  match_2_venue: "",
  match_2_format: "",
  match_3_date: "",
  match_3_time: "",
  match_3_venue: "",
  match_3_format: "",
  match_4_date: "",
  match_4_time: "",
  match_4_venue: "",
  match_4_format: "",
};

const newPlayerRow: PlayerScore = {
  team_name: "",
  player_name: "",
  runs: 0,
  balls: 0,
  fours: 0,
  sixes: 0,
  strike_rate: 0,
  wickets: 0,
  overs: 0,
  economy: 0,
};

export default function AdminDashboard() {
  const [match, setMatch] = useState<MatchState>(defaultMatch);
  const [players, setPlayers] = useState<PlayerScore[]>([]);
  const [teamPlayers, setTeamPlayers] = useState<TeamPlayer[]>([]);
  const [newTeamPlayer, setNewTeamPlayer] = useState<TeamPlayer>({
    team_name: "",
    player_name: "",
  });
  const [missingRosterTable, setMissingRosterTable] = useState(false);
  const [updatableMatchKeys, setUpdatableMatchKeys] = useState<string[]>([]);
  const [selectedRuns, setSelectedRuns] = useState(0);
  const [selectedExtra, setSelectedExtra] = useState<ExtraType>("none");
  const [selectedWicket, setSelectedWicket] = useState<WicketType>("bowled");
  const [deliveryComment, setDeliveryComment] = useState("");
  const [recordingDelivery, setRecordingDelivery] = useState(false);
  useEffect(() => {
    const fetchData = async () => {
      if (!supabase) return;

      const [{ data: matchData }, { data: playersData }, rosterResult] =
        await Promise.all([
          supabase.from("match_state").select("*").eq("id", 1).single(),
          supabase
            .from("player_scores")
            .select("*")
            .order("team_name", { ascending: true })
            .order("player_name", { ascending: true }),
          supabase
            .from("team_players")
            .select("*")
            .order("team_name", { ascending: true })
            .order("player_name", { ascending: true }),
        ]);

      const nextPlayers = (playersData as PlayerScore[]) || [];
      const nextTeamPlayers = (rosterResult?.data as TeamPlayer[]) || [];
      if (playersData) {
        let hydratedPlayers = nextPlayers;
        if (supabase && nextTeamPlayers.length > 0) {
          const playerKey = (teamName: string, playerName: string) =>
            `${normalizeName(teamName)}::${normalizeName(playerName)}`;
          const existingSet = new Set(
            nextPlayers.map((row) => playerKey(row.team_name, row.player_name)),
          );
          const missing = nextTeamPlayers.filter(
            (player) =>
              !existingSet.has(playerKey(player.team_name, player.player_name)),
          );

          if (missing.length > 0) {
            const { data: insertedRows, error: insertError } = await supabase
              .from("player_scores")
              .insert(
                missing.map((player) => ({
                  team_name: player.team_name,
                  player_name: player.player_name,
                })),
              )
              .select("*");

            if (!insertError && insertedRows) {
              hydratedPlayers = [
                ...nextPlayers,
                ...(insertedRows as PlayerScore[]),
              ];
            }
          }
        }
        setPlayers(hydratedPlayers);
      }

      if (rosterResult?.error) {
        setMissingRosterTable(true);
      } else {
        setMissingRosterTable(false);
        setTeamPlayers(nextTeamPlayers);
      }

      if (matchData) {
        setMatch((prev) => ({
          ...prev,
          ...(matchData as Partial<MatchState>),
        }));
        setUpdatableMatchKeys(Object.keys(matchData));
      }
    };

    void fetchData();
  }, []);

  const handleMatchChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    const numeric = [
      "runs",
      "wickets",
      "overs",
      "inning",
      "team_a_runs",
      "team_a_wickets",
      "team_a_overs",
      "team_b_runs",
      "team_b_wickets",
      "team_b_overs",
    ];
    setMatch(
      (prev) =>
        ({
          ...prev,
          [name]: numeric.includes(name) ? Number(value) : value,
        }) as MatchState,
    );
  };

  const handlePlayerChange = (
    index: number,
    key: keyof PlayerScore,
    value: string,
  ) => {
    const numericKeys: (keyof PlayerScore)[] = [
      "runs",
      "balls",
      "fours",
      "sixes",
      "strike_rate",
      "wickets",
      "overs",
      "economy",
    ];
    const parsed = numericKeys.includes(key) ? Number(value) : value;
    setPlayers((prev) =>
      prev.map((p, i) => (i === index ? { ...p, [key]: parsed } : p)),
    );
  };

  const saveMatch = async () => {
    const derived = applyDerivedMatchFields(
      withSyncedTeamInnings(match),
      players,
    );
    await persistMatch(derived, "Match info updated.");
  };

  const getMatchPayload = (nextMatch: MatchState) =>
    Object.fromEntries(
      Object.entries(nextMatch).filter(
        ([key]) => key !== "id" && updatableMatchKeys.includes(key),
      ),
    );

  const persistMatch = async (
    nextMatch: MatchState,
    successMessage?: string,
  ): Promise<boolean> => {
    if (!supabase) {
      alert("Supabase is not configured.");
      return false;
    }

    const payload = getMatchPayload(nextMatch);
    if (Object.keys(payload).length === 0) {
      alert("Match data is still loading. Try again in a moment.");
      return false;
    }

    const { error } = await supabase
      .from("match_state")
      .update(payload)
      .eq("id", 1);

    if (error) {
      alert(`Error updating match info: ${error.message}`);
      return false;
    }

    setMatch(nextMatch);
    if (successMessage) alert(successMessage);
    return true;
  };

  const handleSwapStrikers = async () => {
    const swappedMatch = applyDerivedMatchFields(
      swapStrikerFields(match),
      players,
    );
    await persistMatch(swappedMatch, "Striker and non-striker swapped.");
  };

  const handleEndOver = async () => {
    const ballsPerOver = 6;
    const legalBallsInCurrentOver = getCurrentOverLegalBalls(
      match.recent_balls,
    );
    if (legalBallsInCurrentOver < ballsPerOver) {
      alert(
        `This over has ${legalBallsInCurrentOver} legal balls. It must reach ${ballsPerOver} balls before ending.`,
      );
      return;
    }

    const swappedMatch = applyDerivedMatchFields(
      swapStrikerFields(match),
      players,
    );
    const currentOvers = Number(swappedMatch.overs) || 0;
    const completedOvers = Math.floor(currentOvers);
    const nextOver = Number(`${Math.max(completedOvers + 1, 0)}.0`);

    await persistMatch(
      applyDerivedMatchFields(
        {
          ...swappedMatch,
          overs: nextOver,
          recent_balls: pushRecentBall(swappedMatch.recent_balls, "|"),
        },
        players,
      ),
      "Over ended and batters swapped.",
    );
  };

  const handleMatchStart = async () => {
    const battingTeam =
      match.batting_team || match.team_a_name || match.team_b_name;
    const innings = getTeamInnings(match, battingTeam);
    const nextMatch = applyDerivedMatchFields(
      withSyncedTeamInnings({
        ...match,
        match_status: "live",
        inning: Number(match.inning) > 0 ? Number(match.inning) : 1,
        batting_team: battingTeam,
        runs: innings.runs,
        wickets: innings.wickets,
        overs: innings.overs,
      }),
      players,
    );
    await persistMatch(nextMatch, "Match started.");
  };

  const handleMatchEnd = async () => {
    const resetPlayers = players.map((player) => ({
      ...player,
      runs: 0,
      balls: 0,
      fours: 0,
      sixes: 0,
      strike_rate: 0,
      wickets: 0,
      overs: 0,
      economy: 0,
    }));

    const playersSaved = await persistPlayers(resetPlayers);
    if (!playersSaved) return;

    const nextMatch = applyDerivedMatchFields(
      withSyncedTeamInnings({
        ...match,
        match_status: "completed",
        inning: 1,
        batting_team: match.team_a_name || match.batting_team,
        team_a_runs: 0,
        team_a_wickets: 0,
        team_a_overs: 0,
        team_b_runs: 0,
        team_b_wickets: 0,
        team_b_overs: 0,
        runs: 0,
        wickets: 0,
        overs: 0,
        recent_balls: "",
        current_batsman: "",
        non_striker: "",
        current_bowler: "",
        partnership: "0 (0)",
        current_batsman_stats: "0 (0)",
        non_striker_stats: "0 (0)",
        current_bowler_stats: "0-0-0-0",
      }),
      resetPlayers,
    );
    const saved = await persistMatch(
      nextMatch,
      "Match ended and all scores reset.",
    );
    if (saved) setPlayers(resetPlayers);
  };

  const handleSwapBattingTeam = async () => {
    const currentTeam = match.batting_team || match.team_a_name;
    const nextTeam =
      normalizeName(currentTeam) === normalizeName(match.team_a_name)
        ? match.team_b_name
        : match.team_a_name;

    const syncedCurrent = withSyncedTeamInnings(match);
    const nextInningsStats = getTeamInnings(syncedCurrent, nextTeam);
    const nextMatch = applyDerivedMatchFields(
      {
        ...syncedCurrent,
        match_status: syncedCurrent.match_status || "live",
        inning: Math.max(2, Number(syncedCurrent.inning) || 1),
        batting_team: nextTeam,
        runs: nextInningsStats.runs,
        wickets: nextInningsStats.wickets,
        overs: nextInningsStats.overs,
        current_batsman: "",
        non_striker: "",
        current_bowler: "",
      },
      players,
    );

    await persistMatch(nextMatch, "Batting team swapped.");
  };

  const oversToBalls = (oversValue: number): number => {
    const wholeOvers = Math.floor(oversValue);
    const ballPart = Math.round((oversValue - wholeOvers) * 10);
    return wholeOvers * 6 + Math.max(ballPart, 0);
  };

  const incrementOverBall = (oversValue: number): number => {
    const safeOvers = Number(oversValue) || 0;
    const wholeOvers = Math.floor(safeOvers);
    const ballPart = Math.max(0, Math.round((safeOvers - wholeOvers) * 10));
    return Number(`${wholeOvers}.${ballPart + 1}`);
  };

  const toBowlerRunsConceded = (player: PlayerScore): number => {
    const balls = oversToBalls(Number(player.overs) || 0);
    if (balls <= 0) return 0;
    const oversAsFloat = balls / 6;
    return Math.max(
      0,
      Math.round((Number(player.economy) || 0) * oversAsFloat),
    );
  };

  const formatBatterStats = (player?: PlayerScore): string =>
    player ? `${player.runs} (${player.balls})` : "0 (0)";

  const formatPartnership = (
    striker?: PlayerScore,
    nonStriker?: PlayerScore,
  ): string => {
    const runs = (striker?.runs ?? 0) + (nonStriker?.runs ?? 0);
    const balls = (striker?.balls ?? 0) + (nonStriker?.balls ?? 0);
    return `${runs} (${balls})`;
  };

  const formatBowlerStats = (player?: PlayerScore): string => {
    if (!player) return "0-0-0-0";
    const conceded = toBowlerRunsConceded(player);
    return `${player.overs}-0-${conceded}-${player.wickets}`;
  };

  const getBowlingTeam = (state: MatchState): string =>
    state.batting_team === state.team_a_name
      ? state.team_b_name
      : state.team_a_name;

  const getTeamInnings = (
    state: MatchState,
    teamName: string,
  ): { runs: number; wickets: number; overs: number } => {
    if (normalizeName(teamName) === normalizeName(state.team_a_name)) {
      return {
        runs: Number(state.team_a_runs) || 0,
        wickets: Number(state.team_a_wickets) || 0,
        overs: Number(state.team_a_overs) || 0,
      };
    }

    return {
      runs: Number(state.team_b_runs) || 0,
      wickets: Number(state.team_b_wickets) || 0,
      overs: Number(state.team_b_overs) || 0,
    };
  };

  const withSyncedTeamInnings = (state: MatchState): MatchState => {
    if (
      normalizeName(state.batting_team) === normalizeName(state.team_a_name)
    ) {
      return {
        ...state,
        team_a_runs: Number(state.runs) || 0,
        team_a_wickets: Number(state.wickets) || 0,
        team_a_overs: Number(state.overs) || 0,
      };
    }

    if (
      normalizeName(state.batting_team) === normalizeName(state.team_b_name)
    ) {
      return {
        ...state,
        team_b_runs: Number(state.runs) || 0,
        team_b_wickets: Number(state.wickets) || 0,
        team_b_overs: Number(state.overs) || 0,
      };
    }

    return state;
  };

  const applyDerivedMatchFields = (
    nextMatch: MatchState,
    nextPlayers: PlayerScore[],
  ): MatchState => {
    const strikerIndex = findPlayerIndex(
      nextPlayers,
      nextMatch.current_batsman,
      nextMatch.batting_team,
    );
    const nonStrikerIndex = findPlayerIndex(
      nextPlayers,
      nextMatch.non_striker,
      nextMatch.batting_team,
    );
    const bowlerIndex = findPlayerIndex(
      nextPlayers,
      nextMatch.current_bowler,
      getBowlingTeam(nextMatch),
    );

    const striker = strikerIndex >= 0 ? nextPlayers[strikerIndex] : undefined;
    const nonStriker =
      nonStrikerIndex >= 0 ? nextPlayers[nonStrikerIndex] : undefined;
    const bowler = bowlerIndex >= 0 ? nextPlayers[bowlerIndex] : undefined;

    return {
      ...nextMatch,
      current_batsman_stats: formatBatterStats(striker),
      non_striker_stats: formatBatterStats(nonStriker),
      partnership: formatPartnership(striker, nonStriker),
      current_bowler_stats: formatBowlerStats(bowler),
    };
  };

  const persistPlayers = async (
    nextPlayers: PlayerScore[],
  ): Promise<boolean> => {
    if (!supabase) return false;
    const rowsToSave = nextPlayers.filter((player) => player.id);
    if (rowsToSave.length === 0) return true;

    for (const player of rowsToSave) {
      const { id, ...payload } = player;
      const { error } = await supabase
        .from("player_scores")
        .update(payload)
        .eq("id", id as number);

      if (error) {
        alert(`Error updating player stats: ${error.message}`);
        return false;
      }
    }

    return true;
  };

  const getRosterForTeam = (teamName: string): TeamPlayer[] =>
    teamPlayers.filter(
      (player) => normalizeName(player.team_name) === normalizeName(teamName),
    );

  const getTeamOptions = (): string[] =>
    [match.team_a_name, match.team_b_name]
      .map((team) => team.trim())
      .filter(Boolean);

  const ensurePlayerRowsForRoster = async (
    existingPlayers: PlayerScore[],
    roster: TeamPlayer[],
  ): Promise<PlayerScore[]> => {
    if (!supabase || roster.length === 0) return existingPlayers;

    const playerKey = (teamName: string, playerName: string) =>
      `${normalizeName(teamName)}::${normalizeName(playerName)}`;
    const existingSet = new Set(
      existingPlayers.map((row) => playerKey(row.team_name, row.player_name)),
    );

    const missing = roster.filter(
      (player) =>
        !existingSet.has(playerKey(player.team_name, player.player_name)),
    );
    if (missing.length === 0) return existingPlayers;

    const insertPayload = missing.map((player) => ({
      team_name: player.team_name,
      player_name: player.player_name,
    }));
    const { data, error } = await supabase
      .from("player_scores")
      .insert(insertPayload)
      .select("*");

    if (error) {
      alert(`Error syncing roster with player scores: ${error.message}`);
      return existingPlayers;
    }

    return [
      ...existingPlayers,
      ...(((data as PlayerScore[]) || []).map((row) => ({
        ...row,
      })) as PlayerScore[]),
    ];
  };

  const addTeamPlayer = async () => {
    if (!supabase) return;
    if (!newTeamPlayer.team_name.trim() || !newTeamPlayer.player_name.trim()) {
      alert("Select a team and enter a player name.");
      return;
    }

    const payload = {
      team_name: newTeamPlayer.team_name.trim(),
      player_name: newTeamPlayer.player_name.trim(),
    };

    const { data, error } = await supabase
      .from("team_players")
      .insert(payload)
      .select("*")
      .single();

    if (error) {
      alert(`Error adding team player: ${error.message}`);
      return;
    }

    const nextRoster = [...teamPlayers, data as TeamPlayer].sort(
      (a, b) =>
        a.team_name.localeCompare(b.team_name) ||
        a.player_name.localeCompare(b.player_name),
    );
    setTeamPlayers(nextRoster);
    setNewTeamPlayer({
      team_name: payload.team_name,
      player_name: "",
    });

    const syncedPlayers = await ensurePlayerRowsForRoster(players, nextRoster);
    setPlayers(syncedPlayers);
  };

  const removeTeamPlayer = async (id?: number) => {
    if (!supabase || !id) return;
    const { error } = await supabase.from("team_players").delete().eq("id", id);
    if (error) {
      alert(`Error removing team player: ${error.message}`);
      return;
    }

    setTeamPlayers((prev) => prev.filter((row) => row.id !== id));
  };

  const pushRecentBall = (prev: string, event: string): string => {
    const history = prev.trim() ? prev.trim().split(/\s+/) : [];
    return [...history, event].join(" ");
  };

  const isLegalDeliveryToken = (token: string): boolean => {
    const value = token.trim().toUpperCase();
    if (!value || value === "|") return false;
    return !value.startsWith("WD") && !value.startsWith("NB");
  };

  const getCurrentOverLegalBalls = (recentBalls: string): number => {
    const history = recentBalls.trim() ? recentBalls.trim().split(/\s+/) : [];
    const lastOverBoundary = history.lastIndexOf("|");
    const currentOverBalls =
      lastOverBoundary >= 0 ? history.slice(lastOverBoundary + 1) : history;
    return currentOverBalls.filter(isLegalDeliveryToken).length;
  };

  const buildDeliveryEvent = (
    runs: number,
    extra: ExtraType,
    wicketType?: WicketType,
  ) => {
    const wicketMap: Record<WicketType, string> = {
      bowled: "B",
      caught: "C",
      lbw: "LBW",
      run_out: "RO",
      stumped: "ST",
      hit_wicket: "HW",
    };

    let event = ".";

    if (extra === "wd") event = runs > 0 ? `WD+${runs}` : "WD";
    else if (extra === "nb") event = runs > 0 ? `NB+${runs}` : "NB";
    else if (extra === "bye") event = runs > 0 ? `B${runs}` : "B";
    else if (extra === "legbye") event = runs > 0 ? `LB${runs}` : "LB";
    else event = runs === 0 ? "." : String(runs);

    if (!wicketType) return event;
    return `${event}/W-${wicketMap[wicketType]}`;
  };

  const applyDelivery = async (withWicket: boolean) => {
    if (recordingDelivery) return;
    if (match.match_status !== "live") {
      alert("Start the match before recording deliveries.");
      return;
    }

    const legalDelivery = selectedExtra !== "wd" && selectedExtra !== "nb";
    const baseRuns = selectedExtra === "wd" || selectedExtra === "nb" ? 1 : 0;
    const runIncrement = baseRuns + selectedRuns;
    const ballEvent = buildDeliveryEvent(
      selectedRuns,
      selectedExtra,
      withWicket ? selectedWicket : undefined,
    );

    const nextPlayers = players.map((player) => ({ ...player }));
    const strikerIndex = findPlayerIndex(
      nextPlayers,
      match.current_batsman,
      match.batting_team,
    );
    const bowlerIndex = findPlayerIndex(
      nextPlayers,
      match.current_bowler,
      getBowlingTeam(match),
    );

    if (strikerIndex < 0 || bowlerIndex < 0) {
      alert(
        "Select striker and bowler from team player lists, and ensure they exist in the Player Score table.",
      );
      return;
    }

    if (strikerIndex >= 0) {
      const striker = { ...nextPlayers[strikerIndex] };
      const batterRuns =
        selectedExtra === "none" || selectedExtra === "nb" ? selectedRuns : 0;
      const facedBallIncrement = legalDelivery ? 1 : 0;

      striker.runs = Number(striker.runs) + batterRuns;
      striker.balls = Number(striker.balls) + facedBallIncrement;

      if (selectedExtra === "none" || selectedExtra === "nb") {
        if (selectedRuns === 4) striker.fours = Number(striker.fours) + 1;
        if (selectedRuns === 6) striker.sixes = Number(striker.sixes) + 1;
      }

      striker.strike_rate =
        striker.balls > 0
          ? roundTo((Number(striker.runs) / Number(striker.balls)) * 100)
          : 0;

      nextPlayers[strikerIndex] = striker;
    }

    if (bowlerIndex >= 0) {
      const bowler = { ...nextPlayers[bowlerIndex] };
      const currentBowlerBalls = oversToBalls(Number(bowler.overs) || 0);
      const nextBowlerBalls = currentBowlerBalls + (legalDelivery ? 1 : 0);
      const existingConceded = toBowlerRunsConceded(bowler);
      const runConcededIncrement =
        selectedExtra === "bye" || selectedExtra === "legbye"
          ? 0
          : runIncrement;
      const nextConceded = existingConceded + runConcededIncrement;
      const wicketCredit = withWicket && selectedWicket !== "run_out" ? 1 : 0;

      bowler.overs = legalDelivery
        ? incrementOverBall(Number(bowler.overs) || 0)
        : Number(bowler.overs) || 0;
      bowler.wickets = Number(bowler.wickets) + wicketCredit;
      bowler.economy =
        nextBowlerBalls > 0 ? roundTo(nextConceded / (nextBowlerBalls / 6)) : 0;

      nextPlayers[bowlerIndex] = bowler;
    }

    const nextMatch: MatchState = {
      ...match,
      runs: Number(match.runs) + runIncrement,
      wickets: Number(match.wickets) + (withWicket ? 1 : 0),
      overs: legalDelivery
        ? incrementOverBall(Number(match.overs) || 0)
        : Number(match.overs) || 0,
      recent_balls: pushRecentBall(match.recent_balls, ballEvent),
    };
    const nextDerivedMatch = applyDerivedMatchFields(
      withSyncedTeamInnings(nextMatch),
      nextPlayers,
    );

    setRecordingDelivery(true);
    const playersSaved = await persistPlayers(nextPlayers);
    const saved = playersSaved ? await persistMatch(nextDerivedMatch) : false;
    setRecordingDelivery(false);

    if (saved) {
      setPlayers(nextPlayers);
      setSelectedRuns(0);
      setSelectedExtra("none");
      setDeliveryComment("");
    }
  };

  const savePlayer = async (player: PlayerScore) => {
    if (!supabase) return;
    if (!player.player_name || !player.team_name) {
      alert("Team name and player name are required.");
      return;
    }

    let nextPlayers = players;

    if (player.id) {
      const { id, ...payload } = player; // ← add this destructure
      const { error } = await supabase
        .from("player_scores")
        .update(payload) // ← use payload, not player
        .eq("id", id as number);
      if (error) {
        alert(`Error updating player: ${error.message}`);
        return;
      }
    } else {
      const { data, error } = await supabase
        .from("player_scores")
        .insert(player)
        .select("*")
        .single();
      if (error) {
        alert(`Error creating player: ${error.message}`);
        return;
      }
      if (data) {
        nextPlayers = players.map((p) =>
          p === player ? (data as PlayerScore) : p,
        );
        setPlayers(nextPlayers);
      }
    }

    const derived = applyDerivedMatchFields(
      withSyncedTeamInnings(match),
      nextPlayers,
    );
    await persistMatch(derived);
  };

  const deletePlayer = async (id?: number) => {
    if (!supabase || !id) return;
    const { error } = await supabase
      .from("player_scores")
      .delete()
      .eq("id", id);
    if (!error) setPlayers((prev) => prev.filter((p) => p.id !== id));
  };

  const inputStyles = {
    backgroundColor: "var(--input)",
    color: "var(--silver)",
    border: "2px solid var(--border)",
    borderRadius: "0.75rem",
    padding: "0.75rem",
    width: "100%",
  };

  const labelStyles = {
    color: "var(--silver)",
    fontWeight: "700",
    fontSize: "0.75rem",
    textTransform: "uppercase" as const,
    letterSpacing: "0.1em",
    marginBottom: "0.5rem",
    display: "block",
  };

  const missingMatchColumns = [
    "match_status",
    "inning",
    "team_a_runs",
    "team_a_wickets",
    "team_a_overs",
    "team_b_runs",
    "team_b_wickets",
    "team_b_overs",
    "non_striker",
    "partnership",
    "current_batsman_stats",
    "non_striker_stats",
    "current_bowler_stats",
  ].filter((column) => !updatableMatchKeys.includes(column));

  const formatLabel = (key: MatchFieldKey) =>
    key.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());

  const handleMatchPlayerSelect = (
    key: "current_batsman" | "non_striker" | "current_bowler",
    value: string,
  ) => {
    setMatch((prev) =>
      applyDerivedMatchFields(
        {
          ...prev,
          [key]: value,
        },
        players,
      ),
    );
  };

  const handleBattingTeamSelect = (value: string) => {
    setMatch((prev) => {
      const syncedPrev = withSyncedTeamInnings(prev);
      const innings = getTeamInnings(syncedPrev, value);
      return applyDerivedMatchFields(
        {
          ...syncedPrev,
          batting_team: value,
          runs: innings.runs,
          wickets: innings.wickets,
          overs: innings.overs,
          current_batsman: "",
          non_striker: "",
          current_bowler: "",
        },
        players,
      );
    });
  };

  const handleStatusSelect = (value: string) => {
    setMatch((prev) => ({ ...prev, match_status: value }));
  };

  const renderMatchField = (key: MatchFieldKey) => {
    const value = String(match[key] ?? "");
    const isLongText = key === "match_description";
    const isScoreField =
      key === "runs" ||
      key === "wickets" ||
      key === "overs" ||
      key === "recent_balls" ||
      key === "team_a_runs" ||
      key === "team_a_wickets" ||
      key === "team_a_overs" ||
      key === "team_b_runs" ||
      key === "team_b_wickets" ||
      key === "team_b_overs" ||
      key === "partnership" ||
      key === "current_batsman_stats" ||
      key === "non_striker_stats" ||
      key === "current_bowler_stats";
    const battingRoster = getRosterForTeam(match.batting_team);
    const bowlingRoster = getRosterForTeam(getBowlingTeam(match));
    const isBatterSelect = key === "current_batsman" || key === "non_striker";
    const isBowlerSelect = key === "current_bowler";
    const isBattingTeamSelect = key === "batting_team";
    const isStatusSelect = key === "match_status";
    const selectOptions = isBatterSelect
      ? battingRoster
      : isBowlerSelect
        ? bowlingRoster
        : [];

    return (
      <div key={key} className={isLongText ? "md:col-span-2" : ""}>
        <label style={labelStyles}>{formatLabel(key)}</label>
        {isStatusSelect ? (
          <select
            value={value}
            onChange={(e) => handleStatusSelect(e.target.value)}
            className="focus:outline-none transition-all"
            style={inputStyles}
          >
            <option value="scheduled">Scheduled</option>
            <option value="live">Live</option>
            <option value="completed">Completed</option>
          </select>
        ) : isBattingTeamSelect ? (
          <select
            value={value}
            onChange={(e) => handleBattingTeamSelect(e.target.value)}
            className="focus:outline-none transition-all"
            style={inputStyles}
          >
            <option value="">Select Team</option>
            {getTeamOptions().map((teamName) => (
              <option key={teamName} value={teamName}>
                {teamName}
              </option>
            ))}
          </select>
        ) : isBatterSelect || isBowlerSelect ? (
          <select
            value={value}
            onChange={(e) =>
              handleMatchPlayerSelect(
                key as "current_batsman" | "non_striker" | "current_bowler",
                e.target.value,
              )
            }
            className="focus:outline-none transition-all"
            style={inputStyles}
          >
            <option value="">Select Player</option>
            {selectOptions.map((player) => (
              <option
                key={`${player.team_name}-${player.player_name}-${player.id}`}
                value={player.player_name}
              >
                {player.player_name}
              </option>
            ))}
          </select>
        ) : isLongText ? (
          <textarea
            name={key}
            value={value}
            onChange={handleMatchChange}
            className="focus:outline-none transition-all"
            style={{ ...inputStyles, minHeight: "110px" }}
          />
        ) : (
          <input
            name={key}
            type="text"
            value={value}
            onChange={handleMatchChange}
            className="focus:outline-none transition-all"
            style={{
              ...inputStyles,
              backgroundColor: isScoreField
                ? inputStyles.backgroundColor
                : inputStyles.backgroundColor,
              cursor: isScoreField ? "text" : "text",
            }}
          />
        )}
      </div>
    );
  };

  return (
    <>
      <div className="min-h-screen py-10 px-4 mt-4">
        <div className="mx-auto w-full max-w-6xl space-y-8">
          <h1
            className="text-5xl font-black mb-2 neon-text text-center"
            style={{ color: "var(--primary)" }}
          >
            <i className="fas fa-baseball"></i> ADMIN PANEL
          </h1>

          <div
            className="neon-card p-8"
            style={{ backgroundColor: "rgba(255, 255, 255, 0.9)" }}
          >
            <h2
              className="mb-6 text-2xl font-black"
              style={{ color: "var(--primary)" }}
            >
              Match + Timeline Details
            </h2>
            {missingMatchColumns.length > 0 && (
              <p
                className="mb-4 text-sm font-semibold"
                style={{ color: "#b00020" }}
              >
                DB schema is missing columns: {missingMatchColumns.join(", ")}.
                Run the `match_state` migration before editing these fields.
              </p>
            )}

            <div className="space-y-6">
              <section
                className="rounded-2xl border border-[color:var(--border)] p-5 md:p-6"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(250,246,240,0.95) 100%)",
                }}
              >
                <h3
                  className="text-lg font-black uppercase tracking-wider mb-4"
                  style={{ color: "var(--primary)" }}
                >
                  Record Delivery
                </h3>

                <p
                  className="text-xs font-bold uppercase tracking-widest mb-2"
                  style={{ color: "var(--silver)" }}
                >
                  Runs
                </p>
                <div className="flex flex-wrap gap-3 mb-5">
                  {[0, 1, 2, 3, 4, 6].map((run) => (
                    <button
                      key={run}
                      type="button"
                      disabled={recordingDelivery}
                      onClick={() => setSelectedRuns(run)}
                      className="min-w-14 px-5 py-3 rounded-xl border font-black text-lg transition-all"
                      style={{
                        borderColor:
                          selectedRuns === run
                            ? "var(--primary)"
                            : "var(--border)",
                        color:
                          selectedRuns === run
                            ? "var(--primary)"
                            : "var(--silver)",
                        backgroundColor:
                          selectedRuns === run
                            ? "rgba(128, 0, 32, 0.08)"
                            : "rgba(255, 255, 255, 0.75)",
                        opacity: recordingDelivery ? 0.7 : 1,
                        cursor: recordingDelivery ? "not-allowed" : "pointer",
                      }}
                    >
                      {run === 0 ? "Dot" : run}
                    </button>
                  ))}
                </div>

                <p
                  className="text-xs font-bold uppercase tracking-widest mb-2"
                  style={{ color: "var(--silver)" }}
                >
                  Extras
                </p>
                <div className="flex flex-wrap gap-3 mb-5">
                  {[
                    { key: "none", label: "None" },
                    { key: "wd", label: "WD Wide" },
                    { key: "nb", label: "NB No Ball" },
                    { key: "bye", label: "Bye" },
                    { key: "legbye", label: "Leg Bye" },
                  ].map((extra) => (
                    <button
                      key={extra.key}
                      type="button"
                      disabled={recordingDelivery}
                      onClick={() => setSelectedExtra(extra.key as ExtraType)}
                      className="px-4 py-3 rounded-xl border font-bold text-sm transition-all"
                      style={{
                        borderColor:
                          selectedExtra === extra.key
                            ? "var(--primary)"
                            : "var(--border)",
                        color:
                          selectedExtra === extra.key
                            ? "var(--primary)"
                            : "var(--silver)",
                        backgroundColor:
                          selectedExtra === extra.key
                            ? "rgba(128, 0, 32, 0.08)"
                            : "rgba(255, 255, 255, 0.75)",
                        opacity: recordingDelivery ? 0.7 : 1,
                        cursor: recordingDelivery ? "not-allowed" : "pointer",
                      }}
                    >
                      {extra.label}
                    </button>
                  ))}
                </div>

                <p
                  className="text-xs font-bold uppercase tracking-widest mb-2"
                  style={{ color: "var(--silver)" }}
                >
                  Wicket Type
                </p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {[
                    { value: "bowled", label: "Bowled" },
                    { value: "caught", label: "Caught" },
                    { value: "lbw", label: "LBW" },
                    { value: "run_out", label: "Run Out" },
                    { value: "stumped", label: "Stumped" },
                    { value: "hit_wicket", label: "Hit Wicket" },
                  ].map((wicket) => (
                    <button
                      key={wicket.value}
                      type="button"
                      disabled={recordingDelivery}
                      onClick={() =>
                        setSelectedWicket(wicket.value as WicketType)
                      }
                      className="px-3 py-2 rounded-lg border text-sm font-semibold transition-all"
                      style={{
                        borderColor:
                          selectedWicket === wicket.value
                            ? "var(--primary)"
                            : "var(--border)",
                        color:
                          selectedWicket === wicket.value
                            ? "var(--primary)"
                            : "var(--silver)",
                        backgroundColor:
                          selectedWicket === wicket.value
                            ? "rgba(128, 0, 32, 0.08)"
                            : "rgba(255, 255, 255, 0.75)",
                        opacity: recordingDelivery ? 0.7 : 1,
                        cursor: recordingDelivery ? "not-allowed" : "pointer",
                      }}
                    >
                      {wicket.label}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <button
                    type="button"
                    disabled={recordingDelivery}
                    onClick={() => applyDelivery(false)}
                    className="cta-btn secondary"
                    style={{
                      width: "100%",
                      opacity: recordingDelivery ? 0.7 : 1,
                      cursor: recordingDelivery ? "not-allowed" : "pointer",
                    }}
                  >
                    {recordingDelivery ? "Recording..." : "Record Ball"}
                  </button>
                  <button
                    type="button"
                    disabled={recordingDelivery}
                    onClick={() => applyDelivery(true)}
                    className="cta-btn"
                    style={{
                      width: "100%",
                      opacity: recordingDelivery ? 0.7 : 1,
                      cursor: recordingDelivery ? "not-allowed" : "pointer",
                    }}
                  >
                    Record Wicket
                  </button>
                  <button
                    type="button"
                    disabled={recordingDelivery}
                    onClick={() => void handleEndOver()}
                    className="cta-btn secondary"
                    style={{
                      width: "100%",
                      opacity: recordingDelivery ? 0.7 : 1,
                      cursor: recordingDelivery ? "not-allowed" : "pointer",
                    }}
                  >
                    End Over (Swap Batters)
                  </button>
                </div>

                <div className="mt-4">
                  <label style={labelStyles}>Commentary (optional)</label>
                  <input
                    type="text"
                    disabled={recordingDelivery}
                    value={deliveryComment}
                    onChange={(e) => setDeliveryComment(e.target.value)}
                    placeholder="e.g. Edge past second slip for a boundary"
                    className="focus:outline-none transition-all"
                    style={{
                      ...inputStyles,
                      backgroundColor: "var(--input)",
                      color: "var(--silver)",
                    }}
                  />
                </div>
              </section>

              <section className="rounded-xl border border-[color:var(--border)] p-5 bg-white/60">
                <h3
                  className="text-lg font-black mb-4"
                  style={{ color: "var(--primary)" }}
                >
                  Teams & Live Score
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {(
                    [
                      "match_status",
                      "inning",
                      "team_a_name",
                      "team_b_name",
                      "batting_team",
                      "runs",
                      "wickets",
                      "overs",
                      "recent_balls",
                      "team_a_runs",
                      "team_a_wickets",
                      "team_a_overs",
                      "team_b_runs",
                      "team_b_wickets",
                      "team_b_overs",
                    ] as MatchFieldKey[]
                  ).map((field) => renderMatchField(field))}
                </div>
                <div className="mt-6 flex flex-wrap gap-3">
                  <button
                    onClick={() => void handleMatchStart()}
                    className="cta-btn secondary"
                  >
                    Start Match
                  </button>
                  <button
                    onClick={() => void handleSwapBattingTeam()}
                    className="cta-btn secondary"
                  >
                    Swap Batting Team
                  </button>
                  <button
                    onClick={() => void handleMatchEnd()}
                    className="cta-btn secondary"
                  >
                    End Match
                  </button>
                </div>
              </section>

              <section className="rounded-xl border border-[color:var(--border)] p-5 bg-white/60">
                <h3
                  className="text-lg font-black mb-4"
                  style={{ color: "var(--primary)" }}
                >
                  Batting Pair
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {(
                    [
                      "current_batsman",
                      "non_striker",
                      "current_batsman_stats",
                      "non_striker_stats",
                      "partnership",
                    ] as MatchFieldKey[]
                  ).map((field) => renderMatchField(field))}
                </div>
                <div className="mt-6 flex flex-wrap gap-3">
                  <button
                    onClick={() => void handleSwapStrikers()}
                    className="cta-btn secondary"
                  >
                    Swap Striker / Non-Striker
                  </button>
                </div>
                <button
                  onClick={() => void saveMatch()}
                  className="mt-5 cta-btn secondary"
                >
                  Update Data
                </button>
              </section>

              <section className="rounded-xl border border-[color:var(--border)] p-5 bg-white/60">
                <h3
                  className="text-lg font-black mb-4"
                  style={{ color: "var(--primary)" }}
                >
                  Bowler
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {(
                    [
                      "current_bowler",
                      "current_bowler_stats",
                    ] as MatchFieldKey[]
                  ).map((field) => renderMatchField(field))}
                </div>
                <button
                  onClick={() => void saveMatch()}
                  className="mt-5 cta-btn secondary"
                >
                  Update Data
                </button>
              </section>

              <section className="rounded-xl border border-[color:var(--border)] p-5 bg-white/60">
                <h3
                  className="text-lg font-black mb-4"
                  style={{ color: "var(--primary)" }}
                >
                  Series & Match Intro
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {(
                    [
                      "series_name",
                      "match_logo_url",
                      "match_description",
                    ] as MatchFieldKey[]
                  ).map((field) => renderMatchField(field))}
                </div>
                <button
                  onClick={() => void saveMatch()}
                  className="mt-5 cta-btn secondary"
                >
                  Update Data
                </button>
              </section>

              <section className="rounded-xl border border-[color:var(--border)] p-5 bg-white/60">
                <h3
                  className="text-lg font-black mb-4"
                  style={{ color: "var(--primary)" }}
                >
                  Upcoming Matches
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {[1, 2, 3, 4].map((num) => (
                    <div
                      key={num}
                      className="rounded-xl border border-[color:var(--border)] p-4 bg-white/70"
                    >
                      <p
                        className="mb-3 text-sm font-bold uppercase tracking-widest"
                        style={{ color: "var(--primary)" }}
                      >
                        Match {num}
                      </p>
                      <div className="grid grid-cols-1 gap-4">
                        {renderMatchField(`match_${num}_date` as MatchFieldKey)}
                        {renderMatchField(`match_${num}_time` as MatchFieldKey)}
                        {renderMatchField(
                          `match_${num}_venue` as MatchFieldKey,
                        )}
                        {renderMatchField(
                          `match_${num}_format` as MatchFieldKey,
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => void saveMatch()}
                  className="mt-5 cta-btn secondary"
                >
                  Update Data
                </button>
              </section>
            </div>

            <button onClick={saveMatch} className="mt-6 cta-btn">
              Save Match Info
            </button>
          </div>

          <div
            className="neon-card p-8"
            style={{ backgroundColor: "rgba(255, 255, 255, 0.9)" }}
          >
            <h2
              className="text-2xl font-black mb-5"
              style={{ color: "var(--primary)" }}
            >
              Team Player Lists
            </h2>
            {missingRosterTable && (
              <p
                className="mb-4 text-sm font-semibold"
                style={{ color: "#b00020" }}
              >
                DB schema is missing `team_players`. Run the latest
                `supabase/schema_update.sql`.
              </p>
            )}

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 mb-6">
              {getTeamOptions().map((teamName) => (
                <section
                  key={teamName}
                  className="rounded-xl border border-[color:var(--border)] p-4 bg-white/70"
                >
                  <h3
                    className="text-lg font-black mb-3"
                    style={{ color: "var(--primary)" }}
                  >
                    {teamName}
                  </h3>
                  <div className="space-y-2">
                    {getRosterForTeam(teamName).map((row) => (
                      <div
                        key={`${row.team_name}-${row.player_name}-${row.id}`}
                        className="flex items-center justify-between rounded-lg border border-[color:var(--border)] px-3 py-2"
                      >
                        <span
                          className="font-semibold"
                          style={{ color: "var(--silver)" }}
                        >
                          {row.player_name}
                        </span>
                        <button
                          onClick={() => void removeTeamPlayer(row.id)}
                          className="cta-btn secondary"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                    {getRosterForTeam(teamName).length === 0 && (
                      <p className="text-sm" style={{ color: "var(--muted)" }}>
                        No players added for this team.
                      </p>
                    )}
                  </div>
                </section>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <select
                style={inputStyles}
                value={newTeamPlayer.team_name}
                onChange={(e) =>
                  setNewTeamPlayer((prev) => ({
                    ...prev,
                    team_name: e.target.value,
                  }))
                }
              >
                <option value="">Select Team</option>
                {getTeamOptions().map((teamName) => (
                  <option key={teamName} value={teamName}>
                    {teamName}
                  </option>
                ))}
              </select>
              <input
                style={inputStyles}
                value={newTeamPlayer.player_name}
                onChange={(e) =>
                  setNewTeamPlayer((prev) => ({
                    ...prev,
                    player_name: e.target.value,
                  }))
                }
                placeholder="Player name"
              />
              <button
                onClick={() => void addTeamPlayer()}
                className="cta-btn secondary"
              >
                Add To Team List
              </button>
            </div>
          </div>

          <div
            className="neon-card p-8"
            style={{ backgroundColor: "rgba(255, 255, 255, 0.9)" }}
          >
            <div className="mb-5 flex items-center justify-between">
              <h2
                className="text-2xl font-black"
                style={{ color: "var(--primary)" }}
              >
                Player Score Tables
              </h2>
              <button
                className="cta-btn secondary"
                onClick={() => {
                  const defaultTeam = getTeamOptions()[0] || "";
                  const defaultPlayer =
                    getRosterForTeam(defaultTeam)[0]?.player_name || "";
                  setPlayers((prev) => [
                    ...prev,
                    {
                      ...newPlayerRow,
                      team_name: defaultTeam,
                      player_name: defaultPlayer,
                    },
                  ]);
                }}
              >
                Add Player
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-[1200px] w-full border border-[color:var(--border)] rounded-xl overflow-hidden">
                <thead className="bg-[color:var(--primary)] text-white">
                  <tr>
                    {[
                      "Team",
                      "Player",
                      "Runs",
                      "Balls",
                      "4s",
                      "6s",
                      "Strike Rate",
                      "Wickets",
                      "Overs",
                      "Economy",
                      "Actions",
                    ].map((h) => (
                      <th key={h} className="px-3 py-2 text-left">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {players.map((player, index) => (
                    <tr
                      key={player.id ?? `new-${index}`}
                      className="border-t border-[color:var(--border)] bg-white/70"
                    >
                      <td className="p-2">
                        <select
                          style={inputStyles}
                          value={player.team_name}
                          onChange={(e) => {
                            const teamName = e.target.value;
                            const teamRoster = getRosterForTeam(teamName);
                            const firstPlayer =
                              teamRoster[0]?.player_name || "";
                            handlePlayerChange(index, "team_name", teamName);
                            handlePlayerChange(
                              index,
                              "player_name",
                              firstPlayer,
                            );
                          }}
                        >
                          <option value="">Select Team</option>
                          {getTeamOptions().map((teamName) => (
                            <option key={teamName} value={teamName}>
                              {teamName}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="p-2">
                        <select
                          style={inputStyles}
                          value={player.player_name}
                          onChange={(e) =>
                            handlePlayerChange(
                              index,
                              "player_name",
                              e.target.value,
                            )
                          }
                        >
                          <option value="">Select Player</option>
                          {getRosterForTeam(player.team_name).map(
                            (rosterPlayer) => (
                              <option
                                key={`${rosterPlayer.team_name}-${rosterPlayer.player_name}-${rosterPlayer.id}`}
                                value={rosterPlayer.player_name}
                              >
                                {rosterPlayer.player_name}
                              </option>
                            ),
                          )}
                        </select>
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          style={inputStyles}
                          value={player.runs}
                          onChange={(e) =>
                            handlePlayerChange(index, "runs", e.target.value)
                          }
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          style={inputStyles}
                          value={player.balls}
                          onChange={(e) =>
                            handlePlayerChange(index, "balls", e.target.value)
                          }
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          style={inputStyles}
                          value={player.fours}
                          onChange={(e) =>
                            handlePlayerChange(index, "fours", e.target.value)
                          }
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          style={inputStyles}
                          value={player.sixes}
                          onChange={(e) =>
                            handlePlayerChange(index, "sixes", e.target.value)
                          }
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          step="0.01"
                          style={inputStyles}
                          value={player.strike_rate}
                          onChange={(e) =>
                            handlePlayerChange(
                              index,
                              "strike_rate",
                              e.target.value,
                            )
                          }
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          style={inputStyles}
                          value={player.wickets}
                          onChange={(e) =>
                            handlePlayerChange(index, "wickets", e.target.value)
                          }
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          step="0.1"
                          style={inputStyles}
                          value={player.overs}
                          onChange={(e) =>
                            handlePlayerChange(index, "overs", e.target.value)
                          }
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          step="0.01"
                          style={inputStyles}
                          value={player.economy}
                          onChange={(e) =>
                            handlePlayerChange(index, "economy", e.target.value)
                          }
                        />
                      </td>
                      <td className="p-2 space-x-2">
                        <button
                          onClick={() => void savePlayer(player)}
                          className="cta-btn secondary"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => void deletePlayer(player.id)}
                          className="cta-btn secondary"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
