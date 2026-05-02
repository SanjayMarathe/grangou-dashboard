ALTER TABLE restaraunts
  ADD COLUMN IF NOT EXISTS square_access_token TEXT,
  ADD COLUMN IF NOT EXISTS square_merchant_id TEXT,
  ADD COLUMN IF NOT EXISTS square_connected BOOLEAN DEFAULT FALSE;
