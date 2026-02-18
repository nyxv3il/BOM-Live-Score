import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { hasAdminSession } from "@/lib/admin-auth";
import { createServiceClient } from "@/lib/server-supabase";

async function ensureLiveStateRow() {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("live_match_state")
    .select("id")
    .eq("id", 1)
    .maybeSingle();

  if (!data) {
    await supabase.from("live_match_state").insert({ id: 1, status: "idle" });
  }
}

export async function GET() {
  const cookieStore = await cookies();
  if (!hasAdminSession(cookieStore)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await ensureLiveStateRow();
  const supabase = createServiceClient();

  const [{ data: matches, error: matchError }, { data: players, error: playerError }, { data: liveState, error: stateError }] =
    await Promise.all([
      supabase.from("matches").select("*").order("sort_order", { ascending: true }),
      supabase.from("players").select("*").eq("is_active", true).order("name", { ascending: true }),
      supabase.from("live_match_state").select("*").eq("id", 1).single(),
    ]);

  if (matchError || playerError || stateError) {
    return NextResponse.json(
      { error: matchError?.message || playerError?.message || stateError?.message || "Failed to load data" },
      { status: 500 },
    );
  }

  const { data: balls, error: ballsError } = liveState?.active_match_id
    ? await supabase
        .from("ball_events")
        .select("*")
        .eq("match_id", liveState.active_match_id)
        .order("id", { ascending: true })
        .limit(120)
    : { data: [], error: null as null | { message?: string } };

  if (ballsError) {
    return NextResponse.json({ error: ballsError.message || "Failed to load balls" }, { status: 500 });
  }

  return NextResponse.json({
    matches,
    players,
    liveState,
    balls,
  });
}

