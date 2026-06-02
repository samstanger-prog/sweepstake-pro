-- World Cup 2026: 48 teams, FIFA rankings, API-ready columns
-- Clears tournament progress (matches/assignments/scores); keeps participants + competitions.
-- Supersedes 003_rebalance_pots — draw uses fifa_rank at runtime, not static pot column.

ALTER TABLE teams ADD COLUMN IF NOT EXISTS fifa_rank INT;
ALTER TABLE teams ADD COLUMN IF NOT EXISTS api_team_id INT UNIQUE;

DELETE FROM user_teams;
DELETE FROM matches;
DELETE FROM standings;
DELETE FROM participant_scores;
DELETE FROM teams WHERE code != 'TBD';

UPDATE teams SET pot = 'B', seed = 99, group_name = NULL, fifa_rank = NULL, api_team_id = NULL
WHERE code = 'TBD';

INSERT INTO teams (name, code, flag_emoji, pot, seed, group_name, fifa_rank) VALUES
  ('France', 'FRA', '🇫🇷', 'B', 1, 'I', 1),
  ('Spain', 'ESP', '🇪🇸', 'B', 2, 'H', 2),
  ('Argentina', 'ARG', '🇦🇷', 'B', 3, 'J', 3),
  ('England', 'ENG', '🏴󠁧󠁢󠁥󠁮󠁧󠁿', 'B', 4, 'L', 4),
  ('Portugal', 'POR', '🇵🇹', 'B', 5, 'K', 5),
  ('Brazil', 'BRA', '🇧🇷', 'B', 6, 'C', 6),
  ('Netherlands', 'NED', '🇳🇱', 'B', 7, 'F', 7),
  ('Morocco', 'MAR', '🇲🇦', 'B', 8, 'C', 8),
  ('Belgium', 'BEL', '🇧🇪', 'B', 9, 'G', 9),
  ('Germany', 'GER', '🇩🇪', 'B', 10, 'E', 10),
  ('Croatia', 'CRO', '🇭🇷', 'B', 11, 'L', 11),
  ('Colombia', 'COL', '🇨🇴', 'B', 13, 'K', 13),
  ('Senegal', 'SEN', '🇸🇳', 'B', 14, 'I', 14),
  ('Mexico', 'MEX', '🇲🇽', 'B', 15, 'A', 15),
  ('USA', 'USA', '🇺🇸', 'B', 16, 'D', 16),
  ('Uruguay', 'URU', '🇺🇾', 'B', 17, 'H', 17),
  ('Japan', 'JPN', '🇯🇵', 'B', 18, 'F', 18),
  ('Switzerland', 'SUI', '🇨🇭', 'B', 19, 'B', 19),
  ('IR Iran', 'IRN', '🇮🇷', 'B', 21, 'G', 21),
  ('Türkiye', 'TUR', '🇹🇷', 'B', 22, 'D', 22),
  ('Ecuador', 'ECU', '🇪🇨', 'B', 23, 'E', 23),
  ('Austria', 'AUT', '🇦🇹', 'B', 24, 'J', 24),
  ('Korea Republic', 'KOR', '🇰🇷', 'B', 25, 'A', 25),
  ('Australia', 'AUS', '🇦🇺', 'B', 27, 'D', 27),
  ('Algeria', 'ALG', '🇩🇿', 'B', 28, 'J', 28),
  ('Egypt', 'EGY', '🇪🇬', 'B', 29, 'G', 29),
  ('Canada', 'CAN', '🇨🇦', 'B', 30, 'B', 30),
  ('Norway', 'NOR', '🇳🇴', 'B', 31, 'I', 31),
  ('Panama', 'PAN', '🇵🇦', 'B', 33, 'L', 33),
  ('Côte d''Ivoire', 'CIV', '🇨🇮', 'B', 34, 'E', 34),
  ('Sweden', 'SWE', '🇸🇪', 'B', 38, 'F', 38),
  ('Paraguay', 'PAR', '🇵🇾', 'B', 40, 'D', 40),
  ('Czechia', 'CZE', '🇨🇿', 'B', 41, 'A', 41),
  ('Scotland', 'SCO', '🏴󠁧󠁢󠁳󠁣󠁴󠁿', 'B', 43, 'C', 43),
  ('Tunisia', 'TUN', '🇹🇳', 'B', 44, 'F', 44),
  ('Congo DR', 'COD', '🇨🇩', 'B', 46, 'K', 46),
  ('Uzbekistan', 'UZB', '🇺🇿', 'B', 50, 'K', 50),
  ('Qatar', 'QAT', '🇶🇦', 'B', 55, 'B', 55),
  ('Iraq', 'IRQ', '🇮🇶', 'B', 57, 'I', 57),
  ('South Africa', 'RSA', '🇿🇦', 'B', 60, 'A', 60),
  ('Saudi Arabia', 'KSA', '🇸🇦', 'B', 61, 'H', 61),
  ('Jordan', 'JOR', '🇯🇴', 'B', 63, 'J', 63),
  ('Bosnia and Herzegovina', 'BIH', '🇧🇦', 'B', 65, 'B', 65),
  ('Cabo Verde', 'CPV', '🇨🇻', 'B', 69, 'H', 69),
  ('Ghana', 'GHA', '🇬🇭', 'B', 74, 'L', 74),
  ('Curaçao', 'CUW', '🇨🇼', 'B', 82, 'E', 82),
  ('Haiti', 'HAI', '🇭🇹', 'B', 83, 'C', 83),
  ('New Zealand', 'NZL', '🇳🇿', 'B', 85, 'G', 85);

UPDATE competitions SET status = 'open' WHERE status IN ('drawn', 'active', 'complete');
