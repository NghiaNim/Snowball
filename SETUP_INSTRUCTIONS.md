# 🔧 Snowball MVP Setup Instructions

## Overview

This setup enables the Snowball MVP with:
- ✅ Hardcoded Snowball founder authentication
- ✅ Three types of updates (Major/Minor/Coolsies)
- ✅ Email integration with Resend for major updates
- ✅ Public tracking link for investors
- ✅ Pitch deck upload functionality
- ✅ Complete founder dashboard

## Step 1: Environment Configuration

Create a `.env.local` file in your project root with these variables:

```bash
# Supabase Configuration (for investor database)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Resend Email Configuration (for major updates)
RESEND_API_KEY=your_resend_api_key

# Google Cloud Storage (for pitch deck uploads)
GOOGLE_CLOUD_PROJECT_ID=your_google_cloud_project_id
GOOGLE_CLOUD_STORAGE_BUCKET=snowball-pitch-decks
GOOGLE_CLOUD_KEY_FILE=./path/to/service-account-key.json

# Optional: Stripe (for future payments)
STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
STRIPE_SECRET_KEY=your_stripe_secret_key

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Notes:** 
- If you don't set `RESEND_API_KEY`, the email system will run in demo mode and log emails to the console.
- If you don't set Google Cloud Storage variables, file uploads will run in demo mode with fake URLs.
- See `docs/google-cloud-storage-setup.md` for detailed GCS setup instructions.

## Step 2: Set Up Your Supabase Database

**For investor accounts and tracking (the founder side doesn't need database):**

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Create a new query and paste this SQL:

```sql
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

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_referral_links_token ON referral_links(link_token);
CREATE INDEX IF NOT EXISTS idx_referral_links_expires ON referral_links(expires_at);

-- Create cleanup function
CREATE OR REPLACE FUNCTION cleanup_expired_referral_links()
RETURNS void AS $$
BEGIN
  UPDATE referral_links 
  SET is_active = false 
  WHERE expires_at < NOW() AND is_active = true;
END;
$$ LANGUAGE plpgsql;

-- Enable RLS
ALTER TABLE referral_links ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow reading active referral links" ON referral_links
  FOR SELECT USING (is_active = true AND expires_at > NOW());

CREATE POLICY "Allow inserting referral links" ON referral_links
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow updating referral links" ON referral_links
  FOR UPDATE USING (true);
```

4. Click **Run** to execute the SQL

## Step 3: Test the Snowball MVP

```bash
# Start the development server
npm run dev
```

### Test Snowball Founder Dashboard:
1. **Go to**: http://localhost:3000
2. **Click**: "Snowball Team Login"
3. **Login**: 
   - Username: `snowball`
   - Password: `snowball2024`
4. **Test Features**:
   - Create Major Updates (will send emails if Resend is configured)
   - Create Minor Updates and Coolsies
   - Upload pitch deck (PowerPoint or PDF)
   - View tracking investors
   - Copy unique tracking link

### Test Public Tracking Page:
1. **Go to**: http://localhost:3000/track/snowball
2. **Features**:
   - View Snowball company information
   - See all public updates
   - Track the company (saves to localStorage)
   - View pitch deck tab
   - See team information

### Test Demo Experience:
1. **Demo Home**: http://localhost:3000/demo
2. **Admin Panel**: http://localhost:3000/demo/admin (Sales team access)
3. **Investor Demo**: http://localhost:3000/demo/dashboard/investor (via demo home)
4. **Founder Demo**: http://localhost:3000/demo/dashboard/founder (via demo home)
5. **Demo Signup**: http://localhost:3000/demo/signup (used by referral links)

## Step 4: Deploy to Production

### Quick Vercel Deployment:

1. **Install Vercel CLI**:
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Deploy**:
   ```bash
   vercel --prod
   ```

4. **Set Environment Variables in Vercel**:
   - Go to your Vercel dashboard
   - Select your project → Settings → Environment Variables
   - Add all the variables from your `.env.local` file
   - **Important**: Change `NEXT_PUBLIC_APP_URL` to `https://joinsnowball.io`

5. **Configure Custom Domain**:
   - In Vercel project → Settings → Domains
   - Add `joinsnowball.io` and `www.joinsnowball.io`
   - Follow Vercel's DNS instructions

## Snowball MVP Features Implemented:

### ✅ Founder Dashboard (`/dashboard/snowball`)
- **Hardcoded Authentication**: Username `snowball`, Password `snowball2024`
- **Three Update Types**:
  - **Major Updates**: Investor letters with metrics (sends emails via Resend)
  - **Minor Updates**: Functional/progress updates (no email)
  - **Coolsies**: Tweet-like quick posts
- **Deck Upload**: PowerPoint/PDF upload functionality
- **Investor Tracking**: View list of tracking investors
- **Update Timeline**: Chronological view of all updates

### ✅ Public Tracking Page (`/track/snowball`)
- **Public Access**: No authentication required
- **Company Information**: Overview, metrics, fundraising status
- **Update Feed**: All public updates with type indicators
- **Pitch Deck Tab**: View/download deck
- **Team Information**: Founder profiles
- **Track Button**: Investors can track without account

### ✅ Email Integration
- **Resend Integration**: Major updates automatically email all tracking investors
- **Demo Mode**: Works without API key (logs to console)
- **HTML Templates**: Professional investor update emails with metrics

### ✅ File Storage & Management
- **Google Cloud Storage**: Production-ready file uploads for pitch decks
- **File Validation**: PDF and PowerPoint support with size limits (50MB)
- **Demo Mode**: Works without GCS setup (fake URLs for testing)
- **Public Access**: Investors can view/download decks via public URLs
- **Persistent Storage**: Files survive across sessions and deployments

### ✅ MVP URLs
- **Homepage**: http://localhost:3000 (updated with Snowball login)
- **Founder Login**: http://localhost:3000/auth/founder/signin
- **Founder Dashboard**: http://localhost:3000/dashboard/snowball
- **Public Tracking**: http://localhost:3000/track/snowball
- **Demo Portal**: http://localhost:3000/demo (admin panel, investor/founder demos)
- **Admin Panel**: http://localhost:3000/demo/admin (for demo referral links)

## Next Steps for Full Platform:

1. **Investor Side**: Build investor dashboard that can view tracked companies
2. **Real Database**: Move founder data from hardcoded to database
3. **Authentication**: Implement real founder authentication system
4. **File Storage**: Integrate Supabase Storage for deck uploads
5. **Email Lists**: Create investor email lists and preferences

This MVP validates the core Snowball concept with you as the first founder user! 🚀
