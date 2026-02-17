"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type PlayerRow = {
  id: number;
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
};

const fallbackRows: PlayerRow[] = [
  { id: 1, team_name: "School A", player_name: "Dilan Perera", runs: 76, balls: 64, fours: 8, sixes: 2, strike_rate: 118.75, wickets: 0, overs: 0, economy: 0 },
  { id: 2, team_name: "School A", player_name: "Sahan Rodrigo", runs: 44, balls: 51, fours: 3, sixes: 1, strike_rate: 86.27, wickets: 0, overs: 0, economy: 0 },
  { id: 3, team_name: "School B", player_name: "Raveen Silva", runs: 68, balls: 59, fours: 7, sixes: 2, strike_rate: 115.25, wickets: 1, overs: 4, economy: 7.25 },
  { id: 4, team_name: "School B", player_name: "Pasindu Liyanage", runs: 18, balls: 15, fours: 2, sixes: 0, strike_rate: 120, wickets: 3, overs: 4, economy: 5.5 },
];

export default function SummaryPage() {
  const [players, setPlayers] = useState<PlayerRow[]>(supabase ? [] : fallbackRows);

  useEffect(() => {
    const client = supabase;
    if (!client) return;

    const fetchPlayers = async () => {
      const { data } = await client
        .from("player_scores")
        .select("*")
        .order("team_name", { ascending: true })
        .order("player_name", { ascending: true });

      setPlayers((data as PlayerRow[]) || []);
    };

    void fetchPlayers();
  }, []);

  const grouped = useMemo(() => {
    return players.reduce<Record<string, PlayerRow[]>>((acc, row) => {
      if (!acc[row.team_name]) acc[row.team_name] = [];
      acc[row.team_name].push(row);
      return acc;
    }, {});
  }, [players]);

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10 md:py-14">
      <section className="mb-8 text-center">
        <div className="hero-pill mb-4"><i className="fas fa-chart-line"></i> series summary</div>
        <h1 className="hero-heading mb-3 text-[color:var(--primary)]">Match Series Details</h1>
      </section>

      <section className="mb-10 grid gap-6 lg:grid-cols-2">
        {Object.entries(grouped).map(([team, rows]) => (
          <article className="rounded-2xl border border-[color:var(--border)] bg-white/70 p-4 shadow-sm" key={team}>
            <h2 className="mb-4 text-2xl font-bold text-[color:var(--primary)]">{team} Player Scores</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full overflow-hidden rounded-xl border border-[color:var(--border)] bg-white/85">
                <thead className="bg-[color:var(--primary)] text-left text-white">
                  <tr>
                    <th className="px-4 py-3">Player</th>
                    <th className="px-4 py-3">Runs</th>
                    <th className="px-4 py-3">Balls</th>
                    <th className="px-4 py-3">4s</th>
                    <th className="px-4 py-3">6s</th>
                    <th className="px-4 py-3">SR</th>
                    <th className="px-4 py-3">Wkts</th>
                    <th className="px-4 py-3">Overs</th>
                    <th className="px-4 py-3">Econ</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((player) => (
                    <tr key={player.id} className="border-t border-[color:var(--border)]/70">
                      <td className="px-4 py-3 font-semibold">{player.player_name}</td>
                      <td className="px-4 py-3">{player.runs}</td>
                      <td className="px-4 py-3">{player.balls}</td>
                      <td className="px-4 py-3">{player.fours}</td>
                      <td className="px-4 py-3">{player.sixes}</td>
                      <td className="px-4 py-3">{player.strike_rate}</td>
                      <td className="px-4 py-3">{player.wickets}</td>
                      <td className="px-4 py-3">{player.overs}</td>
                      <td className="px-4 py-3">{player.economy}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>
        ))}
      </section>

      <section className="flex justify-center">
        <Link href="/" className="cta-btn secondary">Back to Live Match</Link>
      </section>
    </main>
  );
}
