-- Live score sync from worldcup26.ir

ALTER TABLE matches
  ADD COLUMN IF NOT EXISTS is_live BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE competitions
  ADD COLUMN IF NOT EXISTS worldcup26_last_sync_at TIMESTAMPTZ;
