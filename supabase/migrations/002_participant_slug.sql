-- Friendly profile URLs: /c/{invite_code}/{slug}

ALTER TABLE participants ADD COLUMN IF NOT EXISTS slug TEXT;

-- Backfill slugs from existing names
UPDATE participants
SET slug = lower(regexp_replace(trim(name), '[^a-zA-Z0-9]+', '-', 'g'))
WHERE slug IS NULL;

UPDATE participants SET slug = 'player' WHERE slug IS NULL OR slug = '';

-- Resolve duplicate slugs within the same competition
WITH ranked AS (
  SELECT
    id,
    slug,
    competition_id,
    row_number() OVER (
      PARTITION BY competition_id, slug
      ORDER BY created_at
    ) AS rn
  FROM participants
)
UPDATE participants p
SET slug = ranked.slug || '-' || ranked.rn
FROM ranked
WHERE p.id = ranked.id AND ranked.rn > 1;

ALTER TABLE participants ALTER COLUMN slug SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS participants_competition_slug_unique
  ON participants (competition_id, slug);
