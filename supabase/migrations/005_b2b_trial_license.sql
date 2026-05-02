-- B2B dashboard trial and license (access code) columns
ALTER TABLE restaraunts
  ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS license_activated_at TIMESTAMPTZ;

-- Backfill trial end for existing rows
UPDATE restaraunts
SET trial_ends_at = created_at + interval '7 days'
WHERE trial_ends_at IS NULL;

-- Grandfather existing partners: treat as licensed without entering a code
UPDATE restaraunts
SET license_activated_at = now()
WHERE license_activated_at IS NULL;
