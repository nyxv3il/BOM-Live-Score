"use client";
import { ChangeEvent, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";

interface MatchState {
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
}

export default function AdminDashboard() {
  const [match, setMatch] = useState<Partial<MatchState>>({});
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      const { data } = await supabase
        .from("match_state")
        .select("*")
        .eq("id", 1)
        .single();
      if (data) setMatch(data);
    };

    if (!Cookies.get("admin_session")) {
      router.push("/admin/login");
    } else {
      void fetchData();
    }
  }, [router]);

  const updateMatch = async () => {
    const { error } = await supabase
      .from("match_state")
      .update(match)
      .eq("id", 1);

    if (error) alert("Error updating!");
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setMatch({ ...match, [e.target.name]: e.target.value });
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
    textTransform: "uppercase",
    letterSpacing: "0.1em",
    marginBottom: "0.5rem",
    display: "block",
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-16 px-4">
      <div className="w-full max-w-3xl">
        <h1
          className="text-5xl font-black mb-2 neon-text text-center"
          style={{ color: "var(--primary)" }}
        >
          ⚡ ADMIN PANEL
        </h1>
        <p className="text-center mb-12" style={{ color: "var(--purple)" }}>
          Update Live Match Scorecard
        </p>

        <div
          className="neon-card p-12"
          style={{ backgroundColor: "rgba(255, 255, 255, 0.9)" }}
        >
          <form className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <label style={labelStyles}>Team A Name</label>
                <input
                  name="team_a_name"
                  type="text"
                  value={match.team_a_name || ""}
                  onChange={handleChange}
                  className="focus:outline-none transition-all"
                  style={inputStyles}
                />
              </div>
              <div>
                <label style={labelStyles}>Team B Name</label>
                <input
                  name="team_b_name"
                  type="text"
                  value={match.team_b_name || ""}
                  onChange={handleChange}
                  className="focus:outline-none transition-all"
                  style={inputStyles}
                />
              </div>
              <div>
                <label style={labelStyles}>Batting Team</label>
                <input
                  name="batting_team"
                  type="text"
                  value={match.batting_team || ""}
                  onChange={handleChange}
                  className="focus:outline-none transition-all"
                  style={inputStyles}
                />
              </div>
              <div>
                <label style={labelStyles}>Runs</label>
                <input
                  name="runs"
                  type="number"
                  value={match.runs || 0}
                  onChange={handleChange}
                  className="focus:outline-none transition-all"
                  style={inputStyles}
                />
              </div>
              <div>
                <label style={labelStyles}>Wickets</label>
                <input
                  name="wickets"
                  type="number"
                  value={match.wickets || 0}
                  onChange={handleChange}
                  className="focus:outline-none transition-all"
                  style={inputStyles}
                />
              </div>
              <div>
                <label style={labelStyles}>Overs</label>
                <input
                  name="overs"
                  type="number"
                  step="0.1"
                  value={match.overs || 0}
                  onChange={handleChange}
                  className="focus:outline-none transition-all"
                  style={inputStyles}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <label style={labelStyles}>Current Batsman (On Strike)</label>
                <input
                  name="current_batsman"
                  type="text"
                  value={match.current_batsman || ""}
                  onChange={handleChange}
                  className="focus:outline-none transition-all"
                  style={inputStyles}
                />
              </div>
              <div>
                <label style={labelStyles}>Current Bowler</label>
                <input
                  name="current_bowler"
                  type="text"
                  value={match.current_bowler || ""}
                  onChange={handleChange}
                  className="focus:outline-none transition-all"
                  style={inputStyles}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <label style={labelStyles}>Non-Striker</label>
                <input
                  name="non_striker"
                  type="text"
                  value={match.non_striker || ""}
                  onChange={handleChange}
                  className="focus:outline-none transition-all"
                  style={inputStyles}
                />
              </div>
              <div>
                <label style={labelStyles}>Partnership</label>
                <input
                  name="partnership"
                  type="number"
                  value={match.partnership || ""}
                  onChange={handleChange}
                  className="focus:outline-none transition-all"
                  style={inputStyles}
                />
              </div>
            </div>

            <div>
              <label style={labelStyles}>Recent Balls (1 4 W)</label>
              <input
                name="recent_balls"
                type="text"
                value={match.recent_balls || ""}
                onChange={handleChange}
                className="focus:outline-none transition-all"
                style={inputStyles}
              />
            </div>

            <div>
              <label style={labelStyles}>Current Batsman Stats</label>
              <input
                name="current_batsman_stats"
                type="text"
                value={match.current_batsman_stats || ""}
                onChange={handleChange}
                className="focus:outline-none transition-all"
                style={inputStyles}
              />
            </div>
            <div>
              <label style={labelStyles}>Non-Striker Stats</label>
              <input
                name="non_striker_stats"
                type="text"
                value={match.non_striker_stats || ""}
                onChange={handleChange}
                className="focus:outline-none transition-all"
                style={inputStyles}
              />
            </div>
            <div>
              <label style={labelStyles}>Current Bowler Stats</label>
              <input
                name="current_bowler_stats"
                type="text"
                value={match.current_bowler_stats || ""}
                onChange={handleChange}
                className="focus:outline-none transition-all"
                style={inputStyles}
              />
            </div>

            <button
              onClick={updateMatch}
              className="w-full py-4 font-black text-lg rounded-lg transition-all duration-300 uppercase tracking-widest border-2 mt-8"
              style={{
                backgroundColor: "var(--primary)",
                color: "#fff",
                borderColor: "var(--primary)",
                boxShadow: "0 0 20px rgba(128, 0, 32, 0.22)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow =
                  "0 0 32px rgba(128, 0, 32, 0.35), inset 0 0 10px rgba(201, 151, 26, 0.22)";
                e.currentTarget.style.transform = "translateY(-2px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow =
                  "0 0 20px rgba(128, 0, 32, 0.22)";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              🚀 BROADCAST UPDATE
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
