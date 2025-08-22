-- Run this in your Supabase SQL Editor
-- Create the referral_links table
CREATE TABLE IF NOT EXISTS referral_links (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  link_token TEXT UNIQUE NOT NULL,
  welcome_message TEXT NOT NULL,
  background_color TEXT NOT NULL CHECK (background_color IN ('blue', 'green', 'purple', 'orange', 'red', 'gray')),
  target_role TEXT NOT NULL CHECK (target_role IN ('investor', 'founder')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  is_active BOOLEAN DEFAULT true
);

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_referral_links_token ON referral_links(link_token);
CREATE INDEX IF NOT EXISTS idx_referral_links_expires ON referral_links(expires_at);

-- Create function to clean up expired links
CREATE OR REPLACE FUNCTION cleanup_expired_referral_links()
RETURNS void AS $$
BEGIN
  UPDATE referral_links 
  SET is_active = false 
  WHERE expires_at < NOW() AND is_active = true;
END;
$$ LANGUAGE plpgsql;

-- Enable Row Level Security
ALTER TABLE referral_links ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow reading active referral links" ON referral_links;
DROP POLICY IF EXISTS "Allow inserting referral links" ON referral_links;
DROP POLICY IF EXISTS "Allow updating referral links" ON referral_links;

-- Create policies
CREATE POLICY "Allow reading active referral links" ON referral_links
  FOR SELECT USING (is_active = true AND expires_at > NOW());

CREATE POLICY "Allow inserting referral links" ON referral_links
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow updating referral links" ON referral_links
  FOR UPDATE USING (true);
