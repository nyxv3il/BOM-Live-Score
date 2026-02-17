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
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      if (!supabase) return;

      const [{ data: matchData }, { data: playersData }] = await Promise.all([
        supabase.from("match_state").select("*").eq("id", 1).single(),
        supabase.from("player_scores").select("*").order("team_name", { ascending: true }).order("player_name", { ascending: true }),
      ]);

      if (matchData) setMatch(matchData as MatchState);
      if (playersData) setPlayers(playersData as PlayerScore[]);
    };

    if (!Cookies.get("admin_session")) {
      router.push("/admin/login");
    } else {
      void fetchData();
    }
  }, [router]);

  const handleMatchChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const numeric = ["runs", "wickets", "overs"];
    setMatch((prev) => ({ ...prev, [name]: numeric.includes(name) ? Number(value) : value } as MatchState));
  };

  const handlePlayerChange = (index: number, key: keyof PlayerScore, value: string) => {
    const numericKeys: (keyof PlayerScore)[] = ["runs", "balls", "fours", "sixes", "strike_rate", "wickets", "overs", "economy"];
    const parsed = numericKeys.includes(key) ? Number(value) : value;
    setPlayers((prev) => prev.map((p, i) => (i === index ? { ...p, [key]: parsed } : p)));
  };

  const saveMatch = async () => {
    if (!supabase) {
      alert("Supabase is not configured.");
      return;
    }

    const { error } = await supabase.from("match_state").update(match).eq("id", 1);
    if (error) {
      alert("Error updating match info.");
      return;
    }
    alert("Match info updated.");
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
      const { data } = await supabase.from("player_scores").insert(player).select("*").single();
      if (data) {
        setPlayers((prev) => prev.map((p) => (p === player ? (data as PlayerScore) : p)));
      }
    }
  };

  const deletePlayer = async (id?: number) => {
    if (!supabase || !id) return;
    const { error } = await supabase.from("player_scores").delete().eq("id", id);
    if (!error) setPlayers((prev) => prev.filter((p) => p.id !== id));
  };

  const saveAllPlayers = async () => {
    if (!supabase) {
      alert("Supabase is not configured.");
      return;
    }

    setSaving(true);
    for (const player of players) {
      await savePlayer(player);
    }
    setSaving(false);
    alert("All player rows saved.");
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

  return (
    <div className="min-h-screen py-10 px-4">
      <div className="mx-auto w-full max-w-6xl space-y-8">
        <h1 className="text-5xl font-black mb-2 neon-text text-center" style={{ color: "var(--primary)" }}>
          <i className="fas fa-baseball"></i> ADMIN PANEL
        </h1>

        <div className="neon-card p-8" style={{ backgroundColor: "rgba(255, 255, 255, 0.9)" }}>
          <h2 className="mb-6 text-2xl font-black" style={{ color: "var(--primary)" }}>Match + Timeline Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {Object.entries(match).map(([key, value]) => (
              <div key={key} className={key === "match_description" ? "md:col-span-2" : ""}>
                <label style={labelStyles}>{key.replaceAll("_", " ")}</label>
                {key === "match_description" ? (
                  <textarea
                    name={key}
                    value={String(value ?? "")}
                    onChange={handleMatchChange}
                    className="focus:outline-none transition-all"
                    style={{ ...inputStyles, minHeight: "110px" }}
                  />
                ) : (
                  <input
                    name={key}
                    type="text"
                    value={String(value ?? "")}
                    onChange={handleMatchChange}
                    className="focus:outline-none transition-all"
                    style={inputStyles}
                  />
                )}
              </div>
            ))}
          </div>
          <button onClick={saveMatch} className="mt-6 cta-btn">Save Match Info</button>
        </div>

        <div className="neon-card p-8" style={{ backgroundColor: "rgba(255, 255, 255, 0.9)" }}>
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-2xl font-black" style={{ color: "var(--primary)" }}>Player Score Tables</h2>
            <button className="cta-btn secondary" onClick={() => setPlayers((prev) => [...prev, { ...newPlayerRow }])}>Add Player</button>
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
                    <th key={h} className="px-3 py-2 text-left">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {players.map((player, index) => (
                  <tr key={player.id ?? `new-${index}`} className="border-t border-[color:var(--border)] bg-white/70">
                    <td className="p-2"><input style={inputStyles} value={player.team_name} onChange={(e) => handlePlayerChange(index, "team_name", e.target.value)} /></td>
                    <td className="p-2"><input style={inputStyles} value={player.player_name} onChange={(e) => handlePlayerChange(index, "player_name", e.target.value)} /></td>
                    <td className="p-2"><input type="number" style={inputStyles} value={player.runs} onChange={(e) => handlePlayerChange(index, "runs", e.target.value)} /></td>
                    <td className="p-2"><input type="number" style={inputStyles} value={player.balls} onChange={(e) => handlePlayerChange(index, "balls", e.target.value)} /></td>
                    <td className="p-2"><input type="number" style={inputStyles} value={player.fours} onChange={(e) => handlePlayerChange(index, "fours", e.target.value)} /></td>
                    <td className="p-2"><input type="number" style={inputStyles} value={player.sixes} onChange={(e) => handlePlayerChange(index, "sixes", e.target.value)} /></td>
                    <td className="p-2"><input type="number" step="0.01" style={inputStyles} value={player.strike_rate} onChange={(e) => handlePlayerChange(index, "strike_rate", e.target.value)} /></td>
                    <td className="p-2"><input type="number" style={inputStyles} value={player.wickets} onChange={(e) => handlePlayerChange(index, "wickets", e.target.value)} /></td>
                    <td className="p-2"><input type="number" step="0.1" style={inputStyles} value={player.overs} onChange={(e) => handlePlayerChange(index, "overs", e.target.value)} /></td>
                    <td className="p-2"><input type="number" step="0.01" style={inputStyles} value={player.economy} onChange={(e) => handlePlayerChange(index, "economy", e.target.value)} /></td>
                    <td className="p-2 space-x-2">
                      <button onClick={() => void savePlayer(player)} className="cta-btn secondary">Save</button>
                      <button onClick={() => void deletePlayer(player.id)} className="cta-btn secondary">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button onClick={saveAllPlayers} className="mt-6 cta-btn">{saving ? "Saving..." : "Save All Players"}</button>
        </div>
      </div>
    </div>
  );
}
