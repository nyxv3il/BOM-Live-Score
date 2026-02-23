"use client";

import { ChangeEvent, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";

interface MatchState {
  id?: number;
  team_a_name: string;
  team_b_name: string;
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

const defaultMatch: MatchState = {
  team_a_name: "",
  team_b_name: "",
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
  const [updatableMatchKeys, setUpdatableMatchKeys] = useState<string[]>([]);
  const [selectedRuns, setSelectedRuns] = useState(0);
  const [selectedExtra, setSelectedExtra] = useState<ExtraType>("none");
  const [selectedWicket, setSelectedWicket] = useState<WicketType>("bowled");
  const [deliveryComment, setDeliveryComment] = useState("");
  const [recordingDelivery, setRecordingDelivery] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      if (!supabase) return;

      const [{ data: matchData }, { data: playersData }] = await Promise.all([
        supabase.from("match_state").select("*").eq("id", 1).single(),
        supabase
          .from("player_scores")
          .select("*")
          .order("team_name", { ascending: true })
          .order("player_name", { ascending: true }),
      ]);

      if (matchData) {
        setMatch((prev) => ({
          ...prev,
          ...(matchData as Partial<MatchState>),
        }));
        setUpdatableMatchKeys(Object.keys(matchData));
      }
      if (playersData) setPlayers(playersData as PlayerScore[]);
    };

    if (!Cookies.get("admin_session")) {
      router.push("/admin/login");
    } else {
      void fetchData();
    }
  }, [router]);

  const handleMatchChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    const numeric = ["runs", "wickets", "overs"];
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
    await persistMatch(match, "Match info updated.");
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
    const swappedMatch = swapStrikerFields(match);
    await persistMatch(swappedMatch, "Striker and non-striker swapped.");
  };

  const handleEndOver = async () => {
    const swappedMatch = swapStrikerFields(match);
    const currentOvers = Number(swappedMatch.overs);
    const nextOver = Number.isFinite(currentOvers)
      ? Math.floor(currentOvers) + 1
      : 1;

    await persistMatch(
      { ...swappedMatch, overs: nextOver, recent_balls: "" },
      "Over ended and batters swapped.",
    );
  };

  const oversToBalls = (oversValue: number): number => {
    const wholeOvers = Math.floor(oversValue);
    const ballPart = Math.round((oversValue - wholeOvers) * 10);
    return wholeOvers * 6 + Math.min(Math.max(ballPart, 0), 5);
  };

  const ballsToOvers = (totalBalls: number): number => {
    const wholeOvers = Math.floor(totalBalls / 6);
    const ballPart = totalBalls % 6;
    return Number(`${wholeOvers}.${ballPart}`);
  };

  const pushRecentBall = (prev: string, event: string): string => {
    const history = prev.trim() ? prev.trim().split(/\s+/) : [];
    return [...history, event].join(" ");
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

    const legalDelivery = selectedExtra !== "wd" && selectedExtra !== "nb";
    const baseRuns = selectedExtra === "wd" || selectedExtra === "nb" ? 1 : 0;
    const runIncrement = baseRuns + selectedRuns;
    const currentBalls = oversToBalls(Number(match.overs) || 0);
    const nextBalls = legalDelivery ? currentBalls + 1 : currentBalls;
    const ballEvent = buildDeliveryEvent(
      selectedRuns,
      selectedExtra,
      withWicket ? selectedWicket : undefined,
    );

    const nextMatch: MatchState = {
      ...match,
      runs: Number(match.runs) + runIncrement,
      wickets: Number(match.wickets) + (withWicket ? 1 : 0),
      overs: ballsToOvers(nextBalls),
      recent_balls:
        legalDelivery && nextBalls % 6 === 0
          ? ""
          : pushRecentBall(match.recent_balls, ballEvent),
    };

    setRecordingDelivery(true);
    const saved = await persistMatch(nextMatch);
    setRecordingDelivery(false);

    if (saved) {
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

    if (player.id) {
      await supabase.from("player_scores").update(player).eq("id", player.id);
    } else {
      const { data } = await supabase
        .from("player_scores")
        .insert(player)
        .select("*")
        .single();
      if (data) {
        setPlayers((prev) =>
          prev.map((p) => (p === player ? (data as PlayerScore) : p)),
        );
      }
    }
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
    "non_striker",
    "partnership",
    "current_batsman_stats",
    "non_striker_stats",
    "current_bowler_stats",
  ].filter((column) => !updatableMatchKeys.includes(column));

  const formatLabel = (key: MatchFieldKey) =>
    key
      .replace(/_/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());

  const renderMatchField = (key: MatchFieldKey) => {
    const value = String(match[key] ?? "");
    const isLongText = key === "match_description";
    const isScoreField =
      key === "runs" ||
      key === "wickets" ||
      key === "overs" ||
      key === "recent_balls";

    return (
      <div key={key} className={isLongText ? "md:col-span-2" : ""}>
        <label style={labelStyles}>{formatLabel(key)}</label>
        {isLongText ? (
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
            readOnly={isScoreField}
            className="focus:outline-none transition-all"
            style={{
              ...inputStyles,
              backgroundColor: isScoreField ? "rgba(0, 0, 0, 0.03)" : inputStyles.backgroundColor,
              cursor: isScoreField ? "not-allowed" : "text",
            }}
          />
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen py-10 px-4">
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
                      borderColor: selectedRuns === run ? "var(--primary)" : "var(--border)",
                      color: selectedRuns === run ? "var(--primary)" : "var(--silver)",
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
                        selectedExtra === extra.key ? "var(--primary)" : "var(--border)",
                      color: selectedExtra === extra.key ? "var(--primary)" : "var(--silver)",
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
                    onClick={() => setSelectedWicket(wicket.value as WicketType)}
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
              </div>

              <div className="mt-4">
                <label style={labelStyles}>
                  Commentary (optional)
                </label>
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
              <h3 className="text-lg font-black mb-4" style={{ color: "var(--primary)" }}>
                Teams & Live Score
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {([
                  "team_a_name",
                  "team_b_name",
                  "batting_team",
                  "runs",
                  "wickets",
                  "overs",
                  "recent_balls",
                ] as MatchFieldKey[]).map((field) => renderMatchField(field))}
              </div>
            </section>

            <section className="rounded-xl border border-[color:var(--border)] p-5 bg-white/60">
              <h3 className="text-lg font-black mb-4" style={{ color: "var(--primary)" }}>
                Batting Pair
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {([
                  "current_batsman",
                  "non_striker",
                  "current_batsman_stats",
                  "non_striker_stats",
                  "partnership",
                ] as MatchFieldKey[]).map((field) => renderMatchField(field))}
              </div>
              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  onClick={() => void handleSwapStrikers()}
                  className="cta-btn secondary"
                >
                  Swap Striker / Non-Striker
                </button>
                <button
                  onClick={() => void handleEndOver()}
                  className="cta-btn secondary"
                >
                  End Over (Swap Batters)
                </button>
              </div>
              <button onClick={() => void saveMatch()} className="mt-5 cta-btn secondary">
                Update Data
              </button>
            </section>

            <section className="rounded-xl border border-[color:var(--border)] p-5 bg-white/60">
              <h3 className="text-lg font-black mb-4" style={{ color: "var(--primary)" }}>
                Bowler
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {(["current_bowler", "current_bowler_stats"] as MatchFieldKey[]).map(
                  (field) => renderMatchField(field),
                )}
              </div>
              <button onClick={() => void saveMatch()} className="mt-5 cta-btn secondary">
                Update Data
              </button>
            </section>

            <section className="rounded-xl border border-[color:var(--border)] p-5 bg-white/60">
              <h3 className="text-lg font-black mb-4" style={{ color: "var(--primary)" }}>
                Series & Match Intro
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {([
                  "series_name",
                  "match_logo_url",
                  "match_description",
                ] as MatchFieldKey[]).map((field) => renderMatchField(field))}
              </div>
              <button onClick={() => void saveMatch()} className="mt-5 cta-btn secondary">
                Update Data
              </button>
            </section>

            <section className="rounded-xl border border-[color:var(--border)] p-5 bg-white/60">
              <h3 className="text-lg font-black mb-4" style={{ color: "var(--primary)" }}>
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
                      {renderMatchField(`match_${num}_venue` as MatchFieldKey)}
                      {renderMatchField(`match_${num}_format` as MatchFieldKey)}
                    </div>
                  </div>
                ))}
              </div>
              <button onClick={() => void saveMatch()} className="mt-5 cta-btn secondary">
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
          <div className="mb-5 flex items-center justify-between">
            <h2
              className="text-2xl font-black"
              style={{ color: "var(--primary)" }}
            >
              Player Score Tables
            </h2>
            <button
              className="cta-btn secondary"
              onClick={() =>
                setPlayers((prev) => [...prev, { ...newPlayerRow }])
              }
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
                      <input
                        style={inputStyles}
                        value={player.team_name}
                        onChange={(e) =>
                          handlePlayerChange(index, "team_name", e.target.value)
                        }
                      />
                    </td>
                    <td className="p-2">
                      <input
                        style={inputStyles}
                        value={player.player_name}
                        onChange={(e) =>
                          handlePlayerChange(
                            index,
                            "player_name",
                            e.target.value,
                          )
                        }
                      />
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
  );
}
