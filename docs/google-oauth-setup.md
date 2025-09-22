# Google OAuth Setup Guide

## Overview
The recommendations system now supports dual authentication:
- **Admin login**: Hardcoded credentials for internal use
- **Google OAuth**: Supabase-powered Google Sign-In for users

## Required Configuration

### 1. Supabase Dashboard Setup

1. **Go to your Supabase project dashboard**
   - Navigate to Authentication → Providers
   - Enable Google provider

2. **Configure Google OAuth settings**
   - You'll need to set up a Google Cloud Console project
   - Get the Client ID and Client Secret from Google

### 2. Google Cloud Console Setup

1. **Create/Select a Google Cloud Project**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing one

2. **Enable Google+ API**
   - Go to APIs & Services → Library
   - Search for "Google+ API" and enable it

3. **Create OAuth 2.0 credentials**
   - Go to APIs & Services → Credentials
   - Click "Create Credentials" → "OAuth 2.0 Client IDs"
   - Set application type to "Web application"

4. **Configure authorized redirect URIs**
   - Add your Supabase callback URL:
   - Format: `https://[your-project-ref].supabase.co/auth/v1/callback`
   - For local development, also add:
   - `http://localhost:3000/auth/callback` (if needed)

5. **Copy credentials**
   - Copy the Client ID and Client Secret
   - Add them to your Supabase Google provider settings

### 3. Environment Variables

Ensure these are set in your `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Supabase Google Provider Configuration

In your Supabase dashboard:
1. Go to Authentication → Providers → Google
2. Enable the provider
3. Add your Google Client ID
4. Add your Google Client Secret
5. Set redirect URL to: `https://your-domain.com/recommendations/dashboard`

## How It Works

### Authentication Flow
1. **Admin users**: Use hardcoded credentials → stored in localStorage
2. **Regular users**: Click "Sign in with Google" → redirected to Google → back to dashboard

### User Data Storage
- **Admin users**: Stored in localStorage with `type: 'admin'`
- **Google users**: Managed by Supabase with `type: 'google'`

### Dashboard Access
The dashboard checks for both authentication methods:
- Admin: localStorage `production-auth` key
- Google: Supabase session

## Security Notes

1. **Admin credentials** are hardcoded for MVP - consider moving to environment variables
2. **Google OAuth** provides proper authentication for users
3. **Logout** clears both localStorage and Supabase session
4. **Redirect handling** ensures users go to the right dashboard

## Testing

1. **Test admin login**: Use `admin / chief_of_staff_2024`
2. **Test Google login**: Click "Sign in with Google" button
3. **Test logout**: Should work for both authentication types
4. **Test redirect**: Both should redirect to dashboard after login

## Troubleshooting

### Common Issues
1. **"Invalid redirect URI"**: Check Google Cloud Console authorized redirect URIs
2. **"Unauthorized"**: Verify Supabase Google provider is enabled and configured
3. **"No session"**: Check if Supabase environment variables are correct
4. **Infinite redirect**: Check if dashboard authentication logic is working

### Debug Steps
1. Check browser console for errors
2. Verify Supabase environment variables
3. Test Google OAuth configuration in Supabase auth logs
4. Ensure redirect URLs match exactly (including HTTPS vs HTTP)
