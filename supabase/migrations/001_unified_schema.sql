-- UNIFIED SNOWBALL SCHEMA
-- Creates all necessary tables from scratch in the correct order

-- 1. PAGE TEMPLATES TABLE (must be first for foreign key references)
CREATE TABLE page_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  template_name TEXT NOT NULL,
  description TEXT,
  target_role TEXT NOT NULL CHECK (target_role IN ('investor', 'founder')),
  customizations JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. REFERRAL LINKS TABLE (references page_templates)
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

-- 3. MONTHLY UPDATES TABLE (simple table for founder updates demo)
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
CREATE INDEX idx_referral_links_active ON referral_links(is_active);
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

-- 4. USERS TABLE (using Supabase Auth)
CREATE TABLE users (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('investor', 'founder', 'admin')),
  profile_complete BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. INVESTOR PROFILES TABLE
CREATE TABLE investor_profiles (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE PRIMARY KEY,
  investment_criteria JSONB DEFAULT '{}',
  preferred_stages TEXT[] DEFAULT '{}',
  industries TEXT[] DEFAULT '{}',
  geographies TEXT[] DEFAULT '{}',
  check_size_min INTEGER,
  check_size_max INTEGER,
  bio TEXT,
  linkedin_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. COMPANY PROFILES TABLE
CREATE TABLE company_profiles (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE PRIMARY KEY,
  company_name TEXT NOT NULL,
  description TEXT,
  industry TEXT,
  stage TEXT,
  geography TEXT,
  fundraising_status TEXT CHECK (fundraising_status IN ('preparing', 'starting', 'closing', 'closed')),
  pitch_deck_url TEXT,
  website TEXT,
  funding_target TEXT,
  logo_emoji TEXT DEFAULT '🚀',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. TRIBES TABLE
CREATE TABLE tribes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('accelerator', 'university', 'company', 'geographic', 'industry', 'angel_group', 'family_office', 'hnwi', 'vc_platform')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. TRIBE MEMBERSHIPS TABLE
CREATE TABLE tribe_memberships (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  tribe_id UUID REFERENCES tribes(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (user_id, tribe_id)
);

-- 9. TRACKING TABLE
CREATE TABLE tracking (
  investor_id UUID REFERENCES users(id) ON DELETE CASCADE,
  company_id UUID REFERENCES users(id) ON DELETE CASCADE,
  tracked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (investor_id, company_id)
);

-- 10. KNOCKS TABLE
CREATE TABLE knocks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  investor_id UUID REFERENCES users(id) ON DELETE CASCADE,
  company_id UUID REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'declined')) DEFAULT 'pending',
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 11. UPDATES SYSTEM TABLES
CREATE TABLE company_updates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('major', 'minor', 'coolsies')),
  metrics JSONB DEFAULT '{}',
  email_sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Additional indexes for performance
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_investor_profiles_stages ON investor_profiles USING GIN(preferred_stages);
CREATE INDEX idx_investor_profiles_industries ON investor_profiles USING GIN(industries);
CREATE INDEX idx_investor_profiles_geographies ON investor_profiles USING GIN(geographies);
CREATE INDEX idx_company_profiles_status ON company_profiles(fundraising_status);
CREATE INDEX idx_company_profiles_stage ON company_profiles(stage);
CREATE INDEX idx_company_profiles_industry ON company_profiles(industry);
CREATE INDEX idx_tribes_type ON tribes(type);
CREATE INDEX idx_tribes_active ON tribes(is_active);
CREATE INDEX idx_tracking_investor ON tracking(investor_id);
CREATE INDEX idx_tracking_company ON tracking(company_id);
CREATE INDEX idx_knocks_investor ON knocks(investor_id);
CREATE INDEX idx_knocks_company ON knocks(company_id);
CREATE INDEX idx_knocks_status ON knocks(status);
CREATE INDEX idx_company_updates_company ON company_updates(company_id);
CREATE INDEX idx_company_updates_type ON company_updates(type);

-- Updated at triggers for new tables
CREATE TRIGGER update_users_updated_at 
  BEFORE UPDATE ON users 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_investor_profiles_updated_at 
  BEFORE UPDATE ON investor_profiles 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_company_profiles_updated_at 
  BEFORE UPDATE ON company_profiles 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_knocks_updated_at 
  BEFORE UPDATE ON knocks 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS policies for new tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE investor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tribes ENABLE ROW LEVEL SECURITY;
ALTER TABLE tribe_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE knocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_updates ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies (can be refined later)
CREATE POLICY "Users can read their own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Investor profiles are readable by authenticated users" ON investor_profiles
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Investors can manage their own profile" ON investor_profiles
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Company profiles are readable by authenticated users" ON company_profiles
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Founders can manage their own company profile" ON company_profiles
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Tribes are readable by all authenticated users" ON tribes
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can manage their own tribe memberships" ON tribe_memberships
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Tracking is readable by involved parties" ON tracking
  FOR SELECT USING (auth.uid() = investor_id OR auth.uid() = company_id);

CREATE POLICY "Investors can manage their own tracking" ON tracking
  FOR ALL USING (auth.uid() = investor_id);

CREATE POLICY "Knocks are readable by involved parties" ON knocks
  FOR SELECT USING (auth.uid() = investor_id OR auth.uid() = company_id);

CREATE POLICY "Investors can create knocks" ON knocks
  FOR INSERT WITH CHECK (auth.uid() = investor_id);

CREATE POLICY "Founders can update knock status" ON knocks
  FOR UPDATE USING (auth.uid() = company_id);

CREATE POLICY "Company updates are readable by authenticated users" ON company_updates
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Founders can manage their own updates" ON company_updates
  FOR ALL USING (auth.uid() = company_id);

-- INSERT DEFAULT TRIBES
INSERT INTO tribes (name, description, type) VALUES
('Y Combinator', 'Y Combinator alumni network', 'accelerator'),
('Stanford Alumni', 'Stanford University alumni network', 'university'),
('Ex-Google', 'Former Google employees network', 'company'),
('MIT Network', 'Massachusetts Institute of Technology alumni', 'university'),
('Techstars', 'Techstars accelerator alumni', 'accelerator'),
('Bay Area Angels', 'San Francisco Bay Area angel investor group', 'angel_group');

-- INSERT DEMO MONTHLY UPDATE (optional)
INSERT INTO monthly_updates (
  founder_id, 
  title, 
  headline_metrics, 
  key_wins, 
  challenges_asks, 
  fundraising_status
) VALUES (
  'demo-founder-123',
  'December 2024 Progress Update',
  '{"Users": "2,800 (+12% MoM)", "MRR": "$140K (+12% MoM)", "Retention": "94% (↑2%)", "Growth Rate": "+40% MoM"}',
  ARRAY[
    'Closed partnership with Microsoft for enterprise distribution',
    'Hired VP of Sales (ex-Salesforce) to scale go-to-market', 
    'Launched AI-powered automation features - 40% increase in user engagement'
  ],
  ARRAY[
    'Looking for enterprise security expert for advisor role',
    'Seeking warm intros to Fortune 500 CTOs for pilot programs'
  ],
  'Actively raising Series A'
);
