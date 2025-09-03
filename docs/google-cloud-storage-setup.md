# Google Cloud Storage Setup for Pitch Deck Uploads

## Overview

Snowball uses Google Cloud Storage (GCS) to store and serve pitch deck files (PDF and PowerPoint). This guide walks through the complete setup process.

## Step 1: Create Google Cloud Project

1. **Go to Google Cloud Console**: https://console.cloud.google.com/
2. **Create a new project** or select an existing one
3. **Note your Project ID** (you'll need this later)

## Step 2: Enable Cloud Storage API

1. **Navigate to APIs & Services > Library**
2. **Search for "Cloud Storage API"**
3. **Click "Enable"**

## Step 3: Create Storage Bucket

1. **Go to Cloud Storage > Buckets**
2. **Click "Create Bucket"**
3. **Configure bucket settings**:
   - **Name**: `snowball-pitch-decks` (or your preferred name)
   - **Location type**: Region (choose closest to your users)
   - **Storage class**: Standard
   - **Access control**: Uniform (recommended)
   - **Protection tools**: None needed for this use case

## Step 4: Create Service Account

1. **Go to IAM & Admin > Service Accounts**
2. **Click "Create Service Account"**
3. **Fill in details**:
   - **Name**: `snowball-storage-service`
   - **Description**: `Service account for Snowball pitch deck uploads`
4. **Grant roles**:
   - `Storage Object Admin` (for full file management)
   - `Storage Legacy Bucket Writer` (for compatibility)
5. **Click "Done"**

## Step 5: Generate Service Account Key

1. **Click on your service account**
2. **Go to "Keys" tab**
3. **Click "Add Key" > "Create new key"**
4. **Select "JSON" format**
5. **Download the JSON file**
6. **Save it securely** (this contains sensitive credentials)

## Step 6: Set Up Environment Variables

Add these to your `.env.local` file:

```bash
# Google Cloud Storage Configuration
GOOGLE_CLOUD_PROJECT_ID=your-project-id
GOOGLE_CLOUD_STORAGE_BUCKET=snowball-pitch-decks
GOOGLE_CLOUD_KEY_FILE=./path/to/your/service-account-key.json

# Or use the JSON content directly (for production)
GOOGLE_CLOUD_CREDENTIALS='{"type":"service_account","project_id":"your-project-id",...}'
```

## Step 7: Configure Bucket Permissions

### Option A: Public Access (Recommended for MVP)

1. **Go to your bucket in Cloud Console**
2. **Click "Permissions" tab**
3. **Click "Grant Access"**
4. **Add principal**: `allUsers`
5. **Role**: `Storage Object Viewer`
6. **Save**

### Option B: Signed URLs (More Secure)

If you prefer signed URLs for security, the API will automatically generate temporary access URLs.

## Step 8: Production Deployment Setup

### For Vercel Deployment:

1. **Upload service account key** to your project root
2. **Add environment variables** in Vercel dashboard:
   ```
   GOOGLE_CLOUD_PROJECT_ID=your-project-id
   GOOGLE_CLOUD_STORAGE_BUCKET=snowball-pitch-decks
   GOOGLE_CLOUD_KEY_FILE=./service-account-key.json
   ```

### Alternative: Use Environment Variable for Credentials

Instead of a file, you can use the entire JSON content as an environment variable:

```bash
GOOGLE_CLOUD_CREDENTIALS='{"type":"service_account","project_id":"..."}'
```

Then update the Storage initialization in `/src/app/api/upload-deck/route.ts`:

```typescript
const storage = new Storage({
  projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
  credentials: JSON.parse(process.env.GOOGLE_CLOUD_CREDENTIALS || '{}'),
})
```

## Step 9: Test the Setup

1. **Start your development server**: `npm run dev`
2. **Login to Snowball dashboard**: `snowball/snowball2024`
3. **Go to Deck tab**
4. **Upload a test PDF or PowerPoint file**
5. **Verify**:
   - File appears in your GCS bucket
   - "View Deck" button works
   - Public tracking page shows the deck

## Security Considerations

### Production Security:
- Use signed URLs instead of public bucket access
- Implement file size limits (currently 50MB max)
- Add virus scanning for uploaded files
- Use Cloud CDN for better performance
- Set up proper CORS policies

### File Management:
- Files are automatically made public after upload
- Original filename is preserved with timestamp prefix
- Files are stored in `pitch-decks/` folder within bucket

## Troubleshooting

### Common Issues:

1. **"Access denied" errors**:
   - Check service account permissions
   - Verify bucket exists and is accessible
   - Ensure API is enabled

2. **"File not found" errors**:
   - Check bucket name in environment variables
   - Verify file was actually uploaded to GCS

3. **CORS errors in browser**:
   - Configure CORS on your GCS bucket
   - Use signed URLs instead of direct access

### Demo Mode:

If GCS is not configured, the app will run in demo mode:
- Files are not actually uploaded
- Fake URLs are generated for testing
- Console logs show what would happen

## Cost Estimation

### GCS Pricing (rough estimates):
- **Storage**: ~$0.02/GB/month
- **Operations**: ~$0.005/1000 operations
- **Network**: ~$0.12/GB egress

For MVP with ~100 pitch decks (average 5MB each):
- Monthly cost: ~$0.01 storage + minimal operations = **<$1/month**

## Next Steps

1. **Set up the GCS bucket and service account**
2. **Test with a sample file upload**
3. **Deploy to production with environment variables**
4. **Monitor usage and costs in GCS console**

This setup provides a production-ready file storage solution that scales with your platform growth! 🚀
