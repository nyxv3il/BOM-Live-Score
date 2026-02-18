-- Full reset + setup for BOM live scoring on Supabase
-- WARNING: this drops existing scoring tables and data.

begin;

create extension if not exists pgcrypto;

-- Drop old objects in dependency order

drop trigger if exists trg_live_state_updated_at on public.live_match_state;
drop function if exists public.touch_live_state_updated_at();

drop table if exists public.ball_events cascade;
drop table if exists public.live_match_state cascade;
drop table if exists public.players cascade;
drop table if exists public.matches cascade;

-- Core tables

create table public.matches (
  id text primary key,
  label text not null,
  format text not null,
  team_a_name text not null,
  team_a_abbr text not null,
  team_a_emoji text not null default 'A',
  team_b_name text not null,
  team_b_abbr text not null,
  team_b_emoji text not null default 'N',
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.players (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  team_code text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (team_code, name)
);

create table public.live_match_state (
  id integer primary key,
  active_match_id text references public.matches(id) on delete set null,
  status text not null default 'idle' check (status in ('idle', 'live', 'paused', 'ended')),
  pause_reason text,
  batting_team_code text,
  bowling_team_code text,
  current_inning integer not null default 1 check (current_inning between 1 and 4),
  current_score integer not null default 0 check (current_score >= 0),
  current_wickets integer not null default 0 check (current_wickets >= 0),
  previous_innings_score integer not null default 0 check (previous_innings_score >= 0),
  over_count integer not null default 0 check (over_count >= 0),
  ball_in_over integer not null default 0 check (ball_in_over between 0 and 5),
  current_striker_player_id uuid references public.players(id) on delete set null,
  current_non_striker_player_id uuid references public.players(id) on delete set null,
  current_bowler_player_id uuid references public.players(id) on delete set null,
  updated_at timestamptz not null default now()
);

create table public.ball_events (
  id bigint generated always as identity primary key,
  match_id text not null references public.matches(id) on delete cascade,
  ball_type text not null check (ball_type in ('runs', 'wicket', 'wide', 'no_ball', 'bye', 'leg_bye', 'penalty')),
  runs_scored integer not null default 0 check (runs_scored >= 0),
  wicket boolean not null default false,
  striker_player_id uuid references public.players(id) on delete set null,
  non_striker_player_id uuid references public.players(id) on delete set null,
  bowler_player_id uuid references public.players(id) on delete set null,
  wicket_fielder_player_id uuid references public.players(id) on delete set null,
  created_at timestamptz not null default now()
);

create index idx_matches_sort on public.matches(sort_order);
create index idx_players_active on public.players(is_active, team_code, name);
create index idx_ball_events_match_id on public.ball_events(match_id, id);

-- Auto-update timestamp on live state changes

create function public.touch_live_state_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_live_state_updated_at
before update on public.live_match_state
for each row
execute function public.touch_live_state_updated_at();

-- Seed matches from backend migration/schema.surql

insert into public.matches (
  id,
  label,
  format,
  team_a_name,
  team_a_abbr,
  team_a_emoji,
  team_b_name,
  team_b_abbr,
  team_b_emoji,
  sort_order
)
values
  ('BOM_TST_2026', 'Battle of the Maroons 2026 - TST', 'TST', 'Ananda College', 'AND', 'A', 'Nalanda College', 'NAL', 'N', 1),
  ('BOM_ODI_2026', 'Battle of the Maroons 2026 - ODI', 'ODI', 'Ananda College', 'AND', 'A', 'Nalanda College', 'NAL', 'N', 2);

-- Seed players from backend migration/schema.surql

insert into public.players (name, team_code) values
  ('George Washington', 'ananda_college'),
  ('Abraham Lincoln', 'ananda_college'),
  ('Theodore Roosevelt', 'ananda_college'),
  ('John F. Kennedy', 'ananda_college'),
  ('Franklin D. Roosevelt', 'ananda_college'),
  ('Thomas Jefferson', 'ananda_college'),
  ('James Madison', 'ananda_college'),
  ('Andrew Jackson', 'ananda_college'),
  ('Ulysses S. Grant', 'ananda_college'),
  ('Woodrow Wilson', 'ananda_college'),
  ('Harry S. Truman', 'ananda_college'),
  ('Dwight D. Eisenhower', 'ananda_college'),
  ('Ronald Reagan', 'ananda_college'),
  ('Barack Obama', 'ananda_college'),
  ('Joe Biden', 'ananda_college'),
  ('Nelson Mandela', 'nalanda_college'),
  ('Vladimir Putin', 'nalanda_college'),
  ('Emmanuel Macron', 'nalanda_college'),
  ('Xi Jinping', 'nalanda_college'),
  ('Justin Trudeau', 'nalanda_college'),
  ('Boris Johnson', 'nalanda_college'),
  ('Angela Merkel', 'nalanda_college'),
  ('Recep Tayyip Erdogan', 'nalanda_college'),
  ('Shinzo Abe', 'nalanda_college'),
  ('Lee Kuan Yew', 'nalanda_college'),
  ('Mahinda Rajapaksa', 'nalanda_college'),
  ('Gotabaya Rajapaksa', 'nalanda_college'),
  ('Anura Kumara Dissanayake', 'nalanda_college'),
  ('Sajith Premadasa', 'nalanda_college'),
  ('Ranil Wickremesinghe', 'nalanda_college');

insert into public.live_match_state (id, status)
values (1, 'idle');

-- Realtime subscriptions

alter publication supabase_realtime add table public.live_match_state;
alter publication supabase_realtime add table public.ball_events;
alter publication supabase_realtime add table public.matches;
alter publication supabase_realtime add table public.players;

-- RLS + read policies for public score page

alter table public.matches enable row level security;
alter table public.players enable row level security;
alter table public.live_match_state enable row level security;
alter table public.ball_events enable row level security;

create policy "public read matches"
on public.matches
for select
to anon, authenticated
using (true);

create policy "public read players"
on public.players
for select
to anon, authenticated
using (true);

create policy "public read live state"
on public.live_match_state
for select
to anon, authenticated
using (true);

create policy "public read ball events"
on public.ball_events
for select
to anon, authenticated
using (true);

commit;
