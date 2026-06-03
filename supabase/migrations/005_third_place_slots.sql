-- Third-place slot assignments for FIFA R32 bracket (Art. 12.6)

ALTER TABLE competitions
  ADD COLUMN IF NOT EXISTS third_place_slots JSONB DEFAULT NULL;
