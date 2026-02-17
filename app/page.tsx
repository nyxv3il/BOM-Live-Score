"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface MatchState {
  id: number;
  created_at: string;
  team_a_name: string;
  team_b_name: string;
  batting_team: string;
  runs: number;
  wickets: number;
  overs: number;
  current_batsman: string | null;
  current_bowler: string | null;
  recent_balls: string | null;
  non_striker: string | null;
  partnership: string | null;
  current_batsman_stats: string | null;
  non_striker_stats: string | null;
  current_bowler_stats: string | null;
}

export default function ScoreBoard() {
  const [match, setMatch] = useState<MatchState | null>(null);

  useEffect(() => {
    const fetchScore = async () => {
      const { data } = await supabase
        .from("match_state")
        .select("*")
        .eq("id", 1)
        .single();
      if (data) setMatch(data as MatchState);
    };
    void fetchScore();

    const channel = supabase
      .channel("realtime:match_score")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "match_state" },
        (payload) => {
          setMatch(payload.new as MatchState);
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, []);

  if (!match) {
    return (
      <div className="mx-auto flex min-h-[85vh] max-w-5xl items-center justify-center px-4">
        <p className="text-center text-3xl font-bold text-[color:var(--primary)] drop-shadow-[0_4px_12px_rgba(128,0,32,0.25)]">
          <i className="fas fa-hourglass"></i> Loading Match Data...
        </p>
      </div>
    );
  }

  const runRate =
    match.overs > 0 ? (match.runs / match.overs).toFixed(2) : "0.00";
  const recentBalls = match.recent_balls?.split(" ").filter(Boolean) ?? [];

  return (
    <main className="mx-auto flex min-h-[85vh] w-full max-w-6xl flex-col items-center justify-center px-4 py-12 md:py-20">
      <section className="mb-12 text-center md:mb-14">
        <div className="hero-pill mb-6">
          <i className="fas fa-futbol"></i> live match center
        </div>
        <h1 className="hero-heading mb-4">
          <span className="gradient">
            {match.team_a_name} vs {match.team_b_name}
          </span>
        </h1>
        <p className="mb-6 text-lg text-[color:var(--muted)] md:text-2xl">
          Real-time cricket scoring with electric updates.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <span className="meta-chip">
            <i className="fas fa-wifi"></i> Live Feed
          </span>
          <span className="meta-chip">
            <i className="fas fa-location"></i> Batting: {match.batting_team}
          </span>
          <span className="meta-chip">
            <i className="fas fa-baseball"></i> Overs: {match.overs}
          </span>
          <span className="meta-chip">
            <i className="fas fa-tachometer-alt"></i> Run Rate: {runRate}
          </span>
        </div>
      </section>

      <section className="score-panel mb-8 w-full max-w-4xl p-8 text-center md:p-12">
        <p className="mb-2 text-sm uppercase tracking-[0.22em] text-[color:var(--primary)]/90">
          Current Score
        </p>
        <p className="mb-2 text-6xl font-black text-[color:var(--primary)] drop-shadow-[0_5px_14px_rgba(128,0,32,0.2)] md:text-8xl">
          {match.runs}/{match.wickets}
        </p>
        <p className="text-xl font-semibold text-[color:var(--muted)]">
          {match.overs} overs
        </p>
      </section>

      <section className="grid w-full max-w-5xl grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        <article className="metric-card p-5">
          <p className="mb-1 text-xs uppercase tracking-[0.2em] text-[color:var(--muted)]/80">
            Team A
          </p>
          <h2 className="text-2xl font-bold">{match.team_a_name}</h2>
          <p className="mt-2 text-sm text-[color:var(--muted)]/80">
            {match.batting_team === match.team_a_name
              ? "● Batting"
              : "◯ Fielding"}
          </p>
        </article>

        <article className="metric-card p-5">
          <p className="mb-1 text-xs uppercase tracking-[0.2em] text-[color:var(--primary)]/80">
            On Strike
          </p>
          <h2 className="text-2xl font-bold text-[color:var(--primary)]">
            {match.current_batsman || "-"}
          </h2>
          <p className="mt-2 text-sm text-[color:var(--muted)]/80">
            {match.current_batsman_stats || "-"}
          </p>
        </article>

        <article className="metric-card p-5">
          <p className="mb-1 text-xs uppercase tracking-[0.2em] text-[color:var(--muted)]/80">
            Non-Striker
          </p>
          <h2 className="text-2xl font-bold text-[color:var(--muted)]">
            {match.non_striker || "-"}
          </h2>
          <p className="mt-2 text-sm text-[color:var(--muted)]/80">
            {match.non_striker_stats || "-"}
          </p>
        </article>

        <article className="metric-card p-5">
          <p className="mb-1 text-xs uppercase tracking-[0.2em] text-[color:var(--muted)]/80">
            Bowler
          </p>
          <h2 className="text-2xl font-bold text-[color:var(--muted)]">
            {match.current_bowler || "-"}
          </h2>
          <p className="mt-2 text-sm text-[color:var(--muted)]/80">
            {match.current_bowler_stats || "-"}
          </p>
        </article>

        <article className="metric-card p-5">
          <p className="mb-1 text-xs uppercase tracking-[0.2em] text-[color:var(--muted)]/80">
            Partnership
          </p>
          <h2 className="text-2xl font-bold text-[color:var(--muted)]">
            {match.partnership || "-"}
          </h2>
          <p className="mt-2 text-sm text-[color:var(--muted)]/80">
            Current partnership
          </p>
        </article>

        <article className="metric-card p-5 md:col-span-2 lg:col-span-3">
          <p className="mb-3 text-xs uppercase tracking-[0.2em] text-[color:var(--primary)]/80">
            Recent Balls
          </p>
          {recentBalls.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {recentBalls.map((ball, i) => (
                <span key={`${ball}-${i}`} className="ball-chip">
                  {ball}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-[color:var(--muted)]/70">
              No recent deliveries yet.
            </p>
          )}
        </article>
      </section>
    </main>
  );
}
