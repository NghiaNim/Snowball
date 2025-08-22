# Admin Login Testing Guide

## 🚀 Quick Start

1. **Start the server**:
   ```bash
   npm run dev
   ```

2. **Visit the admin page**:
   ```
   http://localhost:3000/admin
   ```

3. **Login credentials**:
   ```
   Username: admin
   Password: snowball123
   ```

## 🔧 How It Works

### Admin Authentication Flow
1. **Login Page** (`/admin`):
   - Hard-coded credentials stored in `.env.local`
   - Uses tRPC for type-safe API calls
   - Stores session token in localStorage

2. **Admin Dashboard** (`/admin/dashboard`):
   - Protected route that checks for session token
   - Redirects to login if not authenticated
   - Full referral link generator interface

### Technical Implementation
- **tRPC API**: `/api/trpc/admin.login`
- **Environment Variables**: `ADMIN_USERNAME` and `ADMIN_PASSWORD`
- **Session Management**: Simple localStorage token for MVP
- **Type Safety**: Full TypeScript integration with Zod validation

## 🎯 Test the Complete Flow

### Step 1: Admin Login
- Go to http://localhost:3000/admin
- Enter credentials: `admin / snowball123`
- Should redirect to dashboard

### Step 2: Generate Referral Links
- Create a custom welcome message
- Select a background color
- Click "Generate Referral Links"
- Copy the generated investor or founder links

### Step 3: Test Referral Signup
- Open generated link in new tab
- See custom welcome message and background color
- Complete the fake signup flow
- Land on appropriate dashboard (investor/founder)

## 🐛 Troubleshooting

### Admin Login Not Working?
1. **Check Console**: Open browser dev tools for JavaScript errors
2. **Verify Environment**: Ensure `.env.local` has admin credentials
3. **Test API**: Visit http://localhost:3000/api/trpc to see if tRPC is responding
4. **Clear Storage**: Clear browser localStorage and try again

### tRPC Errors?
1. **Check Server**: Ensure dev server is running with `npm run dev`
2. **Network Tab**: Check browser network tab for API call failures
3. **Environment**: Verify `NEXT_PUBLIC_APP_URL=http://localhost:3000` in `.env.local`

## ⚡ Performance Notes

### Turbopack Benefits
- **Faster Builds**: ~3x faster than Webpack
- **Better HMR**: Instant hot module replacement
- **Optimized Bundle**: Smaller JavaScript bundles
- **No Webpack Warning**: Eliminates the 108kiB serialization warning

### Current Setup
- **Default**: `npm run dev` uses Turbopack
- **Fallback**: `npm run dev:webpack` if needed
- **Build**: Both Turbopack and Webpack options available

## 🎉 Demo Ready!

The admin system is fully functional with:
- ✅ **Turbopack Integration**: Fast development builds
- ✅ **Admin Authentication**: Working login system
- ✅ **Referral Generator**: Custom link creation
- ✅ **Type Safety**: Full tRPC + TypeScript integration
- ✅ **Sample Data**: Rich demo dashboards
- ✅ **Error Handling**: Proper user feedback
- ✅ **shadcn/ui Design**: Professional, accessible interface
- ✅ **Text Visibility**: Fixed contrast and readability issues

### 🎨 **UI Improvements**
- **Modern Design**: Card-based layouts with proper spacing
- **Readable Text**: Dark text on white backgrounds
- **Professional Components**: shadcn/ui integration
- **Responsive**: Works perfectly on all screen sizes
- **Accessible**: Proper contrast ratios and keyboard navigation

Your Snowball admin panel is ready for demonstration! 🚀
