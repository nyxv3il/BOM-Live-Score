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
        <p className="text-center text-3xl font-bold text-pink-300 drop-shadow-[0_0_20px_rgba(255,73,132,0.8)]">
          ⚡ Loading Match Data...
        </p>
      </div>
    );
  }

  const recentBalls = match.recent_balls?.split(" ").filter(Boolean) ?? [];

  return (
    <main className="mx-auto flex min-h-[85vh] w-full max-w-6xl flex-col items-center justify-center px-4 py-12 md:py-20">
      <section className="mb-12 text-center md:mb-14">
        <div className="hero-pill mb-6">🏏 live match center</div>
        <h1 className="hero-heading mb-4">
          <span className="gradient">
            {match.team_a_name} vs {match.team_b_name}
          </span>
        </h1>
        <p className="mb-6 text-lg text-indigo-100/85 md:text-2xl">
          Real-time cricket scoring with electric updates.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <span className="meta-chip">🎯 Batting: {match.batting_team}</span>
          <span className="meta-chip">⏱ Overs: {match.overs}</span>
          <span className="meta-chip">📍 Live Feed</span>
        </div>
      </section>

      <section className="score-panel mb-8 w-full max-w-4xl p-8 text-center md:p-12">
        <p className="mb-2 text-sm uppercase tracking-[0.22em] text-pink-300/90">
          Current Score
        </p>
        <p className="mb-2 text-6xl font-black text-white drop-shadow-[0_0_18px_rgba(255,42,117,0.7)] md:text-8xl">
          {match.runs}/{match.wickets}
        </p>
        <p className="text-xl font-semibold text-violet-200">{match.overs} overs</p>
      </section>

      <section className="grid w-full max-w-5xl grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        <article className="metric-card p-5">
          <p className="mb-1 text-xs uppercase tracking-[0.2em] text-violet-200/80">Team A</p>
          <h2 className="text-2xl font-bold">{match.team_a_name}</h2>
          <p className="mt-2 text-sm text-indigo-100/75">
            {match.batting_team === match.team_a_name ? "● Batting" : "◯ Fielding"}
          </p>
        </article>

        <article className="metric-card p-5">
          <p className="mb-1 text-xs uppercase tracking-[0.2em] text-pink-200/80">On Strike</p>
          <h2 className="text-2xl font-bold text-pink-200">{match.current_batsman || "-"}</h2>
          <p className="mt-2 text-sm text-indigo-100/75">Current batsman</p>
        </article>

        <article className="metric-card p-5">
          <p className="mb-1 text-xs uppercase tracking-[0.2em] text-violet-200/80">Bowler</p>
          <h2 className="text-2xl font-bold text-violet-200">{match.current_bowler || "-"}</h2>
          <p className="mt-2 text-sm text-indigo-100/75">Current bowler</p>
        </article>

        <article className="metric-card p-5 md:col-span-2 lg:col-span-3">
          <p className="mb-3 text-xs uppercase tracking-[0.2em] text-pink-200/80">Recent Balls</p>
          {recentBalls.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {recentBalls.map((ball, i) => (
                <span key={`${ball}-${i}`} className="ball-chip">
                  {ball}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-indigo-100/70">No recent deliveries yet.</p>
          )}
        </article>
      </section>

      <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
        <button className="cta-btn" type="button">
          Register Team
        </button>
        <button className="cta-btn secondary" type="button">
          Learn More
        </button>
      </div>
    </main>
  );
}
