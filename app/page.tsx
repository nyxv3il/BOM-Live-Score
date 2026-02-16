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
    // 1. Fetch initial data
    const fetchScore = async () => {
      const { data } = await supabase
        .from("match_state")
        .select("*")
        .eq("id", 1)
        .single();
      if (data) setMatch(data as MatchState);
    };
    void fetchScore();

    // 2. Subscribe to real-time changes
    const channel = supabase
      .channel("realtime:match_score")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "match_state" },
        (payload) => {
          setMatch(payload.new as MatchState); // Update state instantly
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, []);

  if (!match)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div
          className="text-4xl neon-text font-black"
          style={{ color: "var(--primary)" }}
        >
          ⚡ Loading Match Data...
        </div>
      </div>
    );

  return (
    <main className="min-h-screen flex flex-col items-center justify-center py-16 px-4">
      {/* Hero Section */}
      <div className="text-center mb-12 max-w-2xl">
        <p className="hero-subtitle">🏏 LIVE SCORECARD</p>
        <h1 className="hero-title">
          {match.team_a_name} <span className="highlight-purple">vs</span>{" "}
          {match.team_b_name}
        </h1>
      </div>

      {/* Floating Cards Container */}
      <div className="w-full max-w-5xl">
        {/* Score Display Card */}
        <div
          className="neon-card p-12 mb-8 text-center mx-auto"
          style={{ backgroundColor: "rgba(26, 13, 46, 0.5)" }}
        >
          <p
            className="text-xl mb-6 font-semibold tracking-widest uppercase"
            style={{ color: "var(--primary)" }}
          >
            {match.batting_team.toUpperCase()} IS BATTING
          </p>
          <div
            className="text-9xl font-black tracking-tighter neon-text mb-4"
            style={{ color: "var(--primary)" }}
          >
            {match.runs}/{match.wickets}
          </div>
          <p className="text-4xl font-black" style={{ color: "var(--purple)" }}>
            {match.overs} OVERS
          </p>
        </div>

        {/* Info Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mx-auto">
          {/* Team A Info */}
          <div
            className="neon-card p-8"
            style={{ backgroundColor: "rgba(26, 13, 46, 0.4)" }}
          >
            <div
              className="text-sm font-bold uppercase tracking-widest mb-3"
              style={{ color: "var(--primary)" }}
            >
              {match.team_a_name}
            </div>
            <div
              className="text-5xl font-black"
              style={{ color: "var(--foreground)" }}
            >
              {match.batting_team === match.team_a_name ? "●" : "◯"}
            </div>
            <p className="text-gray-400 mt-2 text-sm">Batting Status</p>
          </div>

          {/* Current Batsman */}
          <div
            className="neon-card p-8"
            style={{ backgroundColor: "rgba(26, 13, 46, 0.4)" }}
          >
            <p
              className="text-xs uppercase tracking-widest font-bold mb-3"
              style={{ color: "var(--primary)" }}
            >
              ON STRIKE
            </p>
            <p
              className="text-2xl font-bold neon-text"
              style={{ color: "var(--primary)" }}
            >
              {match.current_batsman || "-"}
            </p>
            <p className="text-gray-400 mt-2 text-sm">Current Batsman</p>
          </div>

          {/* Bowler */}
          <div
            className="neon-card p-8"
            style={{ backgroundColor: "rgba(26, 13, 46, 0.4)" }}
          >
            <p
              className="text-xs uppercase tracking-widest font-bold mb-3"
              style={{ color: "var(--purple)" }}
            >
              BOWLER
            </p>
            <p
              className="text-2xl font-bold neon-text"
              style={{ color: "var(--purple)" }}
            >
              {match.current_bowler || "-"}
            </p>
            <p className="text-gray-400 mt-2 text-sm">Current Bowler</p>
          </div>

          {/* Team B Info */}
          <div
            className="neon-card p-8"
            style={{ backgroundColor: "rgba(26, 13, 46, 0.4)" }}
          >
            <div
              className="text-sm font-bold uppercase tracking-widest mb-3"
              style={{ color: "var(--purple)" }}
            >
              {match.team_b_name}
            </div>
            <div
              className="text-5xl font-black"
              style={{ color: "var(--foreground)" }}
            >
              {match.batting_team === match.team_b_name ? "●" : "◯"}
            </div>
            <p className="text-gray-400 mt-2 text-sm">Batting Status</p>
          </div>

          {/* Match Stats */}
          <div
            className="neon-card p-8 md:col-span-2 lg:col-span-2"
            style={{ backgroundColor: "rgba(26, 13, 46, 0.4)" }}
          >
            <p
              className="text-xs uppercase tracking-widest font-bold mb-4"
              style={{ color: "var(--primary)" }}
            >
              RECENT BALLS
            </p>
            <div className="flex gap-3 flex-wrap">
              {(match.recent_balls?.split(" ") || []).map(
                (ball: string, i: number) => (
                  <span
                    key={i}
                    className="px-4 py-2 rounded-lg text-sm font-bold font-mono border-2"
                    style={{
                      borderColor: "var(--primary)",
                      color: "var(--primary)",
                      backgroundColor: "rgba(255, 20, 147, 0.1)",
                      textShadow: "0 0 8px rgba(255, 20, 147, 0.4)",
                    }}
                  >
                    {ball}
                  </span>
                ),
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
