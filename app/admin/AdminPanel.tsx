"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { BallEventRow, BallType, LiveStateRow, MatchRow, PlayerRow } from "@/lib/live-types";

type SectionKey = "scoring" | "match" | "log";
type LogType = "ok" | "error" | "info";

interface LogRow {
  time: string;
  type: LogType;
  msg: string;
}

interface AdminPanelProps {
  initialAuthenticated: boolean;
}

const BALL_TYPES: { key: BallType; label: string; icon: string; className: string }[] = [
  { key: "runs", label: "Runs", icon: "?", className: "type-runs" },
  { key: "wicket", label: "Wicket", icon: "W", className: "type-wicket" },
  { key: "wide", label: "Wide", icon: "WD", className: "type-wide" },
  { key: "no_ball", label: "No Ball", icon: "NB", className: "type-no-ball" },
  { key: "bye", label: "Bye", icon: "B", className: "type-bye" },
  { key: "leg_bye", label: "Leg Bye", icon: "LB", className: "type-leg-bye" },
  { key: "penalty", label: "Penalty", icon: "P", className: "type-penalty" },
];

function nowTime() {
  return new Date().toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export default function AdminPanel({ initialAuthenticated }: AdminPanelProps) {
  const [authenticated, setAuthenticated] = useState(initialAuthenticated);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const [section, setSection] = useState<SectionKey>("scoring");
  const [matches, setMatches] = useState<MatchRow[]>([]);
  const [players, setPlayers] = useState<PlayerRow[]>([]);
  const [liveState, setLiveState] = useState<LiveStateRow | null>(null);
  const [balls, setBalls] = useState<BallEventRow[]>([]);
  const [log, setLog] = useState<LogRow[]>([]);
  const liveMatchIdRef = useRef<string | null>(null);

  const [matchId, setMatchId] = useState("");
  const [openingTeam, setOpeningTeam] = useState("");
  const [pauseReason, setPauseReason] = useState("");

  const [strikerId, setStrikerId] = useState("");
  const [nonStrikerId, setNonStrikerId] = useState("");
  const [bowlerId, setBowlerId] = useState("");
  const [fielderId, setFielderId] = useState("");
  const [ballType, setBallType] = useState<BallType>("runs");
  const [runsScored, setRunsScored] = useState(0);
  const [wicket, setWicket] = useState(false);

  const isLive = liveState?.status === "live";

  const selectedMatch = useMemo(() => {
    return matches.find((m) => m.id === (matchId || liveState?.active_match_id)) ?? null;
  }, [liveState?.active_match_id, matchId, matches]);

  const addLog = (type: LogType, msg: string) => {
    setLog((prev) => [...prev.slice(-99), { type, msg, time: nowTime() }]);
  };

  const loadBootstrap = useCallback(async () => {
    const res = await fetch("/api/admin/bootstrap", { cache: "no-store" });
    if (!res.ok) {
      if (res.status === 401) {
        setAuthenticated(false);
      }
      return;
    }

    const data = (await res.json()) as {
      matches: MatchRow[];
      players: PlayerRow[];
      liveState: LiveStateRow;
      balls: BallEventRow[];
    };

    setMatches(data.matches);
    setPlayers(data.players);
    setLiveState(data.liveState);
    setBalls(data.balls || []);
    liveMatchIdRef.current = data.liveState?.active_match_id || null;

    if (!matchId && data.liveState?.active_match_id) {
      setMatchId(data.liveState.active_match_id);
    }
  }, [matchId]);

  useEffect(() => {
    if (!authenticated) return;
    const timer = setTimeout(() => {
      void loadBootstrap();
    }, 0);
    return () => clearTimeout(timer);
  }, [authenticated, loadBootstrap]);

  useEffect(() => {
    if (!authenticated || !supabase) return;
    const client = supabase;

    const stateChannel = client
      .channel("admin-live-state")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "live_match_state" },
        (payload) => {
          const next = payload.new as LiveStateRow;
          liveMatchIdRef.current = next.active_match_id;
          setLiveState(next);
        },
      )
      .subscribe();

    const ballChannel = client
      .channel("admin-balls")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "ball_events" },
        (payload) => {
          const ball = payload.new as BallEventRow;
          if (!liveMatchIdRef.current || ball.match_id === liveMatchIdRef.current) {
            setBalls((prev) => [...prev.slice(-119), ball]);
          }
        },
      )
      .subscribe();

    return () => {
      void client.removeChannel(stateChannel);
      void client.removeChannel(ballChannel);
    };
  }, [authenticated]);

  const login = async () => {
    setLoading(true);
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    setLoading(false);

    if (!res.ok) {
      addLog("error", "Invalid credentials");
      return;
    }

    setAuthenticated(true);
    setPassword("");
    addLog("ok", "Authenticated");
  };

  const logout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    setAuthenticated(false);
    setLiveState(null);
    setBalls([]);
    addLog("info", "Logged out");
  };

  const callAction = async (payload: Record<string, unknown>) => {
    const res = await fetch("/api/admin/action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = (await res.json().catch(() => ({}))) as { error?: string };
    if (!res.ok) {
      addLog("error", data.error || "Request failed");
      return false;
    }

    await loadBootstrap();
    return true;
  };

  const onStart = async () => {
    const id = matchId || matches[0]?.id;
    if (!id) return;

    const ok = await callAction({ type: "start_match", matchId: id, openingTeam });
    if (ok) addLog("ok", `Match started: ${id}`);
  };

  const onPause = async () => {
    const ok = await callAction({ type: "pause_match", reason: pauseReason || "Match paused" });
    if (ok) addLog("info", `Paused: ${pauseReason || "Match paused"}`);
  };

  const onEnd = async () => {
    const ok = await callAction({ type: "end_match" });
    if (ok) addLog("ok", "Match ended");
  };

  const onSwitchInnings = async () => {
    const ok = await callAction({ type: "switch_innings" });
    if (ok) addLog("ok", "Innings switched");
  };

  const onToss = async () => {
    const ok = await callAction({ type: "toss" });
    if (ok) addLog("ok", "Toss recorded");
  };

  const onBall = async () => {
    if (!liveState?.active_match_id) {
      addLog("error", "Start a match first");
      return;
    }

    const resolvedStriker = strikerId || liveState.current_striker_player_id || "";
    const resolvedNonStriker = nonStrikerId || liveState.current_non_striker_player_id || "";
    const resolvedBowler = bowlerId || liveState.current_bowler_player_id || "";

    const ok = await callAction({
      type: "record_ball",
      matchId: liveState.active_match_id,
      ballType,
      runsScored,
      wicket,
      strikerPlayerId: resolvedStriker,
      nonStrikerPlayerId: resolvedNonStriker,
      bowlerPlayerId: resolvedBowler,
      wicketFielderPlayerId: wicket ? fielderId || null : null,
    });

    if (ok) {
      addLog("ok", `Ball: ${ballType} | ${runsScored}${wicket ? " | W" : ""}`);
      setBallType("runs");
      setRunsScored(0);
      setWicket(false);
      setFielderId("");
    }
  };

  if (!authenticated) {
    return (
      <main className="admin-login-root">
        <div className="admin-login-card">
          <h1>BOM Admin</h1>
          <p>Scoring control panel</p>
          <label>Username</label>
          <input value={username} onChange={(e) => setUsername(e.target.value)} />
          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") void login();
            }}
          />
          <button onClick={() => void login()} disabled={loading}>
            {loading ? "Signing in..." : "Login"}
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="admin-shell">
      <aside className="sidebar">
        <div className="sb-logo">
          <div className="sb-logo-text">Battle of the Maroons</div>
          <div className="sb-logo-sub">Admin Panel</div>
        </div>

        <div className="sb-status">
          <div className="sb-status-label">Match Status</div>
          <div className={`sb-status-value ${liveState?.status || "idle"}`}>{liveState?.status || "idle"}</div>
        </div>

        <button className={`sb-item ${section === "scoring" ? "active" : ""}`} onClick={() => setSection("scoring")}>
          Scoring
        </button>
        <button className={`sb-item ${section === "match" ? "active" : ""}`} onClick={() => setSection("match")}>
          Match Control
        </button>
        <button className={`sb-item ${section === "log" ? "active" : ""}`} onClick={() => setSection("log")}>
          Activity Log
        </button>

        <div className="sb-score-display">
          <div className="ssd-label">Current</div>
          <div className="ssd-score">
            {liveState?.current_score ?? 0}
            <span className="ssd-wkts">/{liveState?.current_wickets ?? 0}</span>
          </div>
          <div className="ssd-over">
            {(liveState?.over_count ?? 0) + "." + (liveState?.ball_in_over ?? 0)} ov
          </div>
          <div className="ssd-over">{balls.length} balls</div>
        </div>

        <button className="logout-btn" onClick={() => void logout()}>
          Logout
        </button>
      </aside>

      <section className="admin-main">
        <header className="topbar">
          <div className="topbar-title">BOM Scoring Console</div>
          <div className="conn-chip">Online</div>
        </header>

        <div className="panels">
          {section === "scoring" && (
            <div className="panel">
              <div className="panel-header">Record Ball</div>
              <div className="panel-body">
                <div className="grid-2">
                  <div className="field">
                    <label className="field-label">Striker</label>
                    <select
                      value={strikerId || liveState?.current_striker_player_id || ""}
                      onChange={(e) => setStrikerId(e.target.value)}
                    >
                      <option value="">Select...</option>
                      {players.map((player) => (
                        <option key={player.id} value={player.id}>
                          {player.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="field">
                    <label className="field-label">Non Striker</label>
                    <select
                      value={nonStrikerId || liveState?.current_non_striker_player_id || ""}
                      onChange={(e) => setNonStrikerId(e.target.value)}
                    >
                      <option value="">Select...</option>
                      {players.map((player) => (
                        <option key={player.id} value={player.id}>
                          {player.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="field">
                  <label className="field-label">Bowler</label>
                  <select
                    value={bowlerId || liveState?.current_bowler_player_id || ""}
                    onChange={(e) => setBowlerId(e.target.value)}
                  >
                    <option value="">Select...</option>
                    {players.map((player) => (
                      <option key={player.id} value={player.id}>
                        {player.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="ball-type-grid">
                  {BALL_TYPES.map((type) => (
                    <button
                      key={type.key}
                      className={`ball-btn ${type.className} ${ballType === type.key ? "selected" : ""}`}
                      onClick={() => setBallType(type.key)}
                    >
                      <span className="bb-icon">{type.icon}</span>
                      <span className="bb-label">{type.label}</span>
                    </button>
                  ))}
                </div>

                <div className="runs-grid">
                  {[0, 1, 2, 3, 4, 5, 6].map((run) => (
                    <button
                      key={run}
                      className={`run-btn ${runsScored === run ? "selected" : ""}`}
                      onClick={() => setRunsScored(run)}
                    >
                      {run}
                    </button>
                  ))}
                </div>

                <div className="toggle-row">
                  <label>
                    <input
                      type="checkbox"
                      checked={wicket}
                      onChange={(e) => setWicket(e.target.checked)}
                    />
                    Wicket
                  </label>
                </div>

                {wicket && (
                  <div className="field">
                    <label className="field-label">Fielder (optional)</label>
                    <select value={fielderId} onChange={(e) => setFielderId(e.target.value)}>
                      <option value="">None</option>
                      {players.map((player) => (
                        <option key={player.id} value={player.id}>
                          {player.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <button className="btn btn-primary btn-full" onClick={() => void onBall()} disabled={!isLive}>
                  Submit Ball
                </button>
              </div>
            </div>
          )}

          {section === "match" && (
            <div className="panel">
              <div className="panel-header">Match Control</div>
              <div className="panel-body">
                <div className="field">
                  <label className="field-label">Match</label>
                  <select value={matchId} onChange={(e) => setMatchId(e.target.value)}>
                    <option value="">Select...</option>
                    {matches.map((match) => (
                      <option key={match.id} value={match.id}>
                        {match.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="field">
                  <label className="field-label">Opening Team</label>
                  <input value={openingTeam} onChange={(e) => setOpeningTeam(e.target.value)} placeholder="e.g. AND" />
                </div>

                <div className="btn-row">
                  <button className="btn btn-success" onClick={() => void onToss()}>
                    Toss
                  </button>
                  <button className="btn btn-primary" onClick={() => void onStart()}>
                    Start Match
                  </button>
                </div>

                <div className="field">
                  <label className="field-label">Pause Reason</label>
                  <input value={pauseReason} onChange={(e) => setPauseReason(e.target.value)} />
                </div>

                <button className="btn btn-outline btn-full" onClick={() => void onPause()} disabled={!isLive}>
                  Pause Match
                </button>
                <button className="btn btn-success btn-full" onClick={() => void onSwitchInnings()} disabled={!isLive}>
                  Switch Innings
                </button>
                <button className="btn btn-danger btn-full" onClick={() => void onEnd()} disabled={!liveState || liveState.status === "idle" || liveState.status === "ended"}>
                  End Match
                </button>

                {selectedMatch && <p className="meta">Selected: {selectedMatch.team_a_name} vs {selectedMatch.team_b_name}</p>}
                {liveState?.batting_team_code && (
                  <p className="meta">Batting: {liveState.batting_team_code} | Bowling: {liveState.bowling_team_code || "-"}</p>
                )}
              </div>
            </div>
          )}

          {section === "log" && (
            <div className="panel">
              <div className="panel-header">Activity Log</div>
              <div className="panel-body log">
                {log.length === 0 ? (
                  <p className="meta">No activity yet.</p>
                ) : (
                  [...log].reverse().map((entry, index) => (
                    <div key={`${entry.time}-${index}`} className={`log-entry ${entry.type}`}>
                      <span>{entry.time}</span>
                      <span>{entry.msg}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

