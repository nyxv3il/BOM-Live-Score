"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { BallEventRow, BallType, LiveStateRow, MatchRow, PlayerRow } from "@/lib/live-types";

type ConnectionState = "connecting" | "online" | "offline";

function ballClass(ballType: BallType, runs: number) {
  if (ballType === "wicket") return "wicket";
  if (ballType === "wide") return "wide";
  if (ballType === "no_ball") return "no-ball";
  if (ballType === "bye") return "bye";
  if (ballType === "leg_bye") return "leg-bye";
  if (ballType === "penalty") return "penalty";
  if (runs === 0) return "dot";
  if (runs === 4) return "four";
  if (runs === 6) return "six";
  return "runs";
}

function ballLabel(ballType: BallType, runs: number) {
  if (ballType === "wicket") return "W";
  if (ballType === "wide") return "WD";
  if (ballType === "no_ball") return "NB";
  if (ballType === "bye") return "B";
  if (ballType === "leg_bye") return "LB";
  if (ballType === "penalty") return "P";
  return runs === 0 ? "·" : String(runs);
}

function isLegal(ballType: BallType) {
  return ballType !== "wide" && ballType !== "no_ball";
}

const FALLBACK_MATCHES: MatchRow[] = [
  {
    id: "match_1",
    label: "Test Match - Day 1",
    format: "Test",
    team_a_name: "Ananda College",
    team_a_abbr: "AND",
    team_a_emoji: "A",
    team_b_name: "Nalanda College",
    team_b_abbr: "NAL",
    team_b_emoji: "N",
    sort_order: 1,
  },
  {
    id: "match_2",
    label: "Test Match - Day 2",
    format: "Test",
    team_a_name: "Ananda College",
    team_a_abbr: "AND",
    team_a_emoji: "A",
    team_b_name: "Nalanda College",
    team_b_abbr: "NAL",
    team_b_emoji: "N",
    sort_order: 2,
  },
  {
    id: "match_3",
    label: "Test Match - Day 3",
    format: "Test",
    team_a_name: "Ananda College",
    team_a_abbr: "AND",
    team_a_emoji: "A",
    team_b_name: "Nalanda College",
    team_b_abbr: "NAL",
    team_b_emoji: "N",
    sort_order: 3,
  },
  {
    id: "match_4",
    label: "ODA",
    format: "ODA",
    team_a_name: "Ananda College",
    team_a_abbr: "AND",
    team_a_emoji: "A",
    team_b_name: "Nalanda College",
    team_b_abbr: "NAL",
    team_b_emoji: "N",
    sort_order: 4,
  },
];

