ALTER TABLE restaraunts
  ADD COLUMN IF NOT EXISTS clover_access_token TEXT,
  ADD COLUMN IF NOT EXISTS clover_merchant_id TEXT,
  ADD COLUMN IF NOT EXISTS clover_connected BOOLEAN DEFAULT FALSE;
