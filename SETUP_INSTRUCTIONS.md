# 🔧 Immediate Setup Instructions

## Step 1: Set Up Your Supabase Database

**You need to do this now to fix the referral links:**

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

## Step 2: Test Locally

```bash
# Make sure your dev server is running
npm run dev

# Test the admin panel
# Go to: http://localhost:3000/admin
# Login: admin / snowball123
# Generate referral links and test them
```

## Step 3: Deploy to joinsnowball.io

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

## What's Fixed Now:

✅ **Referral Links**: Now stored in Supabase database instead of memory  
✅ **Persistent Storage**: Links survive server restarts  
✅ **Database Schema**: Proper tables with indexes and policies  
✅ **Button Cursors**: All buttons now show pointer cursor on hover  
✅ **Deployment Ready**: Complete configuration for production  

## Next Steps:

1. **Run the SQL** in your Supabase dashboard (Step 1 above)
2. **Test locally** to make sure referral links work
3. **Deploy to Vercel** when ready
4. **Set up your domain** (joinsnowball.io)

Let me know when you've completed Step 1 and I can help with any issues! 🚀
