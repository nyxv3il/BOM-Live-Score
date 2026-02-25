-- Full bootstrap for an empty Supabase DB
-- Recreates all tables used by the Next.js app.

begin;

-- Core live match state (single row id=1 used by app)
create table if not exists public.match_state (
  id bigint primary key,
  created_at timestamptz not null default now(),
  team_a_name text not null default '',
  team_b_name text not null default '',
  match_status text not null default 'scheduled',
  inning integer not null default 1,
  team_a_runs integer not null default 0,
  team_a_wickets integer not null default 0,
  team_a_overs numeric(4,1) not null default 0,
  team_b_runs integer not null default 0,
  team_b_wickets integer not null default 0,
  team_b_overs numeric(4,1) not null default 0,
  batting_team text not null default '',
  runs integer not null default 0,
  wickets integer not null default 0,
  overs numeric(4,1) not null default 0,
  recent_balls text not null default '',
  current_batsman text,
  current_bowler text,
  non_striker text,
  partnership text,
  current_batsman_stats text,
  non_striker_stats text,
  current_bowler_stats text,
  series_name text,
  match_logo_url text,
  match_description text,
  match_1_date text,
  match_1_time text,
  match_1_venue text,
  match_1_format text,
  match_2_date text,
  match_2_time text,
  match_2_venue text,
  match_2_format text,
  match_3_date text,
  match_3_time text,
  match_3_venue text,
  match_3_format text,
  match_4_date text,
  match_4_time text,
  match_4_venue text,
  match_4_format text
);
alter table public.match_state disable row level security;

-- Team roster used by admin dropdowns
create table if not exists public.team_players (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  team_name text not null,
  player_name text not null
);
alter table public.team_players disable row level security;

create unique index if not exists uq_team_players_team_player
  on public.team_players(team_name, player_name);

create index if not exists idx_team_players_team
  on public.team_players(team_name);

-- Per-player stats used by admin + summary page
create table if not exists public.player_scores (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  team_name text not null,
  player_name text not null,
  runs integer not null default 0,
  balls integer not null default 0,
  fours integer not null default 0,
  sixes integer not null default 0,
  strike_rate numeric(6,2) not null default 0,
  wickets integer not null default 0,
  overs numeric(4,1) not null default 0,
  economy numeric(6,2) not null default 0
);
alter table public.player_scores disable row level security;

create index if not exists idx_player_scores_team_player
  on public.player_scores(team_name, player_name);

create unique index if not exists uq_player_scores_team_player
  on public.player_scores(team_name, player_name);

-- Seed the required single match row
insert into public.match_state (
  id,
  team_a_name,
  team_b_name,
  match_status,
  inning,
  team_a_runs,
  team_a_wickets,
  team_a_overs,
  team_b_runs,
  team_b_wickets,
  team_b_overs,
  batting_team,
  runs,
  wickets,
  overs,
  recent_balls,
  current_batsman,
  current_bowler,
  non_striker,
  partnership,
  current_batsman_stats,
  non_striker_stats,
  current_bowler_stats,
  series_name,
  match_logo_url,
  match_description,
  match_1_date,
  match_1_time,
  match_1_venue,
  match_1_format,
  match_2_date,
  match_2_time,
  match_2_venue,
  match_2_format,
  match_3_date,
  match_3_time,
  match_3_venue,
  match_3_format,
  match_4_date,
  match_4_time,
  match_4_venue,
  match_4_format
)
values (
  1,
  'School A',
  'School B',
  'scheduled',
  1,
  0,
  0,
  0,
  0,
  0,
  0,
  'School A',
  0,
  0,
  0,
  '',
  null,
  null,
  null,
  '0 (0)',
  '0 (0)',
  '0 (0)',
  '0-0-0-0',
  'Battle of the Maroons Series',
  '',
  'Annual inter-school cricket series.',
  '2026-02-20',
  '9:00 AM',
  'St. Maroon Grounds, Colombo',
  '50 Overs',
  '2026-02-22',
  '2:30 PM',
  'Royal Turf Arena, Kandy',
  'T20',
  '2026-02-25',
  '10:00 AM',
  'Victory Sports Complex, Galle',
  '50 Overs',
  '2026-02-27',
  '10:00 AM',
  'Victory Sports Complex, Galle',
  '50 Overs'
)
on conflict (id) do update
set
  team_a_name = excluded.team_a_name,
  team_b_name = excluded.team_b_name,
  match_status = excluded.match_status,
  inning = excluded.inning,
  team_a_runs = excluded.team_a_runs,
  team_a_wickets = excluded.team_a_wickets,
  team_a_overs = excluded.team_a_overs,
  team_b_runs = excluded.team_b_runs,
  team_b_wickets = excluded.team_b_wickets,
  team_b_overs = excluded.team_b_overs,
  batting_team = excluded.batting_team,
  runs = excluded.runs,
  wickets = excluded.wickets,
  overs = excluded.overs,
  recent_balls = excluded.recent_balls,
  current_batsman = excluded.current_batsman,
  current_bowler = excluded.current_bowler,
  non_striker = excluded.non_striker,
  partnership = excluded.partnership,
  current_batsman_stats = excluded.current_batsman_stats,
  non_striker_stats = excluded.non_striker_stats,
  current_bowler_stats = excluded.current_bowler_stats,
  series_name = excluded.series_name,
  match_logo_url = excluded.match_logo_url,
  match_description = excluded.match_description,
  match_1_date = excluded.match_1_date,
  match_1_time = excluded.match_1_time,
  match_1_venue = excluded.match_1_venue,
  match_1_format = excluded.match_1_format,
  match_2_date = excluded.match_2_date,
  match_2_time = excluded.match_2_time,
  match_2_venue = excluded.match_2_venue,
  match_2_format = excluded.match_2_format,
  match_3_date = excluded.match_3_date,
  match_3_time = excluded.match_3_time,
  match_3_venue = excluded.match_3_venue,
  match_3_format = excluded.match_3_format,
  match_4_date = excluded.match_4_date,
  match_4_time = excluded.match_4_time,
  match_4_venue = excluded.match_4_venue,
  match_4_format = excluded.match_4_format;

-- Backfill team roster from player_scores if rows exist
insert into public.team_players (team_name, player_name)
select distinct team_name, player_name
from public.player_scores
where btrim(team_name) <> '' and btrim(player_name) <> ''
on conflict (team_name, player_name) do nothing;

-- Permissions for browser anon key usage from this app
grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on public.match_state to anon, authenticated;
grant select, insert, update, delete on public.team_players to anon, authenticated;
grant select, insert, update, delete on public.player_scores to anon, authenticated;
grant usage, select on all sequences in schema public to anon, authenticated;

-- Ensure realtime receives changes used by the app subscriptions
-- (match_state and player_scores are subscribed from the frontend)
do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'match_state'
  ) then
    alter publication supabase_realtime add table public.match_state;
  end if;

  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'player_scores'
  ) then
    alter publication supabase_realtime add table public.player_scores;
  end if;
end
$$;

commit;
