export type MatchStatus = "idle" | "live" | "paused" | "ended";

export type BallType =
  | "runs"
  | "wicket"
  | "wide"
  | "no_ball"
  | "bye"
  | "leg_bye"
  | "penalty";

export interface MatchRow {
  id: string;
  label: string;
  format: string;
  team_a_name: string;
  team_a_abbr: string;
  team_a_emoji: string;
  team_b_name: string;
  team_b_abbr: string;
  team_b_emoji: string;
  sort_order: number;
}

export interface PlayerRow {
  id: string;
  name: string;
  team_code: string;
  is_active: boolean;
}

export interface LiveStateRow {
  id: number;
  active_match_id: string | null;
  status: MatchStatus;
  pause_reason: string | null;
  batting_team_code: string | null;
  bowling_team_code: string | null;
  current_inning: number;
  current_score: number;
  current_wickets: number;
  previous_innings_score: number;
  over_count: number;
  ball_in_over: number;
  current_striker_player_id: string | null;
  current_non_striker_player_id: string | null;
  current_bowler_player_id: string | null;
  updated_at: string;
}

export interface BallEventRow {
  id: number;
  match_id: string;
  ball_type: BallType;
  runs_scored: number;
  wicket: boolean;
  striker_player_id: string;
  non_striker_player_id: string;
  bowler_player_id: string;
  wicket_fielder_player_id: string | null;
  created_at: string;
}

export function isLegalDelivery(ballType: BallType): boolean {
  return ballType !== "wide" && ballType !== "no_ball";
}

export function scoreDelta(ballType: BallType, runsScored: number): number {
  if (["runs", "bye", "leg_bye", "penalty", "wicket"].includes(ballType)) {
    return runsScored;
  }

  if (ballType === "wide" || ballType === "no_ball") {
    return runsScored + 1;
  }

  return 0;
}

