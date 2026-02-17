-- Add new columns to your existing match_state table
ALTER TABLE public.match_state
  ADD COLUMN IF NOT EXISTS series_name text,
  ADD COLUMN IF NOT EXISTS match_logo_url text,
  ADD COLUMN IF NOT EXISTS match_description text,
  ADD COLUMN IF NOT EXISTS match_1_date text,
  ADD COLUMN IF NOT EXISTS match_1_time text,
  ADD COLUMN IF NOT EXISTS match_1_venue text,
  ADD COLUMN IF NOT EXISTS match_1_format text,
  ADD COLUMN IF NOT EXISTS match_2_date text,
  ADD COLUMN IF NOT EXISTS match_2_time text,
  ADD COLUMN IF NOT EXISTS match_2_venue text,
  ADD COLUMN IF NOT EXISTS match_2_format text,
  ADD COLUMN IF NOT EXISTS match_3_date text,
  ADD COLUMN IF NOT EXISTS match_3_time text,
  ADD COLUMN IF NOT EXISTS match_3_venue text,
  ADD COLUMN IF NOT EXISTS match_3_format text;

-- Optional seed/default for existing id=1 row
UPDATE public.match_state
SET
  series_name = COALESCE(series_name, 'Battle of the Maroons Series'),
  match_description = COALESCE(match_description, 'Annual inter-school cricket series.'),
  match_1_date = COALESCE(match_1_date, '2026-02-20'),
  match_1_time = COALESCE(match_1_time, '9:00 AM'),
  match_1_venue = COALESCE(match_1_venue, 'St. Maroon Grounds, Colombo'),
  match_1_format = COALESCE(match_1_format, '50 Overs'),
  match_2_date = COALESCE(match_2_date, '2026-02-22'),
  match_2_time = COALESCE(match_2_time, '2:30 PM'),
  match_2_venue = COALESCE(match_2_venue, 'Royal Turf Arena, Kandy'),
  match_2_format = COALESCE(match_2_format, 'T20'),
  match_3_date = COALESCE(match_3_date, '2026-02-25'),
  match_3_time = COALESCE(match_3_time, '10:00 AM'),
  match_3_venue = COALESCE(match_3_venue, 'Victory Sports Complex, Galle'),
  match_3_format = COALESCE(match_3_format, '50 Overs')
WHERE id = 1;

-- Create a separate table for all players and detailed score stats
CREATE TABLE IF NOT EXISTS public.player_scores (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now(),
  team_name text NOT NULL,
  player_name text NOT NULL,
  runs integer NOT NULL DEFAULT 0,
  balls integer NOT NULL DEFAULT 0,
  fours integer NOT NULL DEFAULT 0,
  sixes integer NOT NULL DEFAULT 0,
  strike_rate numeric(6,2) NOT NULL DEFAULT 0,
  wickets integer NOT NULL DEFAULT 0,
  overs numeric(4,1) NOT NULL DEFAULT 0,
  economy numeric(6,2) NOT NULL DEFAULT 0
);

-- Useful index for summary page grouping/sorting
CREATE INDEX IF NOT EXISTS idx_player_scores_team_player
  ON public.player_scores(team_name, player_name);