export default function ScorePage() {
  const [connection, setConnection] = useState<ConnectionState>(supabase ? "connecting" : "offline");
  const [matches, setMatches] = useState<MatchRow[]>(FALLBACK_MATCHES);
  const [players, setPlayers] = useState<PlayerRow[]>([]);
  const [liveState, setLiveState] = useState<LiveStateRow | null>(null);
  const [balls, setBalls] = useState<BallEventRow[]>([]);
  const [activeTab, setActiveTab] = useState<string>(FALLBACK_MATCHES[0].id);
  const liveMatchIdRef = useRef<string | null>(null);

  const activeMatch = useMemo(() => {
    const targetId = activeTab || liveState?.active_match_id;
    return matches.find((match) => match.id === targetId) || matches[0];
  }, [activeTab, liveState?.active_match_id, matches]);

  const playerById = useMemo(() => {
    const byId = new Map<string, PlayerRow>();
    players.forEach((player) => byId.set(player.id, player));
    return byId;
  }, [players]);

  const teamsView = useMemo(() => {
    if (!activeMatch) {
      return {
        battingAbbr: "BAT",
        battingEmoji: "N",
        fieldingAbbr: "BWL",
        fieldingEmoji: "A",
      };
    }

    const battingCode = (liveState?.batting_team_code || activeMatch.team_b_abbr || "").toUpperCase();
    const teamA = activeMatch.team_a_abbr.toUpperCase();
    if (battingCode === teamA) {
      return {
        battingAbbr: activeMatch.team_a_abbr,
        battingEmoji: activeMatch.team_a_emoji,
        fieldingAbbr: activeMatch.team_b_abbr,
        fieldingEmoji: activeMatch.team_b_emoji,
      };
    }

    return {
      battingAbbr: activeMatch.team_b_abbr,
      battingEmoji: activeMatch.team_b_emoji,
      fieldingAbbr: activeMatch.team_a_abbr,
      fieldingEmoji: activeMatch.team_a_emoji,
    };
  }, [activeMatch, liveState?.batting_team_code]);

  useEffect(() => {
    if (!supabase) return;
    const client = supabase;

    const load = async () => {
      const [matchesRes, playersRes, liveRes] = await Promise.all([
        client.from("matches").select("*").order("sort_order", { ascending: true }),
        client.from("players").select("*").eq("is_active", true),
        client.from("live_match_state").select("*").eq("id", 1).maybeSingle(),
      ]);

      if (matchesRes.data?.length) setMatches(matchesRes.data as MatchRow[]);
      if (playersRes.data) setPlayers(playersRes.data as PlayerRow[]);

      if (liveRes.data) {
        const state = liveRes.data as LiveStateRow;
        liveMatchIdRef.current = state.active_match_id;
        setLiveState(state);
        setActiveTab(state.active_match_id || matchesRes.data?.[0]?.id || FALLBACK_MATCHES[0].id);
      }

      setConnection("online");
    };
    void load();

    const stateChannel = client
      .channel("score-live-state")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "live_match_state" },
        (payload) => {
          const state = payload.new as LiveStateRow;
          liveMatchIdRef.current = state.active_match_id;
          setLiveState(state);
          if (state.active_match_id) {
            setActiveTab((prev) => prev || state.active_match_id || "");
          }
        },
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") setConnection("online");
      });

    const ballChannel = client
      .channel("score-balls")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "ball_events" },
        (payload) => {
          const ball = payload.new as BallEventRow;
          if (ball.match_id === liveMatchIdRef.current) {
            setBalls((prev) => [...prev.slice(-119), ball]);
          }
        },
      )
      .subscribe();

    return () => {
      void client.removeChannel(stateChannel);
      void client.removeChannel(ballChannel);
    };
  }, []);

  useEffect(() => {
    if (!supabase || !liveState?.active_match_id) return;
    const client = supabase;

    const loadBalls = async () => {
      const ballsRes = await client
        .from("ball_events")
        .select("*")
        .eq("match_id", liveState.active_match_id)
        .order("id", { ascending: true })
        .limit(120);
      setBalls((ballsRes.data as BallEventRow[]) || []);
    };

    void loadBalls();
  }, [liveState?.active_match_id]);

  const strikerName = liveState?.current_striker_player_id
    ? playerById.get(liveState.current_striker_player_id)?.name || liveState.current_striker_player_id
    : null;
  const nonStrikerName = liveState?.current_non_striker_player_id
    ? playerById.get(liveState.current_non_striker_player_id)?.name || liveState.current_non_striker_player_id
    : null;
  const bowlerName = liveState?.current_bowler_player_id
    ? playerById.get(liveState.current_bowler_player_id)?.name || liveState.current_bowler_player_id
    : null;

  const groupedOvers = useMemo(() => {
    const overs: BallEventRow[][] = [];
    let current: BallEventRow[] = [];
    let legal = 0;

    balls.forEach((ball) => {
      current.push(ball);
      if (isLegal(ball.ball_type)) legal += 1;

      if (legal === 6) {
        overs.push(current);
        current = [];
        legal = 0;
      }
    });

    if (current.length) overs.push(current);
    return overs;
  }, [balls]);

  const chipMode =
    connection === "connecting"
      ? "connecting"
      : liveState?.status === "live"
        ? "live"
        : liveState?.status === "ended"
          ? "ended"
          : "paused";

  const chipText =
    connection === "connecting"
      ? "Connecting"
      : liveState?.status === "live"
        ? "Live"
        : liveState?.status === "ended"
          ? "Final"
          : liveState?.status === "idle"
            ? "No Match"
            : liveState?.status === "paused"
              ? "Paused"
              : "Offline";

  return (
    <main className="score-page app">
      <header className="score-header">
        <div className="logo">
          <div className="logo-wordmark">
            Battle of the <span>Maroons</span>
          </div>
        </div>
        <div className={`chip ${chipMode}`}>
          {chipMode === "live" && <span className="ldot" />}
          <span>{chipText}</span>
        </div>
      </header>

      <section className="match-tabs">
        {matches.map((match) => {
          const isActiveTab = activeTab === match.id;
          const isLiveMatch = liveState?.active_match_id === match.id && liveState.status === "live";

          return (
            <button
              type="button"
              key={match.id}
              id={`tab-${match.id}`}
              className={`tab ${isActiveTab ? "active" : ""}`}
              onClick={() => setActiveTab(match.id)}
            >
              <span className="tab-fmt">{match.format}</span>
              <span className="tab-name">{match.label}</span>
              <span className={`tab-badge ${isLiveMatch ? "live-badge" : "done"}`}>
                {isLiveMatch ? <span className="tdot" /> : null}
                {isLiveMatch ? "Live" : "Done"}
              </span>
            </button>
          );
        })}
      </section>

      <section className="score-content content">
        {!liveState || !liveState.active_match_id || liveState.status === "idle" ? (
          <div className="state-card">
            <div className="state-title">No live match right now</div>
            <div className="state-sub">96th Battle of the Maroons</div>
          </div>
        ) : (
          <>
            <article className="score-card">
              <div className="sc-gold" />
              <div className="sc-label">
                <span className="sc-label-text">{activeMatch?.label || "Live Match"}</span>
                <span className="sc-fmt">{activeMatch?.format || "Match"}</span>
              </div>
              <div className="teams">
                <div className="team">
                  <div className="team-emblem batting">{teamsView.battingEmoji || "N"}</div>
                  <div className="team-abbr">{teamsView.battingAbbr || "BAT"}</div>
                  <div className="team-score">
                    {liveState.current_score}
                    <span className="w">/{liveState.current_wickets}</span>
                  </div>
                </div>
                <div className="vs">VS</div>
                <div className="team">
                  <div className="team-emblem">{teamsView.fieldingEmoji || "A"}</div>
                  <div className="team-abbr">{teamsView.fieldingAbbr || "BWL"}</div>
                  <div className="team-score dim">{liveState.previous_innings_score || "-"}</div>
                </div>
              </div>
              <div className="inning-bar">
                <div className={`inn-pip ${liveState.current_inning === 1 ? "active" : ""}`} />
                <div className={`inn-pip ${liveState.current_inning === 2 ? "active" : ""}`} />
                <div className="inn-lbl">
                  Inning {liveState.current_inning} · {liveState.over_count}.{liveState.ball_in_over}
                </div>
              </div>
            </article>

            <article className="players-card">
              <div className="pc-header">
                <div className="pc-title">At the Crease</div>
              </div>
              {strikerName && (
                <div className="player-row">
                  <div className="player-left">
                    <div className="player-dot striker" />
                    <div className="player-name striker">{strikerName}</div>
                  </div>
                  <div className="role-badge rb-striker">Striker</div>
                </div>
              )}
              {nonStrikerName && (
                <div className="player-row">
                  <div className="player-left">
                    <div className="player-dot non-striker" />
                    <div className="player-name">{nonStrikerName}</div>
                  </div>
                  <div className="role-badge rb-non-striker">Non Striker</div>
                </div>
              )}
              {bowlerName && (
                <div className="player-row">
                  <div className="player-left">
                    <div className="player-dot bowler" />
                    <div className="player-name">{bowlerName}</div>
                  </div>
                  <div className="role-badge rb-bowler">Bowling</div>
                </div>
              )}
            </article>

            {groupedOvers.length > 0 && (
              <article className="ball-card">
                <div className="pc-header">
                  <div className="pc-title">Ball by Ball</div>
                </div>
                <div className="ball-seq">
                  {groupedOvers.map((over, overIndex) => (
                    <div className="over" key={`over-${overIndex}`}>
                      {overIndex > 0 && <div className="over-sep" />}
                      {over.map((ball) => (
                        <span
                          className={`ball ${ballClass(ball.ball_type, ball.runs_scored)}`}
                          key={ball.id}
                        >
                          {ballLabel(ball.ball_type, ball.runs_scored)}
                        </span>
                      ))}
                    </div>
                  ))}
                </div>
              </article>
            )}

            {liveState.status === "paused" && (
              <div className="state-card">
                <div className="state-title">Match is paused</div>
                <div className="state-sub">{liveState.pause_reason || "Weather break"}</div>
              </div>
            )}

            {liveState.status === "ended" && <div className="result-bar">Match Ended · Final Result</div>}
          </>
        )}
      </section>
    </main>
  );
}

