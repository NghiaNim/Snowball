-- Simplified Snowball Database Schema
-- Only the essential tables for the core functionality

-- 1. REFERRAL LINKS TABLE
-- Stores referral links with welcome messages and template references
CREATE TABLE referral_links (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  link_token TEXT UNIQUE NOT NULL,
  welcome_message TEXT NOT NULL,
  background_color TEXT NOT NULL CHECK (background_color IN ('blue', 'green', 'purple', 'orange', 'red', 'gray')),
  target_role TEXT NOT NULL CHECK (target_role IN ('investor', 'founder')),
  investor_template_id UUID REFERENCES page_templates(id) ON DELETE SET NULL,
  founder_template_id UUID REFERENCES page_templates(id) ON DELETE SET NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. PAGE TEMPLATES TABLE  
-- Stores customizable dashboard templates
CREATE TABLE page_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  template_name TEXT NOT NULL,
  description TEXT,
  target_role TEXT NOT NULL CHECK (target_role IN ('investor', 'founder')),
  customizations JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. MONTHLY UPDATES TABLE
-- Simple table for founder monthly updates (demo purposes)
CREATE TABLE monthly_updates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  founder_id TEXT NOT NULL, -- Simple string ID for demo
  title TEXT NOT NULL,
  headline_metrics JSONB DEFAULT '{}',
  key_wins TEXT[] DEFAULT '{}',
  challenges_asks TEXT[] DEFAULT '{}',
  fundraising_status TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- INDEXES for performance
CREATE INDEX idx_referral_links_token ON referral_links(link_token);
CREATE INDEX idx_referral_links_expires ON referral_links(expires_at);
CREATE INDEX idx_page_templates_role ON page_templates(target_role);
CREATE INDEX idx_monthly_updates_founder ON monthly_updates(founder_id);

-- UPDATED_AT TRIGGERS
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_page_templates_updated_at 
  BEFORE UPDATE ON page_templates 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_monthly_updates_updated_at 
  BEFORE UPDATE ON monthly_updates 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- CLEANUP FUNCTION for expired referral links
CREATE OR REPLACE FUNCTION cleanup_expired_referral_links()
RETURNS void AS $$
BEGIN
  UPDATE referral_links 
  SET is_active = false 
  WHERE expires_at < NOW() AND is_active = true;
END;
$$ LANGUAGE plpgsql;

-- ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE referral_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE page_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_updates ENABLE ROW LEVEL SECURITY;

-- Allow reading active, non-expired referral links
CREATE POLICY "Allow reading active referral links" ON referral_links
  FOR SELECT USING (is_active = true AND expires_at > NOW());

-- Allow all operations on referral links (for admin)
CREATE POLICY "Allow all referral link operations" ON referral_links
  FOR ALL USING (true);

-- Allow all operations on page templates (for admin and reading)
CREATE POLICY "Allow all page template operations" ON page_templates
  FOR ALL USING (true);

-- Allow all operations on monthly updates (for demo)
CREATE POLICY "Allow all monthly update operations" ON monthly_updates
  FOR ALL USING (true);

-- INSERT DEFAULT TEMPLATES
INSERT INTO page_templates (template_name, description, target_role, customizations) VALUES
(
  'Default Investor',
  'Default investor dashboard template',
  'investor',
  '{
    "header": {
      "title": "Investor Dashboard", 
      "subtitle": "Deal Flow"
    },
    "content": {
      "searchPlaceholder": "Search by name or description...",
      "companyCardTexts": {
        "trackButtonText": "Track",
        "knockButtonText": "🚪 Knock",
        "industryLabel": "Industry:",
        "stageLabel": "Stage:", 
        "targetLabel": "Target:",
        "locationLabel": "Location:",
        "metricsTitle": "Key Metrics"
      }
    },
    "styling": {
      "primaryColor": "#3B82F6",
      "cardStyle": "shadow"
    }
  }'
),
(
  'Default Founder',
  'Default founder dashboard template', 
  'founder',
  '{
    "header": {
      "title": "Founder Dashboard",
      "subtitle": "Fundraising"
    },
    "content": {
      "tabLabels": {
        "overview": "Overview",
        "monthlyUpdates": "Monthly Updates", 
        "investors": "Investors",
        "profile": "Profile"
      },
      "overviewTexts": {
        "fundraisingStatusTitle": "Fundraising Status",
        "profileCompletionTitle": "Profile Completion",
        "recentActivityTitle": "Recent Activity"
      },
      "monthlyUpdateTexts": {
        "addUpdateButton": "+ Add Update",
        "headlineMetricsTitle": "Headline Metrics",
        "keyWinsTitle": "Key Wins", 
        "challengesAsksTitle": "Challenges & Asks",
        "fundraisingStatusTitle": "Fundraising Status",
        "likeButton": "👍 Like",
        "commentButton": "💬 Comment",
        "dmButton": "✉️ DM"
      },
      "investorsTexts": {
        "interestTitle": "Investor Interest",
        "trackingText": "investors tracking your company",
        "acceptMeetingText": "Accept Meeting",
        "declineMeetingText": "Decline"
      }
    },
    "styling": {
      "primaryColor": "#10B981",
      "cardStyle": "shadow"
    }
  }'
);
