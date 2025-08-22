# Troubleshooting Guide

## Development Server Issues

### Turbopack vs Webpack

**Default**: Turbopack is now the default bundler for better performance:
```bash
npm run dev  # Uses Turbopack (faster)
```

**Fallback**: If you encounter Turbopack issues, use Webpack:
```bash
npm run dev:webpack  # Uses standard Webpack bundler
```

**Note**: If you see React Server Components bundler errors, they're usually non-breaking warnings.

### Environment Variables

**Problem**: Admin login not working or tRPC calls failing.

**Solution**: Ensure your `.env.local` file has the correct environment variables:
```bash
# Copy from example
cp .env.example .env.local

# Edit with your values
# At minimum, set:
NEXT_PUBLIC_APP_URL=http://localhost:3000
ADMIN_USERNAME=admin
ADMIN_PASSWORD=snowball123
```

### Build Issues

**Problem**: TypeScript errors during build.

**Solution**: Run type checking separately to debug:
```bash
npm run type-check
npm run lint:check
```

### Missing Dependencies

**Problem**: Import errors or missing modules.

**Solution**: Reinstall dependencies:
```bash
rm -rf node_modules package-lock.json
npm install
```

## Admin Features

### Admin Login Not Working

1. **Check Environment Variables**: Ensure `ADMIN_USERNAME` and `ADMIN_PASSWORD` are set in `.env.local`
2. **Clear Storage**: Clear browser localStorage and try again
3. **Check Console**: Look for JavaScript errors in browser console

### Referral Links Not Working

1. **Check Link Format**: Links should include `?ref=` parameter
2. **Verify Expiration**: Links expire after 24 hours
3. **Test API**: Check if tRPC endpoints are responding at `/api/trpc`

### Signup Flow Issues

1. **Suspense Boundary**: The signup page uses `useSearchParams` which requires Suspense
2. **Session Storage**: Temporary sessions are stored in localStorage
3. **Role Routing**: Ensure the role parameter is correctly passed through the signup flow

## Production Deployment

### Vercel Deployment

```bash
# Build test
npm run build

# Deploy
npx vercel --prod
```

### Environment Variables for Production

Make sure to set these in your deployment platform:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_APP_URL`
- `ADMIN_USERNAME`
- `ADMIN_PASSWORD`
