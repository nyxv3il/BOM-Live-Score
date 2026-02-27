"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface MatchState {
  id: number;
  created_at: string;
  team_a_name: string;
  team_b_name: string;
  match_status: string | null;
  inning: number | null;
  team_a_runs: number | null;
  team_a_wickets: number | null;
  team_a_overs: number | null;
  team_b_runs: number | null;
  team_b_wickets: number | null;
  team_b_overs: number | null;
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
  match_status: "scheduled",
  inning: 1,
  team_a_runs: 0,
  team_a_wickets: 0,
  team_a_overs: 0,
  team_b_runs: 0,
  team_b_wickets: 0,
  team_b_overs: 0,
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
  const [sharingSnapshot, setSharingSnapshot] = useState(false);
  const [recentOverOffset, setRecentOverOffset] = useState(0);

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
  const teamAScore = `${match.team_a_runs ?? 0}/${match.team_a_wickets ?? 0} (${match.team_a_overs ?? 0})`;
  const teamBScore = `${match.team_b_runs ?? 0}/${match.team_b_wickets ?? 0} (${match.team_b_overs ?? 0})`;
  const currentInning = Number(match.inning ?? 1);
  const previousBattingTeam =
    currentInning > 1
      ? match.batting_team === match.team_a_name
        ? match.team_b_name
        : match.team_a_name
      : null;
  const previousScore =
    previousBattingTeam === match.team_a_name
      ? teamAScore
      : previousBattingTeam === match.team_b_name
        ? teamBScore
        : null;
  const recentBalls = match.recent_balls?.split(" ").filter(Boolean) ?? [];
  const getOverGroups = (allBalls: string[]): string[][] => {
    const groups: string[][] = [[]];
    allBalls.forEach((ball) => {
      if (ball === "|") {
        if (groups[groups.length - 1].length > 0) groups.push([]);
        return;
      }
      groups[groups.length - 1].push(ball);
    });
    return groups.filter((group) => group.length > 0);
  };
  const overGroups = getOverGroups(recentBalls);
  const latestOverIndex = overGroups.length - 1;
  const normalizedOverOffset =
    latestOverIndex >= 0 ? Math.min(recentOverOffset, latestOverIndex) : 0;
  const activeOverIndex =
    latestOverIndex >= 0 ? latestOverIndex - normalizedOverOffset : -1;
  const activeOverBalls =
    activeOverIndex >= 0 ? overGroups[activeOverIndex] : [];
  const getLegalBallCountFromOvers = (oversValue: number): number => {
    const wholeOvers = Math.floor(oversValue);
    return Math.max(0, Math.round((oversValue - wholeOvers) * 10));
  };
  const isLegalDeliveryToken = (ball: string): boolean => {
    const token = ball.trim().toUpperCase();
    if (!token || token === "|") return false;
    return !token.startsWith("WD") && !token.startsWith("NB");
  };
  const getCurrentOverBalls = (allBalls: string[]): string[] => {
    const boundaryIndex = allBalls.lastIndexOf("|");
    const tail = allBalls
      .slice(boundaryIndex + 1)
      .filter((ball) => ball !== "|");
    const currentOverLegalBalls = getLegalBallCountFromOvers(
      Number(match.overs) || 0,
    );

    if (currentOverLegalBalls <= 0) return tail;

    const currentOver: string[] = [];
    let legalSeen = 0;
    for (let i = tail.length - 1; i >= 0; i -= 1) {
      const ball = tail[i];
      currentOver.unshift(ball);
      if (isLegalDeliveryToken(ball)) {
        legalSeen += 1;
      }
      if (legalSeen >= currentOverLegalBalls) break;
    }
    return currentOver;
  };
  const currentOverBalls = getCurrentOverBalls(recentBalls);
  const displayBall = (ball: string): string => {
    const token = ball.trim().toUpperCase();
    if (!token) return "";
    if (token === ".") return "0";
    if (token.startsWith("WD")) return "WD";
    if (token.startsWith("NB")) return "NB";
    if (token.includes("W")) return "W";
    if (/^\d+$/.test(token)) return token;
    return token.slice(0, 2);
  };
  const bowlingTeam =
    match.batting_team === match.team_a_name
      ? match.team_b_name
      : match.team_a_name;
  const handleShareSnapshot = async () => {
    if (sharingSnapshot) return;
    setSharingSnapshot(true);

    try {
      const canvas = document.createElement("canvas");
      canvas.width = 1080;
      canvas.height = 1080;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Unable to create snapshot.");

      const gradient = ctx.createLinearGradient(
        0,
        0,
        canvas.width,
        canvas.height,
      );
      gradient.addColorStop(0, "#fff9f2");
      gradient.addColorStop(1, "#f3e7d9");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = "#800020";
      ctx.font = "bold 54px system-ui";
      ctx.fillText(`${match.team_a_name} vs ${match.team_b_name}`, 70, 120);

      ctx.fillStyle = "#262626";
      ctx.font = "bold 164px system-ui";
      ctx.fillText(`${match.runs}/${match.wickets}`, 70, 320);

      ctx.font = "bold 48px system-ui";
      ctx.fillStyle = "#444";
      ctx.fillText(`${match.overs} overs | RR ${runRate}`, 70, 390);

      ctx.fillStyle = "#111";
      ctx.font = "bold 42px system-ui";
      ctx.fillText(`Batting: ${match.batting_team || "-"}`, 70, 500);
      ctx.fillText(`Striker: ${match.current_batsman || "-"}`, 70, 565);
      ctx.fillText(`Bowler: ${match.current_bowler || "-"}`, 70, 630);

      ctx.fillStyle = "#800020";
      ctx.font = "bold 36px system-ui";
      ctx.fillText("Current Over", 70, 735);
      ctx.fillStyle = "#333";
      ctx.font = "bold 44px system-ui";
      ctx.fillText(
        currentOverBalls.length > 0
          ? currentOverBalls.map((ball) => displayBall(ball)).join("  ")
          : "No balls yet",
        70,
        790,
      );

      ctx.fillStyle = "#6a6a6a";
      ctx.font = "32px system-ui";
      ctx.fillText("Generated from Live Score App", 70, 980);

      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/png"),
      );
      if (!blob) throw new Error("Failed to create image file.");

      const file = new File([blob], "live-score-snapshot.png", {
        type: "image/png",
      });
      const canShareFiles =
        typeof navigator.share === "function" &&
        Boolean(
          (navigator as { canShare?: (data: ShareData) => boolean }).canShare?.(
            { files: [file] },
          ),
        );

      if (canShareFiles) {
        await navigator.share({
          title: "Live Score Snapshot",
          files: [file],
        });
      } else {
        const objectUrl = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = objectUrl;
        link.download = "live-score-snapshot.png";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(objectUrl);
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to share snapshot.";
      alert(message);
    } finally {
      setSharingSnapshot(false);
    }
  };
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
        {previousBattingTeam && previousScore && (
          <p className="mb-1 text-sm font-semibold text-[color:var(--muted)]">
            {previousBattingTeam}: {previousScore}
          </p>
        )}
        <p className="mb-2 text-6xl font-black text-[color:var(--primary)] md:text-8xl">
          {match.runs}/{match.wickets}
        </p>
        <p className="text-xl font-semibold text-[color:var(--muted)]">
          {match.overs} overs | RR {runRate}
        </p>
        {currentOverBalls.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            {currentOverBalls.map((ball, i) => (
              <span key={`score-panel-${ball}-${i}`} className="ball-dot">
                {displayBall(ball)}
              </span>
            ))}
          </div>
        )}
      </section>

      <section className="mb-10 w-full max-w-5xl space-y-6">
        <article className="neon-card p-5 md:p-6">
          <p className="mb-4 text-xs uppercase tracking-[0.2em] text-[color:var(--primary)]/80">
            Batting Team
          </p>
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <h2 className="text-2xl font-bold text-[color:var(--primary)]">
              {match.batting_team || "-"}
            </h2>
            <span className="hero-pill !mb-0 !py-2 !text-[0.68rem]">
              Live Batting
            </span>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <article className="metric-card p-5">
              <p className="mb-1 text-xs uppercase tracking-[0.2em] text-[color:var(--primary)]/80">
                On Strike
              </p>
              <h3 className="text-2xl font-bold text-[color:var(--primary)]">
                {match.current_batsman || "-"}
              </h3>
              <p className="mt-2 text-sm text-[color:var(--muted)]/80">
                {match.current_batsman_stats || "-"}
              </p>
            </article>

            <article className="metric-card p-5">
              <p className="mb-1 text-xs uppercase tracking-[0.2em] text-[color:var(--muted)]/80">
                Non-Striker
              </p>
              <h3 className="text-2xl font-bold text-[color:var(--muted)]">
                {match.non_striker || "-"}
              </h3>
              <p className="mt-2 text-sm text-[color:var(--muted)]/80">
                {match.non_striker_stats || "-"}
              </p>
            </article>

            <article className="metric-card p-5">
              <p className="mb-1 text-xs uppercase tracking-[0.2em] text-[color:var(--muted)]/80">
                Partnership
              </p>
              <h3 className="text-2xl font-bold text-[color:var(--muted)]">
                {match.partnership || "-"}
              </h3>
              <p className="mt-2 text-sm text-[color:var(--muted)]/80">
                Current partnership
              </p>
            </article>
          </div>
        </article>

        <article className="neon-card p-5 md:p-6">
          <p className="mb-4 text-xs uppercase tracking-[0.2em] text-[color:var(--muted)]/80">
            Bowling Team
          </p>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <article className="metric-card p-5">
              <p className="mb-1 text-xs uppercase tracking-[0.2em] text-[color:var(--muted)]/80">
                Team
              </p>
              <h3 className="text-2xl font-bold text-[color:var(--muted)]">
                {bowlingTeam}
              </h3>
              <p className="mt-2 text-sm text-[color:var(--muted)]/80">
                Fielding side
              </p>
            </article>

            <article className="metric-card p-5">
              <p className="mb-1 text-xs uppercase tracking-[0.2em] text-[color:var(--muted)]/80">
                Current Bowler
              </p>
              <h3 className="text-2xl font-bold text-[color:var(--muted)]">
                {match.current_bowler || "-"}
              </h3>
              <p className="mt-2 text-sm text-[color:var(--muted)]/80">
                {match.current_bowler_stats || "-"}
              </p>
            </article>
          </div>
        </article>

        <article className="metric-card p-5">
          <p className="mb-3 text-xs uppercase tracking-[0.2em] text-[color:var(--primary)]/80">
            Recent Balls
          </p>
          {activeOverBalls.length > 0 ? (
            <>
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--muted)]/80">
                Over {activeOverIndex + 1} of {overGroups.length}
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="h-9 w-9 rounded-full border border-[color:var(--border)] text-[color:var(--primary)] disabled:opacity-40"
                  disabled={activeOverIndex <= 0}
                  onClick={() =>
                    setRecentOverOffset((prev) =>
                      Math.min(prev + 1, latestOverIndex),
                    )
                  }
                  aria-label="Show previous over"
                >
                  <i className="fas fa-chevron-left"></i>
                </button>
                <div className="min-w-0 flex-1 overflow-x-auto">
                  <div className="flex w-max flex-nowrap gap-2">
                    {activeOverBalls.map((ball, i) => (
                      <span key={`${ball}-${i}`} className="ball-dot">
                        {displayBall(ball)}
                      </span>
                    ))}
                  </div>
                </div>
                <button
                  type="button"
                  className="h-9 w-9 rounded-full border border-[color:var(--border)] text-[color:var(--primary)] disabled:opacity-40"
                  disabled={activeOverIndex >= latestOverIndex}
                  onClick={() =>
                    setRecentOverOffset((prev) => Math.max(prev - 1, 0))
                  }
                  aria-label="Show next over"
                >
                  <i className="fas fa-chevron-right"></i>
                </button>
              </div>
            </>
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

      <button
        type="button"
        onClick={() => void handleShareSnapshot()}
        disabled={sharingSnapshot}
        className="cta-btn fixed bottom-6 right-6 z-40"
        style={{
          borderRadius: "9999px",
          minWidth: "3.25rem",
          minHeight: "3.25rem",
          padding: "0.9rem",
          opacity: sharingSnapshot ? 0.75 : 1,
          cursor: sharingSnapshot ? "not-allowed" : "pointer",
        }}
        aria-label="Share snapshot"
      >
        <i
          className={`fas ${sharingSnapshot ? "fa-spinner fa-spin" : "fa-share-nodes"}`}
        ></i>
      </button>
    </main>
  );
}
