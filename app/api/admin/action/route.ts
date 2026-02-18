import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { hasAdminSession } from "@/lib/admin-auth";
import { createServiceClient } from "@/lib/server-supabase";
import type { BallType } from "@/lib/live-types";
import { isLegalDelivery, scoreDelta } from "@/lib/live-types";

type StartMatchPayload = {
  type: "start_match";
  matchId: string;
  openingTeam?: string;
};

type PausePayload = {
  type: "pause_match";
  reason?: string;
};

type EndPayload = {
  type: "end_match";
};

type SwitchInningsPayload = {
  type: "switch_innings";
};

type TossPayload = {
  type: "toss";
};

type BallPayload = {
  type: "record_ball";
  matchId: string;
  ballType: BallType;
  runsScored: number;
  wicket: boolean;
  strikerPlayerId: string;
  nonStrikerPlayerId: string;
  bowlerPlayerId: string;
  wicketFielderPlayerId?: string | null;
};

type ActionPayload =
  | StartMatchPayload
  | PausePayload
  | EndPayload
  | SwitchInningsPayload
  | TossPayload
  | BallPayload;

async function unauthorizedIfNeeded() {
  const cookieStore = await cookies();
  if (!hasAdminSession(cookieStore)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return null;
}

async function getLiveState() {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("live_match_state")
    .select("*")
    .eq("id", 1)
    .maybeSingle();

  if (!data) {
    const { data: created } = await supabase
      .from("live_match_state")
      .insert({ id: 1, status: "idle" })
      .select("*")
      .single();
    return created;
  }

  return data;
}

export async function POST(request: Request) {
  const unauthorized = await unauthorizedIfNeeded();
  if (unauthorized) return unauthorized;

  const payload = (await request.json().catch(() => null)) as ActionPayload | null;
  if (!payload?.type) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const supabase = createServiceClient();

  if (payload.type === "toss") {
    return NextResponse.json({ ok: true });
  }

  if (payload.type === "start_match") {
    const matchId = payload.matchId?.trim();
    if (!matchId) {
      return NextResponse.json({ error: "Match ID is required" }, { status: 400 });
    }

    const { data: matchRow, error: matchError } = await supabase
      .from("matches")
      .select("team_a_abbr, team_b_abbr")
      .eq("id", matchId)
      .maybeSingle();

    if (matchError || !matchRow) {
      return NextResponse.json({ error: "Match not found" }, { status: 400 });
    }

    const openingRaw = payload.openingTeam?.trim().toLowerCase() || "";
    const teamA = matchRow.team_a_abbr.toLowerCase();
    const teamB = matchRow.team_b_abbr.toLowerCase();

    const battingTeam =
      openingRaw === teamA || openingRaw === "team_a"
        ? matchRow.team_a_abbr
        : openingRaw === teamB || openingRaw === "team_b"
          ? matchRow.team_b_abbr
          : matchRow.team_a_abbr;

    const bowlingTeam =
      battingTeam === matchRow.team_a_abbr ? matchRow.team_b_abbr : matchRow.team_a_abbr;

    const { error } = await supabase
      .from("live_match_state")
      .upsert(
        {
          id: 1,
          active_match_id: matchId,
          status: "live",
          pause_reason: null,
          batting_team_code: battingTeam,
          bowling_team_code: bowlingTeam,
          current_inning: 1,
          current_score: 0,
          current_wickets: 0,
          previous_innings_score: 0,
          over_count: 0,
          ball_in_over: 0,
          current_striker_player_id: null,
          current_non_striker_player_id: null,
          current_bowler_player_id: null,
        },
        { onConflict: "id" },
      );

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await supabase.from("ball_events").delete().eq("match_id", matchId);
    return NextResponse.json({ ok: true });
  }

  if (payload.type === "pause_match") {
    const { error } = await supabase
      .from("live_match_state")
      .update({
        status: "paused",
        pause_reason: payload.reason?.trim() || "Match paused",
      })
      .eq("id", 1);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  }

  if (payload.type === "end_match") {
    const { error } = await supabase
      .from("live_match_state")
      .update({ status: "ended" })
      .eq("id", 1);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  }

  if (payload.type === "switch_innings") {
    const liveState = await getLiveState();
    if (!liveState?.active_match_id) {
      return NextResponse.json({ error: "No active match" }, { status: 400 });
    }

    const nextInning = Number(liveState.current_inning || 1) + 1;
    const { error } = await supabase
      .from("live_match_state")
      .update({
        status: "live",
        pause_reason: null,
        previous_innings_score: liveState.current_score,
        current_score: 0,
        current_wickets: 0,
        over_count: 0,
        ball_in_over: 0,
        current_inning: nextInning,
        batting_team_code: liveState.bowling_team_code,
        bowling_team_code: liveState.batting_team_code,
        current_striker_player_id: null,
        current_non_striker_player_id: null,
        current_bowler_player_id: null,
      })
      .eq("id", 1);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  }

  const liveState = await getLiveState();
  if (!liveState?.active_match_id) {
    return NextResponse.json({ error: "No active match" }, { status: 400 });
  }

  if (payload.type !== "record_ball") {
    return NextResponse.json({ error: "Unsupported action" }, { status: 400 });
  }

  if (!payload.strikerPlayerId || !payload.nonStrikerPlayerId || !payload.bowlerPlayerId) {
    return NextResponse.json(
      { error: "Striker, non-striker and bowler are required" },
      { status: 400 },
    );
  }

  const delta = scoreDelta(payload.ballType, payload.runsScored);
  const legal = isLegalDelivery(payload.ballType);

  let overCount = liveState.over_count;
  let ballInOver = liveState.ball_in_over;

  if (legal) {
    ballInOver += 1;
    if (ballInOver >= 6) {
      overCount += 1;
      ballInOver = 0;
    }
  }

  const { error: ballError } = await supabase.from("ball_events").insert({
    match_id: liveState.active_match_id,
    ball_type: payload.ballType,
    runs_scored: payload.runsScored,
    wicket: payload.wicket,
    striker_player_id: payload.strikerPlayerId,
    non_striker_player_id: payload.nonStrikerPlayerId,
    bowler_player_id: payload.bowlerPlayerId,
    wicket_fielder_player_id: payload.wicket ? payload.wicketFielderPlayerId || null : null,
  });

  if (ballError) {
    return NextResponse.json({ error: ballError.message }, { status: 500 });
  }

  const { error: updateError } = await supabase
    .from("live_match_state")
    .update({
      current_score: liveState.current_score + delta,
      current_wickets: liveState.current_wickets + (payload.wicket ? 1 : 0),
      over_count: overCount,
      ball_in_over: ballInOver,
      current_striker_player_id: payload.strikerPlayerId,
      current_non_striker_player_id: payload.nonStrikerPlayerId,
      current_bowler_player_id: payload.bowlerPlayerId,
      status: "live",
      pause_reason: null,
    })
    .eq("id", 1);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

