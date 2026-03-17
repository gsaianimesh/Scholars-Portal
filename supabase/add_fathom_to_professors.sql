-- Add fathom_api_key column to professors table
ALTER TABLE professors ADD COLUMN IF NOT EXISTS fathom_api_key TEXT;
