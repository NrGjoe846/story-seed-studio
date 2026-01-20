-- Add registration_fee column to events table
ALTER TABLE events ADD COLUMN IF NOT EXISTS registration_fee DECIMAL(10, 2);

-- Set a default value for existing events (optional)
UPDATE events SET registration_fee = 99.00 WHERE registration_fee IS NULL;
