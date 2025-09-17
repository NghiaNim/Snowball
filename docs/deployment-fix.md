# 🔧 Cloud Function Architecture Fix

## Problem Solved
Fixed the `ConnectionRefusedError: [Errno 111] Connection refused` error by completely rearchitecting the cloud function to use direct database connections instead of HTTP callbacks.

## Root Cause Analysis
The original architecture was backwards:
- ❌ **Wrong**: Frontend → Cloud Function → HTTP call back to Frontend API → Supabase
- ✅ **Correct**: Frontend → Cloud Function → Direct Supabase update → Return results

The cloud function was trying to make HTTP requests to the frontend API to update progress, which created localhost connection issues when deployed.

## Solution Applied

### 1. Architectural Redesign
- **Removed HTTP callbacks** - No more calls back to frontend API
- **Added direct Supabase integration** - Cloud function updates database directly
- **Simplified data flow** - Eliminated unnecessary round trips

### 2. Updated Dependencies
- Added `supabase==2.4.0` to requirements.txt
- Added Supabase client initialization with service role key
- Removed dependency on `API_BASE_URL` and HTTP requests

### 3. Database Integration
- Direct Supabase queries for progress updates
- Direct result storage in `query_history` table
- Proper error handling for database operations

## How to Deploy

### Prerequisites
Make sure your `secret/.env.yaml` file contains:
```yaml
NEXT_PUBLIC_SUPABASE_URL: https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
OPENAI_API_KEY: sk-...
```

### Automatic Deployment (Recommended)
The deployment script will automatically read from your existing `.env.yaml`:

```bash
cd cloud-function-python
./deploy.sh
```

That's it! The script will:
- ✅ Read credentials from `secret/.env.yaml`
- ✅ Configure cloud function environment variables
- ✅ Deploy with direct Supabase connection

### Manual Deployment (if .env.yaml not found)
If the script can't find your `.env.yaml` file, it will prompt for credentials manually.

## Expected Results After Fix

### Before Fix ❌
```
ConnectionRefusedError: [Errno 111] Connection refused
HTTPConnectionPool(host='localhost', port=3000): Max retries exceeded
🔄 Attempting progress update to: http://localhost:3000/api/recommendations/query-history
```

### After Fix ✅
```
🔄 Updating query abc123 in Supabase: completed (100%)
✅ Progress update successful
🎯 Search pipeline completed successfully
✅ Successfully updated query abc123 in database
```

## Environment Variables Reference

| Variable | Purpose | Example |
|----------|---------|---------|
| `SUPABASE_URL` | Supabase project URL | `https://abc123.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key for direct DB access | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |
| `OPENAI_API_KEY` | OpenAI API access (optional) | `sk-...` |

## Testing the Fix

1. **Deploy the updated cloud function**:
   ```bash
   cd cloud-function-python
   export SUPABASE_URL="https://your-project.supabase.co"
   export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
   ./deploy.sh
   ```

2. **Test with a query**:
   - Go to your frontend recommendations page  
   - Submit a query
   - Check cloud function logs: `gcloud functions logs read getRecommendationsV2`

3. **Verify direct database updates**:
   - Look for log messages like "✅ Progress update successful"
   - Check your Supabase `query_history` table for real-time updates
   - No more connection refused errors

## Fallback Behavior
If Supabase credentials are not configured:
- Cloud function will still process queries successfully
- Database updates will be disabled (logged as "Supabase not configured")
- No connection errors will occur
- Results will still be returned to the frontend (but not saved to history)

## Architecture Benefits
✅ **Eliminated HTTP callbacks** - No more localhost issues
✅ **Direct database access** - Faster and more reliable
✅ **Simplified debugging** - Clear error messages
✅ **Better performance** - Fewer network round trips

## Monitoring
Check cloud function logs for these indicators:

- ✅ **Success**: `🔄 Updating query abc123 in Supabase: completed (100%)`
- ✅ **Fallback**: `🔍 Database update skipped - Supabase not configured`
- ❌ **Still broken**: `ConnectionRefusedError` (should not occur anymore)

## Support
If you encounter issues:
1. Verify your Supabase credentials are correct
2. Check that the service role key has proper permissions
3. Ensure the `query_history` table exists in your Supabase database
4. Review cloud function logs for detailed error information

The architectural fix eliminates the root cause of localhost connection issues by removing HTTP callbacks entirely.
