-- Add profile columns to restaraunts table for restaurant sign-up
ALTER TABLE restaraunts
  ADD COLUMN IF NOT EXISTS phone_number         VARCHAR(20),
  ADD COLUMN IF NOT EXISTS address              VARCHAR(500),
  ADD COLUMN IF NOT EXISTS city                 VARCHAR(100),
  ADD COLUMN IF NOT EXISTS cuisine_types        TEXT[],
  ADD COLUMN IF NOT EXISTS price_range          VARCHAR(20),
  ADD COLUMN IF NOT EXISTS dietary_options      TEXT[],
  ADD COLUMN IF NOT EXISTS average_cost_per_person INTEGER,
  ADD COLUMN IF NOT EXISTS website_url          VARCHAR(500),
  ADD COLUMN IF NOT EXISTS image_url            VARCHAR(500),
  ADD COLUMN IF NOT EXISTS description          TEXT;
