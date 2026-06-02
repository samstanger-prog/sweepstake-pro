-- SweepStake Pro initial schema

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Global team pool (24 teams)
CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  flag_emoji TEXT NOT NULL DEFAULT '🏳️',
  pot TEXT NOT NULL CHECK (pot IN ('A', 'B')),
  seed INT NOT NULL,
  group_name TEXT
);

CREATE TABLE competitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  invite_code TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'drawn', 'active', 'complete')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competition_id UUID NOT NULL REFERENCES competitions(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (competition_id, name)
);

CREATE TABLE user_teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES teams(id),
  pot TEXT NOT NULL CHECK (pot IN ('A', 'B')),
  competition_id UUID NOT NULL REFERENCES competitions(id) ON DELETE CASCADE,
  UNIQUE (participant_id, pot),
  UNIQUE (competition_id, team_id)
);

CREATE TABLE matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competition_id UUID NOT NULL REFERENCES competitions(id) ON DELETE CASCADE,
  fixture_id INT NOT NULL,
  home_team_id UUID NOT NULL REFERENCES teams(id),
  away_team_id UUID NOT NULL REFERENCES teams(id),
  home_goals INT,
  away_goals INT,
  status TEXT NOT NULL DEFAULT 'NS' CHECK (status IN ('NS', 'FT')),
  round TEXT NOT NULL,
  group_name TEXT,
  knockout_order INT,
  winner_team_id UUID REFERENCES teams(id),
  next_match_fixture_id INT,
  UNIQUE (competition_id, fixture_id)
);

CREATE TABLE standings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competition_id UUID NOT NULL REFERENCES competitions(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES teams(id),
  group_name TEXT NOT NULL,
  played INT NOT NULL DEFAULT 0,
  won INT NOT NULL DEFAULT 0,
  drawn INT NOT NULL DEFAULT 0,
  lost INT NOT NULL DEFAULT 0,
  gf INT NOT NULL DEFAULT 0,
  ga INT NOT NULL DEFAULT 0,
  gd INT NOT NULL DEFAULT 0,
  pts INT NOT NULL DEFAULT 0,
  UNIQUE (competition_id, team_id)
);

CREATE TABLE participant_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE UNIQUE,
  competition_id UUID NOT NULL REFERENCES competitions(id) ON DELETE CASCADE,
  match_points INT NOT NULL DEFAULT 0,
  progression_points INT NOT NULL DEFAULT 0,
  bonus_points INT NOT NULL DEFAULT 0,
  total_points INT NOT NULL DEFAULT 0,
  breakdown JSONB NOT NULL DEFAULT '{"teams":[]}'::jsonb
);

CREATE INDEX idx_participants_competition ON participants(competition_id);
CREATE INDEX idx_matches_competition ON matches(competition_id);
CREATE INDEX idx_standings_competition ON standings(competition_id);
CREATE INDEX idx_user_teams_competition ON user_teams(competition_id);
CREATE INDEX idx_participant_scores_competition ON participant_scores(competition_id);

-- RLS
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE standings ENABLE ROW LEVEL SECURITY;
ALTER TABLE participant_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read teams" ON teams FOR SELECT USING (true);
CREATE POLICY "Public read competitions" ON competitions FOR SELECT USING (true);
CREATE POLICY "Public read participants" ON participants FOR SELECT USING (true);
CREATE POLICY "Public read user_teams" ON user_teams FOR SELECT USING (true);
CREATE POLICY "Public read matches" ON matches FOR SELECT USING (true);
CREATE POLICY "Public read standings" ON standings FOR SELECT USING (true);
CREATE POLICY "Public read participant_scores" ON participant_scores FOR SELECT USING (true);

CREATE POLICY "Anon insert participants" ON participants
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM competitions c
      WHERE c.id = competition_id AND c.status = 'open'
    )
  );

-- Seed 24 teams: 8 Pot A, 16 Pot B, 6 groups of 4
INSERT INTO teams (name, code, flag_emoji, pot, seed, group_name) VALUES
  ('Brazil', 'BRA', '🇧🇷', 'A', 1, 'A'),
  ('Argentina', 'ARG', '🇦🇷', 'A', 2, 'A'),
  ('France', 'FRA', '🇫🇷', 'A', 3, 'B'),
  ('England', 'ENG', '🏴󠁧󠁢󠁥󠁮󠁧󠁿', 'A', 4, 'B'),
  ('Spain', 'ESP', '🇪🇸', 'A', 5, 'C'),
  ('Germany', 'GER', '🇩🇪', 'A', 6, 'C'),
  ('Portugal', 'POR', '🇵🇹', 'A', 7, 'D'),
  ('Netherlands', 'NED', '🇳🇱', 'A', 8, 'D'),
  ('Belgium', 'BEL', '🇧🇪', 'B', 9, 'E'),
  ('Croatia', 'CRO', '🇭🇷', 'B', 10, 'E'),
  ('Italy', 'ITA', '🇮🇹', 'B', 11, 'F'),
  ('Uruguay', 'URU', '🇺🇾', 'B', 12, 'F'),
  ('Morocco', 'MAR', '🇲🇦', 'B', 13, 'A'),
  ('Japan', 'JPN', '🇯🇵', 'B', 14, 'B'),
  ('USA', 'USA', '🇺🇸', 'B', 15, 'C'),
  ('Mexico', 'MEX', '🇲🇽', 'B', 16, 'D'),
  ('Switzerland', 'SUI', '🇨🇭', 'B', 17, 'E'),
  ('Denmark', 'DEN', '🇩🇰', 'B', 18, 'F'),
  ('Serbia', 'SRB', '🇷🇸', 'B', 19, 'A'),
  ('Poland', 'POL', '🇵🇱', 'B', 20, 'B'),
  ('Australia', 'AUS', '🇦🇺', 'B', 21, 'C'),
  ('Ecuador', 'ECU', '🇪🇨', 'B', 22, 'D'),
  ('Senegal', 'SEN', '🇸🇳', 'B', 23, 'E'),
  ('Wales', 'WAL', '🏴󠁧󠁢󠁷󠁬󠁳󠁿', 'B', 24, 'F'),
  ('TBD', 'TBD', '❓', 'B', 99, NULL);
