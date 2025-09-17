# 🔧 Cloud Function Connection Error Fix

## Problem Solved
Fixed the `ConnectionRefusedError: [Errno 111] Connection refused` error that was occurring because the deployed cloud function was trying to connect to `localhost:3000` instead of the production frontend URL.

## Root Cause
The cloud function's `get_api_base_url()` function was hardcoded to always use `localhost:3000`, even in production. When deployed, the cloud function needs to call back to the production frontend API at `/api/recommendations/query-history` to update query progress.

## Solution Applied

### 1. Fixed Cloud Function Logic
- Updated `get_api_base_url()` function to properly detect production vs development environments
- Added graceful handling when no API URL is configured (disables progress updates instead of crashing)
- Added support for `API_BASE_URL` environment variable

### 2. Enhanced Deployment Script
- Updated `deploy.sh` to prompt for frontend URL during deployment
- Added automatic environment variable configuration
- Improved deployment feedback and error handling

## How to Redeploy with Fix

### Quick Fix (Recommended)
Run this command with your production frontend URL:

```bash
cd cloud-function-python

# Replace with your actual Vercel app URL
export API_BASE_URL="https://your-app-name.vercel.app"
./deploy.sh
```

### Manual Deployment
If you prefer to be prompted during deployment:

```bash
cd cloud-function-python
./deploy.sh
```

The script will ask for your frontend URL.

### Finding Your Frontend URL
1. **If using Vercel**: Check your Vercel dashboard for the production URL
2. **If using other platforms**: Use your production domain
3. **For testing**: You can temporarily disable progress updates by not setting any URL

## Expected Results After Fix

### Before Fix ❌
```
ConnectionRefusedError: [Errno 111] Connection refused
HTTPConnectionPool(host='localhost', port=3000): Max retries exceeded
```

### After Fix ✅
```
🔍 Using custom API_BASE_URL: https://your-app.vercel.app
✅ Progress update successful
🎯 Search pipeline completed successfully
```

## Environment Variables Reference

| Variable | Purpose | Example |
|----------|---------|---------|
| `API_BASE_URL` | Frontend URL for progress updates | `https://snowball-app.vercel.app` |
| `OPENAI_API_KEY` | OpenAI API access | `sk-...` |
| `LOCAL_DEVELOPMENT` | Force local mode | `true` or `false` |

## Testing the Fix

1. **Deploy the updated cloud function**:
   ```bash
   cd cloud-function-python
   export API_BASE_URL="https://your-frontend-url.vercel.app"
   ./deploy.sh
   ```

2. **Test with a query**:
   - Go to your frontend recommendations page
   - Submit a query
   - Check cloud function logs: `gcloud functions logs read getRecommendationsV2`

3. **Verify progress updates**:
   - Look for log messages like "✅ Progress update successful"
   - No more connection refused errors

## Fallback Behavior
If no `API_BASE_URL` is configured:
- Cloud function will still process queries successfully
- Progress updates will be disabled (logged as "Progress update skipped")
- No connection errors will occur
- Final results will still be returned to the frontend

## Monitoring
Check cloud function logs for these indicators:

- ✅ **Success**: `🔍 Using custom API_BASE_URL: https://your-app.vercel.app`
- ✅ **Fallback**: `🔍 Progress update skipped - no API URL configured`
- ❌ **Still broken**: `ConnectionRefusedError` or `localhost:3000` references

## Support
If you still see connection errors after redeployment:
1. Verify your `API_BASE_URL` is correct and accessible
2. Check that your frontend is deployed and the `/api/recommendations/query-history` endpoint works
3. Review cloud function logs for detailed error information

The fix ensures your cloud function works reliably in production while maintaining development compatibility.
