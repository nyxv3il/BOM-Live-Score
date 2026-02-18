"use client";
import Link from "next/link";
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
  series_name: string | null;
  match_logo_url: string | null;
  match_description: string | null;
  match_1_date: string | null;
  match_1_time: string | null;
  match_1_venue: string | null;
  match_1_format: string | null;
  match_2_date: string | null;
  match_2_time: string | null;
  match_2_venue: string | null;
  match_2_format: string | null;
  match_3_date: string | null;
  match_3_time: string | null;
  match_3_venue: string | null;
  match_3_format: string | null;
  match_4_date: string | null;
  match_4_time: string | null;
  match_4_venue: string | null;
  match_4_format: string | null;
}

const fallbackMatch: MatchState = {
  id: 0,
  created_at: "",
  team_a_name: "School A",
  team_b_name: "School B",
  batting_team: "School A",
  runs: 0,
  wickets: 0,
  overs: 0,
  current_batsman: "-",
  current_bowler: "-",
  recent_balls: "",
  non_striker: "-",
  partnership: "0 (0)",
  current_batsman_stats: "0 (0)",
  non_striker_stats: "0 (0)",
  current_bowler_stats: "0-0-0-0",
  series_name: "Battle of the Maroons Series",
  match_logo_url: "",
  match_description:
    "The annual inter-school cricket showdown featuring three decisive matches.",
  match_1_date: "2026-02-20",
  match_1_time: "9:00 AM",
  match_1_venue: "St. Maroon Grounds, Colombo",
  match_1_format: "50 Overs",
  match_2_date: "2026-02-22",
  match_2_time: "2:30 PM",
  match_2_venue: "Royal Turf Arena, Kandy",
  match_2_format: "T20",
  match_3_date: "2026-02-25",
  match_3_time: "10:00 AM",
  match_3_venue: "Victory Sports Complex, Galle",
  match_3_format: "50 Overs",
  match_4_date: "2026-02-25",
  match_4_time: "10:00 AM",
  match_4_venue: "Victory Sports Complex, Galle",
  match_4_format: "50 Overs",
};

export default function ScoreBoard() {
  const [match, setMatch] = useState<MatchState | null>(
    supabase ? null : fallbackMatch,
  );

  useEffect(() => {
    const client = supabase;
    if (!client) return;

    const fetchScore = async () => {
      const { data } = await client
        .from("match_state")
        .select("*")
        .eq("id", 1)
        .single();

      setMatch((data as MatchState) || fallbackMatch);
    };
    void fetchScore();

    const channel = client
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
      void client.removeChannel(channel);
    };
  }, []);

  if (!match) {
    return (
      <div className="mx-auto flex min-h-[85vh] max-w-5xl items-center justify-center px-4">
        Loading...
      </div>
    );
  }

  const runRate =
    match.overs > 0 ? (match.runs / match.overs).toFixed(2) : "0.00";
  const recentBalls = match.recent_balls?.split(" ").filter(Boolean) ?? [];
  const timeline = [
    {
      match: "Test Match - Day 1",
      date: match.match_1_date,
      time: match.match_1_time,
      venue: match.match_1_venue,
      format: match.match_1_format,
    },
    {
      match: "Test Match - Day 2",
      date: match.match_2_date,
      time: match.match_2_time,
      venue: match.match_2_venue,
      format: match.match_2_format,
    },
    {
      match: "Test Match - Day 3",
      date: match.match_3_date,
      time: match.match_3_time,
      venue: match.match_3_venue,
      format: match.match_3_format,
    },
    {
      match: "ODA",
      date: match.match_4_date,
      time: match.match_4_time,
      venue: match.match_4_venue,
      format: match.match_4_format,
    },
  ];

  return (
    <main className="mx-auto flex min-h-[85vh] w-full max-w-6xl flex-col items-center justify-center px-4 py-12 md:py-20">
      {!supabase && (
        <div className="mb-6 rounded-xl border border-[color:var(--border)] bg-white/80 px-4 py-3 text-center text-sm text-[color:var(--muted)]">
          Live data is unavailable because Supabase environment variables are
          not configured. Displaying demo values.
        </div>
      )}

      <section className="mb-12 text-center md:mb-14">
        <div className="hero-pill mb-6">
          <i className="fas fa-futbol"></i> live match center
        </div>
        <h1 className="hero-heading mb-4">
          <span className="gradient">
            {match.team_a_name} vs {match.team_b_name}
          </span>
        </h1>
      </section>

      {/* <section className="neon-card mb-8 w-full max-w-5xl p-6 md:p-8">
        <div className="grid items-center gap-6 md:grid-cols-[130px_1fr]">
          <div className="mx-auto flex h-28 w-28 items-center justify-center overflow-hidden text-4xl">
            {match.match_logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={match.match_logo_url}
                alt="Match logo"
                className="h-full w-full object-cover"
              />
            ) : (
              <i className="fas fa-trophy"></i>
            )}
          </div>
          <div>
            <p className="mb-2 text-xs uppercase tracking-[0.2em] text-[color:var(--primary)]/80">
              Match Info
            </p>
            <h2 className="mb-2 text-2xl font-bold md:text-3xl">
              {match.series_name || "Battle of the Maroons Series"}
            </h2>
            <p className="text-[color:var(--muted)]">
              {match.match_description ||
                `The annual inter-school cricket showdown featuring three decisive matches between ${match.team_a_name} and ${match.team_b_name}.`}
            </p>
          </div>
        </div>
      </section> */}

      <section className="score-panel mb-8 w-full max-w-4xl p-8 text-center md:p-12">
        <p className="mb-2 text-sm uppercase tracking-[0.22em] text-[color:var(--primary)]/90">
          Current Score
        </p>
        <p className="mb-2 text-6xl font-black text-[color:var(--primary)] md:text-8xl">
          {match.runs}/{match.wickets}
        </p>
        <p className="text-xl font-semibold text-[color:var(--muted)]">
          {match.overs} overs | RR {runRate}
        </p>
      </section>

      <section className="mb-10 grid w-full max-w-5xl grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
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

      <section className="mb-10 w-full max-w-5xl">
        <h2 className="mb-4 text-center text-3xl font-bold text-[color:var(--primary)]">
          Match Series Timeline
        </h2>
        <div className="grid gap-4 md:grid-cols-3">
          {timeline.map((event) => (
            <article key={event.match} className="neon-card p-5">
              <p className="text-xs uppercase tracking-[0.16em] text-[color:var(--primary)]/80">
                {event.match}
              </p>
              <h3 className="mt-2 text-xl font-bold">{event.format || "-"}</h3>
              <ul className="mt-3 space-y-2 text-sm text-[color:var(--muted)]">
                <li>
                  <i className="fas fa-calendar mr-2"></i>
                  {event.date || "-"}
                </li>
                <li>
                  <i className="fas fa-clock mr-2"></i>
                  {event.time || "-"}
                </li>
                <li>
                  <i className="fas fa-map-marker-alt mr-2"></i>
                  {event.venue || "-"}
                </li>
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section className="mb-4 flex flex-wrap justify-center gap-3">
        <Link className="cta-btn" href="/summary">
          View Series Summary
        </Link>
        <Link className="cta-btn secondary" href="/credits">
          View Credits
        </Link>
      </section>
    </main>
  );
}
