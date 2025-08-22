# Deployment Guide for joinsnowball.io

## 🌐 Pre-Deployment Setup

### 1. Database Setup in Supabase

**Run this SQL in your Supabase SQL Editor:**

```sql
-- Copy the contents of scripts/setup-database.sql
-- This creates the referral_links table and all necessary indexes
```

Or navigate to your Supabase project → SQL Editor → Run the script from `scripts/setup-database.sql`

### 2. Environment Variables for Production

Set these in your Vercel dashboard or deployment platform:

```bash
# Supabase Configuration (from your Supabase dashboard)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# App Configuration
NEXT_PUBLIC_APP_URL=https://joinsnowball.io

# Admin Credentials
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your_secure_password_here

# Optional - Email/Monitoring
RESEND_API_KEY=your_resend_key
SENTRY_DSN=your_sentry_dsn

# Optional - Payments (future)
STRIPE_SECRET_KEY=your_stripe_secret
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_public
```

## 🚀 Vercel Deployment

### Option 1: Deploy via Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel --prod
```

### Option 2: Deploy via GitHub Integration

1. **Push to GitHub**: Commit all changes and push to your repository
2. **Connect to Vercel**: Go to vercel.com → Import Project → Connect GitHub
3. **Configure Project**: 
   - Framework Preset: Next.js
   - Build Command: `npm run build`
   - Output Directory: `.next`
4. **Set Environment Variables**: Add all the env vars listed above
5. **Deploy**: Click Deploy

### Option 3: Manual Deployment

1. **Build locally**: `npm run build`
2. **Upload to Vercel**: Use Vercel dashboard to upload the `.next` folder

## 🔧 Domain Configuration

### Setting up joinsnowball.io

1. **Purchase Domain**: Buy `joinsnowball.io` from your domain registrar
2. **DNS Configuration**: Point to Vercel's nameservers or add CNAME records:
   ```
   CNAME: www.joinsnowball.io → cname.vercel-dns.com
   A: joinsnowball.io → 76.76.19.61
   ```
3. **Vercel Domain Setup**:
   - Go to your Vercel project → Settings → Domains
   - Add `joinsnowball.io` and `www.joinsnowball.io`
   - Follow Vercel's verification instructions

## ✅ Deployment Checklist

Before going live, ensure:

- [ ] **Database Migration**: Run the SQL script in Supabase
- [ ] **Environment Variables**: All production env vars are set
- [ ] **Domain Setup**: DNS is properly configured
- [ ] **SSL Certificate**: Vercel automatically provides SSL
- [ ] **Admin Access**: Test admin login with production credentials
- [ ] **Referral Links**: Test the complete referral flow
- [ ] **Mobile Responsive**: Test on various devices

## 🔒 Security Considerations

### Production Security

1. **Change Admin Password**: Use a strong, unique password for production
2. **Environment Variables**: Never commit secrets to Git
3. **Supabase RLS**: Row Level Security is enabled for referral_links table
4. **HTTPS Only**: Vercel automatically redirects HTTP to HTTPS
5. **Security Headers**: Configured in vercel.json

### Monitoring

1. **Supabase Dashboard**: Monitor database usage and API calls
2. **Vercel Analytics**: Track deployment performance
3. **Error Tracking**: Set up Sentry for error monitoring (optional)

## 📊 Post-Deployment Testing

### Test the Complete Flow

1. **Visit**: https://joinsnowball.io
2. **Admin Login**: 
   - Go to `/admin`
   - Login with production credentials
   - Generate referral links
3. **Referral Testing**:
   - Use generated links
   - Test both investor and founder flows
   - Verify custom messages and colors work
4. **Dashboard Testing**:
   - Complete signup flows
   - Test sample dashboards

### Performance Verification

- **Page Load Speed**: Should be under 3 seconds
- **Database Queries**: Check Supabase for query performance
- **Mobile Experience**: Test on various screen sizes

## 🐛 Troubleshooting

### Common Issues

1. **"Referral link not found"**: 
   - Check if database migration ran successfully
   - Verify Supabase connection and credentials

2. **Admin login fails**:
   - Check environment variables are set correctly
   - Verify ADMIN_USERNAME and ADMIN_PASSWORD

3. **Build failures**:
   - Check all TypeScript errors are resolved
   - Verify all dependencies are installed

4. **Domain not working**:
   - DNS changes can take 24-48 hours to propagate
   - Verify CNAME and A records are correct

## 🎉 You're Live!

Once deployed, your Snowball admin panel will be available at:

- **Public Site**: https://joinsnowball.io
- **Admin Panel**: https://joinsnowball.io/admin
- **API**: https://joinsnowball.io/api/trpc

Your professional referral link system is now ready for production use! 🚀
